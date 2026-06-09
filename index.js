require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { GoogleGenAI } = require('@google/generative-ai');

// Tokens initialization from environment variables
const token = process.env.BOT_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Priya Smart AI Engine is Active!'));
app.listen(port, () => console.log(`Web server tracking on port ${port}`));

// Import the system prompt you committed earlier
const { PRIYA_CHATBOT_SYSTEM_PROMPT } = require('./index.js'); // Agar prompt alag file me h toh uska path de dena, verna ye isi file me top pe rakh skte ho.

// Chat history sessions ko save rakhne kelie local object memory
const chatSessions = {};

bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userInput = msg.text.trim();

  try {
    // Agar is user ka chat session pehle se nahi bana hai toh naya banao system prompt ke sath
    if (!chatSessions[chatId]) {
      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash", // Super-fast dynamic real-time model
        systemInstruction: PRIYA_CHATBOT_SYSTEM_PROMPT
      });
      chatSessions[chatId] = model.startChat({ history: [] });
    }

    // Gemini AI ko user ka message bhejo aur response ka wait karo
    const result = await chatSessions[chatId].sendMessage(userInput);
    const replyText = result.response.text();

    // Inline button send karna har message ke end me call slot booking ke liye
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔒 Call Slot Book Karo (₹49)", url: "https://yourwebsite.com" } // Yahan apna payment/website link daal dena
          ]
        ]
      }
    };

    // Main Priya ka smart reply user ko deliver karo
    await bot.sendMessage(chatId, replyText, inlineKeyboard);

  } catch (error) {
    console.error("AI processing error:", error);
    // Agar AI fail ho jaye ya token error aaye toh safety fallback reply
    bot.sendMessage(
      chatId, 
      "Suno na jaan, abhi server pe thoda kaam chal rha h babu... Aap tab tak direct hamari head Khushi Mam se baat kar lijiye, wo sab setting fix kar dengi! 🥰\n\n🔒 Bas ₹49 pay karke apna call slot lock karo aur 2 min me call connect ho jayegi!"
    );
  }
});

console.log("Priya Main Bot Core System Operational...");
