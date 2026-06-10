const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Priya Coordinator Active...'));
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

    const text = msg.text ? msg.text.trim() : '';
    if (!chatData[chatId]) chatData[chatId] = { step: 0, logs: [] };
    
    // 1. Initial Greeting (Strict Step 0)
    if (text.toLowerCase() === '/start' || text.toLowerCase() === 'hi') {
        chatData[chatId].step = 1;
        return bot.sendMessage(chatId, "𝗪𝗵𝗶𝗰𝗵 𝗰𝗶𝘁𝘆/𝗔𝗿𝗲𝗮 𝗱𝗼 𝘆𝗼𝘂 𝘄𝗮𝗻𝘁 ? ✅");
    }

    // 2. City Logic
    if (chatData[chatId].step === 1) {
        chatData[chatId].step = 2;
        return bot.sendMessage(chatId, `Yes, service is available in ${text}. Madam se call pe baat kar lijiye, wo aapko full details aur profiles bata dengi.`, callButton);
    }

    // 3. Conversational Logic for further queries
    chatData[chatId].logs.push(`User: ${text}`);
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: `You are Priya. Focus only on RealMeet (massage, anal, blowjob, etc.). 
                If user asks anything, be bold and tell them: 'Madam se call pe baat kar lijiye, wo sab bata dengi'. 
                Keep replies very short. If user ignores, keep pushing for the call.` },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile"
        });

        const reply = completion.choices[0].message.content;
        bot.sendMessage(chatId, reply, callButton);
        chatData[chatId].logs.push(`Priya: ${reply}`);

    } catch (e) {
        bot.sendMessage(chatId, "Call pe baat kar lijiye, mam sab samjha dengi.", callButton);
    }

    // Timer for Final Report
    if (chatData[chatId].timer) clearTimeout(chatData[chatId].timer);
    chatData[chatId].timer = setTimeout(() => {
        bot.sendMessage(ADMIN_ID, `📊 FINAL REPORT [ID: ${chatId}]:\n${chatData[chatId].logs.join('\n')}`);
        delete chatData[chatId];
    }, 60000);
});
