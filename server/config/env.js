import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Читаем .env файл с правильной кодировкой
const envPath = join(__dirname, '../../.env');
if (existsSync(envPath)) {
    try {
        // Читаем файл как буфер, чтобы определить кодировку
        const buffer = readFileSync(envPath);

        // Определяем кодировку по BOM
        let content;
        if (buffer[0] === 0xff && buffer[1] === 0xfe) {
            // UTF-16 LE с BOM - конвертируем в UTF-8
            content = buffer.toString('utf16le').replace(/^\uFEFF/, '');
        } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
            // UTF-16 BE с BOM - конвертируем в UTF-8
            const utf16le = Buffer.from(buffer);
            for (let i = 0; i < utf16le.length - 1; i += 2) {
                const byte1 = utf16le[i];
                const byte2 = utf16le[i + 1];
                utf16le[i] = byte2;
                utf16le[i + 1] = byte1;
            }
            content = utf16le.toString('utf16le').replace(/^\uFEFF/, '');
        } else {
            // UTF-8 или без BOM
            content = buffer.toString('utf8').replace(/^\uFEFF/, '');
        }

        // Парсим содержимое через dotenv
        const parsed = dotenv.parse(content);
        Object.assign(process.env, parsed);
    } catch (error) {
        console.warn('Ошибка при чтении .env файла, используется dotenv.config():', error.message);
        dotenv.config();
    }
} else {
    dotenv.config();
}

export const config = {
    port: process.env.PORT || 8880,
    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/accounting_db',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
        accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
    encryption: {
        key: process.env.ENCRYPTION_KEY || 'your-encryption-key-32-chars-long!!',
        algorithm: 'aes-256-cbc',
    },
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        clientId: process.env.TELEGRAM_CLIENT_ID || '',
        clientSecret: process.env.TELEGRAM_CLIENT_SECRET || '',
        domain: process.env.TELEGRAM_DOMAIN || '',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    },
};

