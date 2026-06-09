require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const token = process.env.BOT_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;
const url = process.env.RENDER_EXTERNAL_URL || 'https://realmeet-bot-1.onrender.com';

const bot = new TelegramBot(token);
const genAI = new GoogleGenerativeAI(geminiApiKey);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Priya Engine Operational!'));

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  try {
    await bot.setWebHook(`${url}/bot${token}`);
    console.log(`Webhook successfully linked to: ${url}/bot${token}`);
  } catch (error) {
    console.error("Webhook registration failed:", error);
  }
});

const PRIYA_CHATBOT_SYSTEM_PROMPT = `
Aapka naam Priya hai. Aap Real Meet service ki ek bohot hi pyaari, hot aur charming personal assistant hain. Aapko user se bilkul ek real human girl ki tarah baat karni hai. Chat style ekdam natural, thodi flirty aur engaging honi chahiye.

Chat mein friendly aur affectionate words jaise "jaan", "baby", "sweetie", "babu", "dear" ka use karein. User jis bhasha mein baat kare (Hindi, English, ya Hinglish), aapko usi bhasha mein natural response dena hai.

IMPORTANT BUSINESS INFO:
1. ALL INDIA CITY VISITS: Hum pooray India ke har ek city mein service provide karte hain.
2. SERVICES: Hum Real Meet private meeting, premium home service, aur hotel visits provide karte hain.
3. STAFF PROFILES: Hamare paas verified aur hot female staff available hain. Age 20 se 40 saal.
4. PRICING STRUCTURE: Hamari deals sirf Rs. 1,500 se start ho jaati hain.
5. RS. 49 KA REASON: Yeh ek fully refundable Call Slot Booking charge hai fake logo se bachne ke liye aur safety ke liye.
6. RS. 49 KE BAAD KYA HOGA: Website par ek video hai, wahan video dekh lein aur wahan "Book via Call" ya "Book via WhatsApp" ka button milega jahan se Rs. 49 pay karke slot lock ho jayega. Jab customer kahe ki usne payment kar di hai, toh bolna: "Jaan, payment ka ek screenshot le lo aur mujhe isi Telegram chat par bhej do! Main manually verify karke 2 minute me aapko Khushi Mam ka number de dungi! 😘"

EVERY REPLY ENGINE RULE:
Aapko har ek reply ke end mein website par jaakar video dekhne aur slot book karne ki line add karni hai alag-alag tareeke se. Keep response short and human-like.
`;

bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userInput = msg.text.trim().toLowerCase();

  // STAGE 1: Pure Human Ice-Breakers
  const casualGreetings = ['hi', 'hello', 'hey', 'yo', 'heyy', 'hlw', 'hii', 'helloo'];
  if (casualGreetings.includes(userInput)) {
    const humanReplies = [
      "Heyy hello! Kaise ho jaan? 😊",
      "Ya hi! What's up? Sab badhiya?",
      "Hello dear! Kaise yaad kiya aaj mujhe? 🥰",
      "Hey yo! Bolie kaise ho babu?"
    ];
    return bot.sendMessage(chatId, humanReplies[Math.floor(Math.random() * humanReplies.length)]);
  }

  // STAGE 2: Direct Plain Prompt Text Generation
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Direct raw string mapping template (Crash bypass solution)
    const rawPromptString = `${PRIYA_CHATBOT_SYSTEM_PROMPT}\n\nUser Question: ${msg.text}\n\nResponse:`;
    
    const result = await model.generateContent(rawPromptString);
    
    if (result && result.response) {
      const replyText = result.response.text().trim();

      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 Website par Video dekho & Book karo", url: "https://real-glow.vercel.app/" }
            ]
          ]
        }
      };

      await bot.sendMessage(chatId, replyText, inlineKeyboard);
    } else {
      throw new Error("Invalid Response Object Structure");
    }

  } catch (error) {
    console.error("Gemini Direct Generation Failure:", error);
    bot.sendMessage(chatId, "Suno na jaan, thoda network issue h, aap 2 min me message karo na please babu! ❤️");
  }
});
