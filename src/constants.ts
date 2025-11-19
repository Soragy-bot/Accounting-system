// Номиналы купюр в рублях
export const BILLS = [5000, 2000, 1000, 500, 200, 100, 50, 10, 5] as const;

// Номиналы монет в рублях
export const COINS_RUBLES = [25, 10, 5, 2, 1] as const;

// Номиналы монет в копейках
export const COINS_KOPECKS = [50, 10, 5, 1] as const;

// Константа бонуса за целевой товар
export const TARGET_PRODUCT_BONUS = 50;

// Лимиты для истории операций
export const HISTORY_LIMIT = 50;

// Настройки для API запросов
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY_BASE = 1000; // базовая задержка в миллисекундах
export const API_RETRY_DELAY_MAX = 10000; // максимальная задержка в миллисекундах

