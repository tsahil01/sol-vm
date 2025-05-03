import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { bot, db, receiverAddress } from "..";
import { WebhookEvent } from "../types";
import { createUserVM } from "../vm";
import * as fs from 'fs';
import { vmStartInstructions } from "../const";

export async function webhookProcessor(data: WebhookEvent) {
    try {
        let webhookId = "";
        let createdAt = "";
        let signature = "";
        let sender = "";
        let receiver = "";
        let amtTransfer = 0;
        let fee = 0;

        if (data.type === "ADDRESS_ACTIVITY") {
            const event = data.event;
            const transactions = event?.transaction;

            if (!transactions || transactions.length === 0) {
                console.log('No event or transaction');
            }

            const firstTx = transactions[0];
            webhookId = data.id;
            createdAt = data.createdAt;
            signature = firstTx.signature;

            if (!signature) {
                console.log('No signature');
            }

            const actualTransaction = firstTx.transaction?.[0];
            const message = actualTransaction?.message?.[0];

            if (!message || !message.account_keys || message.account_keys.length < 2) {
                console.log('Invalid or missing message.account_keys');
            }

            sender = message.account_keys[0];
            receiver = message.account_keys[1];

            const meta = firstTx.meta?.[0];
            if (!meta || !meta.pre_balances || !meta.post_balances) {
                console.log('Invalid meta or balances');
            }

            fee = meta.fee;
            const preSender = meta.pre_balances[0];
            const postSender = meta.post_balances[0];
            const preReceiver = meta.pre_balances[1];
            const postReceiver = meta.post_balances[1];

            amtTransfer = preSender - postSender;
            if (amtTransfer <= 0) {
                amtTransfer = postReceiver - preReceiver;
            }
            if (fee > 0) {
                amtTransfer -= fee;
            }

            if (amtTransfer <= 0) {
                console.log('No amount transferred');
            }

            if (receiver !== receiverAddress) {
                console.log('Receiver is not the expected address');
                return;
            }

            const user = await db.user.findFirst({
                where: {
                    walletAddress: sender,
                },
            });
            if (!user) {
                console.log('User not found');
                return;
            }
            const userId = user.id;

            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const now = new Date();

            const transaction = await db.transaction.findFirst({
                where: {
                    userId: userId,
                    status: 'pending',
                    paidFromAddress: sender,
                    createdAt: {
                        gte: tenMinutesAgo,
                        lte: now
                    },
                    type: 'payment'
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (!transaction) {
                console.log('No pending transaction found within the last 10 minutes');
                return;
            }

            if (transaction.lamports > amtTransfer) {
                console.log('Transaction amount is less than expected');
                const expectedSol = Number(transaction.lamports) / LAMPORTS_PER_SOL;
                const receivedSol = amtTransfer / LAMPORTS_PER_SOL;
                await bot.sendMessage(user.telegramId.toString(), `Transaction amount is less than expected.\nExpected: ${expectedSol.toFixed(9)} SOL,\nReceived: ${receivedSol.toFixed(9)} SOL\nTransaction ID: ${transaction.id}\nSignature: ${signature}\n\nTransaction marked for refund.\nPlease contact support.`);
                await db.transaction.update({
                    where: {
                        id: transaction.id
                    },
                    data: {
                        type: 'refund',
                        status: 'detected',
                        signature: signature,
                        paidFromAddress: sender,
                        lamports: transaction.lamports,
                        webhookId: webhookId,
                        webhookStatus: 'received',
                        webhookData: JSON.stringify(data),
                        updatedAt: new Date(),
                        confirmedAt: new Date()
                    }
                });
                return;
            }

            const updateTnx = await db.transaction.update({
                where: {
                    id: transaction.id
                },
                data: {
                    signature: signature,
                    paidFromAddress: sender,
                    lamports: amtTransfer,
                    webhookId: webhookId,
                    webhookStatus: 'received',
                    webhookData: JSON.stringify(data),
                    status: 'detected',
                    updatedAt: new Date(),
                    confirmedAt: new Date()
                }
            });

            await bot.sendMessage(user.telegramId.toString(), `Transaction detected: \nTransaction ID: ${updateTnx.id}\nSignature: ${signature}\nAmount: ${amtTransfer / LAMPORTS_PER_SOL} SOL\nWebhook ID: ${webhookId}\n\nPlease wait for confirmation.`);

            await bot.sendMessage(user.telegramId.toString(), 'Creating your VM... This may take a minute.');

            const vmDetails = await createUserVM(`${user.telegramId.toString()}-${Date.now()}`);

            db.transaction.update({
                where: {
                    id: updateTnx.id
                },
                data: {
                    status: 'confirmed',
                    webhookStatus: 'confirmed',
                    vm: {
                        update: {
                            instanceId: vmDetails.instanceName,
                            ipAddress: vmDetails.ip,
                            status: 'active',
                            zone: vmDetails.zone,
                            sshKey: vmDetails.privateKey,
                            rentedAt: new Date(),
                            expiresAt: new Date(Date.now() + 60 * 60 * 1000 * 2), // 2 hours
                        }
                    }
                }
            })


            await bot.sendDocument(user.telegramId.toString(),
                fs.readFileSync(vmDetails.keyFilePath),
                {
                    caption: `Save this private key file securely. Never share it with anyone. Filename: private_key_${userId}.pem`,
                }, {
                    filename: `private_key_${userId}.pem`,
                    contentType: 'application/x-pem-file',
                }
            );


            fs.unlinkSync(vmDetails.keyFilePath);




            await bot.sendMessage(user.telegramId.toString(), vmStartInstructions(vmDetails, user.telegramId.toString()), {
                parse_mode: 'Markdown',
            });

            console.log(`Transaction ${updateTnx.id} updated successfully`);
        }

    } catch (error) {
        console.error('Error processing webhook:', error);
    }
}