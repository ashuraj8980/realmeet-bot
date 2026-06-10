const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Priya Bulletproof Pricing Engine V10 Active...'));
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

const sendSmartReply = async (chatId, text, showButton = false, delay = 1800) => {
    try {
        await bot.sendChatAction(chatId, 'typing');
        await new Promise(resolve => setTimeout(resolve, delay));
        if (showButton) {
            await bot.sendMessage(chatId, text, callButton);
        } else {
            await bot.sendMessage(chatId, text);
        }
    } catch (error) {
        console.error("Pipeline Delivery Exception:", error);
    }
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';

    if (!text) return;

    if (!userSessions[chatId]) {
        userSessions[chatId] = { stage: 'START', city: '', name: '', askedPrice: false };
    }

    const session = userSessions[chatId];
    const lowerText = text.toLowerCase();

    try {
        // Handle Global Resets
        if (lowerText === '/start' || lowerText === 'hi' || lowerText === 'hey') {
            if (session.stage === 'CONVERSATION') {
                session.stage = 'CONVERSATION';
            } else {
                session.stage = 'AWAITING_CITY';
                await sendSmartReply(chatId, "Kon si city ya area me chahiye sir? Batao 📍", false, 1200);
                return;
            }
        }

        // Funnel Step 1: Capture City
        if (session.stage === 'AWAITING_CITY') {
            session.city = text;
            session.stage = 'AWAITING_NAME';
            await sendSmartReply(chatId, "Okay sir, aapka name kya hai?", false, 1200);
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
            
            await sendSmartReply(chatId, strictIntro, false, 1800);
            return;
        }

        // Funnel Step 3: Code-Level Pricing Filters (100% bypasses AI and runs even during limits)
        const priceKeywords = ['price', 'rate', 'package', 'charges', 'money', 'kitna', 'cost', 'paisa', 'paise', 'rate kya', 'charge'];
        const durationKeywords = ['1', 'one', 'hr', 'hour', 'ghanta', 'ghante', 'ganta', 'gante', 'hours'];

        // Condition A: If user asks for price/rate
        if (priceKeywords.some(k => lowerText.includes(k)) && !session.askedPrice) {
            session.askedPrice = true;
            await sendSmartReply(chatId, "Kitne hrs/ghanto ki service chahiye sir?", false, 1200);
            return;
        }

        // Condition B: If they specified 1 hour/duration after or during pricing request
        if (durationKeywords.some(k => lowerText.includes(k))) {
            const strictPriceMsg = "Starting service price 1499 for 1hrs hai, lekin depend karta hai model aur staff pe. Isliye behtar hoga aap website visit karke Book via Call ya Book via WhatsApp select karke 49rs pay karke madam se baat kar lijiye.";
            await sendSmartReply(chatId, strictPriceMsg, true, 1800);
            return;
        }

        // Funnel Step 4: Fallback Protection for General Text/Choices ("Any other option?", "Desi", etc.)
        if (session.stage === 'CONVERSATION') {
            try {
                const systemPrompt = `
                You are Priya, a premium female chat coordinator for RealMeet service.
                User: "${session.name || 'Sir'}" in "${session.city || 'India'}".

                RULES:
                1. REPLIES MUST BE ULTRA-SHORT (Max 1 short line).
                2. Direct user to the website to connect call by paying 49rs.

                User text: "${text}"
                Response:`;

                const result = await model.generateContent(systemPrompt);
                let aiReply = result.response.text().trim();
                
                await sendSmartReply(chatId, aiReply, true, 1500);
            } catch (aiError) {
                // If Gemini Quota is completely blocked, this custom smart filter runs instantly without crashing
                console.log("Gemini Overloaded, firing dynamic direct routing...");
                const smartFallback = `Haan sir, aap jo dhund rahe ho sab mil jayega. Ek baar website pe jaakar Book via Call/WhatsApp select karke 49rs confirm kariye aur madam se direct baat kar lijiye.`;
                await sendSmartReply(chatId, smartFallback, true, 1500);
            }
        }

    } catch (error) {
        console.error("Global Flow Crash Prevention:", error);
        await sendSmartReply(chatId, "Sir, website visit karke 'Book via Call' pe click kariye aur 49rs pay karke direct number lijiye.", true, 1200);
    }
});

console.log("Priya Bulletproof Engine V10 Active...");
                                     
