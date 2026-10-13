import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const DB_PATH = process.env.SQLITE_DB_PATH || (
  process.env.VERCEL
    ? path.join(os.tmpdir(), 'havoc.db')
    : path.join(__dirname, '..', '..', 'havoc.db')
);

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
