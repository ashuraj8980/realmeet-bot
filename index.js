const TelegramBot = require('node-telegram-bot-api');
const { Groq } = require('groq-sdk');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Priya Active... 💕'));
app.listen(process.env.PORT || 10000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const session = {};

const bookButton = {
    reply_markup: {
        inline_keyboard: [[
            { text: "🌐 Book via Website", url: "https://real-glow.vercel.app/" }
        ]]
    }
};

const PRIYA_PROMPT = `
Tu Priya hai — RealMeet ki personal assistant. Tu ek real insaan ki tarah baat karti hai, bahut warm, friendly aur thoda flirty tone mein. Kabhi robot jaisi mat lag.

RealMeet Services:
- Body Massage Service (full body relaxation)
- B2B Massage Service (body to body, premium experience)
- Extra Services bhi available hain (details call pe milenge)
- Service available hai almost all cities mein India mein
- Booking ke liye call slot available hai — mam se seedha baat hoti hai
- Price aur full details ke liye website pe jana hoga ya call karni hogi

Tera kaam:
1. Pehle user ka naam puchna
2. Phir city puchna
3. Service briefly explain karna — lekin poori details call pe milegi
4. Customer ko gently website pe bhejni hai booking ke liye
5. Agar koi bhi service se related sawaal kare — short mein jawab de aur call/website pe bhej
6. Agar koi aur topic kare — pyaar se bolo "Yaar main toh bas RealMeet ki specialist hoon 😄 Aao booking karein!"
7. Replies short rakho — max 2-3 lines. Kabhi lambi baatein mat karo.
8. Hindi-Hinglish mein baat kar — jaise dost karta hai
9. Kabhi mat bolo ki tu AI hai
`;

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';

    if (!text) return;

    // Session init
    if (!session[chatId]) {
        session[chatId] = { state: 'START', name: null, city: null, history: [] };
    }

    const s = session[chatId];

    // /start
    if (text === '/start') {
        session[chatId] = { state: 'ASK_NAME', name: null, city: null, history: [] };
        return bot.sendMessage(chatId,
            `Heyyy! 👋 Main Priya hoon — RealMeet ki personal coordinator! 💕\n\nAapka naam kya hai? 😊`
        );
    }

    // Name capture
    if (s.state === 'ASK_NAME') {
        s.name = text;
        s.state = 'ASK_CITY';
        return bot.sendMessage(chatId,
            `Ooh ${s.name}! Kitna pyaara naam hai 😍\n\nAap kis city mein hain? Main dekh leti hoon service available hai ya nahi! 🗺️`
        );
    }

    // City capture
    if (s.state === 'ASK_CITY') {
        s.city = text;
        s.state = 'CHAT';
        return bot.sendMessage(chatId,
            `${s.city} mein hain aap? Perfect! Hamaari service wahan available hai! ✅\n\nHum provide karte hain:\n💆 Body Massage\n🔥 B2B Massage\n✨ Extra Services (details call pe)\n\nFull details aur booking ke liye neeche click karein! 👇`,
            bookButton
        );
    }

    // Conversational AI phase
    await bot.sendChatAction(chatId, 'typing');

    // History maintain karo (max 6 messages)
    s.history.push({ role: "user", content: text });
    if (s.history.length > 6) s.history = s.history.slice(-6);

    try {
        const messages = [
            { role: "system", content: `${PRIYA_PROMPT}\nUser ka naam: ${s.name || 'N/A'}, City: ${s.city || 'N/A'}` },
            ...s.history
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            max_tokens: 150,
            temperature: 0.8
        });

        const reply = completion.choices[0].message.content;
        s.history.push({ role: "assistant", content: reply });

        bot.sendMessage(chatId, reply, bookButton);

    } catch (e) {
        console.error(e);
        bot.sendMessage(chatId,
            `Arre ${s.name || 'yaar'}, thoda network issue ho gaya 😅 Seedha website pe chale jao! 👇`,
            bookButton
        );
    }
});
