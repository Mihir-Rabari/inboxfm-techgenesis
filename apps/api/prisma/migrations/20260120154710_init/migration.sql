-- CreateEnum
CREATE TYPE "VoicePersona" AS ENUM ('NEWSROOM', 'FRIEND', 'SPEEDSTER');

-- CreateEnum
CREATE TYPE "BriefStatus" AS ENUM ('PENDING', 'FETCHING', 'PROCESSING', 'GENERATING_AUDIO', 'DELIVERING', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailCategory" AS ENUM ('URGENT', 'ACTION_REQUIRED', 'DEADLINES', 'MEETINGS', 'IMPORTANT', 'PERSONAL', 'NEWSLETTERS', 'PROMOTIONS', 'NOISE');

-- CreateEnum
CREATE TYPE "SenderPriority" AS ENUM ('CRITICAL', 'HIGH', 'NORMAL', 'LOW', 'IGNORE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "name" TEXT,
    "picture" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3),
    "deliveryTime" TEXT NOT NULL DEFAULT '07:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "voicePersona" "VoicePersona" NOT NULL DEFAULT 'NEWSROOM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBrief" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "textSummary" TEXT NOT NULL,
    "scriptJson" JSONB NOT NULL,
    "audioUrl" TEXT,
    "audioDuration" INTEGER,
    "emailsProcessed" INTEGER NOT NULL DEFAULT 0,
    "categoryCounts" JSONB NOT NULL DEFAULT '{}',
    "status" "BriefStatus" NOT NULL DEFAULT 'PENDING',
    "processingTime" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "senderName" TEXT,
    "priority" "SenderPriority" NOT NULL DEFAULT 'NORMAL',
    "alwaysInclude" BOOLEAN NOT NULL DEFAULT false,
    "neverInclude" BOOLEAN NOT NULL DEFAULT false,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "DailyBrief_userId_date_idx" ON "DailyBrief"("userId", "date");

-- CreateIndex
CREATE INDEX "DailyBrief_status_idx" ON "DailyBrief"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBrief_userId_date_key" ON "DailyBrief"("userId", "date");

-- CreateIndex
CREATE INDEX "SenderPreference_userId_idx" ON "SenderPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SenderPreference_userId_senderEmail_key" ON "SenderPreference"("userId", "senderEmail");

-- AddForeignKey
ALTER TABLE "DailyBrief" ADD CONSTRAINT "DailyBrief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderPreference" ADD CONSTRAINT "SenderPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
