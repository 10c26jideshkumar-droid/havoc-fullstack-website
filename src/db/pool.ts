import { Pool } from 'pg';
import { config } from '../config';

// Initialize PostgreSQL connection pool
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: process.env.DATABASE_SSL === 'true' || config.databaseUrl.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PG client error on idle client:', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
