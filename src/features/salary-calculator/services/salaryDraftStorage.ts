import { SalaryState } from '../types';
import { getJsonItem, setJsonItem, safeRemoveItem } from '../../../shared/api/storage';
import { logger } from '../../../shared/utils/logger';

const SALARY_CALCULATOR_DRAFT_KEY = 'salary-calculator-draft';

/**
 * Сохраняет черновик для SalaryCalculator
 */
export const saveSalaryCalculatorDraft = (draft: SalaryState): boolean => {
  try {
    return setJsonItem(SALARY_CALCULATOR_DRAFT_KEY, draft);
  } catch (error) {
    logger.error('Ошибка при сохранении черновика SalaryCalculator:', error);
    return false;
  }
};

/**
 * Загружает черновик для SalaryCalculator
 */
export const loadSalaryCalculatorDraft = (): SalaryState | null => {
  try {
    const draft = getJsonItem<SalaryState>(SALARY_CALCULATOR_DRAFT_KEY);
    if (draft === null) {
      return null;
    }
    
    // Валидация структуры данных
    if (
      typeof draft === 'object' &&
      draft !== null &&
      typeof draft.dailyRate === 'number' &&
      Array.isArray(draft.workDays) &&
      typeof draft.salesPercentage === 'number' &&
      typeof draft.salesByDay === 'object' &&
      typeof draft.targetProductsCount === 'object'
    ) {
      return draft;
    }
    
    logger.warn('Черновик SalaryCalculator имеет неверный формат');
    return null;
  } catch (error) {
    logger.error('Ошибка при загрузке черновика SalaryCalculator:', error);
    return null;
  }
};

/**
 * Очищает черновик для SalaryCalculator
 */
export const clearSalaryCalculatorDraft = (): boolean => {
  try {
    return safeRemoveItem(SALARY_CALCULATOR_DRAFT_KEY);
  } catch (error) {
    logger.error('Ошибка при очистке черновика SalaryCalculator:', error);
    return false;
  }
};

