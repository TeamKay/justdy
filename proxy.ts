import arcjet, { createMiddleware, detectBot } from "@arcjet/next";
import { env } from "./lib/env";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

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

export default createMiddleware(aj, async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Prevent auth recursion
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/session")) {
    return NextResponse.next();
  }

  if (
    pathname === "/verify-email-notice" ||
    pathname === "/application-under-review"
  ) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const user = session?.user;
  const userRole = user?.role?.toLowerCase();

  // 2. Global Guards for Logged-In Users
  if (session && user) {
    // 🛡️ Guard A: Email Verification Check
    if (!user.emailVerified) {
      // Exclude admin from being forced to verify email if you wish, or enforce globally
      return NextResponse.redirect(
        new URL("/verify-email-notice", request.url),
      );
    }

    // 🛡️ Guard B: Educator Under-Review Check
    // Prevents pending educators from viewing any pages besides their notice route
    if (userRole === "educator" && user.verificationStatus === "Pending") {
      // Ensure they can't access /educator or /dashboard while pending
      if (
        pathname.startsWith("/educator") ||
        pathname.startsWith("/dashboard")
      ) {
        return NextResponse.redirect(
          new URL("/application-under-review", request.url),
        );
      }
    }
  }

  // 🔒 Admin Protected Routes
  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 🔒 Educator Protected Routes
  if (pathname.startsWith("/educator/") || pathname === "/educator") {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    if (userRole !== "educator") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
});
