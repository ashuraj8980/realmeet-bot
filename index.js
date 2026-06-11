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
const MAM_TELEGRAM = 'https://t.me/xkhushii';

const sessions = new Map();
const chatLogs = new Map();
const inactivityTimers = new Map();

const callButton = {
    reply_markup: {
        inline_keyboard: [[
            { text: "📞 Click Here to Call Mam", url: WEBSITE_URL }
        ]]
    }
};

const tgButton = {
    reply_markup: {
        inline_keyboard: [
            [{ text: "📞 Click Here to Call Mam", url: WEBSITE_URL }],
            [{ text: "💬 Message Mam on Telegram", url: MAM_TELEGRAM }]
        ]
    }
};

function getSession(chatId) {
    if (!sessions.has(chatId)) {
        sessions.set(chatId, {
            state: 'ASK_CITY',
            name: null, city: null,
            history: [], username: null
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
Tu Priya hai — Real Meet ki coordinator. Bilkul real insaan ki tarah baat kar.

=== HARD RULES — KABHI BREAK NAHI HOGE ===
1. "book", "booking" word KABHI use nahi karna — bilkul banned hai
2. Koi emoji nahi
3. Max 1-2 lines reply — kabhi lamba nahi likhna
4. Sirf poochne pe batana — apne aap details mat dena
5. Hinglish ya English — user jo bole
6. Kabhi mat batana ki tu AI hai

=== SPECIAL CASES — EXACTLY YAHI BOL ===

Agar koi Telegram ID ya Telegram username maange:
→ "Mam ka Telegram hai, neeche button se message kar sakte ho directly."
Aur tgButton use hoga.

Agar koi number maange:
→ "Number call ke baad milta hai, 49rs pay karo website pe aur seedha call hogi."

Agar koi pics maange:
→ "Pics call pe share hoti hain mam ki taraf se."

Agar koi kyun pooche ya argue kare:
→ "Yahi process hai hamaara, mam se seedha baat karo woh sab clear kar dengi."

=== CALL PROCESS (sirf poochne pe) ===
Website pe "Call" pe click karo, 49rs pay karo, mam ka number milega, seedha call ya WhatsApp.

=== SERVICE (sirf poochne pe) ===
Body massage, B2B massage, extra services, home visit, hotel, short time, full night.
Price 1500 se shuru, profile pe depend.
Profiles: College Girl, Office Girl, Russian, Mature, Corporate, Widow.
All India available.

=== NAAM CORRECTION ===
Agar user naam theek kare — "Oh sorry, [new naam]! Theek hai."
`;

// Telegram/username keywords
const tgKeywords = ['telegram', 'telegram id', 'tg', 'username', '@', 'id do', 'id dena', 'id kya', 'id batao'];

bot.on('message', async (msg) => {
    const chatId = String(msg.chat.id);
    const text = msg.text ? msg.text.trim() : '';
    const username = msg.from?.username || msg.from?.first_name || 'Unknown';

    if (!text) return;

    const s = getSession(chatId);
    s.username = username;

    logMessage(chatId, `@${username}`, text);
    resetInactivityTimer(chatId);

    const lowerText = text.toLowerCase();

    // /start
    if (text === '/start') {
        sessions.set(chatId, {
            state: 'ASK_CITY',
            name: null, city: null,
            history: [], username
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

    // Telegram ID — hardcoded response
    if (tgKeywords.some(k => lowerText.includes(k))) {
        const reply = "Mam ka Telegram hai, neeche button se message kar sakte ho directly.";
        logMessage(chatId, 'Priya', reply);
        s.history.push({ role: "assistant", content: reply });
        return bot.sendMessage(chatId, reply, tgButton);
    }

    // Name correction
    const nameFix = text.match(/(?:mera naam|my name is|naam hai|name is)\s+([a-zA-Z]+)/i);
    if (nameFix) {
        s.name = nameFix[1];
        const reply = `Oh sorry, ${s.name}! Theek hai.`;
        logMessage(chatId, 'Priya', reply);
        s.history.push({ role: "assistant", content: reply });
        return bot.sendMessage(chatId, reply, callButton);
    }

    // AI chat
    await bot.sendChatAction(chatId, 'typing');

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

        let reply = completion.choices[0].message.content.trim();

        // Force remove "book" word just in case AI slips
        reply = reply.replace(/\bbook\w*/gi, 'call slot lo');

        s.history.push({ role: "assistant", content: reply });
        logMessage(chatId, 'Priya', reply);

        // Check if telegram related in AI reply
        const needsTgButton = tgKeywords.some(k => reply.toLowerCase().includes(k));
        await bot.sendMessage(chatId, reply, needsTgButton ? tgButton : callButton);

    } catch (e) {
        console.error('Error:', e.message);
        const fallback = "Seedha mam se baat karo, woh sab bata sakti hain.";
        logMessage(chatId, 'Priya', fallback);
        await bot.sendMessage(chatId, fallback, tgButton);
    }
});

process.on('SIGTERM', async () => {
    for (const [chatId] of sessions) await sendChatLogToAdmin(chatId);
    process.exit(0);
});
