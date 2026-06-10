const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ADMIN_ID = "8720928231";

const callButton = { reply_markup: { inline_keyboard: [[{ text: "📞 Click to Connect & Book", url: "https://real-glow.vercel.app/" }]] } };

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';
    
    if (text.toLowerCase() === '/start' || text.toLowerCase() === 'hi' || text.toLowerCase() === 'hello') {
        return bot.sendMessage(chatId, "Namaste! RealMeet mein aapka swagat hai. Sabse pehle apni City bataiye sir 📍");
    }

    await bot.sendChatAction(chatId, 'typing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are Priya, a professional coordinator. Reply in Hinglish, be polite, guide to website link. Handle all user inputs professionally." },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile"
        });

        const aiReply = completion.choices[0].message.content;
        await bot.sendMessage(chatId, aiReply, callButton);
        
    } catch (e) {
        console.error("Groq Error:", e);
        await bot.sendMessage(chatId, "Sir, website visit karke call connect kar lijiye.", callButton);
    }
});
