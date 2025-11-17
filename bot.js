/**
 * Multi-group Public Telegram Bot
 * Features:
 * - Owner (hardcoded)
 * - Public usage (per-group settings)
 * - Inline Settings Menu (Welcome ON/OFF, Emoji selector, Frame selector, Language, Stats)
 * - Emoji selector (Set A: 😀 😍 😎 🤩 😈 💀 😡)
 * - Frame selector (Soft Aesthetic)
 * - Auto-detect language using Telegram language_code (best-effort)
 * - Group stats panel
 * - Help menu (inline)
 * - Anti-spam (flood, links, bad-words)
 * - DB stored in database.json
 *
 * Usage:
 * - /help (public)
 * - /settings (group admins only)
 * - /setwelcome <text> (admin) - use {name} and {emoji}
 * - /resetwelcome (admin)
 * - Owner commands: /owner, /broadcast, /groups, /shutdown
 *
 * Deploy: set BOT_TOKEN env var (Render)
 */

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

// --- CONFIG ---
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("ERROR: BOT_TOKEN environment variable missing.");
  process.exit(1);
}
const OWNER_ID = 7693439673; // your owner id

const DB_FILE = path.join(__dirname, "database.json");
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// --- SIMPLE JSON DB ---
let db = {};
try {
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "{}");
  }
} catch (e) {
  console.error("DB load error:", e);
  db = {};
}
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("DB save error:", e);
  }
}
function ensureChat(chatId) {
  if (!db[chatId]) {
    db[chatId] = {
      welcomeEnabled: true,
      emoji: "🎉",
      frame: 0,
      language: "auto", // auto / en / hi / ... (we use user's language_code best-effort)
      welcomeTemplate: null, // custom
      antiSpam: {
        enabled: true,
        warnCount: {},
        whitelist: []
      }
    };
    saveDB();
  }
}

// --- FRAMES (Soft Aesthetic chosen as default style B) ---
const frames = [
  `✦・━──── ✧ ────・✦\n{emoji} *WELCOME* {emoji}\n\nHello {name}, welcome to the group!\n✦・━──── ✧ ────・✦`,
  `✦・━──── ✧ ────・✦\nWelcome {name} {emoji}\nHope you enjoy your stay.\n✦・━──── ✧ ────・✦`,
  `✦・━──── ✧ ────・✦\nHey {name}! {emoji}\nBe active and have fun!\n✦・━──── ✧ ────・✦`,
  `✦・━──── ✧ ────・✦\n🌈 Welcome {name} {emoji}\nSay hi to everyone!\n✦・━──── ✧ ────・✦`,
  `✦・━──── ✧ ────・✦\n💫 {name} joined {emoji}\nEnjoy the vibes!\n✦・━──── ✧ ────・✦`
];

// --- Emoji Set A ---
const emojiChoices = ["😀","😍","😎","🤩","😈","💀","😡"];

// --- Basic UI translations (best-effort) ---
const uiText = {
  en: {
    settings: "⚙️ Group Settings",
    choose: "Choose an option:",
    saved: "✅ Saved!",
    onlyAdmin: "❌ Only group admins can do this.",
    welcomeOn: "✅ Welcome: ON",
    welcomeOff: "❌ Welcome: OFF",
    back: "🔙 Back"
  },
  hi: {
    settings: "⚙️ Group Settings",
    choose: "Option chuno:",
    saved: "✅ Save ho gaya!",
    onlyAdmin: "❌ Sirf group admin kar sakte hain.",
    welcomeOn: "✅ Welcome: चालू",
    welcomeOff: "❌ Welcome: बंद",
    back: "🔙 वापस"
  }
};
// get UI text based on chat language or fallback
function ui(chatId, key, userLangCode = null) {
  ensureChat(chatId);
  const cfg = db[chatId];
  // If chat language is set to 'auto', try using userLangCode; else use cfg.language
  let lang = "en";
  if (cfg.language && cfg.language !== "auto") lang = cfg.language;
  else if (userLangCode) {
    if (userLangCode.startsWith("hi")) lang = "hi";
    else lang = "en";
  }
  return (uiText[lang] && uiText[lang][key]) || uiText["en"][key] || key;
}

// --- Welcome text generator ---
function getWelcomeText(chatId, name) {
  ensureChat(chatId);
  const cfg = db[chatId];
  if (cfg.welcomeTemplate) {
    return cfg.welcomeTemplate.replace(/{name}/g, name).replace(/{emoji}/g, cfg.emoji);
  }
  const frame = frames[cfg.frame % frames.length];
  return frame.replace(/{name}/g, name).replace(/{emoji}/g, cfg.emoji);
}

// --- Anti-spam config & runtime store ---
const anti = {
  SPAM_LIMIT: 5, // messages
  SPAM_WINDOW: 4000, // ms
  BAD_WORDS: ["fuck","sex","xxx","bhosdi","madarchod","chodu","lund"], // extend as needed
  BLOCK_LINKS: true,
  muteDurationSeconds: 60 // mute 1 minute on spam
};
const spamRuntime = {}; // { chatId: { userId: { count, last } } }

// helper: is admin
async function isAdmin(chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    return ["administrator","creator"].includes(member.status);
  } catch {
    return false;
  }
}

// --- Events ---

// Anti-spam message handler (runs for all messages)
bot.on("message", async (msg) => {
  try {
    // ignore service messages that are not text/media user messages
    if (!msg || !msg.chat || !msg.from) return;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = (msg.text || msg.caption || "") + "";

    // Only handle in groups and supergroups
    if (msg.chat.type === "private") return;

    ensureChat(chatId);

    // Admin bypass
    if (await isAdmin(chatId, userId) || userId === OWNER_ID) return;

    // spamRuntime init
    if (!spamRuntime[chatId]) spamRuntime[chatId] = {};
    if (!spamRuntime[chatId][userId]) spamRuntime[chatId][userId] = { count: 0, last: Date.now() };

    const user = spamRuntime[chatId][userId];
    const now = Date.now();
    if (now - user.last > anti.SPAM_WINDOW) {
      user.count = 0;
    }
    user.count++;
    user.last = now;

    // Count media heavier
    if (msg.photo || msg.video || msg.document || msg.audio || msg.sticker) {
      user.count += 1;
    }

    // Link detection
    if (anti.BLOCK_LINKS && /(https?:\/\/|t\.me|telegram\.me|wa.me|www\.)/i.test(text)) {
      try { await bot.deleteMessage(chatId, msg.message_id); } catch {}
      await bot.sendMessage(chatId, `⚠️ Links are not allowed.`, { reply_to_message_id: msg.message_id }).catch(()=>{});
      return;
    }

    // Bad words check
    const lower = text.toLowerCase();
    if (anti.BAD_WORDS.some(w => lower.includes(w))) {
      try { await bot.deleteMessage(chatId, msg.message_id); } catch {}
      await bot.sendMessage(chatId, `🚫 Bad language is not allowed here.`, { reply_to_message_id: msg.message_id }).catch(()=>{});
      return;
    }

    // Flood detection
    if (user.count >= anti.SPAM_LIMIT) {
      // delete offending message
      try { await bot.deleteMessage(chatId, msg.message_id); } catch {}
      // mute user
      try {
        await bot.restrictChatMember(chatId, userId, {
          permissions: { can_send_messages: false },
          until_date: Math.floor(Date.now() / 1000) + anti.muteDurationSeconds
        });
      } catch (e) {
        // ignore permission errors
      }
      await bot.sendMessage(chatId, `⚠️ *Spam detected!* User muted for ${anti.muteDurationSeconds} seconds.`, { parse_mode: "Markdown" }).catch(()=>{});
      // reset
      spamRuntime[chatId][userId] = { count: 0, last: Date.now() };
      return;
    }

  } catch (err) {
    console.error("Anti-spam handler error:", err);
  }
});

// New member welcome
bot.on("new_chat_members", async (msg) => {
  try {
    const chatId = msg.chat.id;
    ensureChat(chatId);
    if (!db[chatId].welcomeEnabled) return;

    const member = msg.new_chat_members[0];
    const name = member.first_name || "there";

    // Use user language_code if available for UI string selection
    const userLang = member.language_code || null;
    const text = getWelcomeText(chatId, name);
    await bot.sendMessage(chatId, text, { parse_mode: "Markdown" }).catch(()=>{});
  } catch (e) {
    console.error("welcome error:", e);
  }
});

// /help - shows help + settings button
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpText = `📘 *Commands*\n\n` +
    `/settings - Open group settings (admin only)\n` +
    `/setwelcome <text> - Set custom welcome (use {name} and {emoji})\n` +
    `/resetwelcome - Reset to default welcome\n` +
    `/help - Show this help menu\n\n` +
    `Owner-only: /owner\n\n` +
    `Tip: Use {name} inside custom welcome to insert user's name.`;
  bot.sendMessage(chatId, helpText, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "⚙️ Open Settings", callback_data: `open_settings:${chatId}` }]]
    }
  }).catch(()=>{});
});

// /settings - open inline menu (only group admins)
bot.onText(/\/settings/, async (msg) => {
  const chatId = msg.chat.id;
  if (msg.chat.type === "private") {
    return bot.sendMessage(chatId, "This command works only in groups.");
  }
  try {
    const member = await bot.getChatMember(chatId, msg.from.id);
    if (!["administrator","creator"].includes(member.status)) {
      return bot.sendMessage(chatId, ui(chatId, "onlyAdmin", msg.from.language_code));
    }
    ensureChat(chatId);
    const cfg = db[chatId];
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: cfg.welcomeEnabled ? ui(chatId,"welcomeOn") : ui(chatId,"welcomeOff"), callback_data: `toggle_welcome:${chatId}` }],
          [{ text: "😊 Emoji", callback_data: `open_emoji:${chatId}` }, { text: "🖼 Frame", callback_data: `open_frame:${chatId}` }],
          [{ text: "🌐 Language", callback_data: `open_lang:${chatId}` }, { text: "📊 Stats", callback_data: `show_stats:${chatId}` }],
          [{ text: "🔙 Close", callback_data: `close:${chatId}` }]
        ]
      }
    };
    await bot.sendMessage(chatId, `${ui(chatId,"settings", msg.from.language_code)}\n\n${ui(chatId,"choose", msg.from.language_code)}`, keyboard);
  } catch (e) {
    console.error("settings error:", e);
  }
});

// /setwelcome <text>
bot.onText(/\/setwelcome (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  try {
    const member = await bot.getChatMember(chatId, msg.from.id);
    if (!["administrator","creator"].includes(member.status)) return bot.sendMessage(chatId, ui(chatId,"onlyAdmin", msg.from.language_code));
    ensureChat(chatId);
    db[chatId].welcomeTemplate = match[1];
    saveDB();
    bot.sendMessage(chatId, ui(chatId,"saved", msg.from.language_code));
  } catch (e) {
    console.error("setwelcome error:", e);
  }
});

// /resetwelcome
bot.onText(/\/resetwelcome/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const member = await bot.getChatMember(chatId, msg.from.id);
    if (!["administrator","creator"].includes(member.status)) return bot.sendMessage(chatId, ui(chatId,"onlyAdmin", msg.from.language_code));
    ensureChat(chatId);
    db[chatId].welcomeTemplate = null;
    saveDB();
    bot.sendMessage(chatId, ui(chatId,"saved", msg.from.language_code));
  } catch (e) {
    console.error(e);
  }
});

// Owner commands
bot.onText(/\/owner/, (msg) => {
  if (msg.from.id !== OWNER_ID) return;
  bot.sendMessage(msg.chat.id, `👑 Owner Panel\n/broadcast <text>\n/groups\n/shutdown`);
});
bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.from.id !== OWNER_ID) return;
  const text = match[1];
  for (const chatId of Object.keys(db)) {
    bot.sendMessage(chatId, `📢 *Broadcast:* ${text}`, { parse_mode: "Markdown" }).catch(()=>{});
  }
});
bot.onText(/\/groups/, (msg) => {
  if (msg.from.id !== OWNER_ID) return;
  bot.sendMessage(msg.chat.id, `Total groups in DB: ${Object.keys(db).length}`);
});
bot.onText(/\/shutdown/, (msg) => {
  if (msg.from.id !== OWNER_ID) return;
  bot.sendMessage(msg.chat.id, "Shutting down...").then(()=>process.exit());
});

// --- Callback Query Handler (Inline buttons) ---
bot.on("callback_query", async (query) => {
  const data = query.data || "";
  const fromId = query.from.id;

  try {
    if (data.startsWith("open_settings:") || data.startsWith("open_settings:")) {
      const chatId = Number(data.split(":")[1]);
      // only group admins
      const member = await bot.getChatMember(chatId, fromId);
      if (!["administrator","creator"].includes(member.status)) {
        return bot.answerCallbackQuery(query.id, { text: ui(chatId,"onlyAdmin", query.from.language_code), show_alert: true });
      }
      ensureChat(chatId);
      await bot.editMessageText(`${ui(chatId,"settings",query.from.language_code)}\n\n${ui(chatId,"choose",query.from.language_code)}`, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        ...{ reply_markup: settingsKeyboard(chatId) }
      }).catch(()=>{});
      return bot.answerCallbackQuery(query.id);
    }

    if (data.startsWith("toggle_welcome:")) {
      const chatId = Number(data.split(":")[1]);
      const member = await bot.getChatMember(chatId, fromId);
      if (!["administrator","creator"].includes(member.status)) return bot.answerCallbackQuery(query.id, { text: ui(chatId,"onlyAdmin", query.from.language_code), show_alert:true });
      ensureChat(chatId);
      db[chatId].welcomeEnabled = !db[chatId].welcomeEnabled;
      saveDB();
      // update keyboard text
      await bot.editMessageText(`${ui(chatId,"settings", query.from.language_code)}\n\n${ui(chatId,"choose", query.from.language_code)}`, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        ...{ reply_markup: settingsKeyboard(chatId) }
      }).catch(()=>{});
      return bot.answerCallbackQuery(query.id, { text: db[chatId].welcomeEnabled ? ui(chatId,"welcomeOn") : ui(chatId,"welcomeOff") });
    }

    if (data.startsWith("open_emoji:")) {
      const chatId = Number(data.split(":")[1]);
      const member = await bot.getChatMember(chatId, fromId);
      if (!["administrator","creator"].includes(member.status)) return bot.answerCallbackQuery(query.id, { text: ui(chatId,"onlyAdmin", query.from.language_code), show_alert:true });
      // show emojis grid
      const rows = [];
      for (let i=0;i<emojiChoices.length;i+=4) {
        rows.push(emojiChoices.slice(i,i+4).map(e => ({ text: e, callback_data: `set_emoji:${encodeURIComponent(e)}:${chatId}` })));
      }
      rows.push([{ text: ui(chatId,"back", query.from.language_code), callback_data: `open_settings:${chatId}` }]);
      await bot.editMessageText("Select emoji for welcome:", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: { inline_keyboard: rows }
      });
      return bot.answerCallbackQuery(query.id);
    }

    if (data.startsWith("set_emoji:")) {
      const parts = data.split(":");
      const emoji = decodeURIComponent(parts[1]);
      const chatId = Number(parts[2]);
      const member = await bot.getChatMember(chatId, fromId);
      if (!["administrator","creator"].includes(member.status)) return bot.answerCallbackQuery(query.id, { text: ui(chatId,"onlyAdmin", query.from.language_code), show_alert:true });
      ensureChat(chatId);
      db[chatId].emoji = emoji;
      saveDB();
      await bot.editMessageText(`${ui(chatId,"settings", query.from.language_code)}\n\n${ui(chatId,"choose", query.from.language_code)}`, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        ...{ reply_markup: settingsKeyboard(chatId) }
      }).catch(()=>{});
      return bot.answerCallbackQuery(query.id, { text: ui(chatId,"saved", query.from.language_code) });
    }

    if (data.startsWith("open_frame:")) {
      const chatId = Number(data.split(":")[1]);
      const member = await bot.getChatMember(chatId, fromId);
      if (!["administrator","creator"].includes(member.status)) return bot.answerCallbackQuery(query.id, { text: ui(chatId,"onlyAdmin", query.from.language_code), show_alert:true });
      const rows = [];
      for (let i=0;i<frames.length;i++) {
        rows.push([{ text: `Frame ${i+1}`, callback_data: `set_frame:${i}:${chatId}` }]);
      }
      rows.push([{ text: ui(chatId,"back", query.from.language_code), callback_data: `open_settings:${chatId}` }]);
      await bot.editMessageText("Choose a frame style:", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: { inline_keyboard: rows }
      });
      return bot.answerCallbackQuery(query.id);
    }

    if (data.startsWith("set_frame:")) {
      const parts = data.split(":");
      const idx = Number(parts[1]);
      const chatId = Number(parts[2]);
      const member = await bot.getChatMember(chatId, fromId);
      if (!["administrator","creator"].includes(member.status)) return bot.answerCallbackQuery(query.id, { text: ui(chatId,"onlyAdmin", query.from.language_code), show_alert:true });
      ensureChat(chatId);
      db[chatId].frame = idx;
      saveDB();
      await bot.editMessageText(`${ui(chatId,"settings", query.from.language_code)}\n\n${ui(chatId,"choose", query.from.language_code)}`, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        ...{ reply_markup: settingsKeyboard(chatId) }
      }).catch(()=>{});
      return bot.answerCallbackQuery(query.id, { text: ui(chatId,"saved", query.from.language_code) });
    }

    if (data.startsWith("open_lang:")) {
      const chatId = Number(data.split(":")[1]);
      const member = await bot.getChatMember(chatId, fromId);
      if (!["administrator","creator"].includes(member.status)) return bot.answerCallbackQuery(query.id, { text: ui(chatId,"onlyAdmin", query.from.language_code), show_alert:true });
      const rows = [
        [{ text: "Auto (default)", callback_data: `set_lang:auto:${chatId}` }],
        [{ text: "English", callback_data: `set_lang:en:${chatId}` }],
        [{ text: "Hindi", callback_data: `set_lang:hi:${chatId}` }],
        [{ text: ui(chatId,"back", query.from.language_code), callback_data: `open_settings:${chatId}` }]
      ];
      await bot.editMessageText("Select language mode:", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: { inline_keyboard: rows }
      });
      return bot.answerCallbackQuery(query.id);
    }

    if (data.startsWith("set_lang:")) {
      const parts = data.split(":");
      const lang = parts[1];
      const chatId = Number(parts[2]);
      const member = await bot.getChatMember(chatId, fromId);
      if (!["administrator","creator"].includes(member.status)) return bot.answerCallbackQuery(query.id, { text: ui(chatId,"onlyAdmin", query.from.language_code), show_alert:true });
      ensureChat(chatId);
      db[chatId].language = lang;
      saveDB();
      await bot.editMessageText(`${ui(chatId,"settings", query.from.language_code)}\n\n${ui(chatId,"choose", query.from.language_code)}`, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        ...{ reply_markup: settingsKeyboard(chatId) }
      }).catch(()=>{});
      return bot.answerCallbackQuery(query.id, { text: ui(chatId,"saved", query.from.language_code) });
    }

    if (data.startsWith("show_stats:")) {
      const chatId = Number(data.split(":")[1]);
      const count = await bot.getChatMembersCount(chatId).catch(()=>null);
      const info = await bot.getChat(chatId).catch(()=>null);
      const title = info ? (info.title || "Group") : "Group";
      const hasCustom = db[chatId] && db[chatId].welcomeTemplate ? "Yes" : "No";
      const text = `📊 *Group Stats*\n\n*${title}*\nMembers: ${count ?? "N/A"}\nCustom Welcome: ${hasCustom}`;
      await bot.editMessageText(text, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [[{ text: ui(chatId,"back", query.from.language_code), callback_data: `open_settings:${chatId}` }]] }
      });
      return bot.answerCallbackQuery(query.id);
    }

    if (data.startsWith("close:")) {
      // remove keyboard
      await bot.editMessageReplyMarkup({}, { chat_id: query.message.chat.id, message_id: query.message.message_id }).catch(()=>{});
      return bot.answerCallbackQuery(query.id, { text: "Closed." });
    }

    return bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error("callback err:", err);
    try { bot.answerCallbackQuery(query.id, { text: "An error occurred.", show_alert: true }); } catch {}
  }
});

// helper: settings keyboard generator
function settingsKeyboard(chatId) {
  ensureChat(chatId);
  const cfg = db[chatId];
  return {
    inline_keyboard: [
      [{ text: cfg.welcomeEnabled ? ui(chatId,"welcomeOn") : ui(chatId,"welcomeOff"), callback_data: `toggle_welcome:${chatId}` }],
      [{ text: "😊 Emoji", callback_data: `open_emoji:${chatId}` }, { text: "🖼 Frame", callback_data: `open_frame:${chatId}` }],
      [{ text: "🌐 Language", callback_data: `open_lang:${chatId}` }, { text: "📊 Stats", callback_data: `show_stats:${chatId}` }],
      [{ text: "🔙 Close", callback_data: `close:${chatId}` }]
    ]
  };
}

// Graceful logs
console.log("✅ Multi-group customizable bot with anti-spam running...");
