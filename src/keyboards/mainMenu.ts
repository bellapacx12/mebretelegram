import TelegramBot from "node-telegram-bot-api";

// Return the raw InlineKeyboardMarkup object
export const mainMenuKeyboard = (): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [{ text: "🎮 Play Bingo", callback_data: "play" }],
    [
      { text: "💳 Deposit", callback_data: "deposit" },
      { text: "🏦 Withdraw", callback_data: "withdraw" },
    ],
    [{ text: "📊 Balance", callback_data: "balance" }],
    [{ text: "❓ Help", callback_data: "help" }],
  ],
});
