import { logger } from './logger';

/**
 * Проверяет доступность localStorage
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    
    // Пытаемся записать и прочитать тестовое значение
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    // localStorage недоступен (например, в приватном режиме)
    return false;
  }
};

/**
 * Безопасно получает значение из localStorage
 */
export const safeGetItem = (key: string): string | null => {
  if (!isLocalStorageAvailable()) {
    logger.warn(`localStorage недоступен, не удалось получить значение для ключа: ${key}`);
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    logger.error(`Ошибка при чтении из localStorage (ключ: ${key}):`, error);
    return null;
  }
};

/**
 * Безопасно сохраняет значение в localStorage
 */
export const safeSetItem = (key: string, value: string): boolean => {
  if (!isLocalStorageAvailable()) {
    logger.warn(`localStorage недоступен, не удалось сохранить значение для ключа: ${key}`);
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    logger.error(`Ошибка при записи в localStorage (ключ: ${key}):`, error);
    
    // Если ошибка из-за переполнения, пытаемся очистить старые данные
    if (error instanceof DOMException && error.code === 22) {
      logger.warn('localStorage переполнен, попробуйте очистить старые данные');
    }
    
    return false;
  }
};

/**
 * Безопасно удаляет значение из localStorage
 */
export const safeRemoveItem = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    logger.warn(`localStorage недоступен, не удалось удалить значение для ключа: ${key}`);
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    logger.error(`Ошибка при удалении из localStorage (ключ: ${key}):`, error);
    return false;
  }
};

/**
 * Безопасно очищает весь localStorage
 */
export const safeClear = (): boolean => {
  if (!isLocalStorageAvailable()) {
    logger.warn('localStorage недоступен, не удалось очистить хранилище');
    return false;
  }

  try {
    window.localStorage.clear();
    return true;
  } catch (error) {
    logger.error('Ошибка при очистке localStorage:', error);
    return false;
  }
};

/**
 * Получает объект из localStorage с парсингом JSON
 */
export const getJsonItem = <T>(key: string, defaultValue: T | null = null): T | null => {
  const item = safeGetItem(key);
  if (item === null) {
    return defaultValue;
  }

  try {
    return JSON.parse(item) as T;
  } catch (error) {
    logger.error(`Ошибка при парсинге JSON из localStorage (ключ: ${key}):`, error);
    return defaultValue;
  }
};

/**
 * Сохраняет объект в localStorage с сериализацией в JSON
 */
export const setJsonItem = <T>(key: string, value: T): boolean => {
  try {
    const serialized = JSON.stringify(value);
    return safeSetItem(key, serialized);
  } catch (error) {
    logger.error(`Ошибка при сериализации JSON в localStorage (ключ: ${key}):`, error);
    return false;
  }
};

