import pool from '../config/database.js';

export class MoyskladSettings {
  static async findLatest() {
    const result = await pool.query(
      'SELECT * FROM moysklad_settings ORDER BY created_at DESC LIMIT 1'
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM moysklad_settings WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(settingsData) {
    const { encryptedToken, storeId, createdBy } = settingsData;
    const result = await pool.query(
      `INSERT INTO moysklad_settings (encrypted_token, store_id, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [encryptedToken, storeId, createdBy]
    );
    return result.rows[0];
  }

  static async update(id, settingsData) {
    const { encryptedToken, storeId } = settingsData;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (encryptedToken !== undefined) {
      updates.push(`encrypted_token = $${paramCount++}`);
      values.push(encryptedToken);
    }
    if (storeId !== undefined) {
      updates.push(`store_id = $${paramCount++}`);
      values.push(storeId);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = current_timestamp`);
    values.push(id);

    const result = await pool.query(
      `UPDATE moysklad_settings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async upsert(settingsData) {
    const latest = await this.findLatest();
    if (latest) {
      return await this.update(latest.id, settingsData);
    } else {
      return await this.create(settingsData);
    }
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM moysklad_settings WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

