const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

// Render Port Fix Engine
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Priya Bot Server Running Smoothly...'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// Bot Core Configuration
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

// Sexy & Seductive Dynamic Button Markup
const sexyButton = {
    reply_markup: {
        inline_keyboard: [[{ text: "💋 View Models Live Video & Book Slot", url: "https://real-glow.vercel.app/" }]]
    }
};

const userSessions = {};

// Helper function for ultra-real typing effect and short responses
const sendSmartReply = async (chatId, text, showButton = false, delay = 2500) => {
    try {
        await bot.sendChatAction(chatId, 'typing');
        await new Promise(resolve => setTimeout(resolve, delay));
        if (showButton) {
            await bot.sendMessage(chatId, text, sexyButton);
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
        // Identity checks
        if (lowerText.includes('kaun ho') || lowerText.includes('who are you') || lowerText.includes('tum kon')) {
            const identityMsg = "Main Priya hoon, call coordinator. Direct meeting aur live baat karwati hoon. Website pe jaake slot book kar lo, direct number mil jayega.";
            await sendSmartReply(chatId, identityMsg, true, 2000);
            return;
        }

        // --- DYNAMIC FUNNEL FLOW ---

        if (session.stage === 'START') {
            session.stage = 'AWAITING_CITY';
            await sendSmartReply(chatId, "Which city or area do you want honey? Tell me clear. 📍", false, 1500);
            return;
        }

        if (session.stage === 'AWAITING_CITY') {
            session.city = text;
            session.stage = 'AWAITING_NAME';
            await sendSmartReply(chatId, "Sir kya mai aapka short name jaan sakti hu chat aage process karne ke liye? 😊", false, 2000);
            return;
        }

        if (session.stage === 'AWAITING_NAME') {
            // Fix: Clean out garbage or literal word repetitions like "English"
            session.name = (lowerText === 'english' || text.length > 15) ? 'Sir' : text;
            session.stage = 'CONVERSATION';
            
            const pitchMsg = `Ok ${session.name} sir. Hamare paas Desi Girls, high profile Models, Russian, Tamil aur Desi Bhabhi sab available hain. Full Body Massage, B2B satisfaction, Anal aur har tarah ki 18+ extra services milti hain home & hotel dono jagah. 

Aapko kis tarah ki profile pasand hai?`;
            await sendSmartReply(chatId, pitchMsg, false, 3000);
            return;
        }

        // Stage 4: Open Seductive & Extremely Short Intelligent Conversation
        if (session.stage === 'CONVERSATION') {
            const systemPrompt = `
            You are Priya, an extremely seductive, high-class female chat coordinator for RealMeet service.
            Current User Name: "${session.name}" | User Location: "${session.city}".
            
            Strict Behavioral Directives:
            1. REPLIES MUST BE ULTRA-SHORT (Max 1 short sentence/line). Never dump raw paragraphs or repeat your speech.
            2. LANGUAGE DYNAMICS: Instantly match user language tone. If user types in English, reply in hot, seductive, professional English. If Hinglish/Hindi, reply in premium local Hinglish. Never say "I only talk Hinglish".
            3. SEXY/18+ TALK & SERVICES: If user talks dirty, asks about adult details (sex, b2b, anal, body satisfaction, blowjob, pussy, etc.), accept it with a playful, seductive confirmation. Example: "Haan sir, b2b, hardcore satisfaction sab kuch mil jayega, live call pe mam sab final kar dengi."
            4. ANTI-SCAM SLOT SPEECH: If user asks for pricing, process, number, or how to trust:
               - "Starting 1500/hr hai, baki rate girl profile pe depend karta hai."
               - "Market me fake log scam karte hain advance lekar, isliye hamari mam ne website par live video proof dala hai. Pehle website jaake video dekho."
               - "Wahan se safety ke liye bas 49rs ka slot booking confirm karo, direct number aur photo mil jayega usi time."
            
            User's message: "${text}"
            Response:`;

            const result = await model.generateContent(systemPrompt);
            let aiReply = result.response.text().trim();

            // Smart trigger buttons context filter
            const needsButton = ['slot', 'book', 'pay', 'website', 'link', 'video', 'scam', 'price', 'rate', 'money', 'payment', 'number', 'call', 'how', 'show', 'pic', 'photo', 'girl', 'russian', 'sex', 'satisfaction'].some(k => lowerText.includes(k));

            await sendSmartReply(chatId, aiReply, needsButton, 2500);
        }

    } catch (error) {
        console.error("Error processing pipeline:", error);
        await sendSmartReply(chatId, "Ji thoda network problem hai. Aap direct website pe jaake mam ka video proof dekh kar slot confirm kar lijiye.", true, 2000);
    }
});

console.log("Priya Seductive Anti-Scam Bot Engine is Active...");
