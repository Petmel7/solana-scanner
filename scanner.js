// require('dotenv').config();
// const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
// const { Telegraf } = require('telegraf');

// const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
// const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// const telegramChatId = process.env.TELEGRAM_CHAT_ID;

// // Solana Token Program
// const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

// async function delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// async function scanForNewTokens() {
//     console.log('🔍 Сканування блокчейну Solana...');

//     try {
//         const latestSlot = await connection.getSlot();

//         for (let slot = latestSlot; slot > latestSlot - 1; slot--) { // Перевіряємо кожен 5-й блок
//             await delay(1000); // Затримка 1 секунда перед запитом

//             try {
//                 const block = await connection.getBlock(slot, {
//                     maxSupportedTransactionVersion: 0
//                 });

//                 if (!block || !block.transactions) {
//                     console.log(`⚠️ Слот ${slot} пропущено або порожній.`);
//                     continue;
//                 }

//                 await processBlock(block);
//             } catch (error) {
//                 console.error(`⚠️ Помилка отримання блоку ${slot}: ${error.message}`);
//                 continue;
//             }
//         }
//     } catch (error) {
//         console.error('⚠️ Загальна помилка:', error.message);
//     }
// }

// async function processBlock(block) {
//     let foundTokens = 0;

//     for (const tx of block.transactions) {
//         if (!tx.meta || !tx.meta.postTokenBalances) continue; // Перевіряємо наявність токенів

//         for (const token of tx.meta.postTokenBalances) {
//             try {
//                 if (!token.mint) continue; // Пропускаємо, якщо немає адреси токена

//                 const tokenAddress = token.mint;
//                 const tokenSupply = await connection.getTokenSupply(new PublicKey(tokenAddress));

//                 if (!tokenSupply.value) continue; // Перевірка, чи є supply
//                 const supply = tokenSupply.value.uiAmount;

//                 if (supply > 100) { // Додаємо всі токени з supply > 0
//                     await delay(1000);
//                     await bot.telegram.sendMessage(
//                         telegramChatId,
//                         `🚀 Новий токен у Solana!\nАдреса: ${tokenAddress}\nSupply: ${supply}`
//                     );
//                     console.log(`✅ Надіслано сповіщення про токен: ${tokenAddress}`);
//                     foundTokens++;
//                 }
//             } catch (err) {
//                 console.error('⚠️ Помилка при обробці токена:', err.message);
//             }
//         }
//     }

//     if (foundTokens === 0) {
//         console.log('ℹ️ Нових токенів не знайдено.');
//     }
// }

// // Запуск сканера кожні 60 секунд
// setInterval(scanForNewTokens, 60000);
// bot.launch();
// console.log('✅ Сканер запущено...');








// require('dotenv').config();
// const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
// const { Telegraf } = require('telegraf');
// const axios = require('axios');

// const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
// const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// const telegramChatId = process.env.TELEGRAM_CHAT_ID;

// const MIN_SUPPLY = 10000; // Мінімальний supply, щоб токен вважався "вартим уваги"
// const SUSPICIOUS_WORDS = ["pump", "scam", "test", "fake", "rug"];

// // Кеш для перевірених токенів
// const checkedTokens = new Set();

// async function delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// // ✅ Перевірка, чи токен є на CoinGecko
// async function isTokenListed(tokenAddress) {
//     try {
//         await delay(2000); // ⏳ Запобігаємо перевантаженню API
//         const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
//             params: { vs_currency: "usd", per_page: 250, page: 1 }
//         });
//         return response.data.some(coin => coin.platforms?.solana === tokenAddress);
//     } catch (error) {
//         console.error("⚠️ Помилка при перевірці CoinGecko:", error.message);
//         return false;
//     }
// }

// // ✅ Перевірка, чи у токена є багато власників
// async function hasManyHolders(tokenAddress) {
//     try {
//         await delay(2000); // ⏳ Затримка перед запитом
//         const accounts = await connection.getTokenLargestAccounts(new PublicKey(tokenAddress));
//         return accounts.value.length > 10; // Якщо більше 10 власників, токен вважається популярним
//     } catch (error) {
//         console.error("⚠️ Помилка при отриманні власників токена:", error.message);
//         return false;
//     }
// }

// // ✅ Основний сканер блокчейну
// async function scanForNewTokens() {
//     console.log("🔍 Сканування блокчейну Solana...");

//     try {
//         const latestSlot = await connection.getSlot(); // Отримуємо останній слот
//         await delay(1000); // ⏳ Затримка перед запитом
//         const block = await connection.getBlock(latestSlot, { maxSupportedTransactionVersion: 0 });

//         if (!block || !block.transactions) {
//             console.log(`⚠️ Слот ${latestSlot} порожній.`);
//             return;
//         }

//         await processBlock(block);
//     } catch (error) {
//         console.error("⚠️ Загальна помилка:", error.message);
//     }
// }

// // ✅ Обробка знайдених токенів
// async function processBlock(block) {
//     let foundTokens = [];

//     for (const tx of block.transactions) {
//         if (!tx.meta || !tx.meta.postTokenBalances) continue;

//         for (const token of tx.meta.postTokenBalances) {
//             try {
//                 if (!token.mint || checkedTokens.has(token.mint)) continue;

//                 checkedTokens.add(token.mint); // ✅ Додаємо в кеш, щоб не перевіряти двічі
//                 const tokenAddress = token.mint;

//                 await delay(2000); // ⏳ Затримка перед запитом
//                 const tokenSupply = await connection.getTokenSupply(new PublicKey(tokenAddress));

//                 if (!tokenSupply.value) continue;
//                 const supply = tokenSupply.value.uiAmount;

//                 // 🛑 Фільтр: відкидаємо токени з малим supply
//                 if (supply < MIN_SUPPLY) continue;

//                 // 🛑 Фільтр: відкидаємо підозрілі назви
//                 if (SUSPICIOUS_WORDS.some(word => tokenAddress.toLowerCase().includes(word))) continue;

//                 // 🛑 Фільтр: перевіряємо на CoinGecko
//                 const listed = await isTokenListed(tokenAddress);

//                 // 🛑 Фільтр: перевіряємо кількість власників
//                 const hasHolders = await hasManyHolders(tokenAddress);

//                 if (listed || hasHolders) {
//                     foundTokens.push(`🔹 **Адреса:** [${tokenAddress}](https://solscan.io/token/${tokenAddress})\nSupply: ${supply}`);
//                     console.log(`✅ Додано до списку: ${tokenAddress}`);
//                 }
//             } catch (err) {
//                 console.error("⚠️ Помилка при обробці токена:", err.message);
//             }
//         }
//     }

//     if (foundTokens.length > 0) {
//         const message = `🚀 **Нові перспективні токени Solana!**\n\n${foundTokens.join("\n\n")}`;
//         await bot.telegram.sendMessage(telegramChatId, message, { parse_mode: "Markdown" });
//     } else {
//         console.log("ℹ️ Жодного вартого уваги токена не знайдено.");
//     }
// }

// // ✅ Запуск сканера кожні 60 секунд
// setInterval(scanForNewTokens, 60000);
// bot.launch();
// console.log("✅ Сканер запущено...");





require('dotenv').config();
const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
const { Telegraf } = require('telegraf');
const axios = require('axios');

const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const telegramChatId = process.env.TELEGRAM_CHAT_ID;
// const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

const MIN_SUPPLY = 10000; // Мінімальний supply
const SUSPICIOUS_WORDS = ["pump", "scam", "test", "fake", "rug"];

// ✅ Прибираємо getTokenLargestAccounts (тимчасово)
async function hasManyHolders(tokenAddress) {
    return true; // Вважаємо, що всі токени мають власників
}

// ✅ Затримка перед запитами
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// // ✅ Перевірка в CoinGecko
// const checkedCoinGecko = new Set();

// async function isTokenListed(tokenAddress) {
//     if (checkedCoinGecko.has(tokenAddress)) return true; // ✅ Якщо токен уже перевірений, повертаємо true

//     try {
//         await delay(5000);
//         const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&", {
//             params: {
//                 x_cg_demo_api_key: COINGECKO_API_KEY
//             }
//         });

//         console.log('✅ response', response);

//         const listed = response.data.some(coin => coin.platforms?.solana === tokenAddress);
//         if (listed) checkedCoinGecko.add(tokenAddress); // ✅ Додаємо в кеш
//         return listed;
//     } catch (error) {
//         console.error("⚠️ CoinGecko помилка:", error.message);
//         return false;
//     }
// }

const checkedCoinGecko = new Set();
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY; // ✅ Беремо ключ із .env

async function isTokenListed(tokenAddress) {
    if (checkedCoinGecko.has(tokenAddress)) return true; // ✅ Якщо токен уже перевірений, повертаємо true

    try {
        await delay(5000);
        const response = await axios.get("https://api.coingecko.com/api/v3/coins/list", {
            params: {
                x_cg_demo_api_key: COINGECKO_API_KEY // ✅ Додаємо API-ключ у параметри
            }
        });

        console.log("✅ API-відповідь CoinGecko:", response.data);

        const listed = response.data.some(coin => coin.platforms?.solana === tokenAddress);
        if (listed) checkedCoinGecko.add(tokenAddress); // ✅ Додаємо в кеш
        return listed;
    } catch (error) {
        console.error("⚠️ CoinGecko помилка:", error.response?.data || error.message);
        return false;
    }
}

// async function isTokenListed(tokenAddress) {
//     try {
//         await delay(5000);
//         const response = await axios.get(`https://api.coingecko.com/api/v3/coins/markets`, {
//             params: {
//                 vs_currency: "usd",
//                 ids: "solana",
//                 x_cg_demo_api_key: COINGECKO_API_KEY // ✅ Додаємо ключ у параметри
//             }
//         });

//         console.log("✅ API-відповідь CoinGecko:", response.data);
//         return response.data.some(coin => coin.platforms?.solana === tokenAddress);
//     } catch (error) {
//         console.error("⚠️ CoinGecko помилка:", error.response?.data || error.message);
//         return false;
//     }
// }

// ✅ Основний сканер
async function scanForNewTokens() {
    console.log("🔍 Сканування блокчейну...");

    try {
        const latestSlot = await connection.getSlot();
        await delay(5000); // Затримка перед запитом
        const block = await connection.getBlock(latestSlot, { maxSupportedTransactionVersion: 0 });

        if (!block || !block.transactions) {
            console.log(`⚠️ Слот ${latestSlot} порожній.`);
            return;
        }

        await processBlock(block);
    } catch (error) {
        console.error("⚠️ Загальна помилка:", error.message);
    }
}

// ✅ Обробка знайдених токенів
async function processBlock(block) {
    let foundTokens = [];

    for (const tx of block.transactions) {
        if (!tx.meta || !tx.meta.postTokenBalances || tx.meta.postTokenBalances.length === 0) continue;

        const token = tx.meta.postTokenBalances[0]; // ✅ Беремо тільки перший токен у транзакції

        try {
            if (!token.mint) continue;

            const tokenAddress = token.mint;

            await delay(5000); // ⏳ Затримка перед RPC-запитом
            const tokenSupply = await connection.getTokenSupply(new PublicKey(tokenAddress));

            if (!tokenSupply.value) continue;
            const supply = tokenSupply.value.uiAmount;

            // 🛑 Фільтр: мінімальний supply
            if (supply < MIN_SUPPLY) continue;

            // 🛑 Фільтр: підозрілі слова
            if (SUSPICIOUS_WORDS.some(word => tokenAddress.toLowerCase().includes(word))) continue;

            // 🛑 Фільтр: перевіряємо в CoinGecko
            const listed = await isTokenListed(tokenAddress);

            if (listed) {
                foundTokens.push(`🔹 **Адреса:** [${tokenAddress}](https://solscan.io/token/${tokenAddress})\nSupply: ${supply}`);
                console.log(`✅ Додано до списку: ${tokenAddress}`);
            }
        } catch (err) {
            console.error("⚠️ Помилка токена:", err.message);
        }
    }

    if (foundTokens.length > 0) {
        const message = `🚀 **Нові перспективні токени Solana!**\n\n${foundTokens.join("\n\n")}`;
        await bot.telegram.sendMessage(telegramChatId, message, { parse_mode: "Markdown" });
    } else {
        console.log("ℹ️ Жодного вартого уваги токена не знайдено.");
    }
}

// ✅ Запуск кожні 60 секунд
setInterval(scanForNewTokens, 60000);
bot.launch();
console.log("✅ Сканер запущено...");
