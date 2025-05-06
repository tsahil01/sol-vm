import { db, redisClient } from "..";
import { generateNewAccount } from "../solana";
import { encryptKey } from "../solana/encrypt-decrypt";
import { Payment, SolRedisData } from "../types";

export async function setSolanaKeys({ id, publicKey, encryptedKey, derivationPath, inUse }: SolRedisData) {
    const key = `solana:keys:${id}`;

    await redisClient.hSet(key, {
        publicKey,
        encryptedKey,
        derivationPath,
        inUse: inUse.toString(),
    });

    const indexKey = "solana:keys:inUse:false";
    if (!inUse) {
        await redisClient.sAdd(indexKey, key);
    } else {
        await redisClient.sRem(indexKey, key);
    }

    // we can also push it our prisma db
    await db.solanaKeys.upsert({
        where: { id: Number(id) },
        update: {
            id: Number(id),
            publicKey,
            encryptPrivateKey: encryptedKey,
            path: derivationPath,
        },
        create: {
            id: Number(id),
            publicKey,
            encryptPrivateKey: encryptedKey,
            path: derivationPath,
        },
    });

}

export async function getUnusedSolanaKey() {
    const indexKey = "solana:keys:inUse:false";
    const keys = await redisClient.sMembers(indexKey);

    if (keys.length > 0) {
        const key = keys[0];
        const data = await redisClient.hGetAll(key);

        const result: SolRedisData = {
            id: key.split(":")[2],
            publicKey: String(data.publicKey),
            encryptedKey: String(data.encryptedKey),
            derivationPath: String(data.derivationPath),
            inUse: true,
        };

        await redisClient.sRem(indexKey, key);
        await redisClient.hSet(key, "inUse", "true");
        return result;

    } else {
        const newIndex = (await redisClient.dbSize()) + 1;
        const newAccount = await generateNewAccount(newIndex);
        const encryptPrivateKey = encryptKey(newAccount.keysValue.secretKey);

        const newKeyData: SolRedisData = {
            id: newIndex.toString(),
            publicKey: newAccount.keysValue.publicKey,
            encryptedKey: encryptPrivateKey,
            derivationPath: newAccount.derivePath.solana,
            inUse: true,
        };

        await setSolanaKeys(newKeyData);
        return newKeyData;
    }
}

export async function makeSolanaKeyUnused(id: string) {
    const key = `solana:keys:${id}`;
    const data = await redisClient.hGetAll(key);

    if (data) {
        await redisClient.sAdd("solana:keys:inUse:false", key);
        await redisClient.hSet(key, "inUse", "false");
    }
}

export async function addNewPayment(payment: Payment) {
    const key = `payment:${payment.id}`;
    await redisClient.hSet(key, {
        userId: payment.userId,
        chatId: payment.chatId,
        amount: payment.amount.toString(),
        createdAt: payment.createdAt.toISOString(),
        expiryAt: payment.expiryAt.toISOString(),
        paidToAddress: payment.paidToAddress,
    });
    await redisClient.sAdd("payments", key);
}

export async function allPendingPayments() {
    const keys = await redisClient.sMembers("payments");
    const payments: Payment[] = [];

    for (const key of keys) {
        const data = await redisClient.hGetAll(key);
        if (data) {
            payments.push({
                id: key.split(":")[1],
                userId: String(data.userId),
                chatId: String(data.chatId),
                amount: BigInt(String(data.amount)),
                createdAt: new Date(String(data.createdAt)),
                expiryAt: new Date(String(data.expiryAt)),
                paidToAddress: String(data.paidToAddress),
            });
        }
    }
    return payments;
}

export async function removePayment(id: string) {
    const key = `payment:${id}`;
    await redisClient.del(key);
    await redisClient.sRem("payments", key);
}