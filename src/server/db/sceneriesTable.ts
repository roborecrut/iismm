import { Database } from 'sql.js';

export function initSceneriesTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS sceneries (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      topic_category TEXT,
      target_channels TEXT,
      message_format TEXT,
      enabled INTEGER DEFAULT 1,
      schedule TEXT,
      steps TEXT,
      last_run_at TEXT,
      next_run_at TEXT,
      last_status TEXT,
      last_error TEXT,
      created_at TEXT
    );
  `);
}

export function getAllSceneriesFromDb(db: Database) {
  try {
    const stmt = db.prepare("SELECT * FROM sceneries ORDER BY created_at DESC");
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
