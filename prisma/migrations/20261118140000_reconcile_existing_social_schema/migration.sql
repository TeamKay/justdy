-- CreateEnum
CREATE TYPE "public"."SocialChallengeStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SocialChallengeSubmissionStatus" AS ENUM ('PENDING', 'GRADED');

-- CreateEnum
CREATE TYPE "public"."SocialPostLayout" AS ENUM ('IMAGE_LEFT', 'TEXT_LEFT', 'IMAGE_TOP', 'TEXT_TOP');

-- CreateEnum
CREATE TYPE "public"."SocialPostType" AS ENUM ('GENERAL', 'WELCOME', 'CHALLENGE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."SocialReactionType" ADD VALUE 'DISLIKE';
ALTER TYPE "public"."SocialReactionType" ADD VALUE 'HELPFUL';
ALTER TYPE "public"."SocialReactionType" ADD VALUE 'CURIOUS';

-- AlterTable
ALTER TABLE "public"."social_post" ADD COLUMN     "feedPriority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "layout" "public"."SocialPostLayout" NOT NULL DEFAULT 'TEXT_TOP',
ADD COLUMN     "postType" "public"."SocialPostType" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "lastSeenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."DailyChallenge" (
    "id" TEXT NOT NULL,
    "challengeDate" DATE NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'Mathematics',
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "hint" TEXT,
    "explanation" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyChallengeAttempt" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallengeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_challenge" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "status" "public"."SocialChallengeStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_challenge_participant" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_challenge_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_challenge_submission" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "status" "public"."SocialChallengeSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER,
    "feedback" TEXT,
    "gradedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_challenge_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_post_dismissal" (
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_post_dismissal_pkey" PRIMARY KEY ("userId","postId")
);

-- CreateTable
CREATE TABLE "public"."social_post_share" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_post_share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."video_watch_event" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "eventType" VARCHAR(20) NOT NULL,
    "watchedDurationMs" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_watch_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."video_watch_session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "sessionKey" VARCHAR(64) NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "watchedDurationMs" INTEGER NOT NULL DEFAULT 0,
    "maxProgressPercent" INTEGER NOT NULL DEFAULT 0,
    "impressionAt" TIMESTAMP(3),
    "firstPlayedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_watch_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_challengeDate_gradeLevel_subject_key" ON "public"."DailyChallenge"("challengeDate" ASC, "gradeLevel" ASC, "subject" ASC);

-- CreateIndex
CREATE INDEX "DailyChallenge_gradeLevel_challengeDate_idx" ON "public"."DailyChallenge"("gradeLevel" ASC, "challengeDate" ASC);

-- CreateIndex
CREATE INDEX "DailyChallenge_status_challengeDate_idx" ON "public"."DailyChallenge"("status" ASC, "challengeDate" ASC);

-- CreateIndex
CREATE INDEX "DailyChallenge_subject_challengeDate_idx" ON "public"."DailyChallenge"("subject" ASC, "challengeDate" ASC);

-- CreateIndex
CREATE INDEX "DailyChallengeAttempt_challengeId_score_submittedAt_idx" ON "public"."DailyChallengeAttempt"("challengeId" ASC, "score" ASC, "submittedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeAttempt_challengeId_userId_key" ON "public"."DailyChallengeAttempt"("challengeId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "DailyChallengeAttempt_userId_submittedAt_idx" ON "public"."DailyChallengeAttempt"("userId" ASC, "submittedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "social_challenge_postId_key" ON "public"."social_challenge"("postId" ASC);

-- CreateIndex
CREATE INDEX "social_challenge_status_opensAt_closesAt_idx" ON "public"."social_challenge"("status" ASC, "opensAt" ASC, "closesAt" ASC);

-- CreateIndex
CREATE INDEX "social_challenge_participant_challengeId_joinedAt_idx" ON "public"."social_challenge_participant"("challengeId" ASC, "joinedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "social_challenge_participant_challengeId_userId_key" ON "public"."social_challenge_participant"("challengeId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "social_challenge_participant_userId_joinedAt_idx" ON "public"."social_challenge_participant"("userId" ASC, "joinedAt" ASC);

-- CreateIndex
CREATE INDEX "social_challenge_submission_challengeId_status_submittedAt_idx" ON "public"."social_challenge_submission"("challengeId" ASC, "status" ASC, "submittedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "social_challenge_submission_challengeId_userId_key" ON "public"."social_challenge_submission"("challengeId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "social_challenge_submission_gradedById_gradedAt_idx" ON "public"."social_challenge_submission"("gradedById" ASC, "gradedAt" ASC);

-- CreateIndex
CREATE INDEX "social_challenge_submission_userId_submittedAt_idx" ON "public"."social_challenge_submission"("userId" ASC, "submittedAt" ASC);

-- CreateIndex
CREATE INDEX "social_post_dismissal_postId_idx" ON "public"."social_post_dismissal"("postId" ASC);

-- CreateIndex
CREATE INDEX "social_post_share_postId_sharedAt_idx" ON "public"."social_post_share"("postId" ASC, "sharedAt" ASC);

-- CreateIndex
CREATE INDEX "social_post_share_userId_sharedAt_idx" ON "public"."social_post_share"("userId" ASC, "sharedAt" ASC);

-- CreateIndex
CREATE INDEX "video_watch_event_postId_occurredAt_idx" ON "public"."video_watch_event"("postId" ASC, "occurredAt" ASC);

-- CreateIndex
CREATE INDEX "video_watch_event_sessionId_occurredAt_idx" ON "public"."video_watch_event"("sessionId" ASC, "occurredAt" ASC);

-- CreateIndex
CREATE INDEX "video_watch_event_userId_occurredAt_idx" ON "public"."video_watch_event"("userId" ASC, "occurredAt" ASC);

-- CreateIndex
CREATE INDEX "video_watch_session_postId_createdAt_idx" ON "public"."video_watch_session"("postId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "video_watch_session_postId_impressionAt_idx" ON "public"."video_watch_session"("postId" ASC, "impressionAt" ASC);

-- CreateIndex
CREATE INDEX "video_watch_session_userId_createdAt_idx" ON "public"."video_watch_session"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "video_watch_session_userId_postId_createdAt_idx" ON "public"."video_watch_session"("userId" ASC, "postId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "video_watch_session_userId_sessionKey_key" ON "public"."video_watch_session"("userId" ASC, "sessionKey" ASC);

-- CreateIndex
CREATE INDEX "social_post_status_feedPriority_publishedAt_idx" ON "public"."social_post"("status" ASC, "feedPriority" ASC, "publishedAt" ASC);

-- CreateIndex
CREATE INDEX "user_status_lastSeenAt_idx" ON "public"."user"("status" ASC, "lastSeenAt" ASC);

-- AddForeignKey
ALTER TABLE "public"."DailyChallenge" ADD CONSTRAINT "DailyChallenge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyChallengeAttempt" ADD CONSTRAINT "DailyChallengeAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."DailyChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyChallengeAttempt" ADD CONSTRAINT "DailyChallengeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_challenge" ADD CONSTRAINT "social_challenge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_challenge" ADD CONSTRAINT "social_challenge_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."social_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_challenge_participant" ADD CONSTRAINT "social_challenge_participant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."social_challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_challenge_participant" ADD CONSTRAINT "social_challenge_participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_challenge_submission" ADD CONSTRAINT "social_challenge_submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."social_challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_challenge_submission" ADD CONSTRAINT "social_challenge_submission_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_challenge_submission" ADD CONSTRAINT "social_challenge_submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_post_dismissal" ADD CONSTRAINT "social_post_dismissal_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."social_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_post_dismissal" ADD CONSTRAINT "social_post_dismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_post_share" ADD CONSTRAINT "social_post_share_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."social_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_post_share" ADD CONSTRAINT "social_post_share_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_watch_event" ADD CONSTRAINT "video_watch_event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."video_watch_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_watch_session" ADD CONSTRAINT "video_watch_session_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."social_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_watch_session" ADD CONSTRAINT "video_watch_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE
