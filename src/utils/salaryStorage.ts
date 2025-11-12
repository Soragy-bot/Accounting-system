import { SalaryCalculation } from '../types';

const STORAGE_KEY = 'salary-calculator-history';

export const saveSalaryEntry = (entry: SalaryCalculation): void => {
  const history = getHistory();
  history.unshift(entry);
  // Сохраняем только последние 50 записей
  const limitedHistory = history.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
};

export const getHistory = (): SalaryCalculation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Ошибка при загрузке истории зарплаты:', error);
    return [];
  }
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const deleteSalaryEntry = (id: string): void => {
  const history = getHistory();
  const filteredHistory = history.filter((entry) => entry.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
};

