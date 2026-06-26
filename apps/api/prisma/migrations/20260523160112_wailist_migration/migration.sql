/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `ReleaseNote` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "ReleaseNote" ADD COLUMN     "changes" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "slug" TEXT;

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'PENDING',
    "accessCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_email_key" ON "Waitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_accessCode_key" ON "Waitlist"("accessCode");

-- CreateIndex
CREATE INDEX "Waitlist_status_idx" ON "Waitlist"("status");

-- CreateIndex
CREATE INDEX "Waitlist_email_idx" ON "Waitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseNote_slug_key" ON "ReleaseNote"("slug");

-- CreateIndex
CREATE INDEX "ReleaseNote_slug_idx" ON "ReleaseNote"("slug");
