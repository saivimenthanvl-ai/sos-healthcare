import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * Authentication middleware only runs for routes that actually require a
 * signed-in user. Public files such as /robots.txt, /sitemap.xml and Google
 * verification files never enter this middleware at all.
 */
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
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL("/auth/login", req.url);
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/emergency/:path*",
    "/appointments/:path*",
    "/admin/:path*",
    "/doctor/:path*",
    "/dispatch/:path*",
    "/devices/:path*",
  ],
};
