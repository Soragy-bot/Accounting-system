import express from 'express';
import {
  getUsers,
  getMoyskladSettings,
  saveMoyskladSettings,
  getStores,
  testConnection,
} from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = express.Router();

// Все роуты требуют авторизации и прав админа
router.use(authMiddleware);
router.use(requireAdmin);

router.get('/users', getUsers);
router.get('/moysklad-settings', getMoyskladSettings);
router.post('/moysklad-settings', saveMoyskladSettings);
router.get('/moysklad-stores', getStores);
router.post('/moysklad-test', testConnection);

export default router;

