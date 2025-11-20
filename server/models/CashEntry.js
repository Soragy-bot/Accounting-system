import pool from '../config/database.js';

export class CashEntry {
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM cash_entries WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM cash_entries 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async create(entryData) {
    const {
      userId,
      initialAmount,
      bills,
      coinsRubles,
      coinsKopecks,
      totalAmount,
      timestamp,
    } = entryData;

    const result = await pool.query(
      `INSERT INTO cash_entries 
       (user_id, initial_amount, bills, coins_rubles, coins_kopecks, total_amount, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        initialAmount,
        JSON.stringify(bills),
        JSON.stringify(coinsRubles),
        JSON.stringify(coinsKopecks),
        totalAmount,
        timestamp,
      ]
    );

    const entry = result.rows[0];
    return {
      ...entry,
      bills: JSON.parse(entry.bills),
      coins_rubles: JSON.parse(entry.coins_rubles),
      coins_kopecks: JSON.parse(entry.coins_kopecks),
    };
  }

  static async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM cash_entries WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0] || null;
  }

  static async countByUserId(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM cash_entries WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

