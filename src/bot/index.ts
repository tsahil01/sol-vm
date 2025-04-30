import TelegramBot from "node-telegram-bot-api";
import { token } from "..";

export async function handleBot() {
    const bot = new TelegramBot(token, { polling: true });

    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const welcomeMessage = `Hello!\nWelcome to Solana VM Bot.\nThis bot enables you to rent a cloud VM on Google Cloud Platform (GCP) and pay it via Solana.\n\nTo get started, please choose an option from the menu below.\nUse /help to see all commands.`;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '💻 Rent VM', callback_data: 'rent' },
                        { text: '📋 My VMs', callback_data: 'my_vms' }
                    ],
                    [
                        { text: 'Available VMs', callback_data: 'available' },
                        { text: '📊 Usage Stats', callback_data: 'usage' },
                    ],
                    [
                        { text: '❓ Help', callback_data: 'help' },
                    ]
                ]
            }
        };

        bot.sendMessage(chatId, welcomeMessage, options);
    });

    bot.on('callback_query', (callbackQuery) => {
        const action = callbackQuery.data;
        const msg = callbackQuery.message;

        if (!msg) return;

        const chatId = msg.chat.id;

        switch (action) {
            case 'help':
                const helpMessage = `Solana VM Bot lets you rent a GCP VM and pay with Solana.\nAvailable commands:\n\n` +
                    `/start - Start a new Session\n` +
                    `/end - End the current session\n` +
                    `/rent - Rent a new VM\n` +
                    `/my_vms - List your rented VMs\n` +
                    `/available - Show available VMs\n` +
                    `/usage - Show usage statistics\n` +
                    `/help - Show this help message\n` +
                    `\nFor more information, visit our website.`;

                bot.sendMessage(chatId, helpMessage);
                break;

            case 'rent':
                bot.sendMessage(chatId, 'Please choose a VM configuration to rent:');
                // TODO
                break;

            case 'my_vms':
                bot.sendMessage(chatId, 'Here are your currently rented VMs:');
                // TODO
                break;

            case 'available':
                bot.sendMessage(chatId, 'Here are the available VM configurations:');
                // TODO

            case 'usage':
                bot.sendMessage(chatId, 'Your current usage statistics:');
                // TODO
                break;
        }

        bot.answerCallbackQuery(callbackQuery.id);
    });

    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        const helpMessage = `Solana VM Bot lets you rent a GCP VM and pay with Solana.\nAvailable commands:\n\n` +
            `/start - Start a new Session\n` +
            `/end - End the current session\n` +
            `/rent - Rent a new VM\n` +
            `/my_vms - List your rented VMs\n` +
            `/available - Show available VMs\n` +
            `/usage - Show usage statistics\n` +
            `/help - Show this help message\n` +
            `\nFor more information, visit our website.`;

        bot.sendMessage(chatId, helpMessage);
    });

    bot.on('message', (msg) => {
        if (!msg.text?.startsWith('/')) {
            const chatId = msg.chat.id;
            bot.sendMessage(chatId, 'I only understand commands starting with /.\nTry /help to see what I can do!');
        }
    });

    console.log('Bot started successfully!');
}