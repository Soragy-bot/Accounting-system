import { SalaryCalculation } from '../types';
import { getJsonItem, setJsonItem, safeRemoveItem } from '../../../shared/api/storage';
import { HISTORY_LIMIT } from '../../../shared/constants';
import { logger } from '../../../shared/utils/logger';

const STORAGE_KEY = 'salary-calculator-history';

interface LegacySalaryCalculation {
  targetProductBonus?: number;
  [key: string]: unknown;
}

export const saveSalaryEntry = (entry: SalaryCalculation): void => {
  const history = getHistory();
  history.unshift(entry);
  // Сохраняем только последние записи согласно лимиту
  const limitedHistory = history.slice(0, HISTORY_LIMIT);
  setJsonItem(STORAGE_KEY, limitedHistory);
};

export const getHistory = (): SalaryCalculation[] => {
  const history = getJsonItem<LegacySalaryCalculation[]>(STORAGE_KEY, []);
  
  // Валидация структуры данных
  if (!Array.isArray(history)) {
    logger.warn('История зарплаты имеет неверный формат, возвращаем пустой массив');
    return [];
  }
  
  // Миграция: удаляем поле targetProductBonus из старых записей
  return history
    .filter((entry): entry is LegacySalaryCalculation => {
      // Базовая валидация структуры
      return (
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as LegacySalaryCalculation).id === 'string'
      );
    })
    .map((entry: LegacySalaryCalculation): SalaryCalculation => {
      const { targetProductBonus, ...rest } = entry;
      // Проверяем наличие всех обязательных полей
      if (
        typeof rest.id === 'string' &&
        typeof rest.timestamp === 'number' &&
        typeof rest.dailyRate === 'number' &&
        Array.isArray(rest.workDays) &&
        typeof rest.salesPercentage === 'number' &&
        typeof rest.salesByDay === 'object' &&
        typeof rest.targetProductsCount === 'object' &&
        typeof rest.totalSalary === 'number'
      ) {
        return rest as unknown as SalaryCalculation;
      }
      // Если структура неверная, логируем предупреждение и возвращаем дефолтные значения
      logger.warn('Обнаружена запись с неверной структурой, используем дефолтные значения', { entryId: rest.id });
      return {
        id: (rest.id as string) || Date.now().toString(),
        timestamp: (rest.timestamp as number) || Date.now(),
        dailyRate: (rest.dailyRate as number) || 0,
        workDays: (Array.isArray(rest.workDays) ? rest.workDays : []) as string[],
        salesPercentage: (rest.salesPercentage as number) || 0,
        salesByDay: (typeof rest.salesByDay === 'object' && rest.salesByDay !== null ? rest.salesByDay : {}) as { [date: string]: number },
        targetProductsCount: (typeof rest.targetProductsCount === 'object' && rest.targetProductsCount !== null ? rest.targetProductsCount : {}) as { [date: string]: number },
        totalSalary: (rest.totalSalary as number) || 0,
      };
    });
};

export const clearHistory = (): void => {
  safeRemoveItem(STORAGE_KEY);
};

export const deleteSalaryEntry = (id: string): void => {
  const history = getHistory();
  const filteredHistory = history.filter((entry) => entry.id !== id);
  setJsonItem(STORAGE_KEY, filteredHistory);
};

