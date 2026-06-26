-- CreateEnum
CREATE TYPE "ActionItemType" AS ENUM ('MEETING', 'TASK', 'REPLY', 'FOLLOW_UP', 'REVIEW', 'APPROVAL');

-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('PENDING', 'APPROVED', 'IGNORED', 'COMPLETED', 'EDITED', 'SNOOZED');

-- DropIndex
DROP INDEX "email_embeddings_embedding_idx";

-- AlterTable
ALTER TABLE "SummarySchedule" ADD COLUMN     "styleId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subscribeAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "subscribePromo" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "briefId" TEXT,
    "type" "ActionItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "status" "ActionItemStatus" NOT NULL DEFAULT 'PENDING',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "sourceSubject" TEXT,
    "sourceSender" TEXT,
    "sourceUrl" TEXT,
    "sourcePreview" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "participants" TEXT[],
    "location" TEXT,
    "includeMeet" BOOLEAN NOT NULL DEFAULT false,
    "replyIndicator" BOOLEAN NOT NULL DEFAULT false,
    "suggestedReply" TEXT,
    "editedContent" TEXT,
    "sentMailId" TEXT,
    "sentAt" TIMESTAMP(3),
    "googleEventId" TEXT,
    "googleEventUrl" TEXT,
    "meetLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefingStyle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefingStyle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionItem_userId_status_idx" ON "ActionItem"("userId", "status");

-- CreateIndex
CREATE INDEX "ActionItem_userId_type_idx" ON "ActionItem"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ActionItem_userId_sourceId_type_key" ON "ActionItem"("userId", "sourceId", "type");

-- AddForeignKey
ALTER TABLE "SummarySchedule" ADD CONSTRAINT "SummarySchedule_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "BriefingStyle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "DailyBrief"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefingStyle" ADD CONSTRAINT "BriefingStyle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
