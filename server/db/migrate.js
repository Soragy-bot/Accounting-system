import { runner } from 'node-pg-migrate';
import { config } from '../config/env.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const runMigrations = async () => {
  try {
    await runner({
      databaseUrl: config.database.url,
      dir: join(__dirname, 'migrations'),
      direction: 'up',
      migrationsTable: 'pgmigrations',
    });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

runMigrations();

