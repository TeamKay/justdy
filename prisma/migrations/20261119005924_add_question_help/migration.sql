-- CreateEnum
CREATE TYPE "LearnerQuestionStatus" AS ENUM ('SUBMITTED', 'OFFERED', 'MATCHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuestionTutorOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "learner_question" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT,
    "learnerEmail" TEXT NOT NULL,
    "questionText" TEXT,
    "status" "LearnerQuestionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "acceptedTutorId" TEXT,
    "guestAccessTokenHash" TEXT,
    "guestAccessExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_attachment" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_tutor_offer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "status" "QuestionTutorOfferStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_tutor_offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learner_question_guestAccessTokenHash_key" ON "learner_question"("guestAccessTokenHash");

-- CreateIndex
CREATE INDEX "learner_question_status_createdAt_idx" ON "learner_question"("status", "createdAt");

-- CreateIndex
CREATE INDEX "learner_question_learnerId_createdAt_idx" ON "learner_question"("learnerId", "createdAt");

-- CreateIndex
CREATE INDEX "learner_question_learnerEmail_idx" ON "learner_question"("learnerEmail");

-- CreateIndex
CREATE INDEX "learner_question_acceptedTutorId_idx" ON "learner_question"("acceptedTutorId");

-- CreateIndex
CREATE UNIQUE INDEX "question_attachment_storageKey_key" ON "question_attachment"("storageKey");

-- CreateIndex
CREATE INDEX "question_attachment_questionId_idx" ON "question_attachment"("questionId");

-- CreateIndex
CREATE INDEX "question_tutor_offer_tutorId_status_createdAt_idx" ON "question_tutor_offer"("tutorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "question_tutor_offer_questionId_status_idx" ON "question_tutor_offer"("questionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "question_tutor_offer_questionId_tutorId_key" ON "question_tutor_offer"("questionId", "tutorId");

-- AddForeignKey
ALTER TABLE "learner_question" ADD CONSTRAINT "learner_question_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_question" ADD CONSTRAINT "learner_question_acceptedTutorId_fkey" FOREIGN KEY ("acceptedTutorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attachment" ADD CONSTRAINT "question_attachment_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "learner_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_tutor_offer" ADD CONSTRAINT "question_tutor_offer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "learner_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_tutor_offer" ADD CONSTRAINT "question_tutor_offer_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
