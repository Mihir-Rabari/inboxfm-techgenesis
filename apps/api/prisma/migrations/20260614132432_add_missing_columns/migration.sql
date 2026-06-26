-- AlterTable
ALTER TABLE "ActionItem" ADD COLUMN     "links" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "SummarySchedule" ADD COLUMN     "includeGmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "includeOutlook" BOOLEAN NOT NULL DEFAULT true;
