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

const GREET_WORDS = ['hey', 'hi', 'hello', 'hlo', 'hii', 'hy', 'sup', 'bhai', 'yaar', 'namaste', 'namaskar', 'hola', 'helo', 'hlw', 'hye', 'good morning', 'good evening', 'good night', 'salam', 'adab', 'kya haal', 'kaise ho', 'kya chal'];

function isGreet(text) {
    const t = text.toLowerCase().trim();
    return GREET_WORDS.some(w => t === w || t === w + '!' || t === w + ' ji');
}

function looksLikeName(text) {
    const t = text.toLowerCase().trim();
    const stopWords = ['service', 'price', 'rate', 'massage', 'body', 'hotel', 'home', 'visit', 'night', 'full', 'extra', 'profile', 'russian', 'college', 'nahi', 'haan', 'okay', 'ok', 'theek', 'kya', 'hai', 'aap', 'mam', 'call', 'number'];
    if (stopWords.some(w => t.includes(w))) return false;
    if (isGreet(text)) return false;
    if (text.length >= 2 && text.length <= 20) return true;
    return false;
}

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
    await bot.sendMessage(chatId, reply);
}

const PRIYA_PROMPT = `
Tu Priya hai — Real Meet ki personal coordinator. Tu ek real, samajhdaar aur caring insaan ki tarah baat karti hai.

=== CONTEXT SAMAJHNA — SABSE IMPORTANT ===
Ye ek Real Meet service ka bot hai jahan body massage, B2B massage, home visit, hotel service milti hai.
Agar user koi bhi cheez pooche — service se related ho ya na ho — tu samajhdar tarike se Real Meet service ki taraf le jaati hai.
Agar user greet kare (Hi, Hey, Hello) — warmly greet karo aur city/service ki taraf le jao.
Kabhi bhi random input ko city ya naam mat samjho — pehle context samjho.

=== TONE — SITUATION KE HISAAB SE BADLE ===
NORMAL: "Ji", "Aap", "Bilkul ji", "Zaroor ji" — warm aur caring
GUSSA HO: Calm raho, "Ji aap ki baat samajh aayi, lekin..." — kabhi gussa mat karo wapas
INTERESTED: Thoda warm excited — "Acha ji! Bahut accha choice"
READY: "Ji bilkul, aap call slot confirm kar lijiye"

=== HARD RULES ===
1. "book", "booking" KABHI nahi — "call slot confirm karna" bol
2. Max 1-2 lines only
3. Sirf poochne pe details batao
4. Hinglish — "Ji", "Aap" use karo, "Yaar" bilkul nahi
5. Kabhi mat batana AI hai
6. SAME REPLY REPEAT NAHI
7. Greet (Hi/Hey/Hello) aaye to warmly respond karo

=== SPECIAL CASES ===
Greet aaye (hi/hey/hello):
→ "Ji! Aap batayein — kis city mein service chahiye?"

Telegram ID maange:
→ "Ji, Mam ka Telegram hai — neeche se directly message kar sakte hain."

Number maange:
→ "Ji, number call pe turant milta hai. 49rs ka ek process hai bas."

Pics maange:
→ "Ji bilkul, real photos Mam call pe khud share karti hain."

Pay nahi karna:
→ "Ji dekho, 49rs sirf ek baar — uske baad Mam seedha sab kuch personally batati hain."

Gussa ho:
→ "Ji aap ki baat samajh aayi. Main chahti hoon aapko sahi service mile — ek baar Mam se baat kar lijiye."

Ready ho:
→ "Ji bilkul! Neeche click karke call slot confirm kar lijiye — Mam turant available hain."

=== SERVICE INFO (sirf poochne pe) ===
Body massage, B2B massage, extra services, home visit, hotel, short time, full night.
Price 1500 se shuru, profile pe depend.
Profiles: College Girl, Office Girl, Russian, Mature, Corporate, Widow.
All India available.
`;

const tgKeywords = ['telegram', 'tg id', 'username', 'mam ka telegram', 'id do', 'id dena', 'id batao'];

bot.on('message', async (msg) => {
    const chatId = String(msg.chat.id);
    const text = msg.text ? msg.text.trim() : '';
    const username = msg.from?.username || msg.from?.first_name || 'Unknown';

    if (!text) return;

    const s = getSession(chatId);

    // Auto welcome
    if (s.state === 'NEW' || text === '/start') {
        logMessage(chatId, `@${username}`, text);
        return sendWelcome(chatId, username);
    }

    s.username = username;
    logMessage(chatId, `@${username}`, text);
    resetInactivityTimer(chatId);

    const lowerText = text.toLowerCase().trim();

    // City capture
    if (s.state === 'ASK_CITY') {
        if (isGreet(text)) {
            const reply = "Ji! Aap batayein — kis city mein service chahiye aapko?";
            await typingDelay(chatId, reply);
            logMessage(chatId, 'Priya', reply);
            return bot.sendMessage(chatId, reply);
        }
        s.city = text;
        s.state = 'ASK_NAME';
        const reply = `Ji bilkul, ${text} mein hamaari service available hai. Aap apna naam bata sakte hain?`;
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply);
    }

    // Name capture
    if (s.state === 'ASK_NAME') {
        if (isGreet(text) || !looksLikeName(text)) {
            const reply = "Ji, aap apna naam batayein?";
            await typingDelay(chatId, reply);
            logMessage(chatId, 'Priya', reply);
            return bot.sendMessage(chatId, reply);
        }
        s.name = text;
        s.state = 'CHAT';
        const reply = `Ji ${text} ji, aap batayein — kaunsi service mein interest hai?`;
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply, callButton);
    }

    // Telegram ID
    if (tgKeywords.some(k => lowerText.includes(k))) {
        const reply = "Ji, Mam ka Telegram hai — neeche se directly message kar sakte hain aap.";
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        s.history.push({ role: "assistant", content: reply });
        return bot.sendMessage(chatId, reply, tgButton);
    }

    // Name correction
    const nameFix = text.match(/(?:mera naam|my name is|naam hai|name is)\s+([a-zA-Z]+)/i);
    if (nameFix) {
        s.name = nameFix[1];
        const reply = `Ji sorry ${s.name} ji! Note kar liya.`;
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
            ? `\nYe replies REPEAT MAT KARNA:\n- ${s.lastReplies.join('\n- ')}`
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
        reply = reply.replace(/\bbook(ing)?\b/gi, 'call slot');
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
