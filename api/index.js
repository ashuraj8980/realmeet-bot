const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new TelegramBot(process.env.BOT_TOKEN);
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

module.exports = async (req, res) => {
    if (!req.body || req.method !== 'POST') {
        return res.status(200).send('Bot Status: Active ✅');
    }

    try {
        const { message } = req.body;

        if (!message || !message.text) {
            return res.status(200).send('OK');
        }

        const chatId = message.chat.id;
        const text = message.text.trim();

        // /start command handle karo
        if (text === '/start') {
            await bot.sendMessage(chatId,
                `👋 Hello! Main *Priya* hoon, aapki personal assistant.\n\nMujhse kuch bhi poochh sakte hain! 😊`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: "🌐 Visit Website", url: "https://real-glow.vercel.app/" }
                        ]]
                    }
                }
            );
            return res.status(200).json({ success: true });
        }

        // Gemini se reply lo with timeout protection
        const prompt = `You are Priya, a professional assistant. User says: "${text}". Reply politely, professionally, and suggest them to visit https://real-glow.vercel.app/ for booking. Keep it short.`;
        
        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Gemini Timeout')), 8000) // 8 sec limit
            )
        ]);

        const reply = result.response.text();

        await bot.sendMessage(chatId, reply, {
            reply_markup: {
                inline_keyboard: [[
                    { text: "🌐 Open Official Website", url: "https://real-glow.vercel.app/" }
                ]]
            }
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Error:", error.message);

        // Timeout hone pe user ko bata do
        if (error.message === 'Gemini Timeout') {
            const chatId = req.body?.message?.chat?.id;
            if (chatId) {
                await bot.sendMessage(chatId,
                    "⏳ Thoda busy hoon, please dobara try karein!"
                );
            }
        }

        return res.status(200).send('Handled');
    }
};
