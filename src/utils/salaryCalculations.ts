import { SalaryState } from '../types';

const TARGET_PRODUCT_BONUS = 50; // Константа бонуса за целевой товар

export const calculateSalary = (state: SalaryState): number => {
  const { dailyRate, workDays, salesPercentage, salesByDay, targetProductsCount } = state;

  // 1. Расчет зарплаты по ставке
  const rateSalary = dailyRate * workDays.length;

  // 2. Расчет процента с продаж за все дни
  let salesBonus = 0;
  workDays.forEach((date) => {
    const sales = salesByDay[date] || 0;
    salesBonus += sales * (salesPercentage / 100);
  });

  // 3. Расчет бонуса за целевые товары
  let targetBonus = 0;
  workDays.forEach((date) => {
    const count = targetProductsCount[date] || 0;
    targetBonus += count * TARGET_PRODUCT_BONUS;
  });

  // 4. Итоговая зарплата
  return rateSalary + salesBonus + targetBonus;
};

export const calculateSalaryBreakdown = (state: SalaryState) => {
  const { dailyRate, workDays, salesPercentage, salesByDay, targetProductsCount } = state;

  const rateSalary = dailyRate * workDays.length;

  let salesBonus = 0;
  workDays.forEach((date) => {
    const sales = salesByDay[date] || 0;
    salesBonus += sales * (salesPercentage / 100);
  });

  let targetBonus = 0;
  workDays.forEach((date) => {
    const count = targetProductsCount[date] || 0;
    targetBonus += count * TARGET_PRODUCT_BONUS;
  });

  const totalSalary = rateSalary + salesBonus + targetBonus;

  return {
    rateSalary,
    salesBonus,
    targetBonus,
    totalSalary,
    workDaysCount: workDays.length,
  };
};

