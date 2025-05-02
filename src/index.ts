import { config } from 'dotenv';
import { botInit, handleCallbackQuery, handleTextMessage } from './bot';
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '../generated/prisma';
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

app.post('/webhook', (req: any, res: any) => {
    const { body } = req;
    if (!body) {
        return res.status(400).send('No body');
    }
    console.log('Received webhook:', body);
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
