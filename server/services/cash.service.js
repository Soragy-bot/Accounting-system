import { CashEntry } from '../models/CashEntry.js';

// Константы номиналов (перенесены из фронтенда)
const BILLS = [5000, 2000, 1000, 500, 200, 100, 50, 10, 5];
const COINS_RUBLES = [25, 10, 5, 2, 1];
const COINS_KOPECKS = [50, 10, 5, 1];

export class CashService {
  static calculateTotal(initialAmount, bills, coinsRubles, coinsKopecks) {
    let actualAmount = 0;

    // Суммируем купюры
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

    // Итог = фактическая сумма - начальная сумма
    return actualAmount - initialAmount;
  }

  static async saveEntry(userId, entryData) {
    const { initialAmount, bills, coinsRubles, coinsKopecks } = entryData;
    
    const totalAmount = this.calculateTotal(
      initialAmount,
      bills,
      coinsRubles,
      coinsKopecks
    );

    const timestamp = Date.now();

    const entry = await CashEntry.create({
      userId,
      initialAmount,
      bills,
      coinsRubles,
      coinsKopecks,
      totalAmount,
      timestamp,
    });

    return {
      ...entry,
      totalAmount: parseFloat(entry.total_amount),
    };
  }

  static async getHistory(userId, limit = 50, offset = 0) {
    const entries = await CashEntry.findByUserId(userId, limit, offset);
    
    return entries.map(entry => ({
      id: entry.id.toString(),
      timestamp: parseInt(entry.timestamp, 10),
      initialAmount: parseFloat(entry.initial_amount),
      bills: typeof entry.bills === 'string' ? JSON.parse(entry.bills) : entry.bills,
      coinsRubles: typeof entry.coins_rubles === 'string' ? JSON.parse(entry.coins_rubles) : entry.coins_rubles,
      coinsKopecks: typeof entry.coins_kopecks === 'string' ? JSON.parse(entry.coins_kopecks) : entry.coins_kopecks,
      totalAmount: parseFloat(entry.total_amount),
    }));
  }

  static async deleteEntry(id, userId) {
    const deleted = await CashEntry.delete(id, userId);
    
    if (!deleted) {
      throw new Error('Entry not found or access denied');
    }

    return { success: true };
  }
}

