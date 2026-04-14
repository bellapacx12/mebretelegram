import TelegramBot, { Message, CallbackQuery } from "node-telegram-bot-api";
import { getSession, resetSession, withSession, MySession } from "../middlewares/session";
import { api } from "../services/api";
import { mainMenuKeyboard } from "../keyboards/mainMenu"; // import your main menu

export const withdrawCommand = (bot: TelegramBot) => {
  bot.on("callback_query", (query: CallbackQuery) => {
    const chatId = query.message?.chat.id;
    if (!chatId || !query.data) return;

    const session = getSession(chatId);

    // Withdraw flow
    if (query.data === "withdraw") {
      session.state = "awaiting_amount";
      bot.sendMessage(chatId, "🏦 Please enter the amount to withdraw:", {
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 Back", callback_data: "back_main" }]],
        },
      });
      bot.answerCallbackQuery(query.id);
      return;
    }

    // Back to main menu
    if (query.data === "back_main") {
      resetSession(chatId);
      bot.sendMessage(chatId, "🏠 Returning to main menu", {
        reply_markup: mainMenuKeyboard(),
      });
      bot.answerCallbackQuery(query.id);
      return;
    }

    // Method selection (Telebirr/CBE)
    if (query.data === "method_telebirr" || query.data === "method_cbe") {
      session.tempData = { method: query.data === "method_telebirr" ? "Telebirr" : "CBE" };
      session.state = "awaiting_account";

      bot.sendMessage(chatId, `📄 Please enter your ${session.tempData.method} account number:`, {
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 Back", callback_data: "back_main" }]],
        },
      });
      bot.answerCallbackQuery(query.id);
      return;
    }
  });

  // Handle step-by-step withdraw flow
  withSession(bot, async (msg: Message, session: MySession) => {
    if (!msg.text || !msg.chat) return;
    const chatId = msg.chat.id;
    const text = msg.text;

    switch (session.state) {
      case "awaiting_amount":
        const amount = Number(text);
        if (isNaN(amount) || amount <= 0) {
          bot.sendMessage(chatId, "❌ Please enter a valid amount.");
          return;
        }
        session.amount = amount;
        session.state = "awaiting_method";

        bot.sendMessage(chatId, "💳 Please choose a payment method:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Telebirr", callback_data: "method_telebirr" }],
              [{ text: "CBE", callback_data: "method_cbe" }],
              [{ text: "🔙 Back", callback_data: "back_main" }],
            ],
          },
        });
        break;

      case "awaiting_account":
        session.tempData = { ...session.tempData, account: text };

        try {
          const response = await api.withdraw({
            telegramId: chatId,
            amount: session.amount,
            method: session.tempData.method,
            account: session.tempData.account,
          });

          bot.sendMessage(
            chatId,
            `✅ Your withdrawal request of ${response.data.amount} has been submitted successfully!\n\n📌 Please wait up to 2 minutes for processing. If there is any delay, our admin @bpac12 will follow up.`,
            { reply_markup: mainMenuKeyboard() }
          );
        } catch (err: any) {
          console.error("Withdrawal API error:", err);
          bot.sendMessage(chatId, "❌ Failed to submit your withdrawal. Please try again later.", {
            reply_markup: mainMenuKeyboard(),
          });
        }

        resetSession(chatId);
        break;

      default:
        break;
    }
  });
};

export default withdrawCommand;
