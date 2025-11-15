import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/moysklad': {
        target: 'https://api.moysklad.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/moysklad/, '/api/remap/1.2'),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Сохраняем все заголовки из исходного запроса
            const authHeader = req.headers['authorization'];
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
            // Удаляем заголовки, которые могут вызвать проблемы с CORS
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('host');
            // Добавляем заголовок Host для целевого сервера
            proxyReq.setHeader('Host', 'api.moysklad.ru');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Добавляем CORS заголовки к ответу
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
            proxyRes.headers['access-control-allow-credentials'] = 'true';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Authorization, Content-Type';
          });
        },
      },
    },
  },
})

