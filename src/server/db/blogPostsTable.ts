import { Database } from 'sql.js';

export function initBlogPostsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      category TEXT DEFAULT 'article',
      is_post_of_day INTEGER DEFAULT 0,
      post_of_day_date TEXT,
      title TEXT NOT NULL,
      desc TEXT,
      content TEXT NOT NULL,
      format TEXT DEFAULT 'photo',
      tag TEXT DEFAULT 'Статья',
      read_time TEXT DEFAULT '5 мин',
      date_str TEXT,
      author_name TEXT,
      author_avatar TEXT,
      author_role TEXT,
      views_count INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      image_url TEXT,
      video_url TEXT,
      album_json TEXT,
      created_at TEXT
    );
  `);
}

export function getAllBlogPostsFromDb(db: Database) {
  try {
    const stmt = db.prepare("SELECT * FROM blog_posts ORDER BY created_at DESC");
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
