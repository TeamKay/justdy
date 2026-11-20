
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateCampaignSchema = z
  .object({
    kind: z.enum(["BULK", "INDIVIDUAL"]).optional(),
    name: z.string().trim().min(1).max(160).optional(),
    subject: z.string().trim().min(1).max(200).optional(),
    htmlContent: z.string().min(1).max(500_000).optional(),
    textContent: z.string().max(500_000).nullable().optional(),
    fromName: z.string().trim().max(120).nullable().optional(),
    replyTo: z.string().trim().email().max(254).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one campaign field to update.",
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

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const authResult = await requireAdmin();

  if (authResult.error) {
    return authResult.error;
  }

  const { id } = await params;

  try {
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recipients: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("[Marketing campaigns] Retrieval failed:", error);

    return NextResponse.json(
      { error: "Unable to retrieve campaign." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  const authResult = await requireAdmin();

  if (authResult.error) {
    return authResult.error;
  }

  const { id } = await params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  const parsed = updateCampaignSchema.safeParse(body);

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
    const result = await prisma.marketingCampaign.updateMany({
      where: {
        id,
        status: "DRAFT",
      },
      data: parsed.data,
    });

    if (result.count === 0) {
      const existing = await prisma.marketingCampaign.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Campaign not found." },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          error: "Only draft campaigns can be edited.",
          status: existing.status,
        },
        { status: 409 },
      );
    }

    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("[Marketing campaigns] Update failed:", error);

    return NextResponse.json(
      { error: "Unable to update marketing campaign." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const authResult = await requireAdmin();

  if (authResult.error) {
    return authResult.error;
  }

  const { id } = await params;

  try {
    const result = await prisma.marketingCampaign.deleteMany({
      where: {
        id,
        status: "DRAFT",
      },
    });

    if (result.count === 0) {
      const existing = await prisma.marketingCampaign.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Campaign not found." },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          error: "Only draft campaigns can be deleted.",
          status: existing.status,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Draft campaign deleted.",
    });
  } catch (error) {
    console.error("[Marketing campaigns] Deletion failed:", error);

    return NextResponse.json(
      { error: "Unable to delete marketing campaign." },
      { status: 500 },
    );
  }
}
