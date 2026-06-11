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

// Typing delay — realistic human feel
async function typingDelay(chatId, text) {
    await bot.sendChatAction(chatId, 'typing');
    // 50ms per character, min 1.5s, max 4s
    const delay = Math.min(Math.max(text.length * 50, 1500), 4000);
    await new Promise(r => setTimeout(r, delay));
}

function getSession(chatId) {
    if (!sessions.has(chatId)) {
        sessions.set(chatId, {
            state: 'ASK_CITY',
            name: null, city: null,
            history: [], username: null,
            lastReplies: [] // track last 3 replies to avoid repetition
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

=== HARD RULES ===
1. "book", "booking" word KABHI nahi — "call lo mam ko" bol
2. Max 1-2 lines — kabhi lamba mat likhna
3. Sirf poochne pe batana — apne aap details mat dena
4. Hinglish ya English — user jo bole
5. Kabhi mat batana ki tu AI hai
6. KABHI SAME REPLY REPEAT MAT KARNA — har baar naya alag jawab dena
7. Agar user same cheez baar baar pooche — angle badlo, naya tarika se samjhao

=== EMOJIS — SITUATION KE HISAAB SE ===
- Koi service ya price pooche → bilkul emoji nahi, professional
- User friendly lage ya naam bataye → 1 warm emoji jaise :) ya
- User argue kare ya frustrate ho → koi emoji nahi, calm tone
- User ready lage call ke liye → 1 emoji jaise ya
- Kabhi 2 se zyada emoji ek message mein nahi

=== SPECIAL CASES — EXACTLY YAHI BOL ===
Telegram ID maange:
→ "Mam ka Telegram hai, neeche se directly message kar sakte ho."

Number maange:
→ "Number call ke baad milta hai, 49rs pay karo aur seedha connect ho jaoge."

Pics maange:
→ "Pics call pe share hoti hain."

Free mein batao ya pay nahi karna:
→ "Yaar 49rs toh sirf ek baar ka hai, uske baad mam seedha sab details deti hain. Kaafi reasonable hai na?"

Baar baar same sawaal ya argue kare:
→ Naya angle lo — kabhi price justify karo, kabhi convenience batao, kabhi warmly redirect karo. SAME LINE REPEAT MAT KARNA.

=== CALL PROCESS (sirf poochne pe) ===
Website pe click karo, 49rs pay karo, mam ka number milega, seedha call ya WhatsApp.

=== SERVICE (sirf poochne pe) ===
Body massage, B2B massage, extra services, home visit, hotel, short time, full night.
Price 1500 se shuru, profile pe depend.
Profiles: College Girl, Office Girl, Russian, Mature, Corporate, Widow.
All India available.
`;

const tgKeywords = ['telegram', 'tg id', 'tg username', 'username', 'tumhara id', 'mam ka id', 'mam ka telegram', 'id do', 'id dena', 'id batao', 'contact id'];

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
            history: [], username,
            lastReplies: []
        });
        chatLogs.set(chatId, []);
        const reply = "Which city/Area do you want ?";
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply);
    }

    // City capture
    if (s.state === 'ASK_CITY') {
        s.city = text;
        s.state = 'ASK_NAME';
        const reply = `Haan, ${text} mein available hai. Aapka naam?`;
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply);
    }

    // Name capture
    if (s.state === 'ASK_NAME') {
        s.name = text;
        s.state = 'CHAT';
        const reply = `${text}, kya service chahiye aapko?`;
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply, callButton);
    }

    // Telegram ID — hardcoded
    if (tgKeywords.some(k => lowerText.includes(k))) {
        const reply = "Mam ka Telegram hai, neeche se directly message kar sakte ho.";
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        s.history.push({ role: "assistant", content: reply });
        return bot.sendMessage(chatId, reply, tgButton);
    }

    // Name correction
    const nameFix = text.match(/(?:mera naam|my name is|naam hai|name is)\s+([a-zA-Z]+)/i);
    if (nameFix) {
        s.name = nameFix[1];
        const reply = `Oh sorry, ${s.name}! Theek hai.`;
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        s.history.push({ role: "assistant", content: reply });
        return bot.sendMessage(chatId, reply, callButton);
    }

    // AI chat
    s.history.push({ role: "user", content: text });
    if (s.history.length > 10) s.history = s.history.slice(-10);

    try {
        // Add last replies to avoid repetition
        const avoidText = s.lastReplies.length > 0
            ? `\nINSTRUCTION: Ye replies KABHI REPEAT MAT KARNA, naya angle lo:\n- ${s.lastReplies.join('\n- ')}`
            : '';

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `${PRIYA_PROMPT}${avoidText}\nUser naam: ${s.name || 'N/A'}, City: ${s.city || 'N/A'}`
                },
                ...s.history
            ],
            model: "llama-3.3-70b-versatile",
            max_tokens: 80,
            temperature: 0.95
        });

        let reply = completion.choices[0].message.content.trim();

        // Force remove "book" word
        reply = reply.replace(/\bbook\w*/gi, 'call lo');

        // Track last replies (keep 3)
        s.lastReplies.push(reply);
        if (s.lastReplies.length > 3) s.lastReplies.shift();

        s.history.push({ role: "assistant", content: reply });
        logMessage(chatId, 'Priya', reply);

        // Typing delay before sending
        await typingDelay(chatId, reply);

        const needsTgButton = tgKeywords.some(k => reply.toLowerCase().includes(k));
        await bot.sendMessage(chatId, reply, needsTgButton ? tgButton : callButton);

    } catch (e) {
        console.error('Error:', e.message);
        const fallback = "Ek second, thoda issue aa gaya. Mam se directly baat karo.";
        await typingDelay(chatId, fallback);
        logMessage(chatId, 'Priya', fallback);
        await bot.sendMessage(chatId, fallback, tgButton);
    }
});

process.on('SIGTERM', async () => {
    for (const [chatId] of sessions) await sendChatLogToAdmin(chatId);
    process.exit(0);
});
