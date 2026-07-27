import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "lesextras_admin_token";
const FRONT_SESSION_COOKIE = "lesextras_session";
const FRONT_RUNTIME = "front";
const DESK_RUNTIME = "desk";
type AppRuntime = typeof FRONT_RUNTIME | typeof DESK_RUNTIME;

/** Routes that require an authenticated front-user session */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/wizard",
  "/settings",
  "/marketplace",
  "/missions",
  "/bookings",
  "/account",
  "/messages",
  "/freelances",
];

/** Routes that guests can access (login, register, password reset) */
const AUTH_PAGES = ["/login", "/register", "/auth/forgot-password", "/auth/reset-password"];

function getAppRuntime(): AppRuntime {
  const runtime = (process.env.APP_RUNTIME ?? FRONT_RUNTIME).toLowerCase();
  return runtime === DESK_RUNTIME ? DESK_RUNTIME : FRONT_RUNTIME;
}

async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.role === "ADMIN";
  } catch {
    return false;
  }
}

async function hasValidFrontSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(FRONT_SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const runtime = getAppRuntime();
  const pathname = request.nextUrl.pathname;
  const isHealthPath = pathname === "/health";
  const isRuntimeHealthPath = pathname === "/api/runtime-health";
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLoginPath = pathname === "/admin/login";

  if (isHealthPath || isRuntimeHealthPath) {
    return NextResponse.next();
  }

  // ── Front runtime ──────────────────────────────────────────────
  if (runtime === FRONT_RUNTIME) {
    // Block admin routes on the front runtime
    if (isAdminPath) {
      return NextResponse.redirect(new URL("/marketplace", request.url));
    }

    const isProtected = PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
    );
    const isAuthPage = AUTH_PAGES.some(
      (page) => pathname === page || pathname.startsWith(page + "/"),
    );
    const hasSession = await hasValidFrontSession(request);

    // Redirect unauthenticated users away from protected pages
    if (isProtected && !hasSession) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages (login/register)
    if (isAuthPage && hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // ── Desk runtime (admin) ───────────────────────────────────────
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!isAdminPath) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isAdminLoginPath) {
    const isValidSession = await hasValidAdminSession(request);
    if (isValidSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  const isValidSession = await hasValidAdminSession(request);
  if (!isValidSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
