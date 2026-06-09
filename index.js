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

app.get('/', (req, res) => res.send('Priya Ultimate Roadmap Engine Live!'));

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  try {
    await bot.setWebHook(`${url}/bot${token}`);
    console.log(`Webhook linked successfully.`);
  } catch (error) {
    console.error("Webhook error:", error);
  }
});

// Real-time state memory storage for users
const userSessions = {};

// Simple language check helper
function isEnglishText(text) {
  const englishKeywords = ['where', 'price', 'want', 'avail', 'hotel', 'home', 'name', 'show', 'send', 'pic', 'girl', 'rate', 'cost', 'how much'];
  return englishKeywords.some(word => text.toLowerCase().includes(word));
}

// Strict Real Name Checking Logic
function isValidName(name) {
  const invalidNames = ['bot', 'test', 'fake', 'abcd', 'admin', 'unknown', 'user', 'human', 'nobody', 'no', 'ok', 'yes', 'haa', 'hi', 'hello', 'pussy', 'sex', 'fuck'];
  const cleaned = name.trim().toLowerCase();
  if (cleaned.length < 2 || cleaned.length > 15) return false;
  if (invalidNames.includes(cleaned)) return false;
  // Check if name contains only alphabets (Hindi or English characters)
  if (/^[a-zA-Z\s]+$/.test(name) || /^[\u0900-\u097F\s]+$/.test(name)) return true;
  return false;
}

// Global Luxury Booking button template
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

  // Fresh Start Protocol
  if (textLower === '/start') {
    userSessions[chatId] = { step: 'ASK_CITY' };
    return bot.sendMessage(chatId, "𝗪𝗵𝗶𝗰𝗵 𝗰𝗶𝘁𝘆/𝗔𝗿𝗲𝗮 𝗱𝗼 𝘆𝗼𝘂 𝘄𝗮𝗻𝘁 ? ✅️");
  }

  // Session Initialize if empty
  if (!userSessions[chatId]) {
    userSessions[chatId] = { step: 'ASK_CITY' };
  }

  const session = userSessions[chatId];
  const isEng = isEnglishText(userText);

  // 1. GLOBAL OVERRIDE TRIGGER: If Client asks for Price/Rates at any time
  if (textLower.includes('price') || textLower.includes('charge') || textLower.includes('rate') || textLower.includes('kitna') || textLower.includes('paisa') || textLower.includes('rs')) {
    if (isEng) {
      return bot.sendMessage(chatId, "Listen honey, Khushi Mam will tell you everything on call because prices depend entirely on which specific profile you select. ❤️ If you insist, our basic deals start from Rs. 1,500 for 1 hour, Full Night packages are Rs. 6,999, and full day options are also available. Please book a call slot from the website so mam can explain properly!", bookingButton);
    } else {
      return bot.sendMessage(chatId, "Suno na jaan, mam batayegi saari details call par kyunki har ek profile aur staff ka alag-alag price hota hai babu, yeh poora depend karta hai aap konsi profile select karte ho. 🥰 Agar aap zidd kar rahe ho toh bata deti hu hamari deals waise sirf Rs. 1,500 se start hoti hain 1 hour ki, full night ka Rs. 6,999 hai aur day ka bhi package hai. Aap ek baar website se call slot book kar lijiye taki puri jankari mil sake aapko!", bookingButton);
    }
  }

  // 2. GLOBAL OVERRIDE TRIGGER: If Client demands Photos/Profiles from the bot directly
  if (textLower.includes('pic') || textLower.includes('photo') || textLower.includes('profile') || textLower.includes('tum do') || textLower.includes('bhejo')) {
    if (isEng) {
      return bot.sendMessage(chatId, "Baby, I receive more than 2000+ messages every single day! Due to high privacy and safety reasons, I cannot share anyone's personal pics or profiles openly here on chat. 🥺 If you are interested, please pay Rs. 49 to book a call slot on our website. Khushi Mam will call you and send all active verified profiles directly to your WhatsApp!", bookingButton);
    } else {
      return bot.sendMessage(chatId, "Mere paas din ke 2000+ messages aate hain jaan, main sabko kisi bhi privacy ke wajah se openly pic ya profile share nahi kar sakti babu. 🥺 Agar aap interested hain toh Rs. 49 pay karke call slot book kar lijiye, mam directly aapko call karke aapke WhatsApp par saari profiles bhej dengi aur baat karwa dengi!", bookingButton);
    }
  }

  // 3. ROADMAP FUNNEL EXECUTION STEP-BY-STEP
  
  // STEP 1: Ask and Check City/Location Existence
  if (session.step === 'ASK_CITY') {
    // Basic existence verification (Filter out junk or single letter clicks)
    if (userText.length < 3 || textLower === 'hi' || textLower === 'hello' || textLower === 'hey' || textLower === 'ok') {
      return bot.sendMessage(chatId, "𝗪𝗵𝗶𝗰𝗵 𝗰𝗶𝘁𝘆/𝗔𝗿𝗲𝗮 𝗱𝗼 𝘆𝗼𝘂 𝘄𝗮𝗻𝘁 ? ✅️\n\n(Please write your city or location name properly so I can check availability)");
    }
    
    session.location = userText;
    session.step = 'ASK_VENUE';
    
    if (isEng) {
      return bot.sendMessage(chatId, `Yes, let me check... Great news! Our service is 100% available in ${userText} right now. We provide both home service and hotel service. Where do you want the service, at your home or at a hotel? 😉`);
    } else {
      return bot.sendMessage(chatId, `Haan ji jaan, main check kar leti hu... Waah, aapke area aur location ${userText} me hamari service ekdam available hai! 😍 Hamare paas home service aur hotel service dono mil jayegi. Aapko service kahan pe chahiye, aapke ghar ya hotel pe? 😉`);
    }
    return;
  }

  // STEP 2: Ask for Venue (Home or Hotel)
  if (session.step === 'ASK_VENUE') {
    session.venue = userText;
    session.step = 'ASK_PREFERENCE';
    
    if (isEng) {
      return bot.sendMessage(chatId, "Ok perfect, available! What type of girl are you looking for, and how many years of age do you prefer? ❤️");
    } else {
      return bot.sendMessage(chatId, "Ok available hai! Aapko kis type ki girl chahiye aur kitni years ki honi chahiye? Mujhe batao ❤️");
    }
    return;
  }

  // STEP 3: Handle Preference & Ask Name
  if (session.step === 'ASK_PREFERENCE') {
    session.preference = userText;
    session.step = 'VERIFY_NAME';
    
    if (isEng) {
      return bot.sendMessage(chatId, "Ok honey, that's completely available! May I please know your name to continue this chat? 🥰");
    } else {
      return bot.sendMessage(chatId, "Ok available hai, jaisi aapko chahiye bilkul waisi mil jayegi! Kya main aapka name jaan sakti hu chat continue karne ke liye? 🥰");
    }
    return;
  }

  // STEP 4: Verify Real Name and Pitch the Call Slot Link
  if (session.step === 'VERIFY_NAME') {
    if (!isValidName(userText)) {
      if (isEng) {
        return bot.sendMessage(chatId, "Please tell me your real name dear, so I can confirm your location details properly! What is your real name? ❤️");
      } else {
        return bot.sendMessage(chatId, "Babu ye toh fake name lag rha hai, please apna real name ek baar confirm karwao na taaki chat save ho sake! Aapka sahi naam kya hai? ❤️");
      }
    }
    
    session.name = userText;
    session.step = 'FINAL_CONVERSION';
    
    if (isEng) {
      return bot.sendMessage(chatId, `Ok ${userText} dear! Look, we have amazing female staff and profiles available right now near your area. If you want to select a girl's profile, you can book a call slot from this website and talk to Khushi Mam directly. Mam will give you all details on the call, explain prices, and send profiles to your WhatsApp! 😘`, bookingButton);
    } else {
      return bot.sendMessage(chatId, `Ok ${userText} dekhiye hamare paas aapke area aur location pe service ekdam available hai. Agar aap female staff and girl ki profile select karna chahte ho, toh aap is website se call slot book karke mam se call pe baat kar sakte ho. Call pe puri details bata degi mam, price wagera bhi bata degi aur aapko profiles bhi bhej degi aapke WhatsApp pe! 😘`, bookingButton);
    }
    return;
  }

  // STEP 5: Continuous Retention / Payment Follow-up
  if (session.step === 'FINAL_CONVERSION') {
    if (isEng) {
      return bot.sendMessage(chatId, `Listen ${session.name || 'dear'}, everything is verified near your location. Just go to the website, watch the short video and pay Rs. 49 to secure your call slot. Let's do it fast! ❤️`, bookingButton);
    } else {
      return bot.sendMessage(chatId, `Suno na ${session.name || 'jaan'}, aapke location par saari profiles ready hain. Aap jaldi se website par jaakar video dekh lijiye aur ₹49 pay karke apna call slot book kar lijiye, fir direct call connect ho jayegi babu! ❤️`, bookingButton);
    }
    return;
  }

  // 4. SMART SYSTEM FALLBACK (If Bot doesn't understand user intent or gets stuck)
  if (isEng) {
    return bot.sendMessage(chatId, "Dear, if you didn't understand something, you can message our team directly at support ID: @RealMeetSupport for details. But if you book your call slot from the website right now, you will get the number instantly and can talk directly on call to discuss everything! ✨", bookingButton);
  } else {
    return bot.sendMessage(chatId, "Suno na jaan, agar aapko kuch samajh nahi aa raha toh aap is ID (@RealMeetSupport) pe message karke mam se iske bare me details le sakte ho. Lekin agar aap website se call slot book karte hai apna toh jaldi hi aapko number mil jayega aur aap seedha baat kr payenge call pe aur sab kuch discuss kar payenge! ✨", bookingButton);
  }
});
