import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем переменные окружения с правильной обработкой кодировки
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  try {
    const buffer = readFileSync(envPath);
    let content;
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      // UTF-16 LE с BOM
      content = buffer.toString('utf16le').replace(/^\uFEFF/, '');
    } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      // UTF-16 BE с BOM
      const utf16le = Buffer.from(buffer);
      for (let i = 0; i < utf16le.length - 1; i += 2) {
        const byte1 = utf16le[i];
        const byte2 = utf16le[i + 1];
        utf16le[i] = byte2;
        utf16le[i + 1] = byte1;
      }
      content = utf16le.toString('utf16le').replace(/^\uFEFF/, '');
    } else {
      content = buffer.toString('utf8').replace(/^\uFEFF/, '');
    }
    const parsed = dotenv.parse(content);
    Object.assign(process.env, parsed);
  } catch (error) {
    console.warn('Ошибка при чтении .env файла, используется dotenv.config():', error.message);
    dotenv.config();
  }
} else {
  dotenv.config();
}

// Импортируем роуты
import authRoutes from './server/routes/auth.routes.js';
import cashRoutes from './server/routes/cash.routes.js';
import salaryRoutes from './server/routes/salary.routes.js';
import adminRoutes from './server/routes/admin.routes.js';

const app = express();
const PORT = process.env.PORT || 8880;

// Настройка доверия прокси для работы с туннелями (ngrok, cloudflared и т.д.)
// Это позволяет Express правильно обрабатывать заголовки X-Forwarded-*
app.set('trust proxy', true);

// Парсинг JSON тела запросов
app.use(express.json());
app.use(cookieParser());

// CORS настройки для всех запросов
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Обработка CORS для прокси
app.use('/api/moysklad', (req, res, next) => {
  // Добавляем CORS заголовки
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Обрабатываем preflight запросы
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// API роуты
app.use('/api/auth', authRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/admin', adminRoutes);

// Прокси для API МойСклад (для обратной совместимости, но теперь токен берется из БД на бэкенде)
app.use(
  '/api/moysklad',
  createProxyMiddleware({
    target: 'https://api.moysklad.ru',
    changeOrigin: true,
    secure: true,
    pathRewrite: {
      '^/api/moysklad': '/api/remap/1.2',
    },
    onProxyReq: (proxyReq, req, res) => {
      // Передаем заголовок Authorization из запроса клиента
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        proxyReq.setHeader('Authorization', authHeader);
      }
      // Удаляем заголовки, которые могут вызвать проблемы
      proxyReq.removeHeader('origin');
      proxyReq.removeHeader('referer');
      proxyReq.removeHeader('host');
      // Устанавливаем правильный Host для целевого сервера
      proxyReq.setHeader('Host', 'api.moysklad.ru');
    },
    onProxyRes: (proxyRes, req, res) => {
      // Удаляем заголовки CORS от целевого сервера (если есть)
      delete proxyRes.headers['access-control-allow-origin'];
      delete proxyRes.headers['access-control-allow-methods'];
      delete proxyRes.headers['access-control-allow-headers'];

      // Добавляем наши CORS заголовки
      proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Accept';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    },
    onError: (err, req, res) => {
      console.error('Прокси ошибка:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Ошибка прокси-сервера', message: err.message });
      }
    },
  })
);

// Обслуживание статических файлов
app.use(express.static(join(__dirname, 'dist')));

// Обработка всех остальных запросов - возвращаем index.html для SPA
app.get('*', (req, res) => {
  try {
    const indexPath = join(__dirname, 'dist', 'index.html');
    const indexContent = readFileSync(indexPath, 'utf-8');
    res.send(indexContent);
  } catch (error) {
    console.error('Ошибка при чтении index.html:', error);
    res.status(500).send('Ошибка сервера');
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  - Auth: /api/auth/*`);
  console.log(`  - Cash: /api/cash/*`);
  console.log(`  - Salary: /api/salary/*`);
  console.log(`  - Admin: /api/admin/*`);
  console.log(`  - Moysklad proxy: /api/moysklad`);
});

