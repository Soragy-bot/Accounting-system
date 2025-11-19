import { CashEntry } from '../types';
import { getJsonItem, setJsonItem, safeRemoveItem } from './localStorage';
import { HISTORY_LIMIT } from '../constants';
import { logger } from './logger';

const STORAGE_KEY = 'cash-counter-history';

export const saveHistoryEntry = (entry: CashEntry): void => {
  const history = getHistory();
  history.unshift(entry);
  // Сохраняем только последние записи согласно лимиту
  const limitedHistory = history.slice(0, HISTORY_LIMIT);
  setJsonItem(STORAGE_KEY, limitedHistory);
};

export const getHistory = (): CashEntry[] => {
  const history = getJsonItem<CashEntry[]>(STORAGE_KEY, []);
  // Валидация структуры данных
  if (!Array.isArray(history)) {
    logger.warn('История кассы имеет неверный формат, возвращаем пустой массив');
    return [];
  }
  return history;
};

export const clearHistory = (): void => {
  safeRemoveItem(STORAGE_KEY);
};

export const deleteHistoryEntry = (id: string): void => {
  const history = getHistory();
  const filteredHistory = history.filter((entry) => entry.id !== id);
  setJsonItem(STORAGE_KEY, filteredHistory);
};

