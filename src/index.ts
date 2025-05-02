import { config } from 'dotenv';
import { botInit, handleCallbackQuery, handleTextMessage } from './bot';
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '../generated/prisma';
import webhookRouter from './webhook';
config();

const token = process.env.TELEGRAM_BOT_TOKEN!;
const port = process.env.PORT || 3000;

export const db = new PrismaClient();

const app = express();
app.use(express.json());
app.use(cors());

const bot = new TelegramBot(token, { polling: true });
botInit(bot);

bot.on('callback_query', async (callbackQuery) => {
    handleCallbackQuery(bot, callbackQuery);
});

bot.on('message', async (msg) => {
    handleTextMessage(bot, msg);
})

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/webhook', webhookRouter)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
