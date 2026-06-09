const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const users = {};

async function askGemini(userMessage, userData) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
You are Priya, a warm and professional assistant.

User City: ${userData.city || "Unknown"}
User Name: ${userData.name || "Unknown"}

Rules:
- Reply in the same language as the user.
- Sound natural and friendly.
- Keep replies short.
- Help users understand available services and booking process.
- Do not claim anything you don't know.
- Ask relevant follow-up questions.

User Message:
${userMessage}
`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    console.error(e);
    return "Sorry, I am facing a temporary issue. Please try again.";
  }
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  if (!users[chatId]) {
    users[chatId] = {
      step: "city",
    };

    return bot.sendMessage(
      chatId,
      "📍 Which City/Area do you want? ✅"
    );
  }

  const user = users[chatId];

  if (user.step === "city") {
    user.city = text;
    user.step = "name";

    return bot.sendMessage(
      chatId,
      `Thank you 😊\n\nService availability checked for ${text}.\n\nMay I know your name?`
    );
  }

  if (user.step === "name") {
    user.name = text;
    user.step = "chat";

    return bot.sendMessage(
      chatId,
      `Nice to meet you ${text} 😊\n\nHow may I help you today?`
    );
  }

  const reply = await askGemini(text, user);

  bot.sendMessage(chatId, reply);
});

app.get("/", (req, res) => {
  res.send("RealMeet Bot Running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server Started");
});
