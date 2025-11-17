import TelegramBot from "node-telegram-bot-api";
import fs from "fs";

// Bot init
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// ADMIN ID
const ADMIN_ID = 7693439673;

// Stylish Frame Templates
const frames = [
  `✨✨ *WELCOME FRAME* ✨✨
╔════════════════════╗
🌟 *Welcome, {name}!* 🌟
╚════════════════════╝
😄 Enjoy your stay!`,

  `💛✨ *Golden Entry Alert!* ✨💛

👑 {name} has joined the kingdom!
⚡ Let the vibe begin!`,

  `🌈💫 *New Member Arrived!* 💫🌈

🌀 Welcome {name}!  
🔥 Aapke aane se group aur lit ho gaya!`,

  `🚀🌟 *Blast Entry!* 🌟🚀

🔥 {name} just landed!  
✨ Get ready for amazing vibes!`,

  `💎✨ *Premium Member Joined!* ✨💎  

🎉 Welcome {name}!  
😎 Aaj group ki shine badh gayi!`
];

// Random stylish welcome
function getWelcome(name) {
  const frame = frames[Math.floor(Math.random() * frames.length)];
  return frame.replace("{name}", name);
}

// Trigger on new member join
bot.on("new_chat_members", (msg) => {
  const name = msg.new_chat_members[0].first_name;
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, getWelcome(name), {
    parse_mode: "Markdown"
  });
});

// ADMIN PANEL
bot.onText(/\/panel/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return;

  bot.sendMessage(msg.chat.id, `👑 *Admin Panel*  
Choose your action:  
1️⃣ /msg - Send message to group  
2️⃣ /photo - Send photo  
3️⃣ /welcome - Test welcome message`, {
    parse_mode: "Markdown"
  });
});

// Admin – Send Message Command
bot.onText(/\/msg (.+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;
  bot.sendMessage(msg.chat.id, `📢 *Admin Broadcast:*  
${match[1]}`, { parse_mode: "Markdown" });
});

// Admin – Test welcome
bot.onText(/\/welcome/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return;
  bot.sendMessage(msg.chat.id, getWelcome("Test User"), {
    parse_mode: "Markdown"
  });
});

console.log("🔥 Stylish Welcome Bot Running...");
