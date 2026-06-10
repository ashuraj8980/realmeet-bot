const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Polling mode active for Render
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fixed: Using the correct updated API model name for 2026 pipelines
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

// Free calling/slot booking button markup
const webButton = {
    reply_markup: {
        inline_keyboard: [[{ text: "🌐 Open Official Website", url: "https://real-glow.vercel.app/" }]]
    }
};

// Users ki stage aur history track karne ke liye temporary memory
const userSessions = {};

// Typing effect create karne ke liye helper function
const sendSmartReply = async (chatId, text, delay = 3000) => {
    try {
        // Telegram par "typing..." status dikhayega
        await bot.sendChatAction(chatId, 'typing');
        // Thoda wait karega taaki real typing feel aaye
        await new Promise(resolve => setTimeout(resolve, delay));
        // Message send karega website button ke sath
        await bot.sendMessage(chatId, text, webButton);
    } catch (error) {
        console.error("Error sending smart reply:", error);
    }
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';

    if (!text) return;

    // Naye user ke liye session initialize karo
    if (!userSessions[chatId]) {
        userSessions[chatId] = { stage: 'START', city: '', name: '' };
    }

    const session = userSessions[chatId];
    const lowerText = text.toLowerCase();

    try {
        // Handle "Tum kaun ho" identity checks at any point
        if (lowerText.includes('kaun ho') || lowerText.includes('who are you') || lowerText.includes('tum kon')) {
            const identityMsg = "Main bas customer ka call slot book karwati hoon aur call pe baat karwati hoon. Main aapko mam ka number de sakti hoon agar aap ₹49 ka slot booking payment complete karte hain website pe jaake toh aapko direct number mil jayega.";
            await sendSmartReply(chatId, identityMsg, 3500);
            return;
        }

        // --- STAGE WISE FUNNEL LOGIC ---

        // Stage 1: Initial Hook
        if (session.stage === 'START') {
            session.stage = 'AWAITING_CITY';
            const firstMsg = "Which city/Area do you want? ✅";
            await sendSmartReply(chatId, firstMsg, 2000);
            return;
        }

        // Stage 2: User gave City, now ask Name
        if (session.stage === 'AWAITING_CITY') {
            session.city = text;
            session.stage = 'AWAITING_NAME';
            const nameMsg = "Sir kya mai aapka name jaan sakti hu chat aage process karne ke liye? 😊";
            await sendSmartReply(chatId, nameMsg, 3000);
            return;
        }

        // Stage 3: User gave Name, pitch services
        if (session.stage === 'AWAITING_NAME') {
            session.name = text;
            session.stage = 'CONVERSATION';
            const pitchMsg = `Thank you ${text} sir! Ham pure India me har jagah home and hotel private meeting service provide karte hai. Full Body massage b2b and extra service bhi including rehti hai. 🔥`;
            await sendSmartReply(chatId, pitchMsg, 4000);
            return;
        }

        // Stage 4: Open Conversation (Price, Models, Non-veg, Profiles)
        if (session.stage === 'CONVERSATION') {
            const systemPrompt = `
            You are Priya, a smart female chat coordinator for RealMeet service. 
            The user's name is "${session.name}" and their location is "${session.city}".
            
            Strict Guidelines:
            1. Keep replies extremely short, precise, single sentence if possible. Hindi/Hinglish only.
            2. If user asks about price/girls/profiles/non-veg things: Acknowledge smartly that everything is available, everything is handled smoothly on call. 
            3. Tell them: "Starting price 1500 for 1 hr hai aur price profile pe depend karta hai kyunki alag-alag girl model ki alag price hoti hai. Behtar hoga aap website se call slot book karke mam se call pe puri baat karke profile selection kar lein apne area ki."
            4. If user talks dirty or non-veg, respond playfully/positively: "Haan sir sabkuch hota hai, iske related aap call pe detail me baat kar sakte hain, bas website se slot book kar lijiye."
            5. Do NOT use professional robotic introductions. Keep it raw, fast, human-like.
            
            User says: "${text}"
            Response:`;

            const result = await model.generateContent(systemPrompt);
            let aiReply = result.response.text().trim();

            // Send dynamic AI response with simulated typing delay
            await sendSmartReply(chatId, aiReply, 4000);
        }

    } catch (error) {
        console.error("Error processing message pipeline:", error);
        await sendSmartReply(chatId, "Ji, thoda network issue hai. Aap website se apna slot book kar lijiye tab tak.", 2000);
    }
});

console.log("RealMeet Smart Funnel Bot is running smoothly with updated Gemini pipeline...");
