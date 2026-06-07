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

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const userRole = session?.user?.role?.toLowerCase();

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

  // // 🔒 Profile View & Booking Restriction
  // // Catches '/educators/some-id' but ignores the main dashboard route ('/educators')
  // if (pathname.startsWith("/educators") && pathname !== "/educators") {
  //   // 1. Force authentication for anyone trying to view profiles or book
  //   if (!session) {
  //     // Optional: Pass the original path as a redirect parameter so they return here after logging in
  //     const loginUrl = new URL("/login", request.url);
  //     loginUrl.searchParams.set("callbackUrl", pathname);
  //     return NextResponse.redirect(loginUrl);
  //   }

  //   // 2. Restrict booking steps or individual profiles strictly to students if required
  //   // (Remove or modify this sub-check if other roles like admins are allowed to view profile pages)
  //   if (userRole !== "student" && userRole !== "admin") {
  //     return NextResponse.redirect(new URL("/", request.url));
  //   }
  // }

  return NextResponse.next();
});
