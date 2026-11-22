-- CreateEnum
CREATE TYPE "TutorApplicationStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateTable
CREATE TABLE "tutor_application" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "headline" TEXT,
    "specialty" TEXT,
    "experience" INTEGER,
    "credentialUrl" TEXT,
    "description" TEXT,
    "hourlyRate" INTEGER,
    "currency" "CurrencyType" NOT NULL DEFAULT 'USD',
    "subjects" JSONB,
    "gradeLevels" JSONB,
    "status" "TutorApplicationStatus" NOT NULL DEFAULT 'Pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tutor_application_userId_key" ON "tutor_application"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_application_email_key" ON "tutor_application"("email");

-- CreateIndex
CREATE INDEX "tutor_application_status_createdAt_idx" ON "tutor_application"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "tutor_application" ADD CONSTRAINT "tutor_application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
