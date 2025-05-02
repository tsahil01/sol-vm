import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { db } from "..";

export async function createTnx(chatId: number, amt: number) {
    const user = await db.user.findUnique({
        where: {
            telegramId: BigInt(chatId),
        },
    });
    if (!user || !user.walletAddress) {
        console.log('User not found. Cannot create transaction.');
        return null;
    }
    console.log('amt:', amt);   
    const transaction = await db.transaction.create({
        data: {
            userId: user.id,
            lamports: amt * LAMPORTS_PER_SOL,
            status: 'pending',
            type: 'payment',
            paidFromAddress: user.walletAddress,
            webhookStatus: 'pending',
        },
    });

    console.log('Transaction created:', transaction);
    return { transaction, user };
}
