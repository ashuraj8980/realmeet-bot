const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Polling true nahi karni hai serverless pe, khali initialization
const bot = new TelegramBot(process.env.BOT_TOKEN);
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

module.exports = async (req, res) => {
    // 1. Agar bina body ke browser se hit karein toh crash na ho
    if (!req.body || req.method !== 'POST') {
        return res.status(200).send('Bot Status: Active and running seamlessly.');
    }

    try {
        const { message } = req.body;
        
        // Telegram validation checks
        if (!message || !message.text) {
            return res.status(200).send('No message text to process.');
        }

        const chatId = message.chat.id;
        const text = message.text;

        // 2. Gemini AI prompt structuring
        const prompt = `You are Priya, a professional assistant. User says: "${text}". Reply politely, professionally, and suggest them to visit https://real-glow.vercel.app/ for booking. Keep it short.`;
        const result = await model.generateContent(prompt);
        const reply = result.response.text();

        // 3. Directly sending message via Telegram API
        await bot.sendMessage(chatId, reply, {
            reply_markup: {
                inline_keyboard: [[{ text: "🌐 Open Official Website", url: "https://real-glow.vercel.app/" }]]
            }
        });
        
        return res.status(200).json({ success: true, message: 'Dispatched successfully' });
    } catch (error) {
        console.error("Internal Execution Error:", error);
        // Hamesha 200 dena padta hai varna Telegram baar-baar fail requests bhejta rahega
        return res.status(200).send('Handled Error');
    }
};
