-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('ONE_OFF', 'RECURRING', 'OCCURRENCE');

-- CreateEnum
CREATE TYPE "TutoringReminderType" AS ENUM ('TWENTY_FOUR_HOURS', 'ONE_HOUR');

-- CreateEnum
CREATE TYPE "TutoringSessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('WORKSHEET', 'WORKBOOK', 'QUIZ', 'ASSESSMENT', 'LESSON_PLAN', 'ASSIGNMENT', 'STUDY_GUIDE', 'FLASHCARDS', 'PRESENTATION', 'READING', 'IMAGE', 'DOCUMENT', 'GAME', 'QUESTION_BANK', 'VIDEO');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ResourceVisibility" AS ENUM ('PRIVATE', 'LINK_SHARED', 'PUBLIC', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "ResourceAccessType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "AIConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AIMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "ClassroomStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('PARENT', 'GUARDIAN', 'CHILD');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('SCHOOL', 'DISTRICT', 'TUTORING_CENTER', 'HOMESCHOOL', 'EDUCATIONAL_INSTITUTION', 'OTHER');

-- CreateEnum
CREATE TYPE "TutoringBookingStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'SCHEDULED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('Pending', 'Accepted', 'Rejected', 'Blocked');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('TUTORING', 'GROUP_CLASS', 'COURSE', 'CONSULTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('Draft', 'Published', 'Archived');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('Scheduled', 'PendingPayment', 'Completed', 'Cancelled', 'NoShow');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('Beginner', 'Intermediate', 'Advanced');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('Draft', 'Published', 'Archived');

-- CreateEnum
CREATE TYPE "CourseEnrollmentStatus" AS ENUM ('Pending', 'Active', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('Owner', 'Admin', 'Educator', 'Member');

-- CreateEnum
CREATE TYPE "InvestmentTransactionType" AS ENUM ('BUY', 'SELL', 'DIVIDEND', 'DRIP', 'INTEREST', 'FEE', 'TAX', 'CONTRIBUTION', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'CASH', 'HOLDING_SNAPSHOT', 'OTHER');

-- CreateEnum
CREATE TYPE "VideoGenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Suspended', 'Pending', 'Deleted');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('Pending', 'Verified', 'Rejected');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('Available', 'Booked', 'Blocked');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'Pending_payment');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('Course', 'Worksheets', 'Workbooks', 'Planners', 'Journals', 'Templates', 'Checklists', 'Trackers', 'Guides', 'Bundles');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('Draft', 'Pending', 'Published', 'Rejected');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('Pending', 'Active', 'Cancelled');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('Unpaid', 'Processing', 'Paid');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('Pending', 'Paid', 'Failed');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('Free', 'FlexPay_30m', 'FlexPay_45m', 'FlexPay_60m', 'Monthly');

-- CreateEnum
CREATE TYPE "PendingEnrollmentStatus" AS ENUM ('Pending', 'Enrolled', 'Cancelled');

-- CreateEnum
CREATE TYPE "EnrollmentTrack" AS ENUM ('Hourly', 'Monthly');

-- CreateEnum
CREATE TYPE "InvestmentAccountType" AS ENUM ('BROKERAGE', 'RETIREMENT', 'PENSION', 'MUTUAL_FUND', 'BANK_INVESTMENT', 'TREASURY', 'BOND_ACCOUNT', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestmentAssetType" AS ENUM ('STOCK', 'ETF', 'MUTUAL_FUND', 'BOND', 'TREASURY_BILL', 'TREASURY_NOTE', 'TREASURY_BOND', 'CASH', 'MONEY_MARKET', 'REIT', 'CRYPTO', 'REAL_ESTATE', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestmentReportType" AS ENUM ('BROKERAGE_STATEMENT', 'TRANSACTION_REPORT', 'HOLDINGS_REPORT', 'BANK_STATEMENT', 'MUTUAL_FUND_STATEMENT', 'TREASURY_STATEMENT', 'TAX_REPORT', 'CSV_EXPORT', 'XLSX_EXPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestmentImportStatus" AS ENUM ('PENDING', 'REVIEW', 'APPROVED', 'IMPORTED', 'PARTIALLY_IMPORTED', 'REJECTED', 'DUPLICATE', 'FAILED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('ETF', 'STOCK', 'CRYPTO', 'REAL_ESTATE', 'BOND', 'CASH_EQUIVALENT');

-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('USA', 'GHANA', 'GLOBAL');

-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('USD', 'GHS');

-- CreateEnum
CREATE TYPE "StatusType" AS ENUM ('ACTIVE', 'PENDING', 'EXITED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL', 'DRIP', 'CASH');

-- CreateEnum
CREATE TYPE "GradeLevel" AS ENUM ('Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6', 'Grade7', 'Grade8', 'Grade9', 'Grade10', 'Grade11', 'Grade12');

-- CreateEnum
CREATE TYPE "ProductAccessModel" AS ENUM ('INDIVIDUAL', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'GRANT', 'RESERVATION', 'CONSUMPTION', 'RELEASE', 'REFUND', 'EARNING', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CreditReservationStatus" AS ENUM ('ACTIVE', 'SETTLED', 'RELEASED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AIGenerationOperation" AS ENUM ('CHAT', 'RESEARCH', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'WORKSHEET', 'QUIZ', 'LESSON_PLAN', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "AIGenerationType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'WORKSHEET', 'WORKBOOK', 'QUIZ', 'LESSON_PLAN', 'PRESENTATION', 'STORY', 'THUMBNAIL');

-- CreateEnum
CREATE TYPE "AIGenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AIAssetType" AS ENUM ('DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "AIProjectType" AS ENUM ('GENERAL', 'WORKSHEET', 'WORKBOOK', 'LESSON', 'QUIZ', 'VIDEO', 'STORY', 'PRESENTATION', 'YOUTUBE', 'JUSTDY_KIDZ');

-- CreateEnum
CREATE TYPE "AIProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "AIPlanType" AS ENUM ('FREE', 'CREATOR', 'PRO', 'STUDIO', 'SCHOOL');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "PlatformRole" NOT NULL DEFAULT 'USER',
    "imageUrl" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'Active',
    "lastLoginAt" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'Pending',
    "canCreateResources" BOOLEAN NOT NULL DEFAULT false,
    "canLearn" BOOLEAN NOT NULL DEFAULT true,
    "canManageChildren" BOOLEAN NOT NULL DEFAULT false,
    "canManageSchool" BOOLEAN NOT NULL DEFAULT false,
    "canPublish" BOOLEAN NOT NULL DEFAULT false,
    "canSell" BOOLEAN NOT NULL DEFAULT false,
    "canTeach" BOOLEAN NOT NULL DEFAULT false,
    "canTutor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
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
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER,
    "printedPrice" INTEGER,
    "stripePriceId" TEXT,
    "slug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'Draft',
    "duration" INTEGER,
    "category" TEXT,
    "imageKey" TEXT,
    "fileKey" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accessModel" "ProductAccessModel" NOT NULL DEFAULT 'INDIVIDUAL',
    "gradeLevel" "GradeLevel" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "gradeLevel" "GradeLevel" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailKey" TEXT,
    "videoKey" TEXT,
    "position" INTEGER NOT NULL,
    "chapterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Paid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'Pending',
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastLessonId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "interval" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "planId" "PlanType" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "InvestmentAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institution" TEXT NOT NULL DEFAULT 'Fidelity Investments',
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT,
    "accountType" "InvestmentAccountType" NOT NULL DEFAULT 'BROKERAGE',
    "currency" "CurrencyType" NOT NULL DEFAULT 'USD',
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tickerOrSymbol" TEXT,
    "cusip" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "institution" TEXT DEFAULT 'Fidelity Investments',
    "assetClass" "AssetType" NOT NULL,
    "region" "RegionType" NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "type" "InvestmentTransactionType" NOT NULL,
    "shares" DOUBLE PRECISION,
    "pricePerShare" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION NOT NULL,
    "grossAmount" DOUBLE PRECISION,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costBasis" DOUBLE PRECISION,
    "realizedGain" DOUBLE PRECISION,
    "marketValue" DOUBLE PRECISION,
    "unrealizedGain" DOUBLE PRECISION,
    "unrealizedGainPercent" DOUBLE PRECISION,
    "cashBalance" DOUBLE PRECISION,
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "amountUSD" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "settlementDate" TIMESTAMP(3),
    "source" TEXT,
    "sourceFile" TEXT,
    "importBatchId" TEXT,
    "fingerprint" TEXT,
    "status" "StatusType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "tickerOrSymbol" TEXT,
    "isin" TEXT,
    "cusip" TEXT,
    "assetType" "InvestmentAssetType" NOT NULL,
    "region" "RegionType" NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "exchange" TEXT,
    "country" TEXT,
    "marketDataSymbol" TEXT,
    "marketDataProvider" TEXT,
    "issuer" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "assetId" TEXT,
    "type" "InvestmentTransactionType" NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "settlementDate" TIMESTAMP(3),
    "quantity" DECIMAL(24,10),
    "price" DECIMAL(24,10),
    "grossAmount" DECIMAL(24,10),
    "fees" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "taxes" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(24,10),
    "currency" "CurrencyType" NOT NULL,
    "fxRateToUSD" DECIMAL(24,12) NOT NULL DEFAULT 1,
    "amountUSD" DECIMAL(24,10),
    "amountGHS" DECIMAL(24,10),
    "faceValue" DECIMAL(24,10),
    "maturityDate" TIMESTAMP(3),
    "yieldRate" DECIMAL(12,8),
    "source" TEXT,
    "sourceReference" TEXT,
    "sourceReportId" TEXT,
    "sourceRowNumber" INTEGER,
    "fingerprint" TEXT NOT NULL,
    "importStatus" "InvestmentImportStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentHolding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "quantity" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "averageCost" DECIMAL(24,10),
    "costBasis" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "currentPrice" DECIMAL(24,10),
    "marketValue" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "realizedGain" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "unrealizedGain" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "unrealizedGainPct" DECIMAL(18,8),
    "incomeReceived" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "currency" "CurrencyType" NOT NULL,
    "marketValueUSD" DECIMAL(24,10),
    "marketValueGHS" DECIMAL(24,10),
    "lastPriceAt" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentPrice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "price" DECIMAL(24,10) NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "isRealtime" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentFXRate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "base" "CurrencyType" NOT NULL,
    "quote" "CurrencyType" NOT NULL,
    "rate" DECIMAL(24,12) NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentFXRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "sha256" TEXT,
    "reportType" "InvestmentReportType" NOT NULL,
    "statementStartDate" TIMESTAMP(3),
    "statementEndDate" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "importStatus" "InvestmentImportStatus" NOT NULL DEFAULT 'PENDING',
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentPortfolioSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "reportingCurrency" "CurrencyType" NOT NULL DEFAULT 'USD',
    "totalValue" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "cashValue" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "investedValue" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "costBasis" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "realizedGain" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "unrealizedGain" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "dividendsAndInterest" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "feesAndTaxes" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "contributions" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "withdrawals" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "timeWeightedReturn" DECIMAL(18,10),
    "moneyWeightedReturn" DECIMAL(18,10),
    "fxRateToUSD" DECIMAL(24,12),
    "fxRateToGHS" DECIMAL(24,12),
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentPortfolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(24,10) NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "startingAmount" DECIMAL(24,10) NOT NULL DEFAULT 0,
    "expectedAnnualReturn" DECIMAL(12,8),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentAllocationTarget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetType" "InvestmentAssetType" NOT NULL,
    "targetPct" DECIMAL(8,4) NOT NULL,
    "minPct" DECIMAL(8,4),
    "maxPct" DECIMAL(8,4),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentAllocationTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentAuditLog_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "SiteVisitor" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pageViews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SiteVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitePageView" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SitePageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoGeneration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "prompt" TEXT NOT NULL,
    "style" TEXT,
    "duration" INTEGER NOT NULL,
    "aspectRatio" TEXT NOT NULL DEFAULT '16:9',
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "providerTaskId" TEXT,
    "status" "VideoGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "creditChargedAt" TIMESTAMP(3),
    "creditRefundedAt" TIMESTAMP(3),
    "requestId" TEXT,
    "gradeLevel" "GradeLevel",
    "subjectId" TEXT,
    "topicId" TEXT,

    CONSTRAINT "VideoGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "reservedBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditReservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userCreditId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "CreditReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "description" TEXT,
    "idempotencyKey" TEXT,
    "expiresAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userCreditId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "description" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "idempotencyKey" TEXT,
    "generationId" TEXT,
    "aiGenerationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGeneration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "type" "AIGenerationType" NOT NULL,
    "status" "AIGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "inputData" JSONB,
    "outputData" JSONB,
    "provider" TEXT,
    "model" TEXT,
    "providerTaskId" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creditChargedAt" TIMESTAMP(3),
    "creditOperation" "AIGenerationOperation",
    "creditRefundedAt" TIMESTAMP(3),
    "operation" "AIGenerationOperation",
    "requestId" TEXT,

    CONSTRAINT "AIGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "AIProjectType" NOT NULL DEFAULT 'GENERAL',
    "status" "AIProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "context" JSONB,

    CONSTRAINT "AIProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "generationId" TEXT,
    "type" "AIAssetType" NOT NULL,
    "name" TEXT NOT NULL,
    "fileKey" TEXT,
    "url" TEXT,
    "thumbnailUrl" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gradeLevel" "GradeLevel",
    "schoolName" TEXT,
    "learningGoals" TEXT,
    "preferredSubjects" JSONB,
    "interests" JSONB,
    "preferredLanguage" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningProfile_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "CreatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "specialties" JSONB,
    "websiteUrl" TEXT,
    "socialLinks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCapability" (
    "userId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCapability_pkey" PRIMARY KEY ("userId","capabilityId")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("userId","permission")
);

-- CreateTable
CREATE TABLE "Follow" (
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId","followingId")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "smallDescription" TEXT,
    "thumbnailKey" TEXT,
    "price" INTEGER,
    "duration" INTEGER,
    "level" "CourseLevel" NOT NULL DEFAULT 'Beginner',
    "category" TEXT,
    "status" "CourseStatus" NOT NULL DEFAULT 'Draft',
    "stripePriceId" TEXT,
    "userId" TEXT NOT NULL,
    "teachingProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "amount" INTEGER,
    "status" "CourseEnrollmentStatus" NOT NULL DEFAULT 'Pending',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'SCHOOL',
    "description" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FamilyRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("familyId","userId")
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
CREATE TABLE "AIRateLimitBucket" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRateLimitBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "model" TEXT,
    "status" "AIConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activeMessageId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AIMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "metadata" JSONB,
    "generationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentMessageId" TEXT,
    "videoGenerationId" TEXT,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveHomeworkTeacherAvailability" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveHomeworkTeacherAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveHomeworkRequest" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "teacherId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "subject" TEXT NOT NULL,
    "gradeLevel" TEXT,
    "topic" TEXT,
    "description" TEXT NOT NULL,
    "assignmentUrl" TEXT,
    "assignmentName" TEXT,
    "assignmentType" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waitingAt" TIMESTAMP(3),
    "selectedAt" TIMESTAMP(3),
    "connectingAt" TIMESTAMP(3),
    "activeAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "selectedByTeacherId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveHomeworkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveHomeworkSession" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONNECTING',
    "classroomId" TEXT,
    "classroomToken" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "billableSeconds" INTEGER NOT NULL DEFAULT 0,
    "teacherRate" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" INTEGER,
    "platformFee" INTEGER,
    "teacherEarnings" INTEGER,
    "totalAmount" INTEGER,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Pending',
    "whiteboardId" TEXT,
    "sessionNotes" TEXT,
    "learnerOutcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveHomeworkSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
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
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "subject" TEXT,
    "topic" TEXT,
    "grade" TEXT,
    "difficulty" TEXT,
    "learningObjectives" JSONB,
    "standards" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ResourceVisibility" NOT NULL DEFAULT 'PRIVATE',
    "accessType" "ResourceAccessType" NOT NULL DEFAULT 'FREE',
    "price" INTEGER,
    "currency" TEXT DEFAULT 'USD',
    "thumbnailUrl" TEXT,
    "thumbnailAssetId" TEXT,
    "content" JSONB,
    "answerKey" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceVersion" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" JSONB,
    "answerKey" JSONB,
    "editorState" JSONB,
    "metadata" JSONB,
    "generationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_stripeCustomerId_key" ON "user"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

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
CREATE UNIQUE INDEX "Product_stripePriceId_key" ON "Product"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_gradeLevel_idx" ON "Product"("gradeLevel");

-- CreateIndex
CREATE INDEX "Product_subjectId_idx" ON "Product"("subjectId");

-- CreateIndex
CREATE INDEX "Product_topicId_idx" ON "Product"("topicId");

-- CreateIndex
CREATE INDEX "Product_gradeLevel_subjectId_topicId_idx" ON "Product"("gradeLevel", "subjectId", "topicId");

-- CreateIndex
CREATE INDEX "Product_gradeLevel_subjectId_topicId_type_idx" ON "Product"("gradeLevel", "subjectId", "topicId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "Topic_gradeLevel_subjectId_idx" ON "Topic"("gradeLevel", "subjectId");

-- CreateIndex
CREATE INDEX "Topic_gradeLevel_subjectId_slug_idx" ON "Topic"("gradeLevel", "subjectId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_subjectId_gradeLevel_slug_key" ON "Topic"("subjectId", "gradeLevel", "slug");

-- CreateIndex
CREATE INDEX "Chapter_productId_idx" ON "Chapter"("productId");

-- CreateIndex
CREATE INDEX "Chapter_courseId_idx" ON "Chapter"("courseId");

-- CreateIndex
CREATE INDEX "Lesson_chapterId_idx" ON "Lesson"("chapterId");

-- CreateIndex
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");

-- CreateIndex
CREATE INDEX "Purchase_productId_idx" ON "Purchase"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_stripeSessionId_productId_key" ON "Purchase"("stripeSessionId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_productId_key" ON "Enrollment"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentProgress_userId_productId_key" ON "EnrollmentProgress"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON "LessonProgress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Payout_status_createdAt_idx" ON "Payout"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payout_educatorId_status_idx" ON "Payout"("educatorId", "status");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "InvestmentAccount_userId_idx" ON "InvestmentAccount"("userId");

-- CreateIndex
CREATE INDEX "InvestmentAccount_userId_currency_idx" ON "InvestmentAccount"("userId", "currency");

-- CreateIndex
CREATE INDEX "InvestmentAccount_userId_isActive_idx" ON "InvestmentAccount"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentAccount_userId_institution_accountNumber_key" ON "InvestmentAccount"("userId", "institution", "accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Investment_fingerprint_key" ON "Investment"("fingerprint");

-- CreateIndex
CREATE INDEX "Investment_userId_date_idx" ON "Investment"("userId", "date");

-- CreateIndex
CREATE INDEX "Investment_userId_tickerOrSymbol_idx" ON "Investment"("userId", "tickerOrSymbol");

-- CreateIndex
CREATE INDEX "Investment_userId_accountNumber_idx" ON "Investment"("userId", "accountNumber");

-- CreateIndex
CREATE INDEX "Investment_userId_type_idx" ON "Investment"("userId", "type");

-- CreateIndex
CREATE INDEX "Investment_userId_importBatchId_idx" ON "Investment"("userId", "importBatchId");

-- CreateIndex
CREATE INDEX "InvestmentAsset_userId_symbol_idx" ON "InvestmentAsset"("userId", "symbol");

-- CreateIndex
CREATE INDEX "InvestmentAsset_userId_tickerOrSymbol_idx" ON "InvestmentAsset"("userId", "tickerOrSymbol");

-- CreateIndex
CREATE INDEX "InvestmentAsset_userId_isin_idx" ON "InvestmentAsset"("userId", "isin");

-- CreateIndex
CREATE INDEX "InvestmentAsset_userId_cusip_idx" ON "InvestmentAsset"("userId", "cusip");

-- CreateIndex
CREATE INDEX "InvestmentAsset_userId_assetType_idx" ON "InvestmentAsset"("userId", "assetType");

-- CreateIndex
CREATE INDEX "InvestmentAsset_userId_region_idx" ON "InvestmentAsset"("userId", "region");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentTransaction_fingerprint_key" ON "InvestmentTransaction"("fingerprint");

-- CreateIndex
CREATE INDEX "InvestmentTransaction_userId_transactionDate_idx" ON "InvestmentTransaction"("userId", "transactionDate");

-- CreateIndex
CREATE INDEX "InvestmentTransaction_accountId_transactionDate_idx" ON "InvestmentTransaction"("accountId", "transactionDate");

-- CreateIndex
CREATE INDEX "InvestmentTransaction_assetId_transactionDate_idx" ON "InvestmentTransaction"("assetId", "transactionDate");

-- CreateIndex
CREATE INDEX "InvestmentTransaction_accountId_type_idx" ON "InvestmentTransaction"("accountId", "type");

-- CreateIndex
CREATE INDEX "InvestmentTransaction_sourceReportId_idx" ON "InvestmentTransaction"("sourceReportId");

-- CreateIndex
CREATE INDEX "InvestmentTransaction_importStatus_idx" ON "InvestmentTransaction"("importStatus");

-- CreateIndex
CREATE INDEX "InvestmentHolding_userId_assetId_idx" ON "InvestmentHolding"("userId", "assetId");

-- CreateIndex
CREATE INDEX "InvestmentHolding_userId_accountId_idx" ON "InvestmentHolding"("userId", "accountId");

-- CreateIndex
CREATE INDEX "InvestmentHolding_userId_updatedAt_idx" ON "InvestmentHolding"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentHolding_accountId_assetId_key" ON "InvestmentHolding"("accountId", "assetId");

-- CreateIndex
CREATE INDEX "InvestmentPrice_userId_assetId_asOf_idx" ON "InvestmentPrice"("userId", "assetId", "asOf");

-- CreateIndex
CREATE INDEX "InvestmentPrice_assetId_asOf_idx" ON "InvestmentPrice"("assetId", "asOf");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentPrice_assetId_asOf_key" ON "InvestmentPrice"("assetId", "asOf");

-- CreateIndex
CREATE INDEX "InvestmentFXRate_base_quote_asOf_idx" ON "InvestmentFXRate"("base", "quote", "asOf");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentFXRate_userId_base_quote_asOf_key" ON "InvestmentFXRate"("userId", "base", "quote", "asOf");

-- CreateIndex
CREATE INDEX "InvestmentReport_userId_uploadedAt_idx" ON "InvestmentReport"("userId", "uploadedAt");

-- CreateIndex
CREATE INDEX "InvestmentReport_accountId_uploadedAt_idx" ON "InvestmentReport"("accountId", "uploadedAt");

-- CreateIndex
CREATE INDEX "InvestmentReport_importStatus_idx" ON "InvestmentReport"("importStatus");

-- CreateIndex
CREATE INDEX "InvestmentReport_sha256_idx" ON "InvestmentReport"("sha256");

-- CreateIndex
CREATE INDEX "InvestmentPortfolioSnapshot_userId_snapshotDate_idx" ON "InvestmentPortfolioSnapshot"("userId", "snapshotDate");

-- CreateIndex
CREATE INDEX "InvestmentPortfolioSnapshot_userId_capturedAt_idx" ON "InvestmentPortfolioSnapshot"("userId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentPortfolioSnapshot_userId_snapshotDate_reportingCu_key" ON "InvestmentPortfolioSnapshot"("userId", "snapshotDate", "reportingCurrency");

-- CreateIndex
CREATE INDEX "InvestmentGoal_userId_isActive_idx" ON "InvestmentGoal"("userId", "isActive");

-- CreateIndex
CREATE INDEX "InvestmentGoal_userId_targetDate_idx" ON "InvestmentGoal"("userId", "targetDate");

-- CreateIndex
CREATE INDEX "InvestmentAllocationTarget_userId_active_idx" ON "InvestmentAllocationTarget"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentAllocationTarget_userId_assetType_key" ON "InvestmentAllocationTarget"("userId", "assetType");

-- CreateIndex
CREATE INDEX "InvestmentAuditLog_userId_createdAt_idx" ON "InvestmentAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InvestmentAuditLog_entityType_entityId_idx" ON "InvestmentAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "InvestmentAuditLog_action_createdAt_idx" ON "InvestmentAuditLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Whiteboard_appointmentId_key" ON "Whiteboard"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Whiteboard_bookingId_key" ON "Whiteboard"("bookingId");

-- CreateIndex
CREATE INDEX "Whiteboard_userId_idx" ON "Whiteboard"("userId");

-- CreateIndex
CREATE INDEX "Whiteboard_userId_isStandalone_idx" ON "Whiteboard"("userId", "isStandalone");

-- CreateIndex
CREATE UNIQUE INDEX "SiteVisitor_visitorId_key" ON "SiteVisitor"("visitorId");

-- CreateIndex
CREATE INDEX "SiteVisitor_lastSeen_idx" ON "SiteVisitor"("lastSeen");

-- CreateIndex
CREATE INDEX "SiteVisitor_firstSeen_idx" ON "SiteVisitor"("firstSeen");

-- CreateIndex
CREATE INDEX "SitePageView_visitorId_idx" ON "SitePageView"("visitorId");

-- CreateIndex
CREATE INDEX "SitePageView_createdAt_idx" ON "SitePageView"("createdAt");

-- CreateIndex
CREATE INDEX "SitePageView_path_idx" ON "SitePageView"("path");

-- CreateIndex
CREATE UNIQUE INDEX "VideoGeneration_requestId_key" ON "VideoGeneration"("requestId");

-- CreateIndex
CREATE INDEX "VideoGeneration_userId_createdAt_idx" ON "VideoGeneration"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoGeneration_status_idx" ON "VideoGeneration"("status");

-- CreateIndex
CREATE INDEX "VideoGeneration_providerTaskId_idx" ON "VideoGeneration"("providerTaskId");

-- CreateIndex
CREATE INDEX "VideoGeneration_requestId_idx" ON "VideoGeneration"("requestId");

-- CreateIndex
CREATE INDEX "VideoGeneration_subjectId_idx" ON "VideoGeneration"("subjectId");

-- CreateIndex
CREATE INDEX "VideoGeneration_topicId_idx" ON "VideoGeneration"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredit_userId_key" ON "UserCredit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditReservation_idempotencyKey_key" ON "CreditReservation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CreditReservation_userId_idx" ON "CreditReservation"("userId");

-- CreateIndex
CREATE INDEX "CreditReservation_userCreditId_idx" ON "CreditReservation"("userCreditId");

-- CreateIndex
CREATE INDEX "CreditReservation_status_idx" ON "CreditReservation"("status");

-- CreateIndex
CREATE INDEX "CreditReservation_referenceType_referenceId_idx" ON "CreditReservation"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "CreditReservation_expiresAt_idx" ON "CreditReservation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_idempotencyKey_key" ON "CreditTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_userCreditId_idx" ON "CreditTransaction"("userCreditId");

-- CreateIndex
CREATE INDEX "CreditTransaction_generationId_idx" ON "CreditTransaction"("generationId");

-- CreateIndex
CREATE INDEX "CreditTransaction_aiGenerationId_idx" ON "CreditTransaction"("aiGenerationId");

-- CreateIndex
CREATE INDEX "CreditTransaction_referenceType_referenceId_idx" ON "CreditTransaction"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AIGeneration_requestId_key" ON "AIGeneration"("requestId");

-- CreateIndex
CREATE INDEX "AIGeneration_userId_createdAt_idx" ON "AIGeneration"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIGeneration_projectId_idx" ON "AIGeneration"("projectId");

-- CreateIndex
CREATE INDEX "AIGeneration_status_idx" ON "AIGeneration"("status");

-- CreateIndex
CREATE INDEX "AIGeneration_providerTaskId_idx" ON "AIGeneration"("providerTaskId");

-- CreateIndex
CREATE INDEX "AIGeneration_userId_requestId_idx" ON "AIGeneration"("userId", "requestId");

-- CreateIndex
CREATE INDEX "AIProject_userId_updatedAt_idx" ON "AIProject"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "AIAsset_userId_createdAt_idx" ON "AIAsset"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIAsset_projectId_idx" ON "AIAsset"("projectId");

-- CreateIndex
CREATE INDEX "AIAsset_generationId_idx" ON "AIAsset"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProfile_userId_key" ON "LearningProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingProfile_userId_key" ON "TeachingProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_key_key" ON "Capability"("key");

-- CreateIndex
CREATE INDEX "UserCapability_capabilityId_idx" ON "UserCapability"("capabilityId");

-- CreateIndex
CREATE INDEX "UserPermission_permission_idx" ON "UserPermission"("permission");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE INDEX "Connection_receiverId_status_idx" ON "Connection"("receiverId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_requesterId_receiverId_key" ON "Connection"("requesterId", "receiverId");

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
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_stripePriceId_key" ON "Course"("stripePriceId");

-- CreateIndex
CREATE INDEX "Course_userId_status_idx" ON "Course"("userId", "status");

-- CreateIndex
CREATE INDEX "Course_teachingProfileId_idx" ON "Course"("teachingProfileId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_learnerId_status_idx" ON "CourseEnrollment"("learnerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_courseId_learnerId_key" ON "CourseEnrollment"("courseId", "learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "Organization_type_status_idx" ON "Organization"("type", "status");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organizationId_role_idx" ON "OrganizationMembership"("organizationId", "role");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organizationId_status_idx" ON "OrganizationMembership"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");

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
CREATE INDEX "FamilyMember_familyId_role_idx" ON "FamilyMember"("familyId", "role");

-- CreateIndex
CREATE INDEX "FamilyMember_userId_idx" ON "FamilyMember"("userId");

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
CREATE UNIQUE INDEX "AIRateLimitBucket_key_key" ON "AIRateLimitBucket"("key");

-- CreateIndex
CREATE INDEX "AIRateLimitBucket_windowStart_idx" ON "AIRateLimitBucket"("windowStart");

-- CreateIndex
CREATE INDEX "AIConversation_activeMessageId_idx" ON "AIConversation"("activeMessageId");

-- CreateIndex
CREATE INDEX "AIConversation_projectId_idx" ON "AIConversation"("projectId");

-- CreateIndex
CREATE INDEX "AIConversation_userId_status_idx" ON "AIConversation"("userId", "status");

-- CreateIndex
CREATE INDEX "AIConversation_userId_updatedAt_idx" ON "AIConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_createdAt_idx" ON "AIMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AIMessage_generationId_idx" ON "AIMessage"("generationId");

-- CreateIndex
CREATE INDEX "AIMessage_parentMessageId_idx" ON "AIMessage"("parentMessageId");

-- CreateIndex
CREATE INDEX "AIMessage_userId_createdAt_idx" ON "AIMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIMessage_videoGenerationId_idx" ON "AIMessage"("videoGenerationId");

-- CreateIndex
CREATE UNIQUE INDEX "LiveHomeworkTeacherAvailability_teacherId_key" ON "LiveHomeworkTeacherAvailability"("teacherId");

-- CreateIndex
CREATE INDEX "LiveHomeworkTeacherAvailability_isAvailable_updatedAt_idx" ON "LiveHomeworkTeacherAvailability"("isAvailable", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LiveHomeworkRequest_sessionId_key" ON "LiveHomeworkRequest"("sessionId");

-- CreateIndex
CREATE INDEX "LiveHomeworkRequest_status_requestedAt_idx" ON "LiveHomeworkRequest"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "LiveHomeworkRequest_subject_status_requestedAt_idx" ON "LiveHomeworkRequest"("subject", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "LiveHomeworkRequest_gradeLevel_status_requestedAt_idx" ON "LiveHomeworkRequest"("gradeLevel", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "LiveHomeworkRequest_learnerId_createdAt_idx" ON "LiveHomeworkRequest"("learnerId", "createdAt");

-- CreateIndex
CREATE INDEX "LiveHomeworkRequest_teacherId_status_idx" ON "LiveHomeworkRequest"("teacherId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LiveHomeworkSession_requestId_key" ON "LiveHomeworkSession"("requestId");

-- CreateIndex
CREATE INDEX "LiveHomeworkSession_learnerId_createdAt_idx" ON "LiveHomeworkSession"("learnerId", "createdAt");

-- CreateIndex
CREATE INDEX "LiveHomeworkSession_teacherId_createdAt_idx" ON "LiveHomeworkSession"("teacherId", "createdAt");

-- CreateIndex
CREATE INDEX "LiveHomeworkSession_status_createdAt_idx" ON "LiveHomeworkSession"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LearningActivity_userId_createdAt_idx" ON "LearningActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LearningActivity_resourceId_createdAt_idx" ON "LearningActivity"("resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "LearningActivity_resourceId_userId_createdAt_idx" ON "LearningActivity"("resourceId", "userId", "createdAt");

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
CREATE UNIQUE INDEX "Resource_slug_key" ON "Resource"("slug");

-- CreateIndex
CREATE INDEX "Resource_userId_updatedAt_idx" ON "Resource"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Resource_projectId_idx" ON "Resource"("projectId");

-- CreateIndex
CREATE INDEX "Resource_type_idx" ON "Resource"("type");

-- CreateIndex
CREATE INDEX "Resource_status_idx" ON "Resource"("status");

-- CreateIndex
CREATE INDEX "Resource_visibility_idx" ON "Resource"("visibility");

-- CreateIndex
CREATE INDEX "Resource_subject_idx" ON "Resource"("subject");

-- CreateIndex
CREATE INDEX "Resource_grade_idx" ON "Resource"("grade");

-- CreateIndex
CREATE INDEX "Resource_topic_idx" ON "Resource"("topic");

-- CreateIndex
CREATE INDEX "Resource_createdAt_idx" ON "Resource"("createdAt");

-- CreateIndex
CREATE INDEX "ResourceVersion_resourceId_createdAt_idx" ON "ResourceVersion"("resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceVersion_generationId_idx" ON "ResourceVersion"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceVersion_resourceId_versionNumber_key" ON "ResourceVersion"("resourceId", "versionNumber");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilitatorProfile" ADD CONSTRAINT "FacilitatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Product" ADD CONSTRAINT "Product_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentProgress" ADD CONSTRAINT "EnrollmentProgress_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentProgress" ADD CONSTRAINT "EnrollmentProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentAccount" ADD CONSTRAINT "InvestmentAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentAsset" ADD CONSTRAINT "InvestmentAsset_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentAsset" ADD CONSTRAINT "InvestmentAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentTransaction" ADD CONSTRAINT "InvestmentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentTransaction" ADD CONSTRAINT "InvestmentTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentTransaction" ADD CONSTRAINT "InvestmentTransaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "InvestmentAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentTransaction" ADD CONSTRAINT "InvestmentTransaction_sourceReportId_fkey" FOREIGN KEY ("sourceReportId") REFERENCES "InvestmentReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentHolding" ADD CONSTRAINT "InvestmentHolding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentHolding" ADD CONSTRAINT "InvestmentHolding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentHolding" ADD CONSTRAINT "InvestmentHolding_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "InvestmentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPrice" ADD CONSTRAINT "InvestmentPrice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPrice" ADD CONSTRAINT "InvestmentPrice_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "InvestmentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentFXRate" ADD CONSTRAINT "InvestmentFXRate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentReport" ADD CONSTRAINT "InvestmentReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentReport" ADD CONSTRAINT "InvestmentReport_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPortfolioSnapshot" ADD CONSTRAINT "InvestmentPortfolioSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentGoal" ADD CONSTRAINT "InvestmentGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentAllocationTarget" ADD CONSTRAINT "InvestmentAllocationTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentAuditLog" ADD CONSTRAINT "InvestmentAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Whiteboard" ADD CONSTRAINT "Whiteboard_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Whiteboard" ADD CONSTRAINT "Whiteboard_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Whiteboard" ADD CONSTRAINT "Whiteboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitePageView" ADD CONSTRAINT "SitePageView_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "SiteVisitor"("visitorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoGeneration" ADD CONSTRAINT "VideoGeneration_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoGeneration" ADD CONSTRAINT "VideoGeneration_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoGeneration" ADD CONSTRAINT "VideoGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCredit" ADD CONSTRAINT "UserCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditReservation" ADD CONSTRAINT "CreditReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditReservation" ADD CONSTRAINT "CreditReservation_userCreditId_fkey" FOREIGN KEY ("userCreditId") REFERENCES "UserCredit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_aiGenerationId_fkey" FOREIGN KEY ("aiGenerationId") REFERENCES "AIGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "VideoGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userCreditId_fkey" FOREIGN KEY ("userCreditId") REFERENCES "UserCredit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGeneration" ADD CONSTRAINT "AIGeneration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AIProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGeneration" ADD CONSTRAINT "AIGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIProject" ADD CONSTRAINT "AIProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAsset" ADD CONSTRAINT "AIAsset_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "AIGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAsset" ADD CONSTRAINT "AIAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AIProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAsset" ADD CONSTRAINT "AIAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProfile" ADD CONSTRAINT "LearningProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingProfile" ADD CONSTRAINT "TeachingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCapability" ADD CONSTRAINT "UserCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCapability" ADD CONSTRAINT "UserCapability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_teachingProfileId_fkey" FOREIGN KEY ("teachingProfileId") REFERENCES "TeachingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "Course" ADD CONSTRAINT "Course_teachingProfileId_fkey" FOREIGN KEY ("teachingProfileId") REFERENCES "TeachingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomStudent" ADD CONSTRAINT "ClassroomStudent_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomStudent" ADD CONSTRAINT "ClassroomStudent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomTeacher" ADD CONSTRAINT "ClassroomTeacher_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomTeacher" ADD CONSTRAINT "ClassroomTeacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_activeMessageId_fkey" FOREIGN KEY ("activeMessageId") REFERENCES "AIMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AIProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "AIGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "AIMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_videoGenerationId_fkey" FOREIGN KEY ("videoGenerationId") REFERENCES "VideoGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AIProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceVersion" ADD CONSTRAINT "ResourceVersion_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

