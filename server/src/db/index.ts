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
  CREATE TABLE IF NOT EXISTS districts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'leader',
    district_id INTEGER NOT NULL DEFAULT 1,
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
    created_at INTEGER NOT NULL
  );

  INSERT OR IGNORE INTO districts (id, name) VALUES (1, 'District 1');
`)

export type DB = typeof db
