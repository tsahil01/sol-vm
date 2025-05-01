/*
  Warnings:

  - You are about to drop the column `amount` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "amount",
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "lamports" INTEGER,
ADD COLUMN     "paidFromAddress" TEXT,
ALTER COLUMN "signature" DROP NOT NULL;
