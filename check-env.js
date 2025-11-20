import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Проверка переменных окружения ===\n');

// Проверяем .env файл
const envPath = join(__dirname, '.env');
console.log('Путь к .env файлу:', envPath);
console.log('Файл существует:', existsSync(envPath) ? '✓ ДА' : '✗ НЕТ\n');

if (existsSync(envPath)) {
  try {
    const buffer = readFileSync(envPath);
    let content;
    
    // Определяем кодировку
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      content = buffer.toString('utf16le').replace(/^\uFEFF/, '');
      console.log('Кодировка: UTF-16 LE\n');
    } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      const utf16le = Buffer.from(buffer);
      for (let i = 0; i < utf16le.length - 1; i += 2) {
        const byte1 = utf16le[i];
        const byte2 = utf16le[i + 1];
        utf16le[i] = byte2;
        utf16le[i + 1] = byte1;
      }
      content = utf16le.toString('utf16le').replace(/^\uFEFF/, '');
      console.log('Кодировка: UTF-16 BE\n');
    } else {
      content = buffer.toString('utf8').replace(/^\uFEFF/, '');
      console.log('Кодировка: UTF-8\n');
    }
    
    // Парсим
    const parsed = dotenv.parse(content);
    
    // Очищаем значения
    Object.keys(parsed).forEach(key => {
      let value = parsed[key];
      if (typeof value === 'string') {
        value = value.trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        parsed[key] = value;
      }
    });
    
    console.log('Всего переменных в .env:', Object.keys(parsed).length);
    console.log('\nПеременные Telegram:');
    const telegramKeys = Object.keys(parsed).filter(k => k.includes('TELEGRAM'));
    if (telegramKeys.length === 0) {
      console.log('  ✗ Переменные Telegram не найдены');
    } else {
      telegramKeys.forEach(key => {
        const value = parsed[key];
        if (key.includes('SECRET') || key.includes('TOKEN')) {
          console.log(`  ${key}: ${value ? '✓ установлен (' + value.length + ' символов)' : '✗ не установлен'}`);
        } else {
          console.log(`  ${key}: ${value ? '✓ "' + value + '"' : '✗ не установлен'}`);
        }
      });
    }
    
    console.log('\nПроверка TELEGRAM_DOMAIN:');
    if (parsed.TELEGRAM_DOMAIN) {
      console.log('  ✓ Найден:', `"${parsed.TELEGRAM_DOMAIN}"`);
      console.log('  Длина:', parsed.TELEGRAM_DOMAIN.length);
      console.log('  После trim:', `"${parsed.TELEGRAM_DOMAIN.trim()}"`);
      if (parsed.TELEGRAM_DOMAIN.trim() === '') {
        console.log('  ⚠ ВНИМАНИЕ: Значение пустое после trim!');
      }
    } else {
      console.log('  ✗ НЕ НАЙДЕН');
      console.log('  Проверьте, что в .env файле есть строка:');
      console.log('  TELEGRAM_DOMAIN=your-domain.com');
    }
    
  } catch (error) {
    console.error('Ошибка при чтении .env файла:', error.message);
  }
} else {
  console.log('Создайте файл .env в корне проекта с переменными окружения.');
}

console.log('\n=== Конец проверки ===');

