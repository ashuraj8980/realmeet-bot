const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: "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" });
const ADMIN_ID = "8720928231";

const callButton = {
    reply_markup: { inline_keyboard: [[{ text: "📞 Click to Connect & Book", url: "https://real-glow.vercel.app/" }]] }
};

const userSessions = {};
const chatHistory = {};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';
    if (!text || chatId.toString() === ADMIN_ID) return;

    if (!userSessions[chatId]) userSessions[chatId] = { stage: 'START', city: '', name: '' };
    if (!chatHistory[chatId]) chatHistory[chatId] = [];
    chatHistory[chatId].push(`User: ${text}`);

    try {
        if (text === '/start') {
            userSessions[chatId].stage = 'AWAITING_CITY';
            return bot.sendMessage(chatId, "Namaste! City bataiye sir 📍");
        }

        // Groq API Call with Error Logging
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are Priya, a professional RealMeet coordinator. Reply in 1 short line in Hinglish. Guide user to website link for call. If user timepass, professionally redirect them to booking." },
                { role: "user", content: text }
            ],
            model: "llama3-8b-8192"
        });

        const aiReply = chatCompletion.choices[0].message.content;
        console.log("Groq Reply:", aiReply); // Yeh Render logs mein check kar
        
        chatHistory[chatId].push(`Bot: ${aiReply}`);
        await bot.sendMessage(chatId, aiReply, callButton);

    } catch (e) {
        console.error("Groq Error Details:", e); // Error yahan dikhega
        bot.sendMessage(chatId, "Sir, website visit karke call connect kar lijiye.", callButton);
    }
});
