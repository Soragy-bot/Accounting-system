import express from 'express';
import {
  calculate,
  getMoyskladData,
  saveCalculation,
  getHistory,
  deleteCalculation,
} from '../controllers/salary.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Все роуты требуют авторизации
router.use(authMiddleware);

router.post('/calculate', calculate);
router.get('/moysklad-data', getMoyskladData);
router.post('/calculations', saveCalculation);
router.get('/history', getHistory);
router.delete('/calculations/:id', deleteCalculation);

export default router;

