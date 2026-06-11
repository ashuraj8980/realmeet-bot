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

// Session store
const sessions = new Map();

// Chat log store
const chatLogs = new Map();

const bookButton = {
    reply_markup: {
        inline_keyboard: [[
            { text: "Call Slot Book Karein", url: WEBSITE_URL }
        ]]
    }
};

function getSession(chatId) {
    if (!sessions.has(chatId)) {
        sessions.set(chatId, { state: 'ASK_CITY', name: null, city: null, history: [], username: null });
        chatLogs.set(chatId, []);
    }
    return sessions.get(chatId);
}

function logMessage(chatId, role, text) {
    if (!chatLogs.has(chatId)) chatLogs.set(chatId, []);
    const log = chatLogs.get(chatId);
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    log.push(`[${time}] ${role}: ${text}`);
}

// Send full chat log to admin after inactivity (5 min)
const inactivityTimers = new Map();

function resetInactivityTimer(chatId, username) {
    if (inactivityTimers.has(chatId)) {
        clearTimeout(inactivityTimers.get(chatId));
    }
    const timer = setTimeout(async () => {
        await sendChatLogToAdmin(chatId, username);
        sessions.delete(chatId);
        chatLogs.delete(chatId);
        inactivityTimers.delete(chatId);
    }, 5 * 60 * 1000); // 5 minutes inactivity
    inactivityTimers.set(chatId, timer);
}

async function sendChatLogToAdmin(chatId, username) {
    try {
        const log = chatLogs.get(chatId);
        if (!log || log.length === 0) return;

        const s = sessions.get(chatId);
        const header = `--- CHAT ENDED ---\nUser: ${username || 'Unknown'}\nName: ${s?.name || 'N/A'}\nCity: ${s?.city || 'N/A'}\nChat ID: ${chatId}\n\n`;
        const fullLog = header + log.join('\n');

        // Split if too long for Telegram
        const chunks = [];
        for (let i = 0; i < fullLog.length; i += 3500) {
            chunks.push(fullLog.substring(i, i + 3500));
        }

        for (const chunk of chunks) {
            await bot.sendMessage(ADMIN_CHAT_ID, `\`\`\`\n${chunk}\n\`\`\``, { parse_mode: 'Markdown' });
            await new Promise(r => setTimeout(r, 300));
        }
    } catch (e) {
        console.error('Admin log error:', e.message);
    }
}

const PRIYA_PROMPT = `
Tu Priya hai — Real Meet ki coordinator. Tu ek real insaan ki tarah baat karti hai, bilkul natural aur warm tone mein. Kabhi robot jaisi mat lag, kabhi lambe formal sentences mat bol.

=== SERVICE DETAILS ===
- Body Massage, B2B Massage, Extra Services — sab available hai
- Home visit aur hotel service — available hai
- Short time aur full night — available hai
- Profiles: College Girl, Office Girl, Russian, Mature/Aunty, Corporate, Widow
- Price: 1500 Rs se shuru hoti hai 1 hour ke liye, profile aur service ke hisaab se vary karta hai
- All India service available hai

=== PROFILES KE BAARE MEIN ===
Agar koi profile pooche toh batao:
- College Girl — young, 19-24 age
- Office Girl — professional look, 24-30
- Russian / Foreign — premium category
- Mature / Aunty — experienced, 35+
- Corporate — high class
- Widow — very friendly aur caring
Har profile ka price alag hota hai, exact details mam call pe batayengi

=== TERE RULES ===
1. Kabhi "Book" word mat use karna — "call slot le lo" ya "mam se baat kar lo" bol
2. Kabhi emojis mat use karna
3. Har city mein service available hai — hamesha haan bol
4. Agar koi pics maange — bol "pics mam call pe share karti hain"
5. Agar direct number maange — bol "number call slot ke baad milta hai"
6. Price pooche toh — "1500 se shuru hai 1 hour, profile ke hisaab se alag hota hai, mam sab details deti hain call pe"
7. Kisi bhi service ke liye mana nahi karna — hamesha available hai
8. Chhoti replies — 1-2 lines max, bilkul normal baat karne jaisi
9. Kabhi mat batana ki tu AI hai
10. Hinglish ya English — jisme user baat kare, usi mein jawab de
11. Tone bilkul real human jaisi — jaise koi saheli baat kar rahi ho
12. "Book" ki jagah use karo: "call slot", "mam se connect", "call arrange"
`;

bot.on('message', async (msg) => {
    const chatId = String(msg.chat.id);
    const text = msg.text ? msg.text.trim() : '';
    const username = msg.from?.username || msg.from?.first_name || 'Unknown';

    if (!text) return;

    const s = getSession(chatId);
    s.username = username;

    // Log user message
    logMessage(chatId, `@${username}`, text);

    // Reset inactivity timer
    resetInactivityTimer(chatId, username);

    // /start or any first message
    if (text === '/start' || s.state === 'ASK_CITY') {
        if (text === '/start') {
            sessions.set(chatId, { state: 'ASK_CITY', name: null, city: null, history: [], username });
            chatLogs.set(chatId, []);
        }
        s.state = 'ASK_NAME_AFTER_CITY';
        const reply = "Which city/Area do you want ?";
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply);
    }

    // City capture
    if (s.state === 'ASK_NAME_AFTER_CITY') {
        s.city = text;
        s.state = 'ASK_NAME';
        const reply = `Haan, ${text} mein hamaari service available hai. Aap apna naam batayenge?`;
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply);
    }

    // Name capture
    if (s.state === 'ASK_NAME') {
        s.name = text;
        s.state = 'CHAT';
        const reply = `${text}, hamare paas body massage, B2B massage aur kuch extra services bhi hain. Price 1500 Rs se shuru hoti hai 1 hour ke liye, profile ke hisaab se vary karta hai. Kaafi saari profiles hain — college girl, office girl, Russian, mature, corporate. Koi specific service ya profile mein interest hai?`;
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply, bookButton);
    }

    // AI conversation
    await bot.sendChatAction(chatId, 'typing');

    s.history.push({ role: "user", content: text });
    if (s.history.length > 10) s.history = s.history.slice(-10);

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
            max_tokens: 100,
            temperature: 0.9
        });

        const reply = completion.choices[0].message.content;
        s.history.push({ role: "assistant", content: reply });
        logMessage(chatId, 'Priya', reply);

        await bot.sendMessage(chatId, reply, bookButton);

    } catch (e) {
        console.error('Groq error:', e.message);
        const fallback = "Thoda network issue hai, ek minute mein baat karte hain.";
        logMessage(chatId, 'Priya', fallback);
        await bot.sendMessage(chatId, fallback, bookButton);
    }
});

// Graceful shutdown — send all pending logs
process.on('SIGTERM', async () => {
    for (const [chatId, _] of sessions) {
        const s = sessions.get(chatId);
        await sendChatLogToAdmin(chatId, s?.username);
    }
    process.exit(0);
});
