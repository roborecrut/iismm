import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { initUsersTable, insertDefaultUserInDb } from './usersTable';
import { initPostsTable } from './postsTable';
import { initChannelsTable } from './channelsTable';
import { initSceneriesTable } from './sceneriesTable';
import { initPromptsTable } from './promptsTable';
import { initTransactionsTable, addTransactionWithBalanceUpdate } from './transactionsTable';
import { initTariffsTable } from './tariffsTable';
import { initNotificationsTable } from './notificationsTable';
import { initBlogPostsTable } from './blogPostsTable';
import { initCronTable } from './cronTable';
import { initFilesTable, seedEssentialFiles } from './filesTable';
import { initAIAgentsTable } from './aiAgentsTable';
import { initTelegramBotTable } from './telegramBotTable';
import { initHistoryLogsTable } from './historyLogsTable';
import { initTeamsTable } from './teamsTable';
import { DEFAULT_PARSED_USERS } from './defaultParsedUsers';

let dbInstance: Database | null = null;
let isInitializing = false;
let initPromise: Promise<Database> | null = null;

const dbFilePath = path.join(process.cwd(), 'app.sqlite');
const backupDbFilePath = path.join(process.cwd(), 'app.sqlite.bak');
const legacyDbFilePath = path.join(process.cwd(), 'database.sqlite');
const backupsDir = path.join(process.cwd(), 'backups');

let backupTimerInitialized = false;
let isSaving = false;
let saveQueued = false;

function scheduleDailyBackup() {
  if (backupTimerInitialized) return;
  backupTimerInitialized = true;
  
  let lastBackupDate = '';

  setInterval(() => {
    try {
      const now = new Date();
      const hours = now.getHours();
      const dateStr = now.toISOString().split('T')[0];

      if (hours === 3 && lastBackupDate !== dateStr) {
        lastBackupDate = dateStr;
        saveDatabaseToDisk();
        
        if (!fs.existsSync(backupsDir)) {
          fs.mkdirSync(backupsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `app.sqlite.backup.${timestamp}`;
        const backupPath = path.join(backupsDir, backupFileName);

        if (fs.existsSync(dbFilePath)) {
          fs.copyFileSync(dbFilePath, backupPath);
          console.log(`[SQLite Backup] Daily backup created at 03:00 AM: ${backupPath}`);
        }
      }

      // Periodically check monthly tariff accruals
      if (dbInstance) {
        checkAndApplyMonthlyTariffs(dbInstance);
      }
    } catch (err) {
      console.error('[SQLite Backup] Daily backup failed:', err);
    }
  }, 60 * 1000);
}

export function checkAndApplyMonthlyTariffs(db: Database) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Find users whose balance_time is null or older than 30 days
    const stmt = db.prepare(`
      SELECT u.id, u.tariff, u.balance_time, t.monthly_iirky 
      FROM users u
      LEFT JOIN tarifs t ON LOWER(t.name) = LOWER(u.tariff) OR t.id = LOWER(u.tariff)
      WHERE u.balance_time IS NULL OR u.balance_time < ?
    `);
    stmt.bind([thirtyDaysAgo]);
    const eligibleUsers: Array<{ id: string; tariff: string; monthly_iirky: number }> = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      eligibleUsers.push({
        id: row.id,
        tariff: row.tariff || 'Старт',
        monthly_iirky: Number(row.monthly_iirky || (row.tariff === 'Отрыв' || row.tariff === 'vip' ? 4900 : row.tariff === 'Разгон' || row.tariff === 'pro' ? 990 : 300))
      });
    }
    stmt.free();

    for (const u of eligibleUsers) {
      const amount = u.monthly_iirky || 300;
      addTransactionWithBalanceUpdate(db, {
        userId: u.id,
        type: 'tarif',
        balanceType: 'tarif',
        amount,
        description: `Ежемесячное начисление по тарифу «${u.tariff}»: +${amount} ИИрок`,
        createdAt: now.toISOString()
      });
    }
    if (eligibleUsers.length > 0) {
      console.log(`[Tariff Cron] Applied monthly tariff accruals for ${eligibleUsers.length} users.`);
      saveDatabaseToDisk();
    }
  } catch (e) {
    console.error('[Tariff Cron] Error processing monthly tariffs:', e);
  }
}

export function getSyncSQLiteDB(): Database | null {
  return dbInstance;
}

export async function getSQLiteDB(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs();
    
    // Collect potential candidates in order of preference
    const candidatePaths: string[] = [
      dbFilePath,
      backupDbFilePath,
      legacyDbFilePath
    ];

    // Also look inside backups directory if available
    try {
      if (fs.existsSync(backupsDir)) {
        const files = fs.readdirSync(backupsDir)
          .filter(f => f.startsWith('app.sqlite.backup.'))
          .sort()
          .reverse();
        if (files.length > 0) {
          candidatePaths.push(path.join(backupsDir, files[0]));
        }
      }
    } catch (e) {}

    let loadedDb: Database | null = null;

    for (const candidate of candidatePaths) {
      if (!fs.existsSync(candidate)) continue;
      try {
        const fileBuffer = fs.readFileSync(candidate);
        if (fileBuffer.length < 512) continue; // SQLite header is 100 bytes + page
        
        const testDb = new SQL.Database(fileBuffer);
        const check = testDb.exec("PRAGMA integrity_check;");
        if (check && check[0]?.values?.[0]?.[0] === 'ok') {
          console.log(`[SQLite] Successfully loaded valid database from: ${path.basename(candidate)}`);
          loadedDb = testDb;
          break;
        }
      } catch (err: any) {
        console.warn(`[SQLite] Candidate ${path.basename(candidate)} failed validation: ${err.message}`);
      }
    }

    if (loadedDb) {
      dbInstance = loadedDb;
    } else {
      console.warn('[SQLite] No valid database file found, creating fresh database instance');
      dbInstance = new SQL.Database();
    }

    // High performance PRAGMAs
    try {
      dbInstance.exec("PRAGMA busy_timeout = 5000;");
      dbInstance.exec("PRAGMA cache_size = -64000;");
      dbInstance.exec("PRAGMA temp_store = MEMORY;");
    } catch (e) {}

    // Initialize all modular tables safely
    initUsersTable(dbInstance);
    initTariffsTable(dbInstance);
    initNotificationsTable(dbInstance);
    initTransactionsTable(dbInstance);
    initPostsTable(dbInstance);
    initChannelsTable(dbInstance);
    initSceneriesTable(dbInstance);
    initPromptsTable(dbInstance);
    initBlogPostsTable(dbInstance);
    initCronTable(dbInstance);
    initFilesTable(dbInstance);
    initAIAgentsTable(dbInstance);
    initTelegramBotTable(dbInstance);
    initHistoryLogsTable(dbInstance);
    initTeamsTable(dbInstance);

    // Seed default parsed users only if users table has few rows
    try {
      const uCountRes = dbInstance.exec("SELECT COUNT(*) FROM users");
      const uCount = uCountRes[0]?.values[0]?.[0] || 0;
      if (Number(uCount) < 5) {
        for (const user of DEFAULT_PARSED_USERS) {
          insertDefaultUserInDb(dbInstance, user);
        }
      }
    } catch (e) {
      console.error('[SQLite DB] Error checking/seeding default users:', e);
    }

    // Seed essential files
    try {
      seedEssentialFiles(dbInstance);
    } catch (e) {
      console.error('[SQLite DB] Error seeding essential files:', e);
    }

    // Initial check
    try {
      checkAndApplyMonthlyTariffs(dbInstance);
    } catch (e) {}

    // Flush and start daily backup
    saveDatabaseToDisk();
    scheduleDailyBackup();

    return dbInstance;
  })();

  return initPromise;
}

export function saveDatabaseToDisk(): void {
  if (!dbInstance) return;

  if (isSaving) {
    saveQueued = true;
    return;
  }

  isSaving = true;

  // Use setImmediate to ensure current event loop step / statements are completed
  setImmediate(() => {
    try {
      if (!dbInstance) return;
      const data = dbInstance.export();
      const buffer = Buffer.from(data);

      if (buffer.length < 512) {
        console.error('[SQLite] Refusing to save corrupt/empty buffer, length:', buffer.length);
        return;
      }

      // 1. Atomic write to random temp file
      const randomSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const tmpPath = `${dbFilePath}.${randomSuffix}.tmp`;
      fs.writeFileSync(tmpPath, buffer);

      // 2. Atomic rename to primary db
      fs.renameSync(tmpPath, dbFilePath);

      // 3. Keep backup copies for absolute data protection
      try {
        fs.copyFileSync(dbFilePath, backupDbFilePath);
      } catch (e) {}

      try {
        fs.copyFileSync(dbFilePath, legacyDbFilePath);
      } catch (e) {}

    } catch (e) {
      console.error('[SQLite] Error saving DB to disk:', e);
    } finally {
      isSaving = false;
      if (saveQueued) {
        saveQueued = false;
        saveDatabaseToDisk();
      }
    }
  });
}
