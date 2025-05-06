/*
  Warnings:

  - You are about to drop the column `encryptSeedPhrase` on the `SolanaKeys` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SolanaKeys" DROP COLUMN "encryptSeedPhrase";
