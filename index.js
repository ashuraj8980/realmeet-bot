const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const token = process.env.BOT_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

const bot = new TelegramBot(token, { polling: false });

// Gemini AI Setup
const ai = new GoogleGenerativeAI(geminiKey);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

const userSessions = {};

const webButton = {
  reply_markup: {
    inline_keyboard: [[{ text: "🌐 Open Official Website", url: "https://real-glow.vercel.app/" }]]
  }
};

// AI Response Logic
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

// Main Vercel Handler Function
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).send('RealMeet AI Engine Active on Vercel');
  }

  const { body } = req;
  if (!body || !body.message || !body.message.text) {
    return res.sendStatus(200);
  }

  const msg = body.message;
  const chatId = msg.chat.id;
  const userText = msg.text.trim();
  const textLower = userText.toLowerCase();

  // Fresh Start Protocol
  if (textLower === '/start') {
    userSessions[chatId] = { step: 'ASK_CITY' };
    await bot.sendMessage(chatId, "Welcome to RealMeet Premium Service Support.");
    await bot.sendMessage(chatId, "Sir, please enter your current City or Area to check real-time availability.");
    return res.sendStatus(200);
  }

  if (!userSessions[chatId]) {
    userSessions[chatId] = { step: 'ASK_CITY' };
  }

  const session = userSessions[chatId];

  // ==================== HYBRID AI DETECTION ====================
  const aiTriggers = ['name', 'kaun ho', 'kon ho', 'pic', 'photo', 'bhejo', 'service', 'massage', 'extra', 'fake', 'scam', 'hindi', 'english', 'boring', 'gawar', 'what', 'paisa', 'price', 'rate'];
  
  if (aiTriggers.some(trigger => textLower.includes(trigger)) || session.step === 'CONVERSION') {
    const aiReply = await handleAIResponse(userText, session.name || "Sir");
    await bot.sendMessage(chatId, aiReply);
    await bot.sendMessage(chatId, "Click below to clear all procedures on the website:", webButton);
    return res.sendStatus(200);
  }

  // ==================== STRICT FUNNEL FLOW ====================
  
  // STAGE 1: City Check
  if (session.step === 'ASK_CITY') {
    session.location = userText;
    session.step = 'ASK_VENUE';
    await bot.sendMessage(chatId, `Checking database for "${userText}"...`);
    await bot.sendMessage(chatId, "Yes Sir, our verified female staff and models are 100% available in your area.\n\nDo you require this service at your Home or a Hotel?");
    return res.sendStatus(200);
  }

  // STAGE 2: Venue Selection
  if (session.step === 'ASK_VENUE') {
    session.venue = userText;
    session.step = 'ASK_PREFERENCE';
    await bot.sendMessage(chatId, "Understood Sir. Please specify your age preference or any specific requirements regarding the profile.");
    return res.sendStatus(200);
  }

  // STAGE 3: Preference & Name Request
  if (session.step === 'ASK_PREFERENCE') {
    session.preference = userText;
    session.step = 'VERIFY_NAME';
    await bot.sendMessage(chatId, "Noted. To securely lock your current location log, may I please know your official name?");
    return res.sendStatus(200);
  }

  // STAGE 4: Name Submission & Final Pitch
  if (session.step === 'VERIFY_NAME') {
    session.name = userText;
    session.step = 'CONVERSION';

    await bot.sendMessage(chatId, `Thank you, Mr. ${userText}. Your session setup is successful.`);
    await bot.sendMessage(chatId, "To complete live photo selection and route your call to Khushi Mam, please book a call slot.\n\nOpen the link below, watch the short verification, and secure your slot. The booking fee is completely refundable.", webButton);
    return res.sendStatus(200);
  }

  return res.sendStatus(200);
};
