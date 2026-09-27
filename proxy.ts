


import arcjet, { createMiddleware, detectBot } from "@arcjet/next";
import { env } from "./lib/env";
import { NextRequest, NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

const aj = arcjet({
  key: env.ARCJET_KEY!,
  rules: [
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:MONITOR",
        "CATEGORY:PREVIEW",
        "STRIPE_WEBHOOK",
      ],
    }),
  ],
});

function isPublicRoute(pathname: string) {
  return (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/session") ||
    pathname === "/verify-email-notice" ||
    pathname === "/verify-request" ||
    pathname === "/application-under-review"
  );
}

async function handleRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Public routes pass through.
   */
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  /*
   * IMPORTANT:
   *
   * Middleware does NOT perform authentication or role redirects.
   *
   * In particular, do NOT do:
   *
   *   /admin -> /dashboard
   *   /dashboard -> /admin
   *   /admin -> /
   *   /dashboard -> /
   *
   * AdminLayout and DashboardLayout are responsible for
   * authentication and authorization.
   */

  return NextResponse.next();
}

export default isProduction
  ? createMiddleware(aj, handleRequest)
  : handleRequest;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};