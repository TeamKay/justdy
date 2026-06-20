// /app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);

// import "server-only";

// import { NextRequest } from "next/server";
// import { toNextJsHandler } from "better-auth/next-js";
// import { auth } from "@/lib/auth";

// import arcjet from "@/lib/arcjet";
// import ip from "@arcjet/ip";
// import {detectBot,slidingWindow,protectSignup,ArcjetDecision,BotOptions,EmailOptions,ProtectSignupOptions,SlidingWindowRateLimitOptions} from "@arcjet/next";

// /* -------------------------------------------------------------------------- */
// /*                              Arcjet Config                                 */
// /* -------------------------------------------------------------------------- */

// const emailOptions = {
//   mode: "LIVE",
//   deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
// } satisfies EmailOptions;

// const botOptions = {
//   mode: "LIVE",
//   allow: [],
// } satisfies BotOptions;

// const rateLimitOptions = {
//   mode: "LIVE",
//   interval: "2m",
//   max: 5,
// } satisfies SlidingWindowRateLimitOptions<[]>;

// const signupOptions = {
//   email: emailOptions,
//   bots: botOptions,
//   rateLimit: rateLimitOptions,
// } satisfies ProtectSignupOptions<[]>;

// /* -------------------------------------------------------------------------- */
// /*                         Arcjet Protection Logic                             */
// /* -------------------------------------------------------------------------- */

// async function protect(req: NextRequest): Promise<ArcjetDecision> {
//   const session = await auth.api.getSession({
//     headers: req.headers,
//   });

//   const fingerprint =
//     session?.user?.id ?? ip(req) ?? "127.0.0.1";

//   if (req.nextUrl.pathname.includes("/sign-up")) {
//     const body = await req.clone().json().catch(() => null);

//     if (body?.email) {
//       return arcjet
//         .withRule(protectSignup(signupOptions))
//         .protect(req, {
//           email: body.email,
//           fingerprint,
//         });
//     }
//   }

//   return arcjet
//     .withRule(detectBot(botOptions))
//     .withRule(slidingWindow(rateLimitOptions))
//     .protect(req, { fingerprint });
// }

// /* -------------------------------------------------------------------------- */
// /*                        BetterAuth Handlers                                  */
// /* -------------------------------------------------------------------------- */

// const handlers = toNextJsHandler(auth.handler);

// /* -------------------------------------------------------------------------- */
// /*                            Route Exports                                    */
// /* -------------------------------------------------------------------------- */

// export async function POST(req: NextRequest) {
//   const decision = await protect(req);

//   if (decision.isDenied()) {
//     return new Response(
//       JSON.stringify({
//         error: "Request blocked by security rules",
//         reason: decision.reason,
//       }),
//       {
//         status: 403,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   }

//   return handlers.POST(req);
// }

// export async function GET(req: NextRequest) {
//   return handlers.GET(req);
// }
