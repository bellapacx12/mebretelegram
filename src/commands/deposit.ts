import TelegramBot, { CallbackQuery, Message } from "node-telegram-bot-api";
import { api } from "../services/api";
import { getSession, MySession, resetSession } from "../middlewares/session";

// -----------------------------
// Helpers
// -----------------------------
function showDepositMenu(bot: TelegramBot, chatId: number) {
  console.log("[DEBUG] Showing deposit menu to chat:", chatId);
  return bot.sendMessage(chatId, "💳 እባክዎ የገንዘብ መክፈል ዘዴዎን ይምረጡ:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 Manual", callback_data: "deposit_momo" }],
        [{ text: "⬅ Back", callback_data: "main_menu" }],
      ],
    },
  });
}

async function showPaymentDetails(
  bot: TelegramBot,
  chatId: number,
  session: any,
  msg: Message
) {
  let phone = "Not shared";
  try {
    const dbUser = await api.getUser(msg.from!.id);
    if (dbUser?.phone) phone = dbUser.phone;
  } catch (err) {
    console.error("❌ Failed to fetch phone:", err);
  }

  console.log("[DEBUG] Showing payment details:", {
    name: session.name,
    phone,
    amount: session.amount,
    reference: session.reference,
  });

  function escapeMarkdownV2(text: string) {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
  }

  const name = escapeMarkdownV2(session.name);
  const phoneEscaped = escapeMarkdownV2(phone);
  const amount = escapeMarkdownV2(String(session.amount));
  const reference = escapeMarkdownV2(session.reference);

  const depositMethods = escapeMarkdownV2(
    `1. ከቴሌብር ወደ ኤጀንት ቴሌብር ብቻ
2. ከንግድ ባንክ ወደ ኤጀንት ንግድ ባንክ ብቻ
3. ከሲቢኢ ብር ወደ ኤጀንት ሲቢኢ ብር ብቻ
4. ከአቢሲኒያ ባንክ ወደ ኤጀንት አቢሲኒያ ባንክ ብቻ`
  );

  const codeBlock = `\`\`\`
Name:      ${name}
Phone:     ${phoneEscaped}
Amount:    ${amount}ETB
Reference: ${reference}
\`\`\`

ብር ማስገባት የምችሉት ከታች ባሉት አማራጮች ብቻ ነው:
${depositMethods}`;

  return bot.sendMessage(chatId, codeBlock, {
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "💰 Telebirr ወደ Telebirr", callback_data: "pay_telebirr" }],
        [{ text: "💰 CBE ወደ CBE", callback_data: "pay_cbe" }],
        [{ text: "⬅ Back", callback_data: "main_menu" }],
      ],
    },
  });
}

async function showTelebirrPayment(
  bot: TelegramBot,
  chatId: number,
  session: any
) {
  const account = "0967623621";

  function escapeMarkdownV2(text: string) {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
  }

  const amount = escapeMarkdownV2(String(session.amount));

  // First code block (account)
  const accountBlock = "```\n" + account + "\n```";

  // Second code block (instructions)
  const instructions = `
1. ከላይ ባለው የቴሌብር አካውንት ${amount}ብር ያስገቡ
2. የምትልኩት የገንዘብ መጠን እና እዚ ላይ እንዲሞላው የምታስገቡት የብር መጠን ተመሳሳይ መሆኑን እርግጠኛ ይሁኑ
3. ብሩን ስትልኩ የከፈላችሁበትን መረጃ አጭር መልክት (sms) ከቴሌብር ይደርሳችሁ
4. የደረሳችሁን አጭር የጹሁፍ መለክት (sms) ሙሉውን ኮፒ (copy) በማረግ ከታሽ ባለው የቴሌግራም የጹሁፍ ማስገቢአው ላይ ፔስት (paste) በማረግ ይላኩት
ማሳሰቢያ: ዲፖዚት ባረጋቹ ቁጥር ቦቱ የሚያገናኛቹ ኤጀንቶች ስለሚለያዩ ከላይ ወደሚሰጣቹ የቴሌብር አካውንት ብቻ ብር መላካችሁን እርግጠኛ ይሁኑ
ዲፖዚት ስታረጉ ቦቱ ከሚያገናኛቹ ኤጀንት ውጪ ወደ ሌላ ኤጀንት ብር ከላካቹ ቦቱ 2% ቆርጦ ይልክላችኋል
`;

  const instructionsBlock = "```\n" + escapeMarkdownV2(instructions) + "\n```";

  // Footer (plain, escaped)
  const footer = escapeMarkdownV2(
    `የሚያጋጥማቹ የክፍያ ችግር ካለ @yoni5357 በዚ ኤጀንቱን ማዋራት ይችላሉ በዚ ሳፖርት ማዉራት ይችላሉ

የከፈለችሁበትን አጭር የጹሁፍ መለክት (sms) እዚ ላይ ያስገቡት 👇👇👇`
  );

  // Final message combined
  const finalMessage = `${accountBlock}\n${instructionsBlock}\n${footer}`;
  session.state = "awaiting_sms";
  return bot.sendMessage(chatId, finalMessage, { parse_mode: "MarkdownV2" });
}

async function showCbeePayment(bot: TelegramBot, chatId: number, session: any) {
  const account = "1000721937667";

  function escapeMarkdownV2(text: string) {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
  }
  const amount = escapeMarkdownV2(String(session.amount));
  // First code block (account)
  const accountBlock = "```\n" + account + "\n```";

  const instructions = `
  1. ከላይ ባለው የኢትዮጵያ ንግድ ባንክ አካውንት ${amount}ብር ያስገቡ

2. የምትልኩት የገንዘብ መጠን እና እዚ ላይ እንዲሞላልዎ የምታስገቡት የብር መጠን ተመሳሳይ መሆኑን እርግጠኛ ይሁኑ

3. ብሩን ስትልኩ የከፈላችሁበትን መረጃ የያዝ አጭር የጹሁፍ መልክት(sms) ከኢትዮጵያ ንግድ ባንክ ይደርሳችኋል

4. የደረሳችሁን አጭር የጹሁፍ መለክት(sms) ሙሉዉን ኮፒ(copy) በማረግ ከታሽ ባለው የቴሌግራም የጹሁፍ ማስገቢአው ላይ ፔስት(paste) በማረግ ይላኩት 

5. ብር ስትልኩ የምትጠቀሙት USSD(889) ከሆነ አንዳንዴ አጭር የጹሁፍ መለክት(sms) ላይገባላቹ ስለሚችል ከUSSD(889) ሂደት መጨረሻ ላይ Complete የሚለው ላይ ስደርሱ 3 ቁጥርን በመጫን የትራንዛክሽን ቁጥሩን ሲያሳያቹህ ትራንዛክሽን ቁጥሩን ጽፎ ማስቀመጥ ይኖርባችኋል 

ማሳሰቢያ፡ 1. አጭር የጹሁፍ መለክት(sms) ካልደረሳቹ ያለትራንዛክሽን ቁጥር ሲስተሙ ዋሌት ስለማይሞላላቹ የከፈላችሁበትን ደረሰኝ ከባንክ በመቀበል በማንኛውም ሰአት ትራንዛክሽን ቁጥሩን ቦቱ ላይ ማስገባት ትችላላቹ 

       2. ዲፖዚት ባረጋቹ ቁጥር ቦቱ የሚያገናኛቹ ኤጀንቶች ስለሚለያዩ ከላይ ወደሚሰጣቹ የኢትዮጵያ ንግድ ባንክ አካውንት ብቻ ብር መላካችሁን እርግጠኛ ይሁኑ። ዲፖዚት ስታረጉ ቦቱ ከሚያገናኛቹ ኤጀንት ዉጪ ወደ ሌላ ኤጀንት ብር ከላካቹ ቦቱ 2% ቆርጦ ይልክላችኋል 
  `;

  const instructionsBlock = "```\n" + escapeMarkdownV2(instructions) + "\n```";

  const footer = escapeMarkdownV2(
    `የሚያጋጥማቹ የክፍያ ችግር ካለ @yoni5357 በዚ ኤጀንቱን ማዋራት ይችላሉ በዚ ሳፖርት ማዉራት ይችላሉ

የከፈለችሁበትን አጭር የጹሁፍ መለክት (sms) እዚ ላይ ያስገቡት 👇👇👇`
  );

  const finalMessage = `${accountBlock}\n${instructionsBlock}\n${footer}`;
  session.state = "awaiting_sms";
  return bot.sendMessage(chatId, finalMessage, { parse_mode: "MarkdownV2" });
}
async function showCbePayment(bot: TelegramBot, chatId: number, session: any) {
  const account = "1000721937667";

  function escapeMarkdownV2(text: string) {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
  }

  const amount = escapeMarkdownV2(String(session.amount));

  // -----------------------------
  // Step 1: Send the account with a copy button
  // -----------------------------
  await bot.sendMessage(chatId, "💳 የኢትዮጵያ ንግድ ባንክ አካውንት ቁጥር:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: account,
            callback_data: "copy_account",
          },
        ],
        [{ text: "⬅ Back", callback_data: "main_menu" }],
      ],
    },
  });

  // -----------------------------
  // Step 2: Send instructions separately
  // -----------------------------
  const instructions = `
1. ከላይ ባለው አካውንት ቁጥር ${amount}ብር ያስገቡ
2. የምትልኩት የገንዘብ መጠን ትክክለኛ መሆኑን እርግጠኛ ይሁኑ
3. ብሩን ስትልኩ የደረሰውን አጭር የጹሁፍ መልክት (SMS) ከባንክ ይቀበሉ
4. አጭር የጹሁፍ መልክት (SMS) በትክክለኛነት በታሽ ባለው ቦቱ ያስገቡ
`;

  await bot.sendMessage(
    chatId,
    "📜 መመሪያዎች:\n" + escapeMarkdownV2(instructions),
    {
      parse_mode: "MarkdownV2",
    }
  );

  // -----------------------------
  // Step 3: Send footer separately
  // -----------------------------
  const footer = `
የሚያጋጥማቹ የክፍያ ችግር ካለ @yoni5357 በዚ ኤጀንቱን ማዋራት ይችላሉ
እባክዎ ከላይ ያለው ቁጥር ብቻ ያንብቡ እና SMS ላይ ያስገቡ
`;

  await bot.sendMessage(chatId, escapeMarkdownV2(footer), {
    parse_mode: "MarkdownV2",
  });

  session.state = "awaiting_sms";
}

async function waitForVerification(
  bot: TelegramBot,
  chatId: number,
  text: string,
  session: any
) {
  const maxAttempts = 5; // check 5 times
  const interval = 5000; // every 5 seconds

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[VERIFY] Attempt ${attempt}/${maxAttempts}`);

    try {
      const response = await api.verifyDeposit({
        userId: chatId,
        sms: text,
        expectedAmount: session.amount ?? 0,
        reference: session.reference ?? "",
      });

      if (response.success) {
        await bot.sendMessage(
          chatId,
          `✅ ክፍያዎ ተረጋግጧል!\nመጠን: ${response.amount}`
        );
        session.state = "deposit_verified";
        return true;
      }
    } catch (err) {
      console.error("[VERIFY ERROR]", err);
    }

    if (attempt < maxAttempts) {
      await new Promise((res) => setTimeout(res, interval));
    }
  }

  await bot.sendMessage(
    chatId,
    "❌ ክፍያ አልተረጋገጠም። እባክዎ ትክክለኛ የግብይት መልክት (SMS) ያስገቡ።"
  );
  return false;
}

// -----------------------------
// Deposit Command
// -----------------------------
export function depositCommand(bot: TelegramBot) {
  bot.onText(/\/deposit/, (msg: Message) => {
    console.log("[DEBUG] /deposit command received from chat:", msg.chat.id);
    showDepositMenu(bot, msg.chat.id);
  });

  bot.on("callback_query", async (query: CallbackQuery) => {
    if (!query.from?.id || !query.message?.chat.id || !query.data) return;

    const chatId = query.message.chat.id;
    const session = getSession(chatId);

    console.log("[DEBUG] Callback query received:", {
      data: query.data,
      chatId,
      userId: query.from.id,
      session,
    });

    try {
      switch (query.data) {
        case "deposit":
          resetSession(chatId);
          await showDepositMenu(bot, chatId);
          break;

        case "deposit_momo":
          session.state = "awaiting_deposit_amount";
          await bot.sendMessage(chatId, "💰 እባክዎ የገንዘብ መጠን ያስገቡ:");
          break;

        case "main_menu":
          resetSession(chatId);
          await bot.sendMessage(chatId, "⬅ Back to main menu");
          break;

        case "pay_telebirr":
          if (session.state !== "deposit_ready") {
            await bot.sendMessage(chatId, "⚠ እባክዎ በመጀመሪያ መጠን ያስገቡ.");
          } else {
            await showTelebirrPayment(bot, chatId, session);
          }
          break;
        case "pay_cbe":
          if (session.state !== "deposit_ready") {
            await bot.sendMessage(chatId, "⚠ እባክዎ በመጀመሪያ መጠን ያስገቡ.");
          } else {
            await showCbePayment(bot, chatId, session);
          }
          break;
      }

      await bot.answerCallbackQuery(query.id);
    } catch (err) {
      console.error("[DEPOSIT CALLBACK ERROR]", err);
      if (query.id)
        await bot.answerCallbackQuery(query.id, { text: "❌ Error" });
    }
  });

  bot.on("message", async (msg: Message) => {
    if (!msg.from?.id || !msg.chat.id || !msg.text) return;

    const chatId = msg.chat.id;
    const session = getSession(chatId);
    const text = msg.text.trim();

    // Step 1: Deposit amount
    if (session.state === "awaiting_deposit_amount") {
      console.log("[DEBUG] Deposit amount input received:", {
        text,
        chatId,
        userId: msg.from.id,
      });

      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        return bot.sendMessage(chatId, "❌ ትክክለኛ ቁጥር ያስገቡ እባክዎን.");
      }

      session.amount = amount;
      session.name =
        [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ") ||
        "User";
      session.reference = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();
      session.state = "deposit_ready";

      return showPaymentDetails(bot, chatId, session, msg);
    }

    // Step 2: Handle pasted SMS
    if (session.state === "awaiting_sms") {
      console.log("[DEBUG] User pasted SMS:", text);

      // Send temporary loading message
      const verifyingMsg = await bot.sendMessage(
        chatId,
        "⏳ እባክዎ ይጠብቁ... ክፍያዎ በመረጋገጥ ላይ ነው።"
      );

      const success = await waitForVerification(bot, chatId, text, session);

      if (!success) {
        await bot.editMessageText("አልተገኘም። እንደገና ይሞክሩ።", {
          chat_id: chatId,
          message_id: verifyingMsg.message_id,
        });
      } else {
        await bot.deleteMessage(chatId, verifyingMsg.message_id);
      }
    }
  });
}
