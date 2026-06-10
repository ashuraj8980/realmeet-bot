const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.listen(process.env.PORT || 10000);

// Naye bot instance ko polling band karke webhooks se chalana behtar hota hai, 
// lekin abhi polling hi use karenge kyunki server live hai.
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ADMIN_ID = "8720928231";

const callButton = {
    reply_markup: { inline_keyboard: [[{ text: "📞 Click to Connect & Book", url: "https://real-glow.vercel.app/" }]] }
};

const chatHistory = {};
const timers = {};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';
    if (!text || chatId.toString() === ADMIN_ID) return;

    if (!chatHistory[chatId]) chatHistory[chatId] = [];
    chatHistory[chatId].push(`User: ${text}`);

    // Admin Aggregator: 30 seconds wait karega phir poori chat bhejega
    if (timers[chatId]) clearTimeout(timers[chatId]);
    timers[chatId] = setTimeout(async () => {
        if (chatHistory[chatId]) {
            const fullChat = chatHistory[chatId].join('\n');
            await bot.sendMessage(ADMIN_ID, `📊 **Chat Summary (${chatId}):**\n\n${fullChat}`);
            delete chatHistory[chatId];
        }
    }, 30000);

    try {
        if (text.toLowerCase() === '/start') {
            return bot.sendMessage(chatId, "Namaste! City bataiye sir 📍");
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are Priya, a professional coordinator. Reply in 1 short Hinglish line. Guide to website link for booking. If user is timepass, redirect to website." },
                { role: "user", content: text }
            ],
            model: "llama3-8b-8192"
        });

        const aiReply = completion.choices[0].message.content;
        chatHistory[chatId].push(`Bot: ${aiReply}`);
        await bot.sendMessage(chatId, aiReply, callButton);
    } catch (e) {
        console.error("Groq Error:", e);
        await bot.sendMessage(chatId, "Sir, website visit karke call connect kar lijiye.", callButton);
    }
});
