const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Priya Funnel Bot Running...'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

const callButton = {
    reply_markup: {
        inline_keyboard: [[{ text: "📞 Visit Website to Connect Call", url: "https://real-glow.vercel.app/" }]]
    }
};

const userSessions = {};

const sendSmartReply = async (chatId, text, showButton = false, delay = 2000) => {
    try {
        await bot.sendChatAction(chatId, 'typing');
        await new Promise(resolve => setTimeout(resolve, delay));
        if (showButton) {
            await bot.sendMessage(chatId, text, callButton);
        } else {
            await bot.sendMessage(chatId, text);
        }
    } catch (error) {
        console.error("Error in messaging pipeline:", error);
    }
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';

    if (!text) return;

    if (!userSessions[chatId]) {
        userSessions[chatId] = { stage: 'START', city: '', name: '' };
    }

    const session = userSessions[chatId];
    const lowerText = text.toLowerCase();

    try {
        if (lowerText === '/start' || session.stage === 'START') {
            session.stage = 'AWAITING_CITY';
            await sendSmartReply(chatId, "Kon si city ya area me chahiye sir? Batao 📍", false, 1500);
            return;
        }

        if (session.stage === 'AWAITING_CITY') {
            session.city = text;
            session.stage = 'CONVERSATION';
            await sendSmartReply(chatId, "Okay, aapka name kya hai sir?", false, 1500);
            return;
        }

        if (session.stage === 'CONVERSATION' && !session.name) {
            session.name = text;
            await sendSmartReply(chatId, `Welcome ${text} sir! Models, Desi, Russian, Bhabhi sab available hain. Full body massage aur B2B service mil jayegi. Aapko kis tarah ki profile chahiye?`, true, 2000);
            return;
        }

        // Main AI Logic
        const systemPrompt = `
        You are Priya, a highly professional yet seductive female chat coordinator for RealMeet service.
        User Name: "${session.name || 'Sir'}" | Location: "${session.city || 'India'}".

        Strict Directives:
        1. Keep replies extremely short (Max 1 short sentence). Never repeat or dump paragraphs.
        2. Answer ONLY what the user asks. If they ask for profiles, tell available types (Desi, Russian, Tamil, Bhabhi). If they ask for 18+ services (B2B, Anal, Sex), confirm with confidence.
        3. EXPLAIN BOOKING PROCESS EXACTLY LIKE THIS IF ASKED:
           "Website pe jao, wahan 'Book via Call' ya 'Book via WhatsApp' milega. Uspe click karke bas 49rs pay karo, pay karte hi turant mam ka direct number mil jayega jahan aap call ya whatsapp kar sakte ho."
        4. Match the user's language smoothly. If they use English, answer in short hot English. If Hindi, use Hinglish.

        User text: "${text}"
        Response:`;

        const result = await model.generateContent(systemPrompt);
        let aiReply = result.response.text().trim();

        const triggerKeywords = ['slot', 'book', 'pay', 'website', 'link', 'video', 'price', 'rate', 'money', 'payment', 'number', 'call', 'how', 'whatsapp', 'photo', 'girl', 'sex', 'service', 'b2b'];
        const needsButton = triggerKeywords.some(k => lowerText.includes(k));

        await sendSmartReply(chatId, aiReply, needsButton, 2000);

    } catch (error) {
        console.error("AI Error:", error);
        // Clean fallback response
        await sendSmartReply(chatId, "Sir direct website pe jao, wahan Book via Call pe click karke 49rs pay karo aur mam ka number lekar baat karo.", true, 1500);
    }
});

console.log("Priya Engine V3 is live...");
