import dotenv from 'dotenv';
import path from 'path';

// Force NODE_ENV
process.env.NODE_ENV = 'test';

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import { db } from '../config/database';

beforeAll(async () => {
  try {
    // Run all migrations
    await db.migrate.latest();
    // Run all seeds
    await db.seed.run();
  } catch (err) {
    console.warn('Database setup failed. This is expected if you are running unit tests without a database.');
  }
});

afterAll(async () => {
  try {
    // Rollback all migrations to have a clean state next run
    await db.migrate.rollback(undefined, true);
    // Destroy db connection
    await db.destroy();
  } catch (err) {
    // Ignore
  }
});
