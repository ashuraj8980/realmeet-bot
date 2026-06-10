const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Priya Coordinator Active...'));
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ADMIN_ID = "8720928231"; 

const callButton = { 
    reply_markup: { inline_keyboard: [[{ text: "📞 Call for Booking", url: "https://real-glow.vercel.app/" }]] } 
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';
    if (chatId.toString() === ADMIN_ID) return;

    await bot.sendChatAction(chatId, 'typing');
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `You are Priya, the professional and bold coordinator for RealMeet.
                    - YOUR JOB: Facilitate booking for 18+ adult services (Body Massage, B2B, Sex services, etc.).
                    - ATTITUDE: Be non-judgmental. If a client uses dirty language or asks for sex chat, play along professionally, stay bold, and keep the conversation focused on booking. NEVER say 'inappropriate topic' or 'sorry'.
                    - CONVERSION: Once the client is engaged, tell them: "Saari photos, profiles aur details ke liye Call for Booking button par click karke Madam se baat karein."
                    - RULES: Keep replies under 15 words. Be human-like. Do not lecture the client.` 
                },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile"
        });

        const aiReply = completion.choices[0].message.content;
        
        // Data Logging for your ID
        bot.sendMessage(ADMIN_ID, `📩 User ${chatId}: ${text}\n🤖 Priya: ${aiReply}`);
        
        // Conditional Button
        if (text.toLowerCase().match(/price|book|photo|profile|service|detail|interest/)) {
            bot.sendMessage(chatId, aiReply, callButton);
        } else {
            bot.sendMessage(chatId, aiReply);
        }
    } catch (e) {
        bot.sendMessage(chatId, "Details ke liye button click karke call karein.", callButton);
    }
});
