const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Polling mode active for Render hosting
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

// Official Website Booking Button Link
const webButton = {
    reply_markup: {
        inline_keyboard: [[{ text: "🌐 Open Official Website & Watch Video", url: "https://real-glow.vercel.app/" }]]
    }
};

// Users session database tracker
const userSessions = {};

// Helper function: Real typing delays and short responses handler
const sendSmartReply = async (chatId, text, showButton = false, delay = 3000) => {
    try {
        await bot.sendChatAction(chatId, 'typing');
        await new Promise(resolve => setTimeout(resolve, delay));
        if (showButton) {
            await bot.sendMessage(chatId, text, webButton);
        } else {
            await bot.sendMessage(chatId, text);
        }
    } catch (error) {
        console.error("Error in reply pipeline:", error);
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
        // Identity Manipulation Check (Tum kaun ho?)
        if (lowerText.includes('kaun ho') || lowerText.includes('who are you') || lowerText.includes('tum kon')) {
            const identityMsg = "Main bas customer ka call slot book karwati hoon aur direct call pe baat karwati hoon mam se. Agar aap ₹49 ka slot booking complete karte hain website pe jaake toh direct number aur details mil jayega.";
            await sendSmartReply(chatId, identityMsg, true, 3000);
            return;
        }

        // --- STAGE WISE FUNNEL LOGIC ---

        // Stage 1: Initial Hook (No Button here, clean layout)
        if (session.stage === 'START') {
            session.stage = 'AWAITING_CITY';
            const firstMsg = "Which city/Area do you want? ✅";
            await sendSmartReply(chatId, firstMsg, false, 2000);
            return;
        }

        // Stage 2: Capture City -> Ask Name (Clean text layout)
        if (session.stage === 'AWAITING_CITY') {
            session.city = text;
            session.stage = 'AWAITING_NAME';
            const nameMsg = "Sir kya mai aapka name jaan sakti hu chat aage process karne ke liye? 😊";
            await sendSmartReply(chatId, nameMsg, false, 2500);
            return;
        }

        // Stage 3: Capture Name -> Hard Pitch Variety & Adult Services (Clean text layout)
        if (session.stage === 'AWAITING_NAME') {
            session.name = text;
            session.stage = 'CONVERSATION';
            const pitchMsg = `Thank you ${text} sir! Ham pure India me home and hotel private meeting service provide karte hai. 

Hamare paas Model Girls, Desi Girls, Russian, Nigerian, Tamil Girls aur Desi Bhabhi har tarah ki profiles available hai. Services me Full Body Massage, B2B, Anal aur extra 18+ services including rehti hai hamesha. 🔥

Aap kis tarah ki female staff se service chahte hain sir?`;
            await sendSmartReply(chatId, pitchMsg, false, 3500);
            return;
        }

        // Stage 4: Open Dynamic Conversation with Anti-Scam Angle via Gemini
        if (session.stage === 'CONVERSATION') {
            const systemPrompt = `
            You are Priya, a smart female chat coordinator for RealMeet service. 
            The user's name is "${session.name}" and location is "${session.city}".
            
            Strict Operational Rules:
            1. Keep replies extremely short, human, 1-2 sentences maximum. No robotic talk.
            2. Language rule: Detect user's tone. If they speak English, reply in short fluent English. If Hindi/Hinglish, reply accordingly. Never deny language choices.
            3. Pricing & Booking Script: If user asks about price, booking, process, photos, or how to trust:
               - "Starting price 1500 for 1 hr hai. Price profile pe depend karta hai kyunki alag girl model ki alag rate hoti hai."
               - "Market me fake aur scam bohot hota hai advance ke naam par, isliye hamari official mam ne website par ek live video upload ki hai. Aap pehle website par jaakar video dekh lijiye, sab clear ho jayega."
               - "Video dekhne ke baad wahan 49rs pay karke apna call slot confirm kar lijiye, same time pe mam se direct baat ho jayegi aur sab final ho jayega."
            4. 18+ / Non-veg contexts (Sex, anal, b2b, extra service, configurations): Respond positively, raw and playfully: "Haan sir hamare paas b2b, anal, aur full body satisfaction sab hota hai call pe mam sab live dikha dengi, aap bas website pe jaake mam ka video dekho aur slot book karo."
            
            User says: "${text}"
            Response:`;

            const result = await model.generateContent(systemPrompt);
            let aiReply = result.response.text().trim();

            // Smartly push button only when slot, booking, website, video, or money is involved
            const triggerKeywords = ['slot', 'book', 'pay', 'website', 'link', 'video', 'scam', 'fake', 'price', 'kitna', 'rate', 'money', 'payment', 'number', 'call', 'how'];
            const showButtonOnContext = triggerKeywords.some(keyword => lowerText.includes(keyword)) || aiReply.toLowerCase().includes('website') || aiReply.toLowerCase().includes('slot');

            await sendSmartReply(chatId, aiReply, showButtonOnContext, 3500);
        }

    } catch (error) {
        console.error("Error processing message pipeline:", error);
        await sendSmartReply(chatId, "Ji sir, thoda network issue hai line pe. Aap tab tak website pe jaake mam ka video dekh lijiye aur slot confirm kar lijiye.", true, 2000);
    }
});

console.log("RealMeet Ultra-Smart Sales Funnel is live...");
