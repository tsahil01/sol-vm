import TelegramBot from "node-telegram-bot-api";
import { helpMessage, initOptions, welcomeMessage } from "../const";


export async function botInit(bot: TelegramBot) {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId, welcomeMessage, initOptions);
        // TODO: add new user to database
    });

    bot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId, helpMessage);
    });
}

export async function handleCallbackQuery(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;

    if (!msg) return;

    const chatId = msg.chat.id;

    switchConditions(action!, chatId, bot);

    bot.answerCallbackQuery(callbackQuery.id);
}

export async function handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) {
        await bot.sendMessage(chatId, "I couldn't understand that message. Try using /help to see available commands.");
        return;
    }

    if (!text.startsWith('/')) {
        await bot.sendMessage(chatId, "I only understand commands that start with '/'. Try /help to see available options.");
        return;
    }

    const command = text.slice(1).toLowerCase();

    switchConditions(command, chatId, bot);
}


async function switchConditions(cmd: string, chatId: number, bot: TelegramBot) {
    switch (cmd) {
        case 'help':
            await bot.sendMessage(chatId, helpMessage);
            break;

        case 'rent':
            await bot.sendMessage(chatId, 'Please choose a VM configuration to rent:');
            // TODO
            break;

        case 'my_vms':
            await bot.sendMessage(chatId, 'Here are your currently rented VMs:');
            // TODO
            break;

        case 'available':
            await bot.sendMessage(chatId, 'Here are the available VM configurations:');
            // TODO
            break;

        case 'usage':
            await bot.sendMessage(chatId, 'Your current usage statistics:');
            // TODO
            break;
    }
}