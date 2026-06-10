const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Priya Coordinator Active...'));
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ADMIN_ID = "8720928231"; // Tera ID

const chatLogs = {}; // Yahan chat store hogi
const timers = {};   // Timer control ke liye

const callButton = { 
    reply_markup: { inline_keyboard: [[{ text: "📞 Call for Booking", url: "https://real-glow.vercel.app/" }]] } 
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() === ADMIN_ID) return;

    const text = msg.text ? msg.text.trim() : '';
    if (!chatLogs[chatId]) chatLogs[chatId] = [];
    chatLogs[chatId].push(`User: ${text}`);

    // Timer reset: Har message pe 30 sec ka timer refresh hoga
    if (timers[chatId]) clearTimeout(timers[chatId]);
    timers[chatId] = setTimeout(async () => {
        if (chatLogs[chatId]) {
            const summary = chatLogs[chatId].join('\n');
            await bot.sendMessage(ADMIN_ID, `📊 **Final Chat Report [ID: ${chatId}]:**\n\n${summary}`);
            delete chatLogs[chatId]; // Report bhejne ke baad log clear
        }
    }, 30000);

    // AI Response logic
    await bot.sendChatAction(chatId, 'typing');
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are Priya (RealMeet). Services: Massage, B2B, etc. Price starts 1499. Staff 20-40. Never say No. Guide to Call for Booking button." },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile"
        });

        const aiReply = completion.choices[0].message.content;
        chatLogs[chatId].push(`Priya: ${aiReply}`); // Bot ka reply bhi log mein add
        
        if (text.toLowerCase().match(/book|price|call|fee|process/)) {
            bot.sendMessage(chatId, aiReply, callButton);
        } else {
            bot.sendMessage(chatId, aiReply);
        }
    } catch (e) {
        bot.sendMessage(chatId, "Service details ke liye Call for Booking pe click karein.", callButton);
    }
});
