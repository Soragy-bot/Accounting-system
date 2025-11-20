import pool from '../config/database.js';

export class User {
  static async findByTelegramId(telegramId) {
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(userData) {
    const { telegramId, username, firstName, lastName, role = 'user' } = userData;
    const result = await pool.query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [telegramId, username, firstName, lastName, role]
    );
    return result.rows[0];
  }

  static async update(id, userData) {
    const { username, firstName, lastName, role } = userData;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = current_timestamp`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query(
      'SELECT id, telegram_id, username, first_name, last_name, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

