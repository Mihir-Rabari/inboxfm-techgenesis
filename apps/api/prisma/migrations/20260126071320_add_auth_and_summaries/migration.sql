/*
  Warnings:

  - You are about to drop the column `deliveryTime` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `voicePersona` on the `User` table. All the data in the column will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "deliveryTime",
DROP COLUMN "voicePersona",
ADD COLUMN     "accessCodeId" TEXT,
ADD COLUMN     "gmailConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
-- Add password with temporary default for existing rows
ADD COLUMN     "password" TEXT NOT NULL DEFAULT '$2b$12$PLACEHOLDER_DO_NOT_USE',
ALTER COLUMN "googleId" DROP NOT NULL,
ALTER COLUMN "accessToken" DROP NOT NULL,
ALTER COLUMN "refreshToken" DROP NOT NULL;

-- Remove default after column is added (new rows must provide password)
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'PENDING',
    "accessCodeId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "usedByEmail" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "AccessCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SummarySchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deliveryTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "voicePersona" "VoicePersona" NOT NULL DEFAULT 'NEWSROOM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailsFrom" TEXT NOT NULL DEFAULT 'last_delivery',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SummarySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_email_key" ON "Waitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_accessCodeId_key" ON "Waitlist"("accessCodeId");

-- CreateIndex
CREATE INDEX "Waitlist_status_idx" ON "Waitlist"("status");

-- CreateIndex
CREATE INDEX "Waitlist_email_idx" ON "Waitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_code_key" ON "AccessCode"("code");

-- CreateIndex
CREATE INDEX "AccessCode_code_idx" ON "AccessCode"("code");

-- CreateIndex
CREATE INDEX "AccessCode_isUsed_idx" ON "AccessCode"("isUsed");

-- CreateIndex
CREATE INDEX "SummarySchedule_userId_idx" ON "SummarySchedule"("userId");

-- CreateIndex
CREATE INDEX "SummarySchedule_deliveryTime_idx" ON "SummarySchedule"("deliveryTime");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_accessCodeId_fkey" FOREIGN KEY ("accessCodeId") REFERENCES "AccessCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummarySchedule" ADD CONSTRAINT "SummarySchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
