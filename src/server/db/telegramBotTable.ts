import { Database } from 'sql.js';

export function initTelegramBotTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS bot_settings (
      id TEXT PRIMARY KEY,
      token TEXT,
      bot_username TEXT,
      created_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_bot (
      id TEXT PRIMARY KEY,
      bot_token TEXT,
      bot_name TEXT,
      bot_username TEXT,
      bot_id TEXT,
      description TEXT,
      avatar_url TEXT,
      default_chat_id TEXT,
      api_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS protalk_settings (
      id TEXT PRIMARY KEY,
      bot_id TEXT,
      bot_token TEXT,
      default_chat_id TEXT,
      api_url TEXT,
      enabled INTEGER DEFAULT 1,
      created_at TEXT
    );
  `);

  try { db.run("ALTER TABLE telegram_bot ADD COLUMN bot_name TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE telegram_bot ADD COLUMN description TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE telegram_bot ADD COLUMN avatar_url TEXT;"); } catch (e) {}

  // 1. Seed bot_settings if empty
  try {
    const check = db.exec("SELECT COUNT(*) as cnt FROM bot_settings");
    if (!check[0]?.values[0]?.[0]) {
      db.run(
        "INSERT INTO bot_settings (id, token, bot_username, created_at) VALUES (?, ?, ?, ?)",
        [
          'main_bot',
          '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o',
          'IIrkiBot',
          new Date().toISOString()
        ]
      );
    }
  } catch (e) {
    console.error('[telegramBotTable] Error seeding bot_settings:', e);
  }

  // 2. Seed telegram_bot if empty
  try {
    const check = db.exec("SELECT COUNT(*) as cnt FROM telegram_bot");
    if (!check[0]?.values[0]?.[0]) {
      db.run(
        "INSERT INTO telegram_bot (id, bot_token, bot_name, bot_username, bot_id, description, avatar_url, default_chat_id, api_url, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          'bot_1',
          '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o',
          'ИИрки Постинг Бот',
          '@IIrkiBot',
          '8142466188',
          'Официальный Telegram бот сервиса ИИSMM для автопостинга и генерации контента.',
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop',
          '@SAV_AI',
          'https://eu1.api.pro-talk.ru/api/v1.0',
          1,
          new Date().toISOString()
        ]
      );
    } else {
      // Ensure latest bot info is set
      db.run(`
        UPDATE telegram_bot SET 
          bot_token = '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o',
          bot_username = '@IIrkiBot',
          bot_name = 'ИИрки Постинг Бот',
          bot_id = '8142466188'
        WHERE id = 'bot_1';
      `);
    }
  } catch (e) {
    console.error('[telegramBotTable] Error seeding telegram_bot:', e);
  }

  // 3. Seed protalk_settings if empty
  try {
    const check = db.exec("SELECT COUNT(*) as cnt FROM protalk_settings");
    if (!check[0]?.values[0]?.[0]) {
      db.run(
        "INSERT INTO protalk_settings (id, bot_id, bot_token, default_chat_id, api_url, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          'setting_1',
          '66275',
          'GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE',
          '@SAV_AI',
          'https://eu1.api.pro-talk.ru/api/v1.0',
          1,
          new Date().toISOString()
        ]
      );
    } else {
      db.run(`
        UPDATE protalk_settings SET 
          bot_token = 'GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE',
          bot_id = '66275'
        WHERE id = 'setting_1';
      `);
    }
  } catch (e) {
    console.error('[telegramBotTable] Error seeding protalk_settings:', e);
  }
}

export function getTelegramBotSettingsFromDb(db: Database) {
  try {
    const stmt = db.prepare("SELECT * FROM telegram_bot WHERE id = 'bot_1' LIMIT 1");
    let bot: any = null;
    if (stmt.step()) {
      bot = stmt.getAsObject();
    }
    stmt.free();
    return bot;
  } catch (e) {
    return null;
  }
}
