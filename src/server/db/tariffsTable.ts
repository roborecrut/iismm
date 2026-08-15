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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cosmos',
    name: 'Космос',
    price_iirky: 'Индивидуально',
    price_rub: 15000,
    sub: 'Индивидуальная разработка под ключ',
    continuation: 'Все возможности тарифа Отрыв, плюс:',
    monthly_iirky: 15000,
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
      created_at TEXT,
      updated_at TEXT
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_tarifs_sort ON tarifs(sort_order);`);

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
          `INSERT INTO tarifs (id, name, price_iirky, price_rub, sub, continuation, monthly_iirky, features, is_active, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.name, t.price_iirky, t.price_rub, t.sub, t.continuation || '', t.monthly_iirky, t.features, t.is_active, t.sort_order, t.created_at, t.updated_at]
        );
      }
      console.log(`[TariffsTable] Seeded ${DEFAULT_TARIFFS.length} default tariffs.`);
    }
  } catch (e) {
    console.error('[TariffsTable] Error initializing tarifs table:', e);
  }
}

export function getAllTariffsFromDb(db: Database): TariffRecord[] {
  try {
    const stmt = db.prepare("SELECT * FROM tarifs ORDER BY sort_order ASC");
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
