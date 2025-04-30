import { config } from 'dotenv';
import { handleBot } from './bot';
config();

export const token = process.env.TELEGRAM_BOT_TOKEN!;

handleBot()
