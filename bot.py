import asyncio
import os
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from aiohttp import web

# --- CONFIGURATION ---
API_ID = 39946962
API_HASH = '509f0cca77abf971e3e8040d8b05bb05'

# Solid token string inside the code
SESSION_STRING = "1BVtsOLQBuzHv6VySAq9aMGMkgO2OSJFIiO_5r9Dq8BUNJEumZSWLznDeYZGocq3u2RZOybv_-xivfQczSSp_IPII4EzyzpC3J3Rk5TN6J9-kBvTWoZQyLi0GR_e0behWJ1qyskGaaq5f-ye8UM_q83cTA7Qi_S3SzhFykChaW0MQd6IosKss5-U976NH3oljKysZfDviY6FEK3uH-1kNSO3jOK52SMhtVgjfS_OfQtzokdVer4ByDvwYY_oaOhkXSlpyq783UTkwqZiWOPMLvYKasaTAJEok1wJDFa2uc4KboVjQs__kVIg2eDgL5j24KzGLdgDTqwu1qQOcdnQcgCuHmdUbdM="

if SESSION_STRING and not SESSION_STRING.startswith('1'):
    SESSION_STRING = '1' + SESSION_STRING

client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

# Tracking state storage
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
    """Simulates typing behavior and slides/replies to the text explicitly"""
    try:
        async with client.action(event.chat_id, 'typing'):
            await asyncio.sleep(delay)
        
        status = get_user_status(event.sender_id)
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

    if event.id <= status['last_msg_id']:
        return
    status['last_msg_id'] = event.id

    msg = event.raw_text.strip().lower()

    # --- AUTO-RESUME LOGIC ---
    if status['paused']:
        status['unanswered_count'] += 1
        # If user texts 2 or more times while you are away, bot handles it
        if status['unanswered_count'] >= 2:
            status['paused'] = False  
            status['unanswered_count'] = 0
        else:
            return  

    # --- 1. SMART PAYMENT DETECTION ---
    if any(k in msg for k in ["pay", "paid", "payment", "done", "screenshot", "bheja", "bhej diya"]):
        await send_human_reply(event, "Theek hai sir, check kiya ja raha hai. ✅ Aap jaldi se website par login karke apna slot confirm kijiye, wahan se call details aur number mil jayega.")
        return

    # --- 2. STEP FLOW ---
    
    # Step 0: Greeting handling
    if status['step'] == 0:
        status['step'] = 1
        await send_human_reply(event, "Hello sir! 😊 Yes, real meet service available hai. Aap kis city ya area se hain?")
        return

    # Step 1: Handling City & Convincing
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

    # Step 2: Reminder handling
    elif status['step'] >= 2:
        await send_human_reply(
            event, 
            "Sir, genuine service ke liye website par jake 49rs ka booking slot lijiye. Tabhi mam direct baat kar payengi aur WhatsApp par profile share karengi: https://real-glow.vercel.app"
        )

async def send_followup(chat_id, user_id):
    """Automatic background follow up after 7.5 mins"""
    await asyncio.sleep(450) 
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
    """When you type from your app, bot pauses and unanswered counter resets"""
    if not event.is_private:
        return
    user_id = event.chat_id
    if user_id in user_db:
        user_db[user_id]['paused'] = True
        user_db[user_id]['unanswered_count'] = 0  

# --- FIXED KEEPALIVE WEB SERVER OPERATION ---
async def home_handle(request):
    return web.Response(text="Bot is running smoothly 24/7 with fixed site runner!")

async def start_web_server():
    app = web.Application()
    app.router.add_get('/', home_handle)
    
    # Proper sequence to prevent 'runner.setup()' runtime error
    runner = web.AppRunner(app)
    await runner.setup()
    
    port = int(os.environ.get("PORT", 8080))
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()

async def main():
    await start_web_server()
    await client.start()
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
    
