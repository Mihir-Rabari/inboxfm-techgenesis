/*
  Warnings:

  - You are about to drop the column `accessCodeId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isApproved` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AccessCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Waitlist` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,date,scheduleId]` on the table `DailyBrief` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Waitlist" DROP CONSTRAINT "Waitlist_accessCodeId_fkey";

-- DropIndex
DROP INDEX "DailyBrief_userId_date_key";

-- AlterTable
ALTER TABLE "DailyBrief" ADD COLUMN     "scheduleId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "accessCodeId",
DROP COLUMN "isApproved";

-- DropTable
DROP TABLE "AccessCode";

-- DropTable
DROP TABLE "Waitlist";

-- DropEnum
DROP TYPE "WaitlistStatus";

-- CreateIndex
CREATE UNIQUE INDEX "DailyBrief_userId_date_scheduleId_key" ON "DailyBrief"("userId", "date", "scheduleId");

-- AddForeignKey
ALTER TABLE "DailyBrief" ADD CONSTRAINT "DailyBrief_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "SummarySchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
