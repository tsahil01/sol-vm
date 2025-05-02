import { Router } from "express";
import { WebhookEvent } from "../types";

const router = Router();

router.post('/', (req: any, res: any) => {
    const { body } = req;
    if (!body) {
        return res.status(400).send('No body');
    }

    try {
        let webhookId = "";
        let createdAt = "";
        let signature = "";
        let sender = "";
        let receiver = "";
        let amtTransfer = 0;

        const data: WebhookEvent = body;

        if (data.type === "ADDRESS_ACTIVITY") {
            const event = data.event;
            const transactions = event?.transaction;

            if (!transactions || transactions.length === 0) {
                console.log('No event or transaction');
                return res.status(400).send('No event or transaction');
            }

            const firstTx = transactions[0];
            webhookId = data.webhookId;
            createdAt = data.createdAt;
            signature = firstTx.signature;

            if (!signature) {
                console.log('No signature');
                return res.status(400).send('No signature');
            }

            const actualTransaction = firstTx.transaction?.[0];
            const message = actualTransaction?.message?.[0];

            if (!message || !message.account_keys || message.account_keys.length < 2) {
                console.log('Invalid or missing message.account_keys');
                return res.status(400).send('Invalid or missing message.account_keys');
            }

            sender = message.account_keys[0];
            receiver = message.account_keys[1];

            const meta = firstTx.meta?.[0];
            if (!meta || !meta.pre_balances || !meta.post_balances) {
                console.log('Invalid meta or balances');
                return res.status(400).send('Invalid meta or balances');
            }

            const preSender = meta.pre_balances[0];
            const postSender = meta.post_balances[0];
            const preReceiver = meta.pre_balances[1];
            const postReceiver = meta.post_balances[1];

            amtTransfer = preSender - postSender;
            if (amtTransfer <= 0) {
                amtTransfer = postReceiver - preReceiver;
            }

            if (amtTransfer <= 0) {
                console.log('No amount transferred');
                return res.status(400).send('No amount transferred');
            }

            console.log(`Webhook ID: ${webhookId}`);
            console.log(`Created At: ${createdAt}`);
            console.log(`Signature: ${signature}`);
            console.log(`Sender: ${sender}`);
            console.log(`Receiver: ${receiver}`);
            console.log(`Amount Transferred: ${amtTransfer}`);
        }

        res.sendStatus(200);

    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).send('Internal Server Error');
    }
});


export default router;