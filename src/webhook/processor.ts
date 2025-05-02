import { db, receiverAddress } from "..";
import { WebhookEvent } from "../types";

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

            console.log(`Webhook ID: ${webhookId}`);
            console.log(`Created At: ${createdAt}`);
            console.log(`Signature: ${signature}`);
            console.log(`Sender: ${sender}`);
            console.log(`Receiver: ${receiver}`);
            console.log(`Amount Transferred: ${amtTransfer}`);
            console.log(`Fee: ${fee}`);

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

            console.log(`Transaction ${updateTnx.id} updated successfully`);
        }

    } catch (error) {
        console.error('Error processing webhook:', error);
    }
}