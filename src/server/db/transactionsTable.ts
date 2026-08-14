import { Database } from 'sql.js';

export function initTransactionsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      amount INTEGER,
      type TEXT,
      description TEXT,
      created_at TEXT
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);`);
}

export function getAllTransactionsFromDb(db: Database) {
  try {
    const stmt = db.prepare("SELECT * FROM transactions ORDER BY created_at DESC");
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
