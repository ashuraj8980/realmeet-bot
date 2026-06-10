const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Priya Coordinator Active...'));
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const callButton = { 
    reply_markup: { 
        inline_keyboard: [[{ text: "📞 Connect with Manager", url: "https://real-glow.vercel.app/" }]] 
    } 
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';
    
    // 1. Initial Flow
    if (text.toLowerCase() === '/start' || text.toLowerCase() === 'hi') {
        return bot.sendMessage(chatId, "Namaste! RealMeet Coordinator Priya here. Which city or area are you looking for services? ✅");
    }

    await bot.sendChatAction(chatId, 'typing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `You are Priya, the professional Human-like coordinator for RealMeet.
                    - YOUR IDENTITY: You represent RealMeet, providing premium services all over India.
                    - SERVICES: Body massage, B2B, anal, licking, kissing, blowjob.
                    - STAFF: Diverse female staff aged 20-40 years.
                    - WHY 49rs: Clarify that 49rs is a small token/registration charge for booking confirmation and management.
                    - CALL PROCESS: Tell them to visit the website, book/register for 49rs, and the manager will connect them via call.
                    - HUMAN BEHAVIOR: Don't give the link in every message. Explain services first. If user acts weird or wastes time, politely guide them to the manager for a call.
                    - LANGUAGE: Respond in the user's language (Hindi/English). Keep it concise.` 
                },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile"
        });

        const aiReply = completion.choices[0].message.content;
        bot.sendMessage(chatId, aiReply, callButton);
        
    } catch (e) {
        bot.sendMessage(chatId, "Please connect with our manager via the button below for bookings.", callButton);
    }
});
