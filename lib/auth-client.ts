"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";

export const authClient = createAuthClient({
  /*
   * Do NOT set baseURL here.
   *
   * The authentication API is hosted by the same Next.js application
   * as the frontend. Better Auth will therefore use the current browser
   * origin automatically.
   *
   * Production:
   * https://www.justdy.com/api/auth/...
   *
   * Local:
   * http://localhost:3000/api/auth/...
   *
   * This prevents:
   * https://www.justdy.com
   *       ↓
   * https://justdy.com
   *       ↓ 308 redirect
   * https://www.justdy.com
   *
   * which was causing the CORS/preflight failure.
   */

  plugins: [adminClient(), nextCookies()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

export type User = typeof authClient.$Infer.Session.user;
