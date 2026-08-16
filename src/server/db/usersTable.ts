import { Database } from 'sql.js';
import { ensureDefaultFoldersForUser } from './filesTable';
import { addTransactionWithBalanceUpdate } from './transactionsTable';

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
  balance?: number;
  balance_free?: number;
  balance_pay?: number;
  balance_start?: number;
  balance_ref?: number;
  balance_tarif?: number;
  balance_admin?: number;
  balance_cost?: number;
  balance_time?: string;
  referral_reward_balance?: number;
  [key: string]: any;
  status: 'Активный' | 'Блок' | 'Удален';
  user_avatar?: string;
  tariff?: string;
  tariff_expires_at?: string;
  tariff_assigned_at?: string;
  tariff_duration_days?: number;
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
      role TEXT DEFAULT 'user',
      telegram_id INTEGER UNIQUE,
      first_name TEXT,
      last_name TEXT,
      username TEXT,
      photo_url TEXT,
      profile_link TEXT,
      bio TEXT,
      is_premium INTEGER DEFAULT 0,
      language_code TEXT DEFAULT 'ru',
      phone TEXT,
      allows_write_to_pm INTEGER DEFAULT 0,
      latitude REAL,
      longitude REAL,
      referred_by INTEGER,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      balance INTEGER DEFAULT 0,
      balance_free INTEGER DEFAULT 300,
      balance_pay INTEGER DEFAULT 0,
      balance_start INTEGER DEFAULT 300,
      balance_ref INTEGER DEFAULT 0,
      balance_tarif INTEGER DEFAULT 0,
      balance_admin INTEGER DEFAULT 0,
      balance_cost INTEGER DEFAULT 0,
      balance_time TEXT,
      status TEXT DEFAULT 'Активный',
      tariff TEXT DEFAULT 'Старт',
      tariff_expires_at TEXT,
      tariff_assigned_at TEXT,
      tariff_duration_days INTEGER DEFAULT 30,
      user_avatar TEXT,
      timezone TEXT DEFAULT 'Europe/Moscow',
      created_at TEXT,
      last_login TEXT
    );
  `);

  // Migration: add new balance columns if missing
  try { db.run("ALTER TABLE users ADD COLUMN balance_free INTEGER DEFAULT 300;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN balance_pay INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN balance_start INTEGER DEFAULT 300;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN balance_ref INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN balance_tarif INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN balance_admin INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN balance_cost INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN balance_time TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Активный';"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN tariff TEXT DEFAULT 'Старт';"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN tariff_expires_at TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN tariff_assigned_at TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN tariff_duration_days INTEGER DEFAULT 30;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN user_avatar TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'Europe/Moscow';"); } catch (e) {}

  // Recalculate and migrate legacy balances for existing users: balance_admin contributes to balance_free
  try {
    db.run(`
      UPDATE users 
      SET 
        balance_start = CASE WHEN balance_start IS NULL OR balance_start = 0 THEN 300 ELSE balance_start END,
        balance_pay = CASE WHEN balance_pay IS NULL THEN 0 ELSE balance_pay END,
        balance_ref = CASE WHEN balance_ref IS NULL THEN 0 ELSE balance_ref END,
        balance_tarif = CASE WHEN balance_tarif IS NULL THEN 0 ELSE balance_tarif END,
        balance_admin = CASE WHEN balance_admin IS NULL THEN 0 ELSE balance_admin END,
        balance_free = (COALESCE(balance_start, 300) + COALESCE(balance_ref, 0) + COALESCE(balance_tarif, 0) + COALESCE(balance_admin, 0)),
        balance = (COALESCE(balance_pay, 0) + (COALESCE(balance_start, 300) + COALESCE(balance_ref, 0) + COALESCE(balance_tarif, 0) + COALESCE(balance_admin, 0))),
        balance_cost = CASE WHEN balance_cost IS NULL THEN 0 ELSE balance_cost END
      WHERE 1=1;
    `);
  } catch (e) {}

  // Clean up legacy base64 image strings
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
  } catch (e) {
    console.error('[UsersTable Migration] Error updating 11-digit IDs:', e);
  }

  // High performance indices
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);

  // Run referral trigger to backfill and guarantee missing referral transactions exist
  try {
    checkAndSyncReferralTransactions(db);
  } catch (e) {
    console.error('[UsersTable] Error checking referral transactions on init:', e);
  }
}

export function checkAndSyncReferralTransactions(db: Database): { syncedCount: number; details: string[] } {
  const details: string[] = [];
  let syncedCount = 0;
  try {
    const stmt = db.prepare("SELECT id, telegram_id, first_name, username, referred_by, created_at FROM users WHERE referred_by IS NOT NULL AND referred_by != 0");
    const referrals: any[] = [];
    while (stmt.step()) {
      referrals.push(stmt.getAsObject());
    }
    stmt.free();

    for (const ref of referrals) {
      const refTg = Number(ref.referred_by);
      if (!refTg) continue;

      const referrerStmt = db.prepare("SELECT id, telegram_id, first_name, username FROM users WHERE telegram_id = ? OR id = ? LIMIT 1");
      referrerStmt.bind([refTg, String(refTg)]);
      let referrer: any = null;
      if (referrerStmt.step()) {
        referrer = referrerStmt.getAsObject();
      }
      referrerStmt.free();

      if (!referrer) continue;

      const refIdStr = `%${ref.id}%`;
      const refTgStr = ref.telegram_id ? `%${ref.telegram_id}%` : refIdStr;
      const txCheckStmt = db.prepare(`
        SELECT id FROM transactions 
        WHERE user_id = ? AND type = 'ref' AND (
          comment LIKE ? OR description LIKE ? OR comment LIKE ? OR description LIKE ?
        ) LIMIT 1
      `);
      txCheckStmt.bind([referrer.id, refIdStr, refIdStr, refTgStr, refTgStr]);
      let txExists = false;
      if (txCheckStmt.step()) {
        txExists = true;
      }
      txCheckStmt.free();

      if (!txExists) {
        const refName = ref.first_name || (ref.username ? `@${ref.username}` : `TG:${ref.telegram_id}`) || ref.id;
        const createdAt = ref.created_at || new Date().toISOString();
        addTransactionWithBalanceUpdate(db, {
          userId: referrer.id,
          type: 'ref',
          balanceType: 'ref',
          amount: 300,
          description: `Партнерское вознаграждение за приглашение ${refName} (+300 ИИрок)`,
          comment: `Реферал: ${ref.id} (TG: ${ref.telegram_id || '-'})`,
          status: 'Завершено',
          createdAt
        });
        syncedCount++;
        details.push(`Начислен реферальный бонус для ${referrer.id} от реферала ${ref.id} (${refName})`);
        console.log(`[Referral Trigger] Backfilled referral transaction for user ${referrer.id} from referral ${ref.id}`);
      }
    }
  } catch (e) {
    console.error('[Referral Trigger] Error in checkAndSyncReferralTransactions:', e);
  }
  return { syncedCount, details };
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
      const bStart = Number(row.balance_start ?? 300);
      const bRef = Number(row.balance_ref ?? 0);
      const bTarif = Number(row.balance_tarif ?? 0);
      const bAdmin = Number(row.balance_admin ?? 0);
      const bPay = Number(row.balance_pay ?? 0);
      const bFree = bStart + bRef + bTarif + bAdmin;
      const bTotal = bPay + bFree;

      users.push({
        ...row,
        telegram_id: Number(row.telegram_id || 0),
        is_premium: Number(row.is_premium || 0),
        allows_write_to_pm: Number(row.allows_write_to_pm || 0),
        balance: bTotal,
        balance_free: bFree,
        balance_pay: bPay,
        balance_start: bStart,
        balance_ref: bRef,
        balance_tarif: bTarif,
        balance_admin: bAdmin,
        balance_cost: Number(row.balance_cost || 0),
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
      const bStart = Number(row.balance_start ?? 300);
      const bRef = Number(row.balance_ref ?? 0);
      const bTarif = Number(row.balance_tarif ?? 0);
      const bAdmin = Number(row.balance_admin ?? 0);
      const bPay = Number(row.balance_pay ?? 0);
      const bFree = bStart + bRef + bTarif + bAdmin;
      const bTotal = bPay + bFree;

      stmt.free();
      return {
        ...row,
        telegram_id: Number(row.telegram_id || 0),
        balance: bTotal,
        balance_free: bFree,
        balance_pay: bPay,
        balance_start: bStart,
        balance_ref: bRef,
        balance_tarif: bTarif,
        balance_admin: bAdmin,
        balance_cost: Number(row.balance_cost || 0),
        status: (row.status as any) || 'Активный'
      };
    }
    stmt.free();
    return null;
  } catch (e) {
    return null;
  }
}

export function getUserByIdFromDb(db: Database, userId: string): UserRecord | null {
  try {
    const finalId = format11DigitUserId(userId);
    const stmt = db.prepare("SELECT * FROM users WHERE id = ? OR telegram_id = ?");
    const tgId = parseInt(userId, 10) || 0;
    stmt.bind([finalId, tgId]);
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      const bStart = Number(row.balance_start ?? 300);
      const bRef = Number(row.balance_ref ?? 0);
      const bTarif = Number(row.balance_tarif ?? 0);
      const bAdmin = Number(row.balance_admin ?? 0);
      const bPay = Number(row.balance_pay ?? 0);
      const bFree = bStart + bRef + bTarif + bAdmin;
      const bTotal = bPay + bFree;

      stmt.free();
      return {
        ...row,
        telegram_id: Number(row.telegram_id || 0),
        balance: bTotal,
        balance_free: bFree,
        balance_pay: bPay,
        balance_start: bStart,
        balance_ref: bRef,
        balance_tarif: bTarif,
        balance_admin: bAdmin,
        balance_cost: Number(row.balance_cost || 0),
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
    const stmt = db.prepare("SELECT id, photo_url FROM users WHERE id = ? OR (telegram_id = ? AND telegram_id != 0) LIMIT 1");
    stmt.bind([finalId, user.telegram_id]);
    let exists = false;
    let existingPhoto = '';
    if (stmt.step()) {
      exists = true;
      const obj = stmt.getAsObject();
      existingPhoto = (obj.photo_url as string) || '';
    }
    stmt.free();

    const startBalance = 300;
    const initialTariff = user.tariff || 'Старт';
    const createdAt = user.created_at || new Date().toISOString();

    if (!exists) {
      db.run(
        `INSERT INTO users (
          id, email, password_hash, role, telegram_id, first_name, last_name, username,
          photo_url, profile_link, bio, is_premium, language_code, phone, allows_write_to_pm,
          latitude, longitude, referred_by, utm_source, utm_medium, utm_campaign,
          balance, balance_free, balance_pay, balance_start, balance_ref, balance_tarif, balance_admin, balance_cost, balance_time,
          status, tariff, created_at, last_login
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalId,
          user.email || '',
          user.password_hash || '',
          user.role || 'user',
          user.telegram_id || 0,
          user.first_name || '',
          user.last_name || '',
          user.username || '',
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
          user.balance || 0,
          user.balance_free !== undefined ? user.balance_free : startBalance,
          user.balance_pay || 0,
          user.balance_start !== undefined ? user.balance_start : startBalance,
          user.balance_ref || 0,
          user.balance_tarif || 0,
          user.balance_admin || 0,
          user.balance_cost || 0,
          createdAt,
          user.status || 'Активный',
          initialTariff,
          createdAt,
          user.last_login || createdAt
        ]
      );

      // Create transaction for starting balance
      addTransactionWithBalanceUpdate(db, {
        userId: finalId,
        type: 'start',
        balanceType: 'start',
        amount: startBalance,
        description: 'Единовременное начисление стартового баланса 300 ИИрок',
        createdAt
      });
    } else {
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
    const stmt = db.prepare("SELECT id, photo_url, balance, balance_free, balance_pay, balance_start, balance_ref, balance_tarif, balance_admin, balance_cost, balance_time, tariff, tariff_expires_at, tariff_assigned_at, tariff_duration_days FROM users WHERE id = ? OR (telegram_id = ? AND telegram_id != 0) LIMIT 1");
    stmt.bind([finalId, user.telegram_id]);
    let exists = false;
    let existingPhoto = '';
    let existingUser: any = {};
    if (stmt.step()) {
      exists = true;
      existingUser = stmt.getAsObject();
      existingPhoto = (existingUser.photo_url as string) || '';
    }
    stmt.free();

    let finalPhoto = user.photo_url || '';
    if (existingPhoto && !existingPhoto.includes('dicebear') && (!finalPhoto || finalPhoto.includes('dicebear'))) {
      finalPhoto = existingPhoto;
    }

    const startBalance = 300;
    const createdAt = user.created_at || existingUser.created_at || new Date().toISOString();

    const balance_start = user.balance_start !== undefined ? user.balance_start : (existingUser.balance_start !== undefined ? existingUser.balance_start : startBalance);
    const balance_ref = user.balance_ref !== undefined ? user.balance_ref : (existingUser.balance_ref || 0);
    const balance_tarif = user.balance_tarif !== undefined ? user.balance_tarif : (existingUser.balance_tarif || 0);
    const balance_admin = user.balance_admin !== undefined ? user.balance_admin : (existingUser.balance_admin || 0);
    const balance_free = user.balance_free !== undefined ? user.balance_free : (balance_start + balance_ref + balance_tarif + balance_admin);
    const balance_pay = user.balance_pay !== undefined ? user.balance_pay : (existingUser.balance_pay || 0);
    const balance = user.balance !== undefined ? user.balance : (balance_pay + balance_free);
    const balance_cost = user.balance_cost !== undefined ? user.balance_cost : (existingUser.balance_cost || 0);
    const balance_time = user.balance_time || existingUser.balance_time || null;

    db.run(
      `INSERT OR REPLACE INTO users (
        id, email, password_hash, role, telegram_id, first_name, last_name, username,
        photo_url, profile_link, bio, is_premium, language_code, phone, allows_write_to_pm,
        latitude, longitude, referred_by, utm_source, utm_medium, utm_campaign,
        balance, balance_free, balance_pay, balance_start, balance_ref, balance_tarif, balance_admin, balance_cost, balance_time,
        status, tariff, tariff_expires_at, tariff_assigned_at, tariff_duration_days, created_at, last_login
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalId,
        user.email || '',
        user.password_hash || '',
        user.role || 'user',
        user.telegram_id || 0,
        user.first_name || '',
        user.last_name || '',
        user.username || '',
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
        balance,
        balance_free,
        balance_pay,
        balance_start,
        balance_ref,
        balance_tarif,
        balance_admin,
        balance_cost,
        balance_time,
        user.status || 'Активный',
        user.tariff || existingUser.tariff || 'Старт',
        user.tariff_expires_at || existingUser.tariff_expires_at || null,
        user.tariff_assigned_at || existingUser.tariff_assigned_at || null,
        user.tariff_duration_days || existingUser.tariff_duration_days || 30,
        createdAt,
        user.last_login || new Date().toISOString()
      ]
    );

    if (!exists) {
      addTransactionWithBalanceUpdate(db, {
        userId: finalId,
        type: 'start',
        balanceType: 'start',
        amount: startBalance,
        description: 'Единовременное начисление стартового баланса 300 ИИрок',
        createdAt
      });
    }

    ensureDefaultFoldersForUser(db, finalId);

    // If user has referrer, run referral transaction sync trigger
    if (user.referred_by) {
      try {
        checkAndSyncReferralTransactions(db);
      } catch (e) {}
    }
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
