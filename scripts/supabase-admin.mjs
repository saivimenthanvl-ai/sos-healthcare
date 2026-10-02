#!/usr/bin/env node
/**
 * Supabase schema admin.
 *
 * Applies the SQL files in order and verifies the result via the Management
 * API's /database/query endpoint, which runs arbitrary SQL as the postgres
 * role. That is the only way to apply DDL — the service role key bypasses
 * RLS for data, but cannot CREATE/ALTER anything.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/supabase-admin.mjs apply
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/supabase-admin.mjs verify
 *
 * The project ref is read from NEXT_PUBLIC_SUPABASE_URL.
 *
 * The access token is only ever sent in an Authorization header and is never
 * logged. It can manage every project on the account — revoke it afterwards.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const DB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!TOKEN) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN.\n" +
      "Create one at https://supabase.com/dashboard/account/tokens\n" +
      "Token name it `sos-healthcare-migrations` and revoke it when done."
  );
  process.exit(1);
}

if (!DB_URL) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL. Put it in .env.local or pass it inline."
  );
  process.exit(1);
}

// https://<ref>.supabase.co  ->  <ref>
const PROJECT_REF = DB_URL.replace(/^https?:\/\//, "").split(".")[0];

const API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function query(sql) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 600)}`);
  }

  return res.json();
}

// Order matters: schema.sql creates the enums and tables that the migration
// and the seeds depend on.
const FILES = [
  "supabase/schema.sql",
  "supabase/migrations/001_roles_and_dispatch.sql",
  "scripts/seed-hospitals.sql",
  "scripts/seed-ambulances.sql",
];

async function apply() {
  console.log(`Project ref: ${PROJECT_REF}\n`);

  for (const file of FILES) {
    const sql = await readFile(join(ROOT, file), "utf8");
    process.stdout.write(`Applying ${file} ... `);
    try {
      await query(sql);
      console.log("ok");
    } catch (error) {
      console.log("FAILED");
      console.error(`\n${error.message}\n`);
      process.exit(1);
    }
  }
  console.log("\nAll files applied.");
}

async function verify() {
  const checks = [];

  const add = (name, sql, expect) => {
    checks.push({ name, sql, expect });
  };

  add("tables exist", `
    select string_agg(expected, ', ' order by expected) as missing
    from unnest(array[
      'profiles','hospitals','ambulances','emergencies',
      'user_locations','emergency_contacts','ambulance_locations'
    ]) as expected
    where not exists (
      select 1 from information_schema.tables
      where table_schema='public' and table_name=expected
    )`, "no rows");

  add("user_role enum", `
    select string_agg(e.enumlabel, ',' order by e.enumlabel) as labels
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'user_role'`, "dispatcher,paramedic,patient");

  add("profiles.role column", `
    select format_type(a.atttypid, a.atttypmod) as type
    from pg_attribute a
    where a.attrelid = 'public.profiles'::regclass
      and a.attname = 'role' and a.attnum > 0 and not a.attisdropped`,
    "user_role");

  add("profiles.ambulance_id column", `
    select format_type(a.atttypid, a.atttypmod) as type
    from pg_attribute a
    where a.attrelid = 'public.profiles'::regclass
      and a.attname = 'ambulance_id' and a.attnum > 0 and not a.attisdropped`,
    "uuid");

  add("staff can view emergencies", `
    select count(*)::int as n from pg_policies
    where schemaname='public' and tablename='emergencies'
      and policyname='Staff can view all emergencies'`, "1");

  add("paramedic ambulance policy", `
    select count(*)::int as n from pg_policies
    where schemaname='public' and tablename='ambulances'
      and policyname='Paramedics can update their ambulance'`, "1");

  add(
    "realtime publication",
    `select string_agg(tablename, ',' order by tablename) as tables
     from pg_publication_tables
     where pubname='supabase_realtime'
       and tablename in ('ambulances','emergencies','ambulance_locations')`,
    "ambulance_locations,ambulances,emergencies"
  );

  add("signup trigger", `
    select count(*)::int as n from pg_trigger
    where tgname='on_auth_user_created' and not tgisinternal`, "1");

  add("hospital seed", `select count(*)::int as n from public.hospitals`, "many");
  add("ambulance seed", `select count(*)::int as n from public.ambulances`, "5");

  add("role distribution", `
    select role::text || '=' || count(*)::text as line
    from public.profiles group by role order by role::text`, "roles");

  let failures = 0;

  for (const { name, sql, expect } of checks) {
    let value;
    try {
      const result = await query(sql);
      value = result?.[0] ? Object.values(result[0])[0] : null;
    } catch (error) {
      console.log(`  FAIL  ${name}\n        ${error.message.slice(0, 200)}`);
      failures++;
      continue;
    }

    const text = value == null ? "(none)" : String(value);

    // "many"/"roles" are informational; only exact strings are asserted.
    const ok =
      expect === "many" || expect === "roles"
        ? true
        : text.trim().toLowerCase() === expect.toLowerCase();

    if (!ok) failures++;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${name.padEnd(30)} ${text}`);
  }

  console.log(
    failures === 0
      ? "\nAll checks passed."
      : `\n${failures} check(s) failed.`
  );
  process.exit(failures === 0 ? 0 : 1);
}

const command = process.argv[2];

if (command === "apply") {
  await apply();
} else if (command === "verify") {
  await verify();
} else {
  console.error("Usage: node scripts/supabase-admin.mjs <apply|verify>");
  process.exit(1);
}