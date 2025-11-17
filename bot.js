import { Telegraf } from "telegraf";

// BOT TOKEN Render env me rahega
const BOT_TOKEN = process.env.BOT_TOKEN;

// ADMIN ID code ke andar hardcoded as you requested
const ADMIN_ID = 7693439673;

// Unique Welcome Messages List
const welcomeMessages = [
  "🎉 Welcome aboard, {name}! Humari family me aapka swagat hai! 🚀",
  "🔥 {name} just joined the party! Sab log welcome bolo 👋",
  "🌟 A warm welcome to {name}! Hope you enjoy the group vibes ✨",
  "💥 Boom! {name} has entered. Let's gooooo! 😎",
  "😁 Hello {name}! Group me enjoy karo aur active raho 💬"
];

// Random welcome message function
function getWelcomeText(name) {
  return welcomeMessages[
    Math.floor(Math.random() * welcomeMessages.length)
  ].replace("{name}", name);
}

const bot = new Telegraf(BOT_TOKEN);

// New Member Welcome
bot.on("new_chat_members", async (ctx) => {
  const member = ctx.message.new_chat_members[0];
  const name = member.first_name || "New Member";

  await ctx.reply(getWelcomeText(name));
});

// Admin Panel
bot.command("panel", (ctx) => {
  if (ctx.from.id !== ADMIN_ID)
    return ctx.reply("❌ Sirf admin access kar sakta hai.");
    
  ctx.reply(
    "🛠 *Admin Panel*\n\n" +
    "1️⃣ /say <msg> – Group me message bhejo\n" +
    "2️⃣ /members – Group members count\n" +
    "3️⃣ /welcome – Test welcome",
    { parse_mode: "Markdown" }
  );
});

// Say command
bot.command("say", (ctx) => {
  if (ctx.from.id !== ADMIN_ID)
    return ctx.reply("❌ Admin only.");

  const msg = ctx.message.text.split(" ").slice(1).join(" ");
  if (!msg) return ctx.reply("⚠ Usage: /say <msg>");

  ctx.reply(msg);
});

// Members count
bot.command("members", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID)
    return ctx.reply("❌ Admin only.");

  const count = await ctx.telegram.getChatMembersCount(ctx.chat.id);
  ctx.reply(`👥 Total Members: ${count}`);
});

// Test welcome
bot.command("welcome", (ctx) => {
  if (ctx.from.id !== ADMIN_ID)
    return ctx.reply("❌ Admin only.");

  ctx.reply(getWelcomeText(ctx.from.first_name));
});

// Start bot
bot.launch();
console.log("🤖 Bot is running on Render...");

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
