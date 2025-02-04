
require('dotenv').config();
const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
const { Telegraf } = require('telegraf');
const axios = require('axios');

const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

const MIN_HOLDERS = 10; // Мінімальна кількість холдерів
const SUSPICIOUS_WORDS = ["pump", "scam", "test", "fake", "rug", "shib", "doge", "moon", "100x", "airdrop", "free", "elon"];
const checkedTokens = new Set();

// ✅ Функція затримки між запитами
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ✅ Отримати кількість власників токена (Solana RPC)
async function getHoldersCount(tokenAddress) {
    await delay(2000 + Math.random() * 3000);
    try {
        const accounts = await connection.getTokenAccountsByOwner(new PublicKey(tokenAddress), {
            programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        });
        return accounts.value.length;
    } catch (error) {
        console.error(`⚠️ Помилка отримання власників для ${tokenAddress}:`, error.message);
        return 0;
    }
}

// ✅ Сканування останніх 50 блоків
async function scanForNewTokens() {
    console.log("🔍 Сканування блокчейну...");

    try {
        const latestSlot = await connection.getSlot();
        for (let slot = latestSlot; slot > latestSlot - 50; slot--) {
            await delay(2000 + Math.random() * 3000);
            const block = await connection.getBlock(slot, { maxSupportedTransactionVersion: 0 });

            if (!block || !block.transactions) {
                console.log(`⚠️ Слот ${slot} порожній.`);
                continue;
            }

            console.log(`🔍 Сканування блоку: ${slot}, знайдено ${block.transactions.length} транзакцій`);
            await processBlock(block);
        }
    } catch (error) {
        console.error("⚠️ Загальна помилка:", error.message);
    }
}

// ✅ Обробка знайдених токенів
async function processBlock(block) {
    for (const tx of block.transactions) {
        if (!tx.meta || !tx.meta.postTokenBalances) continue;

        for (const token of tx.meta.postTokenBalances) {
            await delay(2000 + Math.random() * 3000);
            try {
                if (!token.mint || checkedTokens.has(token.mint)) continue;
                checkedTokens.add(token.mint);

                const tokenAddress = token.mint;
                console.log(`🔎 Перевіряємо токен: ${tokenAddress}`);

                // ✅ Перевірка підозрілих назв
                if (SUSPICIOUS_WORDS.some(word => tokenAddress.toLowerCase().includes(word))) {
                    console.log(`⚠️ Токен ${tokenAddress} має підозрілу назву. Пропускаємо.`);
                    continue;
                }

                // ✅ Перевірка кількості холдерів
                const holdersCount = await getHoldersCount(tokenAddress);
                if (holdersCount < MIN_HOLDERS) {
                    console.log(`⚠️ Токен ${tokenAddress} має лише ${holdersCount} холдерів. Пропускаємо.`);
                    continue;
                }

                // ✅ Надсилання повідомлення для кожного токена окремо
                const message = `🚀 **Новий токен знайдено!**\n\n🔹 **Адреса:** [${tokenAddress}](https://solscan.io/token/${tokenAddress})`;
                await bot.telegram.sendMessage(telegramChatId, message, { parse_mode: "Markdown" });

                console.log(`✅ Надіслано в Telegram: ${tokenAddress}`);

            } catch (err) {
                console.error(`⚠️ Помилка токена ${token.mint}:`, err.message);
            }
        }
    }
}

// ✅ Запуск кожні 60 секунд
setInterval(scanForNewTokens, 60000);
bot.launch();
console.log("✅ Сканер запущено...");
