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
            { text: "📞 Call Slot Confirm Karein — Rs.49", url: WEBSITE_URL }
        ]]
    }
};

const tgButton = {
    reply_markup: {
        inline_keyboard: [
            [{ text: "📞 Call Slot Confirm Karein — Rs.49", url: WEBSITE_URL }],
            [{ text: "💬 Mam ko Telegram pe Message Karein", url: MAM_TELEGRAM }]
        ]
    }
};

const GREET_WORDS = ['hey', 'hi', 'hello', 'hlo', 'hii', 'hy', 'sup', 'namaste', 'hola', 'helo', 'hlw', 'hye', 'good morning', 'good evening', 'salam'];

function isGreet(text) {
    const t = text.toLowerCase().trim();
    return GREET_WORDS.some(w => t === w || t === w + '!' || t === w + ' ji');
}

function looksLikeName(text) {
    const t = text.toLowerCase().trim();
    const stopWords = ['service', 'price', 'rate', 'massage', 'body', 'hotel', 'home', 'visit', 'night', 'full', 'extra', 'profile', 'nahi', 'haan', 'okay', 'ok', 'theek', 'kya', 'hai', 'aap', 'mam', 'call', 'number', 'batuga', 'nahi batuga', 'mtlb', 'grok', 'bhai', 'yaar'];
    if (stopWords.some(w => t.includes(w))) return false;
    if (isGreet(text)) return false;
    if (t === 'nahi' || t === 'na' || t === 'no') return false;
    if (text.length >= 2 && text.length <= 25) return true;
    return false;
}

async function typingDelay(chatId, text) {
    await bot.sendChatAction(chatId, 'typing');
    const delay = Math.min(Math.max(text.length * 45, 1200), 3500);
    await new Promise(r => setTimeout(r, delay));
}

function getSession(chatId) {
    if (!sessions.has(chatId)) {
        sessions.set(chatId, {
            state: 'NEW',
            name: null, city: null,
            history: [], username: null,
            lastReplies: [],
            nameAskCount: 0
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
        lastReplies: [],
        nameAskCount: 0
    });
    chatLogs.set(chatId, []);
    const reply = "Kaunsi city mein service chahiye aapko? 😊";
    await typingDelay(chatId, reply);
    logMessage(chatId, 'Priya', reply);
    await bot.sendMessage(chatId, reply);
}

const PRIYA_PROMPT = `
Tu Priya hai — Real Meet ki coordinator. Bilkul real ladki ki tarah baat kar — smart, warm, thoda flirty bhi.

=== PERSONALITY ===
- Kabhi kabhi "Ji" use kar, lekin har reply "Ji" se mat shuru karna — variety rakho
- Jaise ek friendly girl baat karti hai — "Acha!", "Haan bilkul", "Suno", "Dekho", "Arre"
- Short replies — 1-2 lines max
- Situation ke hisaab se emoji use karo — lekin zyada nahi, sirf 1 kafi hai
- Kabhi kabhi bina emoji ke bhi reply karo

=== TONE CHANGE — SITUATION KE HISAAB SE ===
Normal: Warm, friendly, caring
Gussa/argue: Calm, "Samajh aa gaya, lekin..." — wapas gussa nahi
Interested: "Acha! Ye wala bahut popular hai 🔥"
Ready to call: Excited, "Abhi confirm karo, slot jaldi bhar jaate hain!"
Confused user: Clearly explain karo, simple words mein

=== SABSE IMPORTANT — CALL SLOT CONVERT KARNA ===
Tera main kaam hai user ko call slot confirm karna — is pe poora focus:
- Pics maange → "Real profiles Mam WhatsApp pe personally bhejti hain — pehle slot confirm karo, turant milenge 😉"
- Price pooche → "1500 se shuru hai, profile pe depend karta hai. Slot confirm karo — Mam best deal deti hain personally"
- Russian/specific profile → "Haan available hai! Slot confirm karo — Mam ye profile ka full detail WhatsApp pe bhejti hain 😍"
- Number maange → "Number slot ke baad milta hai — 49rs mein confirm karo, seedha connect ho jaoge"
- Koi bhi sawaal → Answer karo aur HAMESHA call slot ki taraf le jao

=== HARD RULES ===
1. "book", "booking" KABHI nahi — "call slot confirm karo" bol
2. Max 1-2 lines
3. "Yaar" nahi bolna
4. AI hai kabhi mat batana
5. SAME REPLY REPEAT NAHI — angle badlo
6. Har 2-3 replies ke baad call slot ka button natural way mein push karo

=== SPECIAL CASES ===
Pics/photos maange:
→ "Real model profiles Mam WhatsApp pe personally bhejti hain — neeche se slot confirm karo, turant aa jaayengi 😉"

Telegram ID maange:
→ "Mam ka Telegram bhi hai, neeche button se directly message kar sakte ho"

Free mein batao / pay nahi karna:
→ "Arre 49rs mein Mam ka direct number, WhatsApp pe profiles — itna sasta aur kahan milega? 😄"

Gussa ho:
→ "Samajh aa gaya bhai, but seriously — ek baar Mam se baat karo, sab clear ho jaayega"

Ready ho:
→ "Abhi confirm karo neeche se — slot jaldi bhar jaate hain! 🔥"

=== SERVICE INFO ===
Body massage, B2B massage, extra services, home visit, hotel, short time, full night.
Price 1500 se shuru, profile pe depend.
Profiles: College Girl, Office Girl, Russian, Mature, Corporate, Widow.
All India available.
Pics/profiles — Mam WhatsApp pe personally bhejti hain call slot ke baad.
`;

const tgKeywords = ['telegram', 'tg id', 'username', 'mam ka telegram', 'id do', 'id dena', 'id batao'];
const picKeywords = ['pic', 'photo', 'pics', 'photos', 'image', 'dikhao', 'dekh', 'profile dikhao', 'ladki', 'ladkiyan'];

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

    // Pics — hardcoded smart reply
    if (picKeywords.some(k => lowerText.includes(k))) {
        const reply = "Real model profiles Mam WhatsApp pe personally bhejti hain — neeche se slot confirm karo, turant aa jaayengi 😉";
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        s.history.push({ role: "assistant", content: reply });
        return bot.sendMessage(chatId, reply, callButton);
    }

    // Telegram ID
    if (tgKeywords.some(k => lowerText.includes(k))) {
        const reply = "Mam ka Telegram bhi hai, neeche button se directly message kar sakte ho 👇";
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        s.history.push({ role: "assistant", content: reply });
        return bot.sendMessage(chatId, reply, tgButton);
    }

    // City capture
    if (s.state === 'ASK_CITY') {
        if (isGreet(text)) {
            const reply = "Hey! Kaunsi city mein service chahiye? 😊";
            await typingDelay(chatId, reply);
            logMessage(chatId, 'Priya', reply);
            return bot.sendMessage(chatId, reply);
        }
        s.city = text;
        s.state = 'ASK_NAME';
        const reply = `${text} mein available hai hamaari service! Aapka naam? 😊`;
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply);
    }

    // Name capture — max 2 baar poochna, phir skip
    if (s.state === 'ASK_NAME') {
        if (isGreet(text) || !looksLikeName(text)) {
            s.nameAskCount = (s.nameAskCount || 0) + 1;
            if (s.nameAskCount >= 2) {
                // 2 baar pooch liya — naam skip karo, aage badho
                s.name = 'Aap';
                s.state = 'CHAT';
                const reply = "Theek hai! Kaunsi service mein interest hai aapka? 😊";
                await typingDelay(chatId, reply);
                logMessage(chatId, 'Priya', reply);
                return bot.sendMessage(chatId, reply, callButton);
            }
            const reply = "Aapka naam bata dein? 😊";
            await typingDelay(chatId, reply);
            logMessage(chatId, 'Priya', reply);
            return bot.sendMessage(chatId, reply);
        }
        s.name = text;
        s.state = 'CHAT';
        const reply = `${text}! Kaunsi service mein interest hai? 😊`;
        await typingDelay(chatId, reply);
        logMessage(chatId, 'Priya', reply);
        return bot.sendMessage(chatId, reply, callButton);
    }

    // Name correction
    const nameFix = text.match(/(?:mera naam|my name is|naam hai|name is)\s+([a-zA-Z]+)/i);
    if (nameFix) {
        s.name = nameFix[1];
        const reply = `Oh sorry ${s.name}! Theek hai 😄`;
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
            temperature: 0.92
        });

        let reply = completion.choices[0].message.content.trim();
        reply = reply.replace(/\bbook(ing)?\b/gi, 'call slot');
        reply = reply.replace(/\byaar\b/gi, '');

        s.lastReplies.push(reply);
        if (s.lastReplies.length > 3) s.lastReplies.shift();

        s.history.push({ role: "assistant", content: reply });
        logMessage(chatId, 'Priya', reply);

        await typingDelay(chatId, reply);

        const needsTgButton = tgKeywords.some(k => reply.toLowerCase().includes(k));
        await bot.sendMessage(chatId, reply, needsTgButton ? tgButton : callButton);

    } catch (e) {
        console.error('Error:', e.message);
        const fallback = "Ek second, thoda issue aa gaya 😅 Mam se directly baat karo neeche se!";
        await typingDelay(chatId, fallback);
        logMessage(chatId, 'Priya', fallback);
        await bot.sendMessage(chatId, fallback, tgButton);
    }
});

process.on('SIGTERM', async () => {
    for (const [chatId] of sessions) await sendChatLogToAdmin(chatId);
    process.exit(0);
});
