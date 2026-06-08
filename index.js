const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const app = express();

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (text === "/start") {
    return bot.sendMessage(
      chatId,
      "Hello 😊\n\nWelcome to RealMeet.\n\n📍 Which City/Area do you want?"
    );
  }

  bot.sendMessage(
    chatId,
    "😊 Thanks for your message.\n\n📍 Please tell me your City/Area."
  );
});

app.get("/", (req, res) => {
  res.send("RealMeet Bot Running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server Started");
});
