const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Priya Groq Engine V12 Active...'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Initializing Groq Client with your provided Free API Key
const groq = new Groq({ apiKey: "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" });

const callButton = {
    reply_markup: {
        inline_keyboard: [[{ text: "📞 Visit Website to Connect Call", url: "https://real-glow.vercel.app/" }]]
    }
};

const userSessions = {};

const sendSmartReply = async (chatId, text, showButton = false, delay = 1500) => {
    try {
        await bot.sendChatAction(chatId, 'typing');
        await new Promise(resolve => setTimeout(resolve, delay));
        if (showButton) {
            await bot.sendMessage(chatId, text, callButton);
        } else {
            await bot.sendMessage(chatId, text);
        }
    } catch (error) {
        console.error("Message delivery exception:", error);
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
        // Global Reset Triggers
        if (lowerText === '/start' || lowerText === 'hi' || lowerText === 'hey') {
            session.stage = 'AWAITING_CITY';
            session.askedPrice = false;
            await sendSmartReply(chatId, "Kon si city ya area me chahiye sir? Batao 📍", false, 1200);
            return;
        }

        // Funnel Step 1: Capture City
        if (session.stage === 'AWAITING_CITY') {
            session.city = text;
            session.stage = 'AWAITING_NAME';
            await sendSmartReply(chatId, "Okay sir, aapka name kya hai?", false, 1200);
            return;
        }

        // Funnel Step 2: Custom Layout Welcome Message Injection
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
            
            await sendSmartReply(chatId, strictIntro, false, 1500);
            return;
        }

        // Funnel Step 3: Hardcoded Code-Level Pricing Filters (Bypasses all API dependencies)
        const priceKeywords = ['price', 'rate', 'package', 'charges', 'money', 'kitna', 'cost', 'paisa', 'paise', 'rate kya', 'charge'];
        const durationKeywords = ['1', 'one', 'hr', 'hour', 'ghanta', 'ghante', 'ganta', 'gante', 'hours'];

        // Condition A: If user asks for price/rate
        if (priceKeywords.some(k => lowerText.includes(k)) && !session.askedPrice) {
            session.askedPrice = true;
            await sendSmartReply(chatId, "Kitne hrs/ghanto ki service chahiye sir?", false, 1200);
            return;
        }

        // Condition B: If user answers or specifies duration after pricing request
        if (durationKeywords.some(k => lowerText.includes(k))) {
            const strictPriceMsg = "Starting service price 1499 for 1hrs hai, lekin depend karta hai model aur staff pe. Isliye behtar hoga aap website visit karke Book via Call ya Book via WhatsApp select karke 49rs pay karke madam se baat kar ligiye.";
            await sendSmartReply(chatId, strictPriceMsg, true, 1500);
            return;
        }

        // Funnel Step 4: Groq Free LLaMA 3 Engine Integration
        if (session.stage === 'CONVERSATION') {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are Priya, a premium female chat coordinator for RealMeet service. User name is "${session.name}" from "${session.city}". 
                        RULES:
                        1. Reply must be strictly 1 very short line in Hinglish. No paragraphs.
                        2. If user asks for models, service details or options, say it is available and guide them to visit the website to connect call.
                        3. If user does timepass, say: "Sir, hum yahan sirf booking aur assistance ke liye available hain. Baaki sabhi details ke liye aap official website visit karke call connect kar lijiye."`
                    },
                    { role: "user", content: text }
                ],
                model: "llama3-8b-8192",
                max_tokens: 50
            });

            let aiReply = chatCompletion.choices[0].message.content.trim();
            
            const triggerKeywords = ['slot', 'book', 'pay', 'website', 'link', 'video', 'number', 'call', 'how', 'whatsapp', 'photo', 'girl', 'sex', 'service', 'b2b', 'desi', 'russian', 'bhabhi', 'option'];
            const needsButton = triggerKeywords.some(k => lowerText.includes(k)) || aiReply.toLowerCase().includes('website') || aiReply.toLowerCase().includes('call');

            await sendSmartReply(chatId, aiReply, needsButton, 1500);
        }

    } catch (error) {
        console.error("Groq Engine Pipeline Exception:", error);
        const smartFallback = `Haan sir, aap jo dhund rahe ho sab mil jayega. Ek baar website pe jaakar Book via Call/WhatsApp select karke 49rs confirm kariye aur madam se direct baat kar lijiye.`;
        await sendSmartReply(chatId, smartFallback, true, 1200);
    }
});

console.log("Priya Free Groq Engine Operational...");
                
