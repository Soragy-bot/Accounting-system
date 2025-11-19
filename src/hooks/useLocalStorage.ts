import { useState, useEffect, useCallback } from 'react';
import { getJsonItem, setJsonItem, safeRemoveItem } from '../utils/localStorage';
import { logger } from '../utils/logger';

/**
 * Хук для работы с localStorage
 * 
 * @param key - Ключ для хранения в localStorage
 * @param initialValue - Начальное значение, если в localStorage нет данных
 * @returns Кортеж [значение, функция установки значения, функция удаления]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Инициализируем состояние начальным значением
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = getJsonItem<T>(key);
      // Если значение найдено в localStorage, используем его
      // Иначе используем начальное значение
      return item !== null ? item : initialValue;
    } catch (error) {
      logger.error(`Ошибка при инициализации useLocalStorage (ключ: ${key}):`, error);
      return initialValue;
    }
  });

  // Функция для установки значения
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Поддерживаем функциональное обновление состояния
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Сохраняем в состояние
        setStoredValue(valueToStore);
        
        // Сохраняем в localStorage
        setJsonItem(key, valueToStore);
      } catch (error) {
        logger.error(`Ошибка при установке значения в useLocalStorage (ключ: ${key}):`, error);
      }
    },
    [key, storedValue]
  );

  // Функция для удаления значения
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      safeRemoveItem(key);
    } catch (error) {
      logger.error(`Ошибка при удалении значения из useLocalStorage (ключ: ${key}):`, error);
    }
  }, [key, initialValue]);

  // Синхронизируем изменения в других вкладках
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue) as T;
          setStoredValue(newValue);
        } catch (error) {
          logger.error(`Ошибка при синхронизации useLocalStorage (ключ: ${key}):`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        // Значение было удалено в другой вкладке
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

