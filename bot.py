import asyncio
import time
import os
from telethon import TelegramClient, events
from telethon.sessions import StringSession

# --- CONFIGURATION ---
API_ID = 39946962
API_HASH = '509f0cca77abf971e3e8040d8b05bb05'
SESSION_STRING = os.environ.get("SESSION_STRING")

client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

# Database to track status
user_db = {}

def get_user_status(user_id):
    if user_id not in user_db:
        user_db[user_id] = {'step': 0, 'last_msg': '', 'paused': False}
    return user_db[user_id]

async def smart_reply(event, text, delay=2):
    await client.action(event.chat_id, 'typing')
    await asyncio.sleep(delay)
    await event.reply(text)

@client.on(events.NewMessage(incoming=True))
async def handle_messages(event):
    if not event.is_private: return
    user_id = event.sender_id
    status = get_user_status(user_id)
    msg = event.raw_text.lower()

    if status['paused']: return

    # Logic: "Pay krdiya" ka reply
    if "pay" in msg or "paid" in msg or "payment" in msg:
        await smart_reply(event, "Theek hai sir, check kiya ja raha hai. Website par login karke apna slot confirm kijiye, wahan se aapko call details mil jayengi. ✅")
        return

    # Logic: New User Flow
    if status['step'] == 0:
        await smart_reply(event, "Yes sir, available 😊. Which city/area are you looking for?")
        status['step'] = 1
    
    elif status['step'] == 1:
        await smart_reply(event, "Understood. Sir, hamari official website par 49rs ka slot book karke aap mam se direct call pe baat kar sakte hain. Wahan se aapko models ki profile WhatsApp pe mil jayegi. Visit: https://real-glow.vercel.app")
        status['step'] = 2
        # 5 minute baad follow-up
        asyncio.create_task(follow_up(event.chat_id))

async def follow_up(chat_id):
    await asyncio.sleep(300)
    status = get_user_status(chat_id)
    if status['step'] == 2 and not status['paused']:
        await client.send_message(chat_id, "Sir, kya mam se baat ho payi? Website pe slot book karke call details le lijiye: https://real-glow.vercel.app")

@client.on(events.NewMessage(outgoing=True))
async def stop_bot(event):
    if event.is_private:
        user_db[event.chat_id] = {'step': 99, 'paused': True} # Bot silent mode me chala gaya

print("Smart Bot Active...")
client.start()
client.run_until_disconnected()

