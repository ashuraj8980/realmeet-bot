const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Priya Smart Pricing Engine V8 Active...'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

// Strict button text as requested by you
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
        console.error("Message Delivery Error:", error);
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
        // Reset/Start handlers
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

        // Funnel Step 2: Exact Custom Intro Layout 
        if (session.stage === 'AWAITING_NAME') {
            const blacklist = ['english', 'hindi', 'ok', 'yes', 'no', 'kya', 'what', 'who', '?', '??'];
            if (blacklist.some(word => lowerText.includes(word)) || text.length > 15) {
                session.name = 'Ashu';
            } else {
                session.name = text;
            }
            session.stage = 'CONVERSATION';
            
            // Strictly using your required message structure
            const strictIntro = `Welcome ${session.name} sir! Hamare paas Model Girls, Desi, Russian, Tamil aur Bhabhi sab milti hain. Full body massage, B2B service sex service anal sucking all type of service available hai.

Aap bataiye sir aapko kis tarah ki female model pasand hai?`;
            
            await sendSmartReply(chatId, strictIntro, false, 2000);
            return;
        }

        // Funnel Step 3: Core AI Trained Engine
        if (session.stage === 'CONVERSATION') {
            const systemPrompt = `
            You are Priya, a highly professional, ultra-short replying female chat coordinator for RealMeet service.
            User Profile: Name "${session.name || 'Sir'}" | Location "${session.city || 'India'}".

            STRICT BEHAVIORAL DIRECTIVES:
            1. REPLIES MUST BE ULTRA-SHORT (Maximum 1 clear sentence). Never club multiple scripts or send paragraphs.
            2. SMART PRICING STRATEGY (Strict Rules):
               - If user asks for price, rate, package, cost, or money ("kitna paisa", "rate kya hai", "price"): Ask back directly: "Kitne hrs/ghanto ki service chahiye sir?"
               - If user specifies "1 hour", "1 hr", "1 ghanta", "ek ghanta", or answers the duration: Reply exactly with this short message: "Starting service price 1499 for 1hrs hai, lekin depend karta hai model aur staff pe. Isliye behtar hoga aap website visit karke Book via Call ya Book via WhatsApp select karke 49rs pay karke madam se baat kar lijiye."
            3. ANTI-TIMEPASS FILTER: If user asks out-of-context questions (e.g., "what are you doing?", random talking, repeating words):
               "Sir, hum yahan sirf booking aur assistance ke liye available hain. Baaki sabhi details ke liye aap official website visit karke call connect kar lijiye."
            4. BOOKING INSTRUCTIONS: If asked how to connect, how to pay, or for numbers:
               "Website pe jao, 'Book via Call/WhatsApp' select karke 49rs pay karo, screen par turant direct mam ka number mil jayega."
            5. SERVICE SELECTION: If user specifies model types (Desi, Russian, etc.) or adult features: Reply in 1 short playful line confirming availability, then guide them to the website call.

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
        console.error("AI Pipeline Interruption:", error);
        // Clean professional fallback 
        await sendSmartReply(chatId, "Sir, website visit karke 'Book via Call' pe click karke 49rs confirm karein aur direct connection le lijiye.", true, 1500);
    }
});

console.log("Priya Smart Funnel V8 is running smoothly...");
