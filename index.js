const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-timezone');

const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const bot = new TelegramBot(TOKEN, { polling: true });
const ADMIN_ID = 7693439673;

const groupSettings = new Map();
const groupNames = new Map();

console.log('🤖 Bot started successfully!');

// Store group names
bot.on('message', (msg) => {
    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
        const chatId = msg.chat.id;
        if (!groupNames.has(chatId)) {
            groupNames.set(chatId, msg.chat.title);
            console.log(`📝 Group registered: ${msg.chat.title} (${chatId})`);
        }
    }
});

// ADMIN REPLY FEATURES
bot.onText(/\/reply_(.+)_(.+)/, (msg, match) => {
    const userId = msg.from.id;
    
    if (userId === ADMIN_ID) {
        const targetUserId = match[1];
        const replyMessage = match[2];
        
        bot.sendMessage(targetUserId, `📨 *Message from Admin:*\n${replyMessage}`, {
            parse_mode: 'Markdown'
        }).then(() => {
            bot.sendMessage(msg.chat.id, `✅ Message sent to user ${targetUserId}`);
        }).catch(err => {
            bot.sendMessage(msg.chat.id, `❌ Cannot send message to ${targetUserId}`);
        });
    }
});

bot.onText(/\/say (.+)/, (msg, match) => {
    const userId = msg.from.id;
    
    if (userId === ADMIN_ID) {
        const message = match[1];
        bot.sendMessage(msg.chat.id, `👨‍💻 *Admin Says:* ${message}`, {
            parse_mode: 'Markdown'
        });
    }
});

// PHOTO BROADCAST FEATURES
bot.onText(/\/broadcast_photo/, (msg) => {
    const userId = msg.from.id;
    
    if (userId === ADMIN_ID) {
        bot.sendMessage(msg.chat.id, 
            "📸 *Photo Broadcast Instructions:*\n\n" +
            "1. Send a photo to this chat\n" +
            "2. Add caption: /broadcast Your message here\n" +
            "3. Photo will be sent to all groups!",
            { parse_mode: 'Markdown' }
        );
    }
});

bot.on('photo', (msg) => {
    const userId = msg.from.id;
    
    if (userId === ADMIN_ID && msg.caption && msg.caption.includes('/broadcast')) {
        const photoId = msg.photo[msg.photo.length - 1].file_id;
        const caption = msg.caption.replace('/broadcast', '').trim();
        
        broadcastPhotoToGroups(photoId, caption, msg);
    }
});

async function broadcastPhotoToGroups(photoId, caption, originalMsg) {
    let successCount = 0;
    let failCount = 0;
    
    const groupIds = Array.from(groupNames.keys());
    
    bot.sendMessage(originalMsg.chat.id, `🔄 Broadcasting photo to ${groupIds.length} groups...`);
    
    for (const groupId of groupIds) {
        try {
            await bot.sendPhoto(groupId, photoId, {
                caption: `📢 *Broadcast:* ${caption || "Important announcement!"}`,
                parse_mode: 'Markdown'
            });
            successCount++;
        } catch (error) {
            failCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    bot.sendMessage(originalMsg.chat.id,
        `📊 *Broadcast Complete:*\n\n` +
        `✅ Successful: ${successCount} groups\n` +
        `❌ Failed: ${failCount} groups\n` +
        `📸 Type: Photo with Message`,
        { parse_mode: 'Markdown' }
    );
}

// TEXT BROADCAST
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    const userId = msg.from.id;
    
    if (userId === ADMIN_ID) {
        const broadcastMsg = match[1];
        let successCount = 0;
        let failCount = 0;
        
        const groupIds = Array.from(groupNames.keys());
        
        bot.sendMessage(msg.chat.id, `🔄 Broadcasting to ${groupIds.length} groups...`);
        
        for (const groupId of groupIds) {
            try {
                await bot.sendMessage(groupId, 
                    `📢 *Broadcast Message:*\n\n${broadcastMsg}`,
                    { parse_mode: 'Markdown' }
                );
                successCount++;
            } catch (error) {
                failCount++;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        bot.sendMessage(msg.chat.id,
            `📊 *Broadcast Complete:*\n\n` +
            `✅ Successful: ${successCount} groups\n` +
            `❌ Failed: ${failCount} groups\n` +
            `💬 Message sent to all groups!`,
            { parse_mode: 'Markdown' }
        );
    }
});

// WELCOME MESSAGE (Original functionality)
bot.on('new_chat_members', (msg) => {
    const chatId = msg.chat.id;
    const groupName = groupNames.get(chatId) || 'our group';
    const newMembers = msg.new_chat_members;
    
    newMembers.forEach(member => {
        if (member.id === bot.token.split(':')[0]) {
            bot.sendMessage(chatId, 
                `🤖 *Hello everyone! I'm your new group manager bot!*\n\n` +
                `I can:\n• Welcome new members\n• Broadcast messages\n• Help admins manage group\n\n` +
                `Use /help for commands!`,
                { parse_mode: 'Markdown' }
            );
            return;
        }
        
        const welcomeMessage = getWelcomeMessage(member, groupName);
        bot.sendMessage(chatId, welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: '📜 Rules', callback_data: 'rules' },
                    { text: '👋 Admin', url: `tg://user?id=${ADMIN_ID}` }
                ]]
            }
        });
    });
});

function getWelcomeMessage(user, groupName) {
    const welcomeTemplates = [
        `🎉 **Welcome to *${groupName}*, {name}!** 🌟\nWe're excited to have you here!`,
        `👋 **Hello {name}!** Welcome to *${groupName}*! 🚀\nMake yourself at home!`,
        `🌈 **Hey {name}!** Great to see you in *${groupName}*! ✨`,
    ];
    
    const randomTemplate = welcomeTemplates[Math.floor(Math.random() * welcomeTemplates.length)];
    return randomTemplate.replace(/{name}/g, `[${user.first_name}](tg://user?id=${user.id})`);
}

// HELP COMMAND (Updated with new features)
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    if (msg.from.id === ADMIN_ID) {
        bot.sendMessage(chatId,
            `🤖 *Admin Commands:*\n\n` +
            `💬 *Reply Features:*\n` +
            `/reply_USERID_MESSAGE - Direct message to user\n` +
            `/say MESSAGE - Speak in group\n\n` +
            `📢 *Broadcast Features:*\n` +
            `/broadcast MESSAGE - Text to all groups\n` +
            `/broadcast_photo - Instructions for photo broadcast\n\n` +
            `📊 *Management:*\n` +
            `/stats - Group statistics\n` +
            `/groups - List all groups\n` +
            `/settings - Bot settings`,
            { parse_mode: 'Markdown' }
        );
    } else {
        bot.sendMessage(chatId, 'Hello! I am a group management bot. Contact admin for help.');
    }
});

// Error handling
bot.on('error', (error) => {
    console.log('Bot Error:', error);
});

console.log('🚀 Advanced Bot is running...');
