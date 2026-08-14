import { Database } from 'sql.js';

export function initHistoryLogsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      post_id TEXT,
      action TEXT,
      details TEXT,
      user_id TEXT,
      created_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      level TEXT,
      message TEXT,
      details TEXT,
      created_at TEXT
    );
  `);
}

export function getAllLogsFromDb(db: Database) {
  try {
    const stmt = db.prepare("SELECT * FROM logs ORDER BY created_at DESC LIMIT 500");
    const res: any[] = [];
    while (stmt.step()) {
      res.push(stmt.getAsObject());
    }
    stmt.free();
    return res;
  } catch (e) {
    return [];
  }
}
