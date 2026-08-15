import { Database } from 'sql.js';

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: 'balance' | 'transaction' | 'social' | 'publish' | 'system';
  title: string;
  message: string;
  is_read: number;
  link?: string;
  created_at: string;
}

export function initNotificationsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT NOT NULL
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);`);
}

export function createNotificationInDb(
  db: Database,
  params: {
    userId: string;
    type?: 'balance' | 'transaction' | 'social' | 'publish' | 'system';
    title: string;
    message: string;
    link?: string;
  }
): NotificationRecord {
  const id = `notif_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const createdAt = new Date().toISOString();
  const type = params.type || 'system';
  const link = params.link || '';

  db.run(
    `INSERT INTO notifications (id, user_id, type, title, message, is_read, link, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, params.userId, type, params.title, params.message, link, createdAt]
  );

  return {
    id,
    user_id: params.userId,
    type,
    title: params.title,
    message: params.message,
    is_read: 0,
    link,
    created_at: createdAt
  };
}

export function getUserNotificationsFromDb(db: Database, userId: string, limit = 50): NotificationRecord[] {
  try {
    const stmt = db.prepare(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
    );
    stmt.bind([userId, limit]);
    const list: NotificationRecord[] = [];
    while (stmt.step()) {
      list.push(stmt.getAsObject() as any);
    }
    stmt.free();
    return list;
  } catch (e) {
    console.error('[NotificationsTable] Error getting notifications:', e);
    return [];
  }
}

export function markNotificationAsReadInDb(db: Database, id: string, userId: string) {
  try {
    db.run("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [id, userId]);
  } catch (e) {
    console.error('[NotificationsTable] Error marking as read:', e);
  }
}

export function markAllNotificationsAsReadInDb(db: Database, userId: string) {
  try {
    db.run("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
  } catch (e) {
    console.error('[NotificationsTable] Error marking all as read:', e);
  }
}
