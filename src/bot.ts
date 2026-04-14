import express from "express";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { registerCommands } from "./commands";
import { registerBotMenu } from "./utils/menu";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN!;
const WEBHOOK_URL = process.env.WEBHOOK_URL!;
const PORT = process.env.PORT || 8080;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is required");
if (!WEBHOOK_URL) throw new Error("WEBHOOK_URL is required");

const bot = new TelegramBot(BOT_TOKEN);
const app = express();
app.use(express.json());

// Simple in-memory session
const userData: Record<number, any> = {};

// Telegram webhook endpoint
app.post(
  `/bot${BOT_TOKEN}`,
  (
    req: { body: TelegramBot.Update },
    res: { sendStatus: (arg0: number) => void }
  ) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  }
);

// Register commands and menus
registerBotMenu(bot);
registerCommands(bot);

bot.on("message", (msg) => {
  console.log(`[${msg.from?.username || msg.from?.id}] ${msg.text}`);
});

// Set webhook
bot.setWebHook(`${WEBHOOK_URL}/bot${BOT_TOKEN}`).then(() => {
  console.log(`✅ Webhook set: ${WEBHOOK_URL}/bot${BOT_TOKEN}`);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { bot, userData };
