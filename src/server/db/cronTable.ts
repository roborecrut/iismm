import { Database } from 'sql.js';

export function initCronTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS cron (
      id TEXT PRIMARY KEY,
      item_type TEXT,
      item_id TEXT,
      title TEXT,
      cron_expression TEXT,
      schedule_human TEXT,
      next_run TEXT,
      last_run TEXT,
      status TEXT,
      created_at TEXT
    );
  `);

  try {
    const defaultCron = [
      {
        id: 'cron_1',
        item_type: 'post',
        item_id: '1',
        title: 'Публикация в боте ВКонтакте',
        cron_expression: '0 10 * * *',
        schedule_human: 'Каждый день в 10:00 MSK',
        next_run: new Date(Date.now() + 86400000).toISOString(),
        last_run: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'cron_2',
        item_type: 'post',
        item_id: '2',
        title: 'Маркетинговый пост по расписанию',
        cron_expression: '0 18 * * 1,3,5',
        schedule_human: 'Пн, Ср, Пт в 18:00 MSK',
        next_run: new Date(Date.now() + 172800000).toISOString(),
        last_run: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'cron_3',
        item_type: 'scenery',
        item_id: 'scen_1',
        title: 'Автоматический Сценарий: ИИ Контент-Менеджер',
        cron_expression: '0 12 * * *',
        schedule_human: 'Ежедневно в 12:00 MSK',
        next_run: new Date(Date.now() + 43200000).toISOString(),
        last_run: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'cron_4',
        item_type: 'system',
        item_id: 'sys_1',
        title: 'daily_sav_ai_autoposter (Публикация промптов)',
        cron_expression: '0 07 * * *',
        schedule_human: 'Каждый день в 07:00 MSK',
        next_run: new Date(Date.now() + 86400000).toISOString(),
        last_run: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'cron_5',
        item_type: 'system',
        item_id: 'sys_2',
        title: 'recalculate_engagement_rates (Пересчет ER)',
        cron_expression: '0 * * * *',
        schedule_human: 'Каждый час (*:00 MSK)',
        next_run: new Date(Date.now() + 3600000).toISOString(),
        last_run: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'cron_6',
        item_type: 'system',
        item_id: 'sys_3',
        title: 'database_integrity_backup (Резервное копирование)',
        cron_expression: '0 03 * * 0',
        schedule_human: 'Каждое воскресенье в 03:00 MSK',
        next_run: new Date(Date.now() + 604800000).toISOString(),
        last_run: new Date().toISOString(),
        status: 'active'
      }
    ];

    const cronCheck = db.exec("SELECT COUNT(*) as cnt FROM cron");
    const count = Number(cronCheck[0]?.values[0]?.[0] || 0);

    if (count === 0) {
      for (const c of defaultCron) {
        db.run(
          `INSERT OR IGNORE INTO cron (id, item_type, item_id, title, cron_expression, schedule_human, next_run, last_run, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.item_type, c.item_id, c.title, c.cron_expression, c.schedule_human, c.next_run, c.last_run, c.status, new Date().toISOString()]
        );
      }
    }
  } catch (e) {
    console.error('[SQLite] Error seeding cron table in cronTable.ts:', e);
  }
}

export function getAllCronJobsFromDb(db: Database) {
  try {
    const stmt = db.prepare("SELECT * FROM cron ORDER BY created_at DESC");
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
