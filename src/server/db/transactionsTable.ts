import { Database } from 'sql.js';
import { createNotificationInDb } from './notificationsTable';

export type TransactionType = 'start' | 'pay' | 'tarif' | 'ref' | 'admin' | 'cost';

export interface TransactionRecord {
  id: string;
  user_id: string;
  type: TransactionType;
  balance_type: string;
  amount: number;
  description: string;
  comment?: string;
  status: string;
  created_at: string;
}

export function initTransactionsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      balance_type TEXT DEFAULT 'free',
      amount INTEGER NOT NULL,
      description TEXT,
      comment TEXT,
      status TEXT DEFAULT 'Завершено',
      created_at TEXT NOT NULL
    );
  `);

  // Ensure columns exist on upgrade
  try { db.run("ALTER TABLE transactions ADD COLUMN balance_type TEXT DEFAULT 'free';"); } catch (e) {}
  try { db.run("ALTER TABLE transactions ADD COLUMN comment TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'Завершено';"); } catch (e) {}

  db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);`);
}

export function getAllTransactionsFromDb(db: Database, limit = 500): TransactionRecord[] {
  try {
    const stmt = db.prepare("SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?");
    stmt.bind([limit]);
    const res: TransactionRecord[] = [];
    while (stmt.step()) {
      res.push(stmt.getAsObject() as any);
    }
    stmt.free();
    return res;
  } catch (e) {
    return [];
  }
}

export function getUserTransactionsFromDb(db: Database, userId: string, limit = 100): TransactionRecord[] {
  try {
    const stmt = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?");
    stmt.bind([userId, limit]);
    const res: TransactionRecord[] = [];
    while (stmt.step()) {
      res.push(stmt.getAsObject() as any);
    }
    stmt.free();
    return res;
  } catch (e) {
    return [];
  }
}

export interface AddTransactionParams {
  userId: string;
  type: TransactionType;
  balanceType?: string;
  amount: number;
  description: string;
  comment?: string;
  status?: string;
  createdAt?: string;
}

export function addTransactionWithBalanceUpdate(
  db: Database,
  params: AddTransactionParams
): { transaction: TransactionRecord; newBalances: any } {
  const txId = `tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const createdAt = params.createdAt || new Date().toISOString();
  const status = params.status || 'Завершено';
  const balanceType = params.balanceType || (params.type === 'pay' ? 'pay' : params.type === 'admin' ? 'admin' : 'free');
  const comment = params.comment || '';
  const description = params.description || 'Транзакция';
  const amount = Number(params.amount) || 0;
  const userId = params.userId;

  // 1. Insert into transactions
  db.run(
    `INSERT INTO transactions (id, user_id, type, balance_type, amount, description, comment, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [txId, userId, params.type, balanceType, amount, description, comment, status, createdAt]
  );

  // 2. Fetch current user balances
  const stmt = db.prepare(`
    SELECT id, balance, balance_free, balance_pay, balance_start, balance_ref, balance_tarif, balance_admin, balance_cost, balance_time, tariff
    FROM users WHERE id = ? LIMIT 1
  `);
  stmt.bind([userId]);
  let userFound = false;
  let u: any = {};
  if (stmt.step()) {
    userFound = true;
    u = stmt.getAsObject();
  }
  stmt.free();

  let balance_pay = Number(u.balance_pay || 0);
  let balance_start = Number(u.balance_start || 0);
  let balance_ref = Number(u.balance_ref || 0);
  let balance_tarif = Number(u.balance_tarif || 0);
  let balance_admin = Number(u.balance_admin || 0);
  let balance_cost = Number(u.balance_cost || 0);
  let balance_time = u.balance_time || null;

  if (userFound) {
    if (params.type === 'start') {
      balance_start = Math.max(0, balance_start + amount);
    } else if (params.type === 'ref') {
      balance_ref = Math.max(0, balance_ref + amount);
    } else if (params.type === 'tarif') {
      balance_tarif = Math.max(0, balance_tarif + amount);
      balance_time = createdAt;
    } else if (params.type === 'pay') {
      balance_pay = Math.max(0, balance_pay + amount);
    } else if (params.type === 'admin') {
      balance_admin = balance_admin + amount;
    } else if (params.type === 'cost') {
      const cost = Math.abs(amount);
      balance_cost += cost;

      // Deduction priority: first balance_free (tarif -> start -> ref -> admin), then balance_pay
      let freeAvailable = balance_start + balance_ref + balance_tarif + balance_admin;
      if (freeAvailable >= cost) {
        let remainingToDeduct = cost;
        if (balance_tarif >= remainingToDeduct) {
          balance_tarif -= remainingToDeduct;
          remainingToDeduct = 0;
        } else {
          remainingToDeduct -= balance_tarif;
          balance_tarif = 0;
          if (balance_start >= remainingToDeduct) {
            balance_start -= remainingToDeduct;
            remainingToDeduct = 0;
          } else {
            remainingToDeduct -= balance_start;
            balance_start = 0;
            if (balance_ref >= remainingToDeduct) {
              balance_ref -= remainingToDeduct;
              remainingToDeduct = 0;
            } else {
              remainingToDeduct -= balance_ref;
              balance_ref = 0;
              balance_admin = Math.max(0, balance_admin - remainingToDeduct);
              remainingToDeduct = 0;
            }
          }
        }
      } else {
        // Not enough free balance -> drain all free components and deduct remainder from balance_pay
        const remainder = cost - freeAvailable;
        balance_start = 0;
        balance_ref = 0;
        balance_tarif = 0;
        balance_admin = 0;
        balance_pay = Math.max(0, balance_pay - remainder);
      }
    }

    const balance_free = Math.max(0, balance_start + balance_ref + balance_tarif + balance_admin);
    const balance = Math.max(0, balance_pay + balance_free);

    db.run(
      `UPDATE users 
       SET balance = ?, balance_free = ?, balance_pay = ?, balance_start = ?, balance_ref = ?, balance_tarif = ?, balance_admin = ?, balance_cost = ?, balance_time = ?
       WHERE id = ?`,
      [balance, balance_free, balance_pay, balance_start, balance_ref, balance_tarif, balance_admin, balance_cost, balance_time, userId]
    );

    // 3. Create real-time notification
    let notifTitle = 'Изменение баланса';
    let notifMsg = `${description}: ${amount > 0 ? '+' : ''}${amount} ИИрок.`;
    if (params.type === 'start') {
      notifTitle = 'Приветственный бонус';
      notifMsg = `Вам начислено ${amount} ИИрок по тарифу Старт!`;
    } else if (params.type === 'pay') {
      notifTitle = 'Пополнение баланса';
      notifMsg = `Баланс успешно пополнен на ${amount} ИИрок.`;
    } else if (params.type === 'tarif') {
      notifTitle = 'Ежемесячный тарифный бонус';
      notifMsg = `Вам начислено ${amount} ИИрок по тарифу.`;
    } else if (params.type === 'ref') {
      notifTitle = 'Партнерское вознаграждение';
      notifMsg = `Начислено ${amount} ИИрок за реферала.`;
    } else if (params.type === 'admin') {
      notifTitle = 'Административная корректировка';
      notifMsg = `Администратор изменил ваш баланс на ${amount > 0 ? '+' : ''}${amount} ИИрок. Причина: ${comment || 'Корректировка'}`;
    } else if (params.type === 'cost') {
      notifTitle = 'Списание ИИрок';
      notifMsg = `${description}: списано ${Math.abs(amount)} ИИрок.`;
    }

    createNotificationInDb(db, {
      userId,
      type: 'balance',
      title: notifTitle,
      message: notifMsg
    });
  }

  const record: TransactionRecord = {
    id: txId,
    user_id: userId,
    type: params.type,
    balance_type: balanceType,
    amount,
    description,
    comment,
    status,
    created_at: createdAt
  };

  return {
    transaction: record,
    newBalances: {
      balance: Math.max(0, balance_pay + (balance_start + balance_ref + balance_tarif + balance_admin)),
      balance_free: Math.max(0, balance_start + balance_ref + balance_tarif + balance_admin),
      balance_pay,
      balance_start,
      balance_ref,
      balance_tarif,
      balance_admin,
      balance_cost,
      balance_time
    }
  };
}
