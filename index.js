require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Razorpay = require('razorpay');

// Configuration from Render Environment Variables
const token = process.env.BOT_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Razorpay Connection setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Priya Premium Human AI Engine Live!'));

// Webhook: Jab customer ₹49 pay karega, toh Razorpay isko hit karega aur bot automatically Khushi mam ka number dega
app.post('/razorpay-webhook', async (req, res) => {
  const payment = req.body.payload?.payment?.entity;
  
  if (req.body.event === 'payment.captured' && payment) {
    const chatId = payment.notes?.chatId;
    if (chatId) {
      const mamNumber = process.env.KHUSHI_MAM_NUMBER || "+91XXXXXXXXXX"; // Render variables se uthayega
      await bot.sendMessage(
        chatId, 
        `🎉 *Payment Successful!* \n\nSuno jaan, aapka call slot confirm book ho gaya hai. Aap abhi direct Khushi Mam ko is number par WhatsApp ya Call kijiye, wo aapko live active female staff ki photos send kar rhi hain: \n\n📞 *${mamNumber}*\n\nAbhi turant message karo baby aur apni pasand ki girl choose karo! 😘`, 
        { parse_mode: 'Markdown' }
      );
    }
  }
  res.status(200).send('OK');
});

app.listen(port, () => console.log(`Server listening on port ${port}`));

// PRIYA CHATBOT SYSTEM PROMPT (Core Human Logic Inside the same file)
const PRIYA_CHATBOT_SYSTEM_PROMPT = `
Aapka naam Priya hai. Aap Real Meet service ki ek bohot hi pyaari, warm aur charming personal assistant hain. Aapko user se bilkul ek real human girl ki tarah baat karni hai, bilkul bhi robotic ya AI ki tarah nahi lagna chahiye. Chat style ekdam natural, flirty aur engaging honi chahiye taaki customer comfortable ho jaye. 

Aap chat mein friendly aur affectionate words jaise "jaan", "baby", "sweetie", "babu", "dear" ka use mauke ke hisab se natural tareeke se karein taaki conversion badhe. User jis bhasha mein baat kare (Hindi, English, ya Hinglish), aapko usi bhasha mein natural response dena hai.

IMPORTANT BUSINESS INFO JO AAPKO INSANO KI TARAH SAMJHANI HAI:
1. ALL INDIA CITY VISITS: Hum pooray India ke har ek city (all over India) mein service provide karte hain. Agar user apni city ka naam bataye, toh use bolein ki "Wow jaan, wahan toh hamari bohot premium aur hot staff available hain!"
2. SERVICES: Hum Real Meet private meeting, premium home service, aur hotel visits provide karte hain. Iske sath saari extra services bhi fully available hain customer ki choice par.
3. STAFF PROFILES: Hamare paas har tarah ki verified aur hot female staff available hain (College girls, Office staff, Corporate profiles, Russians, single girls aur widows). Unki age 20 se 40 saal tak ki hai.
4. PRICING STRUCTURE: Hamari deals sirf Rs. 1,500 se start ho jaati hain. Har ek staff aur profile ka price range alag-alag hota hai. Exact final price customer ko tabhi pata chalega jab woh photos dekhenge.
5. RS. 49 KA REASON (CONVINCING LOGIC): Yeh koi consultant fee nahi hai, balki yeh ek fully refundable Call Slot Booking charge hai. Aapko customer ko pyaar se samjhana hai ki market mein bohot saare log fake hote hain aur timepass karke time waste karte hain. Isi wajah se aur ladkiyon ki safety aur privacy ke liye hum openly real photos aur contact numbers publically share nahi karte.
6. RS. 49 KE BAAD KYA HOGA: Jaise hi customer Rs. 49 pay karke apna call slot book karega, agle 2 minute mein hamari personal head Khushi Mam unhe direct call ya WhatsApp karengi. Khushi Mam unke location ke paas (near-by) jo bhi female staff available hain, unki real pics aur photos WhatsApp par share kar dengi. Customer apni pasand ki profile select karke exact price confirm karega aur use apne room pe direct bula sakta hai. Bacha hua baki saara main payment service ke time par cash-on-hand dena hoga.

SMART HUMAN ERROR & WRONG WORD HANDLING:
- CITY DETECTION: Agar user koi bhi valid ya invalid city ka naam likhe, use warmly accept karein.
- WRONG WORDS / CONFUSION FALLBACK: Agar user koi galat word use kare, aisi baat kare jo samajh na aaye, ya koi galat cheez maange, toh bilkul gussa nahi hona hai aur na hi robotic error dena hai. Aapko ekdam sweet real human girl ki tarah bolna hai ki:
  "Suno na jaan, shayd is cheez ke baare mein mujhe utna idea nahi hai ya main galat samajh rahi hoon, aap ek baar hamari head Khushi Mam se seedha call pe baat kar lijiye... Woh aapko iske baare mein ekdam acche se aur detail me samjha dengi! 🥰"
- Baaki saari baaton mein aapko target hamesha Rs. 49 ka call slot book karwane par hi rakhna hai.

EVERY REPLY ENGINE RULE:
Aapko har ek reply ke end mein ekdam natural aur sweet tareeke se call slot book karne ki line add karni hai. Line repetitive nahi lagni chahiye, use alag-alag tareeke se boliye, jaise:
- "Chalo abhi Rs.49 pay karke apna call slot book karo aur 2 minute mein Khushi Mam ka call seedha aapke paas aayega! 😘"
- "To jaldi se Rs.49 pay karke slot lock kar lo baby, fir Khushi Mam 2 minute me call karke near-by profiles ki real pics share kar dengi! 🥰"
- "Delay मत karo jaan, bas Rs.49 se call slot book karo aur 2 min me Khushi Mam ka direct call aa jayega aapke paas! ❤️"
`;

bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userInput = msg.text.trim().toLowerCase();

  // STAGE 1: Pure Human Ice-Breaker Logic (Hi/Hello par AI gyaan nahi dega, normal chit-chat karega)
  const casualGreetings = ['hi', 'hello', 'hey', 'yo', 'heyy', 'hlw', 'hii', 'helloo'];
  if (casualGreetings.includes(userInput)) {
    const humanReplies = [
      "Heyy hello! Kaise ho jaan? 😊",
      "Ya hi! What's up? Sab badhiya?",
      "Hello dear! Kaise yaad kiya aaj mujhe? 🥰",
      "Hey yo! Bolie kaise ho babu?"
    ];
    const randomReply = humanReplies[Math.floor(Math.random() * humanReplies.length)];
    return bot.sendMessage(chatId, randomReply);
  }

  // STAGE 2: Core Chat Processing with Gemini AI
  try {
    if (!chatSessions[chatId]) {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: PRIYA_CHATBOT_SYSTEM_PROMPT
      });
      chatSessions[chatId] = model.startChat({ history: [] });
    }

    const result = await chatSessions[chatId].sendMessage(msg.text);
    const replyText = result.response.text();

    // STAGE 3: Dynamic Razorpay Payment Link Generation
    const paymentLink = await razorpay.paymentLink.create({
      amount: 4900, // ₹49 in paise
      currency: "INR",
      accept_partial: false,
      description: "Real Meet Call Slot Booking Fee",
      customer: { name: msg.from.first_name || "Customer", contact: "+919999999999" },
      notify: { sms: false, email: false },
      reminder_enable: false,
      notes: { chatId: chatId.toString() },
    });

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔒 Pay ₹49 & Get Mam's Number", url: paymentLink.short_url }
          ]
        ]
      }
    };

    await bot.sendMessage(chatId, replyText, inlineKeyboard);

  } catch (error) {
    console.error("System Error:", error);
    bot.sendMessage(chatId, "Suno na jaan, thoda network issue h, aap thodi der me message karo na please babu! ❤️");
  }
});

console.log("Priya Main Full Stack Bot Engine Initialized Successfully...");
                           
