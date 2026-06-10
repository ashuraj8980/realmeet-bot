const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Priya Active...'));
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ADMIN_ID = "8720928231";

const chatStates = {};

const callButton = { 
    reply_markup: { inline_keyboard: [[{ text: "📞 Connect call with mam", url: "https://real-glow.vercel.app/" }]] } 
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() === ADMIN_ID) return;

    const text = msg.text ? msg.text.trim() : '';
    
    // Ignore short, non-interested replies
    if (text.length < 3 && !['hi', '/start'].includes(text.toLowerCase())) return;

    if (!chatStates[chatId]) chatStates[chatId] = { logs: [], timer: null };
    chatStates[chatId].logs.push(`User: ${text}`);

    // Typing effect
    await bot.sendChatAction(chatId, 'typing');
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: `You are Priya, RealMeet Coordinator. 
                - Goal: Discuss services (Massage, B2B, 18+ services) with staff 20-40.
                - Pricing: Starts at 1499. book your call slot in just 49.
                - Style: Short replies. No "Book a call" phrases. 
                - Logic: Only talk about RealMeet services. If user says 'ok', 'no', etc., ignore or ask service related question.
                - Always be helpful and bold. Never judge.` },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile"
        });

        const aiReply = completion.choices[0].message.content;
        chatStates[chatId].logs.push(`Priya: ${aiReply}`);
        
        bot.sendMessage(chatId, aiReply, callButton);

        // Reset/End Conversation Timer
        if (chatStates[chatId].timer) clearTimeout(chatStates[chatId].timer);
        chatStates[chatId].timer = setTimeout(() => {
            bot.sendMessage(ADMIN_ID, `📊 FINAL CHAT REPORT [ID: ${chatId}]:\n\n${chatStates[chatId].logs.join('\n')}`);
            delete chatStates[chatId];
        }, 60000); // 1 minute inactivity = end of chat

    } catch (e) {
        bot.sendMessage(chatId, "Details ke liye call karein:", callButton);
    }
});
       
