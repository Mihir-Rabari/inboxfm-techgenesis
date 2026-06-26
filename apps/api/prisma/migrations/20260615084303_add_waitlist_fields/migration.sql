-- AlterEnum
ALTER TYPE "WaitlistStatus" ADD VALUE 'WAITLISTED';

-- AlterTable
ALTER TABLE "Waitlist" ADD COLUMN     "biggest_pain" TEXT,
ADD COLUMN     "email_volume" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "why_inboxfm" TEXT;
