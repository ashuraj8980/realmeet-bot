require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = process.env.BOT_TOKEN;
const url = process.env.RENDER_EXTERNAL_URL || 'https://realmeet-bot-1.onrender.com';

const bot = new TelegramBot(token);
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Priya AI Professional Engine Live!'));

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  try {
    await bot.setWebHook(`${url}/bot${token}`);
    console.log(`Webhook linked successfully.`);
  } catch (error) {
    console.error("Webhook error:", error);
  }
});

// User sessions tracking
const userSessions = {};

// Clean Name Validator (Stop words logic)
function isValidRealName(name) {
  const clean = name.trim().toLowerCase();
  
  // Strict list of words that are NOT real human names
  const restrictedWords = [
    'bot', 'test', 'fake', 'abcd', 'admin', 'unknown', 'user', 'human', 'nobody', 
    'no', 'ok', 'yes', 'haa', 'hi', 'hello', 'indian', 'india', 'hindu', 'muslim', 
    'boy', 'girl', 'male', 'female', 'men', 'women', 'guy', 'sir', 'madam', 'boss',
    'pussy', 'sex', 'fuck', 'call', 'free', 'book', 'service', 'hotel', 'home', 'room'
  ];

  if (clean.length < 2 || clean.length > 12) return false;
  if (restrictedWords.some(word => clean.includes(word))) return false;
  
  // Allow only standard English alphabets or Hindi script characters
  if (/^[a-zA-Z\s]+$/.test(name) || /^[\u0900-\u097F\s]+$/.test(name)) return true;
  return false;
}

// Inline keyboard button for high conversion
const bookingButton = {
  reply_markup: {
    inline_keyboard: [[{ text: "🌐 Website: Video Dekho & Slot Book Karo", url: "https://real-glow.vercel.app/" }]]
  }
};

bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userText = msg.text.trim();
  const textLower = userText.toLowerCase();

  // Fresh Start Protocol
  if (textLower === '/start') {
    userSessions[chatId] = { step: 'ASK_CITY', mode: 'PROFESSIONAL' };
    return bot.sendMessage(chatId, "Welcome to RealMeet Service. ✅️\n\n𝗪𝗵𝗶𝗰𝗵 𝗰𝗶𝘁𝘆/𝗔𝗿𝗲𝗮 𝗱𝗼 𝘆𝗼𝐮 𝘄𝗮𝗻𝘁 ?");
  }

  // Session safe initialisation
  if (!userSessions[chatId]) {
    userSessions[chatId] = { step: 'ASK_CITY', mode: 'PROFESSIONAL' };
  }

  const session = userSessions[chatId];

  // Dynamic Flirty Mode Activator (Only triggers if client uses these words first)
  if (textLower.includes('babu') || textLower.includes('baby') || textLower.includes('jaan') || textLower.includes('love') || textLower.includes('dear')) {
    session.mode = 'FLIRTY';
  }

  // Dynamic Tone Helpers based on current Mode
  const getSirOrBabu = () => (session.mode === 'FLIRTY' ? 'babu' : 'Sir');
  const getJaanOrSir = () => (session.mode === 'FLIRTY' ? 'jaan' : 'Sir');

  // ==================== GLOBAL CRISP OVERRIDES ====================

  // 1. Price Query
  if (textLower.includes('price') || textLower.includes('charge') || textLower.includes('rate') || textLower.includes('kitna') || textLower.includes('paisa')) {
    return bot.sendMessage(chatId, `Suno na ${getSirOrBabu()}, hamari 1 hour ki deal ₹1,500 se start hoti hai aur Full Night ka ₹6,999 hai. Har staff profile ka rate alag hota hai, isiliye aap website se call slot book kar lijiye, mam call par saari profiles aur exact price bata dengi. ✨`, bookingButton);
  }

  // 2. Photo/Profile Demand
  if (textLower.includes('pic') || textLower.includes('photo') || textLower.includes('profile') || textLower.includes('tum do') || textLower.includes('bhejo')) {
    return bot.sendMessage(chatId, `Sorry ${getSirOrBabu()}, privacy aur safety rules ki wajah se hum openly chat par profiles share nahi karte. 🥺 Aap website par ₹49 ka refundable call slot book kijiye, mam directly aapke WhatsApp par saari active profiles bhej dengi!`, bookingButton);
  }

  // ==================== OBJECTION HANDLING (SHORT & NATURAL) ====================
  if (textLower.includes('baar baar') || textLower.includes('same message') || textLower.includes('repeat') || textLower.includes('samjh nahi')) {
    return bot.sendMessage(chatId, `Sorry ${getSirOrBabu()}, main toh bas process ready kar rahi thi. Aap link par jaakar choti si video dekh lijiye, sab samajh aa jayega. 👍`, bookingButton);
  }

  if (textLower.includes('nahi krna') || textLower.includes('nahi karna') || textLower.includes('not interested') || textLower.includes('no')) {
    return bot.sendMessage(chatId, `Koi baat nahi ${getSirOrBabu()}, agar aapko premium service chahiye toh ek baar website check jarur kar lijiye. Pasand aaye toh hi book karna. ❤️`, bookingButton);
  }

  if (textLower.includes('free') || textLower.includes('bina paise')) {
    return bot.sendMessage(chatId, `${getSirOrBabu()} service premium hai toh free nahi ho payegi. Jo ₹49 call slot charge hai wo refundable hai, aapki final dealing me adjust ho jayega.`, bookingButton);
  }

  if (textLower.includes('fake') || textLower.includes('scam') || textLower.includes('fraud')) {
    return bot.sendMessage(chatId, `Arre nahi ${getSirOrBabu()}, 100% real service hai, isiliye website par video verification dali hai. Aap ek baar check karke khud dekh lijiye. 🥰`, bookingButton);
  }

  // ==================== ROADMAP FUNNEL STAGES ====================
  
  // STAGE 1: Check City
  if (session.step === 'ASK_CITY') {
    if (userText.length < 3 || textLower === 'hi' || textLower === 'hello' || textLower === 'hey' || textLower === 'ok') {
      return bot.sendMessage(chatId, "𝗪𝗵𝗶𝗰𝗵 𝗰𝗶𝘁𝘆/𝗔𝗿𝗲𝗮 𝗱𝗼 𝘆𝗼𝐮 𝘄𝗮𝗻𝘁 ? ✅️\n\n(Sahi area ya city ka naam likhiye)");
    }
    session.location = userText;
    session.step = 'ASK_VENUE';
    return bot.sendMessage(chatId, `Yes ${getSirOrBabu()}, aapke area "${userText}" me hamari service available hai! 😍 Hum Home Service aur Hotel Service dono provide karte hain. Aapko service kahan par chahiye, ghar par ya hotel par?`);
  }

  // STAGE 2: Ask Venue
  if (session.step === 'ASK_VENUE') {
    session.venue = userText;
    session.step = 'ASK_PREFERENCE';
    return bot.sendMessage(chatId, `Ok perfectly available hai. 👍 Aapko kis type ki girl chahiye aur kitni age group tak ki prefer karenge?`);
  }

  // STAGE 3: Ask Preference & Name Request
  if (session.step === 'ASK_PREFERENCE') {
    session.preference = userText;
    session.step = 'VERIFY_NAME';
    return bot.sendMessage(chatId, `Noted! Jaisa aapne bataya waisi profile arrange ho jayegi. Chat details save karne ke liye kya main aapka real name jaan sakti hoon? 😊`);
  }

  // STAGE 4: Name Verification & Pitch
  if (session.step === 'VERIFY_NAME') {
    if (!isValidRealName(userText)) {
      return bot.sendMessage(chatId, `Suno na, ye sahi human name nahi lag raha hai. Sahi processing ke liye please apna real name batao na? ❤️`);
    }
    session.name = userText;
    session.step = 'FINAL_CONVERSION';
    return bot.sendMessage(chatId, `Ok ${userText} ji, aapke area me premium female staff active hain. Agar aap profiles select karke booking complete karna chahte hain, toh is website se call slot book karke mam se call par baat kar lijiye. Mam call par saari details aur WhatsApp par profiles bhej dengi! 📲`, bookingButton);
  }

  // STAGE 5: Regular Dynamic Nudge
  return bot.sendMessage(chatId, `Suno ${session.name || 'Sir'}, saari profiles ready hain. Aap jaldi se website par jaakar video dekh lijiye aur ₹49 ka refundable slot book kijiye, fir seedha call connect ho jayegi! ✨`, bookingButton);
});
