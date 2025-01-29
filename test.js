require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const chatId = process.env.TELEGRAM_CHAT_ID;

bot.telegram.sendMessage(chatId, "✅ Тестове повідомлення від Solana Scanner!")
    .then(() => console.log("✅ Повідомлення успішно відправлено!"))
    .catch(err => console.error("⚠️ Помилка:", err));
