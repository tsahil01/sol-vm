-- CreateTable
CREATE TABLE "SolanaKeys" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "encryptPrivateKey" TEXT NOT NULL,
    "encryptSeedPhrase" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolanaKeys_pkey" PRIMARY KEY ("id")
);
