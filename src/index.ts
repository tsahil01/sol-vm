import { config } from 'dotenv';
import { botInit, handleCallbackQuery, handleTextMessage } from './bot';
import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '../generated/prisma';
config();

const token = process.env.TELEGRAM_BOT_TOKEN!;

export const db = new PrismaClient();

const bot = new TelegramBot(token, { polling: true });

botInit(bot);

bot.on('callback_query', async (callbackQuery) => {
    handleCallbackQuery(bot, callbackQuery);
});

bot.on('message', async (msg) => {
    handleTextMessage(bot, msg);
})