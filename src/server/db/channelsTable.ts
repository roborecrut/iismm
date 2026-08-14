import { Database } from 'sql.js';

export function initChannelsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT,
      username TEXT,
      telegram_id TEXT,
      is_active INTEGER DEFAULT 1,
      subscribers_count INTEGER DEFAULT 0,
      invite_link TEXT,
      description TEXT,
      photo_url TEXT,
      created_at TEXT
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);`);
}

export function getAllChannelsFromDb(db: Database) {
  try {
    const stmt = db.prepare("SELECT * FROM channels ORDER BY created_at DESC");
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
