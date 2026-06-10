const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Priya Secure Anti-Timepass Engine Active...'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

// Strict website redirection button
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
        console.error("Messaging error:", error);
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
        // Clear reset commands
        if (lowerText === '/start' || lowerText === 'hi' || lowerText === 'hey') {
            if (session.stage === 'CONVERSATION') {
                session.stage = 'CONVERSATION';
            } else {
                session.stage = 'AWAITING_CITY';
                await sendSmartReply(chatId, "Kon si city ya area me chahiye sir? Batao 📍", false, 1500);
                return;
            }
        }

        // Funnel Step 1: Capture City
        if (session.stage === 'AWAITING_CITY') {
            session.city = text;
            session.stage = 'AWAITING_NAME';
            await sendSmartReply(chatId, "Okay sir, aapka name kya hai?", false, 1500);
            return;
        }

        // Funnel Step 2: Capture Name & Sanitize Inputs
        if (session.stage === 'AWAITING_NAME') {
            const blacklist = ['english', 'hindi', 'ok', 'yes', 'no', 'kya', 'what', 'who', '?', '??'];
            if (blacklist.some(word => lowerText.includes(word)) || text.length > 15) {
                session.name = 'Sir';
            } else {
                session.name = text;
            }
            session.stage = 'CONVERSATION';
            await sendSmartReply(chatId, `Welcome ${session.name}! Hamare paas Model Girls, Desi, Russian, Tamil aur Bhabhi sab milti hain. Full body massage, B2B satisfaction aur Anal extra services hot call pe final ho jayengi. 

Aap batao sir aapko kis tarah ki female pasand hai?`, false, 2500);
            return;
        }

        // Funnel Step 3: AI Seductive + Anti-Timepass Filter Engine
        if (session.stage === 'CONVERSATION') {
            const systemPrompt = `
            You are Priya, a highly professional yet extremely seductive female chat coordinator for RealMeet service.
            User Name: "${session.name || 'Sir'}" | User Location: "${session.city || 'India'}".

            STRICT ANTI-TIMEPASS AND CLOSE-CHAT DIRECTIVES:
            1. If the user asks ANY question that is NOT related to RealMeet, booking, profiles, rates, or adult services (e.g., asking "what are you doing?", "where do you live?", chatting randomly, playing games, or asking out-of-context questions), you MUST politely and professionally close the conversation immediately.
            2. Professional Close Response Format (Strictly use this tone):
               "Sir, hum yahan sirf booking aur assistance ke liye available hain. Baaki sabhi details aur personal coordination ke liye aap niche diye gaye link se official website visit karke call connect kar lijiye, wahan aapko saari details mil jayengi."
            3. For genuine queries (profiles, sex, b2b, anal, price, booking): Keep answers extremely short (Max 1 clear sentence). Be seductive and accept playfully, then push them to pay ₹49 on the website.
            4. BOOKING SCRIPT: Always remind them: "Website pe jao, 'Book via Call/WhatsApp' par click karke 49rs pay karo, aur direct mam ka personal number lekar baat set karo."

            User message: "${text}"
            Response:`;

            const result = await model.generateContent(systemPrompt);
            let aiReply = result.response.text().trim();

            // Keywords to force the website button visibility
            const triggerKeywords = ['slot', 'book', 'pay', 'website', 'link', 'video', 'price', 'rate', 'money', 'payment', 'number', 'call', 'how', 'whatsapp', 'photo', 'girl', 'sex', 'service', 'b2b', 'satisfaction'];
            
            // If it's a timepass question or contains triggers, always append button
            const isTimepassReply = aiReply.includes('visit karke call connect');
            const needsButton = triggerKeywords.some(k => lowerText.includes(k)) || isTimepassReply || aiReply.toLowerCase().includes('website');

            await sendSmartReply(chatId, aiReply, needsButton, 2000);
        }

    } catch (error) {
        console.error("Pipeline Exception Captured:", error);
        await sendSmartReply(chatId, "Sir, please website visit karke 'Book via Call' pe click karein aur 49rs pay karke mam se direct details le lijiye.", true, 1500);
    }
});

console.log("Priya Anti-Timepass Funnel V5 is online...");
