
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { previewMarketingAudience } from "@/lib/marketing/audience-service";

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
      select: {
        id: true,
        name: true,
        kind: true,
        status: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found." },
        { status: 404 },
      );
    }

    if (campaign.status !== "DRAFT") {
      return NextResponse.json(
        {
          error: "Audience preview is only available for draft campaigns.",
          status: campaign.status,
        },
        { status: 409 },
      );
    }

    const audience = await previewMarketingAudience();

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        kind: campaign.kind,
      },
      audience,
      previewOnly: true,
      emailsSent: 0,
    });
  } catch (error) {
    console.error("[Marketing campaign audience preview]", error);

    return NextResponse.json(
      { error: "Unable to preview the marketing audience." },
      { status: 500 },
    );
  }
}
