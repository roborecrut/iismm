import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { initUsersTable, insertOrUpdateUserInDb, insertDefaultUserInDb } from './usersTable';
import { initPostsTable } from './postsTable';
import { initChannelsTable } from './channelsTable';
import { initSceneriesTable } from './sceneriesTable';
import { initPromptsTable } from './promptsTable';
import { initTransactionsTable } from './transactionsTable';
import { initBlogPostsTable } from './blogPostsTable';
import { initCronTable } from './cronTable';
import { initFilesTable } from './filesTable';
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
    } catch (err) {
      console.error('[SQLite Backup] Daily backup failed:', err);
    }
  }, 60 * 1000);
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

  // 1. Apply high-concurrency PRAGMAs for 20,000 users/day
  try {
    dbInstance.exec("PRAGMA busy_timeout = 5000;");
    dbInstance.exec("PRAGMA cache_size = -64000;"); // 64MB memory cache
    dbInstance.exec("PRAGMA temp_store = MEMORY;");
  } catch (e) {}

  // 2. Initialize modular tables
  initUsersTable(dbInstance);
  initPostsTable(dbInstance);
  initChannelsTable(dbInstance);
  initSceneriesTable(dbInstance);
  initPromptsTable(dbInstance);
  initTransactionsTable(dbInstance);
  initBlogPostsTable(dbInstance);
  initCronTable(dbInstance);
  initFilesTable(dbInstance);
  initAIAgentsTable(dbInstance);
  initTelegramBotTable(dbInstance);
  initHistoryLogsTable(dbInstance);
  initTeamsTable(dbInstance);

  // 3. Purge unwanted tables to 0 records
  try {
    dbInstance.run("DELETE FROM posts;");
    dbInstance.run("DELETE FROM sceneries;");
    dbInstance.run("DELETE FROM transactions;");
    dbInstance.run("DELETE FROM prompts;");
    dbInstance.run("DELETE FROM channels;");
    dbInstance.run("DELETE FROM history;");
    dbInstance.run("DELETE FROM logs;");
    dbInstance.run("DELETE FROM files;");
    dbInstance.run("DELETE FROM blog_posts;");
  } catch (e) {
    console.error('[SQLite DB] Error during table purge:', e);
  }

  // 4. Seed default parsed Telegram users into users table
  try {
    for (const user of DEFAULT_PARSED_USERS) {
      insertDefaultUserInDb(dbInstance, user);
    }
    console.log(`[SQLite DB] Successfully loaded ${DEFAULT_PARSED_USERS.length} default Telegram users.`);
  } catch (e) {
    console.error('[SQLite DB] Error seeding default parsed users:', e);
  }

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
