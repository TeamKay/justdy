
import "server-only";

import { createHash, createHmac } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Generate a token that can be reproduced when a future campaign
 * needs to include the subscriber's unsubscribe URL.
 *
 * The subscription timestamp makes each new subscription unique.
 */
export function createMarketingUnsubscribeToken(
  contactId: string,
  subscribedAt: Date,
): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${contactId}:${subscribedAt.getTime()}`)
    .digest("hex");
}

/**
 * Only the token hash is stored in the database.
 */
export function hashMarketingUnsubscribeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Build the absolute URL for email campaign footers.
 */
export function getMarketingUnsubscribeUrl(
  contactId: string,
  subscribedAt: Date,
): string {
  const token = createMarketingUnsubscribeToken(contactId, subscribedAt);
  const url = new URL("/api/marketing/unsubscribe", env.BETTER_AUTH_URL);

  url.searchParams.set("token", token);

  return url.toString();
}
