import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || './data';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'dashboard.db');
const db: DatabaseType = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS layout (
      instance_id TEXT PRIMARY KEY,
      widget_type TEXT NOT NULL,
      x INTEGER NOT NULL DEFAULT 0,
      y INTEGER NOT NULL DEFAULT 0,
      w INTEGER NOT NULL DEFAULT 2,
      h INTEGER NOT NULL DEFAULT 2,
      settings TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS services_manual (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT,
      group_name TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT,
      group_name TEXT DEFAULT 'General',
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT DEFAULT '',
      color TEXT DEFAULT '#fef08a',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS uptime_targets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      check_interval INTEGER DEFAULT 60,
      timeout INTEGER DEFAULT 5000
    );

    CREATE TABLE IF NOT EXISTS uptime_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_id TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      is_up INTEGER NOT NULL,
      response_time INTEGER,
      FOREIGN KEY (target_id) REFERENCES uptime_targets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS speedtest_results (
      id TEXT PRIMARY KEY,
      timestamp TEXT DEFAULT (datetime('now')),
      download REAL,
      upload REAL,
      ping REAL
    );
  `);

  seedDefaults();
}

function seedDefaults(): void {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM settings').get() as { cnt: number };
  if (count.cnt === 0) {
    const defaults: Record<string, string> = {
      title: 'DockerDash',
      theme: 'dark-neon',
      language: 'en',
      displayName: '',
      showSmartHeader: 'true',
      showHealthPills: 'true',
      showSearch: 'true',
      accentColor: '#00f0ff',
      backgroundType: 'solid',
      backgroundColor: '#0a0e1a',
      backgroundGradient: '',
      backgroundImage: '',
      fontSize: 'medium',
      dockerSocketPath: '/var/run/docker.sock',
      dockerScanInterval: '30',
      hostUrl: process.env.HOST_URL || '',
      containerFilter: '',
    };

    const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    const insertMany = db.transaction((entries: [string, string][]) => {
      for (const [key, value] of entries) {
        insert.run(key, value);
      }
    });
    insertMany(Object.entries(defaults));
  }

  const layoutCount = db.prepare('SELECT COUNT(*) as cnt FROM layout').get() as { cnt: number };
  if (layoutCount.cnt === 0) {
    seedDefaultLayout();
  }
}

export function seedDefaultLayout(): void {
  const insert = db.prepare(
    'INSERT OR REPLACE INTO layout (instance_id, widget_type, x, y, w, h, settings) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertMany = db.transaction((rows: [string, string, number, number, number, number, string][]) => {
    for (const row of rows) {
      insert.run(...row);
    }
  });
  insertMany([
    ['docker-services-1', 'docker-services', 0, 0, 8, 4, '{}'],
    ['bookmarks-1', 'bookmarks', 8, 0, 4, 4, '{}'],
  ]);
}

export function getSetting(key: string): string | undefined {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export default db;
