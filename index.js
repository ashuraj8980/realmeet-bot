const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Priya Advanced Funnel Engine V7 Active...'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        console.error("Pipeline Message Delivery Exception:", error);
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
        // Reset and clear routing
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

        // Funnel Step 2: Perfect Intro Layout Injection
        if (session.stage === 'AWAITING_NAME') {
            const blacklist = ['english', 'hindi', 'ok', 'yes', 'no', 'kya', 'what', 'who', '?', '??'];
            if (blacklist.some(word => lowerText.includes(word)) || text.length > 15) {
                session.name = 'Ashu';
            } else {
                session.name = text;
            }
            session.stage = 'CONVERSATION';
            
            const strictIntro = `Welcome ${session.name} sir! Hamare paas Model Girls, Desi, Russian, Tamil aur Bhabhi sab milti hain. Full body massage, B2B service sex service anal sucking all type of service available hai.

Aap bataiye sir aapko kis tarah ki female model pasand hai?`;
            
            await sendSmartReply(chatId, strictIntro, false, 2000);
            return;
        }

        // Funnel Step 3: AI Seductive + Smart Pricing + Anti-Timepass Engine
        if (session.stage === 'CONVERSATION') {
            const systemPrompt = `
            You are Priya, a highly professional, short-replying, premium female chat coordinator for RealMeet service.
            User Profile: Name "${session.name || 'Sir'}" | Location "${session.city || 'India'}".

            STRICT LIVE TRAINED RULES:
            1. REPLIES MUST BE ULTRA-SHORT (Maximum 1 very short line). Never dump raw paragraphs or multiple sentences at once.
            2. SMART PRICING HANDLING (Follow these strict steps based on what user asks):
               - If user asks for price, rate, package, charges, or money generally: Ask them "Kitne hrs/ghanto ki service chahiye sir?"
               - If user specifies "1 hour" or "1 ghanta" or any short duration: Reply strictly like this: "Starting price 1499 for 1hr hai sir, baaki rate model aur staff pe depend karta hai. Isliye behtar hoga aap website visit karke Book via Call ya Book via WhatsApp select karke 49rs pay karke madam se direct baat kar lijiye."
            3. ANTI-TIMEPASS RULE: If the user asks anything outside of RealMeet, booking profiles, or adult services (like "what are you doing?", or random chatting), answer exactly like this:
               "Sir, hum yahan sirf booking aur assistance ke liye available hain. Baaki sabhi details ke liye aap official website visit karke call connect kar lijiye."
            4. BOOKING EXPLANATION PROCESS: If asked how to book, how to pay, where is number:
               "Website pe jao, wahan 'Book via Call' ya 'Book via WhatsApp' par click karke bas 49rs pay karo, pay karte hi turant screen par mam ka direct number mil jayega."
            5. SEX TALK: If user specifies adult choices (sex, b2b, anal, sucking, bhabhi, russian), confirm smoothly in 1 short line: "Haan sir, sab kuch mil jayega, aap website se call connect karke mam se direct final kar lijiye."
            6. Match user's language instantly (Hinglish/English).

            User text: "${text}"
            Response:`;

            const result = await model.generateContent(systemPrompt);
            let aiReply = result.response.text().trim();

            const triggerKeywords = ['slot', 'book', 'pay', 'website', 'link', 'video', 'price', 'rate', 'money', 'payment', 'number', 'call', 'how', 'whatsapp', 'photo', 'girl', 'sex', 'service', 'b2b', 'satisfaction', 'sucking', 'anal', 'desi', 'russian', 'bhabhi', '1499', '1', 'hr', 'hour', 'ghanta'];
            const isTimepassReply = aiReply.includes('visit karke call connect');
            const needsButton = triggerKeywords.some(k => lowerText.includes(k)) || isTimepassReply || aiReply.toLowerCase().includes('website') || aiReply.toLowerCase().includes('pay');

            await sendSmartReply(chatId, aiReply, needsButton, 1800);
        }

    } catch (error) {
        console.error("AI Core Crash Exception:", error);
        await sendSmartReply(chatId, "Sir, website visit karke 'Book via Call/WhatsApp' pe click kariye aur 49rs pay karke direct number lijiye.", true, 1500);
    }
});

console.log("Priya Trained Engine V7 is operational...");
