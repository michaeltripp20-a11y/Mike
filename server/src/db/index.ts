import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'

const dbPath = process.env.DB_PATH ?? path.join(__dirname, '../../floortracker.db')
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// Run migrations inline (simple bootstrap)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'leader',
    store_id INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    daily_number REAL,
    status TEXT NOT NULL DEFAULT 'open',
    streak INTEGER NOT NULL DEFAULT 0,
    pace_note TEXT,
    overall_outcome TEXT,
    score_points INTEGER,
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS commitments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    outcome TEXT
  );

  CREATE TABLE IF NOT EXISTS coaching_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_id INTEGER NOT NULL,
    manager_id INTEGER NOT NULL,
    leader_id INTEGER NOT NULL,
    focus_area TEXT NOT NULL,
    observation TEXT NOT NULL,
    agreed_actions TEXT NOT NULL,
    follow_up_date TEXT,
    follow_up_status TEXT DEFAULT 'pending',
    follow_up_resolution TEXT,
    resolved_at INTEGER,
    created_at INTEGER NOT NULL
  );

  INSERT OR IGNORE INTO stores (id, name) VALUES (1, 'Store 1');
`)

// Additive migrations — safe to re-run (try/catch makes them idempotent)
const migrations = [
  // Follow-up columns
  "ALTER TABLE coaching_notes ADD COLUMN follow_up_status TEXT DEFAULT 'pending'",
  "ALTER TABLE coaching_notes ADD COLUMN follow_up_resolution TEXT",
  "ALTER TABLE coaching_notes ADD COLUMN resolved_at INTEGER",
  // district → store rename
  "ALTER TABLE districts RENAME TO stores",
  "ALTER TABLE users RENAME COLUMN district_id TO store_id",
  // leader type onboarding
  "ALTER TABLE users ADD COLUMN leader_type TEXT",
]
for (const sql of migrations) {
  try { sqlite.exec(sql) } catch { /* already applied */ }
}

// Make coaching_notes.day_id nullable (SQLite requires table recreation)
try {
  const hasV2 = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='coaching_notes_v2'").get()
  if (!hasV2) {
    sqlite.exec(`
      CREATE TABLE coaching_notes_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_id INTEGER,
        manager_id INTEGER NOT NULL,
        leader_id INTEGER NOT NULL,
        focus_area TEXT NOT NULL,
        observation TEXT NOT NULL,
        agreed_actions TEXT NOT NULL,
        follow_up_date TEXT,
        follow_up_status TEXT DEFAULT 'pending',
        follow_up_resolution TEXT,
        resolved_at INTEGER,
        created_at INTEGER NOT NULL
      );
      INSERT INTO coaching_notes_v2 SELECT * FROM coaching_notes;
      DROP TABLE coaching_notes;
      ALTER TABLE coaching_notes_v2 RENAME TO coaching_notes;
    `)
  }
} catch (e) { console.error('[migration] coaching_notes nullable day_id:', e) }

export type DB = typeof db
