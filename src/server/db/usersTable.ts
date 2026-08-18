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
      tarif_date TEXT,
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
  try { db.run("ALTER TABLE users ADD COLUMN tarif_date TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN tariff_expires_at TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN tariff_assigned_at TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN tariff_duration_days INTEGER DEFAULT 30;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN user_avatar TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'Europe/Moscow';"); } catch (e) {}

  // Recalculate and migrate legacy balances and tariff dates for existing users
  try {
    db.run(`
      UPDATE users 
      SET 
        tarif_date = CASE 
          WHEN tarif_date IS NULL OR tarif_date = '' OR tarif_date LIKE '%Invalid%' 
          THEN COALESCE(tariff_assigned_at, created_at, datetime('now')) 
          ELSE tarif_date 
        END,
        tariff_assigned_at = CASE 
          WHEN tariff_assigned_at IS NULL OR tariff_assigned_at = '' OR tariff_assigned_at LIKE '%Invalid%' 
          THEN COALESCE(tarif_date, created_at, datetime('now')) 
          ELSE tariff_assigned_at 
        END,
        tariff_duration_days = CASE 
          WHEN tariff_duration_days IS NULL OR tariff_duration_days <= 0 
          THEN 30 
          ELSE tariff_duration_days 
        END,
        tariff_expires_at = CASE 
          WHEN tariff_expires_at IS NULL OR tariff_expires_at = '' OR tariff_expires_at LIKE '%Invalid%' 
          THEN datetime(COALESCE(tariff_assigned_at, tarif_date, created_at, datetime('now')), '+' || COALESCE(tariff_duration_days, 30) || ' days') 
          ELSE tariff_expires_at 
        END,
        balance_time = CASE 
          WHEN balance_time IS NULL OR balance_time = '' OR balance_time LIKE '%Invalid%' 
          THEN datetime(COALESCE(tariff_assigned_at, tarif_date, created_at, datetime('now')), '+' || COALESCE(tariff_duration_days, 30) || ' days') 
          ELSE balance_time 
        END
      WHERE 1=1;
    `);
  } catch (e) {}

  // Triggers to automatically track tariff changes and keep expiration dates in sync
  try {
    db.run(`
      CREATE TRIGGER IF NOT EXISTS trg_users_insert_tarif_date
      AFTER INSERT ON users
      FOR EACH ROW
      BEGIN
        UPDATE users
        SET 
          tarif_date = COALESCE(NEW.tarif_date, NEW.tariff_assigned_at, NEW.created_at, datetime('now')),
          tariff_assigned_at = COALESCE(NEW.tariff_assigned_at, NEW.tarif_date, NEW.created_at, datetime('now')),
          tariff_duration_days = COALESCE(NEW.tariff_duration_days, 30),
          tariff_expires_at = COALESCE(NEW.tariff_expires_at, datetime(COALESCE(NEW.tarif_date, NEW.created_at, datetime('now')), '+' || COALESCE(NEW.tariff_duration_days, 30) || ' days')),
          balance_time = COALESCE(NEW.balance_time, datetime(COALESCE(NEW.tarif_date, NEW.created_at, datetime('now')), '+' || COALESCE(NEW.tariff_duration_days, 30) || ' days'))
        WHERE id = NEW.id;
      END;
    `);
  } catch (e) {}

  try {
    db.run(`
      CREATE TRIGGER IF NOT EXISTS trg_users_update_tariff
      AFTER UPDATE OF tariff, tarif_date, tariff_duration_days ON users
      FOR EACH ROW
      WHEN (NEW.tariff != OLD.tariff OR NEW.tarif_date != OLD.tarif_date OR NEW.tariff_duration_days != OLD.tariff_duration_days)
      BEGIN
        UPDATE users
        SET 
          tarif_date = CASE WHEN NEW.tariff != OLD.tariff AND (NEW.tarif_date = OLD.tarif_date OR NEW.tarif_date IS NULL) THEN datetime('now') ELSE COALESCE(NEW.tarif_date, datetime('now')) END,
          tariff_assigned_at = CASE WHEN NEW.tariff != OLD.tariff AND (NEW.tariff_assigned_at = OLD.tariff_assigned_at OR NEW.tariff_assigned_at IS NULL) THEN datetime('now') ELSE COALESCE(NEW.tariff_assigned_at, datetime('now')) END,
          tariff_expires_at = datetime(
            CASE WHEN NEW.tariff != OLD.tariff AND (NEW.tarif_date = OLD.tarif_date OR NEW.tarif_date IS NULL) THEN datetime('now') ELSE COALESCE(NEW.tarif_date, datetime('now')) END,
            '+' || COALESCE(NEW.tariff_duration_days, 30) || ' days'
          ),
          balance_time = datetime(
            CASE WHEN NEW.tariff != OLD.tariff AND (NEW.tarif_date = OLD.tarif_date OR NEW.tarif_date IS NULL) THEN datetime('now') ELSE COALESCE(NEW.tarif_date, datetime('now')) END,
            '+' || COALESCE(NEW.tariff_duration_days, 30) || ' days'
          )
        WHERE id = NEW.id;
      END;
    `);
  } catch (e) {}

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

  // Run full balance audit and reconciliation strictly against transactions history
  try {
    reconcileAllUserBalancesFromTransactions(db);
  } catch (e) {
    console.error('[UsersTable] Error reconciling user balances on init:', e);
  }
}

export function reconcileAllUserBalancesFromTransactions(db: Database): { updatedCount: number; details: string[] } {
  const details: string[] = [];
  let updatedCount = 0;
  try {
    const userStmt = db.prepare("SELECT id, telegram_id, email, username, first_name, created_at, balance_admin FROM users");
    const users: any[] = [];
    while (userStmt.step()) {
      users.push(userStmt.getAsObject());
    }
    userStmt.free();

    for (const u of users) {
      const canonicalId = String(u.id);
      const tgId = Number(u.telegram_id || 0);

      // Normalize all transactions to canonical user id
      if (tgId > 0 && String(tgId) !== canonicalId) {
        try {
          db.run("UPDATE transactions SET user_id = ? WHERE user_id = ?", [canonicalId, String(tgId)]);
        } catch (e) {}
      }

      // Fetch all transactions for user
      const txStmt = db.prepare("SELECT id, type, balance_type, amount, description, comment, created_at FROM transactions WHERE user_id = ? ORDER BY created_at ASC");
      txStmt.bind([canonicalId]);
      const txs: any[] = [];
      while (txStmt.step()) {
        txs.push(txStmt.getAsObject());
      }
      txStmt.free();

      // Check start transactions (start, start_tma, start_email)
      const hasTg = Number(u.telegram_id || 0) > 0;
      const hasEm = Boolean(u.email && String(u.email).trim() !== '' && u.password_hash);

      // Auto-migrate legacy 'start' type to start_tma or start_email
      for (const t of txs) {
        if (t.type === 'start') {
          const newType = hasTg ? 'start_tma' : 'start_email';
          const newDesc = hasTg ? 'Стартовый баланс Telegram Mini App (300 ИИрок)' : 'Стартовый баланс при регистрации через Email (300 ИИрок)';
          db.run("UPDATE transactions SET type = ?, description = ? WHERE id = ?", [newType, newDesc, t.id]);
          t.type = newType;
          t.description = newDesc;
          details.push(`Обновлен тип стартовой транзакции ${t.id} на ${newType} для ${canonicalId}`);
        }
      }

      // Check and grant start_tma if user has Telegram and lacks start_tma
      const hasStartTma = txs.some(t => t.type === 'start_tma');
      if (hasTg && !hasStartTma) {
        const regTime = u.created_at || new Date().toISOString();
        const startTxId = `tx_start_tma_${canonicalId}_${Date.now()}`;
        const targetDesc = 'Стартовый баланс Telegram Mini App (300 ИИрок)';
        db.run(
          `INSERT INTO transactions (id, user_id, type, balance_type, amount, description, comment, status, created_at)
           VALUES (?, ?, 'start_tma', 'start', 300, ?, 'Регистрация через Telegram', 'Завершено', ?)`,
          [startTxId, canonicalId, targetDesc, regTime]
        );
        txs.push({
          id: startTxId,
          type: 'start_tma',
          balance_type: 'start',
          amount: 300,
          description: targetDesc,
          comment: 'Регистрация через Telegram',
          status: 'Завершено',
          created_at: regTime
        });
        details.push(`Добавлен стартовый бонус (start_tma) 300 ИИрок для ${canonicalId}`);
      }

      // Check and grant start_email if user has Email+Password and lacks start_email
      const hasStartEmail = txs.some(t => t.type === 'start_email');
      if (hasEm && !hasStartEmail) {
        const regTime = u.created_at || new Date().toISOString();
        const startTxId = `tx_start_email_${canonicalId}_${Date.now()}`;
        const targetDesc = 'Стартовый баланс при регистрации через Email (300 ИИрок)';
        db.run(
          `INSERT INTO transactions (id, user_id, type, balance_type, amount, description, comment, status, created_at)
           VALUES (?, ?, 'start_email', 'start', 300, ?, 'Регистрация через Email', 'Завершено', ?)`,
          [startTxId, canonicalId, targetDesc, regTime]
        );
        txs.push({
          id: startTxId,
          type: 'start_email',
          balance_type: 'start',
          amount: 300,
          description: targetDesc,
          comment: 'Регистрация через Email',
          status: 'Завершено',
          created_at: regTime
        });
        details.push(`Добавлен стартовый бонус (start_email) 300 ИИрок для ${canonicalId}`);
      }

      // Deduplicate identical start transactions of the SAME specific type
      const seenStartKeys = new Set<string>();
      const toDeleteTxIds: string[] = [];
      for (const t of txs) {
        if (t.type === 'start_tma' || t.type === 'start_email') {
          if (seenStartKeys.has(t.type)) {
            toDeleteTxIds.push(t.id);
          } else {
            seenStartKeys.add(t.type);
          }
        }
      }
      for (const delId of toDeleteTxIds) {
        try {
          db.run("DELETE FROM transactions WHERE id = ?", [delId]);
          const idx = txs.findIndex(t => t.id === delId);
          if (idx !== -1) txs.splice(idx, 1);
          details.push(`Удалена дублирующая транзакция ${delId} для ${canonicalId}`);
        } catch (e) {}
      }

      // Calculate sums from cleaned transactions list
      let startSum = 0;
      let refSum = 0;
      let tarifSum = 0;
      let paySum = 0;
      let adminSum = 0;
      let costSum = 0;
      let lastTime: string | null = null;

      for (const t of txs) {
        const amt = Number(t.amount) || 0;
        const tType = String(t.type || '').toLowerCase();
        if (t.created_at && (!lastTime || new Date(t.created_at) > new Date(lastTime))) {
          lastTime = t.created_at;
        }

        if (tType === 'start' || tType === 'start_tma' || tType === 'start_email') {
          startSum += amt;
        } else if (tType === 'ref' || tType === 'referral_bonus') {
          refSum += amt;
        } else if (tType === 'tarif') {
          tarifSum += amt;
        } else if (tType === 'pay') {
          paySum += amt;
        } else if (tType === 'admin') {
          adminSum += amt;
        } else if (tType === 'cost') {
          costSum += Math.abs(amt);
        }
      }

      // Apply deduction order for costSum:
      // Priority: balance_tarif -> balance_start -> balance_ref -> balance_admin, then balance_pay
      let b_tarif = Math.max(0, tarifSum);
      let b_start = Math.max(0, startSum);
      let b_ref = Math.max(0, refSum);
      let b_admin = adminSum;
      let b_pay = Math.max(0, paySum);

      let remainingCost = costSum;
      if (remainingCost > 0) {
        if (b_tarif >= remainingCost) {
          b_tarif -= remainingCost;
          remainingCost = 0;
        } else {
          remainingCost -= b_tarif;
          b_tarif = 0;
          if (b_start >= remainingCost) {
            b_start -= remainingCost;
            remainingCost = 0;
          } else {
            remainingCost -= b_start;
            b_start = 0;
            if (b_ref >= remainingCost) {
              b_ref -= remainingCost;
              remainingCost = 0;
            } else {
              remainingCost -= b_ref;
              b_ref = 0;
              if (b_admin >= remainingCost) {
                b_admin -= remainingCost;
                remainingCost = 0;
              } else {
                remainingCost -= Math.max(0, b_admin);
                b_admin = 0;
                b_pay = Math.max(0, b_pay - remainingCost);
                remainingCost = 0;
              }
            }
          }
        }
      }

      const b_free = Math.max(0, b_start + b_ref + b_tarif + b_admin);
      const b_total = Math.max(0, b_pay + b_free);

      db.run(
        `UPDATE users
         SET balance_start = ?,
             balance_ref = ?,
             balance_tarif = ?,
             balance_admin = ?,
             balance_pay = ?,
             balance_cost = ?,
             balance_free = ?,
             balance = ?,
             balance_time = ?
         WHERE id = ?`,
        [b_start, b_ref, b_tarif, b_admin, b_pay, costSum, b_free, b_total, lastTime, canonicalId]
      );
      updatedCount++;
    }
  } catch (e) {
    console.error('[Reconcile Balances] Error in reconcileAllUserBalancesFromTransactions:', e);
  }
  return { updatedCount, details };
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

export function checkAndApplyStartRegistrationBonus(
  db: Database,
  userId: string,
  authMethod: 'telegram' | 'email' | 'auto' = 'auto'
): { applied: boolean; type?: string; message?: string } {
  try {
    const cleanId = format11DigitUserId(userId);
    const userStmt = db.prepare("SELECT id, telegram_id, email, password_hash, created_at, balance_start FROM users WHERE id = ? OR telegram_id = ? LIMIT 1");
    const tgNum = parseInt(userId, 10) || 0;
    userStmt.bind([cleanId, tgNum]);
    let u: any = null;
    if (userStmt.step()) {
      u = userStmt.getAsObject();
    }
    userStmt.free();

    if (!u) return { applied: false };

    const canonicalId = String(u.id);
    const hasTelegram = Number(u.telegram_id || 0) > 0 || authMethod === 'telegram';
    const hasEmail = Boolean(u.email && String(u.email).trim() !== '' && u.password_hash && String(u.password_hash).trim() !== '') || authMethod === 'email';

    // Fetch user's transactions
    const txStmt = db.prepare("SELECT id, type, description, amount FROM transactions WHERE user_id = ?");
    txStmt.bind([canonicalId]);
    const txs: any[] = [];
    while (txStmt.step()) {
      txs.push(txStmt.getAsObject());
    }
    txStmt.free();

    let hasStartTma = txs.some(t => t.type === 'start_tma');
    let hasStartEmail = txs.some(t => t.type === 'start_email');
    const legacyStartTx = txs.find(t => t.type === 'start');

    // If legacy 'start' exists, rename/update it based on registration type
    if (legacyStartTx) {
      if (hasTelegram && !hasStartTma) {
        db.run("UPDATE transactions SET type = 'start_tma', description = 'Стартовый баланс Telegram Mini App 300 ИИрок' WHERE id = ?", [legacyStartTx.id]);
        hasStartTma = true;
      } else if (hasEmail && !hasStartEmail) {
        db.run("UPDATE transactions SET type = 'start_email', description = 'Стартовый баланс при регистрации через Email 300 ИИрок' WHERE id = ?", [legacyStartTx.id]);
        hasStartEmail = true;
      } else if (hasTelegram) {
        db.run("UPDATE transactions SET type = 'start_tma' WHERE id = ?", [legacyStartTx.id]);
        hasStartTma = true;
      } else {
        db.run("UPDATE transactions SET type = 'start_email' WHERE id = ?", [legacyStartTx.id]);
        hasStartEmail = true;
      }
    }

    const regTime = u.created_at || new Date().toISOString();
    let anyApplied = false;

    // 1. If user has telegram_id (or telegram auth) and no start_tma transaction:
    if (hasTelegram && !hasStartTma) {
      addTransactionWithBalanceUpdate(db, {
        userId: canonicalId,
        type: 'start_tma',
        balanceType: 'start',
        amount: 300,
        description: 'Стартовый баланс Telegram Mini App 300 ИИрок',
        comment: 'Регистрация через Telegram',
        createdAt: regTime
      });
      hasStartTma = true;
      anyApplied = true;
    }

    // 2. If user has email + password (or email auth) and no start_email transaction:
    if (hasEmail && !hasStartEmail) {
      addTransactionWithBalanceUpdate(db, {
        userId: canonicalId,
        type: 'start_email',
        balanceType: 'start',
        amount: 300,
        description: 'Стартовый баланс при регистрации через Email 300 ИИрок',
        comment: 'Регистрация через E-mail',
        createdAt: regTime
      });
      hasStartEmail = true;
      anyApplied = true;
    }

    if (anyApplied) {
      return { applied: true, message: 'Стартовые балансы успешно начислены и синхронизированы' };
    }

    return { applied: false };
  } catch (e) {
    console.error('[Registration Trigger] Error checking/applying start bonus:', e);
    return { applied: false };
  }
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
      const isTgUser = Boolean(user.telegram_id && user.telegram_id > 0);
      const isEmailUser = Boolean(user.email && user.password_hash);
      const startType = isTgUser ? 'start_tma' : (isEmailUser ? 'start_email' : 'start_tma');
      const startDesc = isTgUser ? 'Стартовый баланс Telegram Mini App 300 ИИрок' : 'Стартовый баланс при регистрации через Email 300 ИИрок';

      addTransactionWithBalanceUpdate(db, {
        userId: finalId,
        type: startType,
        balanceType: 'start',
        amount: startBalance,
        description: startDesc,
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
      const isTgUser = Boolean(user.telegram_id && user.telegram_id > 0);
      const isEmailUser = Boolean(user.email && user.password_hash);
      const startType = isTgUser ? 'start_tma' : (isEmailUser ? 'start_email' : 'start_tma');
      const startDesc = isTgUser ? 'Стартовый баланс Telegram Mini App 300 ИИрок' : 'Стартовый баланс при регистрации через Email 300 ИИрок';

      addTransactionWithBalanceUpdate(db, {
        userId: finalId,
        type: startType,
        balanceType: 'start',
        amount: startBalance,
        description: startDesc,
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
