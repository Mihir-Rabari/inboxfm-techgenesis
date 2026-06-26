-- AlterTable
ALTER TABLE "SummarySchedule" ADD COLUMN     "customPrompt" TEXT,
ALTER COLUMN "timezone" SET DEFAULT 'Asia/Kolkata';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Kolkata';
