-- CreateEnum
CREATE TYPE "PaymentProductType" AS ENUM ('FLEXPAY_30_MIN', 'FLEXPAY_45_MIN', 'FLEXPAY_60_MIN', 'MONTHLY_PREMIUM');

-- CreateEnum
CREATE TYPE "PaymentPurchaseStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "SessionCreditGrantStatus" AS ENUM ('ACTIVE', 'EXHAUSTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SessionCreditRedemptionStatus" AS ENUM ('CONSUMED', 'RESTORED');

-- CreateTable
CREATE TABLE "PaymentPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productType" "PaymentProductType" NOT NULL,
    "status" "PaymentPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "sessionMinutes" INTEGER,
    "sessionsIncluded" INTEGER NOT NULL DEFAULT 0,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeInvoiceId" TEXT,
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionCreditGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentPurchaseId" TEXT,
    "membershipId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "sessionMinutes" INTEGER NOT NULL,
    "creditsGranted" INTEGER NOT NULL,
    "creditsRemaining" INTEGER NOT NULL,
    "status" "SessionCreditGrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "periodStart" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionCreditGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionCreditRedemption" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "creditGrantId" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 1,
    "sessionMinutes" INTEGER NOT NULL,
    "status" "SessionCreditRedemptionStatus" NOT NULL DEFAULT 'CONSUMED',
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionCreditRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPurchase_stripeCheckoutSessionId_key" ON "PaymentPurchase"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPurchase_stripeInvoiceId_key" ON "PaymentPurchase"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "PaymentPurchase_userId_createdAt_idx" ON "PaymentPurchase"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentPurchase_status_createdAt_idx" ON "PaymentPurchase"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentPurchase_stripeSubscriptionId_idx" ON "PaymentPurchase"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_stripeSubscriptionId_key" ON "Membership"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Membership_userId_status_idx" ON "Membership"("userId", "status");

-- CreateIndex
CREATE INDEX "Membership_currentPeriodEnd_idx" ON "Membership"("currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "SessionCreditGrant_paymentPurchaseId_key" ON "SessionCreditGrant"("paymentPurchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionCreditGrant_sourceKey_key" ON "SessionCreditGrant"("sourceKey");

-- CreateIndex
CREATE INDEX "SessionCreditGrant_userId_status_expiresAt_idx" ON "SessionCreditGrant"("userId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "SessionCreditGrant_membershipId_periodStart_idx" ON "SessionCreditGrant"("membershipId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "SessionCreditRedemption_bookingId_key" ON "SessionCreditRedemption"("bookingId");

-- CreateIndex
CREATE INDEX "SessionCreditRedemption_creditGrantId_status_idx" ON "SessionCreditRedemption"("creditGrantId", "status");

-- AddForeignKey
ALTER TABLE "PaymentPurchase" ADD CONSTRAINT "PaymentPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCreditGrant" ADD CONSTRAINT "SessionCreditGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCreditGrant" ADD CONSTRAINT "SessionCreditGrant_paymentPurchaseId_fkey" FOREIGN KEY ("paymentPurchaseId") REFERENCES "PaymentPurchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCreditGrant" ADD CONSTRAINT "SessionCreditGrant_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCreditRedemption" ADD CONSTRAINT "SessionCreditRedemption_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCreditRedemption" ADD CONSTRAINT "SessionCreditRedemption_creditGrantId_fkey" FOREIGN KEY ("creditGrantId") REFERENCES "SessionCreditGrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

