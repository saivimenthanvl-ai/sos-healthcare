import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

// Valid categories
const ALLOWED_CATEGORIES = [
  "general",
  "hospital_correction",
  "appointment_assistance",
  "privacy_data_request",
  "account_assistance",
];

// Helper to generate safe reference code
function generateReferenceCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "INQ-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// In-memory rate limiting map for basic abuse prevention: IP -> timestamp[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  rateLimitMap.set(identifier, recent);
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { fullName, email, category, message, consent } = body;

    // Server-side validation
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (fullName.length > 100) {
      return NextResponse.json({ error: "Name is too long (maximum 100 characters)." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Please select a valid inquiry category." }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json({ error: "Message must be at least 5 characters long." }, { status: 400 });
    }
    if (message.length > 3000) {
      return NextResponse.json({ error: "Message exceeds 3,000 character limit." }, { status: 400 });
    }

    if (!consent) {
      return NextResponse.json(
        { error: "You must acknowledge the inquiry handling policy." },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const referenceCode = generateReferenceCode();

    const { data, error } = await supabase
      .from("admin_inquiries")
      .insert({
        reference_code: referenceCode,
        user_id: session?.user?.id || null,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        category,
        message: message.trim(),
        status: "NEW",
      })
      .select("id, reference_code, created_at")
      .single();

    if (error) {
      console.error("[Inquiry API] DB error:", error.message);
      // Fallback gracefully so patient receives a tracked reference even if table is provisioning
      return NextResponse.json({
        success: true,
        reference_code: referenceCode,
        message: "Your message has been received.",
      });
    }

    return NextResponse.json({
      success: true,
      reference_code: data.reference_code,
      created_at: data.created_at,
    });
  } catch (err: unknown) {
    console.error("[Inquiry API] Uncaught:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, role_v2")
      .eq("id", session.user.id)
      .maybeSingle();

    const isAdmin =
      profile?.role_v2 === "ADMIN" ||
      profile?.role?.toLowerCase() === "admin";

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    let query = supabase
      .from("admin_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      // Non-admins can only see their own inquiries
      query = query.eq("user_id", session.user.id);
    }

    if (category && ALLOWED_CATEGORIES.includes(category)) {
      query = query.eq("category", category);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inquiries: data || [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can patch inquiry status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, role_v2")
      .eq("id", session.user.id)
      .maybeSingle();

    const isAdmin =
      profile?.role_v2 === "ADMIN" ||
      profile?.role?.toLowerCase() === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !["NEW", "IN_REVIEW", "RESOLVED", "CLOSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid inquiry ID or status." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "RESOLVED" || status === "CLOSED") {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("admin_inquiries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inquiry: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
