// index.js
const { Telegraf } = require("telegraf");
const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("Error: BOT_TOKEN environment variable is required.");
  process.exit(1);
}

const API_BASE = "http://hackingsocietyai.great-site.net/osint.php";
const API_KEY = process.env.API_KEY || "test";

const bot = new Telegraf(BOT_TOKEN);

// Only respond to the /num command
// Usage: /num 9099445708
bot.command("num", async (ctx) => {
  try {
    const text = ctx.message.text || "";
    // Remove command part and trim
    const arg = text.replace(/^\/num(@\S+)?/i, "").trim();

    if (!arg) {
      return ctx.reply("Usage: /num <phone_number>\nExample: /num 9099445708");
    }

    // Basic validation: digits, + and - allowed (we'll strip non-digits)
    const phone = arg.replace(/\D/g, "");
    if (!/^\d{6,15}$/.test(phone)) {
      return ctx.reply("⚠️ Please provide a valid phone number (6-15 digits).");
    }

    await ctx.reply("🔎 Searching... please wait.");

    const params = {
      key: API_KEY,
      phone: phone,
    };

    const resp = await axios.get(API_BASE, { params, timeout: 15000 });
    const contentType = (resp.headers["content-type"] || "").toLowerCase();

    // If API returns JSON, pretty-print. Otherwise send as text/html.
    if (contentType.includes("application/json")) {
      const json = resp.data;
      // Pretty formatting: convert object to text
      const pretty = "Result:\n" + JSON.stringify(json, null, 2);
      // Telegram message limit ~4096 chars — guard it
      if (pretty.length > 3900) {
        await ctx.reply("✅ Result received (too long to display). Sending first 3900 chars:");
        await ctx.reply(pretty.slice(0, 3900));
      } else {
        await ctx.reply(pretty);
      }
    } else {
      // Text or HTML
      let data = resp.data;
      if (typeof data !== "string") data = String(data);

      // If HTML, send as HTML parse mode (safe-ish); else plain text
      if (contentType.includes("html") || /<\w+>/.test(data.slice(0, 200))) {
        // escape if too long
        if (data.length > 4000) {
          await ctx.reply("✅ Result received (too long to display). Sending first 3900 chars:");
          await ctx.replyWithHTML(escapeHtml(data.slice(0, 3900)));
        } else {
          await ctx.replyWithHTML(escapeHtml(data));
        }
      } else {
        if (data.length > 4000) {
          await ctx.reply("✅ Result received (too long to display). Sending first 3900 chars:");
          await ctx.reply(data.slice(0, 3900));
        } else {
          await ctx.reply(data);
        }
      }
    }
  } catch (err) {
    console.error("API error:", err?.message || err);
    await ctx.reply("⚠️ Error fetching API: " + (err?.message || String(err)));
  }
});

// Helper to escape HTML so replyWithHTML is safe
function escapeHtml(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Start polling
bot.launch()
  .then(() => console.log("Bot started"))
  .catch((e) => {
    console.error("Failed to start bot:", e);
    process.exit(1);
  });

// Graceful stop on Render / Heroku signals
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
