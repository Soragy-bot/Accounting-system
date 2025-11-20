#!/usr/bin/env node

/**
 * Docker entrypoint script
 * Runs database migrations before starting the Express server
 */

import { execSync, spawn } from 'child_process';

const main = async () => {
  try {
    console.log('Running database migrations...');
    execSync('node server/db/migrate.js', { stdio: 'inherit', cwd: process.cwd() });
    console.log('Migrations completed successfully');
    
    console.log('Starting Express server...');
    
    // Start server process
    const server = spawn('node', ['server.js'], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    // Handle process termination signals
    const shutdown = () => {
      console.log('\nShutting down server...');
      server.kill('SIGTERM');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    server.on('close', (code) => {
      console.log(`Server exited with code ${code}`);
      process.exit(code || 0);
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

main();

