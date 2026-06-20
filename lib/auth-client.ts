import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  plugins: [adminClient(), nextCookies()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

export type User = typeof authClient.$Infer.Session.user;

// import { createAuthClient } from "better-auth/react";
// import { emailOTPClient } from "better-auth/client/plugins";
// import { adminClient } from "better-auth/client/plugins";
// import { nextCookies } from "better-auth/next-js";

// export const authClient = createAuthClient({
//   baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
//   plugins: [emailOTPClient(), adminClient(), nextCookies()],
// });

// export const { signIn, signOut, signUp, useSession } = authClient;

// export type User = typeof authClient.$Infer.Session.user;
