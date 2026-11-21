
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEligibleMarketingContactByEmail } from "@/lib/marketing/audience-service";


export const dynamic = "force-dynamic";

const createCampaignSchema = z.object({
  kind: z.enum(["BULK", "INDIVIDUAL"]),
  individualRecipientEmail: z.string().trim().email().max(254).optional(),
  name: z.string().trim().min(1).max(160),
  subject: z.string().trim().min(1).max(200),
  htmlContent: z.string().min(1).max(500_000),
  textContent: z.string().max(500_000).nullable().optional(),
  fromName: z.string().trim().max(120).nullable().optional(),
  replyTo: z.string().trim().email().max(254).nullable().optional(),
});

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 },
      ),
    };
  }

  return { userId: session.user.id };
}

function getPagination(request: NextRequest) {
  const pageValue = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const pageSizeValue = Number(
    request.nextUrl.searchParams.get("pageSize") ?? "20",
  );

  const page =
    Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  const pageSize =
    Number.isInteger(pageSizeValue) && pageSizeValue > 0
      ? Math.min(pageSizeValue, 100)
      : 20;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();

  if (authResult.error) {
    return authResult.error;
  }

  const { page, pageSize, skip } = getPagination(request);
  const status = request.nextUrl.searchParams.get("status");
  const kind = request.nextUrl.searchParams.get("kind");

  const validStatuses = [
    "DRAFT",
    "QUEUED",
    "SENDING",
    "SENT",
    "PARTIALLY_SENT",
    "FAILED",
    "CANCELLED",
  ] as const;

  const validKinds = ["BULK", "INDIVIDUAL"] as const;

  if (
    status &&
    !validStatuses.includes(status as (typeof validStatuses)[number])
  ) {
    return NextResponse.json(
      { error: "Invalid campaign status filter." },
      { status: 400 },
    );
  }

  if (kind && !validKinds.includes(kind as (typeof validKinds)[number])) {
    return NextResponse.json(
      { error: "Invalid campaign kind filter." },
      { status: 400 },
    );
  }

  try {
    const where = {
      ...(status ? { status: status as (typeof validStatuses)[number] } : {}),
      ...(kind ? { kind: kind as (typeof validKinds)[number] } : {}),
    };

    const [campaigns, total] = await prisma.$transaction([
      prisma.marketingCampaign.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
        include: {
          _count: {
            select: {
              recipients: true,
            },
          },
        },
      }),
      prisma.marketingCampaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[Marketing campaigns] List failed:", error);

    return NextResponse.json(
      { error: "Unable to retrieve marketing campaigns." },
      { status: 500 },
    );
  }
}


export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();

  if (authResult.error) {
    return authResult.error;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  const parsed = createCampaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid campaign information.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    let individualRecipientEmail: string | null = null;

    if (parsed.data.kind === "INDIVIDUAL") {
      const requestedEmail = parsed.data.individualRecipientEmail;

      if (!requestedEmail) {
        return NextResponse.json(
          {
            error: "An individual campaign requires a recipient email address.",
          },
          { status: 400 },
        );
      }

      const eligibleContact =
        await getEligibleMarketingContactByEmail(requestedEmail);

      if (!eligibleContact) {
        return NextResponse.json(
          {
            error:
              "This email is not an eligible subscribed marketing contact with valid consent.",
          },
          { status: 400 },
        );
      }

      individualRecipientEmail = eligibleContact.email;
    }

    const campaign = await prisma.marketingCampaign.create({
      data: {
        kind: parsed.data.kind,
        ...(parsed.data.kind === "INDIVIDUAL"
          ? { individualRecipientEmail }
          : {}),
        name: parsed.data.name,
        subject: parsed.data.subject,
        htmlContent: parsed.data.htmlContent,
        textContent: parsed.data.textContent,
        fromName: parsed.data.fromName,
        replyTo: parsed.data.replyTo,
        status: "DRAFT",
        createdById: authResult.userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        campaign,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Marketing campaigns] Creation failed:", error);

    return NextResponse.json(
      { error: "Unable to create marketing campaign." },
      { status: 500 },
    );
  }
}

