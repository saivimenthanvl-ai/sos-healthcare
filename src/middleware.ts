import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient({
    getAll: () => req.cookies.getAll(),
    setAll: (cookies) => {
      cookies.forEach(({ name, value, options }) => {
        res.cookies.set(name, value, options);
      });
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public routes — no auth required
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/confirm",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/api/auth",
    "/api/health",
    "/privacy-policy",
    "/terms-of-service",
    "/contact",
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith("/_next")
  );

  // Redirect unauthenticated users away from protected pages
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL("/auth/login", req.url);
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (session && (req.nextUrl.pathname === "/auth/login" || req.nextUrl.pathname === "/auth/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
