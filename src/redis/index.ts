import { redisClient } from "..";
import { SolRedisData } from "../types";

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
}