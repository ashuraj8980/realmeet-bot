const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new TelegramBot(process.env.BOT_TOKEN);
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

module.exports = async (req, res) => {
    // 1. Log har request, chahe wo GET ho ya POST
    console.log("Incoming Request:", req.method, req.body);

    if (req.method === 'POST') {
        const { message } = req.body;
        if (message && message.text) {
            const result = await model.generateContent("Priya assistant, answer: " + message.text);
            await bot.sendMessage(message.chat.id, result.response.text(), {
                reply_markup: { inline_keyboard: [[{ text: "🌐 Open Website", url: "https://real-glow.vercel.app/" }]] }
            });
        }
        return res.status(200).send('OK');
    }
    
    // 2. Agar GET request aaye, tab bhi 200 return karo (Webhook Verification ke liye)
    return res.status(200).send('Bot is running');
};
