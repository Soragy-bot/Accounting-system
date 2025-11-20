import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Читаем .env файл с правильной кодировкой
const envPath = join(__dirname, '../../.env');
console.log('Ищем .env файл по пути:', envPath);
if (existsSync(envPath)) {
    console.log('✓ .env файл найден');
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

        // Очищаем значения от кавычек и пробелов
        Object.keys(parsed).forEach(key => {
            let value = parsed[key];
            // Удаляем кавычки в начале и конце, если они есть
            if (typeof value === 'string') {
                value = value.trim();
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                parsed[key] = value;
            }
        });

        Object.assign(process.env, parsed);

        // Логируем загруженные переменные Telegram (без секретов) для отладки
        if (parsed.TELEGRAM_DOMAIN) {
            console.log('✓ TELEGRAM_DOMAIN загружен из .env:', parsed.TELEGRAM_DOMAIN);
            console.log('  Длина значения:', parsed.TELEGRAM_DOMAIN.length);
        } else {
            console.warn('⚠ TELEGRAM_DOMAIN не найден в .env файле');
            console.warn('  Доступные ключи в .env:', Object.keys(parsed).filter(k => k.includes('TELEGRAM')).join(', ') || 'нет');
        }
    } catch (error) {
        console.warn('Ошибка при чтении .env файла, используется dotenv.config():', error.message);
        dotenv.config();
    }
} else {
    console.warn('⚠ .env файл не найден по пути:', envPath);
    console.warn('  Используется dotenv.config() для поиска .env в корне проекта');
    dotenv.config();
}

// Функция для безопасного получения переменной окружения с удалением пробелов
const getEnv = (key, defaultValue = '') => {
    const value = process.env[key];
    if (value === undefined || value === null) {
        return defaultValue;
    }
    return String(value).trim();
};

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
        botToken: getEnv('TELEGRAM_BOT_TOKEN'),
        clientId: getEnv('TELEGRAM_CLIENT_ID'),
        clientSecret: getEnv('TELEGRAM_CLIENT_SECRET'),
        domain: getEnv('TELEGRAM_DOMAIN'),
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    },
};

// Логируем конфигурацию Telegram при загрузке (без секретов)
if (config.telegram.domain) {
    console.log('✓ Telegram конфигурация загружена. Домен:', config.telegram.domain);
    console.log('✓ Client ID:', config.telegram.clientId ? 'установлен' : 'не установлен');
} else {
    console.warn('⚠ TELEGRAM_DOMAIN не настроен в конфигурации');
    console.warn('  Проверьте, что переменная TELEGRAM_DOMAIN установлена в .env файле');
}

