import TelegramBot from "node-telegram-bot-api";

export const registerBotMenu = (bot: TelegramBot) => {
  bot
    .setMyCommands([
      { command: "start", description: "Start the bot" },
      { command: "balance", description: "Check your balance" },
      { command: "deposit", description: "Deposit funds" },
      { command: "withdraw", description: "Withdraw funds" },
      { command: "play", description: "Play Bingo" },
    ])
    .then(() => {
      console.log("✅ Bot command menu set!");
    })
    .catch(console.error);
};
