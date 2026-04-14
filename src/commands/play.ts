import TelegramBot, { Message, CallbackQuery } from "node-telegram-bot-api";
import { mainMenuKeyboard } from "../keyboards/mainMenu";
import { api } from "../services/api";

const playCommand = (bot: TelegramBot) => {
  // ----------------------
  // Show play options
  // ----------------------
  const showPlayOptions = async (chatId: number) => {
    const options: TelegramBot.SendMessageOptions = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Play 10", callback_data: "play_10" },
            { text: "Play 20", callback_data: "play_20" },
          ],
          [
            { text: "Play 50", callback_data: "play_50" },
            { text: "Play 100", callback_data: "play_100" },
          ],
          [{ text: "⬅ Back", callback_data: "main_menu" }],
        ],
      },
    };

    return bot.sendMessage(chatId, "🎮 Choose your stake:", options);
  };

  // ----------------------
  // Ensure user exists
  // ----------------------
  const ensureUser = async (telegramId: number, username: string) => {
    const exists = await api.checkUser(telegramId);
    if (!exists) {
      await api.registerUser({
        telegram_id: telegramId,
        username,
        phone: "",
      });
    }
    return api.getUser(telegramId);
  };

  // ----------------------
  // /play command
  // ----------------------
  bot.onText(/\/play/, (msg: Message) => {
    showPlayOptions(msg.chat.id);
  });

  // ----------------------
  // Handle button callbacks
  // ----------------------
  bot.on("callback_query", async (query: CallbackQuery) => {
    const chatId = query.message?.chat.id;
    const telegramId = query.from?.id;
    const data = query.data;

    if (!chatId || !telegramId || !data) return;

    try {
      // Back to main menu
      if (data === "main_menu") {
        await bot.sendMessage(chatId, "⬅ Back to main menu", {
          reply_markup: mainMenuKeyboard(),
        });
        return bot.answerCallbackQuery(query.id);
      }

      // Show stake options again
      if (data === "play") {
        await showPlayOptions(chatId);
        return bot.answerCallbackQuery(query.id);
      }

      // Handle stake selection
      if (/^play_\d+$/.test(data)) {
        const stake = parseInt(data.replace("play_", ""), 10);

        // Ensure user exists
        const user = await ensureUser(
          telegramId,
          query.from.username || query.from.first_name || "Anonymous"
        );

        // Balance check
        if (!user || user.balance < stake) {
          await bot.sendMessage(
            chatId,
            `❌ Insufficient balance!\n💰 Your balance: ${
              user?.balance ?? 0
            } ETB\n\nPlease deposit before playing.`,
            { reply_markup: mainMenuKeyboard() }
          );
          return bot.answerCallbackQuery(query.id);
        }

        // Respond to Telegram
        await bot.sendMessage(chatId, `🎮 You selected *${stake} ETB*.\n!`, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "ጨወታ ጀምር",
                  web_app: {
                    url: `https://yonifrontend.vercel.app/stake/${stake}?user=${telegramId}`,
                  },
                },
              ],
              [{ text: "⬅ Back", callback_data: "play" }],
            ],
          },
        });

        return bot.answerCallbackQuery(query.id);
      }
    } catch (err) {
      console.error("[PLAY CALLBACK ERROR]", err);
      await bot.sendMessage(
        chatId,
        "❌ Something went wrong while joining the lobby.\nPlease try again later."
      );
      return bot.answerCallbackQuery(query.id);
    }
  });
};

export default playCommand;
