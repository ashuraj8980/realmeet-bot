const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

const webButton = { reply_markup: { inline_keyboard: [[{ text: "🌐 Open Official Website", url: "https://real-glow.vercel.app/" }]] } };

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(200).send('Bot Active');
    const { message } = req.body;
    if (!message?.text) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text.trim();
    const lowText = text.toLowerCase();

    // 1. AI AGENT: Agar user kuch bhi puche, Gemini handle karega
    // Ye block funnel se upar hai, isliye pehle AI chalega
    const aiResponse = await model.generateContent(`
        Role: Priya, RealMeet Assistant.
        Task: If user asks about price, trust, photos, or 'who are you', answer clearly in 1 sentence. 
        If user wants to book, refer to the website.
        User Query: ${text}
    `);

    // 2. AI ka response bhej do aur Funnel ko skip karo (ya bas side-by-side rakho)
    await bot.sendMessage(chatId, aiResponse.response.text(), webButton);

    return res.sendStatus(200);
};
