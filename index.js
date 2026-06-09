require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = process.env.BOT_TOKEN;
const url = process.env.RENDER_EXTERNAL_URL || 'https://realmeet-bot-1.onrender.com';

const bot = new TelegramBot(token, { polling: false });
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (react, res) => res.send('RealMeet Premium Professional Engine Live'));

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  try {
    await bot.setWebHook(`${url}/bot${token}`);
    console.log(`Webhook linked successfully.`);
  } catch (error) {
    console.error("Webhook error:", error);
  }
});

// User sessions state
const userSessions = {};

// Helper function to simulate natural human typing delay
const sendDelayedMessage = (chatId, text, options = {}, delay = 1500) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        await bot.sendChatAction(chatId, 'typing');
        setTimeout(async () => {
          const msg = await bot.sendMessage(chatId, text, options);
          resolve(msg);
        }, 1000);
      } catch (err) {
        console.error("Error sending message:", err);
        resolve(null);
      }
    }, delay);
  });
};

// Strict Validator for Human Names
function isRealName(name) {
  const clean = name.trim().toLowerCase();
  const junk = ['bot', 'test', 'fake', 'abcd', 'admin', 'unknown', 'user', 'human', 'nobody', 'no', 'ok', 'yes', 'haa', 'hi', 'hello', 'what', 'boring', 'gawar', 'english', 'service', 'hotel', 'home'];
  if (clean.length < 2 || clean.length > 15) return false;
  if (junk.some(word => clean.includes(word))) return false;
  return /^[a-zA-Z\s]+$/.test(name) || /^[\u0900-\u097F\s]+$/.test(name);
}

// Strict Validator for Real Cities/Locations
function isRealLocation(loc) {
  const clean = loc.trim().toLowerCase();
  const junkSentences = ['boring', 'gawar', 'english', 'discuss', 'hi', 'hello', 'hey', 'what', 'service', 'kya', 'btao', 'suno', 'ok', 'yes', 'no'];
  if (clean.length < 3 || clean.length > 20) return false;
  if (junkSentences.some(word => clean.includes(word))) return false;
  return true;
}

// Global Clean Booking Button
const webButton = {
  reply_markup: {
    inline_keyboard: [[{ text: "🌐 Open Official Website", url: "https://real-glow.vercel.app/" }]]
  }
};

bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userText = msg.text.trim();
  const textLower = userText.toLowerCase();

  // Fresh Premium Entry
  if (textLower === '/start') {
    userSessions[chatId] = { step: 'ASK_CITY' };
    await sendDelayedMessage(chatId, "Welcome to RealMeet Premium Service Support.", {}, 200);
    await sendDelayedMessage(chatId, "Sir, please enter your current City or Area to check real-time availability.", {}, 1200);
    return;
  }

  if (!userSessions[chatId]) {
    userSessions[chatId] = { step: 'ASK_CITY' };
  }

  const session = userSessions[chatId];

  // ==================== GLOBAL CRISP & PROFESSIONAL OVERRIDES ====================
  if (textLower.includes('price') || textLower.includes('charge') || textLower.includes('rate') || textLower.includes('kitna') || textLower.includes('paisa')) {
    await sendDelayedMessage(chatId, "Sir, our executive rates start from 1,500/hr up to 6,999 for full-night operations.", {}, 500);
    await sendDelayedMessage(chatId, "Exact commercial details depend on the profile selection. Please schedule a call slot via our website for complete breakdown.", webButton, 1200);
    return;
  }

  if (textLower.includes('pic') || textLower.includes('photo') || textLower.includes('profile') || textLower.includes('bhejo')) {
    await sendDelayedMessage(chatId, "Due to strict privacy and safety regulations, profiles cannot be shared openly on public chat platforms.", {}, 500);
    await sendDelayedMessage(chatId, "Kindly secure your slot on the portal. Our manager will verify and share active catalogs directly on your registered WhatsApp.", webButton, 1200);
    return;
  }

  // ==================== FUNNEL OPERATIONS ====================

  // STAGE 1: Check City
  if (session.step === 'ASK_CITY') {
    if (!isRealLocation(userText)) {
      return await sendDelayedMessage(chatId, "Sir, please provide a valid city or operational area name to proceed.", {}, 500);
    }
    session.location = userText;
    session.step = 'ASK_VENUE';

    await sendDelayedMessage(chatId, `Checking database for ${userText}...`, {}, 400);
    await sendDelayedMessage(chatId, "Yes Sir, our verified models and premium staff are available in your location.", {}, 1500);
    await sendDelayedMessage(chatId, "Do you require Home Service or Hotel Service?", {}, 1200);
    return;
  }

  // STAGE 2: Venue Allocation
  if (session.step === 'ASK_VENUE') {
    session.venue = userText;
    session.step = 'ASK_PREFERENCE';
    await sendDelayedMessage(chatId, "Understood. Please specify your age preference or any specific requirements regarding the profile.", {}, 500);
    return;
  }

  // STAGE 3: Preference & Name Acquisition
  if (session.step === 'ASK_PREFERENCE') {
    session.preference = userText;
    session.step = 'VERIFY_NAME';
    await sendDelayedMessage(chatId, "Noted, Sir. To save this session configurations, may I please know your official name?", {}, 500);
    return;
  }

  // STAGE 4: Strict Verification & Splitting 3 Messages
  if (session.step === 'VERIFY_NAME') {
    if (!isRealName(userText)) {
      return await sendDelayedMessage(chatId, "Sir, please confirm your actual human name to secure the configuration log.", {}, 500);
    }
    session.name = userText;
    session.step = 'CONVERSION';

    // 3 SPLITTED HUMAN-LIKE MESSAGES
    await sendDelayedMessage(chatId, `Thank you, Mr. ${userText}. Your location validation is successful.`, {}, 500);
    await sendDelayedMessage(chatId, "For live video verification, exact profile selections, and final logistics, you need to book a confirmed call slot.", {}, 1500);
    await sendDelayedMessage(chatId, "Kindly open the official link below, watch the short brief and book your slot. Our manager Khushi Mam will call you instantly.", webButton, 1500);
    return;
  }

  // STAGE 5: Regular Nudge
  await sendDelayedMessage(chatId, `Sir, your session for location "${session.location || 'Current Location'}" is active.`, {}, 500);
  await sendDelayedMessage(chatId, "Complete your registration on the website to instantly route your call to the executive desk.", webButton, 1500);
});
