/*
  Warnings:

  - You are about to drop the column `sshKeyFingerprint` on the `VM` table. All the data in the column will be lost.
  - You are about to drop the column `sshKeyName` on the `VM` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VM" DROP COLUMN "sshKeyFingerprint",
DROP COLUMN "sshKeyName";
