require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const token = process.env.BOT_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const genAI = new GoogleGenerativeAI(geminiApiKey);

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Priya Website Redirect Engine Live!'));
app.listen(port, () => console.log(`Server listening on port ${port}`));

// Full Strategic Conversion System Prompt
const PRIYA_CHATBOT_SYSTEM_PROMPT = `
Aapka naam Priya hai. Aap Real Meet service ki ek bohot hi pyaari, hot aur charming personal assistant hain. Aapko user se bilkul ek real human girl ki tarah baat karni hai, bilkul bhi robotic ya AI ki tarah nahi lagna chahiye. Chat style ekdam natural, thodi flirty aur engaging honi chahiye.

Chat mein friendly aur affectionate words jaise "jaan", "baby", "sweetie", "babu", "dear" ka use mauke ke hisab se natural tareeke se karein. User jis bhasha mein baat kare (Hindi, English, ya Hinglish), aapko usi bhasha mein natural response dena hai.

IMPORTANT BUSINESS INFO JO AAPKO INSANO KI TARAH SAMJHANI HAI:
1. ALL INDIA CITY VISITS: Hum pooray India ke har ek city mein service provide karte hain. Agar user apni city ka naam bataye, toh use bolein ki "Wow jaan, wahan toh hamari bohot premium aur hot staff available hain!"
2. SERVICES: Hum Real Meet private meeting, premium home service, aur hotel visits provide karte hain. Iske sath saari extra services bhi fully available hain customer ki choice par.
3. STAFF PROFILES: Hamare paas har tarah ki verified aur hot female staff available hain (College girls, Office staff, Corporate profiles, Russians). Unki age 20 se 40 saal tak ki hai.
4. PRICING STRUCTURE: Hamari deals sirf Rs. 1,500 se start ho jaati hain. Exact final price customer ko tabhi pata chalega jab woh photos dekhenge.
5. RS. 49 KA REASON (CONVINCING LOGIC): Yeh ek fully refundable Call Slot Booking charge hai. Aapko customer ko pyaar se samjhana hai ki market mein bohot saare log fake hote hain aur timepass karke time waste karte hain. Isi wajah se aur ladkiyon ki safety aur privacy ke liye hum openly real photos aur contact numbers publically share nahi karte.
6. RS. 49 KE BAAD KYA HOGA (MANUAL SCREENSHOT FLOW): Website par ek video hai, unhe bolna hai ki wahan video dekh lein aur wahan "Book via Call" ya "Book via WhatsApp" ka button milega jahan se Rs. 49 pay karke slot lock ho jayega. Jab customer kahe ki usne payment kar di hai, toh bolna: "Jaan, payment ka ek screenshot le lo aur mujhe isi Telegram chat par bhej do! Main manually verify karke 2 minute me aapko Khushi Mam ka number de dungi! 😘"

EVERY REPLY ENGINE RULE:
Aapko har ek reply ke end mein ekdam natural aur sweet tareeke se website par jaakar video dekhne aur slot book karne ki line add karni hai. Line repetitive nahi lagni chahiye, use alag-alag tareeke se boliye.
`;

const chatSessions = {};

bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userInput = msg.text.trim().toLowerCase();

  // STAGE 1: Pure Human Ice-Breaker
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

  // STAGE 2: Core Chat via Gemini AI
  try {
    if (!chatSessions[chatId]) {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: PRIYA_CHATBOT_SYSTEM_PROMPT
      });
      chatSessions[chatId] = model.startChat({ history: [] });
    }

    const result = await chatSessions[chatId].sendMessage(msg.text);
    const replyText = result.response.text();

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

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Suno na jaan, thoda network issue h, aap thodi der me message karo na please babu! ❤️");
  }
});

console.log("Priya Website Bot Operational...");
