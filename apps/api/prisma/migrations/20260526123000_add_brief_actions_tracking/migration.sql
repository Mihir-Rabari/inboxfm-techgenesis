-- CreateEnum
CREATE TYPE "BriefActionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "BriefAction" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "type" TEXT,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "participants" JSONB NOT NULL DEFAULT '[]',
    "includeMeet" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "status" "BriefActionStatus" NOT NULL DEFAULT 'PENDING',
    "googleEventId" TEXT,
    "googleEventUrl" TEXT,
    "meetLink" TEXT,
    "errorMessage" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BriefAction_briefId_sourceId_key" ON "BriefAction"("briefId", "sourceId");

-- CreateIndex
CREATE INDEX "BriefAction_userId_briefId_status_idx" ON "BriefAction"("userId", "briefId", "status");

-- AddForeignKey
ALTER TABLE "BriefAction" ADD CONSTRAINT "BriefAction_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "DailyBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefAction" ADD CONSTRAINT "BriefAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
