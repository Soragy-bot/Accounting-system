import { CashEntry } from '../types';

const STORAGE_KEY = 'cash-counter-history';

export const saveHistoryEntry = (entry: CashEntry): void => {
  const history = getHistory();
  history.unshift(entry);
  // Сохраняем только последние 50 записей
  const limitedHistory = history.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
};

export const getHistory = (): CashEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Ошибка при загрузке истории:', error);
    return [];
  }
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

