import pool from '../config/database.js';

export class SalaryCalculation {
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM salary_calculations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM salary_calculations 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async create(calculationData) {
    const {
      userId,
      dailyRate,
      workDays,
      salesPercentage,
      salesByDay,
      targetProductsCount,
      totalSalary,
      timestamp,
    } = calculationData;

    const result = await pool.query(
      `INSERT INTO salary_calculations 
       (user_id, daily_rate, work_days, sales_percentage, sales_by_day, 
        target_products_count, total_salary, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        dailyRate,
        JSON.stringify(workDays),
        salesPercentage,
        JSON.stringify(salesByDay),
        JSON.stringify(targetProductsCount),
        totalSalary,
        timestamp,
      ]
    );

    const calculation = result.rows[0];
    return {
      ...calculation,
      work_days: JSON.parse(calculation.work_days),
      sales_by_day: JSON.parse(calculation.sales_by_day),
      target_products_count: JSON.parse(calculation.target_products_count),
    };
  }

  static async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM salary_calculations WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0] || null;
  }

  static async countByUserId(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM salary_calculations WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

