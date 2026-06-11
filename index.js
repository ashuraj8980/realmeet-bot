const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Priya Coordinator Active...'));
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const callButton = { 
    reply_markup: { inline_keyboard: [[{ text: "📞 Connect call with mam", url: "https://real-glow.vercel.app/" }]] } 
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';

    await bot.sendChatAction(chatId, 'typing');
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `You are Priya, the premium coordinator for RealMeet.
                    - TRUST: We have 50k+ satisfied customers across India, with 2500+ daily bookings.
                    - PROCESS: 49rs is NOT a fee, it's a 'Priority Access Charge' to ensure genuine clients connect with our premium staff. After payment, the user gets the manager's number and profile details directly.
                    - WHY CHOOSE US: Privacy, 100% verified profiles, premium service, and real meets.
                    - STYLE: Professional, bold, short (max 15 words). NEVER use "registration" or "fee". 
                    - If user asks about services (massage, sex, etc), confirm and redirect to the link.` 
                },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile"
        });

        const reply = completion.choices[0].message.content;
        bot.sendMessage(chatId, reply, callButton);
        
    } catch (e) {
        bot.sendMessage(chatId, "50k+ satisfied clients trust us. Premium access ke liye call connect karein:", callButton);
    }
});
