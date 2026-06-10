const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Priya Active...'));
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ADMIN_ID = "8720928231";

const chatData = {};

const callButton = { 
    reply_markup: { inline_keyboard: [[{ text: "📞 Connect call with mam", url: "https://real-glow.vercel.app/" }]] } 
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() === ADMIN_ID) return;

    const text = msg.text ? msg.text.trim().toLowerCase() : '';

    // Ignore short/boring replies to prevent spam
    if (['ok', 'k', 'okay', 'hmm', 'hmmm'].includes(text)) return;

    if (!chatData[chatId]) chatData[chatId] = { step: 0, logs: [] };
    
    // Typing effect (Insaan jaisa lagne ke liye)
    await bot.sendChatAction(chatId, 'typing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Greeting logic
    if (text === '/start' || text === 'hi') {
        return bot.sendMessage(chatId, "𝗪𝗵𝗶𝗰𝗵 𝗰𝗶𝘁𝘆/𝗔𝗿𝗲𝗮 𝗱𝗼 𝘆𝗼𝘂 𝘄𝗮𝗻𝘁 ? ✅");
    }

    // AI Response logic
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: `You are Priya, a bold and smart RealMeet coordinator. 
                - Be conversational. Don't sound like a bot. 
                - If user asks about massage, sex, blowjob, etc., be open but guide them to the call.
                - VARY your responses. Do NOT repeat the same line like a machine.
                - Only give the call button when user shows real interest or asks about price/booking.` },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile"
        });

        const reply = completion.choices[0].message.content;
        bot.sendMessage(chatId, reply, callButton);
        chatData[chatId].logs.push(`User: ${text} | Priya: ${reply}`);

    } catch (e) {
        bot.sendMessage(chatId, "Call pe baat kar lijiye, mam sab detail bata dengi.", callButton);
    }
});
