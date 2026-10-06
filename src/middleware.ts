import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  /*
   * IMPORTANT:
   * Public static files must bypass authentication middleware.
   *
   * Google Search Console verification files are requested directly by
   * Googlebot. Redirecting them to /auth/login causes ownership
   * verification to fail with "wrong content".
   */
  if (
    pathname === "/google9c100e40d621bbcb.html" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/")
  ) {
    return NextResponse.next();
  }

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
    data: { user },
  } = await supabase.auth.getUser();

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
    (route) =>
      pathname === route ||
      pathname.startsWith("/_next")
  );

  /*
   * Unauthenticated users can only access public routes.
   */
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL("/auth/login", req.url);

    redirectUrl.searchParams.set(
      "redirect",
      pathname
    );

    return NextResponse.redirect(redirectUrl);
  }

  /*
   * Logged-in users do not need login/signup pages.
   */
  if (
    user &&
    (
      pathname === "/auth/login" ||
      pathname === "/auth/signup"
    )
  ) {
    return NextResponse.redirect(
      new URL("/", req.url)
    );
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Skip:
     * - API routes
     * - Next.js static assets
     * - image optimizer
     * - favicon
     * - files with common public/static extensions
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|html)$).*)",
  ],
};
