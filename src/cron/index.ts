import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { bot, db } from "..";
import { allPendingPayments, makeSolanaKeyUnused, removePayment } from "../redis";
import { checkLatestPayment } from "../solana";
import { afterPayment } from "../vm/processor";

export async function checkPayments() {
    const payments = await allPendingPayments();
    console.log(`Found ${payments.length} pending payments.`);
    if (payments.length === 0) {
        return;
    }
    const now = new Date();
    for (const payment of payments) {
        if (payment.expiryAt < now) {
            console.log(`Payment ${payment.id} has expired.`);
            await removePayment(payment.id);
            await makeSolanaKeyUnused(payment.paidToAddress);
            bot.sendMessage(payment.chatId, `*Your payment for ${payment.amount / BigInt(LAMPORTS_PER_SOL)}SOL has expired.*\nPlease make a new payment.`);
            await db.transaction.update({
                where: {
                    id: Number(payment.id),
                },
                data: {
                    status: 'expired',
                    updatedAt: new Date(),
                },
            }).catch((err) => {
                console.error(`Failed to update transaction status for payment ${payment.id}:`, err);
            })
        } else {
            const data = await checkLatestPayment(10, new PublicKey(payment.paidToAddress));
            if (data == null) {
                continue;
            }
            if (data && data.signature && data.amount > 0) {
                await removePayment(payment.id);
                await makeSolanaKeyUnused(payment.paidToAddress);
                bot.sendMessage(payment.chatId, `✅ *Your payment of ${data.amount} has been received!*`);
                try {
                    const transaction = await db.transaction.findUnique({
                        where: {
                            id: Number(payment.id),
                        },
                        include: {
                            vm: true,
                        },
                    });
                    if (!transaction) {
                        return;
                    }
                    if (transaction && transaction.lamports <= data.amount) {
                        await db.transaction.update({
                            where: {
                                id: transaction.id,
                            },
                            data: {
                                status: 'confirmed',
                                signature: data.signature,
                                paidFromAddress: data.paidFromAddress,
                                lamports: data.amount,
                                updatedAt: new Date(),
                                confirmedAt: new Date(),
                            },
                        });

                        bot.sendMessage(payment.chatId, `🎉 *Your payment of ${data.amount / LAMPORTS_PER_SOL}SOL has been confirmed!*\n\n*Signature:* \`${data.signature}\`\n*Paid from:* \`${data.paidFromAddress}\``);
                        bot.sendMessage(payment.chatId, `🚀 *Starting your Virtual Machine...*`);

                        const vm = await afterPayment({ chatId: payment.chatId, tnxId: Number(payment.id) });
                        if (vm != true) {
                            bot.sendMessage(payment.chatId, `⚠️ *Your payment has been confirmed, but there was an error processing the transaction.*`);
                        }


                    } else {
                        console.log(`Transaction not found or amount mismatch for payment ${payment.id}.`);
                        bot.sendMessage(payment.chatId, `❌ *The payment of ${data.amount / LAMPORTS_PER_SOL}SOL is not enough to start your Virtual Machine.*\nPlease make a new payment.`);
                        await db.transaction.update({
                            where: {
                                id: Number(payment.id),
                            },
                            data: {
                                status: 'failed',
                                type: 'refund',
                                signature: data.signature,
                                updatedAt: new Date(),
                            },
                        });
                    }
                } catch (err) {
                    console.error(`Failed to update transaction status for payment ${payment.id}:`, err);
                }
            }
        }
    }
}