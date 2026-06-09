const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

const webButton = { reply_markup: { inline_keyboard: [[{ text: "🌐 Open Official Website", url: "https://real-glow.vercel.app/" }]] } };

module.exports = async (req, res) => {
    // 405 error ka permanent solution
    if (req.method !== 'POST') {
        return res.status(200).send('Bot is active and listening for POST requests.');
    }

    try {
        const { message } = req.body;
        if (!message || !message.text) return res.status(200).send('No text');

        const chatId = message.chat.id;
        const text = message.text.trim();

        // AI Engine
        const systemInstruction = "You are Priya, professional assistant for RealMeet. Answer politely, keep it short, and always include the website link: https://real-glow.vercel.app/";
        const result = await model.generateContent([systemInstruction, text]);
        
        await bot.sendMessage(chatId, result.response.text(), webButton);
        return res.status(200).send('OK');
    } catch (error) {
        console.error(error);
        return res.status(200).send('Error handled');
    }
};
