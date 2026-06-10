const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const callButton = { reply_markup: { inline_keyboard: [[{ text: "📞 Click to Connect & Book", url: "https://real-glow.vercel.app/" }]] } };

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';

    if (text.toLowerCase() === '/start' || text.toLowerCase() === 'hi' || text.toLowerCase() === 'hello') {
        return bot.sendMessage(chatId, "Namaste! Welcome to RealMeet. City bataiye sir? 📍");
    }

    await bot.sendChatAction(chatId, 'typing');
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `You are Priya, a professional RealMeet coordinator.
                    - YOUR SERVICE DETAILS: We provide Model Girls, Desi, Russian, Tamil, Bhabhi. Services include Full body massage, B2B, etc.
                    - PRICE: Starting from 1499 for 1hr. Depends on model/staff.
                    - LANGUAGE: Detect user language (Hindi/English) and reply in same.
                    - STYLE: Be friendly, keep it short (max 20 words).
                    - ALWAYS guide them to click the 'Click to Connect & Book' button for booking.` 
                },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile"
        });

        const aiReply = completion.choices[0].message.content;
        await bot.sendMessage(chatId, aiReply, callButton);
        
    } catch (e) {
        console.error("Groq Error:", e);
        await bot.sendMessage(chatId, "Sir, website visit karke call connect kar lijiye. / सर, बुकिंग के लिए वेबसाइट पर क्लिक करें।", callButton);
    }
});
