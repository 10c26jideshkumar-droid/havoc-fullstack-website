import fs from 'fs';
import path from 'path';
import { pool } from './pool';

export const runMigrations = async () => {
  console.log('Running database migrations...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schemaSql);
    console.log('PostgreSQL schema applied successfully.');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
