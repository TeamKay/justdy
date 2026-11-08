-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('ONE_OFF', 'RECURRING', 'OCCURRENCE');

-- CreateEnum
CREATE TYPE "TutoringReminderType" AS ENUM ('TWENTY_FOUR_HOURS', 'ONE_HOUR', 'TEN_MINUTES');

-- CreateEnum
CREATE TYPE "TutoringSessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ClassroomStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TutoringBookingStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'SCHEDULED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('TUTORING', 'GROUP_CLASS', 'COURSE', 'CONSULTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('Draft', 'Published', 'Archived');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('Scheduled', 'PendingPayment', 'Completed', 'Cancelled', 'NoShow');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Suspended', 'Pending', 'Deleted');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('Pending', 'Verified', 'Rejected');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('Available', 'Booked', 'Blocked');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'Pending_payment');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('Unpaid', 'Processing', 'Paid');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('Pending', 'Paid', 'Failed');

-- CreateEnum
CREATE TYPE "PendingEnrollmentStatus" AS ENUM ('Pending', 'Enrolled', 'Cancelled');

-- CreateEnum
CREATE TYPE "EnrollmentTrack" AS ENUM ('Hourly', 'Monthly');

-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('USD', 'GHS');

-- CreateEnum
CREATE TYPE "GradeLevel" AS ENUM ('Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6', 'Grade7', 'Grade8', 'Grade9', 'Grade10', 'Grade11', 'Grade12');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('ADMIN', 'TUTOR', 'LEARNER');

-- CreateEnum
CREATE TYPE "InvestmentAccountProvider" AS ENUM ('FIDELITY', 'BANK_OF_GHANA', 'GHANA_STOCK_EXCHANGE', 'STANBIC', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestmentAccountType" AS ENUM ('ROTH_IRA', 'TREASURY_BILLS', 'STOCKS', 'MUTUAL_FUND', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestmentAssetType" AS ENUM ('STOCK', 'ETF', 'MUTUAL_FUND', 'TREASURY_BILL', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestmentTransactionType" AS ENUM ('CONTRIBUTION', 'DEPOSIT', 'BUY', 'SELL', 'DIVIDEND', 'INTEREST', 'FEE', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'MATURITY', 'REINVESTMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "InvestmentImportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "TreasuryBillStatus" AS ENUM ('ACTIVE', 'MATURED', 'REDEEMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "PlatformRole" NOT NULL DEFAULT 'LEARNER',
    "imageUrl" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'Active',
    "lastLoginAt" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "specialty" TEXT,
    "experience" INTEGER,
    "credentialUrl" TEXT,
    "description" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'Pending',
    "hourlyRate" INTEGER,
    "currency" "CurrencyType" NOT NULL DEFAULT 'USD',
    "subjects" JSONB,
    "gradeLevels" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilitatorProfile" (
    "userId" TEXT NOT NULL,
    "specialty" TEXT,
    "experience" INTEGER,
    "credentialUrl" TEXT,
    "description" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "FacilitatorProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingEnrollment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "gradeLevel" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "enrollmentType" "EnrollmentTrack" NOT NULL,
    "topic" TEXT,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "educatorId" TEXT,
    "amount" INTEGER NOT NULL,
    "stripeSessionId" TEXT,
    "status" "PendingEnrollmentStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "educatorId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "learnerDescription" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'Scheduled',
    "stripeCheckoutSessionId" TEXT,
    "paymentIntentId" TEXT,
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'Unpaid',
    "videoSessionId" TEXT,
    "videoSessionToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tutoringSlotId" TEXT,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "educatorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "paypalEmail" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'Processing',
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "amount" INTEGER NOT NULL,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Whiteboard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled Whiteboard',
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appointmentId" TEXT,
    "isStandalone" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,

    CONSTRAINT "Whiteboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "emailStatus" TEXT NOT NULL DEFAULT 'SKIPPED_DISABLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "teachingProfileId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ServiceType" NOT NULL DEFAULT 'TUTORING',
    "durationMinutes" INTEGER,
    "price" INTEGER,
    "currency" "CurrencyType" NOT NULL DEFAULT 'USD',
    "status" "ServiceStatus" NOT NULL DEFAULT 'Draft',
    "subject" TEXT,
    "gradeLevels" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "educatorId" TEXT NOT NULL,
    "type" "AvailabilityType" NOT NULL DEFAULT 'ONE_OFF',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "dayOfWeek" INTEGER,
    "weeklyStartTime" TEXT,
    "weeklyEndTime" TEXT,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isAlwaysAvailable" BOOLEAN NOT NULL DEFAULT false,
    "excludedDates" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recurrenceKey" TEXT,
    "occurrenceDate" TEXT,
    "status" "SlotStatus" NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "educatorId" TEXT NOT NULL,
    "serviceId" TEXT,
    "availabilityId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "subject" TEXT,
    "gradeLevel" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'Scheduled',
    "description" TEXT,
    "stripeSessionId" TEXT,
    "paymentIntentId" TEXT,
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'Unpaid',
    "videoSessionId" TEXT,
    "videoSessionToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringReminder" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "TutoringReminderType" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutoringReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gradeLevel" TEXT,
    "subject" TEXT,
    "schoolYear" TEXT,
    "status" "ClassroomStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomStudent" (
    "classroomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassroomStudent_pkey" PRIMARY KEY ("classroomId","userId")
);

-- CreateTable
CREATE TABLE "ClassroomTeacher" (
    "classroomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ClassroomTeacher_pkey" PRIMARY KEY ("classroomId","userId")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gradeLevel" TEXT,
    "bio" TEXT,
    "learningStyle" TEXT,
    "preferredPace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringBooking" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "tutoringSlotId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "topic" TEXT,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "TutoringBookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "stripeSessionId" TEXT,
    "paymentIntentId" TEXT,
    "stripeSubscriptionId" TEXT,
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutoringBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringSlot" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutoringSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestTutoringCheckout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "gradeLevel" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT,
    "description" TEXT,
    "educatorId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeSessionId" TEXT,
    "paymentIntentId" TEXT,
    "studentId" TEXT,
    "bookingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "accountCreatedByCheckout" BOOLEAN NOT NULL DEFAULT false,
    "accountSetupEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestTutoringCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL DEFAULT 'RESOURCE_USE',
    "status" TEXT NOT NULL DEFAULT 'STARTED',
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "answers" JSONB,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorReview" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "educatorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringSession" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "educatorId" TEXT NOT NULL,
    "serviceId" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" "TutoringSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "learnerAttendance" BOOLEAN,
    "educatorAttendance" BOOLEAN,
    "topic" TEXT,
    "topicsCovered" JSONB,
    "strengths" TEXT,
    "needsPractice" TEXT,
    "nextStep" TEXT,
    "tutorNotes" TEXT,
    "learnerOutcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutoringSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringOnboardingRequest" (
    "id" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "potentialStartDate" TIMESTAMP(3) NOT NULL,
    "assignedTutorId" TEXT,
    "learnerEmail" TEXT,
    "learnerUserId" TEXT,
    "learnerAccountSetupSentAt" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "billingEmail" TEXT,
    "enrollmentType" TEXT NOT NULL DEFAULT 'self',
    "phoneNumber" TEXT NOT NULL,
    "subject" TEXT,
    "learningGoals" TEXT,
    "agreedSchedule" TEXT,
    "sessionDurationMinutes" INTEGER,
    "sessionsPerWeek" INTEGER,
    "courseDurationWeeks" INTEGER,
    "paymentPlan" TEXT NOT NULL DEFAULT 'full',
    "installmentCount" INTEGER NOT NULL DEFAULT 1,
    "courseTotalCents" INTEGER,
    "amountPaidCents" INTEGER NOT NULL DEFAULT 0,
    "agreedRateCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "planNotes" TEXT,
    "planAgreedAt" TIMESTAMP(3),
    "planAgreedById" TEXT,
    "preferredContact" TEXT NOT NULL DEFAULT 'Email',
    "additionalInfo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_planning',
    "paymentStatus" TEXT NOT NULL DEFAULT 'not_requested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripeCheckoutUrl" TEXT,
    "stripePaymentIntentId" TEXT,
    "paymentLinkEmailSentAt" TIMESTAMP(3),
    "paymentLinkEmailSentById" TEXT,
    "paymentReceivedAt" TIMESTAMP(3),

    CONSTRAINT "TutoringOnboardingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringOnboardingPayment" (
    "id" TEXT NOT NULL,
    "onboardingRequestId" TEXT NOT NULL,
    "learnerEmail" TEXT,
    "installmentNumber" INTEGER NOT NULL,
    "expectedAmountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'payment_requested',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "checkoutUrl" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "emailSentById" TEXT,
    "learnerPaymentConfirmationSentAt" TIMESTAMP(3),
    "learnerPaymentConfirmationClaimedAt" TIMESTAMP(3),
    "adminPaymentNotificationClaimedAt" TIMESTAMP(3),
    "learnerPaymentConfirmationLastError" TEXT,
    "adminPaymentNotificationSentAt" TIMESTAMP(3),
    "adminPaymentNotificationLastError" TEXT,
    "learnerPaymentConfirmationError" TEXT,
    "adminPaymentNotificationError" TEXT,
    "tutorPaymentNotificationSentAt" TIMESTAMP(3),
    "tutorPaymentNotificationClaimedAt" TIMESTAMP(3),
    "tutorPaymentNotificationError" TEXT,
    "tutorPaymentNotificationLastError" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutoringOnboardingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringOnboardingSession" (
    "id" TEXT NOT NULL,
    "onboardingRequestId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "timeZone" TEXT,
    "subject" TEXT,
    "gradeLevel" TEXT,
    "tutorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT,

    CONSTRAINT "TutoringOnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerSetupEmailLink" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "verificationUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnerSetupEmailLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baseCurrency" "CurrencyType" NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_account" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "InvestmentAccountProvider" NOT NULL,
    "type" "InvestmentAccountType" NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "country" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_asset" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "assetType" "InvestmentAssetType" NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "exchange" TEXT,
    "externalSymbol" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_transaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "assetId" TEXT,
    "importBatchId" TEXT,
    "type" "InvestmentTransactionType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "quantity" DECIMAL(28,10),
    "unitPrice" DECIMAL(20,8),
    "fees" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "externalId" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_price_history" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "priceDate" DATE NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "source" TEXT NOT NULL,
    "isEstimated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_exchange_rate" (
    "id" TEXT NOT NULL,
    "baseCurrency" "CurrencyType" NOT NULL,
    "quoteCurrency" "CurrencyType" NOT NULL,
    "rateDate" DATE NOT NULL,
    "rate" DECIMAL(20,10) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_exchange_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_treasury_bill" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "purchaseDate" DATE NOT NULL,
    "maturityDate" DATE NOT NULL,
    "purchasePrice" DECIMAL(20,8) NOT NULL,
    "faceValue" DECIMAL(20,8) NOT NULL,
    "annualizedYield" DECIMAL(12,8),
    "status" "TreasuryBillStatus" NOT NULL DEFAULT 'ACTIVE',
    "redeemedAt" TIMESTAMP(3),
    "actualProceeds" DECIMAL(20,8),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_treasury_bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_portfolio_snapshot" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "baseCurrency" "CurrencyType" NOT NULL,
    "totalValue" DECIMAL(24,8) NOT NULL,
    "accountValues" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_portfolio_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_import_batch" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "accountId" TEXT,
    "fileName" TEXT,
    "source" TEXT NOT NULL,
    "status" "InvestmentImportStatus" NOT NULL DEFAULT 'PROCESSING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "investment_import_batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_stripeCustomerId_key" ON "user"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingProfile_userId_key" ON "TeachingProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "PendingEnrollment_stripeSessionId_key" ON "PendingEnrollment"("stripeSessionId");

-- CreateIndex
CREATE INDEX "PendingEnrollment_email_idx" ON "PendingEnrollment"("email");

-- CreateIndex
CREATE INDEX "PendingEnrollment_status_idx" ON "PendingEnrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_tutoringSlotId_key" ON "Appointment"("tutoringSlotId");

-- CreateIndex
CREATE INDEX "Appointment_status_startTime_idx" ON "Appointment"("status", "startTime");

-- CreateIndex
CREATE INDEX "Appointment_educatorId_startTime_idx" ON "Appointment"("educatorId", "startTime");

-- CreateIndex
CREATE INDEX "Appointment_learnerId_createdAt_idx" ON "Appointment"("learnerId", "createdAt");

-- CreateIndex
CREATE INDEX "Payout_status_createdAt_idx" ON "Payout"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payout_educatorId_status_idx" ON "Payout"("educatorId", "status");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Whiteboard_appointmentId_key" ON "Whiteboard"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Whiteboard_bookingId_key" ON "Whiteboard"("bookingId");

-- CreateIndex
CREATE INDEX "Whiteboard_userId_idx" ON "Whiteboard"("userId");

-- CreateIndex
CREATE INDEX "Whiteboard_userId_isStandalone_idx" ON "Whiteboard"("userId", "isStandalone");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_eventKey_key" ON "Notification"("eventKey");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Service_providerId_status_idx" ON "Service"("providerId", "status");

-- CreateIndex
CREATE INDEX "Service_type_status_idx" ON "Service"("type", "status");

-- CreateIndex
CREATE INDEX "Availability_educatorId_startTime_idx" ON "Availability"("educatorId", "startTime");

-- CreateIndex
CREATE INDEX "Availability_educatorId_type_idx" ON "Availability"("educatorId", "type");

-- CreateIndex
CREATE INDEX "Availability_educatorId_dayOfWeek_idx" ON "Availability"("educatorId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Availability_educatorId_active_idx" ON "Availability"("educatorId", "active");

-- CreateIndex
CREATE INDEX "Availability_status_startTime_idx" ON "Availability"("status", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_recurrenceKey_occurrenceDate_key" ON "Availability"("recurrenceKey", "occurrenceDate");

-- CreateIndex
CREATE INDEX "Booking_studentId_startTime_idx" ON "Booking"("studentId", "startTime");

-- CreateIndex
CREATE INDEX "Booking_educatorId_startTime_idx" ON "Booking"("educatorId", "startTime");

-- CreateIndex
CREATE INDEX "Booking_status_startTime_idx" ON "Booking"("status", "startTime");

-- CreateIndex
CREATE INDEX "Booking_availabilityId_idx" ON "Booking"("availabilityId");

-- CreateIndex
CREATE INDEX "TutoringReminder_type_sentAt_idx" ON "TutoringReminder"("type", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringReminder_bookingId_type_key" ON "TutoringReminder"("bookingId", "type");

-- CreateIndex
CREATE INDEX "Classroom_organizationId_gradeLevel_idx" ON "Classroom"("organizationId", "gradeLevel");

-- CreateIndex
CREATE INDEX "Classroom_organizationId_status_idx" ON "Classroom"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Classroom_organizationId_subject_idx" ON "Classroom"("organizationId", "subject");

-- CreateIndex
CREATE INDEX "ClassroomStudent_userId_idx" ON "ClassroomStudent"("userId");

-- CreateIndex
CREATE INDEX "ClassroomTeacher_userId_idx" ON "ClassroomTeacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE INDEX "StudentProfile_gradeLevel_idx" ON "StudentProfile"("gradeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringBooking_tutoringSlotId_key" ON "TutoringBooking"("tutoringSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringBooking_stripeSessionId_key" ON "TutoringBooking"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringBooking_appointmentId_key" ON "TutoringBooking"("appointmentId");

-- CreateIndex
CREATE INDEX "TutoringBooking_customerId_createdAt_idx" ON "TutoringBooking"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "TutoringBooking_status_createdAt_idx" ON "TutoringBooking"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TutoringBooking_tutorId_createdAt_idx" ON "TutoringBooking"("tutorId", "createdAt");

-- CreateIndex
CREATE INDEX "TutoringBooking_tutorId_status_idx" ON "TutoringBooking"("tutorId", "status");

-- CreateIndex
CREATE INDEX "TutoringSlot_tutorId_startTime_idx" ON "TutoringSlot"("tutorId", "startTime");

-- CreateIndex
CREATE INDEX "TutoringSlot_tutorId_status_startTime_idx" ON "TutoringSlot"("tutorId", "status", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringSlot_tutorId_startTime_endTime_key" ON "TutoringSlot"("tutorId", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "GuestTutoringCheckout_stripeSessionId_key" ON "GuestTutoringCheckout"("stripeSessionId");

-- CreateIndex
CREATE INDEX "GuestTutoringCheckout_email_idx" ON "GuestTutoringCheckout"("email");

-- CreateIndex
CREATE INDEX "GuestTutoringCheckout_status_createdAt_idx" ON "GuestTutoringCheckout"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GuestTutoringCheckout_educatorId_startTime_endTime_idx" ON "GuestTutoringCheckout"("educatorId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "GuestTutoringCheckout_availabilityId_startTime_endTime_idx" ON "GuestTutoringCheckout"("availabilityId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "LearningActivity_userId_createdAt_idx" ON "LearningActivity"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TutorReview_bookingId_key" ON "TutorReview"("bookingId");

-- CreateIndex
CREATE INDEX "TutorReview_educatorId_createdAt_idx" ON "TutorReview"("educatorId", "createdAt");

-- CreateIndex
CREATE INDEX "TutorReview_learnerId_createdAt_idx" ON "TutorReview"("learnerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringSession_bookingId_key" ON "TutoringSession"("bookingId");

-- CreateIndex
CREATE INDEX "TutoringSession_learnerId_scheduledStart_idx" ON "TutoringSession"("learnerId", "scheduledStart");

-- CreateIndex
CREATE INDEX "TutoringSession_educatorId_scheduledStart_idx" ON "TutoringSession"("educatorId", "scheduledStart");

-- CreateIndex
CREATE INDEX "TutoringSession_status_scheduledStart_idx" ON "TutoringSession"("status", "scheduledStart");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringOnboardingRequest_stripeCheckoutSessionId_key" ON "TutoringOnboardingRequest"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "TutoringOnboardingRequest_email_createdAt_idx" ON "TutoringOnboardingRequest"("email", "createdAt");

-- CreateIndex
CREATE INDEX "TutoringOnboardingRequest_status_createdAt_idx" ON "TutoringOnboardingRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TutoringOnboardingRequest_assignedTutorId_createdAt_idx" ON "TutoringOnboardingRequest"("assignedTutorId", "createdAt");

-- CreateIndex
CREATE INDEX "TutoringOnboardingRequest_planAgreedAt_idx" ON "TutoringOnboardingRequest"("planAgreedAt");

-- CreateIndex
CREATE INDEX "TutoringOnboardingRequest_planAgreedById_idx" ON "TutoringOnboardingRequest"("planAgreedById");

-- CreateIndex
CREATE INDEX "TutoringOnboardingRequest_paymentStatus_updatedAt_idx" ON "TutoringOnboardingRequest"("paymentStatus", "updatedAt");

-- CreateIndex
CREATE INDEX "TutoringOnboardingRequest_paymentLinkEmailSentAt_idx" ON "TutoringOnboardingRequest"("paymentLinkEmailSentAt");

-- CreateIndex
CREATE INDEX "TutoringOnboardingRequest_learnerEmail_createdAt_idx" ON "TutoringOnboardingRequest"("learnerEmail", "createdAt");

-- CreateIndex
CREATE INDEX "TutoringOnboardingRequest_learnerUserId_createdAt_idx" ON "TutoringOnboardingRequest"("learnerUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringOnboardingPayment_stripeCheckoutSessionId_key" ON "TutoringOnboardingPayment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "TutoringOnboardingPayment_onboardingRequestId_status_idx" ON "TutoringOnboardingPayment"("onboardingRequestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringOnboardingPayment_onboardingRequestId_installmentNu_key" ON "TutoringOnboardingPayment"("onboardingRequestId", "installmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringOnboardingSession_bookingId_key" ON "TutoringOnboardingSession"("bookingId");

-- CreateIndex
CREATE INDEX "TutoringOnboardingSession_onboardingRequestId_status_idx" ON "TutoringOnboardingSession"("onboardingRequestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TutoringOnboardingSession_onboardingRequestId_sessionNumber_key" ON "TutoringOnboardingSession"("onboardingRequestId", "sessionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerSetupEmailLink_requestId_key" ON "LearnerSetupEmailLink"("requestId");

-- CreateIndex
CREATE INDEX "LearnerSetupEmailLink_expiresAt_idx" ON "LearnerSetupEmailLink"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "investment_profile_userId_key" ON "investment_profile"("userId");

-- CreateIndex
CREATE INDEX "investment_account_profileId_isActive_idx" ON "investment_account"("profileId", "isActive");

-- CreateIndex
CREATE INDEX "investment_account_provider_idx" ON "investment_account"("provider");

-- CreateIndex
CREATE INDEX "investment_asset_profileId_assetType_idx" ON "investment_asset"("profileId", "assetType");

-- CreateIndex
CREATE INDEX "investment_asset_symbol_idx" ON "investment_asset"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "investment_asset_profileId_symbol_key" ON "investment_asset"("profileId", "symbol");

-- CreateIndex
CREATE INDEX "investment_transaction_accountId_occurredAt_idx" ON "investment_transaction"("accountId", "occurredAt");

-- CreateIndex
CREATE INDEX "investment_transaction_assetId_occurredAt_idx" ON "investment_transaction"("assetId", "occurredAt");

-- CreateIndex
CREATE INDEX "investment_transaction_type_occurredAt_idx" ON "investment_transaction"("type", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "investment_transaction_accountId_externalId_key" ON "investment_transaction"("accountId", "externalId");

-- CreateIndex
CREATE INDEX "investment_price_history_assetId_priceDate_idx" ON "investment_price_history"("assetId", "priceDate");

-- CreateIndex
CREATE UNIQUE INDEX "investment_price_history_assetId_priceDate_source_key" ON "investment_price_history"("assetId", "priceDate", "source");

-- CreateIndex
CREATE INDEX "investment_exchange_rate_rateDate_idx" ON "investment_exchange_rate"("rateDate");

-- CreateIndex
CREATE UNIQUE INDEX "investment_exchange_rate_baseCurrency_quoteCurrency_rateDat_key" ON "investment_exchange_rate"("baseCurrency", "quoteCurrency", "rateDate", "source");

-- CreateIndex
CREATE UNIQUE INDEX "investment_treasury_bill_assetId_key" ON "investment_treasury_bill"("assetId");

-- CreateIndex
CREATE INDEX "investment_treasury_bill_status_maturityDate_idx" ON "investment_treasury_bill"("status", "maturityDate");

-- CreateIndex
CREATE INDEX "investment_portfolio_snapshot_profileId_snapshotDate_idx" ON "investment_portfolio_snapshot"("profileId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "investment_portfolio_snapshot_profileId_snapshotDate_baseCu_key" ON "investment_portfolio_snapshot"("profileId", "snapshotDate", "baseCurrency");

-- CreateIndex
CREATE INDEX "investment_import_batch_profileId_createdAt_idx" ON "investment_import_batch"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "investment_import_batch_status_idx" ON "investment_import_batch"("status");

-- AddForeignKey
ALTER TABLE "TeachingProfile" ADD CONSTRAINT "TeachingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingEnrollment" ADD CONSTRAINT "PendingEnrollment_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tutoringSlotId_fkey" FOREIGN KEY ("tutoringSlotId") REFERENCES "TutoringSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Whiteboard" ADD CONSTRAINT "Whiteboard_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Whiteboard" ADD CONSTRAINT "Whiteboard_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Whiteboard" ADD CONSTRAINT "Whiteboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_teachingProfileId_fkey" FOREIGN KEY ("teachingProfileId") REFERENCES "TeachingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "Availability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringReminder" ADD CONSTRAINT "TutoringReminder_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomStudent" ADD CONSTRAINT "ClassroomStudent_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomStudent" ADD CONSTRAINT "ClassroomStudent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomTeacher" ADD CONSTRAINT "ClassroomTeacher_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomTeacher" ADD CONSTRAINT "ClassroomTeacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringBooking" ADD CONSTRAINT "TutoringBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringBooking" ADD CONSTRAINT "TutoringBooking_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringBooking" ADD CONSTRAINT "TutoringBooking_tutoringSlotId_fkey" FOREIGN KEY ("tutoringSlotId") REFERENCES "TutoringSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringSlot" ADD CONSTRAINT "TutoringSlot_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorReview" ADD CONSTRAINT "TutorReview_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorReview" ADD CONSTRAINT "TutorReview_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorReview" ADD CONSTRAINT "TutorReview_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringSession" ADD CONSTRAINT "TutoringSession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringSession" ADD CONSTRAINT "TutoringSession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringSession" ADD CONSTRAINT "TutoringSession_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringSession" ADD CONSTRAINT "TutoringSession_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringOnboardingRequest" ADD CONSTRAINT "TutoringOnboardingRequest_assignedTutorId_fkey" FOREIGN KEY ("assignedTutorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringOnboardingRequest" ADD CONSTRAINT "TutoringOnboardingRequest_learnerUserId_fkey" FOREIGN KEY ("learnerUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringOnboardingRequest" ADD CONSTRAINT "TutoringOnboardingRequest_planAgreedById_fkey" FOREIGN KEY ("planAgreedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringOnboardingPayment" ADD CONSTRAINT "TutoringOnboardingPayment_onboardingRequestId_fkey" FOREIGN KEY ("onboardingRequestId") REFERENCES "TutoringOnboardingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringOnboardingSession" ADD CONSTRAINT "TutoringOnboardingSession_onboardingRequestId_fkey" FOREIGN KEY ("onboardingRequestId") REFERENCES "TutoringOnboardingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringOnboardingSession" ADD CONSTRAINT "TutoringOnboardingSession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_profile" ADD CONSTRAINT "investment_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_account" ADD CONSTRAINT "investment_account_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "investment_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_asset" ADD CONSTRAINT "investment_asset_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "investment_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_transaction" ADD CONSTRAINT "investment_transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "investment_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_transaction" ADD CONSTRAINT "investment_transaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "investment_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_transaction" ADD CONSTRAINT "investment_transaction_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "investment_import_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_price_history" ADD CONSTRAINT "investment_price_history_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "investment_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_treasury_bill" ADD CONSTRAINT "investment_treasury_bill_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "investment_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_portfolio_snapshot" ADD CONSTRAINT "investment_portfolio_snapshot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "investment_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_import_batch" ADD CONSTRAINT "investment_import_batch_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "investment_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_import_batch" ADD CONSTRAINT "investment_import_batch_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "investment_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
