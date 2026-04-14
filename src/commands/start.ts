import TelegramBot, { Message } from "node-telegram-bot-api";
import { mainMenuKeyboard } from "../keyboards/mainMenu";
import { api } from "../services/api";
import { getSession } from "../middlewares/session";

export const startCommand = (bot: TelegramBot) => {
  // ----------------------
  // /start command
  // ----------------------
  bot.onText(/^\/start$/, async (msg: Message) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id;
    const name = msg.from?.username || msg.from?.first_name || "Player";

    if (!telegramId) {
      return bot.sendMessage(
        chatId,
        "❌ Cannot identify you. Please try again."
      );
    }

    const session = getSession(chatId);

    try {
      const exists = await api.checkUser(telegramId);

      if (!exists) {
        session.state = "awaiting_phone";
        return bot.sendMessage(
          chatId,
          "📱 Please share your phone number to complete registration.",
          {
            reply_markup: {
              keyboard: [
                [{ text: "📲 Share Phone Number", request_contact: true }],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
      }

      // User exists, reset session and show menu
      delete session.state;
      return bot.sendMessage(chatId, `👋 Welcome back, *${name}*!`, {
        parse_mode: "Markdown",
        reply_markup: mainMenuKeyboard(),
      });
    } catch (err) {
      console.error("❌ Error checking user:", err);
      return bot.sendMessage(
        chatId,
        "⚠️ Registration check failed. Please try again later."
      );
    }
  });

  // ----------------------
  // Handle contact (phone number)
  // ----------------------
  bot.on("contact", async (msg: Message) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id;
    const name = msg.from?.username || msg.from?.first_name || "Player";
    const phone = msg.contact?.phone_number;

    if (!telegramId || !phone) {
      return bot.sendMessage(
        chatId,
        "❌ Could not get your phone number. Please try again."
      );
    }

    const session = getSession(chatId);

    if (session.state !== "awaiting_phone") {
      // Ignore random contact messages 
      return;
    }

    try {
      const userExists = await api.checkUser(telegramId);

      if (!userExists) {
        await api.registerUser({
          telegram_id: telegramId,
          username: name,
          phone,
        });
      } else {
        await api.updatePhone(telegramId, phone);
      }

      delete session.state; // clear state

      await bot.sendMessage(
        chatId,
        `✅ Registration complete!\n👋 Welcome, *${name}*!`,
        {
          parse_mode: "Markdown",
          reply_markup: mainMenuKeyboard(),
        }
      );
    } catch (err) {
      console.error("❌ Registration error:", err);
      await bot.sendMessage(
        chatId,
        "⚠️ Failed to register. Please try again later."
      );
    }
  });
};

export default startCommand;
