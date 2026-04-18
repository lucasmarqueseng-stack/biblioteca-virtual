-- AlterTable
ALTER TABLE "Book" ADD COLUMN "finishedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Book_finishedAt_idx" ON "Book"("finishedAt");
