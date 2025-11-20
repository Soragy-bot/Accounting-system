export const up = (pgm) => {
  pgm.createTable('cash_entries', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    initial_amount: {
      type: 'decimal(15, 2)',
      notNull: true,
    },
    bills: {
      type: 'jsonb',
      notNull: true,
    },
    coins_rubles: {
      type: 'jsonb',
      notNull: true,
    },
    coins_kopecks: {
      type: 'jsonb',
      notNull: true,
    },
    total_amount: {
      type: 'decimal(15, 2)',
      notNull: true,
    },
    timestamp: {
      type: 'bigint',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('cash_entries', 'user_id');
  pgm.createIndex('cash_entries', 'timestamp');
  pgm.createIndex('cash_entries', 'created_at');
};

export const down = (pgm) => {
  pgm.dropTable('cash_entries');
};

