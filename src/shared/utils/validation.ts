export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Валидация денежной суммы
 * @param value - Значение для валидации
 * @param min - Минимальное значение (по умолчанию 0)
 * @param max - Максимальное значение (необязательно)
 * @returns Результат валидации
 */
export const validateMoneyAmount = (
  value: number,
  min: number = 0,
  max?: number
): ValidationResult => {
  if (isNaN(value)) {
    return {
      isValid: false,
      error: 'Введите корректное число',
    };
  }

  if (value < min) {
    return {
      isValid: false,
      error: `Значение не может быть меньше ${min.toFixed(2)} ₽`,
    };
  }

  if (max !== undefined && value > max) {
    return {
      isValid: false,
      error: `Значение не может быть больше ${max.toFixed(2)} ₽`,
    };
  }

  if (value < 0) {
    return {
      isValid: false,
      error: 'Сумма не может быть отрицательной',
    };
  }

  return { isValid: true };
};

/**
 * Валидация процента
 * @param value - Значение процента
 * @param min - Минимальное значение (по умолчанию 0)
 * @param max - Максимальное значение (по умолчанию 100)
 * @returns Результат валидации
 */
export const validatePercentage = (
  value: number,
  min: number = 0,
  max: number = 100
): ValidationResult => {
  if (isNaN(value)) {
    return {
      isValid: false,
      error: 'Введите корректное число',
    };
  }

  if (value < min) {
    return {
      isValid: false,
      error: `Процент не может быть меньше ${min}%`,
    };
  }

  if (value > max) {
    return {
      isValid: false,
      error: `Процент не может быть больше ${max}%`,
    };
  }

  return { isValid: true };
};

/**
 * Валидация целого числа (количество)
 * @param value - Значение для валидации
 * @param min - Минимальное значение (по умолчанию 0)
 * @param max - Максимальное значение (необязательно)
 * @returns Результат валидации
 */
export const validateInteger = (
  value: number,
  min: number = 0,
  max?: number
): ValidationResult => {
  if (isNaN(value)) {
    return {
      isValid: false,
      error: 'Введите корректное число',
    };
  }

  if (!Number.isInteger(value)) {
    return {
      isValid: false,
      error: 'Введите целое число',
    };
  }

  if (value < min) {
    return {
      isValid: false,
      error: `Значение не может быть меньше ${min}`,
    };
  }

  if (max !== undefined && value > max) {
    return {
      isValid: false,
      error: `Значение не может быть больше ${max}`,
    };
  }

  return { isValid: true };
};

/**
 * Валидация даты
 * @param dateString - Строка с датой в формате YYYY-MM-DD
 * @returns Результат валидации
 */
export const validateDate = (dateString: string): ValidationResult => {
  if (!dateString || dateString.trim() === '') {
    return {
      isValid: false,
      error: 'Дата не может быть пустой',
    };
  }

  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Введите корректную дату',
    };
  }

  // Проверяем, что дата не в будущем (опционально, можно убрать)
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) {
    return {
      isValid: false,
      error: 'Дата не может быть в будущем',
    };
  }

  return { isValid: true };
};

/**
 * Парсинг и валидация денежной суммы из строки
 * @param value - Строковое значение
 * @param min - Минимальное значение (по умолчанию 0)
 * @param max - Максимальное значение (необязательно)
 * @returns Результат с распарсенным значением и валидацией
 */
export const parseAndValidateMoney = (
  value: string,
  min: number = 0,
  max?: number
): { value: number; validation: ValidationResult } => {
  if (value === '' || value.trim() === '') {
    return {
      value: 0,
      validation: { isValid: true },
    };
  }

  const numValue = parseFloat(value);
  const validation = validateMoneyAmount(numValue, min, max);

  return {
    value: isNaN(numValue) ? 0 : numValue,
    validation,
  };
};

/**
 * Парсинг и валидация процента из строки
 * @param value - Строковое значение
 * @param min - Минимальное значение (по умолчанию 0)
 * @param max - Максимальное значение (по умолчанию 100)
 * @returns Результат с распарсенным значением и валидацией
 */
export const parseAndValidatePercentage = (
  value: string,
  min: number = 0,
  max: number = 100
): { value: number; validation: ValidationResult } => {
  if (value === '' || value.trim() === '') {
    return {
      value: 0,
      validation: { isValid: true },
    };
  }

  const numValue = parseFloat(value);
  const validation = validatePercentage(numValue, min, max);

  return {
    value: isNaN(numValue) ? 0 : numValue,
    validation,
  };
};

/**
 * Парсинг и валидация целого числа из строки
 * @param value - Строковое значение
 * @param min - Минимальное значение (по умолчанию 0)
 * @param max - Максимальное значение (необязательно)
 * @returns Результат с распарсенным значением и валидацией
 */
export const parseAndValidateInteger = (
  value: string,
  min: number = 0,
  max?: number
): { value: number; validation: ValidationResult } => {
  if (value === '' || value.trim() === '') {
    return {
      value: 0,
      validation: { isValid: true },
    };
  }

  const numValue = parseInt(value, 10);
  const validation = validateInteger(numValue, min, max);

  return {
    value: isNaN(numValue) ? 0 : numValue,
    validation,
  };
};

