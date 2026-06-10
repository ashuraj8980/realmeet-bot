const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new TelegramBot(process.env.BOT_TOKEN);
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

module.exports = async (req, res) => {
    // Crash se bachane ke liye pehle hi check kar lo ki body hai ya nahi
    if (!req.body) {
        return res.status(200).send('Bot is active. Waiting for data...');
    }

    try {
        const { message } = req.body;
        
        // Agar koi blank request aaye ya Telegram ka metadata ho, toh crash na ho
        if (!message || !message.text) {
            return res.status(200).send('No message text found.');
        }

        const chatId = message.chat.id;
        const text = message.text;

        // Gemini AI Response logic
        const prompt = `You are Priya, a professional assistant. User says: "${text}". Reply politely, professionally, and suggest them to visit https://real-glow.vercel.app/ for booking. Keep it short.`;
        const result = await model.generateContent(prompt);
        const reply = result.response.text();

        // Telegram message delivery
        await bot.sendMessage(chatId, reply, {
            reply_markup: {
                inline_keyboard: [[{ text: "🌐 Open Official Website", url: "https://real-glow.vercel.app/" }]]
            }
        });
        
        return res.status(200).send('Message processed successfully');
    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(200).send('Internal handler managed the error');
    }
};
