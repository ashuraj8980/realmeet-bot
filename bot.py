import asyncio
import os
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
    "52SMhtVgjfS_OfQtzokdVer4ByDvwYY_oaOhkXSlpyq783UTkwqZiWOPMLvYKasaTAJEok1w"
    "JDFa2uc4KboVjQs__kVIg2eDgL5j24KzGLdgDTqwu1qQOcdnQcgCuHmdUbdM="
)

if SESSION_STRING and not SESSION_STRING.startswith('1'):
    SESSION_STRING = '1' + SESSION_STRING

client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

# Complex state tracking for smart auto-resume feature
user_db = {}

def get_user_status(user_id):
    if user_id not in user_db:
        user_db[user_id] = {
            'step': 0, 
            'paused': False, 
            'unanswered_count': 0, 
            'last_msg_id': 0
        }
    return user_db[user_id]

async def send_human_reply(event, text, delay=3):
    """Simulates realistic human typing and replies directly to the message"""
    try:
        async with client.action(event.chat_id, 'typing'):
            await asyncio.sleep(delay)
        
        status = get_user_status(event.sender_id)
        # Sahi condition: check if not paused OR if it's auto-resuming
        if not status['paused']:
            await event.reply(text)
    except Exception as e:
        print(f"Reply Error: {e}")

@client.on(events.NewMessage(incoming=True))
async def handle_incoming_messages(event):
    if not event.is_private:
        return
        
    user_id = event.sender_id
    me = await client.get_me()
    if user_id == me.id:
        return

    status = get_user_status(user_id)

    # Protection against double-triggering or spam
    if event.id <= status['last_msg_id']:
        return
    status['last_msg_id'] = event.id

    msg = event.raw_text.strip().lower()

    # --- AUTO-RESUME LOGIC ---
    if status['paused']:
        status['unanswered_count'] += 1
        # Agar aapne chat handle ki thi par ab customer ne 2-3 baar extra text bhej diya bina aapke reply ke
        if status['unanswered_count'] >= 2:
            status['paused'] = False  # Bot wapas active ho gaya
            status['unanswered_count'] = 0
        else:
            return  # Jab tak 2 messages nahi hote, bot silent rahega

    # --- 1. SMART PAYMENT DETECTION ---
    if any(k in msg for k in ["pay", "paid", "payment", "done", "screenshot", "bheja", "bhej diya"]):
        await send_human_reply(event, "Theek hai sir, check kiya ja raha hai. ✅ Aap jaldi se website par login karke apna slot confirm kijiye, wahan se call details aur number mil jayega.")
        return

    # --- 2. CONVERSATIONAL FLOW ---
    
    # Step 0: Greeting handling
    if status['step'] == 0:
        status['step'] = 1
        await send_human_reply(event, "Hello sir! 😊 Yes, real meet service available hai. Aap kis city ya area se hain?")
        return

    # Step 1: Handling City & Convincing to visit website
    elif status['step'] == 1:
        status['step'] = 2
        convince_pitch = (
            "Ok sir, hamari female staff aur safe profiles aapke area me available hain. 👍\n\n"
            "Aap jaldi se hamari website par jake mam ko call connect karne ke liye sirf 49rs ka slot book kar lijiye. "
            "Ye charge isliye hai taaki timepass wale call na karein.\n\n"
            "Slot confirm karte hi mam direct call par baat karke models ki profiles aapke WhatsApp par bhej dengi.\n\n"
            "🌐 Website: https://real-glow.vercel.app"
        )
        await send_human_reply(event, convince_pitch, delay=4)
        asyncio.create_task(send_followup(event.chat_id, user_id))
        return

    # Step 2: Continuous smart reminder
    elif status['step'] >= 2:
        await send_human_reply(
            event, 
            "Sir, genuine service ke liye website par jake 49rs ka booking slot lijiye. Tabhi mam direct baat kar payengi aur WhatsApp par profile share karengi: https://real-glow.vercel.app"
        )

async def send_followup(chat_id, user_id):
    """Smart Follow-up loop if user goes inactive"""
    await asyncio.sleep(450) # 7.5 minutes wait
    if user_id in user_db:
        status = user_db[user_id]
        if status['step'] == 2 and not status['paused']:
            try:
                await client.send_message(
                    chat_id, 
                    "Sir, kya mam se baat hui aapki? Website se 49rs ka slot book karke jaldi call confirm kar lijiye, staff abhi available hai: https://real-glow.vercel.app"
                )
            except Exception:
                pass

@client.on(events.NewMessage(outgoing=True))
async def handle_outgoing_messages(event):
    """Jab aap khud type karenge, bot pause ho jayega aur unanswered counter reset ho jayega"""
    if not event.is_private:
        return
    user_id = event.chat_id
    if user_id in user_db:
        user_db[user_id]['paused'] = True
        user_db[user_id]['unanswered_count'] = 0  # Reset counter since you replied

# --- WEB SERVER FOR RENDER FREE KEEPALIVE ---
async def home_handle(request):
    return web.Response(text="Bot is running smartly 24/7 with Auto-Resume logic!")

async def start_web_server():
    app = web.Application()
    app.router.add_get('/', home_handle)
    await web.TCPSite(web.AppRunner(app), '0.0.0.0', int(os.environ.get("PORT", 8080))).start()

async def main():
    await start_web_server()
    await client.start()
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
    
