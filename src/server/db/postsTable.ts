import { Database } from 'sql.js';

export function initPostsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      category TEXT,
      request_template TEXT,
      post_text TEXT,
      channel TEXT,
      channels TEXT,
      message_format TEXT,
      signature TEXT,
      attachment_type TEXT,
      attachment_url TEXT,
      attachment_urls TEXT,
      status TEXT,
      trigger_schedule TEXT,
      published_at TEXT,
      created_at TEXT
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);`);
}

export function getAllPostsFromDb(db: Database) {
  try {
    const stmt = db.prepare("SELECT * FROM posts ORDER BY created_at DESC");
    const posts: any[] = [];
    while (stmt.step()) {
      posts.push(stmt.getAsObject());
    }
    stmt.free();
    return posts;
  } catch (e) {
    return [];
  }
}

