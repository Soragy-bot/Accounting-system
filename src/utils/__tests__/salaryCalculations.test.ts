import { calculateSalary, calculateSalaryBreakdown } from '../salaryCalculations';
import { TARGET_PRODUCT_BONUS } from '../../constants';
import { SalaryState } from '../../types';

describe('calculateSalary', () => {
  it('должен возвращать 0 для пустого состояния', () => {
    const state: SalaryState = {
      dailyRate: 0,
      workDays: [],
      salesPercentage: 0,
      salesByDay: {},
      targetProductsCount: {},
      mode: 'manual',
    };

    const result = calculateSalary(state);
    expect(result).toBe(0);
  });

  it('должен рассчитывать зарплату только по ставке', () => {
    const state: SalaryState = {
      dailyRate: 1000,
      workDays: ['2024-01-01', '2024-01-02', '2024-01-03'],
      salesPercentage: 0,
      salesByDay: {},
      targetProductsCount: {},
      mode: 'manual',
    };

    const result = calculateSalary(state);
    expect(result).toBe(3000); // 1000 * 3 дня
  });

  it('должен учитывать процент с продаж', () => {
    const state: SalaryState = {
      dailyRate: 1000,
      workDays: ['2024-01-01', '2024-01-02'],
      salesPercentage: 10,
      salesByDay: {
        '2024-01-01': 5000,
        '2024-01-02': 3000,
      },
      targetProductsCount: {},
      mode: 'manual',
    };

    const result = calculateSalary(state);
    // 1000 * 2 (ставка) + (5000 + 3000) * 0.1 (процент с продаж) = 2000 + 800 = 2800
    expect(result).toBe(2800);
  });

  it('должен учитывать бонус за целевые товары', () => {
    const state: SalaryState = {
      dailyRate: 1000,
      workDays: ['2024-01-01'],
      salesPercentage: 0,
      salesByDay: {},
      targetProductsCount: {
        '2024-01-01': 3,
      },
      mode: 'manual',
    };

    const result = calculateSalary(state);
    // 1000 (ставка) + 3 * TARGET_PRODUCT_BONUS = 1000 + 150 = 1150
    expect(result).toBe(1000 + 3 * TARGET_PRODUCT_BONUS);
  });

  it('должен рассчитывать полную зарплату со всеми компонентами', () => {
    const state: SalaryState = {
      dailyRate: 1000,
      workDays: ['2024-01-01', '2024-01-02'],
      salesPercentage: 5,
      salesByDay: {
        '2024-01-01': 10000,
        '2024-01-02': 8000,
      },
      targetProductsCount: {
        '2024-01-01': 2,
        '2024-01-02': 1,
      },
      mode: 'manual',
    };

    const result = calculateSalary(state);
    // Ставка: 1000 * 2 = 2000
    // Процент с продаж: (10000 + 8000) * 0.05 = 900
    // Бонус за товары: (2 + 1) * 50 = 150
    // Итого: 2000 + 900 + 150 = 3050
    expect(result).toBe(3050);
  });

  it('должен игнорировать дни, которых нет в workDays', () => {
    const state: SalaryState = {
      dailyRate: 1000,
      workDays: ['2024-01-01'],
      salesPercentage: 10,
      salesByDay: {
        '2024-01-01': 1000,
        '2024-01-02': 5000, // Этот день не учитывается
      },
      targetProductsCount: {
        '2024-01-01': 1,
        '2024-01-02': 5, // Этот день не учитывается
      },
      mode: 'manual',
    };

    const result = calculateSalary(state);
    // Только данные за 2024-01-01: 1000 + 1000 * 0.1 + 1 * 50 = 1150
    expect(result).toBe(1150);
  });
});

describe('calculateSalaryBreakdown', () => {
  it('должен возвращать полную разбивку зарплаты', () => {
    const state: SalaryState = {
      dailyRate: 1000,
      workDays: ['2024-01-01', '2024-01-02'],
      salesPercentage: 10,
      salesByDay: {
        '2024-01-01': 5000,
        '2024-01-02': 3000,
      },
      targetProductsCount: {
        '2024-01-01': 2,
        '2024-01-02': 1,
      },
      mode: 'manual',
    };

    const breakdown = calculateSalaryBreakdown(state);

    expect(breakdown.rateSalary).toBe(2000);
    expect(breakdown.salesBonus).toBe(800); // (5000 + 3000) * 0.1
    expect(breakdown.targetBonus).toBe(150); // 3 * 50
    expect(breakdown.totalSalary).toBe(2950);
    expect(breakdown.workDaysCount).toBe(2);
  });

  it('должен возвращать нулевые значения для пустого состояния', () => {
    const state: SalaryState = {
      dailyRate: 0,
      workDays: [],
      salesPercentage: 0,
      salesByDay: {},
      targetProductsCount: {},
      mode: 'manual',
    };

    const breakdown = calculateSalaryBreakdown(state);

    expect(breakdown.rateSalary).toBe(0);
    expect(breakdown.salesBonus).toBe(0);
    expect(breakdown.targetBonus).toBe(0);
    expect(breakdown.totalSalary).toBe(0);
    expect(breakdown.workDaysCount).toBe(0);
  });
});

