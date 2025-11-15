import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8880;

// Парсинг JSON тела запросов
app.use(express.json());

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

// Прокси для API МойСклад
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
  console.log(`Прокси для API МойСклад: /api/moysklad`);
});

