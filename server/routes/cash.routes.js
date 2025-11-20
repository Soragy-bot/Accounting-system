import express from 'express';
import {
  calculate,
  saveEntry,
  getHistory,
  deleteEntry,
} from '../controllers/cash.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Все роуты требуют авторизации
router.use(authMiddleware);

router.post('/calculate', calculate);
router.post('/entries', saveEntry);
router.get('/history', getHistory);
router.delete('/entries/:id', deleteEntry);

export default router;

