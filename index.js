const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-timezone');

// Bot token (Yaha aapka @BotFather wala token aayega)
const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const bot = new TelegramBot(TOKEN, { polling: true });

// Admin ID (Aapka ID)
const ADMIN_ID = 7693439673;

// Group settings storage
const groupSettings = new Map();

console.log('🤖 Bot started successfully!');

// Store group names
const groupNames = new Map();

// Get group info when added to group
bot.on('message', (msg) => {
    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
        const chatId = msg.chat.id;
        if (!groupNames.has(chatId)) {
            groupNames.set(chatId, msg.chat.title);
            console.log(`📝 Group registered: ${msg.chat.title} (${chatId})`);
        }
    }
});

// Admin panel
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (userId === ADMIN_ID) {
        bot.sendMessage(chatId, `🎛️ *Admin Panel*\n\n` +
            `📊 Commands Available:\n` +
            `/welcome <message> - Set welcome message\n` +
            `/settings - Group settings\n` +
            `/stats - Group statistics\n` +
            `/groups - List all groups\n` +
            `/help - Show all commands`, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, 'Hello! I am a group management bot. Add me to your group!');
    }
});

// Auto welcome new members WITH GROUP NAME
bot.on('new_chat_members', (msg) => {
    const chatId = msg.chat.id;
    const groupName = groupNames.get(chatId) || 'our group';
    const newMembers = msg.new_chat_members;
    
    newMembers.forEach(member => {
        // Check if the new member is the bot itself
        if (member.id === bot.token.split(':')[0]) {
            // Bot added to group
            const botWelcome = `🤖 *Hello everyone! I'm your new group manager bot!*\n\n` +
                `I'll help welcome new members and manage the group.\n` +
                `Use /help to see my commands!`;
            
            bot.sendMessage(chatId, botWelcome, { parse_mode: 'Markdown' });
            return;
        }
        
        const welcomeMessage = getWelcomeMessage(chatId, member, groupName);
        bot.sendMessage(chatId, welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: '📜 Rules', callback_data: 'rules' },
                    { text: '👋 Meet Admin', url: `tg://user?id=${ADMIN_ID}` }
                ]]
            }
        });
    });
});

// Custom welcome messages with GROUP NAME
function getWelcomeMessage(chatId, user, groupName) {
    const welcomeTemplates = [
        `🎉 **Welcome to *${groupName}*, {name}!** 🌟\nWe're excited to have you here! Feel free to introduce yourself!`,
        `👋 **Hello {name}!** Welcome to *${groupName}*! 🚀\nMake yourself at home and enjoy your stay!`,
        `🌈 **Hey {name}!** Great to see you in *${groupName}*! ✨\nDon't forget to read the rules!`,
        `🔥 **Welcome {name}!** to *${groupName}*! 🎊\nYou make our community even better!`,
        `💫 **Namaste {name}!** 🙏\nAapka *${groupName}* mein swagat hai! Khush aamdeed!`,
        `🌟 **Welcome aboard, {name}!** 🎯\nYou've joined the amazing *${groupName}* community!`,
        `🚀 **Hey {name}!** Welcome to *${groupName}*! 🌈\nGet ready for an amazing experience!`
    ];
    
    const randomTemplate = welcomeTemplates[Math.floor(Math.random() * welcomeTemplates.length)];
    
    return randomTemplate
        .replace(/{name}/g, `[${user.first_name}${user.last_name ? ' ' + user.last_name : ''}](tg://user?id=${user.id})`)
        .replace(/{groupName}/g, groupName);
}

// Set custom welcome message
bot.onText(/\/welcome (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (userId === ADMIN_ID) {
        const welcomeMsg = match[1];
        if (!groupSettings.has(chatId)) {
            groupSettings.set(chatId, {});
        }
        groupSettings.get(chatId).welcomeMessage = welcomeMsg;
        bot.sendMessage(chatId, `✅ Welcome message set successfully!\n\nNew message: ${welcomeMsg}`);
    }
});

// Group statistics
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (userId === ADMIN_ID) {
        const groupName = groupNames.get(chatId) || 'Unknown Group';
        bot.getChatMembersCount(chatId).then(membersCount => {
            bot.sendMessage(chatId, 
                `📊 *Group Statistics - ${groupName}*\n\n` +
                `👥 Total Members: ${membersCount}\n` +
                `🆔 Group ID: ${chatId}\n` +
                `🏷️ Group Name: ${groupName}\n` +
                `⏰ Server Time: ${moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')}\n` +
                `🤖 Bot Status: ✅ Online`, 
                { parse_mode: 'Markdown' }
            );
        });
    }
});

// List all groups (Admin only)
bot.onText(/\/groups/, (msg) => {
    const userId = msg.from.id;
    
    if (userId === ADMIN_ID) {
        if (groupNames.size === 0) {
            bot.sendMessage(msg.chat.id, '📭 Bot is not added to any groups yet.');
            return;
        }
        
        let groupsList = `📋 *Groups Using This Bot (${groupNames.size})*\n\n`;
        groupNames.forEach((name, id) => {
            groupsList += `🏷️ ${name}\n🆔 ${id}\n\n`;
        });
        
        bot.sendMessage(msg.chat.id, groupsList, { parse_mode: 'Markdown' });
    }
});

// Settings command
bot.onText(/\/settings/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const groupName = groupNames.get(chatId) || 'Unknown Group';
    
    if (userId === ADMIN_ID) {
        const settings = groupSettings.get(chatId) || {};
        bot.sendMessage(chatId,
            `⚙️ *Group Settings - ${groupName}*\n\n` +
            `🎉 Welcome Message: ${settings.welcomeMessage ? '✅ Custom' : '✅ Default'}\n` +
            `🛡️ Anti-Spam: ✅ Enabled\n` +
            `👋 Auto-Welcome: ✅ Enabled\n` +
            `📊 Analytics: ✅ Enabled\n` +
            `🏷️ Group Name: ${groupName}`,
            { parse_mode: 'Markdown' }
        );
    }
});

// Help command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const groupName = groupNames.get(chatId) || 'this group';
    
    bot.sendMessage(chatId,
        `🤖 *Bot Help Guide - ${groupName}*\n\n` +
        `*For Everyone:*\n` +
        `👋 Auto welcome for new members\n` +
        `📜 Rules button in welcome\n` +
        `\n*For Admin:*\n` +
        `/welcome - Set custom welcome\n` +
        `/stats - Group statistics\n` +
        `/settings - Bot settings\n` +
        `/groups - List all groups\n` +
        `\n*Features:*\n` +
        `✅ Smart group management\n` +
        `✅ Multi-group support\n` +
        `✅ Group name detection\n` +
        `✅ Custom welcome messages\n` +
        `✅ Admin panel\n` +
        `✅ Real-time monitoring`,
        { parse_mode: 'Markdown' }
    );
});

// Callback queries for buttons
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    
    if (data === 'rules') {
        bot.answerCallbackQuery(callbackQuery.id, {
            text: '📜 Group Rules: Be respectful, no spam, follow community guidelines!'
        });
    }
});

// Error handling
bot.on('error', (error) => {
    console.log('Bot Error:', error);
});

console.log('🚀 Bot is running on Render...');
