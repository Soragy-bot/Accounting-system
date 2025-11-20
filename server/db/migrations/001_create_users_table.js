export const up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    telegram_id: {
      type: 'bigint',
      notNull: true,
      unique: true,
    },
    username: {
      type: 'varchar(255)',
      notNull: false,
    },
    first_name: {
      type: 'varchar(255)',
      notNull: false,
    },
    last_name: {
      type: 'varchar(255)',
      notNull: false,
    },
    role: {
      type: 'varchar(50)',
      notNull: true,
      default: 'user',
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

  pgm.createIndex('users', 'telegram_id');
  pgm.createIndex('users', 'role');
};

export const down = (pgm) => {
  pgm.dropTable('users');
};

