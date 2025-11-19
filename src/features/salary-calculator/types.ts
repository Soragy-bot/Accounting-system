export interface SalaryCalculation {
  id: string;
  timestamp: number;
  dailyRate: number; // ставка за день
  workDays: string[]; // массив дат в формате ISO (YYYY-MM-DD)
  salesPercentage: number; // процент с продаж
  salesByDay: { [date: string]: number }; // сумма продаж по дням
  targetProductsCount: { [date: string]: number }; // количество целевых товаров по дням
  totalSalary: number; // итоговая зарплата
}

export interface SalaryState {
  dailyRate: number;
  workDays: string[];
  salesPercentage: number;
  salesByDay: { [date: string]: number };
  targetProductsCount: { [date: string]: number };
  mode?: 'manual' | 'api'; // режим работы: ручной или API
}

