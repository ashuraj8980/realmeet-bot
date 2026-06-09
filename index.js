require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
// FIXED: Sahi tareeqe se package class ko import kiya
const { GoogleGenAI } = require('@google/generative-ai');

const token = process.env.BOT_TOKEN;
const url = process.env.RENDER_EXTERNAL_URL || 'https://realmeet-bot-1.onrender.com';
const geminiKey = process.env.GEMINI_API_KEY;

const bot = new TelegramBot(token, { polling: false });
const expressApp = express();
expressApp.use(express.json());

// FIXED: Sahi tareeqe se Gemini AI client ko initialize kiya (Bina constructor error ke)
const ai = new GoogleGenAI({ apiKey: geminiKey });
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

expressApp.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

expressApp.get('/', (req, res) => res.send('RealMeet Premium Hybrid Engine Active'));

expressApp.listen(process.env.PORT || 3000, async () => {
  console.log(`Server running successfully.`);
  try {
    await bot.setWebHook(`${url}/bot${token}`);
    console.log(`Webhook linked successfully.`);
  } catch (error) {
    console.error("Webhook error:", error);
  }
});

const userSessions = {};

// Human-like message delay utility
const sendDelayedMessage = (chatId, text, options = {}, delay = 1200) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        await bot.sendChatAction(chatId, 'typing');
        setTimeout(async () => {
          const msg = await bot.sendMessage(chatId, text, options);
          resolve(msg);
        }, 800);
      } catch (err) {
        console.error("Msg Error:", err);
        resolve(null);
      }
    }, delay);
  });
};

const webButton = {
  reply_markup: {
    inline_keyboard: [[{ text: "🌐 Open Official Website", url: "https://real-glow.vercel.app/" }]]
  }
};

// AI Objection Handler Prompt
async function handleAIResponse(userMessage, clientName = "Sir") {
  const systemInstruction = `
    You are Priya, the elite, highly professional female assistant of RealMeet Service. 
    Your tone must be strictly professional, corporate yet polite. No cheap words, no slang, NO emojis, and NO long paragraphs. Respond in maximum 1 short sentence.
    
    Strict Business Rules to answer:
    1. If asked about your Name: Tell them "I am Priya, RealMeet Service Assistant."
    2. If asked about Services: Tell them "We provide Premium Body Massage, B2B Massage, and all types of extra services that you are looking for."
    3. If asked about Location/Delivery: "We deliver verified services directly to your Home, Flat, or Private Apartment with 100% safety."
    4. Trust/Scale factor: "We have over 50,000+ satisfied customers all over India who book regularly."
    5. If they ask for Photos/Profiles: Tell them "Sir, photos cannot be shared openly on chat due to strict privacy. Kindly pay Rs.49 to book a call slot on our website and speak to Mam. Rs.49 is a very small amount for life's real enjoyment, please try our service once."
    6. If they ask about Pricing: "Our executive packages start from Rs.1,500/hr up to Rs.6,999 for Full Night."
    7. For any other random logic, objections, or language switches (like "talk in Hindi" or "boring"): Act as an executive manager, handle their statement calmly in one line, and politely tell them to complete the process or check the website link.
    
    Current Client Name to address: ${clientName}. Respond in professional Hinglish or clean English based on user input.
  `;

  try {
    const result = await model.generateContent([systemInstruction, userMessage]);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Sir, please visit our official portal to secure your booking instantly.`;
  }
}

bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userText = msg.text.trim();
  const textLower = userText.toLowerCase();

  // Fresh Start Protocol
  if (textLower === '/start') {
    userSessions[chatId] = { step: 'ASK_CITY' };
    await sendDelayedMessage(chatId, "Welcome to RealMeet Premium Service Support.", {}, 200);
    await sendDelayedMessage(chatId, "Sir, please enter your current City or Area to check real-time availability.", {}, 1000);
    return;
  }

  if (!userSessions[chatId]) {
    userSessions[chatId] = { step: 'ASK_CITY' };
  }

  const session = userSessions[chatId];

  // ==================== HYBRID AI DETECTION ====================
  const aiTriggers = ['name', 'kaun ho', 'kon ho', 'pic', 'photo', 'bhejo', 'service', 'massage', 'extra', 'fake', 'scam', 'hindi', 'english', 'boring', 'gawar', 'what', 'paisa', 'price', 'rate'];
  
  if (aiTriggers.some(trigger => textLower.includes(trigger)) || session.step === 'CONVERSION') {
    const aiReply = await handleAIResponse(userText, session.name || "Sir");
    await sendDelayedMessage(chatId, aiReply, {}, 200);
    await sendDelayedMessage(chatId, "Click below to clear all procedures on the website:", webButton, 1000);
    return;
  }

  // ==================== STRICT FUNNEL FLOW ====================
  
  // STAGE 1: City Check
  if (session.step === 'ASK_CITY') {
    session.location = userText;
    session.step = 'ASK_VENUE';
    await sendDelayedMessage(chatId, `Checking database for "${userText}"...`, {}, 200);
    await sendDelayedMessage(chatId, "Yes Sir, our verified female staff and models are 100% available in your area.", {}, 1200);
    await sendDelayedMessage(chatId, "Do you require this service at your Home or a Hotel?", {}, 1000);
    return;
  }

  // STAGE 2: Venue Selection
  if (session.step === 'ASK_VENUE') {
    session.venue = userText;
    session.step = 'ASK_PREFERENCE';
    await sendDelayedMessage(chatId, "Understood Sir. Please specify your age preference or any specific requirements regarding the profile.", {}, 500);
    return;
  }

  // STAGE 3: Preference & Name Request
  if (session.step === 'ASK_PREFERENCE') {
    session.preference = userText;
    session.step = 'VERIFY_NAME';
    await sendDelayedMessage(chatId, "Noted. To securely lock your current location log, may I please know your official name?", {}, 500);
    return;
  }

  // STAGE 4: Name Submission & Final Pitch
  if (session.step === 'VERIFY_NAME') {
    session.name = userText;
    session.step = 'CONVERSION';

    await sendDelayedMessage(chatId, `Thank you, Mr. ${userText}. Your session setup is successful.`, {}, 500);
    await sendDelayedMessage(chatId, "To complete live photo selection and route your call to Khushi Mam, please book a call slot.", {}, 1200);
    await sendDelayedMessage(chatId, "Open the link below, watch the short verification, and secure your slot. The booking fee is completely refundable.", webButton, 1200);
    return;
  }
});
