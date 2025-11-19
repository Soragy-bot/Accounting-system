import { calculateTotal } from '../calculations';
import { BILLS, COINS_RUBLES, COINS_KOPECKS } from '../../constants';

describe('calculateTotal', () => {
  it('должен возвращать 0, когда начальная сумма равна фактической сумме', () => {
    const bills = { 1000: 5 };
    const coinsRubles = {};
    const coinsKopecks = {};
    const initialAmount = 5000;

    const result = calculateTotal(initialAmount, bills, coinsRubles, coinsKopecks);
    expect(result).toBe(0);
  });

  it('должен возвращать положительное значение, когда фактическая сумма больше начальной', () => {
    const bills = { 1000: 6 };
    const coinsRubles = {};
    const coinsKopecks = {};
    const initialAmount = 5000;

    const result = calculateTotal(initialAmount, bills, coinsRubles, coinsKopecks);
    expect(result).toBe(1000);
  });

  it('должен возвращать отрицательное значение, когда фактическая сумма меньше начальной', () => {
    const bills = { 1000: 4 };
    const coinsRubles = {};
    const coinsKopecks = {};
    const initialAmount = 5000;

    const result = calculateTotal(initialAmount, bills, coinsRubles, coinsKopecks);
    expect(result).toBe(-1000);
  });

  it('должен учитывать купюры разных номиналов', () => {
    const bills = { 5000: 1, 2000: 2, 1000: 1 };
    const coinsRubles = {};
    const coinsKopecks = {};
    const initialAmount = 0;

    const result = calculateTotal(initialAmount, bills, coinsRubles, coinsKopecks);
    expect(result).toBe(10000);
  });

  it('должен учитывать монеты в рублях', () => {
    const bills = {};
    const coinsRubles = { 10: 5, 5: 2 };
    const coinsKopecks = {};
    const initialAmount = 0;

    const result = calculateTotal(initialAmount, bills, coinsRubles, coinsKopecks);
    expect(result).toBe(60);
  });

  it('должен учитывать монеты в копейках и конвертировать в рубли', () => {
    const bills = {};
    const coinsRubles = {};
    const coinsKopecks = { 50: 10, 10: 5 };
    const initialAmount = 0;

    const result = calculateTotal(initialAmount, bills, coinsRubles, coinsKopecks);
    expect(result).toBe(5.5); // 550 копеек = 5.5 рублей
  });

  it('должен правильно обрабатывать пустые объекты', () => {
    const bills = {};
    const coinsRubles = {};
    const coinsKopecks = {};
    const initialAmount = 1000;

    const result = calculateTotal(initialAmount, bills, coinsRubles, coinsKopecks);
    expect(result).toBe(-1000);
  });

  it('должен учитывать все типы денег одновременно', () => {
    const bills = { 1000: 2 };
    const coinsRubles = { 10: 5 };
    const coinsKopecks = { 50: 4 };
    const initialAmount = 1000;

    const result = calculateTotal(initialAmount, bills, coinsRubles, coinsKopecks);
    // 2000 (купюры) + 50 (монеты в рублях) + 2 (монеты в копейках) - 1000 (начальная сумма) = 1052
    expect(result).toBe(1052);
  });

  it('должен игнорировать номиналы, которых нет в константах', () => {
    const bills = { 1000: 1, 9999: 10 } as any;
    const coinsRubles = {};
    const coinsKopecks = {};
    const initialAmount = 0;

    const result = calculateTotal(initialAmount, bills, coinsRubles, coinsKopecks);
    expect(result).toBe(1000); // Только 1000 учитывается
  });
});

