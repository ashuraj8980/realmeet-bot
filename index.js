const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const token = process.env.BOT_TOKEN;
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
const bot = new TelegramBot(token, { polling: false });

const userSessions = {};
const webButton = { reply_markup: { inline_keyboard: [[{ text: "🌐 Open Website", url: "https://real-glow.vercel.app/" }]] } };

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(200).send('OK');
    const { message } = req.body;
    if (!message?.text) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text.trim();
    const lowText = text.toLowerCase();

    // 1. AI PRIORITY: Sabse pehle AI check karo
    const aiKeywords = ['kaun', 'real', 'machine', 'trust', 'fake', 'scam', 'pic', 'photo', 'rate', 'price', 'massage'];
    if (aiKeywords.some(k => lowText.includes(k)) || lowText.includes('tum')) {
        const prompt = `Priya, professional assistant. Tone: Corporate, polite, short. Answer: ${text}`;
        const result = await model.generateContent(prompt);
        await bot.sendMessage(chatId, result.response.text(), webButton);
        return res.sendStatus(200);
    }

    // 2. FUNNEL FLOW: Agar AI trigger nahi hua, tab funnel
    if (lowText === '/start') userSessions[chatId] = { step: 'CITY' };
    if (!userSessions[chatId]) userSessions[chatId] = { step: 'CITY' };

    const s = userSessions[chatId];
    if (s.step === 'CITY') {
        s.step = 'VENUE';
        await bot.sendMessage(chatId, "Welcome! Please enter your City to check availability.");
    } else if (s.step === 'VENUE') {
        s.step = 'NAME';
        await bot.sendMessage(chatId, "Great. Home service or Hotel service?");
    } else {
        await bot.sendMessage(chatId, "Please complete your booking on our portal:", webButton);
    }
    return res.sendStatus(200);
};
