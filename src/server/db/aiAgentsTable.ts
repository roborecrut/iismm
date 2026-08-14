import { Database } from 'sql.js';

export function initAIAgentsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_agents (
      id TEXT PRIMARY KEY,
      title TEXT,
      desc TEXT,
      tag TEXT,
      btn_text TEXT,
      avatar_emoji TEXT,
      gradient TEXT,
      welcome_message TEXT,
      system_prompt TEXT,
      interactive_user TEXT,
      interactive_assistant TEXT,
      created_at TEXT
    );
  `);
}

export function getAllAIAgentsFromDb(db: Database) {
  try {
    const stmt = db.prepare("SELECT * FROM ai_agents ORDER BY created_at DESC");
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
