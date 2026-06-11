const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Priya Active'));
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ADMIN_CHAT_ID = '8720928231';
const WEBSITE_URL = 'https://real-glow.vercel.app/';

const sessions = new Map();
const chatLogs = new Map();
const inactivityTimers = new Map();

const callButton = {
    reply_markup: {
        inline_keyboard: [[
            { text: "Mam se Call Karein", url: WEBSITE_URL }
        ]]
    }
};

const confusedButton = {
    reply_markup: {
        inline_keyboard: [
            [{ text: "Mam se Call Karein", url: WEBSITE_URL }],
            [{ text: "Mam ko Message Karein", url: "https://t.me/xkhushii" }]
        ]
    }
};

function getSession(chatId) {
    if (!sessions.has(chatId)) {
        sessions.set(chatId, { 
            state: 'ASK_CITY', 
            name: null, 
            city: null, 
            history: [], 
            username: null,
            confusedCount: 0
        });
        chatLogs.set(chatId, []);
    }
    return sessions.get(chatId);
}

function logMessage(chatId, role, text) {
    if (!chatLogs.has(chatId)) chatLogs.set(chatId, []);
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    chatLogs.get(chatId).push(`[${time}] ${role}: ${text}`);
}

function resetInactivityTimer(chatId) {
    if (inactivityTimers.has(chatId)) clearTimeout(inactivityTimers.get(chatId));
    const timer = setTimeout(async () => {
        await sendChatLogToAdmin(chatId);
        sessions.delete(chatId);
        chatLogs.delete(chatId);
        inactivityTimers.delete(chatId);
    }, 5 * 60 * 1000);
    inactivityTimers.set(chatId, timer);
}

async function sendChatLogToAdmin(chatId) {
    try {
        const log = chatLogs.get(chatId);
        if (!log || log.length === 0) return;
        const s = sessions.get(chatId);
        const header = `CHAT LOG\nUser: @${s?.username || 'Unknown'}\nNaam: ${s?.name || 'N/A'}\nCity: ${s?.city || 'N/A'}\nChat ID: ${chatId}\n${'─'.repeat(30)}\n`;
        const fullLog = header + log.join('\n');
        for (let i = 0; i < fullLog.length; i += 3500) {
            await bot.sendMessage(ADMIN_CHAT_ID, '```\n' + fullLog.substring(i, i + 3500) + '\n```', { parse_mode: 'Markdown' });
            await new Promise(r => setTimeout(r, 300));
        }
    } catch (e) {
        console.error('Admin log error:', e.message);
    }
}

const PRIYA_PROMPT = `
Tu Priya hai — Real Meet ki coordinator. Bilkul real insaan ki tarah baat kar, chhoti aur natural replies.

=== SABSE IMPORTANT RULES ===
1. Jab tak user na pooche, details mat de — sirf short reply karo
2. Ek sawal ka ek chhota jawab — bas
3. Koi emoji nahi
4. "Book" word nahi — sirf "call karo mam ko" ya "mam se baat karo"
5. Replies max 1-2 lines only
6. Hinglish ya English — user jo bole usi mein

=== CALL PROCESS ===
- Website pe jaake "Book via Call" pe click karo
- 49rs pay karo
- Payment ke baad mam ka number milta hai
- Seedha call kar sakte ho ya WhatsApp bhi
- Mam se baat karke sab details lo — profiles, pics, price sab

=== SERVICE (sirf poochne pe batao) ===
- Body massage, B2B massage, extra services
- Home visit, hotel — dono available
- Short time, full night — available
- Price 1500 se shuru, profile pe depend
- Profiles: College Girl, Office Girl, Russian, Mature, Corporate, Widow
- All India available

=== AGAR CONFUSE HO ===
Agar samajh na aaye ya koi ajeeb sawaal ho:
"Seedha mam se baat karo, woh better bata sakti hain"
Aur confusedButton use hoga

=== NAAM CORRECTION ===
Agar user apna naam galat bata diya ya correct kare — update karo aur simply bol "Oh sorry, [new name]!"
`;

bot.on('message', async (msg) => {
    const chatId = String(msg.chat.id);
    const text = msg.text ? msg.text.trim() : '';
    const username = msg.from?.username || msg.from?.first_name || 'Unknown';

    if (!text) return;

    const s = getSession(chatId);
    s.username = username;

    logMessage(chatId, `@${username}`, text);
    resetInactivityTimer(chatId);

    // /start
    if (text === '/start') {
        sessions.set(chatId, { 
            state: 'ASK_CITY', 
            name: null, city: null, 
            history: [], username,
            confusedCount: 0
        });
        chatLogs.set(chatId, []);
        logMessage(chatId, `@${username}`, '/start');
        const reply = "Which city/Area do you want ?";
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply);
    }

    // City capture
    if (s.state === 'ASK_CITY') {
        s.city = text;
        s.state = 'ASK_NAME';
        const reply = `Haan, ${text} mein available hai. Aapka naam?`;
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply);
    }

    // Name capture
    if (s.state === 'ASK_NAME') {
        s.name = text;
        s.state = 'CHAT';
        const reply = `${text}, kya service chahiye aapko?`;
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply, callButton);
    }

    // AI chat
    await bot.sendChatAction(chatId, 'typing');

    // Name correction detection
    const nameFix = text.match(/(?:mera naam|my name is|naam hai|name is)\s+([a-zA-Z]+)/i);
    if (nameFix) {
        s.name = nameFix[1];
        const reply = `Oh sorry, ${s.name}! Theek hai, batao kya chahiye?`;
        logMessage(chatId, 'Priya', reply);
        s.history.push({ role: "assistant", content: reply });
        return bot.sendMessage(chatId, reply, callButton);
    }

    s.history.push({ role: "user", content: text });
    if (s.history.length > 8) s.history = s.history.slice(-8);

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `${PRIYA_PROMPT}\nUser naam: ${s.name || 'N/A'}, City: ${s.city || 'N/A'}`
                },
                ...s.history
            ],
            model: "llama-3.3-70b-versatile",
            max_tokens: 80,
            temperature: 0.85
        });

        const reply = completion.choices[0].message.content.trim();
        s.history.push({ role: "assistant", content: reply });
        logMessage(chatId, 'Priya', reply);

        // Check if confused
        const confusedKeywords = ['samajh nahi', 'pata nahi', 'sure nahi', 'not sure', "don't know", 'unclear'];
        const isConfused = confusedKeywords.some(k => reply.toLowerCase().includes(k));

        if (isConfused) {
            s.confusedCount++;
        }

        const button = (isConfused || s.confusedCount >= 2) ? confusedButton : callButton;
        await bot.sendMessage(chatId, reply, button);

    } catch (e) {
        console.error('Error:', e.message);
        const fallback = "Seedha mam se baat karo, woh sab bata sakti hain.";
        logMessage(chatId, 'Priya', fallback);
        await bot.sendMessage(chatId, fallback, confusedButton);
    }
});

process.on('SIGTERM', async () => {
    for (const [chatId] of sessions) await sendChatLogToAdmin(chatId);
    process.exit(0);
});
