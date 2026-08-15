import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { initUsersTable, insertOrUpdateUserInDb, insertDefaultUserInDb } from './usersTable';
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
const dbFilePath = path.join(process.cwd(), 'app.sqlite');
const legacyDbFilePath = path.join(process.cwd(), 'database.sqlite');
let backupTimerInitialized = false;

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
        
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `app.sqlite.backup.${timestamp}`;
        const backupPath = path.join(backupDir, backupFileName);

        if (fs.existsSync(dbFilePath)) {
          fs.copyFileSync(dbFilePath, backupPath);
          console.log(`[SQLite Backup] Daily backup created at 03:00 AM: ${backupPath}`);
        }
      }

      // Periodically check monthly tariff accruals (every hour)
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

export async function getSQLiteDB(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  const fileToLoad = fs.existsSync(dbFilePath) 
    ? dbFilePath 
    : (fs.existsSync(legacyDbFilePath) ? legacyDbFilePath : null);

  if (fileToLoad) {
    try {
      const fileBuffer = fs.readFileSync(fileToLoad);
      if (fileBuffer.length === 0) {
        throw new Error('Database file is 0 bytes');
      }
      dbInstance = new SQL.Database(fileBuffer);
      dbInstance.exec("PRAGMA integrity_check;");
    } catch (e) {
      console.error('[SQLite] Unreadable DB file, initializing fresh:', e);
      try {
        const timestamp = Date.now();
        if (fs.existsSync(dbFilePath)) {
          fs.renameSync(dbFilePath, `${dbFilePath}.corrupt.${timestamp}`);
        }
        if (fs.existsSync(legacyDbFilePath)) {
          fs.renameSync(legacyDbFilePath, `${legacyDbFilePath}.corrupt.${timestamp}`);
        }
      } catch (renameErr) {
        console.error('[SQLite] Failed to rename corrupt db file:', renameErr);
      }
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // 1. High performance PRAGMAs
  try {
    dbInstance.exec("PRAGMA busy_timeout = 5000;");
    dbInstance.exec("PRAGMA cache_size = -64000;"); // 64MB memory cache
    dbInstance.exec("PRAGMA temp_store = MEMORY;");
  } catch (e) {}

  // 2. Initialize modular tables
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

  // 3. Seed default parsed Telegram users into users table
  try {
    for (const user of DEFAULT_PARSED_USERS) {
      insertDefaultUserInDb(dbInstance, user);
    }
  } catch (e) {
    console.error('[SQLite DB] Error seeding default parsed users:', e);
  }

  // 4. Seed essential permanent file_storage assets
  try {
    seedEssentialFiles(dbInstance);
  } catch (e) {
    console.error('[SQLite DB] Error seeding essential files:', e);
  }

  // 5. Initial monthly tariff check
  try {
    checkAndApplyMonthlyTariffs(dbInstance);
  } catch (e) {}

  saveDatabaseToDisk();
  scheduleDailyBackup();

  return dbInstance;
}

export function saveDatabaseToDisk() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);

    // Save atomically to dbFilePath
    const tmpPath = `${dbFilePath}.tmp`;
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, dbFilePath);

    // Save atomically to legacyDbFilePath
    const tmpLegacyPath = `${legacyDbFilePath}.tmp`;
    fs.writeFileSync(tmpLegacyPath, buffer);
    fs.renameSync(tmpLegacyPath, legacyDbFilePath);
  } catch (e) {
    console.error('[SQLite] Error saving DB to disk:', e);
  }
}
