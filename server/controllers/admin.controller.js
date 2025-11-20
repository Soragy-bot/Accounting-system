import { User } from '../models/User.js';
import { MoyskladSettings } from '../models/MoyskladSettings.js';
import { encrypt } from '../services/encryption.service.js';
import { MoyskladService } from '../services/moysklad.service.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMoyskladSettings = async (req, res) => {
  try {
    const settings = await MoyskladSettings.findLatest();
    
    if (!settings) {
      return res.json({ accessToken: '', storeId: null });
    }

    // Не возвращаем зашифрованный токен, только storeId
    res.json({
      id: settings.id,
      storeId: settings.store_id,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at,
    });
  } catch (error) {
    console.error('Get Moysklad settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const saveMoyskladSettings = async (req, res) => {
  try {
    const { accessToken, storeId } = req.body;
    const userId = req.user.id;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Шифруем токен перед сохранением
    const encryptedToken = encrypt(accessToken);

    // Сохраняем настройки
    const existingSettings = await MoyskladSettings.findLatest();
    let settings;
    
    if (existingSettings) {
      // Временно обновляем токен для проверки
      await MoyskladSettings.update(existingSettings.id, { encryptedToken });
      
      // Проверяем токен
      try {
        await MoyskladService.testConnection();
      } catch (error) {
        console.error('Token validation error:', error);
        // Откатываем изменения если токен невалидный
        await MoyskladSettings.update(existingSettings.id, { 
          encryptedToken: existingSettings.encrypted_token 
        });
        return res.status(400).json({ 
          error: error.message || 'Invalid access token' 
        });
      }
      
      // Если токен валидный, обновляем с storeId
      settings = await MoyskladSettings.update(existingSettings.id, {
        encryptedToken,
        storeId: storeId || null,
      });
    } else {
      // Создаем новые настройки
      settings = await MoyskladSettings.create({ 
        encryptedToken, 
        storeId: storeId || null, 
        createdBy: userId 
      });
      
      // Проверяем токен после создания
      try {
        await MoyskladService.testConnection();
      } catch (error) {
        console.error('Token validation error:', error);
        // Удаляем настройки если токен невалидный
        await MoyskladSettings.delete(settings.id);
        return res.status(400).json({ 
          error: error.message || 'Invalid access token' 
        });
      }
    }

    res.json({
      id: settings.id,
      storeId: settings.store_id,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at,
    });
  } catch (error) {
    console.error('Save Moysklad settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStores = async (req, res) => {
  try {
    const stores = await MoyskladService.getStores();
    res.json(stores);
  } catch (error) {
    console.error('Get stores error:', error);
    if (error.message === 'Moysklad settings not configured') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const testConnection = async (req, res) => {
  try {
    await MoyskladService.testConnection();
    res.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(400).json({ 
      error: error.message || 'Connection test failed' 
    });
  }
};

