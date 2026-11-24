-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "message" VARCHAR(300) NOT NULL,
    "linkLabel" VARCHAR(60),
    "linkUrl" VARCHAR(500),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_isPublished_publishedAt_idx" ON "Announcement"("isPublished", "publishedAt");
