import { User } from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../config/jwt.js';
import { config } from '../config/env.js';
import crypto from 'crypto';

export class AuthService {
  static async validateTelegramAuth(authData) {
    // Валидация данных от Telegram OAuth
    // Telegram отправляет данные в формате: id, first_name, last_name, username, photo_url, auth_date, hash
    
    const { id, first_name, last_name, username, auth_date, hash } = authData;
    
    if (!id || !auth_date || !hash) {
      throw new Error('Invalid Telegram auth data');
    }

    // Проверка времени (не старше 24 часов)
    const authDate = parseInt(auth_date, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authDate > 86400) {
      throw new Error('Telegram auth data expired');
    }

    // Валидация hash (для production нужно реализовать проверку подписи)
    // Здесь упрощенная версия - в production нужно проверять подпись через секрет бота
    
    return {
      telegramId: id.toString(),
      firstName: first_name || null,
      lastName: last_name || null,
      username: username || null,
    };
  }

  static async findOrCreateUser(telegramData) {
    const { telegramId, firstName, lastName, username } = telegramData;
    
    let user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      // Первый пользователь становится админом
      const userCount = (await User.findAll()).length;
      const role = userCount === 0 ? 'admin' : 'user';
      
      user = await User.create({
        telegramId,
        username,
        firstName,
        lastName,
        role,
      });
    } else {
      // Обновляем данные пользователя если они изменились
      const updates = {};
      if (username !== user.username) updates.username = username;
      if (firstName !== user.first_name) updates.firstName = firstName;
      if (lastName !== user.last_name) updates.lastName = lastName;
      
      if (Object.keys(updates).length > 0) {
        user = await User.update(user.id, updates);
      }
    }
    
    return user;
  }

  static async generateTokens(user) {
    const payload = {
      id: user.id,
      telegramId: user.telegram_id,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    };
  }

  static async refreshTokens(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new Error('User not found');
    }

    return await this.generateTokens(user);
  }
}

