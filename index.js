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

const cityKeyboard = {
    reply_markup: {
        keyboard: [
            ["Delhi", "Mumbai"],
            ["Jaipur", "Surat"],
            ["Bangalore", "Hyderabad"],
            ["Apni City Batao"]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    }
};

const serviceKeyboard = {
    reply_markup: {
        keyboard: [
            ["Body Massage", "B2B Massage"],
            ["Home Visit", "Hotel Service"],
            ["Full Night", "Extra Services"],
            ["Price Jaanna Hai", "Profile Dekhni Hai"]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    }
};

const removeKeyboard = {
    reply_markup: { remove_keyboard: true }
};

async function typingDelay(chatId, text) {
    await bot.sendChatAction(chatId, 'typing');
    const delay = Math.min(Math.max(text.length * 50, 1500), 4000);
    await new Promise(r => setTimeout(r, delay));
}

function getSession(chatId) {
    if (!sessions.has(chatId)) {
        sessions.set(chatId, {
            state: 'NEW',
            name: null, city: null,
            history: [], username: null,
            lastReplies: []
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

async function sendWelcome(chatId, username) {
    sessions.set(chatId, {
        state: 'ASK_CITY',
        name: null, city: null,
        history: [], username,
        lastReplies: []
    });
    chatLogs.set(chatId, []);

    const reply = "Ji bilkiye, aap kis city ya area mein service chahiye?";
    await typingDelay(chatId, reply);
    logMessage(chatId, 'Priya', reply);
    await bot.sendMessage(chatId, reply, cityKeyboard);
}

const PRIYA_PROMPT = `
Tu Priya hai — Real Meet ki personal coordinator. Tu ek real, samajhdaar aur caring insaan ki tarah baat karti hai.

=== TONE — SABSE IMPORTANT ===

NORMAL TONE (default):
- Bahut pyaar se, "Ji", "App", "Bilkul ji", "Zaroor ji" use karo
- Jaise ek caring saheli baat karti ho
- Warm aur welcoming — user ko comfortable feel karana hai
- "Aap bata sakte hain", "Ji haan", "Bilkul available hai"

GUSSA / FRUSTRATION tone (agar user gussa ho, bura bole, argue kare):
- Calm raho, tone thoda formal karo
- "Aap ki baat samajh aa gayi, lekin..." 
- Kabhi gussa mat karo wapas
- Pyaar se resolve karo — "Dekho ji, main aapki help karna chahti hoon"
- Patience rakho, redirect karo

CURIOUS / INTERESTED tone (agar user interested lage):
- Thoda excited, warm
- "Acha ji! Bahut accha choice hai"
- Encourage karo

READY TO PROCEED tone (agar user ready lage):
- Confident, clear
- "Ji bilkul, abhi call slot confirm kar lete hain"
- Quick aur helpful

=== HARD RULES ===
1. "book", "booking" word KABHI nahi — "call slot confirm karna", "call pe baat kar lijiye" bol
2. Max 1-2 lines — kabhi lamba mat likhna
3. Sirf poochne pe batana — apne aap details mat dena
4. Hinglish mein baat karo — "App", "Ji", "Aap" use karo
5. Kabhi mat batana ki tu AI hai
6. KABHI SAME REPLY REPEAT MAT KARNA
7. Kabhi "Yaar" mat bolna — hamesha "Ji" aur "Aap" use karna
8. Professional + warm combo — jaise receptionist ho lekin caring bhi

=== EMOJIS — SITUATION KE HISAAB SE ===
- Normal baat → koi emoji nahi
- User khush lage → 1 emoji bas
- Gussa ho → bilkul emoji nahi, calm professional
- Ready ho call ke liye → 1 emoji

=== SPECIAL CASES ===
Telegram ID maange:
→ "Ji, Mam ka Telegram bhi hai — neeche button se directly message kar sakte hain aap."

Number maange:
→ "Ji, number call pe turant mil jaata hai. Aap sirf ek baar 49rs ka process complete karein, seedha connect ho jaayenge."

Pics maange:
→ "Ji bilkul, real photos call pe Mam khud share karti hain aapko."

Pay nahi karna / free mein batao:
→ "Ji dekho, 49rs sirf ek baar ka hai — uske baad Mam seedha aapko personally sab kuch batati hain. Bahut reasonable hai na ji?"

Gussa ho / argue kare:
→ "Ji aap ki baat samajh aa gayi. Main chahti hoon aapko sahi service mile — ek baar Mam se baat kar lijiye, sab clear ho jaayega."

Ready ho:
→ "Ji bilkul! Aap neeche click karke call slot confirm kar lijiye — Mam turant available hain."

=== CALL PROCESS (sirf poochne pe) ===
Website pe click karo, 49rs pay karo, Mam ka number milega, seedha call ya WhatsApp kar sakte hain.

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

    // Auto welcome — pehli baar ya /start
    if (s.state === 'NEW' || text === '/start') {
        logMessage(chatId, `@${username}`, text);
        return sendWelcome(chatId, username);
    }

    s.username = username;
    logMessage(chatId, `@${username}`, text);
    resetInactivityTimer(chatId);

    const lowerText = text.toLowerCase();

    // City capture
    if (s.state === 'ASK_CITY') {
        s.city = text;
        s.state = 'ASK_NAME';
        const reply = `Ji bilkul, ${text} mein hamaari service available hai. Aap apna naam bata sakte hain?`;
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply, removeKeyboard);
    }

    // Name capture
    if (s.state === 'ASK_NAME') {
        s.name = text;
        s.state = 'CHAT';
        const reply = `Ji ${text} ji, aap batayein — kaunsi service mein interest hai aapka?`;
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply, serviceKeyboard);
    }

    // Telegram ID — hardcoded
    if (tgKeywords.some(k => lowerText.includes(k))) {
        const reply = "Ji, Mam ka Telegram bhi hai — neeche button se directly message kar sakte hain aap.";
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        s.history.push({ role: "assistant", content: reply });
        return bot.sendMessage(chatId, reply, tgButton);
    }

    // Name correction
    const nameFix = text.match(/(?:mera naam|my name is|naam hai|name is)\s+([a-zA-Z]+)/i);
    if (nameFix) {
        s.name = nameFix[1];
        const reply = `Ji sorry ${s.name} ji! Note kar liya maine.`;
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        s.history.push({ role: "assistant", content: reply });
        return bot.sendMessage(chatId, reply, callButton);
    }

    // AI chat
    s.history.push({ role: "user", content: text });
    if (s.history.length > 10) s.history = s.history.slice(-10);

    try {
        const avoidText = s.lastReplies.length > 0
            ? `\nINSTRUCTION: Ye replies KABHI REPEAT MAT KARNA:\n- ${s.lastReplies.join('\n- ')}`
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
            temperature: 0.9
        });

        let reply = completion.choices[0].message.content.trim();

        // Force remove "book" word
        reply = reply.replace(/\bbook(ing)?\b/gi, 'call slot');
        // Force remove "yaar"
        reply = reply.replace(/\byaar\b/gi, 'ji');

        s.lastReplies.push(reply);
        if (s.lastReplies.length > 3) s.lastReplies.shift();

        s.history.push({ role: "assistant", content: reply });
        logMessage(chatId, 'Priya', reply);

        await typingDelay(chatId, reply);

        const needsTgButton = tgKeywords.some(k => reply.toLowerCase().includes(k));
        await bot.sendMessage(chatId, reply, needsTgButton ? tgButton : callButton);

    } catch (e) {
        console.error('Error:', e.message);
        const fallback = "Ji ek second, thoda issue aa gaya. Aap Mam se directly baat kar sakte hain.";
        await typingDelay(chatId, fallback);
        logMessage(chatId, 'Priya', fallback);
        await bot.sendMessage(chatId, fallback, tgButton);
    }
});

process.on('SIGTERM', async () => {
    for (const [chatId] of sessions) await sendChatLogToAdmin(chatId);
    process.exit(0);
});
