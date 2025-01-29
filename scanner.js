require('dotenv').config();
const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
const { Telegraf } = require('telegraf');

// ✅ Встановлюємо рівень підтвердження "confirmed"
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

// ✅ ID програми для токенів у Solana (Token Program)
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

async function scanForNewTokens() {
    console.log('🔍 Сканування блокчейну Solana...');

    try {
        // ✅ Отримуємо останній доступний блок
        const latestBlock = await connection.getLatestBlockhash();
        const block = await connection.getBlock(latestBlock.lastValidBlockHeight, {
            maxSupportedTransactionVersion: 0
        });

        // console.log('✅latestBlock', latestBlock);
        // console.log('✅block', block);

        if (!block || !block.transactions) {
            console.log('⚠️ Блок порожній або транзакції не знайдено.');
            return;
        }

        let foundTokens = 0;

        for (const tx of block.transactions) {
            if (!tx.transaction?.message?.instructions) continue;

            for (const ix of tx.transaction.message.instructions) {
                if (ix.programId?.toBase58() === TOKEN_PROGRAM_ID) {
                    try {
                        if (!ix.keys || ix.keys.length === 0) continue;

                        const tokenAddress = new PublicKey(ix.keys[0].pubkey).toBase58();
                        const tokenSupply = await connection.getTokenSupply(new PublicKey(tokenAddress));

                        if (tokenSupply.value.uiAmount > 100) { // Фільтр: токени з supply > 100
                            await bot.telegram.sendMessage(
                                telegramChatId,
                                `🚀 Новий токен у Solana!\nАдреса: ${tokenAddress}\nSupply: ${tokenSupply.value.uiAmount}`
                            );
                            console.log(`✅ Надіслано сповіщення про токен: ${tokenAddress}`);
                            foundTokens++;
                        }
                    } catch (err) {
                        console.error('⚠️ Помилка при обробці токена:', err.message);
                    }
                }
            }
        }

        if (foundTokens === 0) {
            console.log('ℹ️ Нових токенів не знайдено.');
        }
    } catch (error) {
        console.error('⚠️ Помилка під час отримання блоку:', error.message);
    }
}

// Запуск сканера кожні 60 секунд
setInterval(scanForNewTokens, 60000);
bot.launch();
console.log('✅ Сканер запущено...');
