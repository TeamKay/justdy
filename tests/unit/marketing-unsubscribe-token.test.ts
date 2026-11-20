import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret-for-unsubscribe",
    BETTER_AUTH_URL: "https://justdy.example",
  },
}));

import {
  createMarketingUnsubscribeToken,
  hashMarketingUnsubscribeToken,
  getMarketingUnsubscribeUrl,
} from "@/lib/marketing/unsubscribe-token";

describe("marketing unsubscribe token", () => {
  const subscribedAt = new Date("2026-11-20T12:00:00.000Z");

  it("creates a 64-character hexadecimal token", () => {
    const token = createMarketingUnsubscribeToken(
      "contact-1",
      subscribedAt,
    );

    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates the same token for the same subscription", () => {
    const first = createMarketingUnsubscribeToken(
      "contact-1",
      subscribedAt,
    );

    const second = createMarketingUnsubscribeToken(
      "contact-1",
      subscribedAt,
    );

    expect(first).toBe(second);
  });

  it("generates different tokens for different contacts", () => {
    const first = createMarketingUnsubscribeToken(
      "contact-1",
      subscribedAt,
    );

    const second = createMarketingUnsubscribeToken(
      "contact-2",
      subscribedAt,
    );

    expect(first).not.toBe(second);
  });

  it("generates different tokens for different subscription dates", () => {
    const first = createMarketingUnsubscribeToken(
      "contact-1",
      subscribedAt,
    );

    const second = createMarketingUnsubscribeToken(
      "contact-1",
      new Date("2026-11-21T12:00:00.000Z"),
    );

    expect(first).not.toBe(second);
  });

  it("hashes tokens into 64-character hexadecimal values", () => {
    const hash = hashMarketingUnsubscribeToken("test-token");

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe("test-token");
  });

  it("builds an absolute unsubscribe URL containing the token", () => {
    const url = getMarketingUnsubscribeUrl(
      "contact-1",
      subscribedAt,
    );

    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://justdy.example");
    expect(parsed.pathname).toBe("/api/marketing/unsubscribe");
    expect(parsed.searchParams.get("token")).toBe(
      createMarketingUnsubscribeToken("contact-1", subscribedAt),
    );
  });
});
