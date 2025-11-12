export interface MoneyCount {
  [key: number]: number; // номинал -> количество
}

export interface CashEntry {
  id: string;
  timestamp: number;
  initialAmount: number;
  bills: MoneyCount;
  coinsRubles: MoneyCount;
  coinsKopecks: MoneyCount;
  totalAmount: number;
}

export interface CashState {
  initialAmount: number;
  bills: MoneyCount;
  coinsRubles: MoneyCount;
  coinsKopecks: MoneyCount;
}

export interface SalaryCalculation {
  id: string;
  timestamp: number;
  dailyRate: number; // ставка за день
  workDays: string[]; // массив дат в формате ISO (YYYY-MM-DD)
  salesPercentage: number; // процент с продаж
  salesByDay: { [date: string]: number }; // сумма продаж по дням
  targetProductBonus: number; // бонус за целевой товар
  targetProductsCount: { [date: string]: number }; // количество целевых товаров по дням
  totalSalary: number; // итоговая зарплата
}

export interface SalaryState {
  dailyRate: number;
  workDays: string[];
  salesPercentage: number;
  salesByDay: { [date: string]: number };
  targetProductBonus: number;
  targetProductsCount: { [date: string]: number };
}

