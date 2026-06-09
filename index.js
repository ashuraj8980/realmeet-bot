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

app.get('/', (req, res) => res.send('Priya Zero-API Conversion Engine Live!'));

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  try {
    await bot.setWebHook(`${url}/bot${token}`);
    console.log(`Webhook linked successfully.`);
  } catch (error) {
    console.error("Webhook error:", error);
  }
});

// User sessions state tracker
const userSessions = {};

// Simple text detector for language type
function isEnglishText(text) {
  const englishKeywords = ['where', 'price', 'want', 'avail', 'hotel', 'home', 'name', 'show', 'send', 'pic', 'girl'];
  return englishKeywords.some(word => text.toLowerCase().includes(word));
}

// Fake/Invalid Name Checker logic
function isValidName(name) {
  const invalidNames = ['bot', 'test', 'fake', 'abcd', 'admin', 'unknown', 'pussy', 'sex', 'fuck', 'user', 'human', 'nobody', 'no'];
  const cleaned = name.trim().toLowerCase();
  if (cleaned.length < 2 || cleaned.length > 15) return false;
  if (invalidNames.includes(cleaned)) return false;
  if (/^[a-zA-Z\s]+$/.test(name) || /^[\u0900-\u097F\s]+$/.test(name)) return true;
  return false;
}

// Inline keyboard helper
const bookingButton = {
  reply_markup: {
    inline_keyboard: [[{ text: "🌐 Website par Video dekho & Book karo", url: "https://real-glow.vercel.app/" }]]
  }
};

bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userText = msg.text.trim();
  const textLower = userText.toLowerCase();

  // Initialize session if not exists
  if (!userSessions[chatId]) {
    userSessions[chatId] = { step: 'ASK_CITY' };
  }

  const session = userSessions[chatId];
  const isEng = isEnglishText(userText);

  // GLOBAL PUSH TRIPPERS: Price/Photos script handles anytime anywhere
  if (textLower.includes('price') || textLower.includes('charge') || textLower.includes('rate') || textLower.includes('kitna') || textLower.includes('paisa')) {
    if (isEng) {
      return bot.sendMessage(chatId, "Listen dear, our deals start from just Rs. 1,500 for 1 hour, Full night is around Rs. 6,999 and full day packages are also available. But every staff profile has a different rate depending on who you choose. ❤️ Please book your call slot from the website for Rs. 49, Khushi Mam will call you and explain everything with exact prices!", bookingButton);
    } else {
      return bot.sendMessage(chatId, "Suno na jaan, hamari deals sirf Rs. 1,500 se start ho jaati hain 1 hour ki, full night ka Rs. 6,999 hai aur day ka bhi package hai. Lekin ye charge sabka alag-alag hota hai babu, depend karta hai aap konsi profile select karte ho. 🥰 Aap ek baar website se call slot book kar lijiye taki mam aapko call par saari profiles aur unka exact price acche se samjha sakein!", bookingButton);
    }
  }

  if (textLower.includes('pic') || textLower.includes('photo') || textLower.includes('profile') || textLower.includes('tum do') || textLower.includes('bhejo')) {
    if (isEng) {
      return bot.sendMessage(chatId, "Baby, I receive 2000+ messages every day! Due to high privacy and safety rules, I cannot share girls' profiles openly here on chat. 🥺 If you are genuinely interested, just pay Rs. 49 to book a call slot on our website. Mam will send all active profiles directly to your WhatsApp! Only serious clients please.", bookingButton);
    } else {
      return bot.sendMessage(chatId, "Mere paas din ke 2000+ messages aate hain jaan, main sabko kisi bhi staff ki privacy ke wajah se openly pic ya profile share nahi kar sakti babu. 🥺 Agar aap sach me interested ho toh please website se ₹49 pay karke call slot book kar lijiye, mam directly aapke WhatsApp par saari profiles bhej dengi aur call par baat bhi karwa dengi! 😘", bookingButton);
    }
  }

  // STEP-BY-STEP FLOW CONTROLLER
  switch (session.step) {
    case 'ASK_CITY':
      session.step = 'CHECK_LOCATION';
      return bot.sendMessage(chatId, "𝗪𝗵𝗶𝗰𝗵 𝗰𝗶𝘁𝘆/𝗔𝗿𝗲𝗮 𝗱𝗼 𝘆𝗼𝘂 𝘄𝗮𝗻𝘁 ? ✅️");

    case 'CHECK_LOCATION':
      // Basic check if input is too short to be a real location
      if (userText.length < 3) {
        return bot.sendMessage(chatId, isEng ? "Please enter a valid city or area name dear! 😊" : "Jaan, please sahi se apne City ya Area ka naam batao na! 😊");
      }
      session.location = userText;
      session.step = 'ASK_VENUE';
      if (isEng) {
        return bot.sendMessage(chatId, `Yes baby, our services are 100% available in ${userText}! We provide both Home Service and Premium Hotel Service. Where do you want the service, at your home or a hotel? 😉`);
      } else {
        return bot.sendMessage(chatId, `Haan ji jaan, aapke area ${userText} me hamari service 100% available hai! 😍 Hamare paas Home Service aur Premium Hotel Service dono mil jayegi. Aapko service kahan par chahiye babu—aapke ghar par ya hotel par? 😉`);
      }

    case 'ASK_VENUE':
      session.venue = userText;
      session.step = 'ASK_PREFERENCE';
      if (isEng) {
        return bot.sendMessage(chatId, "Ok dear, available! What type of girl are you looking for, and what age group do you prefer? ❤️");
      } else {
        return bot.sendMessage(chatId, "Ok jaan, done! Aapko kis type ki girl chahiye aur kitne years tak ki age honi chahiye? Mujhe batao ek baar ❤️");
      }

    case 'ASK_PREFERENCE':
      session.preference = userText;
      session.step = 'VERIFY_NAME';
      if (isEng) {
        return bot.sendMessage(chatId, "Perfect, everything you want is available! May I please know your name to continue this chat? 🥰");
      } else {
        return bot.sendMessage(chatId, "Aww ok jaan, ekdam perfect! Jaisa aapne bola waisi girl available ho jayegi. Kya main aapka pyaara sa naam jaan sakti hu chat continue karne ke liye? 🥰");
      }

    case 'VERIFY_NAME':
      if (!isValidName(userText)) {
        if (isEng) {
          return bot.sendMessage(chatId, "Please tell me your real name dear, so I can save your booking details correctly! ❤️ What is your name?");
        } else {
          return bot.sendMessage(chatId, "Babu please apna real naam batao na, taaki main aapki booking entry sahi se ready kar saku! ❤️ Aapka naam kya hai?");
        }
      }
      session.name = userText;
      session.step = 'FINAL_CONVERSION';
      if (isEng) {
        return bot.sendMessage(chatId, `Ok ${userText} dear! Listen, we have amazing premium female staff available right now near your location. If you want to view profiles and select a girl, please go to our website and book a call slot. Khushi Mam will call you instantly, discuss all details, prices, and send active profiles directly to your WhatsApp! Click below to secure your slot. 😘`, bookingButton);
      } else {
        return bot.sendMessage(chatId, `Ok ${userText} ji, dekhiye hamare paas aapke area aur location pe premium female staff ekdam available hain. Agar aap unki profiles aur photos select karna chahte ho jaan, toh aap is website se call slot book karke Khushi mam se direct call pe baat kar sakte ho! Mam call pe saari details, price wagera sab samjha dengi aur aapke WhatsApp par live profiles bhi bhej dengi! 😘`, bookingButton);
      }

    case 'FINAL_CONVERSION':
      // Persistent nudge once they finish the funnel
      if (isEng) {
        return bot.sendMessage(chatId, `Dear ${session.name || 'babu'}, everything is set! Just click the link below, watch the short video guide and complete your refundable Rs. 49 call slot booking. Let's start the processing fast! ❤️`, bookingButton);
      } else {
        return bot.sendMessage(chatId, `Jaan ${session.name || 'babu'}, baaki sab set hai! Aap jaldi se niche diye link par jaakar choti si video dekh lo aur apna Rs. 49 ka call slot lock karo, fir seedha Khushi Mam ka call aayega aur direct profile transfer ho jayegi! Der mat karo babu. ❤️`, bookingButton);
      }

    default:
      // Fallback fallback if user sends something completely random that bot doesn't get
      if (isEng) {
        return bot.sendMessage(chatId, "Honey, if you want any details or face issues, you can message Khushi Mam directly at support ID: @RealMeetSupport. But if you book your call slot from the website right now, you will get the priority number instantly to talk directly call! Click link below. ✨", bookingButton);
      } else {
        return bot.sendMessage(chatId, "Suno na jaan, agar aapko kuch samajh nahi aa raha toh aap hamari team ko is ID par message karke details le sakte ho: @RealMeetSupport. Lekin agar aap website se call slot book karte ho apna, toh bohot jaldi aapko number mil jayega aur aap seedha call par sab kuch discuss kar paoge babu! Ek baar try karo link niche hai. ✨", bookingButton);
      }
  }
});
      
