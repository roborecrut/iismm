import { Database } from 'sql.js';

export function initPromptsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT,
      category TEXT,
      content TEXT,
      author_id TEXT,
      message_format TEXT,
      signature TEXT,
      created_at TEXT
    );
  `);
}

export function getAllPromptsFromDb(db: Database) {
  try {
    const stmt = db.prepare("SELECT * FROM prompts ORDER BY created_at DESC");
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

