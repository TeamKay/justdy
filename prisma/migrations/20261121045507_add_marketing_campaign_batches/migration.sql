-- CreateEnum
CREATE TYPE "MarketingCampaignBatchStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "marketing_campaign_recipient" ADD COLUMN     "batchId" TEXT;

-- CreateTable
CREATE TABLE "marketing_campaign_batch" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "MarketingCampaignBatchStatus" NOT NULL DEFAULT 'PENDING',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "queueMessageId" TEXT,
    "queuedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaign_batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaign_batch_queueMessageId_key" ON "marketing_campaign_batch"("queueMessageId");

-- CreateIndex
CREATE INDEX "marketing_campaign_batch_campaignId_status_idx" ON "marketing_campaign_batch"("campaignId", "status");

-- CreateIndex
CREATE INDEX "marketing_campaign_batch_status_leaseExpiresAt_idx" ON "marketing_campaign_batch"("status", "leaseExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaign_batch_campaignId_sequence_key" ON "marketing_campaign_batch"("campaignId", "sequence");

-- CreateIndex
CREATE INDEX "marketing_campaign_recipient_batchId_status_idx" ON "marketing_campaign_recipient"("batchId", "status");

-- AddForeignKey
ALTER TABLE "marketing_campaign_batch" ADD CONSTRAINT "marketing_campaign_batch_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign_recipient" ADD CONSTRAINT "marketing_campaign_recipient_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "marketing_campaign_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
