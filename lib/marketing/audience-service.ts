
import "server-only";

import prisma from "@/lib/prisma";
import { normalizeMarketingEmail } from "@/lib/marketing/contact-service";

const CONSENT_TEXT_VERSION = "newsletter-consent-v1";
const CONSENT_METHOD = "NEWSLETTER_FOOTER_FORM";

type ExclusionReason =
  | "INVALID_EMAIL"
  | "MISSING_OR_WITHDRAWN_CONSENT"
  | "ACCOUNT_NOT_ELIGIBLE";

export interface MarketingAudiencePreview {
  totalContacts: number;
  eligibleCount: number;
  excludedCount: number;
  breakdown: {
    notSubscribed: number;
    unsubscribed: number;
    suppressed: number;
    invalidEmail: number;
    missingOrWithdrawnConsent: number;
    accountNotEligible: number;
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasValidNewsletterConsent(
  event: {
    action: string;
    authorizationType: string;
    channel: string;
    method: string;
    consentTextVersion: string | null;
    consentGivenByEmail: string | null;
    evidenceMetadata: unknown;
  } | undefined,
  normalizedEmail: string,
): boolean {
  if (
    !event ||
    event.action !== "GRANTED" ||
    event.authorizationType !== "SELF" ||
    event.channel !== "EMAIL" ||
    event.method !== CONSENT_METHOD ||
    event.consentTextVersion !== CONSENT_TEXT_VERSION
  ) {
    return false;
  }

  if (!event.consentGivenByEmail) {
    return false;
  }

  try {
    if (
      normalizeMarketingEmail(event.consentGivenByEmail) !==
      normalizedEmail
    ) {
      return false;
    }
  } catch {
    return false;
  }

  const evidence = event.evidenceMetadata;

  if (!isRecord(evidence)) {
    return false;
  }

  // Validate explicit marketing consent only.
  // No age declaration or SocialProfile requirement.
  return (
    evidence.source === "footer_newsletter" &&
    evidence.marketingConsent === true
  );
}

export function getExclusionReason(contact: {
  email: string;
  normalizedEmail: string;
  userId: string | null;
  user: {
    status: string;
    emailVerified: boolean;
  } | null;
  consentEvents: Array<{
    action: string;
    authorizationType: string;
    channel: string;
    method: string;
    consentTextVersion: string | null;
    consentGivenByEmail: string | null;
    evidenceMetadata: unknown;
  }>;
}): ExclusionReason | null {
  let normalizedEmail: string;

  try {
    normalizedEmail = normalizeMarketingEmail(contact.email);

    if (normalizedEmail !== contact.normalizedEmail) {
      return "INVALID_EMAIL";
    }
  } catch {
    return "INVALID_EMAIL";
  }

  const latestConsent = contact.consentEvents[0];

  if (
    !hasValidNewsletterConsent(
      latestConsent,
      normalizedEmail,
    )
  ) {
    return "MISSING_OR_WITHDRAWN_CONSENT";
  }

  // Registered accounts must remain active and email-verified.
  // Age classification and SocialProfile are not used.
  if (contact.userId) {
    const user = contact.user;

    if (
      !user ||
      user.status !== "Active" ||
      !user.emailVerified
    ) {
      return "ACCOUNT_NOT_ELIGIBLE";
    }
  }

  return null;
}

/**
 * Preview the current eligible marketing audience.
 *
 * This function does not create campaign recipients and never sends email.
 * Eligibility is recalculated from current contact, consent, and account data.
 * 
 * 
 */


export interface EligibleMarketingContact {
  id: string;
  email: string;
  normalizedEmail: string;
  name: string | null;
}

/**
 * Retrieves contacts currently eligible for marketing email.
 *
 * Uses exactly the same consent and account eligibility rules
 * as the audience preview.
 *
 * This function does not create recipients or send email.
 */
export async function getEligibleMarketingContacts(): Promise<
  EligibleMarketingContact[]
> {
  const contacts = await prisma.marketingContact.findMany({
    where: {
      subscriptionStatus: "SUBSCRIBED",
    },
    select: {
      id: true,
      email: true,
      normalizedEmail: true,
      name: true,
      userId: true,
      user: {
        select: {
          status: true,
          emailVerified: true,
        },
      },
      consentEvents: {
        orderBy: [
          { occurredAt: "desc" },
          { createdAt: "desc" },
        ],
        take: 1,
        select: {
          action: true,
          authorizationType: true,
          channel: true,
          method: true,
          consentTextVersion: true,
          consentGivenByEmail: true,
          evidenceMetadata: true,
        },
      },
    },
  });

  return contacts
    .filter((contact) => getExclusionReason(contact) === null)
    .map((contact) => ({
      id: contact.id,
      email: contact.email,
      normalizedEmail: contact.normalizedEmail,
      name: contact.name,
    }));
}


/**
 * Finds one marketing contact by email and verifies current eligibility.
 *
 * Individual campaigns may only target an existing subscribed contact
 * with valid newsletter consent and an eligible account.
 */
export async function getEligibleMarketingContactByEmail(
  email: string,
): Promise<EligibleMarketingContact | null> {
  let normalizedEmail: string;

  try {
    normalizedEmail = normalizeMarketingEmail(email);
  } catch {
    return null;
  }

  const contact = await prisma.marketingContact.findUnique({
    where: {
      normalizedEmail,
    },
    select: {
      id: true,
      email: true,
      normalizedEmail: true,
      name: true,
      subscriptionStatus: true,
      userId: true,
      user: {
        select: {
          status: true,
          emailVerified: true,
        },
      },
      consentEvents: {
        orderBy: [
          { occurredAt: "desc" },
          { createdAt: "desc" },
        ],
        take: 1,
        select: {
          action: true,
          authorizationType: true,
          channel: true,
          method: true,
          consentTextVersion: true,
          consentGivenByEmail: true,
          evidenceMetadata: true,
        },
      },
    },
  });

  if (
    !contact ||
    contact.subscriptionStatus !== "SUBSCRIBED" ||
    getExclusionReason(contact) !== null
  ) {
    return null;
  }

  return {
    id: contact.id,
    email: contact.email,
    normalizedEmail: contact.normalizedEmail,
    name: contact.name,
  };
}


export async function previewMarketingAudience(): Promise<MarketingAudiencePreview> {
  const [statusCounts, subscribedContacts] = await Promise.all([
    prisma.marketingContact.groupBy({
      by: ["subscriptionStatus"],
      _count: {
        _all: true,
      },
    }),

    prisma.marketingContact.findMany({
      where: {
        subscriptionStatus: "SUBSCRIBED",
      },
      select: {
        email: true,
        normalizedEmail: true,
        userId: true,
        user: {
          select: {
            status: true,
            emailVerified: true,
          },
        },
        consentEvents: {
          orderBy: [
            { occurredAt: "desc" },
            { createdAt: "desc" },
          ],
          take: 1,
          select: {
            action: true,
            authorizationType: true,
            channel: true,
            method: true,
            consentTextVersion: true,
            consentGivenByEmail: true,
            evidenceMetadata: true,
          },
        },
      },
    }),
  ]);

  const counts = {
    NOT_SUBSCRIBED: 0,
    SUBSCRIBED: 0,
    UNSUBSCRIBED: 0,
    SUPPRESSED: 0,
  };

  for (const item of statusCounts) {
    counts[item.subscriptionStatus] = item._count._all;
  }

  const breakdown = {
    notSubscribed: counts.NOT_SUBSCRIBED,
    unsubscribed: counts.UNSUBSCRIBED,
    suppressed: counts.SUPPRESSED,
    invalidEmail: 0,
    missingOrWithdrawnConsent: 0,
    accountNotEligible: 0,
  };

  let eligibleCount = 0;

  for (const contact of subscribedContacts) {
    const reason = getExclusionReason(contact);

    if (!reason) {
      eligibleCount += 1;
      continue;
    }

    if (reason === "INVALID_EMAIL") {
      breakdown.invalidEmail += 1;
    } else if (reason === "ACCOUNT_NOT_ELIGIBLE") {
      breakdown.accountNotEligible += 1;
    } else {
      breakdown.missingOrWithdrawnConsent += 1;
    }
  }

  const excludedCount =
    breakdown.notSubscribed +
    breakdown.unsubscribed +
    breakdown.suppressed +
    breakdown.invalidEmail +
    breakdown.missingOrWithdrawnConsent +
    breakdown.accountNotEligible;

  return {
    totalContacts:
      counts.NOT_SUBSCRIBED +
      counts.SUBSCRIBED +
      counts.UNSUBSCRIBED +
      counts.SUPPRESSED,
    eligibleCount,
    excludedCount,
    breakdown,
  };
}
