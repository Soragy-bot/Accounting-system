import { SalaryState } from '../types';

export const calculateSalary = (state: SalaryState): number => {
  const { dailyRate, workDays, salesPercentage, salesByDay, targetProductBonus, targetProductsCount } = state;

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
    targetBonus += count * targetProductBonus;
  });

  // 4. Итоговая зарплата
  return rateSalary + salesBonus + targetBonus;
};

export const calculateSalaryBreakdown = (state: SalaryState) => {
  const { dailyRate, workDays, salesPercentage, salesByDay, targetProductBonus, targetProductsCount } = state;

  const rateSalary = dailyRate * workDays.length;
  
  let salesBonus = 0;
  workDays.forEach((date) => {
    const sales = salesByDay[date] || 0;
    salesBonus += sales * (salesPercentage / 100);
  });

  let targetBonus = 0;
  workDays.forEach((date) => {
    const count = targetProductsCount[date] || 0;
    targetBonus += count * targetProductBonus;
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

