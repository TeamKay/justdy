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

  // Learner
  if (pathname.startsWith("/learner")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));

    if (userRole !== "learner") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
});
