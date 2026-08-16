import { Database } from 'sql.js';

export interface TariffRecord {
  id: string;
  name: string;
  price_iirky: string;
  price_rub: number;
  sub: string;
  continuation?: string;
  monthly_iirky: number;
  features: string; // JSON string of [{ title: string, desc: string }]
  is_active: number;
  sort_order: number;
  duration_days?: number;
  duration_text?: string;
  target_user_id?: string;
  is_custom?: number;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_TARIFFS: TariffRecord[] = [
  {
    id: 'start',
    name: 'Старт',
    price_iirky: '0 ИИрок',
    price_rub: 0,
    sub: 'Старт без вложений',
    continuation: '',
    monthly_iirky: 300,
    features: JSON.stringify([
      {
        title: 'Безлимитно постов и каналов без ИИ',
        desc: 'Полный безлимит по количеству каналов и постов при ручной публикации или автопланировании отложенных постов в календарь.'
      },
      {
        title: '300 ИИрок каждый месяц бесплатно',
        desc: 'Хватит на 190 рерайтов через ИИ или 30 постов с ИИ бесплатно (на каждый день для канала)!'
      },
      {
        title: 'Умные ИИ-сценарии автопостинга 24/7',
        desc: 'Автономные цепочки: регулярный выбор темы ➔ генерация текста с форматированием Markdown V2 ➔ подбор обложки ➔ постановка в календарь.'
      },
      {
        title: 'Участие в папках и подборах',
        desc: 'Автоматическое участие ваших Telegram-каналов в тематических папках и подборках взаимного пиара для роста подписчиков.'
      },
      {
        title: 'Докупка ИИрок в любой момент',
        desc: 'Если вам требуются дополнительные нейро-тексты или генерации обложек, докупайте ИИрки в любом удобном объеме без смены тарифа.'
      },
      {
        title: 'Конструктор Markdown V2 & Rich',
        desc: 'Визуальный редактор Telegram-постов со спойлерами, форматированием текста, ссылками и красивыми цветными кнопками.'
      },
      {
        title: 'Облачная медиагалерея & хостинг',
        desc: 'Загрузка и бесплатное хранение фото, анимаций и видеофайлов с сохранением оригинального качества.'
      },
      {
        title: 'Интерактивный календарь постов',
        desc: 'Удобный планировщик публикаций с наглядной сеткой выходов на месяц и автоотправкой постов точно в срок.'
      }
    ]),
    is_active: 1,
    sort_order: 1,
    duration_days: 30,
    duration_text: '30 дней',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'razgon',
    name: 'Разгон',
    price_iirky: '990 ИИрок / мес',
    price_rub: 990,
    sub: 'Хватит на несколько каналов или несколько ежедневных постов',
    continuation: 'Все возможности тарифа Старт, плюс:',
    monthly_iirky: 990,
    features: JSON.stringify([
      {
        title: '990 ИИрок на баланс каждый месяц',
        desc: 'Пакет 990 ИИрок в месяц (1 рубль = 1 ИИрка) — хватит на несколько каналов или несколько ежедневных ИИ-постов и нейро-обложек.'
      },
      {
        title: 'Нейро-копирайтер & рерайт с ИИ стилем',
        desc: 'Мгновенный рерайт постов конкурентов и генерация уникального контента в фирменном стиле вашего бренда.'
      },
      {
        title: 'Память прошлых постов и серийность',
        desc: 'Нейросеть помнит прошлые публикации, исключает дубли и предлагает логическое продолжение рубрик.'
      },
      {
        title: '20+ ИИ-ассистентов',
        desc: 'Персональные агенты (AIDA Копирайтер, Редактор офферов, SMM Стратег) для написания постов под любые ниши.'
      },
      {
        title: 'Значок радужного сердца в профиле',
        desc: 'Выделенная иконка радужного сердечка над аватаром профиля для всех пользователей тарифов выше Старта.'
      }
    ]),
    is_active: 1,
    sort_order: 2,
    duration_days: 30,
    duration_text: '30 дней',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'otryv',
    name: 'Отрыв',
    price_iirky: '4,900 ИИрок / мес',
    price_rub: 4900,
    sub: 'Хватит на десяток каналов',
    continuation: 'Все возможности тарифа Разгон, плюс:',
    monthly_iirky: 4900,
    features: JSON.stringify([
      {
        title: '4,900 ИИрок на баланс каждый месяц',
        desc: 'Мощный баланс 4,900 ИИрок в месяц (1 рубль = 1 ИИрка) — хватит на ведение десятка каналов с автопилотом, сценариями и иллюстрациями.'
      },
      {
        title: 'Полный автопилот контент-планирования',
        desc: 'Автоматическое составление контент-плана на месяцы вперед с автогенерацией текстов, кнопок и медиафайлов.'
      },
      {
        title: 'Голосовое управление кабинетом',
        desc: 'Возможность надиктовать мысли голосом — ИИ превратит их в готовый структурированный пост с идеальным форматированием.'
      },
      {
        title: 'Мультиплеер (командный доступ)',
        desc: 'Совместная работа нескольких SMM-специалистов и контент-мейкеров в одном рабочем кабинете.'
      },
      {
        title: 'Подключение собственных API ключей для ИИ',
        desc: 'Возможность использовать свои API ключи OpenAI / Gemini без расхода баланса ИИрок.'
      },
      {
        title: 'ProTalk API: ИИ-автоответчик постов',
        desc: 'Автоматические умные ответы и автокомментирование публикаций в каналах через интеграцию с ProTalk API.'
      },
      {
        title: 'Продвижение постов в соцсети ИИрки',
        desc: 'Приоритетное размещение и вывод публикаций в топ Ленты социальной сети платформы.'
      }
    ]),
    is_active: 1,
    sort_order: 3,
    duration_days: 30,
    duration_text: '30 дней',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cosmos',
    name: 'Космос',
    price_iirky: 'Индивидуально',
    price_rub: 0,
    sub: 'Индивидуальная разработка под ключ и персональные лимиты',
    continuation: 'Все возможности тарифа Отрыв, плюс:',
    monthly_iirky: 0,
    features: JSON.stringify([
      {
        title: 'Любой объем ИИрок под задачи',
        desc: 'Персональный баланс ИИрок под масштабы вашего бизнеса с приоритетным выделенным GPU сервером.'
      },
      {
        title: 'Разработка брендбука и SMM-стратегии',
        desc: 'Глубокая проработка позиционирования бренда, ИИ стиля и дизайна контента экспертами платформы.'
      },
      {
        title: 'Индивидуальный контент-план под ключ',
        desc: 'Составление стратегии продвижения и материалов персональной командой редакторов.'
      },
      {
        title: 'Кастомная ИИ-разработка',
        desc: 'Индивидуальное создание ИИ-агентов, парсеров, специализированных Telegram-ботов и ведение внешних систем.'
      },
      {
        title: 'Интеграции с любыми соцсетями',
        desc: 'Специфические связки и автокросспостинг в любые внешние платформы и корпоративные CRM.'
      }
    ]),
    is_active: 1,
    sort_order: 4,
    duration_days: 30,
    duration_text: 'Индивидуально',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function initTariffsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS tarifs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price_iirky TEXT,
      price_rub INTEGER DEFAULT 0,
      sub TEXT,
      continuation TEXT,
      monthly_iirky INTEGER DEFAULT 0,
      features TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      duration_days INTEGER DEFAULT 30,
      duration_text TEXT DEFAULT '30 дней',
      target_user_id TEXT,
      is_custom INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  // Migrations for new columns
  try { db.run("ALTER TABLE tarifs ADD COLUMN duration_days INTEGER DEFAULT 30;"); } catch (e) {}
  try { db.run("ALTER TABLE tarifs ADD COLUMN duration_text TEXT DEFAULT '30 дней';"); } catch (e) {}
  try { db.run("ALTER TABLE tarifs ADD COLUMN target_user_id TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE tarifs ADD COLUMN is_custom INTEGER DEFAULT 0;"); } catch (e) {}

  db.run(`CREATE INDEX IF NOT EXISTS idx_tarifs_sort ON tarifs(sort_order);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tarifs_target_user ON tarifs(target_user_id);`);

  // Update cosmos tariff if exists to be individual
  try {
    db.run("UPDATE tarifs SET price_iirky = 'Индивидуально', sub = 'Индивидуальная разработка под ключ и персональные лимиты' WHERE id = 'cosmos' AND price_iirky != 'Индивидуально';");
  } catch (e) {}

  // Seed default tariffs if table is empty
  try {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM tarifs");
    let count = 0;
    if (stmt.step()) {
      count = Number(stmt.getAsObject().count || 0);
    }
    stmt.free();

    if (count === 0) {
      for (const t of DEFAULT_TARIFFS) {
        db.run(
          `INSERT INTO tarifs (id, name, price_iirky, price_rub, sub, continuation, monthly_iirky, features, is_active, sort_order, duration_days, duration_text, is_custom, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.name, t.price_iirky, t.price_rub, t.sub, t.continuation || '', t.monthly_iirky, t.features, t.is_active, t.sort_order, t.duration_days || 30, t.duration_text || '30 дней', 0, t.created_at, t.updated_at]
        );
      }
      console.log(`[TariffsTable] Seeded ${DEFAULT_TARIFFS.length} default tariffs.`);
    }
  } catch (e) {
    console.error('[TariffsTable] Error initializing tarifs table:', e);
  }
}

export function getAllTariffsFromDb(db: Database, targetUserId?: string): TariffRecord[] {
  try {
    let sql = "SELECT * FROM tarifs WHERE is_active = 1 AND (target_user_id IS NULL OR target_user_id = ''";
    if (targetUserId) {
      sql += " OR target_user_id = ?";
    }
    sql += ") ORDER BY sort_order ASC, created_at ASC";
    
    const stmt = db.prepare(sql);
    if (targetUserId) {
      stmt.bind([targetUserId]);
    }
    const list: TariffRecord[] = [];
    while (stmt.step()) {
      list.push(stmt.getAsObject() as any);
    }
    stmt.free();
    return list;
  } catch (e) {
    console.error('[TariffsTable] Error getting tariffs:', e);
    return [];
  }
}

export function getAllTariffsAdminFromDb(db: Database): TariffRecord[] {
  try {
    const stmt = db.prepare("SELECT * FROM tarifs ORDER BY sort_order ASC, created_at DESC");
    const list: TariffRecord[] = [];
    while (stmt.step()) {
      list.push(stmt.getAsObject() as any);
    }
    stmt.free();
    return list;
  } catch (e) {
    console.error('[TariffsTable] Error getting admin tariffs:', e);
    return [];
  }
}

export function getTariffById(db: Database, id: string): TariffRecord | null {
  try {
    const stmt = db.prepare("SELECT * FROM tarifs WHERE id = ? OR LOWER(name) = LOWER(?) LIMIT 1");
    stmt.bind([id, id]);
    if (stmt.step()) {
      const res = stmt.getAsObject() as any;
      stmt.free();
      return res;
    }
    stmt.free();
    return null;
  } catch (e) {
    return null;
  }
}

export function createOrUpdateTariffInDb(
  db: Database,
  tariff: Partial<TariffRecord> & { name: string }
): TariffRecord {
  const now = new Date().toISOString();
  const id = tariff.id || `custom_tariff_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const name = tariff.name.trim();
  const price_rub = Number(tariff.price_rub) || 0;
  const price_iirky = tariff.price_iirky || (price_rub > 0 ? `${price_rub.toLocaleString('ru-RU')} ИИрок / мес` : 'Индивидуально');
  const sub = tariff.sub || 'Индивидуальный тариф';
  const continuation = tariff.continuation || '';
  const monthly_iirky = Number(tariff.monthly_iirky) || 0;
  const features = typeof tariff.features === 'string' ? tariff.features : JSON.stringify(tariff.features || []);
  const is_active = tariff.is_active !== undefined ? Number(tariff.is_active) : 1;
  const sort_order = Number(tariff.sort_order) || 10;
  const duration_days = Number(tariff.duration_days) || 30;
  const duration_text = tariff.duration_text || `${duration_days} дней`;
  const target_user_id = tariff.target_user_id || null;
  const is_custom = 1;

  db.run(
    `INSERT OR REPLACE INTO tarifs (
      id, name, price_iirky, price_rub, sub, continuation, monthly_iirky, features, is_active, sort_order, duration_days, duration_text, target_user_id, is_custom, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM tarifs WHERE id = ?), ?), ?)`,
    [
      id, name, price_iirky, price_rub, sub, continuation, monthly_iirky, features, is_active, sort_order, duration_days, duration_text, target_user_id, is_custom, id, now, now
    ]
  );

  return {
    id,
    name,
    price_iirky,
    price_rub,
    sub,
    continuation,
    monthly_iirky,
    features,
    is_active,
    sort_order,
    duration_days,
    duration_text,
    target_user_id: target_user_id || undefined,
    is_custom,
    created_at: now,
    updated_at: now
  };
}

export function deleteTariffFromDb(db: Database, id: string): boolean {
  try {
    db.run("DELETE FROM tarifs WHERE id = ?", [id]);
    return true;
  } catch (e) {
    return false;
  }
}
