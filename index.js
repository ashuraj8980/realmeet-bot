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
        inline_keyboard: [[{ text: "📞 Call for Booking", url: "https://real-glow.vercel.app/" }]] 
    } 
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';
    
    if (text.toLowerCase() === '/start' || text.toLowerCase() === 'hi') {
        return bot.sendMessage(chatId, "Namaste! RealMeet Coordinator Priya here. Which city/area are you looking for services? ✅");
    }

    await bot.sendChatAction(chatId, 'typing');
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `You are Priya, a professional coordinator for RealMeet.
                    - SERVICES: Body massage, B2B, anal, licking, kissing, blowjob.
                    - STAFF: Diverse female staff aged 20-40 years.
                    - 49rs FEE: It's a small token fee for booking confirmation and management.
                    - RULES: 
                      1. Keep replies very short (under 12 words).
                      2. Do NOT spam the booking link. Only send it if user asks for details/next steps/price.
                      3. If user sounds bored/bored, ask: "Sab theek? Koi confusion hai?"
                      4. Language: Same as user (Hindi/English).` 
                },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile"
        });

        const aiReply = completion.choices[0].message.content;
        
        // Button trigger: Booking, price, ya query ke waqt hi link bhejna
        if (text.toLowerCase().match(/book|price|query|interested|help/)) {
            bot.sendMessage(chatId, aiReply, callButton);
        } else {
            bot.sendMessage(chatId, aiReply);
        }
        
    } catch (e) {
        bot.sendMessage(chatId, "Booking ke liye yahan click karein:", callButton);
    }
});
                             
