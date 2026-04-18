-- AlterTable: adiciona coluna owned (Tenho) independente do status
ALTER TABLE "Book" ADD COLUMN "owned" BOOLEAN NOT NULL DEFAULT false;

-- Migra livros com status "TENHO" -> owned=true, status=NAO_LIDO
UPDATE "Book" SET "owned" = true WHERE "status" = 'TENHO';
UPDATE "Book" SET "status" = 'NAO_LIDO' WHERE "status" = 'TENHO';

-- CreateIndex
CREATE INDEX "Book_owned_idx" ON "Book"("owned");
