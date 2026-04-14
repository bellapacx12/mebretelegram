import TelegramBot, { Message, CallbackQuery } from "node-telegram-bot-api";
import { mainMenuKeyboard } from "../keyboards/mainMenu";
import { api } from "../services/api";

const balanceCommand = (bot: TelegramBot) => {
  // ----------------------
  // /balance command
  // ----------------------
  bot.onText(/\/balance/, async (msg: Message) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id;

    if (!telegramId) {
      return bot.sendMessage(chatId, "⚠️ Unable to determine your Telegram ID.", {
        reply_markup: mainMenuKeyboard(),
      });
    }

    try {
      const user = await api.getUser(telegramId);

      if (!user) {
        return bot.sendMessage(
          chatId,
          "⚠️ You are not registered yet. Please use /start to register.",
          { reply_markup: mainMenuKeyboard() }
        );
      }

      const balance = user.balance ?? 0;
      await bot.sendMessage(chatId, `💰 Balance: ${balance} ETB`, {
        reply_markup: mainMenuKeyboard(),
      });
    } catch (err) {
      console.error("[BALANCE HANDLER ERROR]", err);
      await bot.sendMessage(chatId, "❌ Unable to fetch balance. Please try again later.", {
        reply_markup: mainMenuKeyboard(),
      });
    }
  });

  // ----------------------
  // Inline button callback
  // ----------------------
  bot.on("callback_query", async (query: CallbackQuery) => {
    if (query.data !== "balance") return;

    const chatId = query.message?.chat.id;
    const telegramId = query.from?.id;

    if (!chatId || !telegramId) return;

    try {
      const user = await api.getUser(telegramId);

      if (!user) {
        await bot.sendMessage(
          chatId,
          "⚠️ You are not registered yet. Please use /start to register.",
          { reply_markup: mainMenuKeyboard() }
        );
      } else {
        const balance = user.balance ?? 0;
        await bot.sendMessage(chatId, `💰 Balance: ${balance} ETB`, {
          reply_markup: mainMenuKeyboard(),
        });
      }
    } catch (err) {
      console.error("[BALANCE CALLBACK ERROR]", err);
      await bot.sendMessage(chatId, "❌ Unable to fetch balance. Please try again later.", {
        reply_markup: mainMenuKeyboard(),
      });
    } finally {
      await bot.answerCallbackQuery(query.id); // always answer to clear "loading..."
    }
  });
};

export default balanceCommand;
