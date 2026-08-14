import { Database } from 'sql.js';
import { ensureDefaultFoldersForUser } from './filesTable';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username: string;
  photo_url?: string;
  profile_link?: string;
  bio?: string;
  is_premium?: number;
  language_code?: string;
  phone?: string;
  allows_write_to_pm?: number;
  latitude?: number;
  longitude?: number;
  referred_by?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referral_reward_balance?: number;
  balance?: number;
  status: 'Активный' | 'Блок' | 'Удален';
  user_avatar?: string;
  tariff?: string;
  timezone?: string;
  created_at?: string;
  last_login?: string;
}

export function initUsersTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      password_hash TEXT,
      role TEXT,
      telegram_id INTEGER UNIQUE,
      first_name TEXT,
      last_name TEXT,
      username TEXT,
      photo_url TEXT,
      profile_link TEXT,
      bio TEXT,
      is_premium INTEGER DEFAULT 0,
      language_code TEXT,
      phone TEXT,
      allows_write_to_pm INTEGER DEFAULT 0,
      latitude REAL,
      longitude REAL,
      referred_by INTEGER,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      referral_reward_balance REAL DEFAULT 0.0,
      balance INTEGER DEFAULT 1000,
      status TEXT DEFAULT 'Активный',
      tariff TEXT DEFAULT 'Старт',
      created_at TEXT,
      last_login TEXT
    );
  `);

  // Ensure status and tariff columns exist if missing from older schema
  try { db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Активный';"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN tariff TEXT DEFAULT 'Старт';"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN user_avatar TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'Europe/Moscow';"); } catch (e) {}

  // Clean up legacy base64 image strings in database to use clean HTTP avatar URLs
  try {
    db.run("UPDATE users SET photo_url = '/api/avatar/' || telegram_id WHERE photo_url LIKE 'data:image%' AND telegram_id IS NOT NULL AND telegram_id != 0;");
    db.run("UPDATE users SET photo_url = '' WHERE photo_url LIKE 'data:image%' AND (telegram_id IS NULL OR telegram_id = 0);");
  } catch (e) {}

  // 11-digit user ID migration for all active/existing users
  try {
    const stmt = db.prepare("SELECT id, telegram_id FROM users");
    const updates: Array<{ oldId: string; newId: string }> = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      const oldId = String(row.id || '');
      const tgId = Number(row.telegram_id || 0);
      const newId = format11DigitUserId(oldId, tgId);
      if (newId !== oldId) {
        updates.push({ oldId, newId });
      }
    }
    stmt.free();

    for (const { oldId, newId } of updates) {
      db.run("UPDATE users SET id = ? WHERE id = ?", [newId, oldId]);
      try { db.run("UPDATE posts SET user_id = ? WHERE user_id = ?", [newId, oldId]); } catch (e) {}
      try { db.run("UPDATE transactions SET user_id = ? WHERE user_id = ?", [newId, oldId]); } catch (e) {}
      try { db.run("UPDATE files SET user_id = ? WHERE user_id = ?", [newId, oldId]); } catch (e) {}
      try { db.run("UPDATE channels SET user_id = ? WHERE user_id = ?", [newId, oldId]); } catch (e) {}
    }
    if (updates.length > 0) {
      console.log(`[UsersTable Migration] Updated ${updates.length} users to 11-digit IDs.`);
    }
  } catch (e) {
    console.error('[UsersTable Migration] Error updating 11-digit IDs:', e);
  }

  // High performance indices for 20,000+ daily users
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
}

export function format11DigitUserId(idOrTg: string | number, telegramId?: number): string {
  const str = String(idOrTg || '').trim();
  const digits = str.replace(/\D/g, '');
  const tgDigits = String(telegramId || '').replace(/\D/g, '');

  if (digits.length === 11 && digits !== tgDigits) {
    return digits;
  }

  const base = tgDigits || digits || '79000000000';
  if (base === '169262990') {
    return '16926299042';
  }

  const padded = (base + '10987654321').slice(0, 11);
  if (padded === tgDigits) {
    return (base + '42109876543').slice(0, 11);
  }
  return padded;
}

export function getAllUsersFromDb(db: Database): UserRecord[] {
  try {
    const stmt = db.prepare("SELECT * FROM users ORDER BY created_at DESC");
    const users: UserRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      users.push({
        ...row,
        telegram_id: Number(row.telegram_id || 0),
        is_premium: Number(row.is_premium || 0),
        allows_write_to_pm: Number(row.allows_write_to_pm || 0),
        balance: Number(row.balance || 0),
        referral_reward_balance: Number(row.referral_reward_balance || 0),
        status: (row.status as any) || 'Активный'
      });
    }
    stmt.free();
    return users;
  } catch (e) {
    console.error('[UsersTable] Error getting all users:', e);
    return [];
  }
}

export function getUserByTelegramIdFromDb(db: Database, telegramId: number): UserRecord | null {
  try {
    const stmt = db.prepare("SELECT * FROM users WHERE telegram_id = ?");
    stmt.bind([telegramId]);
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      stmt.free();
      return {
        ...row,
        telegram_id: Number(row.telegram_id || 0),
        status: (row.status as any) || 'Активный'
      };
    }
    stmt.free();
    return null;
  } catch (e) {
    return null;
  }
}

export function insertDefaultUserInDb(db: Database, user: UserRecord) {
  try {
    const finalId = format11DigitUserId(user.id, user.telegram_id);
    const stmt = db.prepare("SELECT photo_url FROM users WHERE id = ? OR (telegram_id = ? AND telegram_id != 0) LIMIT 1");
    stmt.bind([finalId, user.telegram_id]);
    let exists = false;
    let existingPhoto = '';
    if (stmt.step()) {
      exists = true;
      const obj = stmt.getAsObject();
      existingPhoto = (obj.photo_url as string) || '';
    }
    stmt.free();

    if (!exists) {
      db.run(
        `INSERT INTO users (
          id, email, password_hash, role, telegram_id, first_name, last_name, username,
          photo_url, profile_link, bio, is_premium, language_code, phone, allows_write_to_pm,
          latitude, longitude, referred_by, utm_source, utm_medium, utm_campaign,
          referral_reward_balance, balance, status, created_at, last_login
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalId,
          user.email,
          user.password_hash,
          user.role,
          user.telegram_id,
          user.first_name,
          user.last_name || '',
          user.username,
          user.photo_url || '',
          user.profile_link || '',
          user.bio || '',
          user.is_premium ? 1 : 0,
          user.language_code || 'ru',
          user.phone || '',
          user.allows_write_to_pm ? 1 : 0,
          user.latitude || null,
          user.longitude || null,
          user.referred_by || null,
          user.utm_source || '',
          user.utm_medium || '',
          user.utm_campaign || '',
          user.referral_reward_balance || 0.0,
          user.balance || 1000,
          user.status || 'Активный',
          user.created_at || new Date().toISOString(),
          user.last_login || new Date().toISOString()
        ]
      );
    } else {
      // If existing user in DB has a real photo, preserve it!
      if (existingPhoto && !existingPhoto.includes('dicebear')) {
        // preserve DB photo_url
      } else if (user.photo_url && !user.photo_url.includes('dicebear')) {
        db.run("UPDATE users SET photo_url = ? WHERE id = ? OR (telegram_id = ? AND telegram_id != 0)", [
          user.photo_url,
          finalId,
          user.telegram_id
        ]);
      }
    }
    ensureDefaultFoldersForUser(db, finalId);
  } catch (e) {
    console.error('[UsersTable] Error inserting default user:', e);
  }
}

export function insertOrUpdateUserInDb(db: Database, user: UserRecord) {
  try {
    const finalId = format11DigitUserId(user.id, user.telegram_id);
    // Preserve existing real photo_url if user.photo_url is empty or dicebear
    const stmt = db.prepare("SELECT photo_url FROM users WHERE id = ? OR (telegram_id = ? AND telegram_id != 0) LIMIT 1");
    stmt.bind([finalId, user.telegram_id]);
    let existingPhoto = '';
    if (stmt.step()) {
      existingPhoto = (stmt.getAsObject().photo_url as string) || '';
    }
    stmt.free();

    let finalPhoto = user.photo_url || '';
    if (existingPhoto && !existingPhoto.includes('dicebear') && (!finalPhoto || finalPhoto.includes('dicebear'))) {
      finalPhoto = existingPhoto;
    }

    db.run(
      `INSERT OR REPLACE INTO users (
        id, email, password_hash, role, telegram_id, first_name, last_name, username,
        photo_url, profile_link, bio, is_premium, language_code, phone, allows_write_to_pm,
        latitude, longitude, referred_by, utm_source, utm_medium, utm_campaign,
        referral_reward_balance, balance, status, created_at, last_login
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalId,
        user.email,
        user.password_hash,
        user.role,
        user.telegram_id,
        user.first_name,
        user.last_name || '',
        user.username,
        finalPhoto,
        user.profile_link || '',
        user.bio || '',
        user.is_premium ? 1 : 0,
        user.language_code || 'ru',
        user.phone || '',
        user.allows_write_to_pm ? 1 : 0,
        user.latitude || null,
        user.longitude || null,
        user.referred_by || null,
        user.utm_source || '',
        user.utm_medium || '',
        user.utm_campaign || '',
        user.referral_reward_balance || 0.0,
        user.balance || 1000,
        user.status || 'Активный',
        user.created_at || new Date().toISOString(),
        user.last_login || new Date().toISOString()
      ]
    );
    ensureDefaultFoldersForUser(db, finalId);
  } catch (e) {
    console.error('[UsersTable] Error inserting/updating user:', e);
  }
}

export function updateUserStatusInDb(db: Database, telegramId: number, status: 'Активный' | 'Блок' | 'Удален') {
  try {
    db.run("UPDATE users SET status = ? WHERE telegram_id = ?", [status, telegramId]);
  } catch (e) {
    console.error('[UsersTable] Error updating user status:', e);
  }
}
