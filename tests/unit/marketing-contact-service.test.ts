
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    marketingContact: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    marketingContactSource: {
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

import {
  captureMarketingContact,
  captureMarketingContactSafely,
  normalizeMarketingEmail,
} from "@/lib/marketing/contact-service";

describe("marketing contact service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.marketingContact.upsert.mockResolvedValue({
      id: "contact-1",
      userId: null,
    });

    prismaMock.marketingContactSource.upsert.mockResolvedValue({});
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.marketingContact.findUnique.mockResolvedValue(null);
    prismaMock.marketingContact.updateMany.mockResolvedValue({ count: 1 });
  });

  it("normalizes email addresses", () => {
    expect(normalizeMarketingEmail("  TEST@Example.COM "))
      .toBe("test@example.com");
  });

  it("rejects invalid email addresses", () => {
    expect(() => normalizeMarketingEmail("not-an-email"))
      .toThrow("A valid email address is required.");
  });

  it("creates a contact and records its source", async () => {
    const result = await captureMarketingContact({
      email: "Learner@Example.com",
      name: "Learner One",
      sourceType: "USER_ACCOUNT",
      sourceRecordId: "user-123",
      sourceRole: "ACCOUNT_EMAIL",
    });

    expect(result).toEqual({
      contactId: "contact-1",
      normalizedEmail: "learner@example.com",
    });

    expect(prismaMock.marketingContact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { normalizedEmail: "learner@example.com" },
        create: expect.objectContaining({
          email: "learner@example.com",
          normalizedEmail: "learner@example.com",
          name: "Learner One",
        }),
      }),
    );

    expect(prismaMock.marketingContactSource.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          contactId_sourceType_sourceRecordId_sourceRole: {
            contactId: "contact-1",
            sourceType: "USER_ACCOUNT",
            sourceRecordId: "user-123",
            sourceRole: "ACCOUNT_EMAIL",
          },
        },
      }),
    );
  });

  it("does not update marketing subscription status", async () => {
    await captureMarketingContact({
      email: "person@example.com",
      sourceType: "NEWSLETTER",
      sourceRecordId: "newsletter-123",
      sourceRole: "NEWSLETTER_EMAIL",
    });

    const upsertArgs =
      prismaMock.marketingContact.upsert.mock.calls[0][0];

    expect(upsertArgs.update).toEqual({});
    expect(upsertArgs.update).not.toHaveProperty("subscriptionStatus");
    expect(upsertArgs.create).not.toHaveProperty("subscriptionStatus");
  });

  it("links a user only when the account email matches", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      email: "different@example.com",
    });

    await captureMarketingContact({
      email: "checkout@example.com",
      userId: "user-123",
      sourceType: "GUEST_CHECKOUT",
      sourceRecordId: "checkout-123",
      sourceRole: "CHECKOUT_EMAIL",
    });

    expect(prismaMock.marketingContact.updateMany).not.toHaveBeenCalled();
  });

  it("links a user when the account email matches", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      email: "person@example.com",
    });

    await captureMarketingContact({
      email: "PERSON@example.com",
      userId: "user-123",
      sourceType: "USER_ACCOUNT",
      sourceRecordId: "user-123",
      sourceRole: "ACCOUNT_EMAIL",
    });

    expect(prismaMock.marketingContact.updateMany).toHaveBeenCalledWith({
      where: {
        id: "contact-1",
        userId: null,
      },
      data: {
        userId: "user-123",
      },
    });
  });

  it("does not throw when safe capture fails", async () => {
    prismaMock.marketingContact.upsert.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      captureMarketingContactSafely(
        {
          email: "person@example.com",
          sourceType: "USER_ACCOUNT",
          sourceRecordId: "user-123",
          sourceRole: "ACCOUNT_EMAIL",
        },
        "unit test",
      ),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
