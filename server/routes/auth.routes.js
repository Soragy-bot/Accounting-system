import express from 'express';
import {
  telegramAuth,
  telegramCallback,
  refreshToken,
  logout,
  getMe,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import cookieParser from 'cookie-parser';

const router = express.Router();

// Используем cookie-parser для чтения cookies
router.use(cookieParser());

// Публичные роуты
router.get('/telegram', telegramAuth);
router.get('/telegram/callback', telegramCallback);
router.post('/refresh', refreshToken);

// Защищенные роуты
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

export default router;

