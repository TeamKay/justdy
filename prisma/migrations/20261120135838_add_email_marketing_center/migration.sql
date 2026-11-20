-- CreateEnum
CREATE TYPE "MarketingSubscriptionStatus" AS ENUM ('NOT_SUBSCRIBED', 'SUBSCRIBED', 'UNSUBSCRIBED', 'SUPPRESSED');

-- CreateEnum
CREATE TYPE "MarketingContactSourceType" AS ENUM ('USER_ACCOUNT', 'PENDING_ENROLLMENT', 'GUEST_CHECKOUT', 'ONBOARDING_REQUEST', 'ONBOARDING_PAYMENT', 'NEWSLETTER');

-- CreateEnum
CREATE TYPE "MarketingConsentAction" AS ENUM ('GRANTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "MarketingConsentAuthorizationType" AS ENUM ('SELF', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "MarketingCampaignKind" AS ENUM ('BULK', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "MarketingCampaignStatus" AS ENUM ('DRAFT', 'QUEUED', 'SENDING', 'SENT', 'PARTIALLY_SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarketingRecipientStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'DELIVERED', 'BOUNCED', 'COMPLAINED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "marketing_contact" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "name" TEXT,
    "userId" TEXT,
    "subscriptionStatus" "MarketingSubscriptionStatus" NOT NULL DEFAULT 'NOT_SUBSCRIBED',
    "unsubscribeTokenHash" TEXT,
    "subscribedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "suppressedAt" TIMESTAMP(3),
    "suppressionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_contact_source" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "sourceType" "MarketingContactSourceType" NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "sourceRole" TEXT NOT NULL,
    "sourceEmail" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceMetadata" JSONB,
    "sourceCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_contact_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_consent_event" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "action" "MarketingConsentAction" NOT NULL,
    "authorizationType" "MarketingConsentAuthorizationType" NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "method" TEXT NOT NULL,
    "consentTextVersion" TEXT,
    "consentGivenByEmail" TEXT,
    "consentGivenByUserId" TEXT,
    "evidenceMetadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_consent_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaign" (
    "id" TEXT NOT NULL,
    "kind" "MarketingCampaignKind" NOT NULL,
    "status" "MarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "fromName" TEXT,
    "replyTo" TEXT,
    "createdById" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaign_recipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "emailSnapshot" TEXT NOT NULL,
    "nameSnapshot" TEXT,
    "status" "MarketingRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "resendMessageId" TEXT,
    "errorMessage" TEXT,
    "attemptedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaign_recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_email_event" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RESEND',
    "providerEventId" TEXT,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_email_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_contact_normalizedEmail_key" ON "marketing_contact"("normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_contact_userId_key" ON "marketing_contact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_contact_unsubscribeTokenHash_key" ON "marketing_contact"("unsubscribeTokenHash");

-- CreateIndex
CREATE INDEX "marketing_contact_subscriptionStatus_createdAt_idx" ON "marketing_contact"("subscriptionStatus", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_contact_email_idx" ON "marketing_contact"("email");

-- CreateIndex
CREATE INDEX "marketing_contact_source_contactId_createdAt_idx" ON "marketing_contact_source"("contactId", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_contact_source_sourceType_sourceRecordId_idx" ON "marketing_contact_source"("sourceType", "sourceRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_contact_source_contactId_sourceType_sourceRecordI_key" ON "marketing_contact_source"("contactId", "sourceType", "sourceRecordId", "sourceRole");

-- CreateIndex
CREATE INDEX "marketing_consent_event_contactId_occurredAt_idx" ON "marketing_consent_event"("contactId", "occurredAt");

-- CreateIndex
CREATE INDEX "marketing_consent_event_action_occurredAt_idx" ON "marketing_consent_event"("action", "occurredAt");

-- CreateIndex
CREATE INDEX "marketing_campaign_status_scheduledAt_idx" ON "marketing_campaign"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "marketing_campaign_createdById_createdAt_idx" ON "marketing_campaign"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_campaign_kind_createdAt_idx" ON "marketing_campaign"("kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaign_recipient_resendMessageId_key" ON "marketing_campaign_recipient"("resendMessageId");

-- CreateIndex
CREATE INDEX "marketing_campaign_recipient_campaignId_status_idx" ON "marketing_campaign_recipient"("campaignId", "status");

-- CreateIndex
CREATE INDEX "marketing_campaign_recipient_contactId_createdAt_idx" ON "marketing_campaign_recipient"("contactId", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_campaign_recipient_status_createdAt_idx" ON "marketing_campaign_recipient"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaign_recipient_campaignId_contactId_key" ON "marketing_campaign_recipient"("campaignId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_email_event_providerEventId_key" ON "marketing_email_event"("providerEventId");

-- CreateIndex
CREATE INDEX "marketing_email_event_recipientId_occurredAt_idx" ON "marketing_email_event"("recipientId", "occurredAt");

-- CreateIndex
CREATE INDEX "marketing_email_event_eventType_occurredAt_idx" ON "marketing_email_event"("eventType", "occurredAt");

-- AddForeignKey
ALTER TABLE "marketing_contact" ADD CONSTRAINT "marketing_contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_contact_source" ADD CONSTRAINT "marketing_contact_source_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "marketing_contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_consent_event" ADD CONSTRAINT "marketing_consent_event_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "marketing_contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign" ADD CONSTRAINT "marketing_campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign_recipient" ADD CONSTRAINT "marketing_campaign_recipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign_recipient" ADD CONSTRAINT "marketing_campaign_recipient_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "marketing_contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_email_event" ADD CONSTRAINT "marketing_email_event_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "marketing_campaign_recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
