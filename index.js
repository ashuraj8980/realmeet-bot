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

    // AI KA DIMAAG - Yahan koi funnel nahi hai, bas direct Gemini hai
    try {
        const systemInstruction = `
            You are Priya, the professional assistant for RealMeet Premium Service.
            - Your goal: Answer every query using your intelligence.
            - If user asks about city, price, trust, photos, or anything, answer politely and professionally.
            - ALWAYS suggest the user to visit our website for final booking: https://real-glow.vercel.app/
            - Do not ask for City/Venue/Age unless user wants to book. 
            - If user is rude, stay professional. Keep answers short (1-2 sentences).
        `;

        const result = await model.generateContent([systemInstruction, text]);
        const reply = result.response.text();
        
        await bot.sendMessage(chatId, reply, webButton);
    } catch (error) {
        await bot.sendMessage(chatId, "Welcome to RealMeet. Please visit our website for services: https://real-glow.vercel.app/", webButton);
    }

    return res.sendStatus(200);
};
