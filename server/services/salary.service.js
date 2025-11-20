import { SalaryCalculation } from '../models/SalaryCalculation.js';

// Константа бонуса за целевой товар
const TARGET_PRODUCT_BONUS = 50;

export class SalaryService {
  static calculateSalary(state) {
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
  }

  static calculateSalaryBreakdown(state) {
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
  }

  static async saveCalculation(userId, calculationData) {
    const { dailyRate, workDays, salesPercentage, salesByDay, targetProductsCount } = calculationData;
    
    const totalSalary = this.calculateSalary({
      dailyRate,
      workDays,
      salesPercentage,
      salesByDay,
      targetProductsCount,
    });

    const timestamp = Date.now();

    const calculation = await SalaryCalculation.create({
      userId,
      dailyRate,
      workDays,
      salesPercentage,
      salesByDay,
      targetProductsCount,
      totalSalary,
      timestamp,
    });

    return {
      ...calculation,
      dailyRate: parseFloat(calculation.daily_rate),
      salesPercentage: parseFloat(calculation.sales_percentage),
      totalSalary: parseFloat(calculation.total_salary),
    };
  }

  static async getHistory(userId, limit = 50, offset = 0) {
    const calculations = await SalaryCalculation.findByUserId(userId, limit, offset);
    
    return calculations.map(calc => ({
      id: calc.id.toString(),
      timestamp: parseInt(calc.timestamp, 10),
      dailyRate: parseFloat(calc.daily_rate),
      workDays: typeof calc.work_days === 'string' ? JSON.parse(calc.work_days) : calc.work_days,
      salesPercentage: parseFloat(calc.sales_percentage),
      salesByDay: typeof calc.sales_by_day === 'string' ? JSON.parse(calc.sales_by_day) : calc.sales_by_day,
      targetProductsCount: typeof calc.target_products_count === 'string' ? JSON.parse(calc.target_products_count) : calc.target_products_count,
      totalSalary: parseFloat(calc.total_salary),
    }));
  }

  static async deleteCalculation(id, userId) {
    const deleted = await SalaryCalculation.delete(id, userId);
    
    if (!deleted) {
      throw new Error('Calculation not found or access denied');
    }

    return { success: true };
  }
}

