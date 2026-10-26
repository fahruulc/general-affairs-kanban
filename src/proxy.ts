import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and Next.js internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Auth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = await auth();
  const isAuthenticated = !!session?.user;
  const isLoginPage = pathname === "/login";
  const isChangePasswordPage = pathname === "/change-password";

  // 1. Not authenticated
  if (!isAuthenticated) {
    if (isLoginPage) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    if (!isChangePasswordPage) {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user accessing /login -> redirect to appropriate home
  if (isLoginPage) {
    const role = (session.user as any)?.role;
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (role === "OFFICER") {
      return NextResponse.redirect(new URL("/board", request.url));
    }
    return NextResponse.redirect(new URL("/reports", request.url));
  }

  // 3. Mandatory password change (FR-AUTH-03)
  const mustChangePassword = (session.user as any)?.mustChangePassword;
  if (mustChangePassword && !isChangePasswordPage) {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }
  if (!mustChangePassword && isChangePasswordPage) {
    const role = (session.user as any)?.role;
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (role === "OFFICER") {
      return NextResponse.redirect(new URL("/board", request.url));
    }
    return NextResponse.redirect(new URL("/reports", request.url));
  }

  // 4. Role based coarse protection
  const userRole = (session.user as any)?.role;
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/reports", request.url));
    }
  }

  if (pathname.startsWith("/board")) {
    if (userRole !== "ADMIN" && userRole !== "OFFICER") {
      return NextResponse.redirect(new URL("/reports", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
