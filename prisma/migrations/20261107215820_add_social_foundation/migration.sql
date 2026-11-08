-- CreateEnum
CREATE TYPE "SocialAgeBand" AS ENUM ('UNKNOWN', 'UNDER_13', 'AGE_13_17', 'ADULT');

-- CreateEnum
CREATE TYPE "AgeAssuranceStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SocialAccountStatus" AS ENUM ('ACTIVE', 'RESTRICTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SocialPostVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'ONLY_ME');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "UploadedMediaType" AS ENUM ('IMAGE', 'VIDEO', 'FILE');

-- CreateEnum
CREATE TYPE "UploadedMediaPurpose" AS ENUM ('GENERAL', 'PROFILE_IMAGE', 'SOCIAL_POST', 'EDUCATIONAL_RESOURCE', 'DELIVERABLE');

-- CreateEnum
CREATE TYPE "UploadedMediaStatus" AS ENUM ('UPLOADED', 'ATTACHED', 'REJECTED', 'DELETED');

-- CreateEnum
CREATE TYPE "SocialFollowStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SocialReactionType" AS ENUM ('LIKE', 'LOVE', 'INSIGHTFUL', 'CELEBRATE');

-- CreateEnum
CREATE TYPE "SocialCommentStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "SocialReportTargetType" AS ENUM ('PROFILE', 'POST', 'COMMENT');

-- CreateEnum
CREATE TYPE "SocialReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'CHILD_SAFETY', 'INAPPROPRIATE_CONTENT', 'MISINFORMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "SocialReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SocialModerationActionType" AS ENUM ('WARNING', 'CONTENT_REMOVED', 'CONTENT_RESTORED', 'ACCOUNT_RESTRICTED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_RESTORED');

-- CreateEnum
CREATE TYPE "GuardianLinkStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'REVOKED');

-- CreateTable
CREATE TABLE "social_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "ageBand" "SocialAgeBand" NOT NULL DEFAULT 'UNKNOWN',
    "ageAssuranceStatus" "AgeAssuranceStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "ageVerifiedAt" TIMESTAMP(3),
    "status" "SocialAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_media" (
    "id" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "uploadThingKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "type" "UploadedMediaType" NOT NULL,
    "purpose" "UploadedMediaPurpose" NOT NULL DEFAULT 'GENERAL',
    "sizeBytes" BIGINT NOT NULL,
    "status" "UploadedMediaStatus" NOT NULL DEFAULT 'UPLOADED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploaded_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT,
    "visibility" "SocialPostVisibility" NOT NULL DEFAULT 'FOLLOWERS',
    "status" "SocialPostStatus" NOT NULL DEFAULT 'DRAFT',
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_media" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "status" "SocialCommentStatus" NOT NULL DEFAULT 'VISIBLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_reaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SocialReactionType" NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "status" "SocialFollowStatus" NOT NULL DEFAULT 'ACCEPTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_bookmark" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "targetType" "SocialReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "SocialReportReason" NOT NULL,
    "details" TEXT,
    "status" "SocialReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_moderation_action" (
    "id" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "targetType" "SocialReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" "SocialModerationActionType" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_moderation_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardian_link" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "status" "GuardianLinkStatus" NOT NULL DEFAULT 'PENDING',
    "relationship" TEXT,
    "consentGrantedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardian_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_profile_userId_key" ON "social_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "social_profile_username_key" ON "social_profile"("username");

-- CreateIndex
CREATE INDEX "social_profile_status_createdAt_idx" ON "social_profile"("status", "createdAt");

-- CreateIndex
CREATE INDEX "social_profile_ageBand_ageAssuranceStatus_idx" ON "social_profile"("ageBand", "ageAssuranceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_media_uploadThingKey_key" ON "uploaded_media"("uploadThingKey");

-- CreateIndex
CREATE INDEX "uploaded_media_uploaderId_createdAt_idx" ON "uploaded_media"("uploaderId", "createdAt");

-- CreateIndex
CREATE INDEX "uploaded_media_status_createdAt_idx" ON "uploaded_media"("status", "createdAt");

-- CreateIndex
CREATE INDEX "uploaded_media_purpose_status_idx" ON "uploaded_media"("purpose", "status");

-- CreateIndex
CREATE INDEX "social_post_authorId_createdAt_idx" ON "social_post"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "social_post_status_visibility_publishedAt_idx" ON "social_post"("status", "visibility", "publishedAt");

-- CreateIndex
CREATE INDEX "social_post_media_mediaId_idx" ON "social_post_media"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "social_post_media_postId_mediaId_key" ON "social_post_media"("postId", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "social_post_media_postId_position_key" ON "social_post_media"("postId", "position");

-- CreateIndex
CREATE INDEX "social_comment_postId_createdAt_idx" ON "social_comment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "social_comment_authorId_createdAt_idx" ON "social_comment"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "social_comment_parentId_createdAt_idx" ON "social_comment"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "social_reaction_userId_createdAt_idx" ON "social_reaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "social_reaction_postId_userId_key" ON "social_reaction"("postId", "userId");

-- CreateIndex
CREATE INDEX "social_follow_followingId_status_createdAt_idx" ON "social_follow"("followingId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "social_follow_followerId_status_createdAt_idx" ON "social_follow"("followerId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "social_follow_followerId_followingId_key" ON "social_follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "social_bookmark_userId_createdAt_idx" ON "social_bookmark"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "social_bookmark_postId_userId_key" ON "social_bookmark"("postId", "userId");

-- CreateIndex
CREATE INDEX "social_block_blockedId_idx" ON "social_block"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "social_block_blockerId_blockedId_key" ON "social_block"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "social_report_targetType_targetId_idx" ON "social_report"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "social_report_status_createdAt_idx" ON "social_report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "social_report_reporterId_createdAt_idx" ON "social_report"("reporterId", "createdAt");

-- CreateIndex
CREATE INDEX "social_moderation_action_targetType_targetId_createdAt_idx" ON "social_moderation_action"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "social_moderation_action_moderatorId_createdAt_idx" ON "social_moderation_action"("moderatorId", "createdAt");

-- CreateIndex
CREATE INDEX "guardian_link_learnerId_status_idx" ON "guardian_link"("learnerId", "status");

-- CreateIndex
CREATE INDEX "guardian_link_guardianId_status_idx" ON "guardian_link"("guardianId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "guardian_link_guardianId_learnerId_key" ON "guardian_link"("guardianId", "learnerId");

-- AddForeignKey
ALTER TABLE "social_profile" ADD CONSTRAINT "social_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_media" ADD CONSTRAINT "uploaded_media_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post" ADD CONSTRAINT "social_post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_media" ADD CONSTRAINT "social_post_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_media" ADD CONSTRAINT "social_post_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "uploaded_media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_comment" ADD CONSTRAINT "social_comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_comment" ADD CONSTRAINT "social_comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_comment" ADD CONSTRAINT "social_comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "social_comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_reaction" ADD CONSTRAINT "social_reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_reaction" ADD CONSTRAINT "social_reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_follow" ADD CONSTRAINT "social_follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_follow" ADD CONSTRAINT "social_follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_bookmark" ADD CONSTRAINT "social_bookmark_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_bookmark" ADD CONSTRAINT "social_bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_block" ADD CONSTRAINT "social_block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_block" ADD CONSTRAINT "social_block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_report" ADD CONSTRAINT "social_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_report" ADD CONSTRAINT "social_report_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_moderation_action" ADD CONSTRAINT "social_moderation_action_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_link" ADD CONSTRAINT "guardian_link_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_link" ADD CONSTRAINT "guardian_link_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
