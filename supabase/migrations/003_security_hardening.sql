-- ============================================================
-- Migration 003 — Security hardening
-- Fixes RLS coverage, role separation, emergency integrity,
-- wearable credential exposure, and operational data access.
-- ============================================================

-- 1. Ensure RLS is actually enabled on every patient/operational table.
alter table public.profiles enable row level security;
alter table public.emergencies enable row level security;
alter table public.user_locations enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.ambulance_locations enable row level security;
alter table public.ambulances enable row level security;
alter table public.hospitals enable row level security;

-- FORCE RLS for app-facing tables so table owners cannot accidentally bypass
-- policy checks through ordinary application paths.
alter table public.profiles force row level security;
alter table public.emergencies force row level security;
alter table public.user_locations force row level security;
alter table public.emergency_contacts force row level security;
alter table public.ambulance_locations force row level security;

-- 2. Keep operational roles distinct from ADMIN.
alter type public.app_role add value if not exists 'PARAMEDIC';
alter type public.app_role add value if not exists 'DISPATCHER';

update public.profiles
set role_v2 = case
  when upper(role::text) = 'PARAMEDIC' then 'PARAMEDIC'::public.app_role
  when upper(role::text) = 'DISPATCHER' then 'DISPATCHER'::public.app_role
  when upper(role::text) = 'DOCTOR' then 'DOCTOR'::public.app_role
  when upper(role::text) = 'ADMIN' then 'ADMIN'::public.app_role
  else 'PATIENT'::public.app_role
end;

create or replace function public.get_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role_v2::text from public.profiles where id = auth.uid()),
    'PATIENT'
  );
$$;

create or replace function public.is_emergency_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_current_role() in ('PARAMEDIC', 'DISPATCHER');
$$;

grant execute on function public.get_current_role() to authenticated;
grant execute on function public.is_emergency_staff() to authenticated;

-- 3. Profiles: browser users only read/update their own row.
-- Doctors use patient_profiles/health_records through explicit policies.
drop policy if exists "Staff can view profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Prevent self-service privilege escalation through profile updates.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id then
    if new.role is distinct from old.role
       or new.role_v2 is distinct from old.role_v2
       or new.ambulance_id is distinct from old.ambulance_id then
      raise exception 'Role and staff assignment fields cannot be changed by the account owner';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_privilege_escalation on public.profiles;
create trigger trg_prevent_profile_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

-- 4. Emergencies: patients create/read their own. Staff handle dispatch.
drop policy if exists "Users can view own emergencies" on public.emergencies;
create policy "Users can view own emergencies"
on public.emergencies
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert emergencies" on public.emergencies;
create policy "Users can insert emergencies"
on public.emergencies
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and assigned_ambulance_id is null
);

drop policy if exists "Users can update own emergencies" on public.emergencies;
create policy "Users may cancel own active emergency"
on public.emergencies
for update
to authenticated
using (auth.uid() = user_id and status in ('pending','dispatched','en_route'))
with check (auth.uid() = user_id and status = 'cancelled');

drop policy if exists "Staff can view all emergencies" on public.emergencies;
create policy "Emergency staff can view emergencies"
on public.emergencies
for select
to authenticated
using (public.is_emergency_staff());

drop policy if exists "Staff can update emergencies" on public.emergencies;
create policy "Emergency staff can update emergencies"
on public.emergencies
for update
to authenticated
using (public.is_emergency_staff())
with check (public.is_emergency_staff());

-- Reject direct patient tampering with dispatch-controlled fields.
create or replace function public.enforce_emergency_update_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.user_id and not public.is_emergency_staff() then
    if new.user_id is distinct from old.user_id
       or new.latitude is distinct from old.latitude
       or new.longitude is distinct from old.longitude
       or new.address is distinct from old.address
       or new.description is distinct from old.description
       or new.assigned_ambulance_id is distinct from old.assigned_ambulance_id
       or new.assigned_hospital_id is distinct from old.assigned_hospital_id
       or new.eta_minutes is distinct from old.eta_minutes
       or new.status <> 'cancelled' then
      raise exception 'Patients may only cancel their own active emergency';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_emergency_update_integrity on public.emergencies;
create trigger trg_emergency_update_integrity
before update on public.emergencies
for each row execute function public.enforce_emergency_update_integrity();

-- 5. Location data: remove broad staff/public visibility.
drop policy if exists "Staff can view user locations" on public.user_locations;
drop policy if exists "Users can view own locations" on public.user_locations;
create policy "Users can view own locations"
on public.user_locations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own locations" on public.user_locations;
create policy "Users can insert own locations"
on public.user_locations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Assigned emergency staff can view patient locations"
on public.user_locations
for select
to authenticated
using (
  public.is_emergency_staff()
  and exists (
    select 1
    from public.emergencies e
    where e.user_id = user_locations.user_id
      and e.status in ('pending','dispatched','en_route','arrived')
  )
);

-- 6. Ambulances and ambulance pings are no longer public.
drop policy if exists "Everyone can read ambulances" on public.ambulances;
create policy "Emergency staff can read ambulances"
on public.ambulances
for select
to authenticated
using (public.is_emergency_staff());

create policy "Patients can read assigned ambulance"
on public.ambulances
for select
to authenticated
using (
  exists (
    select 1 from public.emergencies e
    where e.user_id = auth.uid()
      and e.assigned_ambulance_id = ambulances.id
      and e.status in ('dispatched','en_route','arrived')
  )
);

drop policy if exists "Ambulance locations are publicly readable" on public.ambulance_locations;
create policy "Emergency staff can read ambulance locations"
on public.ambulance_locations
for select
to authenticated
using (public.is_emergency_staff());

create policy "Patients can read assigned ambulance locations"
on public.ambulance_locations
for select
to authenticated
using (
  exists (
    select 1 from public.emergencies e
    where e.user_id = auth.uid()
      and e.assigned_ambulance_id = ambulance_locations.ambulance_id
      and e.status in ('dispatched','en_route','arrived')
  )
);

-- 7. Device connections: browser can see safe metadata only; writes are backend-only.
drop policy if exists "Users manage own devices" on public.device_connections;
drop policy if exists "Users can view own device connections" on public.device_connections;
create policy "Users can view own device connections"
on public.device_connections
for select
to authenticated
using (auth.uid() = user_id);

-- 8. Remove legacy plaintext wearable tokens from profiles.
-- Provider OAuth tokens belong in backend-only encrypted storage.
alter table public.profiles drop column if exists fitbit_access_token;
alter table public.profiles drop column if exists fitbit_refresh_token;
alter table public.profiles drop column if exists fitbit_token_expires_at;
alter table public.profiles drop column if exists fitbit_user_id;

-- 9. Audit logs are never directly readable/writable by normal browser clients.
revoke all on public.audit_logs from anon, authenticated;

-- 10. Helpful indexes for authorization predicates.
create index if not exists idx_emergencies_assigned_ambulance
  on public.emergencies(assigned_ambulance_id);
create index if not exists idx_emergencies_active_user
  on public.emergencies(user_id, status);
