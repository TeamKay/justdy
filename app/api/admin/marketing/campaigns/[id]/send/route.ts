
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  CampaignPreparationError,
  prepareMarketingCampaign,
} from "@/lib/marketing/campaign-preparation-service";
import {
  CampaignQueueDispatchError,
  dispatchPendingCampaignBatches,
} from "@/lib/marketing/campaign-queue-dispatcher";

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

function getPreparationErrorStatus(code: string): number {
  switch (code) {
    case "NOT_FOUND":
      return 404;
    case "NOT_DRAFT":
    case "NO_ELIGIBLE_RECIPIENTS":
    case "PREPARATION_CONFLICT":
      return 409;
    default:
      return 400;
  }
}

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  const authResult = await requireAdmin();

  if (authResult.error) {
    return authResult.error;
  }

  const { id: campaignId } = await params;

  try {
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    let preparation:
      | Awaited<ReturnType<typeof prepareMarketingCampaign>>
      | undefined;

    // Prepare a draft exactly once. If a previous request prepared
    // it but failed to publish, a later request resumes dispatch.
    if (campaign.status === "DRAFT") {
      preparation = await prepareMarketingCampaign(campaignId);
    } else if (
      campaign.status !== "QUEUED" &&
      campaign.status !== "SENDING"
    ) {
      return NextResponse.json(
        {
          error: `Campaign cannot be sent from status: ${campaign.status}.`,
          code: "CAMPAIGN_NOT_READY",
        },
        { status: 409 },
      );
    }

    const dispatch = await dispatchPendingCampaignBatches(campaignId);

    const queuedCount =
      dispatch.acceptedCount + dispatch.deferredCount;

    return NextResponse.json({
      message:
        dispatch.remainingPendingCount === 0
          ? "Campaign queue dispatch completed. Email delivery is processed asynchronously."
          : "Campaign queue dispatch finished with batches still pending. You can retry this request to resume dispatch.",
      campaignId,
      status: "QUEUED",
      preparation: preparation ?? null,
      dispatch,
      queuedCount,
      deliveryStarted: queuedCount > 0,
      deliveryCompleted: false,
    });
  } catch (error) {
    if (error instanceof CampaignPreparationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: getPreparationErrorStatus(error.code) },
      );
    }

    if (error instanceof CampaignQueueDispatchError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "CAMPAIGN_NOT_READY"
            ? 409
            : 503;

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          retryable: error.code === "PUBLISH_FAILED",
        },
        { status },
      );
    }

    console.error("[Marketing campaign send] Failed:", error);

    return NextResponse.json(
      { error: "Unable to start campaign delivery." },
      { status: 500 },
    );
  }
}
