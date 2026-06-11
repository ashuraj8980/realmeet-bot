const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Priya Active...'));
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Session store
const session = {};

const callButton = { 
    reply_markup: { inline_keyboard: [[{ text: "📞 Connect call with mam", url: "https://real-glow.vercel.app/" }]] } 
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';

    if (!session[chatId]) session[chatId] = { city: null, state: 'START' };

    // 1. Reset logic
    if (text.toLowerCase() === '/start') {
        session[chatId] = { city: null, state: 'ASK_CITY' };
        return bot.sendMessage(chatId, "Namaste! RealMeet Coordinator Priya here. Which city/area are you looking for services? ✅");
    }

    // 2. City Capture Logic
    if (session[chatId].state === 'ASK_CITY') {
        session[chatId].city = text;
        session[chatId].state = 'BOOKING_PHASE';
        return bot.sendMessage(chatId, `Got it! Services in ${text} are ready. Click below to pay 49rs, get Madam's number, and see profiles.`, callButton);
    }

    // 3. Conversational Logic (Agar City pata hai)
    await bot.sendChatAction(chatId, 'typing');
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: `You are Priya. If user asks anything, guide them to the call button. You already know the city: ${session[chatId].city}. Keep replies extremely short (max 8 words). Do not repeat questions.` },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile"
        });

        bot.sendMessage(chatId, completion.choices[0].message.content, callButton);
    } catch (e) {
        bot.sendMessage(chatId, "Details ke liye click karein:", callButton);
    }
});
            
