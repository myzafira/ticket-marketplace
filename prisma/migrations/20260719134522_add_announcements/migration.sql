-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('CRITICAL', 'GENERAL');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('USERS', 'ADMINS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminActionType" ADD VALUE 'ANNOUNCEMENT_CREATED';
ALTER TYPE "AdminActionType" ADD VALUE 'ANNOUNCEMENT_UPDATED';
ALTER TYPE "AdminActionType" ADD VALUE 'ANNOUNCEMENT_DELETED';

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "linkUrl" TEXT,
    "linkLabel" TEXT,
    "priority" "AnnouncementPriority" NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_audience_priority_isActive_publishAt_idx" ON "Announcement"("audience", "priority", "isActive", "publishAt");
