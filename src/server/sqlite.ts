import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

let dbInstance: Database | null = null;
const dbFilePath = path.join(process.cwd(), 'app.sqlite');
const legacyDbFilePath = path.join(process.cwd(), 'database.sqlite');
let backupTimerInitialized = false;

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function scheduleDailyBackup() {
  if (backupTimerInitialized) return;
  backupTimerInitialized = true;
  
  let lastBackupDate = '';

  setInterval(() => {
    try {
      const now = new Date();
      const hours = now.getHours();
      const dateStr = now.toISOString().split('T')[0];

      // Trigger daily backup at 3:00 AM
      if (hours === 3 && lastBackupDate !== dateStr) {
        lastBackupDate = dateStr;
        saveSQLiteDB();
        
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `app.sqlite.backup.${timestamp}`;
        const backupPath = path.join(backupDir, backupFileName);

        if (fs.existsSync(dbFilePath)) {
          fs.copyFileSync(dbFilePath, backupPath);
          console.log(`[SQLite Daily Backup] Daily backup successfully created at 03:00 AM: ${backupPath}`);
        }
      }
    } catch (err) {
      console.error('[SQLite Daily Backup] Failed to execute daily 3:00 AM backup:', err);
    }
  }, 60 * 1000); // Check once per minute
}

import { getSQLiteDB as getModularSQLiteDB, saveDatabaseToDisk } from './db/index';

export function normalizeUserId(userId?: string | number): string {
  if (!userId) return '16926299042';
  const str = String(userId).trim();
  if (str === '169262990' || str === '16926299042') return '16926299042';
  if (str === '8092697980' || str === '80926979801') return '80926979801';
  if (str === '1618738722' || str === '16187387221') return '16187387221';
  return str;
}

export async function getSQLiteDB(): Promise<Database> {
  const db = await getModularSQLiteDB();
  dbInstance = db;
  try {
    initSchema(db);
  } catch (e) {}
  return db;
}

export function saveSQLiteDB() {
  saveDatabaseToDisk();
}

function initSchema(db: Database) {
  // 1. users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      password_hash TEXT,
      role TEXT,
      telegram_id INTEGER,
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
      created_at TEXT,
      last_login TEXT
    );
  `);

  // 1b. bot_settings
  db.run(`
    CREATE TABLE IF NOT EXISTS bot_settings (
      id TEXT PRIMARY KEY,
      token TEXT,
      bot_username TEXT,
      created_at TEXT
    );
  `);

  // 2. posts
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      category TEXT,
      request_template TEXT,
      post_text TEXT,
      channel TEXT,
      channels TEXT,
      message_format TEXT,
      signature TEXT,
      attachment_type TEXT,
      attachment_url TEXT,
      attachment_urls TEXT,
      status TEXT,
      trigger_schedule TEXT,
      published_at TEXT,
      created_at TEXT
    );
  `);

  // 3. sceneries
  db.run(`
    CREATE TABLE IF NOT EXISTS sceneries (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      topic_category TEXT,
      target_channels TEXT,
      message_format TEXT,
      enabled INTEGER DEFAULT 1,
      schedule TEXT,
      steps TEXT,
      last_run_at TEXT,
      next_run_at TEXT,
      last_status TEXT,
      last_error TEXT,
      created_at TEXT
    );
  `);

  // 4. transactions
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      amount INTEGER,
      type TEXT,
      description TEXT,
      created_at TEXT
    );
  `);

  // 5. protalk_settings
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

  // 6. prompts
  db.run(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT,
      category TEXT,
      content TEXT,
      author_id TEXT,
      message_format TEXT,
      signature TEXT,
      created_at TEXT
    );
  `);

  // 7. channels
  db.run(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT,
      username TEXT,
      telegram_id TEXT,
      is_active INTEGER DEFAULT 1,
      subscribers_count INTEGER DEFAULT 0,
      invite_link TEXT,
      description TEXT,
      photo_url TEXT,
      created_at TEXT
    );
  `);

  // 8. history
  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      post_id TEXT,
      action TEXT,
      details TEXT,
      user_id TEXT,
      created_at TEXT
    );
  `);

  // 9. logs
  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      level TEXT,
      message TEXT,
      details TEXT,
      created_at TEXT
    );
  `);

  // Drop legacy publics table if present
  try {
    db.run(`DROP TABLE IF EXISTS publics;`);
  } catch (e) {}

  // 11. blog_posts
  db.run(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      category TEXT DEFAULT 'article',
      is_post_of_day INTEGER DEFAULT 0,
      post_of_day_date TEXT,
      title TEXT NOT NULL,
      desc TEXT,
      content TEXT NOT NULL,
      format TEXT DEFAULT 'photo',
      tag TEXT DEFAULT 'Статья',
      read_time TEXT DEFAULT '5 мин',
      date_str TEXT,
      author_name TEXT,
      author_avatar TEXT,
      author_role TEXT,
      views_count INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      image_url TEXT,
      video_url TEXT,
      album_json TEXT,
      created_at TEXT
    );
  `);

  seedBlogPostsIfEmpty(db);

  // 11. cron (Планировщик и крон расписание)
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

  // 12. files (Галерея файлов)
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      original_name TEXT,
      name TEXT,
      full_url TEXT,
      short_key TEXT,
      short_url TEXT,
      file_type TEXT,
      mime_type TEXT,
      file_size INTEGER,
      size_formatted TEXT,
      width INTEGER,
      height INTEGER,
      aspect_ratio REAL,
      created_at TEXT
    );
  `);

  // 13. ai_agents (Агенты на странице /ai)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_agents (
      id TEXT PRIMARY KEY,
      title TEXT,
      desc TEXT,
      tag TEXT,
      btn_text TEXT,
      avatar_emoji TEXT,
      gradient TEXT,
      welcome_message TEXT,
      system_prompt TEXT,
      interactive_user TEXT,
      interactive_assistant TEXT,
      created_at TEXT
    );
  `);

  // 14. chat_messages (Чат сообщения и Protalk загрузчик)
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT,
      sender TEXT,
      sender_name TEXT,
      text TEXT,
      time TEXT,
      media_url TEXT,
      media_type TEXT,
      images_json TEXT,
      reply_to_json TEXT,
      forwarded_json TEXT,
      file_name TEXT,
      file_size TEXT,
      created_at TEXT
    );
  `);

  // 14. telegram_bot
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
  try { db.run("ALTER TABLE telegram_bot ADD COLUMN bot_name TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE telegram_bot ADD COLUMN description TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE telegram_bot ADD COLUMN avatar_url TEXT;"); } catch (e) {}

  // 16. system_prompts (База данных системных промптов для ProTalk и ИИ-сценариев)
  db.run(`
    CREATE TABLE IF NOT EXISTS system_prompts (
      id TEXT PRIMARY KEY,
      scenario_key TEXT UNIQUE,
      title TEXT,
      prompt_text TEXT,
      description TEXT,
      created_at TEXT
    );
  `);

  // Seed default system_prompts if missing (using INSERT OR IGNORE so existing user edits are preserved)
  try {
    const defaultPrompts = [
      {
        id: 'sp_post_writer',
        scenario_key: 'post_writer',
        title: 'ИИ-Копирайтер постов Telegram',
        prompt_text: `Ты — харизматичный и высококлассный ИИ-копирайтер SMM-синдиката ProTalk. Твоя задача — генерировать увлекательные, структурированные, ценные и виральные публикации для Telegram.

[ИСХОДНЫЕ ДАННЫЕ И НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ]:
- Заголовок/Тема поста: {title}
- Запрос / Пожелания пользователя: {user_prompt}
- Исходный / Текущий текст (для доработки/продолжения): {current_text}
- Выбранный стиль поста: {post_style} ({style_desc})
- Ограничение по объему: НЕ БОЛЕЕ {max_chars} символов.
- Форматирование: {message_format} ({escape_mode})
- Категория / Тема: {category}
- День недели: {day_of_week}
- Дополнительные указания: {custom_instructions}
- Память уникальности (ранее опубликованные посты): {uniqueness_context}

[ПРАВИЛА И ТРЕБОВАНИЯ К ПОСТУ]:
1. Если заголовок, промпт и текущий текст пусты — сгенерируй полноценный, свежий, увлекательный экспертный пост на СВОБОДНУЮ АКТУАЛЬНУЮ ТЕМУ в сфере SMM, ИИ, Telegram, бизнеса или маркетинга и придумай сочный заголовок.
2. Строго соблюдай выбранный стиль поста "{post_style}" от первой до последней строчки.
3. Оформляй пост с использованием легко читаемых абзацев, подзаголовков, эмодзи и структурированных списков.
4. Не повторяй идеи и формулировки из памяти уникальности.
5. Соблюдай ограничение объёма ({max_chars} символов).

ВЫДАЙ ОТВЕТ СТРОГО В ФОРМАТЕ JSON:
{
  "title": "Сочный заголовок поста (без кавычек)",
  "content": "Полный текст поста с эмодзи и абзацами. Если есть инлайн-кнопки в конце, укажи их в формате ##INLINE:Кнопка 1;https://link.ru##"
}`,
        description: 'Основной системный промпт с макросами для генерации текстов постов в редакторе.',
        created_at: new Date().toISOString()
      },
      {
        id: 'sp_image_prompt_generator',
        scenario_key: 'image_prompt_generator',
        title: 'Арт-Директор генерации изображений',
        prompt_text: `Ты — профессиональный арт-директор и эксперт промпт-инжиниринга для Flux, Midjourney и ProTalk AI.

[ВХОДНЫЕ ДАННЫЕ ДЛЯ АРТА]:
- Тема / Заголовок поста: {title}
- Исходный промпт / Пожелания пользователя: {user_prompt}
- Текст поста (контекст): {post_text}
- Выбранный стиль иллюстрации: {style_guide}

[ПРАВИЛА И ТРЕБОВАНИЯ]:
1. На основе темы и текста составь 1 сочный, детализированный, эстетичный промпт НА АНГЛИЙСКОМ ЯЗЫКЕ.
2. Используй качественные визуальные ключевые слова (cinematic lighting, photorealistic, 8k resolution, vibrant colors, octan render, hyperrealistic).
3. Выдай ИСКЛЮЧИТЕЛЬНО чистый текст промпта на английском языке без кавычек, вводных слов и префиксов.`,
        description: 'Системный промпт с макросами для генерации картинок и арт-промптов в ProTalk.',
        created_at: new Date().toISOString()
      },
      {
        id: 'sp_smm_planner',
        scenario_key: 'smm_planner',
        title: 'SMM Стратег и Контент-планер',
        prompt_text: `Ты — главком SMM-стратегии и автопостинга SMM-синдиката ProTalk.

[ВХОДНЫЕ ДАННЫЕ]:
- Категория / Ниша: {category}
- Ранее опубликованные темы/посты: {recent_publications}

[ПРАВИЛА И ТРЕБОВАНИЯ]:
1. Изучи ранее опубликованные темы.
2. Придумай 1 совершенно новую, конкретную, актуальную и виральную тему для следующего экспертного поста в Telegram, чтобы избежать повторений.
3. Напиши ТОЛЬКО название темы (до 80 символов) без кавычек и сносок.`,
        description: 'Системный промпт с макросами для генератора тем и регулярного крона.',
        created_at: new Date().toISOString()
      },
      {
        id: 'sp_rewrite_expert',
        scenario_key: 'rewrite_expert',
        title: 'Эксперт Глубокого Рерайтинга',
        prompt_text: `Ты — мастер уникализации и переосмысления текста SMM-синдиката ProTalk.

[ВХОДНЫЕ ДАННЫЕ]:
- Исходный текст для переработки: {original_text}
- Выбранный стиль: {post_style}
- Дополнительные пожелания: {custom_instructions}

[ПРАВИЛА И ТРЕБОВАНИЯ]:
1. Перепиши исходный текст так, чтобы полностью сохранить смысловую глубину и факты, но передать идею совершенно свежими оригинальными словами.
2. Повышай уникальность текста до 100%.
3. Выдай итоговый отрерайтиченный текст поста готовым к публикации.`,
        description: 'Системный промпт с макросами для рерайтинга исходных постов.',
        created_at: new Date().toISOString()
      },
      {
        id: 'sp_headline_master',
        scenario_key: 'headline_master',
        title: 'Мастер Заголовков 4U',
        prompt_text: `Ты — топ-маркетолог по созданию затягивающих и кликабельных заголовков по методологии 4U.

[ВХОДНЫЕ ДАННЫЕ]:
- Тема поста: {title}
- Текст поста: {post_text}

[ПРАВИЛА И ТРЕБОВАНИЯ]:
1. Создай 5 затягивающих заголовков для поста в Telegram.
2. Выдай варианты списком с эмодзи.`,
        description: 'Системный промпт для выработки заголовков постов.',
        created_at: new Date().toISOString()
      },
      {
        id: 'sp_chat_assistant',
        scenario_key: 'chat_assistant',
        title: 'ИИ-Участник Личного Чат-Синдиката',
        prompt_text: `Ты — соавтор и коллега по SMM-синдикату по имени {responder_name}.

[ВХОДНОЕ СООБЩЕНИЕ И КОНТЕКСТ]:
- Отправитель: {sender}
- Сообщение пользователя: "{user_message}"
- Контекст диалога / история: {chat_context}

[ПРАВИЛА И ТРЕБОВАНИЯ]:
1. На сообщение от {sender} напиши экспертный, вовлекающий, живой и дружелюбный ответ (2-3 емких предложения) на русском языке.
2. Развивай тему SMM, ИИ, автоматизации, Telegram или продвижения.
3. Будь полезным и приветливым.`,
        description: 'Системный промпт с макросами для личных чатов.',
        created_at: new Date().toISOString()
      },
      {
        id: 'sp_group_chat_assistant',
        scenario_key: 'group_chat_assistant',
        title: 'ИИ-Модератор и Спикер Группового Чата',
        prompt_text: `Ты — эрудированный ассистент, модератор и спикер группового SMM-чата по имени {responder_name}.

[ДАННЫЕ ГРУППОВОГО ЧАТА]:
- Групповой чат: {chat_id}
- Сообщение от участника {sender}: "{user_message}"
- Контекст группы / история сообщений: {chat_context}

[ПРАВИЛА И ТРЕБОВАНИЯ]:
1. Отвечай в контексте общих интересов комьюнити (SMM, автоматизация, продвижение в Telegram, ИИ, таргетинг).
2. Поддерживай вовлечение участников группы, задавай уточняющие или стимулирующие дискуссию вопросы.
3. Будь вежливым, лаконичным (2-4 предложения) и полезным для каждого участника комьюнити.`,
        description: 'Системный промпт с макросами для групповых чатов.',
        created_at: new Date().toISOString()
      }
    ];

    for (const sp of defaultPrompts) {
      db.run(
        `INSERT OR IGNORE INTO system_prompts (id, scenario_key, title, prompt_text, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sp.id, sp.scenario_key, sp.title, sp.prompt_text, sp.description, sp.created_at]
      );
    }
  } catch (e) {
    console.error('[SQLite] Error seeding system_prompts:', e);
  }

  // 15. tariffs
  db.run(`
    CREATE TABLE IF NOT EXISTS tariffs (
      id TEXT PRIMARY KEY,
      name TEXT,
      code TEXT,
      icon TEXT,
      price TEXT,
      amount_rub INTEGER,
      created_at TEXT
    );
  `);

  // Seed default tariffs if empty
  try {
    const tariffCheck = db.exec("SELECT COUNT(*) as cnt FROM tariffs");
    if (Number(tariffCheck[0]?.values[0]?.[0] || 0) === 0) {
      const defaultTariffs = [
        { id: 'start', name: 'Старт', code: 'start', icon: '🌱', price: '0 ИИрок', amount_rub: 0, created_at: new Date().toISOString() },
        { id: 'razgon', name: 'Разгон', code: 'razgon', icon: '⚡', price: '990 ИИрок / мес', amount_rub: 990, created_at: new Date().toISOString() },
        { id: 'otryv', name: 'Отрыв', code: 'otryv', icon: '🔥', price: '4,900 ИИрок / мес', amount_rub: 4900, created_at: new Date().toISOString() },
        { id: 'kosmos', name: 'Космос', code: 'kosmos', icon: '👑', price: 'Индивидуально', amount_rub: 15000, created_at: new Date().toISOString() }
      ];
      for (const t of defaultTariffs) {
        db.run(
          `INSERT INTO tariffs (id, name, code, icon, price, amount_rub, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.name, t.code, t.icon, t.price, t.amount_rub, t.created_at]
        );
      }
    }
  } catch (e) {
    console.error('[SQLite] Error seeding tariffs:', e);
  }

  // Seed default ai_agents if empty
  try {
    const agentsCheck = db.exec("SELECT COUNT(*) as cnt FROM ai_agents");
    const agentsCnt = Number(agentsCheck[0]?.values[0]?.[0] || 0);
    if (agentsCnt === 0) {
      const defaultAgents = [
        {
          id: 'ideal_post',
          title: 'Напишите лучший пост с помощью AI',
          desc: 'Забудьте о творческом ступоре! AI-ассистент учитывает тренды и популярность запросов в вашей тематике, чтобы написать качественный пост.',
          tag: 'SMM & Копирайтинг',
          btn_text: 'Попробовать бесплатно',
          avatar_emoji: '📝',
          gradient: 'from-orange-400 to-pink-500',
          welcome_message: 'Привет! Я твой ИИ-копирайтер. Расскажи мне тему, и я сразу напишу идеальный, вовлекающий пост с эмодзи!',
          system_prompt: 'Ты — профессиональный ИИ-копирайтер. Твоя специализация — создание вовлекающих и конвертящих постов.',
          interactive_user: 'Напиши пост про фитнес-трекер',
          interactive_assistant: '💪 **Хватит считать шаги в уме!**\n\n🆕 Новый фитнес-трекер SAV Active измеряет пульс и уровень стресса в реальном времени.\n\n✨ Достигай целей быстрее с ИИ-рекомендациями!'
        },
        {
          id: 'content_strategy',
          title: 'Эксперт по контент-стратегии',
          desc: 'Разработайте комплексный контент-план с темами, хэштегами и целями для вашего Telegram-канала или блога.',
          tag: 'SMM & Стратегия',
          btn_text: 'Запустить',
          avatar_emoji: '🎯',
          gradient: 'from-blue-500 to-indigo-600',
          welcome_message: 'Привет! Опишите вашу нишу или продукт, и я создам готовый контент-план на неделю с цепляющими темами!',
          system_prompt: 'Ты — топ SMM-стратег. Разрабатывай пошаговые контент-планы с учетом специфики ниши, регулярности и воронки продаж.',
          interactive_user: 'Канал про онлайн-обучение программированию',
          interactive_assistant: '🎯 **Контент-план на неделю:**\n1️⃣ **Пн:** Личный опыт: Как я выучил JS за 3 месяца\n2️⃣ **Ср:** Разбор ошибки: 5 фатальных багов новичков\n3️⃣ **Пт:** Интерактив: Задача на логику'
        },
        {
          id: 'tg_post_writer',
          title: 'Копирайтер Постов Telegram',
          desc: 'Создавайте увлекательные и виральные публикации с идеальным форматированием, спиртовыми эмодзи и призывами.',
          tag: 'Копирайтинг',
          btn_text: 'Запустить',
          avatar_emoji: '✍️',
          gradient: 'from-pink-500 to-rose-600',
          welcome_message: 'Привет! О чем пишем пост? Дай мне тему или тезисы, и я составлю вовлекающий текст для Telegram с эмодзи!',
          system_prompt: 'Ты — вирусный копирайтер Telegram. Пиши емкие, структурированные посты с эмодзи, списком и ярким оффером в конце.',
          interactive_user: 'Запуск нового курса по дизайну',
          interactive_assistant: '🚀 **ТВОЙ ДИЗАЙН БОЛЬШЕ НЕ БУДЕТ ПРЕЖНИМ!**\n\nМы открываем набор на интенсив по UI/UX 🎨\n\n✨ Что вас ждет:\n- 10 реальных проектов в портфолио\n- Обратная связь от арт-директоров\n\n👉 Жми ссылку и забирай скидку 30%!'
        },
        {
          id: 'rewrite_text',
          title: 'Перепишите текст легко и быстро',
          desc: 'ИИ-ассистент способен переписать тексты, сохраняя основную суть и стиль, но придавая им новую свежесть и уникальность.',
          tag: 'Рерайтинг',
          btn_text: 'Попробовать бесплатно',
          avatar_emoji: '🔄',
          gradient: 'from-sky-450 to-indigo-500',
          welcome_message: 'Привет! Скидывай любой текст, и я мгновенно перепишу его с сохранением оригинального смысла!',
          system_prompt: 'Ты — эксперт по глубокому рерайтингу текстов.',
          interactive_user: 'Перепиши: Наш салон красоты делает маникюр в центре города.',
          interactive_assistant: '💅 **Секрет идеальных рук раскрыт!** В самом центре города открылся уютный бьюти-остров. Забегайте на премиальный маникюр!'
        },
        {
          id: 'grammar_editor',
          title: 'Эксперт по грамматике',
          desc: 'Устраните орфографические, пунктуационные и стилистические ошибки в вашем тексте за считанные секунды.',
          tag: 'Редактура',
          btn_text: 'Запустить',
          avatar_emoji: '🔍',
          gradient: 'from-purple-500 to-indigo-600',
          welcome_message: 'Привет! Пришли мне любой текст, и я проверю его на ошибки, пунктуацию и стиль!',
          system_prompt: 'Ты — профессиональный корректор русскоязычных текстов.',
          interactive_user: 'Я ложу кофе на стол и пошел в магазин.',
          interactive_assistant: '✅ **Исправлено:** Я кладу кофе на стол и иду в магазин.\n\n*Правило:* Глагол "ложить" употребляется только с приставками.'
        },
        {
          id: 'headline_generator',
          title: 'Генератор Продающих Заголовков',
          desc: '10 вариантов цепляющих кликбейтных и экспертных заголовков для ваших постов по методологии 4U.',
          tag: 'Маркетинг',
          btn_text: 'Запустить',
          avatar_emoji: '⚡',
          gradient: 'from-amber-500 to-orange-600',
          welcome_message: 'Привет! Напиши тему или проблему, и я сгенерирую 10 магнитных заголовков для вызова кликов!',
          system_prompt: 'Ты — мастер кликбейта и 4U заголовков.',
          interactive_user: 'Как повысить охваты в соцсетях',
          interactive_assistant: '⚡ **10 Вариантов Заголовков:**\n1. Почему ваши охваты упали в 3 раза? (И как это исправить за 10 минут)\n2. Секретный алгоритм 2026: 3 действия для взрывного охвата'
        },
        {
          id: 'seo_rewriter',
          title: 'SEO & SMM Рерайтер',
          desc: 'Уникализируйте готовые статьи и новости с сохранением смысловой нагрузки и ключевых слов.',
          tag: 'Рерайт',
          btn_text: 'Запустить',
          avatar_emoji: '🔄',
          gradient: 'from-emerald-500 to-teal-600',
          welcome_message: 'Привет! Пришли исходную новость или текст, и я перепишу его с 100% уникальностью в живом стиле!',
          system_prompt: 'Ты — профессиональный рерайтер.',
          interactive_user: 'Нейросети начали заменять программистов в стартапах.',
          interactive_assistant: '🔄 **Уникализированный вариант:** ИИ-инструменты берут на себя рутинную разработку в молодых технологических компаниях, меняя традиционный подход к кодингу...'
        },
        {
          id: 'video_scripts',
          title: 'Сценарии для видео Reels & Shorts',
          desc: 'Создавайте профессиональные сценарии для ваших вертикальных видео с таймингами и подсказками.',
          tag: 'Видеоконтент',
          btn_text: 'Запустить',
          avatar_emoji: '🎬',
          gradient: 'from-purple-500 to-indigo-600',
          welcome_message: 'Привет! Нам нужен ролик! Задавай тему, и я напишу динамичный сценарий по таймингу!',
          system_prompt: 'Ты — сценарист коротких видео (Reels, Shorts, TikTok).',
          interactive_user: 'Сценарий про тайм-менеджмент на 15 секунд',
          interactive_assistant: '🎬 **Хук (0-3 с):** "Твои планы летят к чертям?"\n⏱ **Основное (3-12 с):** Помидорная техника: 25 мин фокуса, 5 отдыха.\n⏱ **CTA (12-15 с):** Подписывайся!'
        },
        {
          id: 'stories_games',
          title: 'Идеи игр для Stories',
          desc: 'Удерживайте внимание ваших подписчиков с помощью интерактивных геймифицированных цепочек в Stories.',
          tag: 'Интерактив',
          btn_text: 'Запустить',
          avatar_emoji: '🎮',
          gradient: 'from-yellow-400 to-orange-500',
          welcome_message: 'Привет! Какая у нас тематика блога? Придумаю крутые интерактивные игры для сторис!',
          system_prompt: 'Ты — специалист по интерактивным Stories.',
          interactive_user: 'Игра для магазина одежды в сторис',
          interactive_assistant: '👗 **Игра "Найди лишнее":** Покажите 3 стильные вещи и 1 нелепую деталь. Читатели голосуют стикером-ползунком!'
        },
        {
          id: 'final_paragraph',
          title: 'Финальный абзац',
          desc: 'Завершите ваш текст сильным финальным абзацем, который не оставит ваших читателей равнодушными.',
          tag: 'Копирайтинг',
          btn_text: 'Запустить',
          avatar_emoji: '🏁',
          gradient: 'from-orange-500 to-red-600',
          welcome_message: 'Привет! Напиши, о чем была статья, и я сформирую мощный финальный аккорд!',
          system_prompt: 'Ты — мастер концовок.',
          interactive_user: 'Статья об утренних подъемах',
          interactive_assistant: '🏁 **Утро — это роскошь, которую большинство из нас просыпает.** Заведите будильник завтра всего на 15 минут раньше!'
        }
      ];

      for (const a of defaultAgents) {
        db.run(
          `INSERT OR IGNORE INTO ai_agents (id, title, desc, tag, btn_text, avatar_emoji, gradient, welcome_message, system_prompt, interactive_user, interactive_assistant, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [a.id, a.title, a.desc, a.tag, a.btn_text, a.avatar_emoji, a.gradient, a.welcome_message, a.system_prompt, a.interactive_user, a.interactive_assistant, new Date().toISOString()]
        );
      }
    }
  } catch (e) {
    console.error('[SQLite] Error seeding ai_agents:', e);
  }

  // Ensure default users exist with 11-digit IDs
  try {
    const usersCheck = db.exec("SELECT COUNT(*) as cnt FROM users");
    const usersCnt = Number(usersCheck[0]?.values[0]?.[0] || 0);
    if (usersCnt === 0) {
      db.run(
        `INSERT INTO users (id, email, password_hash, role, telegram_id, first_name, username, profile_link, balance, referral_reward_balance, tariff, status, created_at, last_login, referred_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          '16926299042',
          'shishkarnem@gmail.com',
          'wkL35eTm',
          'admin',
          169262990,
          'Тимошенко Денис',
          'shishkarnem',
          'https://t.me/shishkarnem',
          1000,
          0.0,
          'Космос',
          'Активный',
          new Date().toISOString(),
          new Date().toISOString(),
          80926979801
        ]
      );
    } else {
      // Ensure admin 16926299042 has referred_by = 80926979801
      db.run(
        `UPDATE users SET email = 'shishkarnem@gmail.com', password_hash = 'wkL35eTm', role = 'admin', tariff = 'Космос', referred_by = 80926979801 WHERE id = '169262990' OR id = '16926299042' OR telegram_id = 169262990`
      );
    }
    // Ensure 16187387221 has referred_by = 16926299042
    db.run(
      `UPDATE users SET referred_by = 16926299042, status = 'Активный' WHERE id = '16187387221' OR id = '1618738722' OR telegram_id = 1618738722`
    );
  } catch (e) {
    console.error('[SQLite] Error seeding users:', e);
  }

  // Seed default bot_settings if empty
  try {
    const botSettingsCheck = db.exec("SELECT COUNT(*) as cnt FROM bot_settings");
    if (botSettingsCheck[0]?.values[0]?.[0] === 0) {
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
    console.error('[SQLite] Error seeding bot_settings:', e);
  }

  // Seed default telegram_bot if empty
  try {
    const tgBotCheck = db.exec("SELECT COUNT(*) as cnt FROM telegram_bot");
    if (tgBotCheck[0]?.values[0]?.[0] === 0) {
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
    }
    // Always ensure database is updated with official @IIrkiBot and token
    db.run(`
      UPDATE telegram_bot SET 
        bot_token = '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o',
        bot_username = '@IIrkiBot',
        bot_name = 'ИИрки Постинг Бот',
        bot_id = '8142466188',
        description = 'Официальный Telegram бот сервиса ИИSMM для автопостинга и генерации контента.',
        avatar_url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop'
      WHERE id = 'bot_1' OR bot_username LIKE '%AItgPostBot%' OR bot_username LIKE '%iismmAIbot%';
    `);
    db.run(`
      UPDATE bot_settings SET 
        token = '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o',
        bot_username = 'IIrkiBot'
      WHERE id = 'main_bot' OR bot_username LIKE '%AItgPostBot%' OR bot_username LIKE '%iismmAIbot%';
    `);
  } catch (e) {
    console.error('[SQLite] Error seeding telegram_bot:', e);
  }

  // Seed default protalk_settings if empty
  try {
    const protalkCheck = db.exec("SELECT COUNT(*) as cnt FROM protalk_settings");
    if (protalkCheck[0]?.values[0]?.[0] === 0) {
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
    console.error('[SQLite] Error seeding protalk_settings:', e);
  }

  // Seed default cron tasks strictly on startup (INSERT OR IGNORE preserves existing items)
  try {
    const defaultCron = [
      {
        id: 'cron_1',
        item_type: 'post',
        item_id: '1',
        title: 'Автопубликация: Бизнес-промпты',
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
    for (const c of defaultCron) {
      db.run(
        `INSERT OR IGNORE INTO cron (id, item_type, item_id, title, cron_expression, schedule_human, next_run, last_run, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.item_type, c.item_id, c.title, c.cron_expression, c.schedule_human, c.next_run, c.last_run, c.status, new Date().toISOString()]
      );
    }
  } catch (e) {
    console.error('[SQLite] Error seeding cron table:', e);
  }

  // Ensure column additions and user ID unification in SQLite
  const userColsToAdd = [
    "referred_by INTEGER",
    "profile_link TEXT",
    "bio TEXT",
    "is_premium INTEGER DEFAULT 0",
    "language_code TEXT",
    "phone TEXT",
    "allows_write_to_pm INTEGER DEFAULT 0",
    "latitude REAL",
    "longitude REAL",
    "utm_source TEXT",
    "utm_medium TEXT",
    "utm_campaign TEXT",
    "referral_reward_balance REAL DEFAULT 0.0",
    "user_avatar TEXT",
    "last_login TEXT"
  ];
  userColsToAdd.forEach(col => {
    try {
      db.run(`ALTER TABLE users ADD COLUMN ${col};`);
    } catch (e) {}
  });
  try {
    db.run("ALTER TABLE posts ADD COLUMN user_id TEXT;");
  } catch (e) {}
  try {
    db.run("ALTER TABLE channels ADD COLUMN user_id TEXT;");
  } catch (e) {}
  try {
    db.run("ALTER TABLE sceneries ADD COLUMN user_id TEXT;");
  } catch (e) {}
  try {
    db.run("ALTER TABLE sceneries ADD COLUMN post_id TEXT;");
  } catch (e) {}

  // Ensure all users have 11-digit DB IDs
  try {
    db.run("UPDATE users SET id = '16926299042' WHERE (telegram_id = 169262990 OR id = '169262990') AND LENGTH(id) != 11;");
    db.run("UPDATE users SET id = printf('%011d', ABS(RANDOM() % 89999999999 + 10000000000)) WHERE LENGTH(id) != 11;");
  } catch (e) {
    console.error('[SQLite] Error updating 11-digit user IDs:', e);
  }

  // Ensure SQLite data is populated and synchronized from database.json if empty
  try {
    const { DB } = require('./db');
    // Sync channels
    const channelsCheck = db.exec("SELECT COUNT(*) as cnt FROM channels");
    const channelsCount = Number(channelsCheck[0]?.values[0]?.[0] || 0);
    if (channelsCount === 0) {
      const jsonChannels = DB.getChannels() || [];
      for (const ch of jsonChannels) {
        db.run(
          `INSERT OR IGNORE INTO channels (id, user_id, name, username, telegram_id, is_active, subscribers_count, invite_link, description, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [ch.id || `ch_${Date.now()}`, ch.userId || '16926299042', ch.name || ch.username, ch.username || ch.name, ch.telegramId ? String(ch.telegramId) : null, ch.isActive !== false ? 1 : 0, ch.subscribersCount || 0, ch.inviteLink || '', ch.description || '', new Date().toISOString()]
        );
      }
    }

    // Sync posts
    const postsCheck = db.exec("SELECT COUNT(*) as cnt FROM posts");
    const postsCount = Number(postsCheck[0]?.values[0]?.[0] || 0);
    if (postsCount === 0) {
      const jsonPosts = DB.getDayRequests() || [];
      for (const p of jsonPosts) {
        db.run(
          `INSERT OR IGNORE INTO posts (id, user_id, title, category, request_template, post_text, channel, channels, message_format, signature, attachment_type, attachment_url, attachment_urls, status, trigger_schedule, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.userId || '16926299042',
            p.title || 'Пост',
            p.category || 'общее',
            p.requestTemplate || '',
            p.postText || '',
            p.channel || '@SAV_AI',
            p.channels ? JSON.stringify(p.channels) : JSON.stringify([p.channel || '@SAV_AI']),
            p.messageFormat || 'v2',
            p.signature || '',
            p.attachmentType || 'none',
            p.attachmentUrl || '',
            p.attachmentUrls ? JSON.stringify(p.attachmentUrls) : '[]',
            p.status || 'создается',
            p.triggerSchedule ? JSON.stringify(p.triggerSchedule) : JSON.stringify({ enabled: false }),
            p.createdAt || new Date().toISOString()
          ]
        );
      }
    }
  } catch (e) {
    console.error('[SQLite Sync] Error syncing data on startup:', e);
  }

  // Ensure essential files are seeded
  try {
    const { seedEssentialFiles } = require('./db/filesTable');
    seedEssentialFiles(db);
  } catch (e) {}

  // Ensure teams table is initialized and seeded
  try {
    const { initTeamsTable, seedDefaultTeams } = require('./db/teamsTable');
    initTeamsTable(db);
    seedDefaultTeams(db);
  } catch (e) {}

  // Ensure team_reports table & user team privacy columns
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS team_reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT,
        reporter_name TEXT,
        team_id TEXT,
        team_name TEXT,
        owner_id TEXT,
        reason TEXT,
        details TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT
      );
    `);
    try { db.run(`ALTER TABLE users ADD COLUMN allow_team_invites INTEGER DEFAULT 1;`); } catch (e) {}
    try { db.run(`ALTER TABLE users ADD COLUMN team_blacklist TEXT DEFAULT '[]';`); } catch (e) {}
  } catch (e) {}

  saveDatabaseToDisk();
}

export const ALLOWED_TABLES = [
  'users',
  'tarifs',
  'tariffs',
  'transactions',
  'notifications',
  'posts',
  'teams',
  'team_reports',
  'sceneries',
  'protalk_settings',
  'prompts',
  'channels',
  'history',
  'logs',
  'telegram_bot',
  'cron',
  'file_storage',
  'file_folders',
  'file_folder_relations',
  'ai_agents',
  'chat_messages',
  'blog_posts'
];

export async function getAllTablesInfo() {
  const db = await getSQLiteDB();
  const tablesInfo = [];

  // Fetch all existing tables from sqlite_master
  let masterTables: string[] = [];
  try {
    const masterRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    if (masterRes && masterRes[0]?.values) {
      masterTables = masterRes[0].values.map((row: any) => String(row[0]));
    }
  } catch (e) {}

  const allTables = Array.from(new Set([...ALLOWED_TABLES, ...masterTables]));

  for (const table of allTables) {
    try {
      const countRes = db.exec(`SELECT COUNT(*) FROM ${table}`);
      const count = countRes[0]?.values[0]?.[0] || 0;

      const colsRes = db.exec(`PRAGMA table_info(${table})`);
      const columns = colsRes[0]?.values.map((v: any) => ({ name: v[1], type: v[2] })) || [];

      tablesInfo.push({ tableName: table, rowCount: count, columns });
    } catch (e) {
      tablesInfo.push({ tableName: table, rowCount: 0, columns: [] });
    }
  }

  return tablesInfo;
}

export async function getTableRows(tableName: string) {
  const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  if (!safeTableName) {
    throw new Error(`Некорректное имя таблицы: ${tableName}`);
  }

  const db = await getSQLiteDB();

  // Verify table exists in sqlite_master
  const masterRes = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${safeTableName}'`);
  if (!masterRes || !masterRes[0]?.values?.length) {
    // If not found in sqlite_master, check if it's allowed and initialize or return empty
    return { columns: [], rows: [] };
  }

  const res = db.exec(`SELECT * FROM ${safeTableName} ORDER BY rowid DESC LIMIT 500`);
  if (!res[0]) {
    const colsRes = db.exec(`PRAGMA table_info(${safeTableName})`);
    const columns = colsRes[0]?.values.map((v: any) => String(v[1])) || [];
    return { columns, rows: [] };
  }

  const columns = res[0].columns;
  const rows = res[0].values.map((valArr: any[]) => {
    const rowObj: Record<string, any> = {};
    columns.forEach((col: string, idx: number) => {
      rowObj[col] = valArr[idx];
    });
    return rowObj;
  });

  return { columns, rows };
}

export async function insertRow(tableName: string, rowData: Record<string, any>) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error(`Таблица ${tableName} не разрешена.`);
  }

  const db = await getSQLiteDB();
  const id = rowData.id || `${tableName.slice(0, 3)}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const fullData = { ...rowData, id, created_at: rowData.created_at || new Date().toISOString() };

  const keys = Object.keys(fullData);
  const placeholders = keys.map(() => '?').join(', ');
  const values = keys.map(k => {
    const val = fullData[k];
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return val;
  });

  const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
  db.run(sql, values);
  saveSQLiteDB();

  return fullData;
}

export async function updateRow(tableName: string, id: string, rowData: Record<string, any>) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error(`Таблица ${tableName} не разрешена.`);
  }

  const db = await getSQLiteDB();
  const keys = Object.keys(rowData).filter(k => k !== 'id');
  if (keys.length === 0) return;

  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => {
    const val = rowData[k];
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return val;
  });

  const cleanId = String(id || '').trim();
  const strippedId = cleanId.replace(/^(pub_|req_|ch_|user_|scen_)/, '');
  const prefixedId = cleanId.startsWith('req_') ? cleanId : ('req_' + cleanId);

  values.push(cleanId, strippedId, prefixedId);

  const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ? OR id = ? OR id = ?`;
  db.run(sql, values);

  const changesRes = db.exec("SELECT changes()");
  const rowsAffected = changesRes?.[0]?.values?.[0]?.[0] || 0;

  if (rowsAffected === 0) {
    // If row did not exist in SQLite, insert or replace it
    const fullData = { ...rowData, id: cleanId, created_at: rowData.created_at || new Date().toISOString() };
    const insertKeys = Object.keys(fullData);
    const placeholders = insertKeys.map(() => '?').join(', ');
    const insertValues = insertKeys.map(k => {
      const val = fullData[k];
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return val;
    });
    db.run(`INSERT OR REPLACE INTO ${tableName} (${insertKeys.join(', ')}) VALUES (${placeholders})`, insertValues);
  }

  saveSQLiteDB();

  return { id: cleanId, ...rowData };
}

export async function deleteRow(tableName: string, id: string) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error(`Таблица ${tableName} не разрешена.`);
  }

  const db = await getSQLiteDB();
  const cleanId = String(id || '').trim();
  const strippedId = cleanId.replace(/^(pub_|req_|ch_|user_|scen_)/, '');
  const prefixedId = cleanId.startsWith('req_') ? cleanId : ('req_' + cleanId);

  db.run(`DELETE FROM ${tableName} WHERE id = ? OR id = ? OR id = ?`, [cleanId, strippedId, prefixedId]);
  saveSQLiteDB();

  return true;
}

export async function importCSVRows(tableName: string, rows: Record<string, any>[]) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error(`Таблица ${tableName} не разрешена.`);
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: true, importedCount: 0 };
  }

  const db = await getSQLiteDB();
  let importedCount = 0;

  for (const rowData of rows) {
    if (!rowData || typeof rowData !== 'object') continue;
    const id = rowData.id ? String(rowData.id).trim() : `${tableName.slice(0, 3)}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const fullData: Record<string, any> = { ...rowData, id };
    if (!fullData.created_at) {
      fullData.created_at = new Date().toISOString();
    }

    const keys = Object.keys(fullData);
    if (keys.length === 0) continue;

    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => {
      const val = fullData[k];
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return val;
    });

    try {
      const sql = `INSERT OR REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
      db.run(sql, values);
      importedCount++;
    } catch (rowErr) {
      console.warn(`[importCSVRows] Error inserting row into ${tableName}:`, rowErr);
    }
  }

  saveSQLiteDB();
  return { success: true, importedCount };
}

export async function executeRawSQL(sqlStatement: string) {
  const db = await getSQLiteDB();
  const trimmed = sqlStatement.trim();

  if (trimmed.toLowerCase().startsWith('select') || trimmed.toLowerCase().startsWith('pragma')) {
    const res = db.exec(trimmed);
    if (!res[0]) return { columns: [], rows: [] };
    const columns = res[0].columns;
    const rows = res[0].values.map((valArr: any[]) => {
      const rowObj: Record<string, any> = {};
      columns.forEach((col: string, idx: number) => {
        rowObj[col] = valArr[idx];
      });
      return rowObj;
    });
    return { columns, rows, type: 'select' };
  } else {
    db.run(trimmed);
    saveSQLiteDB();
    return { success: true, message: 'Запрос успешно выполнен', type: 'mutation' };
  }
}

export function getSyncSQLiteDB(): Database | null {
  return dbInstance;
}

export function fetchAllPostsFromSQLite(): any[] {
  if (!dbInstance) return [];
  try {
    const res = dbInstance.exec("SELECT * FROM posts ORDER BY rowid ASC");
    if (!res[0]) return [];
    const columns = res[0].columns;
    return res[0].values.map((valArr: any[]) => {
      const rowObj: Record<string, any> = {};
      columns.forEach((col: string, idx: number) => {
        rowObj[col] = valArr[idx];
      });
      return rowObj;
    });
  } catch (e) {
    console.error('[SQLite] Error fetching posts:', e);
    return [];
  }
}

export function fetchAllChannelsFromSQLite(): any[] {
  if (!dbInstance) return [];
  try {
    const res = dbInstance.exec("SELECT * FROM channels ORDER BY rowid ASC");
    if (!res[0]) return [];
    const columns = res[0].columns;
    return res[0].values.map((valArr: any[]) => {
      const rowObj: Record<string, any> = {};
      columns.forEach((col: string, idx: number) => {
        rowObj[col] = valArr[idx];
      });
      return rowObj;
    });
  } catch (e) {
    console.error('[SQLite] Error fetching channels:', e);
    return [];
  }
}

export function fetchAllUsersFromSQLite(): any[] {
  if (!dbInstance) return [];
  try {
    const res = dbInstance.exec("SELECT * FROM users ORDER BY rowid ASC");
    if (!res[0]) return [];
    const columns = res[0].columns;
    return res[0].values.map((valArr: any[]) => {
      const rowObj: Record<string, any> = {};
      columns.forEach((col: string, idx: number) => {
        rowObj[col] = valArr[idx];
      });
      return rowObj;
    });
  } catch (e) {
    console.error('[SQLite] Error fetching users:', e);
    return [];
  }
}

export function fetchAllFilesFromSQLite(): any[] {
  if (!dbInstance) return [];
  try {
    const res = dbInstance.exec("SELECT * FROM file_storage ORDER BY id DESC");
    if (!res[0]) return [];
    const columns = res[0].columns;
    return res[0].values.map((valArr: any[]) => {
      const rowObj: Record<string, any> = {};
      columns.forEach((col: string, idx: number) => {
        rowObj[col] = valArr[idx];
      });
      return rowObj;
    });
  } catch (e) {
    try {
      const res = dbInstance.exec("SELECT * FROM files ORDER BY rowid DESC");
      if (!res[0]) return [];
      const columns = res[0].columns;
      return res[0].values.map((valArr: any[]) => {
        const rowObj: Record<string, any> = {};
        columns.forEach((col: string, idx: number) => {
          rowObj[col] = valArr[idx];
        });
        return rowObj;
      });
    } catch (err) {
      console.error('[SQLite] Error fetching files:', err);
      return [];
    }
  }
}

// ==========================================
// BLOG POSTS SQLITE ENGINE & RANKING LOGIC
// ==========================================

function seedBlogPostsIfEmpty(db: Database) {
  // No default seeding - keep clean database
}

export function fetchAllBlogPostsFromSQLite(): any[] {
  if (!dbInstance) return [];
  try {
    const res = dbInstance.exec("SELECT * FROM blog_posts ORDER BY created_at DESC");
    if (!res[0]) return [];
    const columns = res[0].columns;
    const rawRows = res[0].values.map((valArr: any[]) => {
      const rowObj: Record<string, any> = {};
      columns.forEach((col: string, idx: number) => {
        rowObj[col] = valArr[idx];
      });
      return rowObj;
    });

    // Check if there is an explicit Post of the Day
    let hasExplicitDayPost = rawRows.some(r => r.is_post_of_day === 1);
    
    // Determine the post of the day id: if none flagged, pick top popular/latest post
    let dayPostId = '';
    if (hasExplicitDayPost) {
      dayPostId = rawRows.find(r => r.is_post_of_day === 1)?.id || rawRows[0]?.id;
    } else if (rawRows.length > 0) {
      // Pick highest popularity = (views + likes*5)
      const sortedByPopularity = [...rawRows].sort((a, b) => {
        const popA = (a.views_count || 0) + (a.likes_count || 0) * 5;
        const popB = (b.views_count || 0) + (b.likes_count || 0) * 5;
        return popB - popA;
      });
      dayPostId = sortedByPopularity[0]?.id || rawRows[0]?.id;
    }

    // Format rows for frontend compatibility
    return rawRows.map((r: any) => {
      const isDay = r.id === dayPostId;
      let album = [];
      if (r.album_json) {
        try { album = JSON.parse(r.album_json); } catch (e) {}
      }

      return {
        id: String(r.id),
        category: isDay ? 'day' : (r.category || 'article'),
        isPostOfDay: isDay,
        title: r.title,
        desc: r.desc || '',
        content: r.content || '',
        format: r.format || 'photo',
        tag: isDay ? 'Пост дня' : (r.tag || (r.category === 'news' ? 'Новости ИИSMM' : r.category === 'blogger' ? 'Пост Блогера' : 'Статья')),
        readTime: r.read_time || '5 мин',
        date: r.date_str || new Date(r.created_at || Date.now()).toLocaleDateString('ru-RU'),
        author: {
          name: r.author_name || 'Администратор ИИSMM',
          avatar: r.author_avatar || '/file/9/iismmlogo.png',
          role: r.author_role || 'Автор'
        },
        views: r.views_count || 0,
        likes: r.likes_count || 0,
        image: r.image_url || undefined,
        videoUrl: r.video_url || undefined,
        album: album.length > 0 ? album : undefined
      };
    });
  } catch (e) {
    console.error('[SQLite] Error fetching blog posts:', e);
    return [];
  }
}

export function fetchBlogPostByIdFromSQLite(id: string): any | null {
  const posts = fetchAllBlogPostsFromSQLite();
  return posts.find(p => String(p.id) === String(id)) || null;
}

export function createBlogPostInSQLite(post: any): any {
  if (!dbInstance) return null;
  const newId = String(Date.now());
  const category = post.category || 'article';
  const isPostOfDay = post.isPostOfDay ? 1 : 0;
  const albumJson = post.album ? JSON.stringify(post.album) : null;

  // If newly created post is set as Post of the Day, unset existing ones
  if (isPostOfDay) {
    try {
      dbInstance.run("UPDATE blog_posts SET is_post_of_day = 0");
    } catch (e) {}
  }

  dbInstance.run(`
    INSERT INTO blog_posts (
      id, category, is_post_of_day, title, desc, content, format, tag, read_time, date_str,
      author_name, author_avatar, author_role, views_count, likes_count, image_url, video_url, album_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    newId,
    category,
    isPostOfDay,
    post.title || 'Новая публикация',
    post.desc || '',
    post.content || '',
    post.format || 'photo',
    post.tag || 'Публикация',
    post.readTime || '3 мин',
    post.date || new Date().toLocaleDateString('ru-RU'),
    post.author?.name || 'Администратор',
    post.author?.avatar || '/file/9/iismmlogo.png',
    post.author?.role || 'Команда ИИSMM',
    post.views || 10,
    post.likes || 1,
    post.image || null,
    post.videoUrl || null,
    albumJson,
    new Date().toISOString()
  ]);

  saveSQLiteDB();
  return fetchAllBlogPostsFromSQLite().find(p => p.id === newId);
}

export function getBotDetailsFromSQLite(): any {
  const defaultBot = {
    id: 'bot_1',
    bot_token: '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o',
    bot_name: 'ИИрки Постинг Бот',
    bot_username: '@IIrkiBot',
    bot_id: '8142466188',
    description: 'Официальный Telegram бот сервиса ИИSMM для автопостинга и генерации контента.',
    avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop',
    default_chat_id: '@SAV_AI',
    api_url: 'https://eu1.api.pro-talk.ru/api/v1.0',
    is_active: 1
  };
  if (!dbInstance) return defaultBot;
  try {
    const res = dbInstance.exec("SELECT id, bot_token, bot_name, bot_username, bot_id, description, avatar_url, default_chat_id, api_url, is_active FROM telegram_bot LIMIT 1");
    if (res.length > 0 && res[0].values.length > 0) {
      const row = res[0].values[0];
      return {
        id: String(row[0] || 'bot_1'),
        bot_token: String(row[1] || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o'),
        bot_name: String(row[2] || 'ИИрки Постинг Бот'),
        bot_username: String(row[3] || '@IIrkiBot'),
        bot_id: String(row[4] || '8142466188'),
        description: String(row[5] || 'Официальный Telegram бот сервиса ИИSMM для автопостинга и генерации контента.'),
        avatar_url: String(row[6] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop'),
        default_chat_id: String(row[7] || '@SAV_AI'),
        api_url: String(row[8] || 'https://eu1.api.pro-talk.ru/api/v1.0'),
        is_active: row[9] === 1 ? 1 : 0
      };
    }
  } catch (e) {}
  return defaultBot;
}

export function getBotTokenFromSQLite(): string {
  const details = getBotDetailsFromSQLite();
  return details.bot_token;
}

export function updateBlogPostInSQLite(id: string, post: any): any {
  if (!dbInstance) return null;

  if (post.isPostOfDay) {
    try {
      dbInstance.run("UPDATE blog_posts SET is_post_of_day = 0");
    } catch (e) {}
  }

  const albumJson = post.album ? JSON.stringify(post.album) : null;

  dbInstance.run(`
    UPDATE blog_posts SET
      category = COALESCE(?, category),
      is_post_of_day = COALESCE(?, is_post_of_day),
      title = COALESCE(?, title),
      desc = COALESCE(?, desc),
      content = COALESCE(?, content),
      format = COALESCE(?, format),
      tag = COALESCE(?, tag),
      read_time = COALESCE(?, read_time),
      image_url = COALESCE(?, image_url),
      video_url = COALESCE(?, video_url),
      album_json = COALESCE(?, album_json)
    WHERE id = ?
  `, [
    post.category,
    post.isPostOfDay !== undefined ? (post.isPostOfDay ? 1 : 0) : null,
    post.title,
    post.desc,
    post.content,
    post.format,
    post.tag,
    post.readTime,
    post.image,
    post.videoUrl,
    albumJson,
    id
  ]);

  saveSQLiteDB();
  return fetchAllBlogPostsFromSQLite().find(p => p.id === id);
}

export function deleteBlogPostFromSQLite(id: string): boolean {
  if (!dbInstance) return false;
  try {
    dbInstance.run("DELETE FROM blog_posts WHERE id = ?", [id]);
    saveSQLiteDB();
    return true;
  } catch (e) {
    console.error('[SQLite] Error deleting blog post:', e);
    return false;
  }
}

export function incrementBlogPostViewsInSQLite(id: string): number {
  if (!dbInstance) return 0;
  try {
    dbInstance.run("UPDATE blog_posts SET views_count = views_count + 1 WHERE id = ?", [id]);
    saveSQLiteDB();
    const res = dbInstance.exec(`SELECT views_count FROM blog_posts WHERE id = '${id}'`);
    return Number(res[0]?.values[0]?.[0] || 0);
  } catch (e) {
    console.error('[SQLite] Error incrementing views:', e);
    return 0;
  }
}

export function incrementBlogPostLikesInSQLite(id: string): number {
  if (!dbInstance) return 0;
  try {
    dbInstance.run("UPDATE blog_posts SET likes_count = likes_count + 1 WHERE id = ?", [id]);
    saveSQLiteDB();
    const res = dbInstance.exec(`SELECT likes_count FROM blog_posts WHERE id = '${id}'`);
    return Number(res[0]?.values[0]?.[0] || 0);
  } catch (e) {
    console.error('[SQLite] Error incrementing likes:', e);
    return 0;
  }
}

export function syncPostCronTask(postId: string, postData: any, userId?: string) {
  if (!dbInstance) return;

  const cronId = `cron_post_${postId}`;
  const schedule = postData.triggerSchedule || postData.trigger_schedule;
  const parsedSchedule = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;

  if (!parsedSchedule || parsedSchedule.enabled === false) {
    try {
      dbInstance.run("UPDATE cron SET status = 'paused' WHERE id = ?", [cronId]);
      saveSQLiteDB();
    } catch (e) {}
    return;
  }

  // Get user timezone
  let userTimezone = 'Europe/Moscow';
  if (userId) {
    try {
      const uRes = dbInstance.exec(`SELECT timezone FROM users WHERE id = '${userId}' OR telegram_id = '${userId}'`);
      if (uRes.length > 0 && uRes[0].values.length > 0) {
        userTimezone = (uRes[0].values[0][0] as string) || 'Europe/Moscow';
      }
    } catch (e) {}
  }

  const frequency = parsedSchedule.frequency || 'daily';
  let cronExpr = '0 9 * * *';
  let scheduleHuman = '';
  const now = new Date();
  let nextRun = now.toISOString();

  if (frequency === 'exact_date') {
    const rawDT = parsedSchedule.exactDateTime || '2026-12-31T18:00';
    cronExpr = `exact:${rawDT}`;
    scheduleHuman = `Отложенная публикация ${rawDT.replace('T', ' ')} (${userTimezone})`;
    try {
      nextRun = new Date(rawDT).toISOString();
    } catch (e) {
      nextRun = rawDT;
    }
  } else if (frequency === 'daily') {
    const timeStr = parsedSchedule.time || '09:00';
    const [hh, mm] = timeStr.split(':');
    cronExpr = `${parseInt(mm || '0', 10)} ${parseInt(hh || '9', 10)} * * *`;
    scheduleHuman = `Ежедневно в ${timeStr} (${userTimezone})`;
    const d = new Date();
    d.setHours(parseInt(hh || '9', 10), parseInt(mm || '0', 10), 0, 0);
    if (d <= now) {
      d.setDate(d.getDate() + 1);
    }
    nextRun = d.toISOString();
  } else if (frequency === 'interval_minutes') {
    const mins = Math.max(1, Number(parsedSchedule.intervalMinutes || 15));
    cronExpr = `*/${mins} * * * *`;
    scheduleHuman = `Каждые ${mins} мин. (${userTimezone})`;
    nextRun = new Date(now.getTime() + mins * 60 * 1000).toISOString();
  } else if (frequency === 'interval_hours') {
    const hrs = Math.max(1, Number(parsedSchedule.intervalHours || 2));
    cronExpr = `0 */${hrs} * * *`;
    scheduleHuman = `Каждые ${hrs} час. (${userTimezone})`;
    nextRun = new Date(now.getTime() + hrs * 3600 * 1000).toISOString();
  } else if (frequency === 'dayOfWeek') {
    const timeStr = parsedSchedule.time || '09:00';
    const [hh, mm] = timeStr.split(':');
    cronExpr = `${parseInt(mm || '0', 10)} ${parseInt(hh || '9', 10)} * * 1`;
    scheduleHuman = `Еженедельно в ${timeStr} (${userTimezone})`;
    const d = new Date();
    d.setHours(parseInt(hh || '9', 10), parseInt(mm || '0', 10), 0, 0);
    if (d <= now) {
      d.setDate(d.getDate() + 7);
    }
    nextRun = d.toISOString();
  }

  const title = `Автопостинг: ${postData.title || 'Пост ' + postId}`;

  try {
    const existing = dbInstance.exec(`SELECT id FROM cron WHERE id = '${cronId}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      dbInstance.run(
        `UPDATE cron SET title = ?, cron_expression = ?, schedule_human = ?, next_run = ?, status = 'active' WHERE id = ?`,
        [title, cronExpr, scheduleHuman, nextRun, cronId]
      );
    } else {
      dbInstance.run(
        `INSERT INTO cron (id, item_type, item_id, title, cron_expression, schedule_human, next_run, status, created_at)
         VALUES (?, 'post', ?, ?, ?, ?, ?, 'active', datetime('now'))`,
        [cronId, postId, title, cronExpr, scheduleHuman, nextRun]
      );
    }
    saveSQLiteDB();
  } catch (e) {
    console.error('[SQLite] Error syncing post cron task:', e);
  }
}
