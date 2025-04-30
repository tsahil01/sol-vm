import { config } from 'dotenv';
import { botInit, handleCallbackQuery, handleTextMessage } from './bot';
import TelegramBot from 'node-telegram-bot-api';
config();
const token = process.env.TELEGRAM_BOT_TOKEN!;

const bot = new TelegramBot(token, { polling: true });

botInit(bot);

bot.on('callback_query', async (callbackQuery) => {
    handleCallbackQuery(bot, callbackQuery);
});

bot.on('message', async (msg) => {
    handleTextMessage(bot, msg);
})