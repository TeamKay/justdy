-- CreateEnum
CREATE TYPE "CommunicationPurpose" AS ENUM ('ACCOUNT_SUPPORT', 'TUTORING_INQUIRY', 'BOOKING', 'PAYMENT', 'SERVICE_UPDATE', 'OTHER_SERVICE');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "communication_message" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "purpose" "CommunicationPurpose" NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'PENDING',
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "serviceReason" TEXT,
    "resendMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "communication_message_resendMessageId_key" ON "communication_message"("resendMessageId");

-- CreateIndex
CREATE INDEX "communication_message_recipientId_createdAt_idx" ON "communication_message"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "communication_message_senderId_createdAt_idx" ON "communication_message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "communication_message_status_createdAt_idx" ON "communication_message"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "communication_message" ADD CONSTRAINT "communication_message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_message" ADD CONSTRAINT "communication_message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
