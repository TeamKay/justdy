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

  // 🔒 Admin
  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 🔒 Educator ONLY
  if (pathname.startsWith("/educator/") || pathname === "/educator") {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    if (userRole !== "educator") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 🔒 Student ONLY
  if (pathname.startsWith("/educators")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    if (userRole !== "student") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
});

// export default createMiddleware(aj, async (request: NextRequest) => {
//   const { pathname } = request.nextUrl;
//   const session = getSessionCookie(request);
//   const userRole = request.cookies.get("role")?.value?.toLowerCase();

//   // Protect Admin Routes
//   if (pathname.startsWith("/admin")) {
//     if (!session) return NextResponse.redirect(new URL("/login", request.url));
//     if (userRole !== "admin")
//       return NextResponse.redirect(new URL("/admin", request.url));
//   }

//   if (pathname.startsWith("/educator")) {
//     if (!session) return NextResponse.redirect(new URL("/login", request.url));

//     // allow both educator AND student
//     if (userRole !== "educator" && userRole !== "student") {
//       return NextResponse.redirect(new URL("/", request.url));
//     }
//   }

//   // // Protect Educator Routes
//   if (pathname.startsWith("/educator")) {
//     if (!session) return NextResponse.redirect(new URL("/login", request.url));
//     if (userRole !== "educator")
//       return NextResponse.redirect(new URL("/", request.url));
//   }

//   // Protect Student Routes
//   if (pathname.startsWith("/educators")) {
//     if (!session) return NextResponse.redirect(new URL("/login", request.url));
//     if (userRole !== "student") {
//       return NextResponse.redirect(new URL("/", request.url));
//     }
//   }

//   return NextResponse.next();
// });

// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|public).*)"],
// };
