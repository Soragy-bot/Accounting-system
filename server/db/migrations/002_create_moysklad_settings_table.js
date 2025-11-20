export const up = (pgm) => {
  pgm.createTable('moysklad_settings', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    encrypted_token: {
      type: 'text',
      notNull: true,
    },
    store_id: {
      type: 'varchar(255)',
      notNull: false,
    },
    created_by: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('moysklad_settings', 'created_by');
};

export const down = (pgm) => {
  pgm.dropTable('moysklad_settings');
};

