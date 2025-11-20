import { verifyAccessToken } from '../config/jwt.js';
import { User } from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // Получаем токен из заголовка Authorization или из cookie
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req.cookies?.accessToken;
    
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : tokenFromCookie;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Загружаем пользователя из БД
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Добавляем пользователя в запрос
    req.user = {
      id: user.id,
      telegramId: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

