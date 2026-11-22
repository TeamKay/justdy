import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { Prisma } from "@/lib/generated/prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getExclusionReason } from "@/lib/marketing/audience-service";

export const dynamic = "force-dynamic";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!admin || String(admin.role).toUpperCase() !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 },
      ),
    };
  }

  return { admin };
}

export async function GET(request: Request) {
  const authResult = await requireAdmin();

  if (authResult.error) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);

    const search = (searchParams.get("search") ?? "").trim();
    const requestedRole = (searchParams.get("role") ?? "ALL").toUpperCase();

    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
    );

    const requestedPageSize = Number.parseInt(
      searchParams.get("pageSize") ?? String(PAGE_SIZE_DEFAULT),
      10,
    );

    const pageSize = Math.min(
      PAGE_SIZE_MAX,
      Math.max(
        1,
        Number.isFinite(requestedPageSize)
          ? requestedPageSize
          : PAGE_SIZE_DEFAULT,
      ),
    );

    if (!["ALL", "LEARNER", "TUTOR"].includes(requestedRole)) {
      return NextResponse.json(
        { error: "Invalid account type filter." },
        { status: 400 },
      );
    }

    const where: Prisma.UserWhereInput = {
      role:
        requestedRole === "ALL"
          ? { in: ["LEARNER", "TUTOR"] }
          : (requestedRole as "LEARNER" | "TUTOR"),

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                phoneNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),

      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,

          marketingContact: {
            select: {
              email: true,
              normalizedEmail: true,
              subscriptionStatus: true,
              suppressedAt: true,
              unsubscribedAt: true,
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
          },
        },
      }),
    ]);

    const contacts = users.map((user) => {
      const marketingContact = user.marketingContact;

      let marketingEligible = false;
      let marketingReason = "NO_MARKETING_CONTACT";

      if (marketingContact) {
        if (marketingContact.suppressedAt) {
          marketingReason = "SUPPRESSED";
        } else if (marketingContact.subscriptionStatus !== "SUBSCRIBED") {
          marketingReason =
            marketingContact.subscriptionStatus === "UNSUBSCRIBED"
              ? "UNSUBSCRIBED"
              : "NOT_SUBSCRIBED";
        } else {
          const exclusionReason = getExclusionReason({
            email: marketingContact.email,
            normalizedEmail: marketingContact.normalizedEmail,
            userId: user.id,
            user: {
              status: user.status,
              emailVerified: user.emailVerified,
            },
            consentEvents: marketingContact.consentEvents,
          });

          marketingEligible = exclusionReason === null;
          marketingReason = exclusionReason ?? "ELIGIBLE";
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        accountStatus: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        marketingStatus:
          marketingContact?.subscriptionStatus ?? "NO_RECORD",
        marketingEligible,
        marketingReason,
        suppressed: Boolean(marketingContact?.suppressedAt),
        unsubscribedAt: marketingContact?.unsubscribedAt ?? null,
      };
    });

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: page * pageSize < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[Admin communication contacts] Failed:", error);

    return NextResponse.json(
      { error: "Unable to load communication contacts." },
      { status: 500 },
    );
  }
}