export const up = (pgm) => {
  pgm.createTable('salary_calculations', {
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
    daily_rate: {
      type: 'decimal(15, 2)',
      notNull: true,
    },
    work_days: {
      type: 'jsonb',
      notNull: true,
    },
    sales_percentage: {
      type: 'decimal(5, 2)',
      notNull: true,
    },
    sales_by_day: {
      type: 'jsonb',
      notNull: true,
    },
    target_products_count: {
      type: 'jsonb',
      notNull: true,
    },
    total_salary: {
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

  pgm.createIndex('salary_calculations', 'user_id');
  pgm.createIndex('salary_calculations', 'timestamp');
  pgm.createIndex('salary_calculations', 'created_at');
};

export const down = (pgm) => {
  pgm.dropTable('salary_calculations');
};

