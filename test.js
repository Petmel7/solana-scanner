require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const chatId = process.env.TELEGRAM_CHAT_ID;

bot.telegram.sendMessage(chatId, "✅ Тестове повідомлення від Solana Scanner!")
    .then(() => console.log("✅ Повідомлення успішно відправлено!"))
    .catch(err => console.error("⚠️ Помилка:", err));






// require('dotenv').config();
// const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
// const { Telegraf } = require('telegraf');
// const axios = require('axios');

// const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
// const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// const telegramChatId = process.env.TELEGRAM_CHAT_ID;

// const MIN_HOLDERS = 5; // Мінімальна кількість холдерів
// const MAX_RAYDIUM_CHECKS = 3; // Обмеження перевірок Raydium
// const SUSPICIOUS_WORDS = ["pump", "scam", "test", "fake", "rug", "shib", "doge", "moon", "100x", "airdrop", "free", "elon"];
// const checkedTokens = new Set();

// // ✅ Функція затримки між запитами
// async function delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// // ✅ Функція `retry` для API-запитів
// async function fetchWithRetry(url, retries = 3) {
//     for (let i = 0; i < retries; i++) {
//         try {
//             const response = await axios.get(url);
//             return response.data;
//         } catch (error) {
//             if (error.response?.status === 429 && i < retries - 1) {
//                 console.warn(`⚠️ 429 Too Many Requests. Повторюємо... (${i + 1}/${retries})`);
//                 await delay(10000 * (i + 1)); // Динамічна затримка
//             } else if (error.response?.status === 404) {
//                 return null; // ✅ Ігноруємо 404 (токен просто не знайдено)
//             } else {
//                 console.error(`⚠️ Помилка запиту ${url}:`, error.message);
//                 return null;
//             }
//         }
//     }
// }

// // ✅ Отримати кількість власників токена (Solana RPC)
// async function getHoldersCount(tokenAddress) {
//     await delay(2000 + Math.random() * 3000); // Динамічна затримка 2-5 секунд
//     try {
//         const accounts = await connection.getTokenAccountsByOwner(new PublicKey(tokenAddress), {
//             programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
//         });
//         return accounts.value.length;
//     } catch (error) {
//         console.error(`⚠️ Помилка отримання власників для ${tokenAddress}:`, error.message);
//         return 0;
//     }
// }

// // ✅ Перевірка ліквідності на Raydium (обмежена)
// async function hasLiquidityOnRaydium(tokenAddress, checkCount) {
//     if (checkCount >= MAX_RAYDIUM_CHECKS) {
//         console.log(`⏳ Пропускаємо перевірку Raydium для ${tokenAddress}, бо перевірено ${MAX_RAYDIUM_CHECKS} токенів.`);
//         return false;
//     }

//     await delay(3000 + Math.random() * 5000); // Динамічна затримка 3-8 секунд
//     const url = `https://api.raydium.io/v2/sdk/liquidity/${tokenAddress}`;
//     const response = await fetchWithRetry(url);
//     return response && response.hasOwnProperty("lpMint");
// }

// // ✅ Сканування останніх 50 блоків
// async function scanForNewTokens() {
//     console.log("🔍 Сканування блокчейну...");

//     try {
//         const latestSlot = await connection.getSlot();
//         for (let slot = latestSlot; slot > latestSlot - 50; slot--) {
//             await delay(2000 + Math.random() * 3000);
//             const block = await connection.getBlock(slot, { maxSupportedTransactionVersion: 0 });

//             if (!block || !block.transactions) {
//                 console.log(`⚠️ Слот ${slot} порожній.`);
//                 continue;
//             }

//             console.log(`🔍 Сканування блоку: ${slot}, знайдено ${block.transactions.length} транзакцій`);
//             await processBlock(block);
//         }
//     } catch (error) {
//         console.error("⚠️ Загальна помилка:", error.message);
//     }
// }

// // ✅ Обробка знайдених токенів
// async function processBlock(block) {
//     let foundTokens = [];
//     let raydiumChecks = 0; // Лічильник перевірок на Raydium

//     for (const tx of block.transactions) {
//         if (!tx.meta || !tx.meta.postTokenBalances) continue;

//         for (const token of tx.meta.postTokenBalances) {
//             await delay(2000 + Math.random() * 3000);
//             try {
//                 if (!token.mint || checkedTokens.has(token.mint)) continue;
//                 checkedTokens.add(token.mint);

//                 const tokenAddress = token.mint;
//                 console.log(`🔎 Перевіряємо токен: ${tokenAddress}`);

//                 // ✅ Перевірка підозрілих назв
//                 if (SUSPICIOUS_WORDS.some(word => tokenAddress.toLowerCase().includes(word))) {
//                     console.log(`⚠️ Токен ${tokenAddress} має підозрілу назву. Пропускаємо.`);
//                     continue;
//                 }

//                 // ✅ Перевірка кількості холдерів
//                 const holdersCount = await getHoldersCount(tokenAddress);
//                 if (holdersCount < MIN_HOLDERS) {
//                     console.log(`⚠️ Токен ${tokenAddress} має лише ${holdersCount} холдерів. Пропускаємо.`);
//                     continue;
//                 }

//                 // ✅ Перевірка ліквідності (не перевіряємо всі токени)
//                 if (raydiumChecks < MAX_RAYDIUM_CHECKS) {
//                     const hasLiquidity = await hasLiquidityOnRaydium(tokenAddress, raydiumChecks);
//                     if (!hasLiquidity) {
//                         console.log(`⚠️ Токен ${tokenAddress} не має ліквідності. Пропускаємо.`);
//                         continue;
//                     }
//                     raydiumChecks++; // Збільшуємо лічильник перевірок Raydium
//                 }

//                 // ✅ Якщо токен пройшов всі перевірки – додаємо
//                 foundTokens.push(`🔹 **Адреса:** [${tokenAddress}](https://solscan.io/token/${tokenAddress})`);
//                 console.log(`✅ Додано до списку: ${tokenAddress}`);
//             } catch (err) {
//                 console.error(`⚠️ Помилка токена ${token.mint}:`, err.message);
//             }
//         }
//     }

//     // ✅ Надсилаємо список токенів в Telegram
//     if (foundTokens.length > 0) {
//         const message = `🚀 **Нові перспективні токени Solana!**\n\n${foundTokens.join("\n\n")}`;
//         await bot.telegram.sendMessage(telegramChatId, message, { parse_mode: "Markdown" });
//     } else {
//         console.log("ℹ️ Жодного вартого уваги токена не знайдено.");
//     }
// }

// // ✅ Запуск кожні 60 секунд
// setInterval(scanForNewTokens, 60000);
// bot.launch();
// console.log("✅ Сканер запущено...");