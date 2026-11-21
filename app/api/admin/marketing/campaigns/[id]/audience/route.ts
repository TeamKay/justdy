import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  getEligibleMarketingContactByEmail,
  previewMarketingAudience,
} from "@/lib/marketing/audience-service";

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
        individualRecipientEmail: true,
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

    if (campaign.kind === "INDIVIDUAL") {
      const recipientEmail = campaign.individualRecipientEmail?.trim();

      if (!recipientEmail) {
        return NextResponse.json(
          {
            error:
              "This Individual campaign does not have a recipient email address. Edit the campaign and add an eligible recipient.",
          },
          { status: 409 },
        );
      }

      // Recheck current subscription and consent eligibility at preview time.
      // This does not create a recipient record or send an email.
      const eligibleContact =
        await getEligibleMarketingContactByEmail(recipientEmail);

      if (!eligibleContact) {
        return NextResponse.json({
          success: true,
          campaign: {
            id: campaign.id,
            name: campaign.name,
            kind: campaign.kind,
          },
          audience: {
            totalContacts: 1,
            eligibleCount: 0,
            excludedCount: 1,
            breakdown: {
              notSubscribed: 0,
              unsubscribed: 0,
              suppressed: 0,
              invalidEmail: 0,
              missingOrWithdrawnConsent: 0,
              accountNotEligible: 0,
              individualRecipientIneligible: 1,
            },
            recipient: {
              email: recipientEmail,
              eligible: false,
            },
          },
          previewOnly: true,
          emailsSent: 0,
        });
      }

      return NextResponse.json({
        success: true,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          kind: campaign.kind,
        },
        audience: {
          totalContacts: 1,
          eligibleCount: 1,
          excludedCount: 0,
          breakdown: {
            notSubscribed: 0,
            unsubscribed: 0,
            suppressed: 0,
            invalidEmail: 0,
            missingOrWithdrawnConsent: 0,
            accountNotEligible: 0,
            individualRecipientIneligible: 0,
          },
          recipient: {
            id: eligibleContact.id,
            email: eligibleContact.email,
            name: eligibleContact.name,
            eligible: true,
          },
        },
        previewOnly: true,
        emailsSent: 0,
      });
    }

    // Bulk campaigns continue to use the complete eligible-audience preview.
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
