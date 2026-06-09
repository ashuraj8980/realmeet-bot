const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const token = process.env.BOT_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

const bot = new TelegramBot(token, { polling: false });
const ai = new GoogleGenerativeAI(geminiKey);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

const userSessions = {};

const webButton = {
  reply_markup: {
    inline_keyboard: [[{ text: "🌐 Open Official Website", url: "https://real-glow.vercel.app/" }]]
  }
};

async function handleAIResponse(userMessage, clientName = "Sir") {
  const systemInstruction = `
    You are Priya, elite assistant of RealMeet Service. Tone: Strictly professional, corporate, polite. 
    NO emojis, NO slang, max 1 short sentence.
    Rules:
    1. Name: "I am Priya, RealMeet Service Assistant."
    2. Services: "We provide Premium Body Massage, B2B Massage, and all types of extra services."
    3. Location/Delivery: "We deliver verified services to your Home, Flat, or Private Apartment safely."
    4. Trust: "We have 50,000+ satisfied customers all over India."
    5. Photos/Price: "Photos are private. Pay Rs.49 to book a call slot on our website and speak to Mam. Rs.49 is a refundable booking fee for your safety."
    6. Pricing: "Packages start from Rs.1,500/hr up to Rs.6,999."
    Respond in professional Hinglish or English.
  `;
  try {
    const result = await model.generateContent([systemInstruction, userMessage]);
    return result.response.text().trim();
  } catch (e) {
    return `Sir, please visit our website for secure booking: https://real-glow.vercel.app/`;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send('Bot Active');

  const { message } = req.body;
  if (!message || !message.text) return res.sendStatus(200);

  const chatId = message.chat.id;
  const userText = message.text.trim();
  const textLower = userText.toLowerCase();

  // Reset Trigger
  if (textLower.includes('delete') || textLower.includes('remove') || textLower === '/start') {
    userSessions[chatId] = { step: 'ASK_CITY' };
    await bot.sendMessage(chatId, "Welcome to RealMeet Premium Service. Please enter your City/Area to check availability.");
    return res.sendStatus(200);
  }

  // 1. AI PRIORITY: Check for objections/questions FIRST
  const aiTriggers = ['name', 'kaun', 'pic', 'photo', 'bhejo', 'service', 'massage', 'fake', 'scam', 'hindi', 'english', 'boring', 'what', 'paisa', 'price', 'rate', 'real', 'machine', 'trust'];
  if (aiTriggers.some(t => textLower.includes(t))) {
    const aiReply = await handleAIResponse(userText, userSessions[chatId]?.name || "Sir");
    await bot.sendMessage(chatId, aiReply, webButton);
    return res.sendStatus(200);
  }

  // 2. FUNNEL FLOW: If not AI, follow the process
  if (!userSessions[chatId]) userSessions[chatId] = { step: 'ASK_CITY' };
  const session = userSessions[chatId];

  if (session.step === 'ASK_CITY') {
    session.location = userText;
    session.step = 'ASK_VENUE';
    await bot.sendMessage(chatId, "Verified models are available. Do you require Home Service or Hotel Service?");
  } else if (session.step === 'ASK_VENUE') {
    session.venue = userText;
    session.step = 'ASK_PREFERENCE';
    await bot.sendMessage(chatId, "Understood. Please specify age preference or requirements.");
  } else if (session.step === 'ASK_PREFERENCE') {
    session.preference = userText;
    session.step = 'VERIFY_NAME';
    await bot.sendMessage(chatId, "Noted. May I know your official name to lock your session?");
  } else if (session.step === 'VERIFY_NAME') {
    session.name = userText;
    session.step = 'CONVERSION';
    await bot.sendMessage(chatId, `Thank you, ${userText}. To complete selection and route to Khushi Mam, please book your slot on our website.`, webButton);
  }

  return res.sendStatus(200);
};
