/*
  Warnings:

  - You are about to drop the column `webhookData` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `webhookId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `webhookStatus` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "webhookData",
DROP COLUMN "webhookId",
DROP COLUMN "webhookStatus";
