-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleConnectedAt" TIMESTAMP(3),
ADD COLUMN     "googleWarningSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "email_embeddings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "miniSummary" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_embeddings_userId_createdAt_idx" ON "email_embeddings"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "email_embeddings_briefId_idx" ON "email_embeddings"("briefId");

-- AddForeignKey
ALTER TABLE "email_embeddings" ADD CONSTRAINT "email_embeddings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_embeddings" ADD CONSTRAINT "email_embeddings_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "DailyBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
