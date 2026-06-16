import asyncio
import os
import random
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from aiohttp import web

# --- CONFIGURATION ---
API_ID = 39946962
API_HASH = '509f0cca77abf971e3e8040d8b05bb05'

SESSION_STRING = (
    "1BVtsOLQBuzHv6VySAq9aMGMkgO2OSJFIiO_5r9Dq8BUNJEumZSWLznDeYZGocq3u2RZOybv_"
    "-xivfQczSSp_IPII4EzyzpC3J3Rk5TN6J9-kBvTWoZQyLi0GR_e0behWJ1qyskGaaq5f-ye8U"
    "M_q83cTA7Qi_S3SzhFykChaW0MQd6IosKss5-U976NH3oljKysZfDviY6FEK3uH-1kNSO3jOK"
    "52SMxhtVgjfS_OfQtzokdVer4ByDvwYY_oaOhkXSlpyq783UTkwqZiWOPMLvYKasaTAJEok1w"
    "JDFa2uc4KboVjQs__kVIg2eDgL5j24KzGLdgDTqwu1qQOcdnQcgCuHmdUbdM="
)

if SESSION_STRING and not SESSION_STRING.startswith('1'):
    SESSION_STRING = '1' + SESSION_STRING

client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

# In-memory user database
user_db = {}

def get_user_status(user_id):
    if user_id not in user_db:
        user_db[user_id] = {
            'step': 0, 
            'paused': False, 
            'last_msg_id': 0
        }
    return user_db[user_id]

async def send_human_reply(event, text, delay=3):
    """Simulates real human typing and sends a reply by quoting the user's message"""
    try:
        # Message ki lambai ke hisab se typing delay natural lagega
        typing_time = max(2, min(delay, len(text) // 15))
        async with client.action(event.chat_id, 'typing'):
            await asyncio.sleep(typing_time)
        
        # Double check if user hasn't paused the bot while typing
        status = get_user_status(event.sender_id)
        if not status['paused']:
            await event.reply(text)
    except Exception as e:
        print(f"Error sending message: {e}")

@client.on(events.NewMessage(incoming=True))
async def handle_incoming_messages(event):
    if not event.is_private:
        return
        
    user_id = event.sender_id
    me = await client.get_me()
    if user_id == me.id:
        return

    status = get_user_status(user_id)
    if status['paused']:
        return

    # Duplicate messages or spam requests protection
    if event.id <= status['last_msg_id']:
        return
    status['last_msg_id'] = event.id

    msg = event.raw_text.strip().lower()

    # --- 1. SMART PAYMENT DETECTION ---
    if any(keyword in msg for keyword in ["pay", "paid", "payment", "done", "screenshot", "bheja", "bhej diya"]):
        await send_human_reply(
            event, 
            "Theek hai sir, payment check kiya ja raha hai. ✅ Aap jaldi se humari official website par login karke apna slot confirm kijiye, wahan se aapko direct number mil jayega."
        )
        return

    # --- 2. CONVERSATIONAL STEP-BY-STEP FLOW ---
    
    # Step 0: Greeting (Handling Greetings or Random First Messages)
    if status['step'] == 0:
        status['step'] = 1
        if any(greet in msg for greet in ["hi", "hello", "hey", "hii", "helo"]):
            await send_human_reply(event, "Hello sir! 😊 Kaise hain aap? Hamari real meet service har city me available hai.")
        else:
            await send_human_reply(event, "Hello sir! 😊 Yes, real meet service available hai. Aap kis city ya area se baat kar rahe hain?")
        return

    # Step 1: Handling City & Asking to Move to Website
    elif status['step'] == 1:
        status['step'] = 2
        convince_msg = (
            "Understood sir! Hamari official female staff aur safe profiles usi area me available hain.\n\n"
            "Aap jaldi se hamari official website par visit kijiye. Wahan par mam se direct call connect karne ke liye "
            "sirf 49rs ka minimum booking slot charge rakha gaya hai, taaki timepass wale log call na karein. 👍\n\n"
            "Aap jaise hi slot confirm karenge, mam aapse direct call par baat karke models ki profiles aapke WhatsApp par selection ke liye bhej dengi.\n\n"
            "🔗 Official Website Link: https://real-glow.vercel.app"
        )
        await send_human_reply(event, convince_msg, delay=5)
        # Background automatic follow-up trigger after 8 minutes
        asyncio.create_task(send_followup(event.chat_id, user_id))
        return

    # Step 2+: Fallback / Gentle Reminder to complete booking
    elif status['step'] >= 2:
        reminder_msg = (
            "Sir, genuine and premium service ke liye aapko website par jake hi connect karna hoga. "
            "Sirf 49rs ka charge hai jo bilkul nominal hai. Wahan slot confirm karte hi aapko mam ka support mil jayega aur doorstep verification complete ho jayegi.\n\n"
            "Abhi open kijiye aur call book kijiye: https://real-glow.vercel.app"
        )
        await send_human_reply(event, reminder_msg, delay=4)

async def send_followup(chat_id, user_id):
    """Sends a smart follow-up if the user goes silent after getting the link"""
    await asyncio.sleep(480) # 8 Minutes wait time
    if user_id in user_db:
        status = user_db[user_id]
        if status['step'] == 2 and not status['paused']:
            followup_pitch = (
                "Sir, kya mam se baat ho payi aapki? Profiles WhatsApp par mil gayi?\n\n"
                "Agar abhi tak nahi kiya, toh website par jake 49rs ka slot book kar lijiye, "
                "girls abhi available hain booking ke liye: https://real-glow.vercel.app"
            )
            try:
                await client.send_message(chat_id, followup_pitch)
            except Exception:
                pass

@client.on(events.NewMessage(outgoing=True))
async def handle_outgoing_messages(event):
    """If you send a manual message to the client, the bot will immediately pause for that user"""
    if not event.is_private:
        return
    user_id = event.chat_id
    if user_id in user_db:
        user_db[user_id]['paused'] = True

# --- RENDER KEEPALIVE WEB SERVER ---
async def home_handle(request):
    return web.Response(text="RealMeet Smart Userbot is 100% active and running!")

async def start_web_server():
    app = web.Application()
    app.router.add_get('/', home_handle)
    port = int(os.environ.get("PORT", 8080))
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()

async def main():
    print("Starting KeepAlive Web Server...")
    await start_web_server()
    print("Connecting Telegram Client...")
    await client.start()
    print("RealMeet Anti-Spam Userbot Is Running Safely on Render!")
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
    
