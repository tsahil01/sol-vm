/*
  Warnings:

  - The `status` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `VM` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `type` to the `VM` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('draft', 'pending', 'detected', 'confirmed', 'expired', 'failed');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('payment', 'refund');

-- CreateEnum
CREATE TYPE "VMStatus" AS ENUM ('pending', 'active', 'suspended', 'terminated');

-- CreateEnum
CREATE TYPE "VMType" AS ENUM ('s', 'm', 'l');

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'draft',
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- AlterTable
ALTER TABLE "VM" ADD COLUMN     "type" "VMType" NOT NULL,
ALTER COLUMN "name" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "VMStatus" NOT NULL DEFAULT 'pending';
