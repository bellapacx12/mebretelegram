import TelegramBot, { Message } from "node-telegram-bot-api";

export interface MySession {
  reference?: string; // ✅ make optional
  state?: string;
  tempData?: any;

  // Deposit-specific fields
  amount?: number;
  name?: string;
}

// Simple in-memory session store
const sessions: Record<number, MySession> = {};

// -----------------------------
// Get session for a chat
// -----------------------------
export const getSession = (chatId: number): MySession => {
  if (!sessions[chatId]) {
    sessions[chatId] = {}; // ✅ create empty but valid session
  }
  return sessions[chatId];
};

// -----------------------------
// Reset session completely
// -----------------------------
export const resetSession = (chatId: number) => {
  sessions[chatId] = {};
};

// -----------------------------
// Middleware-like wrapper
// -----------------------------
// NOTE: If you use this for many features, consider using
// bot.addListener("message", ...) instead of bot.on("message")
// so you can later remove it with bot.removeListener().
export const withSession = (
  bot: TelegramBot,
  handler: (msg: Message, session: MySession) => void
) => {
  bot.on("message", (msg) => {
    if (!msg.chat) return;
    const session = getSession(msg.chat.id);
    handler(msg, session);
  });
};
