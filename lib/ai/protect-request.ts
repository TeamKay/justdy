import "server-only";

import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";

const aiRateLimiter = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 20,
  }),
);

export async function protectAIRequest(userId: string) {
  const req = await request();
  return aiRateLimiter.protect(req, { fingerprint: userId });
}
