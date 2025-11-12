import { BILLS, COINS_RUBLES, COINS_KOPECKS } from '../constants';
import { MoneyCount } from '../types';

export const calculateTotal = (
  initialAmount: number,
  bills: MoneyCount,
  coinsRubles: MoneyCount,
  coinsKopecks: MoneyCount
): number => {
  // Суммируем фактическую сумму купюр и монет
  let actualAmount = 0;

  // Суммируем купюры (используем 0, если значение не задано)
  BILLS.forEach((denomination) => {
    const count = bills[denomination] ?? 0;
    actualAmount += denomination * count;
  });

  // Суммируем монеты в рублях
  COINS_RUBLES.forEach((denomination) => {
    const count = coinsRubles[denomination] ?? 0;
    actualAmount += denomination * count;
  });

  // Суммируем монеты в копейках (конвертируем в рубли)
  COINS_KOPECKS.forEach((denomination) => {
    const count = coinsKopecks[denomination] ?? 0;
    actualAmount += (denomination / 100) * count;
  });

  // Итог = фактическая сумма - начальная сумма (то, что должно быть в кассе)
  // Если положительное - касса в плюсе (больше чем должно быть)
  // Если отрицательное - касса в минусе (меньше чем должно быть)
  return actualAmount - initialAmount;
};

