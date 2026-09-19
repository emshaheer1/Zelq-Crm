import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_HOLD_COOKIE, SESSION_COOKIE } from "@/lib/constants";

const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  if (!hasSession && !isPublic && pathname !== "/") {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (hasSession && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    hasSession &&
    pathname === "/login" &&
    request.nextUrl.searchParams.get("preview") !== "1" &&
    !request.cookies.get(AUTH_HOLD_COOKIE)?.value
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
