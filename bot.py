import asyncio
import time
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

user_db = {}

def get_user_status(user_id):
    if user_id not in user_db:
        user_db[user_id] = {'step': 0, 'last_msg': '', 'paused': False, 'last_processed_msg_id': 0}
    return user_db[user_id]

async def smart_reply(event, text, delay=3):
    try:
        async with client.action(event.chat_id, 'typing'):
            await asyncio.sleep(delay)
        if not get_user_status(event.sender_id)['paused']:
            await event.reply(text)
    except Exception:
        pass

@client.on(events.NewMessage(incoming=True))
async def handle_messages(event):
    if not event.is_private: return
    user_id = event.sender_id
    status = get_user_status(user_id)
    msg = event.raw_text.lower()

    if status['paused']: return

    if event.id <= status['last_processed_msg_id']: return
    status['last_processed_msg_id'] = event.id

    if any(word in msg for word in ["pay", "paid", "payment", "screenshot", "bheja"]):
        await smart_reply(event, "Theek hai sir, check kiya ja raha hai. Website par login karke apna slot confirm kijiye, wahan se aapko call details mil jayengi. ✅")
        return

    if status['step'] == 0:
        await smart_reply(event, "Yes sir, available 😊. Which city/area are you looking for?")
        status['step'] = 1
    
    elif status['step'] == 1:
        await smart_reply(event, "Understood. Sir, hamari official website par 49rs ka slot book karke aap mam se direct call pe baat kar sakte hain. Wahan se aapko models ki profile WhatsApp pe mil jayegi. Visit: https://real-glow.vercel.app")
        status['step'] = 2
        asyncio.create_task(follow_up(event.chat_id))

async def follow_up(chat_id):
    await asyncio.sleep(600)
    status = get_user_status(chat_id)
    if status['step'] == 2 and not status['paused']:
        try:
            await client.send_message(chat_id, "Sir, kya mam se baat ho payi? Website pe slot book karke call details le lijiye: https://real-glow.vercel.app")
        except Exception:
            pass

@client.on(events.NewMessage(outgoing=True))
async def stop_bot(event):
    if event.is_private:
        user_db[event.chat_id] = {'step': 99, 'paused': True, 'last_processed_msg_id': 0}

# --- FAKE WEB SERVER FOR RENDER FREE TIER ---
async def handle(request):
    return web.Response(text="Bot is running 24/7!")

async def start_web():
    import os
    app = web.Application()
    app.router.add_get('/', handle)
    port = int(os.environ.get("PORT", 8080))
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()

async def main():
    print("Smart Bot Connecting...")
    # Web server ko main loop me start kar rahe hain taaki thread error na aaye
    await start_web()
    
    # Telethon client ko start aur run karenge
    await client.start()
    print("RealMeet Anti-Spam Userbot Is Running Safely on Render!")
    await client.run_until_disconnected()

if __name__ == '__main__':
    # Python ke naye loop system ke mutabik sahi initiation
    asyncio.run(main())
    
