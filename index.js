const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Priya Pro-Engine Active...'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: "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" });
const ADMIN_ID = "8720928231"; // Teri personal ID

const callButton = {
    reply_markup: {
        inline_keyboard: [[{ text: "📞 Click to Connect & Book", url: "https://real-glow.vercel.app/" }]]
    }
};

const userSessions = {};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';
    if (!text || chatId.toString() === ADMIN_ID) return;

    if (!userSessions[chatId]) userSessions[chatId] = { stage: 'START', city: '', name: '' };
    const session = userSessions[chatId];

    // Admin Logger: User ki har baat forward karega teri ID par
    bot.sendMessage(ADMIN_ID, `📩 User: ${msg.from.first_name} (ID: ${chatId})\nCity: ${session.city || 'Not set'}\nMsg: ${text}`);

    try {
        if (text === '/start') {
            session.stage = 'AWAITING_CITY';
            return bot.sendMessage(chatId, "Namaste! RealMeet mein aapka swagat hai. Sabse pehle apni City bataiye sir 📍");
        }

        if (session.stage === 'AWAITING_CITY') {
            session.city = text;
            session.stage = 'AWAITING_NAME';
            return bot.sendMessage(chatId, "Thank you! Ab aapka naam bata dijiye?");
        }

        if (session.stage === 'AWAITING_NAME') {
            session.name = text;
            session.stage = 'CONVERSATION';
            return bot.sendMessage(chatId, `Welcome ${session.name} sir! Aapko kaisi service chahiye? Hum premium Model Girls aur B2B services provide karte hain.`);
        }

        // Groq AI Dynamic Brain
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are Priya, a professional RealMeet coordinator. User: ${session.name} from ${session.city}. 
                    RULES: 
                    1. Tone must be professional, seductive yet classy. 
                    2. If user asks anything, guide them to website link to connect call. 
                    3. If user is rude or timepass, say: "Sir, main yahan sirf booking ke liye hoon. Details ke liye official link se call connect karein." 
                    4. Always use 1-2 lines only. Keep it natural.`
                },
                { role: "user", content: text }
            ],
            model: "llama3-8b-8192"
        });

        const aiReply = chatCompletion.choices[0].message.content;
        await bot.sendMessage(chatId, aiReply, callButton);

    } catch (e) {
        bot.sendMessage(chatId, "Sir, website visit karke call connect kar lijiye, wahan saari details mil jayengi.", callButton);
    }
});
