const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const app = express();

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

const users = {};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!users[chatId]) {
    users[chatId] = {
      step: "city",
    };

    return bot.sendMessage(
      chatId,
      "📍 Which City/Area do you want? ✅"
    );
  }

  if (users[chatId].step === "city") {
    users[chatId].city = text;
    users[chatId].step = "name";

    return bot.sendMessage(
      chatId,
      `Thank you 😊\n\nService is available in ${text}.\n\nMay I know your name?`
    );
  }

  if (users[chatId].step === "name") {
    users[chatId].name = text;
    users[chatId].step = "done";

    return bot.sendMessage(
      chatId,
      `Nice to meet you ${text} 😊\n\nWe provide Private Meeting, Home Service and Wellness Services across India.\n\nHow may I help you today?`
    );
  }

  bot.sendMessage(
    chatId,
    `I received: ${text}`
  );
});

app.get("/", (req, res) => {
  res.send("RealMeet Bot Running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server Started");
});
