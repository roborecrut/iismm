import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Save, 
  FileEdit, 
  Eye, 
  AlertCircle, 
  Loader2, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  EyeOff, 
  Code, 
  Link as LinkIcon, 
  Paperclip, 
  Image as ImageIcon, 
  File as FileIcon, 
  Video, 
  Film,
  Volume2, 
  Clock, 
  Sliders, 
  Plus, 
  Quote, 
  Info,
  Check,
  Zap,
  Tag,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Calendar,
  Grid,
  Trash2,
  ExternalLink,
  Smartphone,
  Globe,
  Radio,
  FileText,
  X,
  Smile,
  Shield,
  Table as TableIcon,
  Copy,
  Clipboard,
  Calculator,
  Hash,
  Anchor,
  Heart,
  Mic
} from 'lucide-react';
import { DayRequest, PostTemplate, User, InlineButton, Channel } from '../types';
import { FileUpload } from './FileUpload';
import { getUploadService } from '../services/FileUploadService';
import { TelegramAlbumCollage } from './TelegramAlbumCollage';
import { VoiceRecorderModal } from './VoiceRecorderModal';

interface PromptEditorProps {
  dayRequests: DayRequest[];
  templates?: PostTemplate[];
  channels?: Channel[];
  currentUser?: User | null;
  onSaveDayRequest: (request: Partial<DayRequest>) => Promise<void>;
  onDeleteDayRequest?: (id: string) => Promise<void>;
  onPublishToTelegram: (
    title: string, 
    content: string, 
    dayRequestId: string, 
    formattingOptions?: any
  ) => Promise<void>;
  onSaveTemplate?: (template: { type: 'header' | 'postText' | 'signature' | 'full'; name: string; category?: string; content: string }) => Promise<void>;
  initialDayRequestId?: string;
  telegramId?: number;
}

// Markdown V2 escaping helper
export function escapeMarkdownV2(str: string): string {
  return str.replace(/(?<!\\)([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export interface ExtractedUrlInfo {
  url: string;
  title?: string;
  domain: string;
}

export function extractFirstUrl(text: string): ExtractedUrlInfo | null {
  if (!text) return null;
  // Match markdown link [title](url)
  const mdMatch = text.match(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/i);
  if (mdMatch) {
    try {
      const parsed = new URL(mdMatch[2]);
      return { url: mdMatch[2], title: mdMatch[1], domain: parsed.hostname.replace(/^www\./, '') };
    } catch (e) {
      return { url: mdMatch[2], title: mdMatch[1], domain: mdMatch[2] };
    }
  }

  // Match standard URL
  const rawMatch = text.match(/(https?:\/\/[^\s<>"'\)]+)/i);
  if (rawMatch) {
    const cleanUrl = rawMatch[1].replace(/[.,;:!?]+$/, '');
    try {
      const parsed = new URL(cleanUrl);
      return { url: cleanUrl, domain: parsed.hostname.replace(/^www\./, '') };
    } catch (e) {
      return { url: cleanUrl, domain: cleanUrl };
    }
  }

  // Match t.me link
  const tgMatch = text.match(/(t\.me\/[^\s<>"'\)]+)/i);
  if (tgMatch) {
    const cleanUrl = `https://${tgMatch[1].replace(/[.,;:!?]+$/, '')}`;
    try {
      const parsed = new URL(cleanUrl);
      return { url: cleanUrl, domain: parsed.hostname.replace(/^www\./, '') };
    } catch (e) {
      return { url: cleanUrl, domain: 't.me' };
    }
  }

  return null;
}

// Telegram Link Preview Component for Phone Mockup & Editor
export const TelegramLinkPreviewMockup: React.FC<{
  urlInfo?: ExtractedUrlInfo | null;
  link?: ExtractedUrlInfo | null;
  enabled?: boolean;
}> = ({ urlInfo, link, enabled = true }) => {
  const activeInfo = urlInfo || link;
  if (!enabled || !activeInfo) return null;

  return (
    <div className="mt-2.5 rounded-xl border-l-[3px] border-sky-400 bg-white/80 p-2.5 shadow-xs transition-all">
      <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wide">
        {activeInfo.domain || 'Сайт'}
      </div>
      <div className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
        {activeInfo.title || activeInfo.domain}
      </div>
      <div className="text-[11px] text-slate-500 truncate mt-0.5">
        {activeInfo.url}
      </div>
    </div>
  );
};

// 20 Post Styles for AI Generation
const POST_STYLES = [
  { id: 'expert', title: '🧠 Экспертный и аналитический', desc: 'Глубокий, содержательный тон с фактами, цифрами и логикой' },
  { id: 'storytelling', title: '🎭 Драматичный сторителлинг', desc: 'Захватывающая история от первого лица с интригой и кульминацией' },
  { id: 'provocative', title: '🌶️ Ироничный и провокационный', desc: 'Легкий сарказм, вызов стереотипам, острые вопросы и юмор' },
  { id: 'aida', title: '💰 Продающий AIDA', desc: 'Внимание -> Интерес -> Желание -> Действие (призыв к покупке/клику)' },
  { id: 'infostyle', title: '🧹 Инфостиль Главреда', desc: 'Сухой, честный, очищенный от словесного мусора текст без воды' },
  { id: 'popular_science', title: '🧪 Научно-популярный', desc: 'Сложные концепции простыми словами с понятными метафорами' },
  { id: 'concise', title: '⚡ Лаконичный сухой факт', desc: 'Короткие емкие предложения, максимальная плотность информации' },
  { id: 'lifestyle', title: '☕ Душевный лайфстайл', desc: 'Теплый, искренний, дружеский разговор за чашкой кофе' },
  { id: 'motivational', title: '🚀 Мотивационный коучинг', desc: 'Вдохновляющий импульс, заряд энергии и побуждение к действиям' },
  { id: 'corporate', title: '💼 Деловой корпоративный', desc: 'Строгий, уважительный B2B-стиль для предпринимателей' },
  { id: 'humorous', title: '😂 Юмористический меметичный', desc: 'Понятные мем-отсылки, живой сленг и забавные жизненные ситуации' },
  { id: 'clickbait', title: '🎣 Интригующий кликбейт', desc: 'Загадочное начало, нарастание напряжения и удержание внимания' },
  { id: 'qna', title: '❓ Вопрос-Ответ (Q&A)', desc: 'Пошаговые ответы на самые частые и острые вопросы читателей' },
  { id: 'battle', title: '⚔️ Сравнительный баттл', desc: 'Сравнение двух подходов, технологий или продуктов с плюсами и минусами' },
  { id: 'checklist', title: '📋 Пошаговый гайд / Чек-лист', desc: 'Структурированная инструкция 1-2-3 с чек-боксами и шагами' },
  { id: 'futuristic', title: '🤖 Футуристичный и IT-техно', desc: 'Тон техно-гика, фокус на нейросетях, будущем и алгоритмах' },
  { id: 'discussion', title: '💬 Дискуссионный и спорный', desc: 'Открытый вопрос аудитории, стравливание точек зрения для комментариев' },
  { id: 'emotional', title: '🔥 Эмоциональный крик души', desc: 'Искренний эмоциональный порыв, переживания и личный опыт' },
  { id: 'philosophical', title: '📜 Афористичный и философский', desc: 'Притча, глубокие цитаты и размышления о бизнесе и мышлении' },
  { id: 'case_study', title: '📊 Кейс и результаты в цифрах', desc: 'Конкретный результат Было -> Стало, выгоды в процентах и выручке' }
];

// Built-in Rich Draft Templates
const BUILTIN_DRAFTS = [
  {
    id: 'rich_full',
    title: 'Rich HTML Полноприводный',
    subtitle: 'Форматирование таблиц, цитат, видео, кастомных эмодзи',
    badge: '💎',
    format: 'rich',
    content: `<blockquote>
Этот блок представляет собой красивую Telegram цитату (blockquote) с левой вертикальной линией и источником.
<cite>Ахматова Анна</cite>
</blockquote>

### 🌍 Метрики и результаты
| Показатель | Значение | Тренд |
|:---|:---:|:---|
| Рост аудитории | +24% | 📈 |
| Конверсия | 4.8% | 🔥 |

### 💎 Премиум эмодзи и время
Вот кастомные эмодзи: ![👍](tg://emoji?id=5368324170671202286) ![🔥](tg://emoji?id=5368324170671202287)
Публикация запланирована на: <tg-time unix="1784727120" format="wDT">Вторник, 15:00</tg-time>

<details open><summary>Раскрыть подробности акции</summary>

Скидка 30% действует при оформлении подписки в течение 24 часов!
</details>`
  },
  {
    id: 'simple_post',
    title: 'Простой пост с форматированием',
    subtitle: 'Жирный, курсив, спойлеры и гиперссылки',
    badge: '📝',
    format: 'rich',
    content: `**Привет!** Это *классный* пост с ~~ошибкой~~, <u>подчеркнутым текстом</u> и [ссылкой на наш канал](https://t.me/SAV_AI).

А вот тут у нас ||секретный текст-спойлер||, на который в Telegram клиенте можно нажать для прочтения.

Пользователь: @durov
Хэштег: #rich_message`
  },
  {
    id: 'media_lists',
    title: 'Пост с медиа-сеткой и списками',
    subtitle: 'Заголовки, маркированные списки и коллаж изображений',
    badge: '🖼️',
    format: 'rich',
    content: `# 🚀 Обновление платформы

Мы подготовили для вас свежий релиз с новыми возможностями:

- [x] Автоматический парсер Markdown V2
- [x] Поддержка Rich HTML блоков
- [ ] Интеграция с внешней аналитикой

<tg-collage>
![](https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500)
![](https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500)
</tg-collage>`
  },
  {
    id: 'interactive_summary',
    title: 'Интерактивная сводка с таблицей и details',
    subtitle: 'Аналитическая сводка для подписчиков',
    badge: '📊',
    format: 'rich',
    content: `## 📈 Еженедельный отчет о продукте

> "Качество и скорость развития — наши главные приоритеты."

<details open><summary>Ключевые показатели недели</summary>

| Метрика | Прошлый период | Текущий период |
|:---|:---:|:---:|
| Новые пользователи | 1 200 | 1 850 |
| Удержание (D7) | 42% | 48% |
</details>`
  },
  {
    id: 'custom_emoji_time',
    title: 'Кастомные эмодзи и время',
    subtitle: 'Динамические счетчики времени и премиум эмодзи',
    badge: '⚡',
    format: 'rich',
    content: `# ⏰ Анонс прямых трансляций

Следующий вебинар состоится: <tg-time unix="1784727120" format="wDT">Вторник, 15:00</tg-time>

Не пропустите! ![🔥](tg://emoji?id=5368324170671202287) ![🚀](tg://emoji?id=5368324170671202286)`
  },
  {
    id: 'math_code',
    title: 'Математика и код',
    subtitle: 'Подсветка кода и математические формулы LaTeX',
    badge: '🧮',
    format: 'rich',
    content: `### 💻 Пример алгоритма

\`\`\`typescript
function calculateBonus(score: number): number {
  return score * 1.5;
}
\`\`\`

Математическая формула связи энергии и массы: $E = mc^2$`
  },
  {
    id: 'media_grid_slider',
    title: 'Медиа-сетка и слайдер',
    subtitle: 'Галереи <tg-collage> и <tg-slideshow>',
    badge: '🎨',
    format: 'rich',
    content: `### 📸 Галерея проектов

Ниже представлены слайды наших последних работ:

<tg-slideshow>
![](https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800)
![](https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800)
</tg-slideshow>`
  },
  {
    id: 'empty_tpl',
    title: 'Пустой шаблон',
    subtitle: 'Начать писать с чистого листа',
    badge: '📄',
    format: 'v2',
    content: ''
  }
];

// Helper to extract headings from text for anchor bindings
export function extractHeadingsFromPost(text: string): { title: string; slug: string }[] {
  if (!text) return [];
  const lines = text.split('\n');
  const headings: { title: string; slug: string }[] = [];
  lines.forEach(line => {
    const match = line.match(/^#{1,4}\s+(.+)$/);
    if (match) {
      const title = match[1].trim();
      const slug = title.toLowerCase().replace(/[^\wа-яa-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
      if (slug) {
        headings.push({ title, slug });
      }
    }
  });
  return headings;
}

// LaTeX Math Preview Component
function RenderMathPreview({ formula }: { formula: string; key?: React.Key }) {
  if (!formula) return null;

  let cleaned = formula;
  const fracRegex = /\\frac\{([^{}]+)\}\{([^{}]+)\}/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match;

  while ((match = fracRegex.exec(cleaned)) !== null) {
    if (match.index > lastIdx) {
      parts.push(cleaned.substring(lastIdx, match.index));
    }
    const num = match[1];
    const den = match[2];
    parts.push(
      <span key={match.index} className="inline-flex flex-col items-center mx-1 align-middle text-xs">
        <span className="border-b border-purple-400 px-1 font-semibold text-purple-200">{num}</span>
        <span className="px-1 text-purple-300">{den}</span>
      </span>
    );
    lastIdx = fracRegex.lastIndex;
  }

  if (lastIdx < cleaned.length) {
    parts.push(cleaned.substring(lastIdx));
  }

  const formatSymbols = (textStr: string) => {
    return textStr
      .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
      .replace(/\\sqrt/g, '√')
      .replace(/\\int_\{([^{}]+)\}\^\{([^{}]+)\}/g, '∫_($1)^($2)')
      .replace(/\\int/g, '∫')
      .replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, '∑_($1)^($2)')
      .replace(/\\sum/g, '∑')
      .replace(/\\lim/g, 'lim')
      .replace(/\\pi/g, 'π')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\gamma/g, 'γ')
      .replace(/\\infty/g, '∞')
      .replace(/\\pm/g, '±')
      .replace(/\\approx/g, '≈')
      .replace(/\\neq/g, '≠')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥');
  };

  return (
    <span className="font-serif italic text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60 font-bold inline-flex items-center align-middle my-0.5">
      {parts.map((part, i) => (typeof part === 'string' ? formatSymbols(part) : part))}
    </span>
  );
}

// Copyable Code Block component for Telegram Preview
function TelegramCodeBlock({ code }: { code: string; key?: React.Key }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl border border-pink-300 bg-white/95 overflow-hidden shadow-2xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 to-sky-100 border-b border-pink-200 text-[10px] font-mono text-slate-700 font-bold">
        <span className="flex items-center space-x-1">
          <Code size={12} className="text-pink-600" />
          <span>КОД</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 font-semibold cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/80 transition-colors"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-600" />
              <span className="text-emerald-600">Скопировано</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Копировать</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-slate-900 overflow-x-auto whitespace-pre-wrap select-all bg-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Universal Telegram Formatting Renderer for both V2 and Rich modes
export function renderFormattedText(text: string, format: 'v2' | 'rich' = 'rich'): React.ReactNode {
  if (!text) return null;

  let cleanedText = text;
  if (format === 'v2') {
    cleanedText = cleanedText.replace(/\\([_*\[\]()~`>#+\-=|{}.!\\])/g, '$1');
  }

  // Regex ordered strictly by specificity:
  // 1. Code blocks (```...```)
  // 2. Inline code (`...`)
  // 3. Spoilers (||...||)
  // 4. Underline (__...__ or <u>...</u>)
  // 5. Bold (**...** or *...* or <b>...</b>)
  // 6. Strikethrough (~~...~~ or ~...~ or <s>...</s>)
  // 7. Italic (_..._ or <i>...</i>)
  // 8. Links ([...](...))
  // 9. Time tags (<tg-time...>)
  // 10. Math formulas ($...$)
  const regex = format === 'v2'
    ? /(```[\s\S]*?```|`[^`\n]+`|\|\|[\s\S]+?\|\||__[^_\n]+__|(?:\*\*[^*\n]+\*\*|\*[^*\n]+\*)|(?:~~[^~\n]+~~|~[^~\n]+~)|_[^_\n]+_|\[[^\]]+\]\([^\)]+\)|\$[^\$\n]+\$)/g
    : /(```[\s\S]*?```|`[^`\n]+`|\|\|[\s\S]+?\|\||__[^_\n]+__|<u>[\s\S]+?<\/u>|(?:\*\*[^*\n]+\*\*|\*[^*\n]+\*)|<b>[\s\S]+?<\/b>|(?:~~[^~\n]+~~|~[^~\n]+~)|<s>[\s\S]+?<\/s>|_[^_\n]+_|<i>[\s\S]+?<\/i>|\[[^\]]+\]\([^\)]+\)|<tg-time[\s\S]+?<\/tg-time>|\$[^\$\n]+\$)/g;

  const parts = cleanedText.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        if (!part) return null;

        // 1. Code Blocks ```code```
        if (part.startsWith('```') && part.endsWith('```') && part.length >= 6) {
          const rawCode = part.slice(3, -3).replace(/^\n/, '');
          return <TelegramCodeBlock key={index} code={rawCode} />;
        }

        // 2. Inline Code `code`
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
          const content = part.slice(1, -1);
          return (
            <code key={index} className="bg-white/95 text-pink-700 font-mono text-[11px] px-1.5 py-0.5 rounded border border-pink-300 shadow-2xs select-all">
              {content}
            </code>
          );
        }

        // 3. Spoilers ||spoiler||
        if (part.startsWith('||') && part.endsWith('||') && part.length >= 4) {
          const content = part.slice(2, -2);
          return (
            <span
              key={index}
              className="bg-pink-200/60 text-transparent hover:text-slate-900 rounded px-1 cursor-pointer transition-colors select-none font-sans border border-pink-300"
              title="Нажмите, чтобы показать спойлер"
            >
              {renderFormattedText(content, format)}
            </span>
          );
        }

        // 4. Underline __text__ or <u>text</u>
        if (
          (part.startsWith('__') && part.endsWith('__') && part.length >= 4) ||
          (part.startsWith('<u>') && part.endsWith('</u>'))
        ) {
          const content = part.startsWith('<u>') ? part.slice(3, -4) : part.slice(2, -2);
          return (
            <span key={index} className="underline decoration-pink-500 font-medium">
              {renderFormattedText(content, format)}
            </span>
          );
        }

        // 5. Bold **text**, *text*, <b>text</b>
        if (
          (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
          (part.startsWith('<b>') && part.endsWith('</b>')) ||
          (part.startsWith('*') && part.endsWith('*') && part.length >= 2)
        ) {
          const content = part.startsWith('<b>') ? part.slice(3, -4) : (part.startsWith('**') ? part.slice(2, -2) : part.slice(1, -1));
          return <strong key={index} className="font-bold text-slate-950">{renderFormattedText(content, format)}</strong>;
        }

        // 6. Strikethrough ~~text~~, ~text~, <s>text</s>
        if (
          (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) ||
          (part.startsWith('<s>') && part.endsWith('</s>')) ||
          (part.startsWith('~') && part.endsWith('~') && part.length >= 2)
        ) {
          const content = part.startsWith('<s>') ? part.slice(3, -4) : (part.startsWith('~~') ? part.slice(2, -2) : part.slice(1, -1));
          return <del key={index} className="line-through text-slate-500">{renderFormattedText(content, format)}</del>;
        }

        // 7. Italic _text_, <i>text</i>
        if (
          (part.startsWith('_') && part.endsWith('_') && part.length >= 2) ||
          (part.startsWith('<i>') && part.endsWith('</i>'))
        ) {
          const content = part.startsWith('<i>') ? part.slice(3, -4) : part.slice(1, -1);
          return <em key={index} className="italic text-slate-800">{renderFormattedText(content, format)}</em>;
        }

        // 8. Links [label](url)
        if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
          const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
          if (linkMatch) {
            const label = linkMatch[1];
            const url = linkMatch[2];

            if (url.startsWith('tg://emoji')) {
              const idMatch = url.match(/id=(\d+)/);
              const emojiId = idMatch ? idMatch[1] : '';
              return (
                <span key={index} className="inline-flex items-center space-x-1 bg-white/90 border border-pink-200 px-1.5 py-0.5 rounded text-pink-700 font-bold text-[11px]" title={`Custom Emoji ID: ${emojiId}`}>
                  <span>{label || '✨'}</span>
                </span>
              );
            }

            return (
              <a key={index} href={url} target="_blank" rel="noreferrer" className="text-pink-600 font-semibold underline hover:text-pink-700">
                {label}
              </a>
            );
          }
        }

        // 9. Time tags <tg-time...>
        if (part.includes('<tg-time')) {
          const timeMatch = part.match(/<tg-time.*?unix=["'](\d+)["'].*?>(.*?)<\/tg-time>/i);
          if (timeMatch) {
            const timeLabel = timeMatch[2];
            return (
              <span key={index} className="inline-flex items-center space-x-1 bg-white/90 border border-pink-200 px-1.5 py-0.5 rounded text-pink-700 font-mono text-[11px]">
                <Clock size={11} />
                <span>{timeLabel}</span>
              </span>
            );
          }
        }

        // 10. Math formulas $...$
        if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
          const formula = part.slice(1, -1);
          return <RenderMathPreview key={index} formula={formula} />;
        }

        return part;
      })}
    </span>
  );
}

function renderInlineMarkdown(text: string, format: 'v2' | 'rich' = 'rich') {
  return renderFormattedText(text, format);
}

// Complete Rich Markdown Telegram Preview Renderer
function RichPreviewRenderer({
  postText,
  signature,
  attachmentType,
  attachmentUrl,
  linkPreviewEnabled = true
}: {
  postText: string;
  signature?: string;
  attachmentType: string;
  attachmentUrl: string;
  linkPreviewEnabled?: boolean;
}) {
  const [slideshowIndices, setSlideshowIndices] = useState<{ [key: number]: number }>({});

  const setSlideIndex = (blockIdx: number, newIndex: number) => {
    setSlideshowIndices(prev => ({ ...prev, [blockIdx]: newIndex }));
  };

  const renderContentWithTables = (text: string) => {
    if (!text) return null;
    if (!text.includes('|')) {
      return renderInlineMarkdown(text);
    }

    const lines = text.split('\n');
    const segments: { type: 'text' | 'table'; lines: string[] }[] = [];
    let currentType: 'text' | 'table' = 'text';
    let currentLines: string[] = [];

    lines.forEach((line) => {
      const isTableLine = line.trim().startsWith('|') || (line.trim().includes('|') && line.trim().endsWith('|'));
      if (isTableLine) {
        if (currentType !== 'table') {
          if (currentLines.length > 0) {
            segments.push({ type: 'text', lines: currentLines });
            currentLines = [];
          }
          currentType = 'table';
        }
      } else {
        if (currentType !== 'text') {
          if (currentLines.length > 0) {
            segments.push({ type: 'table', lines: currentLines });
            currentLines = [];
          }
          currentType = 'text';
        }
      }
      currentLines.push(line);
    });

    if (currentLines.length > 0) {
      segments.push({ type: currentType, lines: currentLines });
    }

    return (
      <div className="space-y-2">
        {segments.map((seg, sIdx) => {
          if (seg.type === 'text') {
            const txt = seg.lines.join('\n').trim();
            return txt ? <div key={sIdx}>{renderInlineMarkdown(txt)}</div> : null;
          } else {
            const tableText = seg.lines.join('\n');
            let rawRows = tableText.split('\n').map(r => r.trim()).filter(Boolean);
            let tableRows = rawRows.filter(r => !r.match(/^\|?\s*:?---+\s*:?/));

            let parsedMatrix: string[][] = [];
            tableRows.forEach(rowStr => {
              const cells = rowStr.split('|').map(c => c.trim()).filter(c => c.length > 0 && !c.match(/^:?---*:?$/));
              if (cells.length > 0) {
                parsedMatrix.push(cells);
              }
            });

            if (parsedMatrix.length > 0) {
              const hasHeader = parsedMatrix.length > 1;
              const headers = parsedMatrix[0];
              const dataRows = hasHeader ? parsedMatrix.slice(1) : [parsedMatrix[0]];

              return (
                <div key={sIdx} className="overflow-x-auto my-2 rounded-xl border border-pink-200 bg-white/90 shadow-xs">
                  <table className="w-full text-[11px] border-collapse">
                    {hasHeader && (
                      <thead>
                        <tr className="bg-gradient-to-r from-sky-100 via-pink-100 to-orange-100 font-extrabold text-slate-900 border-b border-pink-200">
                          {headers.map((headerCell, hIdx) => (
                            <th key={hIdx} className="p-2.5 text-left border-r border-pink-200 last:border-r-0 font-bold text-slate-900">
                              {renderInlineMarkdown(headerCell)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {dataRows.map((rowCells, rIdx) => (
                        <tr key={rIdx} className="border-t border-pink-100 hover:bg-pink-50/50 transition-colors">
                          {(hasHeader ? headers : rowCells).map((_, cIdx) => (
                            <td key={cIdx} className="p-2 border-r border-pink-100 last:border-r-0 text-slate-800">
                              {renderInlineMarkdown(rowCells[cIdx] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            return <div key={sIdx}>{renderInlineMarkdown(tableText)}</div>;
          }
        })}
      </div>
    );
  };

  if (!postText && !signature) {
    return <p className="text-xs text-slate-500 italic">Текст вашего сообщения появится здесь...</p>;
  }

  const blocks = postText.split('\n\n');

  return (
    <div className="space-y-2.5 text-xs text-slate-900 leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        // Headings with clean gradient text (strictly require space after '#' to avoid hashtags like #smm)
        if (block.match(/^#\s+(.+)$/)) {
          return <h1 key={idx} className="text-base font-extrabold bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600 bg-clip-text text-transparent pt-1">{renderInlineMarkdown(block.replace(/^#\s+/, ''))}</h1>;
        }
        if (block.match(/^##\s+(.+)$/)) {
          return <h2 key={idx} className="text-sm font-extrabold bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600 bg-clip-text text-transparent pt-1">{renderInlineMarkdown(block.replace(/^##\s+/, ''))}</h2>;
        }
        if (block.match(/^###\s+(.+)$/)) {
          return <h3 key={idx} className="text-xs font-bold text-pink-700 pt-1">{renderInlineMarkdown(block.replace(/^###\s+/, ''))}</h3>;
        }
        if (block.match(/^####\s+(.+)$/)) {
          return <h4 key={idx} className="text-[11px] font-bold text-sky-700 pt-1">{renderInlineMarkdown(block.replace(/^####\s+/, ''))}</h4>;
        }

        // <tg-collage>
        if (block.includes('<tg-collage>')) {
          const imgMatches = [...block.matchAll(/!\[(.*?)\]\((.*?)\)/g)];
          const imgUrls = imgMatches.map(m => m[2]);
          if (imgUrls.length > 0) {
            return (
              <div key={idx} className="my-2 space-y-1">
                <div className="text-[10px] text-pink-600 font-mono flex items-center space-x-1">
                  <ImageIcon size={12} />
                  <span>Коллаж ({imgUrls.length} фото):</span>
                </div>
                <div className={`grid gap-1.5 rounded-xl overflow-hidden ${imgUrls.length === 1 ? 'grid-cols-1' : imgUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {imgUrls.map((url, i) => (
                    <div key={i} className="aspect-video bg-white/80 overflow-hidden relative rounded-lg border border-pink-200">
                      <img src={url} alt="collage" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        }

        // <tg-slideshow>
        if (block.includes('<tg-slideshow>')) {
          const imgMatches = [...block.matchAll(/!\[(.*?)\]\((.*?)\)/g)];
          const imgUrls = imgMatches.map(m => m[2]);
          if (imgUrls.length > 0) {
            const currentIdx = slideshowIndices[idx] || 0;
            return (
              <div key={idx} className="my-2 space-y-1.5 bg-white/80 p-2.5 rounded-xl border border-pink-200">
                <div className="flex items-center justify-between text-[10px] text-pink-700 font-mono">
                  <span className="flex items-center space-x-1 font-bold">
                    <ImageIcon size={12} />
                    <span>Слайдер изображений</span>
                  </span>
                  <span className="bg-pink-100 px-2 py-0.5 rounded border border-pink-200 font-semibold">{currentIdx + 1} / {imgUrls.length}</span>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-pink-200">
                  <img src={imgUrls[currentIdx]} alt="slide" className="w-full h-full object-contain" />

                  {imgUrls.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSlideIndex(idx, (currentIdx - 1 + imgUrls.length) % imgUrls.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-1.5 rounded-full cursor-pointer transition-all shadow-md border border-pink-200"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSlideIndex(idx, (currentIdx + 1) % imgUrls.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-1.5 rounded-full cursor-pointer transition-all shadow-md border border-pink-200"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          }
        }

        // Video
        if (block.includes('<video') || block.match(/!\[video\]\((.*?)\)/i)) {
          const srcMatch = block.match(/src=["'](.*?)["']/i) || block.match(/!\[video\]\((.*?)\)/i);
          const videoUrl = srcMatch ? srcMatch[1] : '';
          return (
            <div key={idx} className="my-2 space-y-1">
              <div className="text-[10px] text-pink-600 font-mono flex items-center space-x-1">
                <Video size={12} />
                <span>Видеозапись:</span>
              </div>
              <video controls className="w-full max-h-56 rounded-xl bg-black border border-pink-200" src={videoUrl}>
                Ваш браузер не поддерживает видео.
              </video>
            </div>
          );
        }

        // Audio
        if (block.includes('<audio') || block.match(/!\[audio\]\((.*?)\)/i)) {
          const srcMatch = block.match(/src=["'](.*?)["']/i) || block.match(/!\[audio\]\((.*?)\)/i);
          const audioUrl = srcMatch ? srcMatch[1] : '';
          return (
            <div key={idx} className="my-2 p-3 bg-white/90 rounded-xl border border-pink-200 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-pink-700 font-semibold">
                <Volume2 size={16} />
                <span>Аудиосообщение</span>
              </div>
              <audio controls className="w-full h-8" src={audioUrl} />
            </div>
          );
        }

        // Markdown Single Image: ![alt](url "title") or ![alt](url)
        const singleImgMatch = block.match(/^!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)$/);
        if (singleImgMatch) {
          const altText = singleImgMatch[1];
          const imgUrl = singleImgMatch[2];
          const captionTitle = singleImgMatch[3];
          return (
            <div key={idx} className="my-2 space-y-1 rounded-xl overflow-hidden bg-white/80 border border-pink-200 p-1">
              <img src={imgUrl} alt={altText || 'Image'} className="w-full max-h-64 object-cover rounded-lg" />
              {captionTitle && (
                <div className="text-[11px] text-slate-600 px-2 py-1 italic font-medium">
                  {captionTitle}
                </div>
              )}
            </div>
          );
        }

        // <details> Collapsible Block
        if (block.includes('<details') || block.includes('</details>')) {
          const summaryMatch = block.match(/<summary>(.*?)<\/summary>/i);
          const summaryText = summaryMatch ? summaryMatch[1] : 'Раскрыть подробности';
          let detailsContent = block
            .replace(/<details.*?>/gi, '')
            .replace(/<\/details>/gi, '')
            .replace(/<summary>.*?<\/summary>/gi, '')
            .trim();

          return (
            <details key={idx} open className="bg-white/80 border border-pink-200 rounded-xl p-3 my-2 text-xs group cursor-pointer shadow-xs">
              <summary className="font-bold text-pink-700 select-none flex items-center justify-between">
                <span>{summaryText}</span>
              </summary>
              <div className="mt-2 pt-2 border-t border-pink-100 text-slate-800 whitespace-pre-wrap leading-relaxed">
                {renderContentWithTables(detailsContent)}
              </div>
            </details>
          );
        }

        // Markdown Table Parser (handles both multiline and single-line inline tables)
        if (block.includes('|')) {
          let rawRows = block.split(/\n|\|\|/).map(r => r.trim()).filter(Boolean);
          let tableRows = rawRows.filter(r => !r.match(/^\|?\s*:?---+\s*:?/));

          let parsedMatrix: string[][] = [];
          tableRows.forEach(rowStr => {
            const cells = rowStr.split('|').map(c => c.trim()).filter(c => c.length > 0 && !c.match(/^:?---*:?$/));
            if (cells.length > 0) {
              parsedMatrix.push(cells);
            }
          });

          if (parsedMatrix.length > 0) {
            const hasHeader = parsedMatrix.length > 1;
            const headers = parsedMatrix[0];
            const dataRows = hasHeader ? parsedMatrix.slice(1) : [parsedMatrix[0]];

            return (
              <div key={idx} className="overflow-x-auto my-2 rounded-xl border border-pink-200 bg-white/90 shadow-xs">
                <table className="w-full text-[11px] border-collapse">
                  {hasHeader && (
                    <thead>
                      <tr className="bg-gradient-to-r from-sky-100 via-pink-100 to-orange-100 font-extrabold text-slate-900 border-b border-pink-200">
                        {headers.map((headerCell, hIdx) => (
                          <th key={hIdx} className="p-2.5 text-left border-r border-pink-200 last:border-r-0 font-bold text-slate-900">
                            {renderInlineMarkdown(headerCell)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {dataRows.map((rowCells, rIdx) => (
                      <tr key={rIdx} className="border-t border-pink-100 hover:bg-pink-50/50 transition-colors">
                        {(hasHeader ? headers : rowCells).map((_, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-pink-100 last:border-r-0 text-slate-800">
                            {renderInlineMarkdown(rowCells[cIdx] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Blockquotes
        if (block.startsWith('>') || block.includes('<blockquote>')) {
          const cleanQuote = block.replace(/<\/?blockquote>/g, '').replace(/<\/?cite>/g, '').replace(/^>\s?/gm, '');
          return (
            <div key={idx} className="border-l-3 border-pink-400 pl-3 py-1.5 my-2 bg-white/70 rounded-r-xl text-slate-800 italic">
              {renderInlineMarkdown(cleanQuote)}
            </div>
          );
        }

        // Standard Paragraph or Lists
        const blockLines = block.split('\n');
        const hasList = blockLines.some(l => {
          const t = l.trim();
          return t.startsWith('- ') || t.startsWith('* ') || t.startsWith('- [') || t.startsWith('* [') || /^\d+\.\s/.test(t);
        });

        if (hasList) {
          return (
            <div key={idx} className="space-y-1 my-1.5">
              {blockLines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('* [ ] ')) {
                  const content = trimmed.slice(6);
                  return (
                    <div key={lIdx} className="flex items-start space-x-2 text-slate-800">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-pink-300 bg-white text-[10px] text-slate-400 shrink-0 mt-0.5 select-none font-bold">
                        ☐
                      </span>
                      <div className="flex-1 leading-relaxed">{renderInlineMarkdown(content)}</div>
                    </div>
                  );
                }
                if (trimmed.startsWith('- [x] ') || trimmed.startsWith('* [x] ') || trimmed.startsWith('- [X] ') || trimmed.startsWith('* [X] ')) {
                  const content = trimmed.slice(6);
                  return (
                    <div key={lIdx} className="flex items-start space-x-2 text-slate-800">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-pink-400 bg-pink-100 text-[10px] text-pink-700 shrink-0 mt-0.5 select-none font-bold">
                        ✓
                      </span>
                      <div className="flex-1 leading-relaxed line-through text-slate-400">{renderInlineMarkdown(content)}</div>
                    </div>
                  );
                }
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  const content = trimmed.slice(2);
                  return (
                    <div key={lIdx} className="flex items-start space-x-2 text-slate-800 pl-1">
                      <span className="text-pink-600 font-bold select-none">•</span>
                      <div className="flex-1 leading-relaxed">{renderInlineMarkdown(content)}</div>
                    </div>
                  );
                }
                const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
                if (numMatch) {
                  return (
                    <div key={lIdx} className="flex items-start space-x-2 text-slate-800 pl-1">
                      <span className="text-pink-700 font-mono font-bold text-[11px] select-none">{numMatch[1]}.</span>
                      <div className="flex-1 leading-relaxed">{renderInlineMarkdown(numMatch[2])}</div>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="whitespace-pre-wrap">
                    {renderInlineMarkdown(line)}
                  </p>
                );
              })}
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx} className="whitespace-pre-wrap">
            {renderInlineMarkdown(block)}
          </p>
        );
      })}

      {/* Telegram Link Preview inside Message Bubble */}
      {linkPreviewEnabled && (
        <TelegramLinkPreviewMockup
          urlInfo={extractFirstUrl(postText)}
          enabled={linkPreviewEnabled}
        />
      )}
    </div>
  );
}

const CopyButton: React.FC<{ value: string; className?: string }> = ({ value, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value || !value.trim()) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value || !value.trim()}
      title={copied ? "Скопировано!" : "Скопировать ссылку"}
      className={`px-2.5 py-1.5 bg-white/90 hover:bg-white disabled:opacity-40 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 border border-pink-200 cursor-pointer shrink-0 shadow-xs ${className}`}
    >
      {copied ? (
        <>
          <Check size={14} className="text-pink-600" />
          <span className="text-[11px] text-pink-600 font-bold">Скопировано!</span>
        </>
      ) : (
        <>
          <Copy size={14} className="text-pink-600" />
          <span className="text-[11px]">Копировать</span>
        </>
      )}
    </button>
  );
};

export default function PromptEditor({
  dayRequests,
  templates = [],
  channels = [],
  currentUser,
  onSaveDayRequest,
  onDeleteDayRequest,
  onPublishToTelegram,
  onSaveTemplate,
  initialDayRequestId,
  telegramId
}: PromptEditorProps) {
  // Active post selection
  const [selectedId, setSelectedId] = useState<string>(
    initialDayRequestId || (dayRequests[0]?.id || '')
  );

  const selectionRangeRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const handleTextareaSelection = () => {
    if (textareaRef.current) {
      selectionRangeRef.current = {
        start: textareaRef.current.selectionStart ?? 0,
        end: textareaRef.current.selectionEnd ?? 0
      };
    }
  };

  useEffect(() => {
    if (initialDayRequestId) {
      setSelectedId(initialDayRequestId);
    }
  }, [initialDayRequestId]);

  useEffect(() => {
    if (selectedId && !dayRequests.some(r => r.id === selectedId)) {
      if (dayRequests.length > 0) {
        setSelectedId(dayRequests[0].id);
      } else {
        setSelectedId('');
      }
    }
  }, [dayRequests, selectedId]);

  const activeRequest = dayRequests.find(r => r.id === selectedId) || dayRequests[0];

  // Core Header & Topic
  const [topic, setTopic] = useState<string>(''); // Max 15 chars (Theme for filter)
  const [title, setTitle] = useState<string>('');
  const [uppercaseHeader, setUppercaseHeader] = useState<boolean>(true);
  
  // Channels Selection
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  // Message syntax parser mode
  const [messageFormat, setMessageFormat] = useState<'v2' | 'rich'>('v2');
  const [richToolbarTab, setRichToolbarTab] = useState<'text' | 'headers' | 'media' | 'table' | 'emoji' | 'anchors'>('text');
  const [selectedDraftId, setSelectedDraftId] = useState<string>('rich_full');
  const [showDraftsMenu, setShowDraftsMenu] = useState<boolean>(false);
  const [linkPreviewEnabled, setLinkPreviewEnabled] = useState<boolean>(true);

  // Attachments (dedicated state per media type)
  const [attachmentType, setAttachmentType] = useState<'none' | 'photo' | 'document' | 'video' | 'audio' | 'album' | 'video_note'>('none');
  const [audioFormat, setAudioFormat] = useState<'audio' | 'voice'>('audio');
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState<boolean>(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoNoteUrl, setVideoNoteUrl] = useState<string>('');
  const [albumUrls, setAlbumUrls] = useState<string[]>(['', '']); // Up to 10 files
  const [audioUrls, setAudioUrls] = useState<string[]>(['', '']); // Up to 10 files
  const [documentUrls, setDocumentUrls] = useState<string[]>(['', '']); // Up to 10 files

  // Helper to extract active attachment URL & URLs array based on selected attachmentType
  const getActiveAttachmentData = () => {
    let url = '';
    let urls: string[] | undefined = undefined;

    if (attachmentType === 'photo') {
      url = photoUrl.trim();
    } else if (attachmentType === 'video') {
      url = videoUrl.trim();
    } else if (attachmentType === 'video_note') {
      url = videoNoteUrl.trim();
    } else if (attachmentType === 'album') {
      const valid = albumUrls.filter(u => u && u.trim() !== '');
      urls = valid.length > 0 ? valid : undefined;
      url = valid[0] || '';
    } else if (attachmentType === 'audio') {
      const valid = audioUrls.filter(u => u && u.trim() !== '');
      urls = valid.length > 0 ? valid : undefined;
      url = valid[0] || '';
    } else if (attachmentType === 'document') {
      const valid = documentUrls.filter(u => u && u.trim() !== '');
      urls = valid.length > 0 ? valid : undefined;
      url = valid[0] || '';
    }

    return { url, urls, audioFormat: attachmentType === 'audio' ? audioFormat : undefined };
  };

  // Content fields
  const [postText, setPostText] = useState<string>(''); // Manual post text (Free)
  const [requestTemplate, setRequestTemplate] = useState<string>(''); // AI Prompt (Instruction - max 10,000)
  const [imagePrompt, setImagePrompt] = useState<string>(''); // ProTalk Image prompt
  const [signature, setSignature] = useState<string>('');

  // Inline Buttons Constructor State
  const [inlineButtons, setInlineButtons] = useState<InlineButton[][]>([]);

  // Uniqueness memory count (0 to 30)
  const [uniquenessMemoryCount, setUniquenessMemoryCount] = useState<number>(0);

  // Advanced Schedule System
  const [triggerEnabled, setTriggerEnabled] = useState<boolean>(false);
  const [triggerFrequency, setTriggerFrequency] = useState<'interval_minutes' | 'interval_hours' | 'daily' | 'dayOfWeek' | 'monthly' | 'exact_date'>('daily');
  const [intervalMinutes, setIntervalMinutes] = useState<number>(15);
  const [intervalHours, setIntervalHours] = useState<number>(2);
  const [triggerTime, setTriggerTime] = useState<string>('09:00');
  const [exactDateTime, setExactDateTime] = useState<string>('2026-12-31T18:00');
  const [selectedTimezone, setSelectedTimezone] = useState<string>(currentUser?.timezone || 'Europe/Moscow');
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<string[]>(['Пн', 'Ср', 'Пт']);
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState<number>(1);
  const [selectedPostStyle, setSelectedPostStyle] = useState<string>('expert');
  const [maxCharsLimit, setMaxCharsLimit] = useState<number>(2500);
  const [notifyUser, setNotifyUser] = useState<boolean>(true);

  // UI status & mobile tabs
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [aiTimer, setAiTimer] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Timer effect for AI Generation (0 to 120s)
  useEffect(() => {
    let interval: any = null;
    if (isGenerating || isGeneratingImage) {
      setAiTimer(0);
      interval = setInterval(() => {
        setAiTimer(prev => (prev < 120 ? prev + 1 : 120));
      }, 1000);
    } else {
      setAiTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating, isGeneratingImage]);

  // Constructor Modals State
  const [activeModal, setActiveModal] = useState<'link' | 'media' | 'table' | 'emoji_time' | 'anchors' | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState<boolean>(false);

  // Link Modal state
  const [linkText, setLinkText] = useState('Наш Telegram');
  const [linkUrl, setLinkUrl] = useState('https://t.me/SAV_AI');

  // Media Modal state
  const [modalMediaType, setModalMediaType] = useState<'photo' | 'video' | 'audio' | 'collage' | 'slideshow'>('photo');
  const [modalMediaUrls, setModalMediaUrls] = useState<string[]>(['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800']);
  const [modalMediaCaption, setModalMediaCaption] = useState('Анонс проекта');

  // Table Modal state
  const [tableCols, setTableCols] = useState(2);
  const [tableHeaders, setTableHeaders] = useState(['Метрика', 'Значение']);
  const [tableRows, setTableRows] = useState([['Рост аудитории', '+24%'], ['Конверсия', '4.8%']]);

  // Emoji / Time / LaTeX modal state
  const [emojiTimeTab, setEmojiTimeTab] = useState<'emoji' | 'time' | 'latex'>('emoji');
  const [emojiId, setEmojiId] = useState('5368324170671202287');
  const [emojiAlt, setEmojiAlt] = useState('🔥');
  const [timeString, setTimeString] = useState('2026-07-22T15:00');
  const [timeFormat, setTimeFormat] = useState('wDT');
  const [latexFormula, setLatexFormula] = useState('E = mc^2');

  // Anchors Modal state
  const [anchorTab, setAnchorTab] = useState<'create' | 'link'>('create');
  const [anchorName, setAnchorName] = useState('chapter-1');
  const [anchorLabel, setAnchorLabel] = useState('Перейти к Главе 1');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const applyFormatToTitle = (openTag: string, closeTag: string) => {
    const input = titleInputRef.current;
    if (!input) {
      setTitle(prev => `${openTag}${prev}${closeTag}`);
      return;
    }
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const val = input.value;
    const selected = val.substring(start, end);
    if (selected) {
      const updated = val.substring(0, start) + openTag + selected + closeTag + val.substring(end);
      setTitle(updated);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start, start + openTag.length + selected.length + closeTag.length);
      }, 30);
    } else {
      const updated = val.substring(0, start) + openTag + closeTag + val.substring(start);
      setTitle(updated);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + openTag.length, start + openTag.length);
      }, 30);
    }
  };

  // Convert list or selected lines into checklist items (- [ ])
  const convertListToChecklist = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    if (start === end && selectionRangeRef.current.start !== selectionRangeRef.current.end) {
      start = selectionRangeRef.current.start;
      end = selectionRangeRef.current.end;
    }
    const fullText = textarea.value;

    let lineStart = fullText.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = fullText.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = fullText.length;

    const selectedChunk = fullText.substring(lineStart, lineEnd);
    const converted = selectedChunk
      .split('\n')
      .map(line => {
        if (!line.trim()) return line;
        const cleaned = line.replace(/^\s*(?:[-*•]|\d+\.)\s*(\[[ xX]\]\s*)?/, '').trim();
        return `- [ ] ${cleaned}`;
      })
      .join('\n');

    const updated = fullText.substring(0, lineStart) + converted + fullText.substring(lineEnd);
    setPostText(updated);

    setTimeout(() => {
      textarea.focus();
    }, 40);
  };

  // Sync state when activeRequest changes
  // Preset attachment from Gallery
  useEffect(() => {
    try {
      const presetRaw = localStorage.getItem('protalk_preset_attachment');
      if (presetRaw) {
        localStorage.removeItem('protalk_preset_attachment');
        const preset = JSON.parse(presetRaw);
        if (preset && preset.url) {
          const type = preset.type || 'photo';
          setAttachmentType(type as any);
          if (type === 'photo') setPhotoUrl(preset.url);
          else if (type === 'video') setVideoUrl(preset.url);
          else if (type === 'video_note') setVideoNoteUrl(preset.url);
          else if (type === 'audio') setAudioUrls([preset.url, '']);
          else if (type === 'document') setDocumentUrls([preset.url, '']);
          else if (type === 'album') setAlbumUrls([preset.url, '']);
        }
      }
    } catch (e) {}
  }, []);

  const lastLoadedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeRequest && lastLoadedIdRef.current !== selectedId) {
      lastLoadedIdRef.current = selectedId;
      setTopic((activeRequest.category || '').slice(0, 15));
      setTitle(activeRequest.title || '');
      setSignature(activeRequest.signature || '');
      setRequestTemplate(activeRequest.requestTemplate || '');
      setImagePrompt(activeRequest.imagePrompt || '');
      setPostText(activeRequest.postText !== undefined && activeRequest.postText !== null ? activeRequest.postText : '');
      setMessageFormat(activeRequest.messageFormat === 'rich' ? 'rich' : 'v2');
      setUppercaseHeader(activeRequest.uppercaseHeader !== false);
      setLinkPreviewEnabled(activeRequest.linkPreviewEnabled !== false);

      const mainUrl = activeRequest.attachmentUrl || '';
      const urlsArr = activeRequest.attachmentUrls && activeRequest.attachmentUrls.length > 0 
        ? activeRequest.attachmentUrls 
        : (mainUrl ? [mainUrl] : []);

      let type = activeRequest.attachmentType || 'none';
      if (type === 'none' && mainUrl) {
        type = 'photo';
      }
      if (type === 'voice') {
        type = 'audio';
        setAudioFormat('voice');
      } else if (activeRequest.audioFormat === 'voice') {
        setAudioFormat('voice');
      } else {
        setAudioFormat('audio');
      }
      setAttachmentType(type as any);

      setPhotoUrl(type === 'photo' ? mainUrl : '');
      setVideoUrl(type === 'video' ? mainUrl : '');
      setVideoNoteUrl(type === 'video_note' ? mainUrl : '');

      const initMulti = (arr: string[]) => {
        const result = [...arr];
        while (result.length < 2) result.push('');
        return result.slice(0, 10);
      };

      setAlbumUrls(type === 'album' ? initMulti(urlsArr) : ['', '']);
      setAudioUrls(type === 'audio' ? initMulti(urlsArr) : ['', '']);
      setDocumentUrls(type === 'document' ? initMulti(urlsArr) : ['', '']);
      setUniquenessMemoryCount(activeRequest.uniquenessMemoryCount || 0);

      // Multi-channels
      const initialChs = activeRequest.channels && activeRequest.channels.length > 0
        ? activeRequest.channels
        : [activeRequest.channel || (channels[0]?.username) || '@SAV_AI'];
      setSelectedChannels(initialChs);

      setInlineButtons(activeRequest.inlineButtons || []);

      if (activeRequest.triggerSchedule) {
        setTriggerEnabled(activeRequest.triggerSchedule.enabled === true);
        setTriggerFrequency(activeRequest.triggerSchedule.frequency || 'daily');
        setIntervalMinutes(activeRequest.triggerSchedule.intervalMinutes || 15);
        setIntervalHours(activeRequest.triggerSchedule.intervalHours || 2);
        setTriggerTime(activeRequest.triggerSchedule.time || '09:00');
        setExactDateTime(activeRequest.triggerSchedule.exactDateTime || '2026-12-31T18:00');
        setSelectedTimezone((activeRequest.triggerSchedule as any).timezone || currentUser?.timezone || 'Europe/Moscow');
        setSelectedDaysOfWeek((activeRequest.triggerSchedule as any).daysOfWeek || ['Пн', 'Ср', 'Пт']);
        setSelectedDayOfMonth((activeRequest.triggerSchedule as any).dayOfMonth || 1);
        setNotifyUser(activeRequest.triggerSchedule.notifyUser !== false);
      } else {
        setTriggerEnabled(false);
      }
    }
  }, [selectedId, activeRequest]);

  // Real-time auto-sync editor fields to database upon typing/changing
  const isInitialSyncRef = useRef(true);

  useEffect(() => {
    isInitialSyncRef.current = true;
  }, [selectedId]);

  useEffect(() => {
    if (isInitialSyncRef.current) {
      isInitialSyncRef.current = false;
      return;
    }

    if (!selectedId || !onSaveDayRequest) return;

    const timer = setTimeout(() => {
      const { url: activeUrl, urls: activeUrls } = getActiveAttachmentData();
      onSaveDayRequest({
        id: selectedId,
        category: topic.slice(0, 15),
        title,
        signature: '',
        requestTemplate,
        imagePrompt,
        postText,
        messageFormat,
        uppercaseHeader,
        linkPreviewEnabled,
        channel: selectedChannels[0] || '@SAV_AI',
        channels: selectedChannels,
        attachmentType,
        attachmentUrl: activeUrl,
        attachmentUrls: activeUrls,
        inlineButtons,
        uniquenessMemoryCount,
        triggerSchedule: {
          frequency: triggerFrequency,
          intervalMinutes,
          intervalHours,
          time: triggerTime,
          exactDateTime,
          timezone: selectedTimezone,
          daysOfWeek: selectedDaysOfWeek,
          dayOfMonth: selectedDayOfMonth,
          enabled: triggerEnabled,
          notifyUser
        } as any
      }).catch(() => null);
    }, 700);

    return () => clearTimeout(timer);
  }, [
    title,
    topic,
    requestTemplate,
    imagePrompt,
    postText,
    messageFormat,
    uppercaseHeader,
    linkPreviewEnabled,
    selectedChannels,
    attachmentType,
    photoUrl,
    videoUrl,
    videoNoteUrl,
    albumUrls,
    audioUrls,
    documentUrls,
    inlineButtons,
    uniquenessMemoryCount,
    triggerFrequency,
    intervalMinutes,
    intervalHours,
    triggerTime,
    exactDateTime,
    selectedTimezone,
    selectedDaysOfWeek,
    selectedDayOfMonth,
    triggerEnabled,
    notifyUser
  ]);

  // Compute character counts and limits
  const calcButtonsTextLength = () => {
    let len = 0;
    inlineButtons.forEach(row => {
      row.forEach(btn => {
        len += btn.text.length;
      });
    });
    return len;
  };

  const totalPostCharCount = postText.length + calcButtonsTextLength();

  const isMediaAttached = attachmentType !== 'none';
  const maxAllowedCharLimit = messageFormat === 'rich' 
    ? 36000 
    : (isMediaAttached ? 1024 : 4096);

  const isLimitExceeded = totalPostCharCount > maxAllowedCharLimit;

  // Toggle channel selection
  const toggleChannelSelection = (chUsername: string) => {
    setSelectedChannels(prev => {
      if (prev.includes(chUsername)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(c => c !== chUsername);
      } else {
        return [...prev, chUsername];
      }
    });
  };

  // Helper to get currently selected text or fallback
  const getSelectedText = () => {
    const textarea = textareaRef.current;
    if (!textarea) return '';
    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    if (start === end && selectionRangeRef.current.start !== selectionRangeRef.current.end) {
      start = selectionRangeRef.current.start;
      end = selectionRangeRef.current.end;
    }
    return textarea.value.substring(start, end);
  };

  // Rich insert tool for text - wraps selected text or line prefixes!
  const insertRichTag = (openTag: string, closeTag: string = '', defaultContent: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;

    // Use tracked selection if textarea lost focus on toolbar button click
    if (start === end && selectionRangeRef.current.start !== selectionRangeRef.current.end) {
      start = selectionRangeRef.current.start;
      end = selectionRangeRef.current.end;
    }

    const fullText = textarea.value;

    // Line prefix tags
    const isLinePrefixTag = ['- ', '1. ', '- [ ] ', '# ', '## ', '### ', '#### ', '> '].includes(openTag);

    if (isLinePrefixTag && (start !== end || fullText.length > 0)) {
      let lineStart = fullText.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = fullText.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = fullText.length;

      const linesChunk = fullText.substring(lineStart, lineEnd);
      const lines = linesChunk.split('\n');
      const formattedChunk = lines.map((line, idx) => {
        const prefix = openTag === '1. ' ? `${idx + 1}. ` : openTag;
        const cleanLine = line.replace(/^\s*(?:[#>]+\s*|[-*•]\s*(\[[ xX]\]\s*)?|\d+\.\s*)?/, '');
        return `${prefix}${cleanLine}`;
      }).join('\n');

      const updatedContent = fullText.substring(0, lineStart) + formattedChunk + fullText.substring(lineEnd);
      setPostText(updatedContent);

      const newEnd = lineStart + formattedChunk.length;
      selectionRangeRef.current = { start: lineStart, end: newEnd };

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(lineStart, newEnd);
      }, 40);
      return;
    }

    // Standard inline tag wrapping
    const selection = fullText.substring(start, end);
    const contentToWrap = selection || defaultContent;
    const replacement = openTag + contentToWrap + closeTag;
    const updatedContent = fullText.substring(0, start) + replacement + fullText.substring(end);
    
    if (updatedContent.length > maxAllowedCharLimit) {
      setStatusMessage({ type: 'error', text: `Превышен лимит символов (${maxAllowedCharLimit})!` });
      return;
    }

    setPostText(updatedContent);

    const newStart = start + openTag.length;
    const newEnd = newStart + contentToWrap.length;
    const finalSelectionEnd = newEnd + closeTag.length;
    selectionRangeRef.current = { start: selection ? start : newStart, end: selection ? finalSelectionEnd : newEnd };

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(selection ? start : newStart, selection ? finalSelectionEnd : newEnd);
    }, 40);
  };

  // Open Link Modal with prefilled text and clipboard check
  const openLinkModal = async () => {
    const selected = getSelectedText();
    let clipboardUrl = '';
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('tg://'))) {
          clipboardUrl = text.trim();
        }
      }
    } catch (e) {
      // Ignore clipboard read permission errors
    }

    if (clipboardUrl) {
      const textToUse = selected || 'Ссылка';
      insertRichTag(`[${textToUse}](${clipboardUrl})`, '', '');
      return;
    }

    setLinkText(selected || '');
    setLinkUrl('');
    setActiveModal('link');
  };

  // Insert Link
  const handleInsertLink = () => {
    const mdLink = `[${linkText || 'Ссылка'}](${linkUrl || 'https://'})`;
    insertRichTag(mdLink, '', '');
    setActiveModal(null);
  };

  // Insert Media Block from modal
  const handleInsertMedia = () => {
    let generatedCode = '';
    if (modalMediaType === 'photo') {
      generatedCode = `![](${modalMediaUrls[0] || 'https://'}${modalMediaCaption ? ` "${modalMediaCaption}"` : ''})\n`;
    } else if (modalMediaType === 'video') {
      generatedCode = `<video src="${modalMediaUrls[0] || 'https://'}"></video>\n`;
    } else if (modalMediaType === 'audio') {
      generatedCode = `<audio src="${modalMediaUrls[0] || 'https://'}"></audio>\n`;
    } else if (modalMediaType === 'collage') {
      generatedCode = `<tg-collage>\n${modalMediaUrls.filter(u => u.trim()).map(u => `![](${u})`).join('\n')}\n</tg-collage>\n`;
    } else if (modalMediaType === 'slideshow') {
      generatedCode = `<tg-slideshow>\n${modalMediaUrls.filter(u => u.trim()).map(u => `![](${u})`).join('\n')}\n</tg-slideshow>\n`;
    }

    insertRichTag(generatedCode, '', '');
    setActiveModal(null);
  };

  // Dynamic Table Handlers
  const handleAddTableColumn = () => {
    const newColName = `Колонка ${tableHeaders.length + 1}`;
    setTableHeaders(prev => [...prev, newColName]);
    setTableRows(prev => prev.map(row => [...row, '']));
  };

  const handleRemoveTableColumn = (colIndex: number) => {
    if (tableHeaders.length <= 1) return;
    setTableHeaders(prev => prev.filter((_, idx) => idx !== colIndex));
    setTableRows(prev => prev.map(row => row.filter((_, idx) => idx !== colIndex)));
  };

  const handleAddTableRow = () => {
    const newRow = new Array(tableHeaders.length).fill('');
    setTableRows(prev => [...prev, newRow]);
  };

  const handleRemoveTableRow = (rowIndex: number) => {
    if (tableRows.length <= 1) return;
    setTableRows(prev => prev.filter((_, idx) => idx !== rowIndex));
  };

  // Insert Table
  const handleInsertTable = () => {
    if (tableHeaders.length === 0) return;
    let alignRow = '|';
    for (let i = 0; i < tableHeaders.length; i++) {
      alignRow += ':---|';
    }

    let tableMd = `| ${tableHeaders.join(' | ')} |\n${alignRow}\n`;
    tableRows.forEach(row => {
      tableMd += `| ${row.join(' | ')} |\n`;
    });

    insertRichTag(tableMd, '', '');
    setActiveModal(null);
  };

  // Helper function to format Telegram time preview
  const formatTelegramTime = (dateStr: string, format: string) => {
    const date = new Date(dateStr || Date.now());
    if (isNaN(date.getTime())) return 'Некорректная дата';

    if (format === 'wDT') {
      const dayName = date.toLocaleDateString('ru-RU', { weekday: 'long' });
      const formattedDate = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
      return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${formattedDate}`;
    }
    if (format === 'd') {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    if (format === 't') {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    if (format === 'R') {
      const diffMs = date.getTime() - Date.now();
      const diffMins = Math.round(diffMs / (1000 * 60));
      if (Math.abs(diffMins) < 60) {
        return diffMins > 0 ? `через ${diffMins} мин.` : `${Math.abs(diffMins)} мин. назад`;
      }
      const diffHours = Math.round(diffMins / 60);
      if (Math.abs(diffHours) < 24) {
        return diffHours > 0 ? `через ${diffHours} ч.` : `${Math.abs(diffHours)} ч. назад`;
      }
      const diffDays = Math.round(diffHours / 24);
      return diffDays > 0 ? `через ${diffDays} дн.` : `${Math.abs(diffDays)} дн. назад`;
    }
    return date.toLocaleString('ru-RU');
  };

  // Insert Emoji / Time / LaTeX
  const handleInsertEmojiTime = () => {
    let generated = '';
    if (emojiTimeTab === 'emoji') {
      // Clean emoji ID if full URL pasted
      let cleanId = emojiId.trim();
      const idMatch = cleanId.match(/id=(\d+)/) || cleanId.match(/(\d+)/);
      if (idMatch) cleanId = idMatch[1];
      generated = `![${emojiAlt || 'emoji'}](tg://emoji?id=${cleanId})`;
    } else if (emojiTimeTab === 'time') {
      const unixTime = Math.floor(new Date(timeString || Date.now()).getTime() / 1000) || Math.floor(Date.now()/1000);
      const displayLabel = formatTelegramTime(timeString, timeFormat);
      generated = `<tg-time unix="${unixTime}" format="${timeFormat}">${displayLabel}</tg-time>`;
    } else if (emojiTimeTab === 'latex') {
      generated = `$${latexFormula || 'E = mc^2'}$`;
    }

    insertRichTag(generated, '', '');
    setActiveModal(null);
  };

  // Insert Anchor
  const handleInsertAnchor = () => {
    let generated = '';
    if (anchorTab === 'create') {
      generated = `<a name="${anchorName || 'chapter-1'}"></a>\n`;
    } else {
      generated = `[${anchorLabel || 'Перейти к разделу'}](#${anchorName || 'chapter-1'})`;
    }

    insertRichTag(generated, '', '');
    setActiveModal(null);
  };

  // Handle Draft selection
  const handleSelectDraft = (draft: typeof BUILTIN_DRAFTS[0]) => {
    setSelectedDraftId(draft.id);
    setPostText(draft.content);
    if (draft.format) {
      setMessageFormat(draft.format as any);
    }
    setShowDraftsMenu(false);
    setStatusMessage({ type: 'success', text: `Шаблон «${draft.title}» применен!` });
  };

  // Inline Button Constructor logic
  const handleAddButtonRow = () => {
    setInlineButtons(prev => [...prev, [
      { id: `b_${Date.now()}`, text: 'Новая кнопка', type: 'url', url: 'https://', style: 'default' }
    ]]);
  };

  const handleAddButtonToRow = (rowIndex: number) => {
    setInlineButtons(prev => {
      const updated = [...prev];
      if (updated[rowIndex].length >= 4) {
        alert('Максимум 4 кнопки в одном ряду');
        return prev;
      }
      updated[rowIndex] = [
        ...updated[rowIndex],
        { id: `b_${Date.now()}`, text: 'Кнопка', type: 'callback', callbackData: 'action', style: 'default' }
      ];
      return updated;
    });
  };

  const handleRemoveButton = (rowIndex: number, btnIndex: number) => {
    setInlineButtons(prev => {
      const updated = prev.map((row, rIdx) => {
        if (rIdx !== rowIndex) return row;
        return row.filter((_, bIdx) => bIdx !== btnIndex);
      }).filter(row => row.length > 0);
      return updated;
    });
  };

  const handleUpdateButton = (rowIndex: number, btnIndex: number, field: keyof InlineButton, value: any) => {
    setInlineButtons(prev => {
      const updated = [...prev];
      const btn = { ...updated[rowIndex][btnIndex], [field]: value };
      updated[rowIndex][btnIndex] = btn;
      return updated;
    });
  };

  // Album URL helpers
  const handleUpdateAlbumUrl = (idx: number, val: string) => {
    setAlbumUrls(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  // AI Generation
  const handleGenerateAI = async () => {
    if (requestTemplate && requestTemplate.length > 10000) {
      setStatusMessage({ type: 'error', text: 'Промпт для ИИ не должен превышать 10 000 символов!' });
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);

    const styleObj = POST_STYLES.find(s => s.id === selectedPostStyle);

    try {
      const response = await fetch('/api/protalk/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: topic || 'SMM',
          dayOfWeek: 'Сегодня',
          requestTemplate: requestTemplate || '',
          title: title || '',
          currentText: postText || '',
          maxChars: maxCharsLimit,
          messageFormat,
          postStyle: styleObj?.title || selectedPostStyle,
          styleDesc: styleObj?.desc || '',
          uniquenessMemoryCount,
          userId: currentUser?.id,
          telegramId: telegramId || currentUser?.telegramId
        })
      });

      const data = await response.json();
      if (response.ok) {
        if (data.title) setTitle(data.title);
        if (data.content) setPostText(data.content);
        setStatusMessage({ 
          type: 'success', 
          text: `Пост успешно сгенерирован ИИ в стиле "${styleObj?.title || selectedPostStyle}"! Списано: 10 ИИрок.` 
        });
      } else {
        throw new Error(data.error || 'Ошибка генерации');
      }
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Ошибка при генерации с помощью ИИ.' });
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Image Generation
  const handleGenerateImageAI = async () => {
    if (!imagePrompt.trim()) {
      setStatusMessage({ type: 'error', text: 'Укажите промпт для генерации картинки!' });
      return;
    }

    setIsGeneratingImage(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/protalk/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePrompt: imagePrompt.trim(),
          userId: currentUser?.id,
          telegramId: telegramId || currentUser?.telegramId
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAttachmentType('photo');
        setPhotoUrl(data.imageUrl);
        setStatusMessage({
          type: 'success',
          text: `Изображение сгенерировано через ИИ и прикреплено к посту! Списано: 10 ИИрок.`
        });
      } else {
        throw new Error(data.error || 'Ошибка генерации картинки');
      }
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Ошибка при генерации картинки.' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Save Post Config to DB
  const handleSavePostConfig = async () => {
    if (!topic.trim()) {
      setStatusMessage({ type: 'error', text: 'Заполните тему поста (макс 15 символов)!' });
      return;
    }

    if (isLimitExceeded) {
      setStatusMessage({ type: 'error', text: `Превышен лимит символов поста (${totalPostCharCount}/${maxAllowedCharLimit})!` });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const { url: activeUrl, urls: activeUrls } = getActiveAttachmentData();

    try {
      await onSaveDayRequest({
        id: selectedId,
        category: topic.slice(0, 15),
        title,
        signature: '',
        requestTemplate,
        imagePrompt,
        postText,
        messageFormat,
        uppercaseHeader,
        linkPreviewEnabled,
        channel: selectedChannels[0] || '@SAV_AI',
        channels: selectedChannels,
        attachmentType,
        attachmentUrl: activeUrl,
        attachmentUrls: activeUrls,
        inlineButtons,
        uniquenessMemoryCount,
        triggerSchedule: {
          frequency: triggerFrequency,
          intervalMinutes,
          intervalHours,
          time: triggerTime,
          exactDateTime,
          timezone: selectedTimezone,
          daysOfWeek: selectedDaysOfWeek,
          dayOfMonth: selectedDayOfMonth,
          enabled: triggerEnabled,
          notifyUser
        } as any
      });
      setStatusMessage({ type: 'success', text: 'Настройки поста, кнопок и каналов сохранены в БД!' });
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Ошибка сохранения настройки поста.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Publish manually
  const handlePublishManual = async () => {
    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Заполните заголовок поста!' });
      return;
    }

    setIsPublishing(true);
    setStatusMessage(null);

    const { url: activeUrl, urls: activeUrls } = getActiveAttachmentData();
    const effectiveButtons = (messageFormat === 'v2' && attachmentType !== 'none') ? [] : inlineButtons;

    try {
      await onPublishToTelegram(title.trim(), postText, selectedId || 'req_1', {
        messageFormat,
        uppercaseHeader,
        signature: '',
        linkPreviewEnabled,
        attachmentType,
        attachmentUrl: activeUrl,
        attachmentUrls: activeUrls,
        inlineButtons: effectiveButtons,
        channels: selectedChannels
      });
      setStatusMessage({ 
        type: 'success', 
        text: `Пост отправлен в Telegram каналы: ${selectedChannels.join(', ')} (Бесплатно)!` 
      });
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Ошибка отправки в Telegram.' });
    } finally {
      setIsPublishing(false);
    }
  };

  // Test send directly to user's Telegram DM (169262990)
  const handleTestSendDM = async () => {
    setIsPublishing(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/telegram/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: telegramId || 169262990,
          title,
          content: postText,
          signature: '',
          messageFormat,
          linkPreviewEnabled,
          attachmentType,
          attachmentUrl: getActiveAttachmentData().url
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `🧪 Тестовое сообщение успешно отправлено в личку Telegram (${telegramId || 169262990}) и сохранено в истории!` });
        try {
          if (onSaveDayRequest && selectedId) {
            await onSaveDayRequest({
              id: selectedId,
              title,
              postText,
              signature: '',
              linkPreviewEnabled,
              category: topic.slice(0, 15)
            });
          }
        } catch(e) {}
      } else {
        setStatusMessage({ type: 'error', text: `Ошибка тестовой отправки: ${data.error}` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Ошибка сети: ${err.message}` });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUrlAutoShorten = async (rawUrl: string): Promise<string> => {
    if (!rawUrl || !rawUrl.trim()) return '';
    const clean = rawUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) return clean;

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean })
      });
      const data = await res.json();
      if (data.shortUrl) {
        return data.shortUrl;
      }
    } catch (e) {
      console.error('Failed auto-shortening URL:', e);
    }
    return clean;
  };

  const previewTitle = uppercaseHeader ? title.toUpperCase() : title;

  const syncAttachmentToRequest = (type: 'none' | 'photo' | 'document' | 'video' | 'audio' | 'album' | 'video_note', url: string, urlsArr?: string[]) => {
    if (onSaveDayRequest && selectedId) {
      onSaveDayRequest({
        id: selectedId,
        attachmentType: type,
        attachmentUrl: url,
        attachmentUrls: urlsArr || (url ? [url] : [])
      }).catch(e => console.error('Error auto-syncing attachment:', e));
    }
  };

  const renderMultiFileManager = (
    typeTitle: string,
    typeLabel: string,
    acceptFilter: string,
    urls: string[],
    setUrls: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const updateSlot = (idx: number, val: string) => {
      setUrls(prev => {
        const copy = [...prev];
        copy[idx] = val;
        const cleanUrls = copy.filter(u => u && u.trim());
        syncAttachmentToRequest(attachmentType, cleanUrls[0] || '', cleanUrls);
        return copy;
      });
    };

    const removeSlot = (idx: number) => {
      setUrls(prev => {
        const copy = prev.filter((_, i) => i !== idx);
        const res = copy.length > 0 ? copy : [''];
        const cleanUrls = res.filter(u => u && u.trim());
        syncAttachmentToRequest(attachmentType, cleanUrls[0] || '', cleanUrls);
        return res;
      });
    };

    const handleBatchUpload = (key: string, url: string) => {
      setUrls(prev => {
        const copy = [...prev];
        const emptyIdx = copy.findIndex(u => !u || !u.trim());
        if (emptyIdx !== -1) {
          copy[emptyIdx] = url;
        } else if (copy.length < 10) {
          copy.push(url);
        }
        const cleanUrls = copy.filter(u => u && u.trim());
        syncAttachmentToRequest(attachmentType, cleanUrls[0] || '', cleanUrls);
        return copy;
      });
    };

    const activeCount = urls.filter(u => u && u.trim()).length;

    return (
      <div className="space-y-3 pt-2 border-t border-pink-200/80">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800">{typeTitle}</span>
            <span className="text-[10px] font-mono font-extrabold bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 to-sky-100 text-pink-700 border border-pink-300 px-2 py-0.5 rounded-lg shadow-2xs">
              {activeCount} / 10 заполнено
            </span>
          </div>
          <FileUpload
            variant="button"
            buttonLabel={`Массовая загрузка (до 10)`}
            multiple={true}
            accept={acceptFilter}
            onUploaded={handleBatchUpload}
          />
        </div>

        <div className="space-y-2">
          {urls.map((url, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold text-slate-500 w-6 shrink-0 text-center">#{idx + 1}</span>
              <input
                type="url"
                value={url}
                onChange={(e) => updateSlot(idx, e.target.value)}
                placeholder={`URL ${typeLabel} #${idx + 1}`}
                className="flex-1 bg-white/90 border border-pink-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500 font-mono shadow-2xs"
              />
              <CopyButton value={url} />
              <FileUpload
                variant="compact"
                buttonLabel="Загрузить"
                accept={acceptFilter}
                onUploaded={(key, newUrl) => updateSlot(idx, newUrl)}
              />
              <button
                type="button"
                onClick={() => removeSlot(idx)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Удалить этот файл"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {urls.length < 10 && (
          <button
            type="button"
            onClick={() => setUrls(prev => [...prev, ''])}
            className="w-full py-2.5 bg-gradient-to-r from-sky-50 via-pink-50 via-orange-50 to-sky-50 hover:bg-white border border-dashed border-pink-300 hover:border-pink-400 text-pink-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Plus size={14} className="text-pink-600" />
            <span>Добавить поле для {typeLabel} (всего {urls.length}/10)</span>
          </button>
        )}
      </div>
    );
  };

  // Render Editor Column
  const renderEditorColumn = () => (
    <div className="space-y-6">
      {/* Topic, Title, Channels Section */}
      <div className="iirky-card-block rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-pink-200/80 pb-3">
          <Tag className="text-pink-500" size={16} />
          <span>Основные параметры поста</span>
        </h3>

        <div>
          {/* Topic */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                Тема для фильтра (Тег)
              </label>
              <span className={`text-[10px] font-mono ${topic.length >= 15 ? 'text-orange-500 font-bold' : 'text-slate-500'}`}>
                {topic.length}/15
              </span>
            </div>
            <div className="relative">
              <Tag size={14} className="absolute left-3 top-3 text-pink-500" />
              <input
                type="text"
                maxLength={15}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="маркетинг"
                className="w-full bg-transparent border border-pink-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 font-semibold shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* MULTI-SELECT CHANNELS CONNECTION */}
        <div className="space-y-2 pt-2 border-t border-pink-200/80">
          <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">
            Каналы публикации (Мультивыбор, необязательно):
          </label>
          <div className="flex flex-wrap gap-2">
            {/* Default Option: DM Bot */}
            <button
              type="button"
              onClick={() => {
                setSelectedChannels(prev => {
                  if (prev.includes('bot_dm')) {
                    return prev.filter(c => c !== 'bot_dm');
                  } else {
                    return ['bot_dm', ...prev];
                  }
                });
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedChannels.includes('bot_dm')
                  ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white border-white/40 shadow-xs'
                  : 'bg-transparent border-pink-200 text-slate-700 hover:bg-pink-50/50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedChannels.includes('bot_dm')}
                onChange={() => {}} 
                className="rounded border-slate-300 text-pink-500 h-3.5 w-3.5"
              />
              <span>💬 Личные сообщения (Бот Telegram)</span>
              <span className="text-[10px] font-mono opacity-90">(По умолчанию)</span>
            </button>

            {/* Personal and Team Channels List */}
            {channels.filter(ch => ch.username !== '@botmothercom' && ch.username !== 'botmothercom').map(ch => {
              const isChecked = selectedChannels.includes(ch.username);
              const isTeamChannel = (ch as any).isTeamChannel || (ch as any).is_team_channel || (ch as any).category === 'team';
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleChannelSelection(ch.username)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white border-white/40 shadow-xs'
                      : 'bg-transparent border-pink-200 text-slate-700 hover:bg-pink-50/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} 
                    className="rounded border-slate-300 text-pink-500 h-3.5 w-3.5"
                  />
                  <span>{ch.name}</span>
                  <span className="text-[10px] font-mono opacity-80">({ch.username})</span>
                  {isTeamChannel && (
                    <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      👥 Команда
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {(selectedChannels.length === 0 || selectedChannels.includes('bot_dm')) && (
            <p className="text-[11px] text-pink-600 font-medium italic">
              * Если канал не выбран, сообщение будет автоматически отправлено ботом в личные сообщения в Telegram.
            </p>
          )}
        </div>

        {/* FORMAT SWITCHER */}
        <div className="space-y-2 pt-3 border-t border-pink-200/80">
          <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">
            Режим синтаксиса Telegram (Тип отправки):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMessageFormat('v2')}
              className={`flex items-center space-x-3 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                messageFormat === 'v2'
                  ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white border-white/40 shadow-md'
                  : 'bg-transparent border-pink-200/80 text-slate-700 hover:bg-pink-50/50'
              }`}
            >
              <Code size={20} className={messageFormat === 'v2' ? 'text-white' : 'text-pink-500'} />
              <div className="text-left">
                <div className="font-bold flex items-center space-x-1.5">
                  <span>Markdown V2</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    messageFormat === 'v2' ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-700 border border-pink-200'
                  }`}>Стандартный</span>
                </div>
                <div className={`text-[10px] font-normal mt-0.5 ${messageFormat === 'v2' ? 'text-white/90' : 'text-slate-500'}`}>sendMessage с экранированием спецсимволов (\. \- \!)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMessageFormat('rich')}
              className={`flex items-center space-x-3 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                messageFormat === 'rich'
                  ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white border-white/40 shadow-md'
                  : 'bg-transparent border-pink-200/80 text-slate-700 hover:bg-pink-50/50'
              }`}
            >
              <Sparkles size={20} className={messageFormat === 'rich' ? 'text-white' : 'text-pink-500'} />
              <div className="text-left">
                <div className="font-bold flex items-center space-x-1.5">
                  <span>Markdown Rich</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    messageFormat === 'rich' ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-700 border border-pink-200'
                  }`}>InputRichMessage</span>
                </div>
                <div className={`text-[10px] font-normal mt-0.5 ${messageFormat === 'rich' ? 'text-white/90' : 'text-slate-500'}`}>Новый API Telegram (# H1, таблицы, details, без экранирования)</div>
              </div>
            </button>
          </div>
        </div>

        {/* SCHEDULED & AUTO-PUBLICATION SYSTEM */}
        <div className="space-y-3 pt-3 border-t border-pink-200/80">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center space-x-2">
              <Clock className="text-pink-500" size={16} />
              <label className="text-[11px] font-mono font-bold text-slate-800 uppercase tracking-wider">
                Автопубликация по расписанию & Отложенный постинг (Крон):
              </label>
            </div>
            
            {/* Toggle Enable */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={triggerEnabled}
                onChange={e => setTriggerEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-sky-400 peer-checked:to-pink-500"></div>
              <span className="ml-2 text-xs font-bold text-slate-700">
                {triggerEnabled ? 'Включено' : 'Выключено'}
              </span>
            </label>
          </div>

          {triggerEnabled && (
            <div className="bg-white/80 border border-pink-200/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
              {/* User Timezone Notice with Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-pink-50/70 border border-pink-200/60 p-2.5 rounded-xl">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Globe size={14} className="text-pink-500 shrink-0" />
                  <span className="font-bold">Часовой пояс:</span>
                  <select
                    value={selectedTimezone}
                    onChange={e => setSelectedTimezone(e.target.value)}
                    className="bg-white border border-pink-300 rounded-lg px-2.5 py-1 text-xs font-bold text-purple-800 focus:outline-none focus:border-pink-500 cursor-pointer shadow-2xs"
                  >
                    <option value="Europe/Moscow">Москва (UTC+3 / МСК)</option>
                    <option value="Asia/Tashkent">Ташкент (UTC+5)</option>
                    <option value="Asia/Almaty">Алматы (UTC+5)</option>
                    <option value="Asia/Dubai">Дубай (UTC+4)</option>
                    <option value="Europe/London">Лондон (UTC+0)</option>
                    <option value="America/New_York">Нью-Йорк (UTC-5)</option>
                    <option value="Asia/Tokyo">Токио (UTC+9)</option>
                    <option value="UTC">UTC (+00:00)</option>
                  </select>
                </div>
                <span className="text-[10px] text-pink-600 font-medium">
                  Учитывается при запуске крона
                </span>
              </div>

              {/* Frequency Modes */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1.5">
                  Режим повтора / отложенной публикации:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'exact_date', label: '📅 Отложенный', sub: 'Дата & Время' },
                    { id: 'daily', label: '🔄 Ежедневно', sub: 'Каждый день' },
                    { id: 'dayOfWeek', label: '📆 Еженедельно', sub: 'Дни недели & время' },
                    { id: 'monthly', label: '🗓️ Раз в месяц', sub: 'Число месяца & время' },
                    { id: 'interval_minutes', label: '⏱️ Интервал мин.', sub: 'Каждые N мин' },
                    { id: 'interval_hours', label: '⏳ Интервал час.', sub: 'Каждые N час' }
                  ].map(f => {
                    const active = triggerFrequency === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setTriggerFrequency(f.id as any)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          active
                            ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white border-white/40 shadow-xs'
                            : 'bg-transparent border-pink-200 text-slate-700 hover:bg-pink-50/50'
                        }`}
                      >
                        <div className="text-xs font-bold">{f.label}</div>
                        <div className={`text-[9px] ${active ? 'text-white/90' : 'text-slate-500'}`}>{f.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Days Selector */}
              {triggerFrequency === 'dayOfWeek' && (
                <div className="p-3 bg-pink-50/50 border border-pink-200/80 rounded-xl space-y-2">
                  <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase">
                    Выберите дни недели для публикации:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => {
                      const isSel = selectedDaysOfWeek.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setSelectedDaysOfWeek(prev => 
                              prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white border-white/40 shadow-2xs'
                              : 'bg-white text-slate-700 border-pink-200 hover:bg-pink-100/50'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Monthly Day Selector */}
              {triggerFrequency === 'monthly' && (
                <div className="p-3 bg-pink-50/50 border border-pink-200/80 rounded-xl space-y-2">
                  <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase">
                    Число месяца для публикации (1 - 31):
                  </label>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedDayOfMonth}
                      onChange={e => setSelectedDayOfMonth(Number(e.target.value))}
                      className="bg-white border border-pink-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 shadow-2xs cursor-pointer"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num}-е число месяца
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-slate-600 font-medium">Каждый месяц {selectedDayOfMonth}-го числа</span>
                  </div>
                </div>
              )}

              {/* Exact Date / Time inputs based on selected frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {triggerFrequency === 'exact_date' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase">
                      Точная дата и время публикации:
                    </label>
                    <input
                      type="datetime-local"
                      value={exactDateTime}
                      onChange={e => setExactDateTime(e.target.value)}
                      className="w-full bg-transparent border border-pink-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                )}

                {(triggerFrequency === 'daily' || triggerFrequency === 'dayOfWeek' || triggerFrequency === 'monthly') && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase">
                      Время выхода поста ({selectedTimezone}):
                    </label>
                    <input
                      type="time"
                      value={triggerTime}
                      onChange={e => setTriggerTime(e.target.value)}
                      className="w-full bg-transparent border border-pink-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                )}

                {triggerFrequency === 'interval_minutes' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase">
                      Интервал отправки (Минуты):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={intervalMinutes}
                      onChange={e => setIntervalMinutes(parseInt(e.target.value, 10) || 15)}
                      className="w-full bg-transparent border border-pink-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                )}

                {triggerFrequency === 'interval_hours' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase">
                      Интервал отправки (Часы):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={168}
                      value={intervalHours}
                      onChange={e => setIntervalHours(parseInt(e.target.value, 10) || 2)}
                      className="w-full bg-transparent border border-pink-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                )}

                {/* DM Notification Checkbox */}
                <div className="flex items-center space-x-2 pt-4">
                  <input
                    type="checkbox"
                    id="notifyUser"
                    checked={notifyUser}
                    onChange={e => setNotifyUser(e.target.checked)}
                    className="rounded border-slate-300 text-pink-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="notifyUser" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Уведомлять в ЛС боту при успешной отправке
                  </label>
                </div>
              </div>

              {/* Live Human Summary */}
              <div className="bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 border border-pink-200/80 p-2.5 rounded-xl text-xs font-medium text-slate-700 flex items-center space-x-2">
                <Sparkles size={14} className="text-pink-500 shrink-0" />
                <span>
                  <strong>Запланировано:</strong> {
                    triggerFrequency === 'exact_date'
                      ? `Отложенный пост на ${exactDateTime.replace('T', ' ')}`
                      : triggerFrequency === 'daily'
                      ? `Каждый день в ${triggerTime}`
                      : triggerFrequency === 'dayOfWeek'
                      ? `Дни (${selectedDaysOfWeek.join(', ') || 'Пн'}) в ${triggerTime}`
                      : triggerFrequency === 'monthly'
                      ? `Каждый месяц ${selectedDayOfMonth}-го числа в ${triggerTime}`
                      : triggerFrequency === 'interval_minutes'
                      ? `Каждые ${intervalMinutes} мин.`
                      : `Каждые ${intervalHours} ч.`
                  } ({selectedTimezone})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attachments Section (Markdown V2 Only) */}
      {messageFormat === 'v2' && (
        <div className="iirky-card-block rounded-2xl p-6 space-y-4">
          <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider">
            Вложения к посту (Медиафайлы для V2):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {[
              { id: 'none', label: 'Без медиа', icon: FileIcon },
              { id: 'photo', label: 'Фото', icon: ImageIcon },
              { id: 'album', label: 'Альбом (до 10)', icon: Layers },
              { id: 'video', label: 'Видео', icon: Video },
              { id: 'video_note', label: 'Кружок', icon: Film },
              { id: 'audio', label: 'Аудио (до 10)', icon: Volume2 },
              { id: 'document', label: 'Файл (до 10)', icon: Paperclip }
            ].map((type) => {
              const Icon = type.icon;
              const isSelected = attachmentType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setAttachmentType(type.id as any)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white border-white/40 shadow-xs'
                      : 'bg-transparent border-pink-200 text-slate-700 hover:bg-pink-50/50'
                  }`}
                >
                  <Icon size={16} className={isSelected ? 'text-white' : 'text-pink-500'} />
                  <span className="text-[10px] font-semibold mt-1 text-center">{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Photo Field */}
          {attachmentType === 'photo' && (
            <div className="space-y-2 pt-2 border-t border-pink-200/60">
              <div className="flex items-center justify-between text-[11px] text-slate-700 font-semibold">
                <span>URL фотографии:</span>
                <span className="text-[10px] text-slate-500 font-mono">Выгружается на file.pro-talk.ru</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://file.pro-talk.ru/tgf/... или ссылка на фото"
                  className="flex-1 bg-transparent border border-pink-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500 font-mono shadow-2xs"
                />
                <CopyButton value={photoUrl} />
                <FileUpload
                  variant="compact"
                  buttonLabel="Загрузить фото"
                  accept="image/*"
                  onUploaded={(key, url) => {
                    setPhotoUrl(url);
                    setAttachmentType('photo');
                    syncAttachmentToRequest('photo', url);
                  }}
                />
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      syncAttachmentToRequest('photo', '');
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Очистить"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Video Field */}
          {attachmentType === 'video' && (
            <div className="space-y-2 pt-2 border-t border-pink-200/60">
              <div className="flex items-center justify-between text-[11px] text-slate-700 font-semibold">
                <span>URL видеофайла (.mp4):</span>
                <span className="text-[10px] text-slate-500 font-mono">Выгружается на file.pro-talk.ru</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    syncAttachmentToRequest('video', e.target.value);
                  }}
                  placeholder="https://file.pro-talk.ru/tgf/... или ссылка на видео"
                  className="flex-1 bg-transparent border border-pink-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500 font-mono shadow-2xs"
                />
                <CopyButton value={videoUrl} />
                <FileUpload
                  variant="compact"
                  buttonLabel="Загрузить видео"
                  accept="video/*"
                  onUploaded={(key, url) => {
                    setVideoUrl(url);
                    setAttachmentType('video');
                    syncAttachmentToRequest('video', url);
                  }}
                />
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrl('');
                      syncAttachmentToRequest('video', '');
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Очистить"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Telegram Video Note Field (Кружок) */}
          {attachmentType === 'video_note' && (
            <div className="space-y-2 pt-2 border-t border-pink-200/60">
              <div className="flex items-center justify-between text-[11px] text-slate-700 font-semibold">
                <span>URL круглого видеосообщения Telegram (.mp4 1:1):</span>
                <span className="text-[10px] text-pink-700 font-mono font-bold bg-pink-100 px-2 py-0.5 rounded border border-pink-200">Telegram Video Note</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={videoNoteUrl}
                  onChange={(e) => {
                    setVideoNoteUrl(e.target.value);
                    syncAttachmentToRequest('video_note', e.target.value);
                  }}
                  placeholder="https://file.pro-talk.ru/tgf/... (квадратное короткое видео 1:1)"
                  className="flex-1 bg-transparent border border-pink-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500 font-mono shadow-2xs"
                />
                <CopyButton value={videoNoteUrl} />
                <FileUpload
                  variant="compact"
                  buttonLabel="Загрузить кружок"
                  accept="video/*"
                  onUploaded={(key, url) => {
                    setVideoNoteUrl(url);
                    setAttachmentType('video_note');
                    syncAttachmentToRequest('video_note', url);
                  }}
                />
                {videoNoteUrl && (
                  <button
                    type="button"
                    onClick={() => setVideoNoteUrl('')}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Очистить"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                💡 Круглое видеосообщение отправляется через <code className="text-pink-600 font-bold">sendVideoNote</code>. Рекомендуется использовать квадратное короткое видео (соотношение 1:1, до 1 мин).
              </p>
            </div>
          )}

          {/* Album Multi-File Manager */}
          {attachmentType === 'album' && renderMultiFileManager(
            'Альбом файлов (Фото / Видео):',
            'элемента альбома',
            'image/*,video/*',
            albumUrls,
            setAlbumUrls
          )}

          {/* Audio Multi-File or Voice Message Manager */}
          {attachmentType === 'audio' && (
            <div className="space-y-4 pt-2 border-t border-pink-200/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-bold text-slate-800">
                  Формат отправки аудио:
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsVoiceRecorderOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white text-sm font-bold shadow-2xs hover:opacity-95 transition-all cursor-pointer"
                    title="Записать голосовое сообщение с микрофона"
                  >
                    <Mic size={16} />
                    <span>Записать голос</span>
                  </button>
                </div>
              </div>

              {/* Format Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAudioFormat('audio')}
                  className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                    audioFormat === 'audio'
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white border-white/40 shadow-xs'
                      : 'bg-transparent border-pink-200 text-slate-700 hover:bg-pink-50/50'
                  }`}
                >
                  <Volume2 size={16} />
                  <span>Аудиофайл (до 10 файлов)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioFormat('voice')}
                  className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                    audioFormat === 'voice'
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white border-white/40 shadow-xs'
                      : 'bg-transparent border-pink-200 text-slate-700 hover:bg-pink-50/50'
                  }`}
                >
                  <Mic size={16} />
                  <span>Голосовое сообщение (OGG Opus)</span>
                </button>
              </div>

              {/* Voice Message View */}
              {audioFormat === 'voice' ? (
                <div className="space-y-3 p-3.5 bg-gradient-to-r from-sky-50/70 via-pink-50/70 to-orange-50/70 border border-pink-200/80 rounded-2xl">
                  <div className="flex items-center justify-between text-sm text-slate-700 font-semibold">
                    <span>Ссылка на аудиофайл для голосового:</span>
                    <span className="text-xs text-slate-500">Автоконвертация в OGG Telegram</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={audioUrls[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAudioUrls(prev => {
                          const copy = [...prev];
                          copy[0] = val;
                          return copy;
                        });
                      }}
                      placeholder="https://... ссылка на аудио или запишите голос"
                      className="flex-1 bg-white/90 border border-pink-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-pink-500 font-mono shadow-2xs"
                    />
                    <CopyButton value={audioUrls[0] || ''} />
                    <FileUpload
                      variant="compact"
                      buttonLabel="Загрузить"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                      onUploaded={(key, url) => {
                        setAudioUrls(prev => {
                          const copy = [...prev];
                          copy[0] = url;
                          return copy;
                        });
                        setAudioFormat('voice');
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setIsVoiceRecorderOpen(true)}
                      className="p-2 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white rounded-xl shadow-2xs hover:opacity-90 transition-all cursor-pointer shrink-0"
                      title="Записать голос через микрофон"
                    >
                      <Mic size={16} />
                    </button>
                    {audioUrls[0] && (
                      <button
                        type="button"
                        onClick={() => {
                          setAudioUrls(prev => {
                            const copy = [...prev];
                            copy[0] = '';
                            return copy;
                          });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Очистить"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    💡 Голосовое сообщение: аудиофайл будет автоматически сконвертирован сервером в формат OGG Opus и отправлен как настоящее голосовое сообщение Telegram.
                  </p>
                </div>
              ) : (
                /* Multi-Audio Track Manager */
                renderMultiFileManager(
                  'Аудиозаписи (до 10 файлов):',
                  'аудиофайла',
                  'audio/*,.mp3,.wav,.ogg,.m4a',
                  audioUrls,
                  setAudioUrls
                )
              )}
            </div>
          )}

          {/* Document Multi-File Manager */}
          {attachmentType === 'document' && renderMultiFileManager(
            'Документы / Файлы:',
            'файла',
            '*/*',
            documentUrls,
            setDocumentUrls
          )}
        </div>
      )}

      {/* Main Post Text Editor */}
      <div className="iirky-card-block rounded-2xl p-6 space-y-4">
        {/* Template selector dropdown */}
        <div className="relative">
          <div className="flex items-center justify-between bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 p-3 rounded-xl border border-pink-300 shadow-2xs">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-pink-600" />
              <span className="text-xs font-bold text-slate-800">Выбор готового шаблона:</span>
              <span className="text-xs text-pink-700 font-extrabold bg-white/80 px-2.5 py-0.5 rounded-lg border border-pink-300 shadow-2xs">
                {BUILTIN_DRAFTS.find(d => d.id === selectedDraftId)?.title || 'Выберите шаблон'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDraftsMenu(!showDraftsMenu)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-2xs transition-all"
            >
              <span>Все шаблоны</span>
              <ChevronDown size={14} className={`transition-transform ${showDraftsMenu ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showDraftsMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowDraftsMenu(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-2xl shadow-xl p-3 z-30 space-y-2 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-pink-200 px-1">
                  <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                    Выберите готовый шаблон
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDraftsMenu(false)}
                    className="text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-white/60 cursor-pointer"
                    title="Закрыть"
                  >
                    <X size={14} />
                  </button>
                </div>
                {BUILTIN_DRAFTS.map(draft => (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => handleSelectDraft(draft)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedDraftId === draft.id
                        ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white border-white/40 shadow-2xs'
                        : 'bg-white/80 border-pink-200 text-slate-800 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-lg">{draft.badge}</span>
                      <div>
                        <div className="text-xs font-bold">{draft.title}</div>
                        <div className={`text-[10px] ${selectedDraftId === draft.id ? 'text-white/90' : 'text-slate-500'}`}>{draft.subtitle}</div>
                      </div>
                    </div>
                    {draft.format && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-mono font-bold ${
                        selectedDraftId === draft.id
                          ? 'bg-white/20 text-white'
                          : draft.format === 'rich' ? 'bg-pink-100 text-pink-700 border border-pink-300' : 'bg-sky-100 text-sky-700 border border-sky-300'
                      }`}>
                        {draft.format === 'rich' ? 'Rich' : 'V2'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Post Title Input (At the top of the editor) */}
        <div>
          <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Название поста / карточки (только для карточки и БД):
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите название поста..."
            className="w-full bg-transparent border border-pink-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-pink-500 shadow-2xs"
          />
        </div>

        {/* Notice Banner */}
        {messageFormat === 'v2' ? (
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-slate-800 shadow-2xs">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-pink-600 shrink-0" />
              <div className="leading-relaxed">
                <span className="font-bold text-pink-700">Режим Markdown V2: </span>
                Текст отправляется в Telegram с точным форматированием (жирный, курсив, спойлеры, ссылки).
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 p-3 rounded-xl flex items-start space-x-2.5 text-xs text-slate-800 shadow-2xs">
            <Sparkles size={16} className="text-pink-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-pink-700">Режим Telegram Rich Message: </span>
              Поддерживается объем до 32 768 символов, заголовки <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[11px] text-pink-700 border border-pink-200">#</code>, спойлеры <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[11px] text-pink-700 border border-pink-200">||</code>, таблицы, коллажи и кастомные эмодзи.
            </div>
          </div>
        )}

        {/* Toolbar Section */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-200/80 pb-2">
            <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">
              Текст публикации ({messageFormat === 'v2' ? 'Markdown V2' : 'Markdown Rich'})
            </label>

            <div className="text-[10px] font-mono text-slate-500">
              Выделенный текст оборачивается выбранным форматированием!
            </div>
          </div>

          {/* Format toolbar buttons */}
          {messageFormat === 'v2' ? (
            <div className="flex flex-wrap items-center gap-1 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 p-1.5 rounded-xl border border-pink-300 shadow-2xs">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertRichTag('*', '*')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-slate-800 font-bold text-xs cursor-pointer"
                title="Жирный (*текст*)"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertRichTag('_', '_')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-slate-800 italic text-xs cursor-pointer"
                title="Курсив (_текст_)"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertRichTag('__', '__')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-slate-800 underline text-xs cursor-pointer"
                title="Подчеркнутый (__текст__)"
              >
                <Underline size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertRichTag('~', '~')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-slate-800 line-through text-xs cursor-pointer"
                title="Зачеркнутый (~текст~)"
              >
                <Strikethrough size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertRichTag('||', '||')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-orange-600 font-bold text-xs cursor-pointer"
                title="Спойлер (||текст||)"
              >
                <EyeOff size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertRichTag('`', '`')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-pink-600 font-mono text-xs cursor-pointer"
                title="Моно код (`код`)"
              >
                <Code size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertRichTag('```\n', '\n```')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-indigo-600 font-mono font-bold text-xs cursor-pointer flex items-center space-x-0.5"
                title="Блок кода (```\nкод\n```)"
              >
                <span className="text-[10px] font-mono leading-none">&lt;/&gt;</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={openLinkModal}
                className="p-1.5 hover:bg-white/80 rounded-lg text-sky-600 text-xs cursor-pointer"
                title="Генератор гиперссылок"
              >
                <LinkIcon size={14} />
              </button>
              
              <div className="ml-auto pl-2 border-l border-pink-300">
                <FileUpload
                  variant="compact"
                  buttonLabel="Прикрепить файл"
                  onUploaded={(key, url, fileInfo) => {
                    if (fileInfo?.type.startsWith('image/')) {
                      insertRichTag(`![${fileInfo.name}](${url})`);
                    } else {
                      insertRichTag(`[${fileInfo?.name || 'Файл'}](${url})`);
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Category tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 p-1.5 rounded-xl border border-pink-300 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setRichToolbarTab('text')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    richToolbarTab === 'text'
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs'
                      : 'bg-white/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  <span className="font-serif font-black">T</span>
                  <span className="text-[10px] hidden sm:inline">Текст</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRichToolbarTab('headers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    richToolbarTab === 'headers'
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs'
                      : 'bg-white/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  <span className="font-mono font-black">H</span>
                  <span className="text-[10px] hidden sm:inline">Заголовки</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRichToolbarTab('media')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    richToolbarTab === 'media'
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs'
                      : 'bg-white/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  <ImageIcon size={14} />
                  <span className="text-[10px] hidden sm:inline">Медиа</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRichToolbarTab('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    richToolbarTab === 'table'
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs'
                      : 'bg-white/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  <TableIcon size={14} />
                  <span className="text-[10px] hidden sm:inline">Таблицы</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRichToolbarTab('emoji')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    richToolbarTab === 'emoji'
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs'
                      : 'bg-white/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  <Sparkles size={14} />
                  <span className="text-[10px] hidden sm:inline">Эмодзи/Время</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRichToolbarTab('anchors')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    richToolbarTab === 'anchors'
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs'
                      : 'bg-white/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  <LinkIcon size={14} />
                  <span className="text-[10px] hidden sm:inline">Якоря</span>
                </button>

                <button
                  type="button"
                  onClick={openLinkModal}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white transition-all cursor-pointer flex items-center space-x-1 ml-auto shadow-2xs hover:opacity-95"
                >
                  <LinkIcon size={14} />
                  <span className="text-[10px]"> Ссылка</span>
                </button>
              </div>

              {/* Sub-tools panel */}
              <div className="bg-gradient-to-r from-sky-50 via-pink-50 via-orange-50 via-pink-50 to-sky-50 p-2.5 rounded-xl border border-pink-300 flex flex-wrap items-center gap-1.5">
                {richToolbarTab === 'text' && (
                  <>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('**', '**')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-slate-800 font-bold text-xs cursor-pointer shadow-2xs" title="Жирный">B</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('*', '*')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-slate-800 italic text-xs cursor-pointer shadow-2xs" title="Курсив">I</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('<u>', '</u>')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-slate-800 underline text-xs cursor-pointer shadow-2xs" title="Подчеркнутый">U</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('~~', '~~')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-slate-800 line-through text-xs cursor-pointer shadow-2xs" title="Зачеркнутый">S</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('||', '||')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-orange-600 font-bold text-xs cursor-pointer shadow-2xs" title="Спойлер">||Спойлер||</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('`', '`')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-pink-600 font-mono text-xs cursor-pointer shadow-2xs" title="Код">`Код`</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={openLinkModal} className="px-2.5 py-1 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center space-x-1 shadow-2xs" title="Генератор гиперссылок">
                      <LinkIcon size={12} />
                      <span>Гиперссылка</span>
                    </button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('- ')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-slate-800 text-xs cursor-pointer shadow-2xs" title="Маркированный список">• Список</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('1. ')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-slate-800 text-xs cursor-pointer shadow-2xs" title="Нумерованный список">1. Нумерованный</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('- [ ] ')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-slate-800 text-xs cursor-pointer shadow-2xs" title="Чекбокс">[ ] Задача</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={convertListToChecklist} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-300 rounded-lg text-pink-700 font-bold text-xs cursor-pointer flex items-center space-x-1 shadow-2xs" title="Преобразовать весь список или выделенный текст в чекбоксы (- [ ])">
                      <Check size={12} />
                      <span>В Чекбокс-список</span>
                    </button>
                  </>
                )}

                {richToolbarTab === 'headers' && (
                  <>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('# ')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-pink-700 font-black text-xs cursor-pointer shadow-2xs">H1</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('## ')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-pink-700 font-black text-xs cursor-pointer shadow-2xs">H2</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('### ')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-pink-700 font-black text-xs cursor-pointer shadow-2xs">H3</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('#### ')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-pink-700 font-black text-xs cursor-pointer shadow-2xs">H4</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('> ')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-200 rounded-lg text-slate-800 text-xs cursor-pointer shadow-2xs">" Цитата</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertRichTag('<details open><summary>Раскрыть подробности</summary>\n\nСодержимое...\n</details>\n')} className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-pink-300 rounded-lg text-pink-800 text-xs cursor-pointer shadow-2xs font-bold">+ Details блок</button>
                  </>
                )}

                {richToolbarTab === 'media' && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveModal('media')}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                    >
                      <ImageIcon size={14} />
                      <span>Открыть Конструктор Медиа</span>
                    </button>

                    <FileUpload
                      variant="compact"
                      buttonLabel="Загрузить файл"
                      onUploaded={(key, url, fileInfo) => {
                        if (fileInfo?.type.startsWith('image/')) {
                          insertRichTag(`![${fileInfo.name}](${url})`);
                        } else {
                          insertRichTag(`[${fileInfo?.name || 'Файл'}](${url})`);
                        }
                      }}
                    />
                  </div>
                )}

                {richToolbarTab === 'table' && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('table')}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                  >
                    <TableIcon size={14} />
                    <span>Открыть Конструктор Таблиц</span>
                  </button>
                )}

                {richToolbarTab === 'emoji' && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('emoji_time')}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                  >
                    <Sparkles size={14} />
                    <span>Конструктор Эмодзи, Времени и LaTeX</span>
                  </button>
                )}

                {richToolbarTab === 'anchors' && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('anchors')}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                  >
                    <LinkIcon size={14} />
                    <span>Конструктор Якорей и Навигации</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          rows={10}
          value={postText}
          onChange={(e) => {
            setPostText(e.target.value);
            handleTextareaSelection();
          }}
          onSelect={handleTextareaSelection}
          onKeyUp={handleTextareaSelection}
          onMouseUp={handleTextareaSelection}
          placeholder="Введите текст сообщения..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed"
        />

        {/* Link Preview Control & Card */}
        <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-xl p-3.5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={linkPreviewEnabled}
                onChange={(e) => setLinkPreviewEnabled(e.target.checked)}
                className="rounded border-pink-300 text-pink-500 h-4 w-4 cursor-pointer"
              />
              <span>Предпросмотр ссылки в Telegram</span>
            </label>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
              linkPreviewEnabled 
                ? 'bg-sky-100 text-sky-800 border-sky-300' 
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}>
              {linkPreviewEnabled ? 'Включен' : 'Выключен'}
            </span>
          </div>

          {linkPreviewEnabled ? (
            extractFirstUrl(postText) ? (
              <div className="bg-white/80 border border-sky-200 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-sky-700 font-bold">
                  <span>Обнаружена ссылка для превью:</span>
                  <span className="font-mono text-slate-600">{extractFirstUrl(postText)?.domain}</span>
                </div>
                <div className="text-xs text-slate-800 font-medium truncate">
                  {extractFirstUrl(postText)?.url}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-600 leading-relaxed">
                В тексте поста пока нет ссылок. Вставьте ссылку (например, https://...), и Telegram автоматически сформирует сниппет предпросмотра при публикации.
              </div>
            )
          ) : (
            <div className="text-[11px] text-slate-600 leading-relaxed">
              Предпросмотр ссылок отключен. При отправке в Telegram сниппеты сайтов и ссылок не будут отображаться под сообщением.
            </div>
          )}
        </div>

        {/* Character Counter */}
        <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-pink-200">
          <span className="text-slate-600">Символов поста:</span>
          <span className={isLimitExceeded ? 'text-rose-600 font-bold' : 'text-slate-800 font-bold'}>
            {totalPostCharCount} / {maxAllowedCharLimit}
          </span>
        </div>
      </div>

      {/* INLINE BUTTONS CONSTRUCTOR */}
      {messageFormat === 'v2' && attachmentType !== 'none' ? (
        <div className="iirky-card-block rounded-2xl p-5 space-y-2 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <Smartphone size={16} className="text-pink-600 shrink-0" />
            <span>Инлайн-кнопки отключены для медиафайлов в Markdown V2</span>
          </div>
          <p className="text-[11px] text-slate-600">
            В Telegram прикрепленные медиафайлы (фото, видео, кружочки, аудио, документы, альбомы) в формате Markdown V2 отправляются с подписью к медиа. Кнопки в этом режиме отключены. Для использования инлайн-кнопок выберите формат <strong>Markdown Rich</strong> или переключите вложение на <strong>Без медиа</strong>.
          </p>
        </div>
      ) : (
        <div className="iirky-card-block rounded-2xl p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-pink-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Smartphone size={16} className="text-pink-600" />
                <span>Конструктор инлайн-кнопок</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Добавляйте интерактивные кнопки под сообщением</p>
            </div>

            <button
              type="button"
              onClick={handleAddButtonRow}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-2xs transition-all"
            >
              <Plus size={14} />
              <span>Ряд кнопок</span>
            </button>
          </div>

          {/* Rows of Button Builders */}
          {inlineButtons.length === 0 ? (
            <div className="text-xs text-slate-700 italic bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 p-4 rounded-xl border border-pink-300 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <span>Инлайн-кнопки по умолчанию выключены. Нажмите «Включить кнопки», чтобы добавить интерактивную клавиатуру под постом.</span>
              <button
                type="button"
                onClick={handleAddButtonRow}
                className="bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-2xs hover:opacity-95 transition-all"
              >
                Включить кнопки
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {inlineButtons.map((row, rIdx) => (
                <div key={rIdx} className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 p-4 rounded-xl border border-pink-300 space-y-3 shadow-2xs">
                  <div className="flex justify-between items-center text-xs text-slate-600 border-b border-pink-200/80 pb-2">
                    <span className="font-mono font-bold text-slate-800">Ряд #{rIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleAddButtonToRow(rIdx)}
                      className="text-pink-600 hover:text-pink-700 font-bold text-[11px] cursor-pointer"
                    >
                      + Кнопка в ряд
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {row.map((btn, bIdx) => (
                      <div key={btn.id || bIdx} className="bg-white/90 p-3 rounded-xl border border-pink-200 space-y-2 relative shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleRemoveButton(rIdx, bIdx)}
                          className="absolute right-2 top-2 text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                          title="Удалить кнопку"
                        >
                          <Trash2 size={12} />
                        </button>

                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase">Текст кнопки</label>
                          <input
                            type="text"
                            value={btn.text}
                            onChange={(e) => handleUpdateButton(rIdx, bIdx, 'text', e.target.value)}
                            className="w-full bg-transparent border border-pink-200 rounded px-2 py-1 text-xs text-slate-900 font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase">Тип</label>
                            <select
                              value={btn.type}
                              onChange={(e) => handleUpdateButton(rIdx, bIdx, 'type', e.target.value as any)}
                              className="w-full bg-transparent border border-pink-200 rounded px-2 py-1 text-[11px] text-slate-900 font-semibold"
                            >
                              <option value="url">Ссылка (URL)</option>
                              <option value="callback">Callback</option>
                              <option value="webapp">Web App</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] font-mono text-slate-500 uppercase">Цветовой стиль (Telegram Bot API)</label>
                            <select
                              value={btn.style || 'default'}
                              onChange={(e) => handleUpdateButton(rIdx, bIdx, 'style', e.target.value as any)}
                              className="w-full bg-transparent border border-pink-200 rounded px-2 py-1 text-[11px] text-slate-900 font-semibold"
                            >
                              <option value="default">default — Серая (Стандартная)</option>
                              <option value="primary">primary — Синяя (Меню / Навигация)</option>
                              <option value="success">success — Зелёная (Оплата / Действие)</option>
                              <option value="danger">danger — Красная (Удаление / Отмена)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase">Ссылка / Callback</label>
                          <input
                            type="text"
                            value={btn.url || btn.callbackData || ''}
                            onChange={(e) => handleUpdateButton(rIdx, bIdx, btn.type === 'url' || btn.type === 'webapp' ? 'url' : 'callbackData', e.target.value)}
                            className="w-full bg-transparent border border-pink-200 rounded px-2 py-1 text-[11px] text-slate-900 font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIVE BUTTONS KEYBOARD PREVIEW */}
          {inlineButtons.length > 0 && (
            <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 p-4 rounded-xl border border-pink-300 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider block">
                  👁 Живой предпросмотр клавиатуры кнопок:
                </span>
                <div className="flex items-center space-x-3 text-[10px] text-slate-600 font-mono">
                  <span className="flex items-center space-x-1"><span className="text-pink-600 font-bold">↗</span><span>Ссылка (URL)</span></span>
                  <span className="flex items-center space-x-1"><span className="text-sky-600 font-bold">⊞</span><span>Web App (Mini App)</span></span>
                  <span className="flex items-center space-x-1"><span className="text-amber-600 font-bold">⚡</span><span>Callback</span></span>
                </div>
              </div>
              <div className="space-y-2 max-w-xl mx-auto">
                {inlineButtons.map((row, rIdx) => (
                  <div key={rIdx} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                    {row.map((btn, bIdx) => {
                      const styleKey = btn.style || 'default';
                      let btnColorClasses = 'bg-[#e5e9ef] hover:bg-[#d8dfe8] text-[#1c242f] shadow-2xs border border-[#cbd3dd]';
                      if (styleKey === 'primary') {
                        btnColorClasses = 'bg-[#2481cc] hover:bg-[#1d70b3] text-white shadow-2xs border border-[#1b6ca8]';
                      } else if (styleKey === 'success') {
                        btnColorClasses = 'bg-[#2fa84f] hover:bg-[#258d41] text-white shadow-2xs border border-[#1f7836]';
                      } else if (styleKey === 'danger') {
                        btnColorClasses = 'bg-[#e53935] hover:bg-[#c62828] text-white shadow-2xs border border-[#b71c1c]';
                      }

                      const isWebApp = btn.type === 'webapp';
                      const isUrl = btn.type === 'url' || (!btn.type && Boolean(btn.url));
                      const isCallback = btn.type === 'callback';

                      return (
                        <div
                          key={btn.id || bIdx}
                          className={`px-3 py-2 rounded-xl text-xs font-bold text-center truncate cursor-pointer transition-all flex items-center justify-center space-x-1.5 ${btnColorClasses}`}
                          title={isWebApp ? `Web App: ${btn.url || 'https://...'}` : isUrl ? `Ссылка: ${btn.url || 'https://...'}` : `Callback: ${btn.callbackData || btn.text}`}
                        >
                          {isWebApp && (
                            <span className="text-xs font-bold shrink-0 opacity-90" title="Web App">⊞</span>
                          )}
                          <span className="truncate">{btn.text || 'Кнопка'}</span>
                          {isUrl && !isWebApp && (
                            <span className="text-[11px] font-bold shrink-0 opacity-80" title="Внешняя ссылка">↗</span>
                          )}
                          {isCallback && (
                            <span className="text-[10px] font-bold shrink-0 opacity-70" title="Callback действие">⚡</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Text Generation Field */}
      <div className="iirky-card-block rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-pink-200 pb-3">
          <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-pink-600" />
            Текстовое поле для генерации
          </label>
          <span className="text-[10px] font-mono text-pink-700 font-extrabold bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 px-2.5 py-1 rounded-lg border border-pink-300 shadow-2xs">Списание: 10 ИИрок</span>
        </div>

        {/* 20 Styles Selector & Max Chars Limit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-pink-50/50 p-3 rounded-xl border border-pink-200/80">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase">
              Стиль поста (20 вариантов ИИ):
            </label>
            <select
              value={selectedPostStyle}
              onChange={(e) => setSelectedPostStyle(e.target.value)}
              className="w-full bg-white border border-pink-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-pink-500 shadow-2xs cursor-pointer"
            >
              {POST_STYLES.map(style => (
                <option key={style.id} value={style.id}>
                  {style.title}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-pink-700 font-medium italic pt-0.5">
              💡 {POST_STYLES.find(s => s.id === selectedPostStyle)?.desc}
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase">
              Лимит символов ({messageFormat === 'rich' ? 'до 36 000' : '500-3600 / 4096'}):
            </label>
            <select
              value={maxCharsLimit}
              onChange={(e) => setMaxCharsLimit(Number(e.target.value))}
              className="w-full bg-white border border-pink-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-pink-500 shadow-2xs cursor-pointer"
            >
              {messageFormat === 'rich' ? (
                <>
                  <option value={1000}>Краткий (до 1000 симв.)</option>
                  <option value={4000}>Стандарт (до 4000 симв.)</option>
                  <option value={10000}>Развернутый (до 10 000 симв.)</option>
                  <option value={20000}>Лонгрид (до 20 000 симв.)</option>
                  <option value={36000}>Максимум Rich (до 36 000 симв.)</option>
                </>
              ) : (
                <>
                  <option value={500}>Короткий (до 500 симв.)</option>
                  <option value={1000}>Средний (до 1000 симв.)</option>
                  <option value={2000}>Стандарт (до 2000 симв.)</option>
                  <option value={2500}>Развернутый (до 2500 симв.)</option>
                  <option value={3600}>Максимальный (до 3600 симв.)</option>
                  <option value={4096}>Полный лимит TG (до 4096 симв.)</option>
                </>
              )}
            </select>
          </div>
        </div>

        <textarea
          rows={3}
          value={requestTemplate}
          onChange={(e) => setRequestTemplate(e.target.value)}
          placeholder="Промпт и пожелания для генерации... Если оставить всё пустым, ИИ сам сгенерирует название и пост на свободную актуальную тему (SMM / ИИ / Telegram)."
          className="w-full bg-transparent border border-pink-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-pink-500 shadow-2xs"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-slate-600 font-medium">
            * Учитывается режим {messageFormat === 'v2' ? 'Markdown V2' : 'Rich HTML'} и выбранные настройки экранирования
          </span>
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="flex items-center space-x-2 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>Сгенерировать текст поста через ИИ (10 ИИрок)</span>
          </button>
        </div>
      </div>

      {/* AI Image Prompt Field & ProTalk Generation */}
      <div className="iirky-card-block rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-pink-200 pb-3">
          <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon size={14} className="text-pink-600" />
            Промпт для генерации изображения (ИИSMM)
          </label>
          <span className="text-[10px] font-mono text-pink-700 font-extrabold bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 px-2.5 py-1 rounded-lg border border-pink-300 shadow-2xs">Списание: 10 ИИрок</span>
        </div>

        <textarea
          rows={2}
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          placeholder="Опишите желаемое изображение или введите стиль (например: Cyberpunk neon futuristic style, ultra HD)..."
          className="w-full bg-transparent border border-pink-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-pink-500 shadow-2xs"
        />

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleGenerateImageAI}
            disabled={isGeneratingImage}
            className="flex items-center space-x-2 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer"
          >
            {isGeneratingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
            <span>Сгенерировать картинку в ИИSMM (10 ИИрок)</span>
          </button>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-pink-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Button 1: Normal Gradient */}
          <button
            type="button"
            onClick={handlePublishManual}
            disabled={isPublishing}
            className="flex items-center space-x-2 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer border border-white/40"
          >
            {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            <span>Опубликовать в Telegram сейчас (Бесплатно)</span>
          </button>

          {/* Button 2: Light Gradient (Alternating) */}
          <button
            type="button"
            onClick={handleTestSendDM}
            disabled={isPublishing}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 hover:from-sky-200 hover:to-orange-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer border border-pink-300"
            title="Отправить напрямую в личку пользователю 169262990 в Telegram"
          >
            <Send size={14} className="text-pink-600" />
            <span>🧪 Тест в личку (169262990)</span>
          </button>

          {/* Button 3: Light Tone Gradient (Alternating) */}
          {onDeleteDayRequest && selectedId && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirmModal(true)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-pink-50 via-orange-50 to-pink-50 hover:bg-pink-100 text-rose-700 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs border border-rose-200"
              title="Удалить пост из БД"
            >
              <Trash2 size={16} />
              <span>Удалить пост</span>
            </button>
          )}
        </div>

        {/* Button 4: Normal Gradient (Alternating) */}
        <button
          type="button"
          onClick={() => {
            handleSavePostConfig();
            setShowSaveConfirmModal(true);
          }}
          disabled={isSaving}
          className="flex items-center space-x-2 bg-gradient-to-r from-sky-500 via-pink-500 to-orange-500 hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer border border-white/40"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>Сохранить изменения</span>
        </button>
      </div>

      {/* Status Notification - Placed under the action buttons with our platform light gradient */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl flex items-start space-x-3 text-xs font-semibold shadow-xs border transition-all ${
          statusMessage.type === 'success' 
            ? 'bg-gradient-to-r from-sky-50/95 via-pink-50/95 via-orange-50/95 via-pink-50/95 to-sky-50/95 border-pink-300 text-slate-900' 
            : 'bg-gradient-to-r from-rose-50/95 via-pink-50/95 to-orange-50/95 border-rose-300 text-rose-900'
        }`}>
          <AlertCircle size={18} className={`shrink-0 mt-0.5 ${statusMessage.type === 'success' ? 'text-pink-600' : 'text-rose-600'}`} />
          <span className="leading-relaxed">{statusMessage.text}</span>
        </div>
      )}
    </div>
  );

  // Render Telegram Live Post Preview Column (Replica of Telegram Interface)
  const renderPreviewColumn = () => (
    <div className="sticky top-6 space-y-4">
      <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-xs font-extrabold bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Предпросмотр в Telegram
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-pink-700 bg-white/80 px-2 py-0.5 rounded border border-pink-200">
            {messageFormat === 'v2' ? 'Markdown V2' : 'Markdown Rich'}
          </span>
        </div>

        {/* Telegram Replica Message Box Card - Light Gradient Aesthetic */}
        <div className="bg-gradient-to-r from-sky-50/95 via-pink-50/95 via-orange-50/95 via-pink-50/95 to-sky-50/95 border border-pink-200/90 rounded-2xl p-4 text-slate-900 shadow-sm space-y-3 font-sans relative overflow-hidden">
          {/* Telegram Header */}
          <div className="flex items-center space-x-3 border-b border-pink-200/80 pb-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 via-pink-500 to-orange-400 flex items-center justify-center font-bold text-white text-sm shadow-inner shrink-0">
              {selectedChannels.length > 0 && selectedChannels[0] !== 'bot_dm'
                ? selectedChannels[0].replace('@', '').slice(0, 2).toUpperCase()
                : 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xs text-slate-900 truncate">
                  {selectedChannels.length > 0 && selectedChannels[0] !== 'bot_dm'
                    ? (channels.find(c => c.username === selectedChannels[0])?.name || selectedChannels[0])
                    : 'SAV AI Bot'}
                </span>
                <span className="text-[10px] bg-pink-200/80 text-pink-800 px-1.5 py-0.2 rounded font-bold">
                  bot
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-mono truncate">
                {selectedChannels.length > 0 && selectedChannels[0] !== 'bot_dm' 
                  ? selectedChannels.join(', ') 
                  : 'Личные сообщения с ботом'}
              </p>
            </div>
          </div>

          {/* V2 Media Attachment preview */}
          {messageFormat === 'v2' && attachmentType !== 'none' && (
            <div className="rounded-xl overflow-hidden bg-white/80 border border-pink-200 flex items-center justify-center p-2 min-h-[140px] max-h-[420px]">
              {attachmentType === 'photo' && (
                photoUrl ? (
                  <img src={photoUrl} alt="attachment" className="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-md" />
                ) : (
                  <div className="text-xs text-slate-500 flex flex-col items-center space-y-1 py-6">
                    <ImageIcon size={24} className="text-pink-500" />
                    <span>[Фото не загружено]</span>
                  </div>
                )
              )}

              {attachmentType === 'video' && (
                videoUrl ? (
                  <video src={videoUrl} controls className="max-h-[380px] w-full object-contain rounded-lg bg-black" />
                ) : (
                  <div className="text-xs text-slate-500 flex flex-col items-center space-y-1 py-6">
                    <Video size={24} className="text-pink-500" />
                    <span>[Видео не загружено]</span>
                  </div>
                )
              )}

              {attachmentType === 'video_note' && (
                videoNoteUrl ? (
                  <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-pink-400 shadow-xl bg-black mx-auto shrink-0 my-2">
                    <video src={videoNoteUrl} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-full" />
                  </div>
                ) : (
                  <div className="text-xs text-pink-600 flex flex-col items-center space-y-1 py-6">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-pink-400 flex items-center justify-center">
                      <Film size={20} />
                    </div>
                    <span>[Кружок не загружен]</span>
                  </div>
                )
              )}

              {attachmentType === 'album' && (
                <TelegramAlbumCollage urls={albumUrls} />
              )}

              {attachmentType === 'audio' && (
                <div className="w-full flex flex-col items-center justify-center text-xs text-slate-800 space-y-2 py-4">
                  <Volume2 size={24} className="text-pink-600" />
                  <span className="font-bold">Аудиозаписи ({audioUrls.filter(u => u && u.trim()).length} шт.)</span>
                </div>
              )}

              {attachmentType === 'document' && (
                <div className="w-full flex flex-col items-center justify-center text-xs text-slate-800 space-y-1 py-4">
                  <Paperclip size={24} className="text-pink-600" />
                  <span className="font-bold">Файлы и документы ({documentUrls.filter(u => u && u.trim()).length} шт.)</span>
                </div>
              )}
            </div>
          )}

          {/* Body text rendering */}
          <div className="text-xs leading-relaxed font-sans text-slate-900 font-medium space-y-2">
            {messageFormat === 'v2' ? (
              <>
                <div className="whitespace-pre-wrap font-sans text-slate-900">
                  {renderFormattedText(postText, 'v2') || <span className="italic text-slate-500">Текст вашего сообщения появится здесь...</span>}
                </div>
                {linkPreviewEnabled && extractFirstUrl(postText) && (
                  <TelegramLinkPreviewMockup link={extractFirstUrl(postText)!} />
                )}
              </>
            ) : (
              <RichPreviewRenderer
                postText={postText}
                signature=""
                linkPreviewEnabled={linkPreviewEnabled}
                attachmentType={attachmentType}
                attachmentUrl={getActiveAttachmentData().url}
              />
            )}
          </div>

          {/* Timestamp footer with Telegram double checkmark */}
          <div className="flex justify-end items-center space-x-1 text-[10px] text-slate-500 pt-1 border-t border-pink-200/60">
            <span>{new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-pink-600 font-bold text-[11px] flex items-center">✓✓</span>
          </div>

          {/* Inline Keyboard Buttons */}
          {inlineButtons.length > 0 && !(messageFormat === 'v2' && attachmentType !== 'none') && (
            <div className="pt-2 space-y-1.5 border-t border-pink-200">
              {inlineButtons.map((row, rIdx) => (
                <div key={rIdx} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                  {row.map((btn, bIdx) => {
                    const styleKey = btn.style || 'default';
                    let btnColorClasses = 'bg-[#e5e9ef] hover:bg-[#d8dfe8] text-[#1c242f] border border-[#cbd3dd] shadow-2xs';
                    if (styleKey === 'primary') {
                      btnColorClasses = 'bg-[#2481cc] hover:bg-[#1d70b3] text-white border border-[#1b6ca8] shadow-2xs';
                    } else if (styleKey === 'success') {
                      btnColorClasses = 'bg-[#2fa84f] hover:bg-[#258d41] text-white border border-[#1f7836] shadow-2xs';
                    } else if (styleKey === 'danger') {
                      btnColorClasses = 'bg-[#e53935] hover:bg-[#c62828] text-white border border-[#b71c1c] shadow-2xs';
                    }

                    const isWebApp = btn.type === 'webapp';
                    const isUrl = btn.type === 'url' || (!btn.type && Boolean(btn.url));
                    const isCallback = btn.type === 'callback';

                    return (
                      <a
                        key={btn.id || bIdx}
                        href={btn.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-bold text-center truncate flex items-center justify-center space-x-1.5 transition-all ${btnColorClasses}`}
                        title={isWebApp ? `Web App: ${btn.url || 'https://...'}` : isUrl ? `Ссылка: ${btn.url || 'https://...'}` : `Callback: ${btn.callbackData || btn.text}`}
                      >
                        {isWebApp && (
                          <span className="text-xs font-bold shrink-0 opacity-90" title="Web App">⊞</span>
                        )}
                        <span className="truncate">{btn.text || 'Кнопка'}</span>
                        {isUrl && !isWebApp && (
                          <span className="text-[11px] font-bold shrink-0 opacity-80" title="Ссылка">↗</span>
                        )}
                        {isCallback && (
                          <span className="text-[10px] font-bold shrink-0 opacity-70" title="Callback действие">⚡</span>
                        )}
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {/* MOBILE SWITCHER TABS (< md) */}
      <div className="block md:hidden bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-xl p-1 flex">
        <button
          type="button"
          onClick={() => setMobileTab('edit')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'edit' ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-xs' : 'text-slate-700'
          }`}
        >
          <FileEdit size={14} />
          <span>Редактор</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'preview' ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-xs' : 'text-slate-700'
          }`}
        >
          <Eye size={14} />
          <span>Предпросмотр</span>
        </button>
      </div>

      {/* DESKTOP SIDE-BY-SIDE LAYOUT vs MOBILE TABBED */}
      <div className="hidden md:grid md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor (7 cols) */}
        <div className="md:col-span-7">
          {renderEditorColumn()}
        </div>

        {/* Right Column: Live Telegram Preview (5 cols) */}
        <div className="md:col-span-5">
          {renderPreviewColumn()}
        </div>
      </div>

      {/* MOBILE RENDER */}
      <div className="block md:hidden">
        {mobileTab === 'edit' ? renderEditorColumn() : renderPreviewColumn()}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: HYPERLINK GENERATOR */}
      {/* ========================================================================= */}
      {activeModal === 'link' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-pink-200 pb-3">
              <div className="flex items-center space-x-2">
                <LinkIcon size={18} className="text-pink-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Генератор гиперссылок</h3>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Текст гиперссылки</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Текст ссылки..."
                  className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-mono text-slate-600 uppercase">Адрес URL / Telegram ссылка:</label>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (navigator.clipboard && navigator.clipboard.readText) {
                          const clip = await navigator.clipboard.readText();
                          if (clip) setLinkUrl(clip.trim());
                        }
                      } catch (err) {}
                    }}
                    className="text-[10px] bg-white/90 hover:bg-white text-pink-700 font-bold px-2 py-0.5 rounded-lg border border-pink-200 flex items-center space-x-1 cursor-pointer"
                  >
                    <Clipboard size={10} />
                    <span>Вставить из буфера</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://t.me/... или tg://user?id=..."
                  className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                />
              </div>

              {/* Live Preview inside constructor modal */}
              <div className="bg-white/80 p-3 rounded-xl border border-pink-200 space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Предпросмотр ссылки:</span>
                <a href={linkUrl || '#'} target="_blank" rel="noreferrer" className="text-pink-600 underline font-bold hover:text-pink-700">
                  {linkText || 'Ссылка'}
                </a>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-white/80 text-slate-700 border border-pink-200 text-xs font-bold hover:bg-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white text-xs font-extrabold hover:opacity-95 cursor-pointer shadow-2xs"
              >
                Вставить гиперссылку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MEDIA CONSTRUCTOR (PHOTOS, VIDEO, AUDIO, COLLAGE, SLIDESHOW) */}
      {/* ========================================================================= */}
      {activeModal === 'media' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-pink-200 pb-3">
              <div className="flex items-center space-x-2">
                <ImageIcon size={18} className="text-pink-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Конструктор Медиаблоков</h3>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="text-[11px] text-slate-800 bg-white/80 border border-pink-200 p-3 rounded-xl leading-relaxed font-medium">
              В режиме <b>Markdown Rich</b> поддерживаются одиночные изображения, видеофайлы, аудиозаписи, а также мультимедийные блоки <b>&lt;tg-collage&gt;</b> (сетки фото) и <b>&lt;tg-slideshow&gt;</b> (карусель/слайды).
            </div>

            <div className="space-y-4 text-xs">
              {/* Type selection */}
              <div>
                <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1.5">Тип медиаконтента:</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'photo', label: 'Фото' },
                    { id: 'video', label: 'Видео' },
                    { id: 'audio', label: 'Аудио' },
                    { id: 'collage', label: 'Коллаж' },
                    { id: 'slideshow', label: 'Слайдер' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setModalMediaType(t.id as any)}
                      className={`p-2 rounded-xl text-center font-extrabold text-[11px] transition-all cursor-pointer ${
                        modalMediaType === t.id
                          ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs'
                          : 'bg-white/80 text-slate-700 border border-pink-200 hover:bg-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Uploader to ИИSMM */}
              <div className="pt-1">
                <FileUpload
                  variant="dropzone"
                  buttonLabel="Загрузить медиафайлы напрямую на сервер ИИSMM"
                  multiple={modalMediaType === 'collage' || modalMediaType === 'slideshow'}
                  onUploaded={(key, url) => {
                    setModalMediaUrls(prev => {
                      const copy = [...prev];
                      if (copy.length === 1 && !copy[0]) {
                        copy[0] = url;
                      } else {
                        copy.push(url);
                      }
                      return copy;
                    });
                  }}
                />
              </div>

              {/* URLs input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-mono text-slate-600 uppercase">
                    URL-ссылки на медиафайл(ы):
                  </label>
                  {(modalMediaType === 'collage' || modalMediaType === 'slideshow') && (
                    <button
                      type="button"
                      onClick={() => setModalMediaUrls(prev => [...prev, ''])}
                      className="text-pink-600 hover:text-pink-700 font-extrabold text-[10px]"
                    >
                      + Добавить ссылку
                    </button>
                  )}
                </div>

                {modalMediaUrls.map((url, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const copy = [...modalMediaUrls];
                        copy[i] = e.target.value;
                        setModalMediaUrls(copy);
                      }}
                      placeholder={`https://example.com/file_${i + 1}.jpg`}
                      className="flex-1 bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px]"
                    />
                    {modalMediaUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setModalMediaUrls(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Caption */}
              {modalMediaType === 'photo' && (
                <div>
                  <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Заголовок / Подпись к фото:</label>
                  <input
                    type="text"
                    value={modalMediaCaption}
                    onChange={(e) => setModalMediaCaption(e.target.value)}
                    placeholder="Например: Анонс обновлений"
                    className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  />
                </div>
              )}

              {/* Modal Live Preview */}
              <div className="bg-white/80 p-3 rounded-xl border border-pink-200 space-y-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">👁 Живой предпросмотр медиаблокa:</span>
                <div className="rounded-xl overflow-hidden bg-white border border-pink-200 min-h-[100px] flex items-center justify-center p-2">
                  {modalMediaType === 'photo' && (
                    <img src={modalMediaUrls[0] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'} alt="preview" className="max-h-48 w-full object-cover rounded-lg" />
                  )}
                  {modalMediaType === 'video' && (
                    <div className="text-pink-600 font-mono text-xs flex items-center space-x-2 font-bold">
                      <Video size={18} />
                      <span>[Видеофайл: {modalMediaUrls[0] || 'https://...'}]</span>
                    </div>
                  )}
                  {modalMediaType === 'audio' && (
                    <div className="text-pink-600 font-mono text-xs flex items-center space-x-2 font-bold">
                      <Volume2 size={18} />
                      <span>[Аудиозапись: {modalMediaUrls[0] || 'https://...'}]</span>
                    </div>
                  )}
                  {(modalMediaType === 'collage' || modalMediaType === 'slideshow') && (
                    <div className="w-full space-y-1">
                      <div className="text-[10px] text-pink-700 font-mono font-bold">
                        {modalMediaType === 'collage' ? '<tg-collage>' : '<tg-slideshow>'} ({modalMediaUrls.length} фото)
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {modalMediaUrls.map((u, i) => (
                          <img key={i} src={u || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'} alt="preview" className="h-20 w-full object-cover rounded" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-white/80 text-slate-700 border border-pink-200 text-xs font-bold hover:bg-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleInsertMedia}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white text-xs font-extrabold hover:opacity-95 cursor-pointer shadow-2xs"
              >
                Вставить медиа в пост
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TABLE CONSTRUCTOR */}
      {/* ========================================================================= */}
      {activeModal === 'table' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-pink-200 pb-3">
              <div className="flex items-center space-x-2">
                <TableIcon size={18} className="text-pink-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Конструктор Таблиц</h3>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="text-[11px] text-slate-800 bg-white/80 border border-pink-200 p-3 rounded-xl leading-relaxed font-medium">
              Таблицы в Telegram Rich генерируются в чистом синтаксисе Markdown с разделителями.
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Колонок (2-4):</label>
                  <select
                    value={tableCols}
                    onChange={(e) => setTableCols(Number(e.target.value))}
                    className="bg-white/90 border border-pink-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold text-xs"
                  >
                    <option value={2}>2 Колонки</option>
                    <option value={3}>3 Колонки</option>
                    <option value={4}>4 Колонки</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Управление строками:</label>
                  <button
                    type="button"
                    onClick={() => setTableRows(prev => [...prev, Array(4).fill('Новое значение')])}
                    className="px-3 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white rounded-xl text-xs font-extrabold cursor-pointer shadow-2xs hover:opacity-95"
                  >
                    + Добавить строку
                  </button>
                </div>
              </div>

              {/* Table headers inputs */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-600 uppercase">Заголовки колонок:</label>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${tableCols}, minmax(0, 1fr))` }}>
                  {tableHeaders.slice(0, tableCols).map((h, i) => (
                    <input
                      key={i}
                      type="text"
                      value={h}
                      onChange={(e) => {
                        const copy = [...tableHeaders];
                        copy[i] = e.target.value;
                        setTableHeaders(copy);
                      }}
                      className="bg-white/90 border border-pink-200 rounded-lg px-2 py-1 text-slate-900 text-[11px] font-bold"
                    />
                  ))}
                </div>
              </div>

              {/* Table rows inputs */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-600 uppercase">Строки данных:</label>
                {tableRows.map((row, rIdx) => (
                  <div key={rIdx} className="flex items-center space-x-2">
                    <div className="grid gap-2 flex-1" style={{ gridTemplateColumns: `repeat(${tableCols}, minmax(0, 1fr))` }}>
                      {row.slice(0, tableCols).map((cell, cIdx) => (
                        <input
                          key={cIdx}
                          type="text"
                          value={cell}
                          onChange={(e) => {
                            const copy = [...tableRows];
                            copy[rIdx][cIdx] = e.target.value;
                            setTableRows(copy);
                          }}
                          className="bg-white/90 border border-pink-200 rounded-lg px-2 py-1 text-slate-900 text-[11px] font-semibold"
                        />
                      ))}
                    </div>
                    {tableRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setTableRows(prev => prev.filter((_, idx) => idx !== rIdx))}
                        className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                        title="Удалить строку"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Modal Live Preview */}
              <div className="bg-white/80 p-3 rounded-xl border border-pink-200 space-y-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">👁 Предпросмотр таблицы:</span>
                <table className="w-full text-xs border-collapse border border-pink-200">
                  <thead>
                    <tr className="bg-gradient-to-r from-sky-100 to-pink-100 text-slate-900 font-extrabold">
                      {tableHeaders.slice(0, tableCols).map((h, i) => (
                        <th key={i} className="p-1.5 border border-pink-200 text-left font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-t border-pink-200 text-slate-800">
                        {row.slice(0, tableCols).map((c, cIdx) => (
                          <td key={cIdx} className="p-1.5 border border-pink-200">{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-white/80 text-slate-700 border border-pink-200 text-xs font-bold hover:bg-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white text-xs font-extrabold hover:opacity-95 cursor-pointer shadow-2xs"
              >
                Вставить таблицу в пост
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EMOJI, TIME & LATEX CONSTRUCTOR */}
      {/* ========================================================================= */}
      {activeModal === 'emoji_time' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-pink-200 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles size={18} className="text-pink-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Эмодзи, Время и LaTeX</h3>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex bg-white/80 p-1 rounded-xl border border-pink-200 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setEmojiTimeTab('emoji')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  emojiTimeTab === 'emoji' 
                    ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs' 
                    : 'text-slate-600'
                }`}
              >
                Премиум Эмодзи
              </button>
              <button
                type="button"
                onClick={() => setEmojiTimeTab('time')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  emojiTimeTab === 'time' 
                    ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs' 
                    : 'text-slate-600'
                }`}
              >
                Динамич. Время
              </button>
              <button
                type="button"
                onClick={() => setEmojiTimeTab('latex')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  emojiTimeTab === 'latex' 
                    ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs' 
                    : 'text-slate-600'
                }`}
              >
                LaTeX
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {emojiTimeTab === 'emoji' && (
                <>
                  <div className="bg-white/80 border border-pink-200 p-3.5 rounded-xl text-[11px] text-slate-800 leading-relaxed space-y-2">
                    <span className="font-extrabold text-pink-700 block">💡 Как получить Telegram Emoji ID:</span>
                    <p>1. Отправьте кастомный эмодзи или стикер боту:</p>
                    <div className="flex space-x-2 pt-0.5">
                      <a
                        href="https://t.me/IIrkiBot"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-gradient-to-r from-sky-100 to-pink-100 text-pink-700 hover:text-pink-800 rounded-lg font-mono text-[10px] font-bold flex items-center space-x-1 border border-pink-300"
                      >
                        <span>🤖 @IIrkiBot</span>
                      </a>
                      <a
                        href="https://t.me/CustomEmojiIdBot"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-gradient-to-r from-sky-100 to-pink-100 text-pink-700 hover:text-pink-800 rounded-lg font-mono text-[10px] font-bold flex items-center space-x-1 border border-pink-300"
                      >
                        <span>🤖 @CustomEmojiIdBot</span>
                      </a>
                    </div>
                    <p>2. Бот мгновенно пришлет ID эмодзи и готовый код для вставки.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">ID Telegram Custom Emoji или tg:// URL:</label>
                    <input
                      type="text"
                      value={emojiId}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val.includes('id=')) {
                          const extracted = val.split('id=')[1]?.split('&')[0];
                          if (extracted) setEmojiId(extracted);
                          else setEmojiId(val);
                        } else {
                          setEmojiId(val);
                        }
                      }}
                      placeholder="5368324170671202287"
                      className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Символ подмены (Alt):</label>
                    <input
                      type="text"
                      value={emojiAlt}
                      onChange={(e) => setEmojiAlt(e.target.value)}
                      placeholder="🔥"
                      className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 text-lg font-bold"
                    />
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-pink-200 space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Предпросмотр тега:</span>
                    <code className="text-pink-700 font-mono font-bold text-[11px] block">{`![${emojiAlt}](tg://emoji?id=${emojiId})`}</code>
                  </div>
                </>
              )}

              {emojiTimeTab === 'time' && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Дата и время публикации:</label>
                    <input
                      type="datetime-local"
                      value={timeString}
                      onChange={(e) => setTimeString(e.target.value)}
                      className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Формат отображения:</label>
                    <select
                      value={timeFormat}
                      onChange={(e) => setTimeFormat(e.target.value)}
                      className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                    >
                      <option value="wDT">Вторник, 15:00 (Полный со днем недели)</option>
                      <option value="d">22.07.2026 (Краткая дата)</option>
                      <option value="t">15:00 (Только время)</option>
                      <option value="R">Относительное время (через 2 часа)</option>
                    </select>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-pink-200">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Предпросмотр &lt;tg-time&gt;:</span>
                    <div className="text-pink-700 font-extrabold flex items-center space-x-1.5">
                      <Clock size={14} />
                      <span>{new Date(timeString || Date.now()).toLocaleString('ru-RU', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </>
              )}

              {emojiTimeTab === 'latex' && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Инженерная панель символов:</label>
                    <div className="flex flex-wrap gap-1 bg-white/80 p-2 rounded-xl border border-pink-200 mb-2">
                      {[
                        { label: 'a/b', sym: '\\frac{a}{b}' },
                        { label: '√x', sym: '\\sqrt{x}' },
                        { label: 'x²', sym: 'x^2' },
                        { label: 'xᵢ', sym: 'x_i' },
                        { label: '∫', sym: '\\int_{a}^{b}' },
                        { label: '∑', sym: '\\sum_{i=1}^{n}' },
                        { label: 'lim', sym: '\\lim_{x \\to \\infty}' },
                        { label: 'π', sym: '\\pi' },
                        { label: 'α', sym: '\\alpha' },
                        { label: 'β', sym: '\\beta' },
                        { label: '∞', sym: '\\infty' },
                        { label: '±', sym: '\\pm' },
                        { label: '≈', sym: '\\approx' },
                        { label: '≠', sym: '\\neq' },
                        { label: '≤', sym: '\\le' },
                        { label: '≥', sym: '\\ge' }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLatexFormula(prev => prev ? `${prev} ${item.sym}` : item.sym)}
                          className="px-2 py-1 bg-white border border-pink-200 hover:bg-pink-50 rounded text-pink-700 font-mono text-[11px] font-bold cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Формула LaTeX:</label>
                    <input
                      type="text"
                      value={latexFormula}
                      onChange={(e) => setLatexFormula(e.target.value)}
                      placeholder="E = mc^2"
                      className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                    />
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-pink-200">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Рендеринг формулы:</span>
                    <RenderMathPreview formula={latexFormula} />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-white/80 text-slate-700 border border-pink-200 text-xs font-bold hover:bg-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleInsertEmojiTime}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white text-xs font-extrabold hover:opacity-95 cursor-pointer shadow-2xs"
              >
                Вставить в пост
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ANCHORS & NAVIGATION CONSTRUCTOR */}
      {/* ========================================================================= */}
      {activeModal === 'anchors' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-pink-200 pb-3">
              <div className="flex items-center space-x-2">
                <LinkIcon size={18} className="text-pink-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Якоря и оглавление</h3>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex bg-white/80 p-1 rounded-xl border border-pink-200 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setAnchorTab('create')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  anchorTab === 'create' 
                    ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs' 
                    : 'text-slate-600'
                }`}
              >
                1. Создать якорь
              </button>
              <button
                type="button"
                onClick={() => setAnchorTab('link')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  anchorTab === 'link' 
                    ? 'bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white shadow-2xs' 
                    : 'text-slate-600'
                }`}
              >
                2. Ссылка на якорь
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {extractHeadingsFromPost(postText).length > 0 && (
                <div>
                  <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Связать с заголовком из поста:</label>
                  <select
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (!selectedVal) return;
                      const found = extractHeadingsFromPost(postText).find(h => h.slug === selectedVal);
                      if (found) {
                        setAnchorName(found.slug);
                        setAnchorLabel(`Перейти к: ${found.title}`);
                      }
                    }}
                    className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold"
                  >
                    <option value="">-- Выбрать заголовок в посте --</option>
                    {extractHeadingsFromPost(postText).map((h, i) => (
                      <option key={i} value={h.slug}>
                        {h.title} (#{h.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Идентификатор якоря (ID):</label>
                <input
                  type="text"
                  value={anchorName}
                  onChange={(e) => setAnchorName(e.target.value)}
                  placeholder="chapter-1"
                  className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                />
              </div>

              {anchorTab === 'link' && (
                <div>
                  <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Текст ссылки-перехода:</label>
                  <input
                    type="text"
                    value={anchorLabel}
                    onChange={(e) => setAnchorLabel(e.target.value)}
                    placeholder="Перейти к Главе 1"
                    className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  />
                </div>
              )}

              <div className="bg-white/80 p-3 rounded-xl border border-pink-200">
                <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Предпросмотр:</span>
                {anchorTab === 'create' ? (
                  <code className="text-pink-700 font-mono font-bold">{`<a name="${anchorName}"></a>`}</code>
                ) : (
                  <a href={`#${anchorName}`} className="text-pink-600 underline font-bold">
                    {anchorLabel || 'Перейти к разделу'}
                  </a>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-white/80 text-slate-700 border border-pink-200 text-xs font-bold hover:bg-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleInsertAnchor}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white text-xs font-extrabold hover:opacity-95 cursor-pointer shadow-2xs"
              >
                Вставить в пост
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CUSTOM DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-pink-200 pb-3">
              <div className="flex items-center space-x-2">
                <Trash2 size={20} className="text-pink-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Подтверждение удаления</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-800 leading-relaxed font-semibold">
              Вы действительно хотите удалить этот пост из базы данных? Это действие нельзя будет отменить.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white/80 text-slate-700 border border-pink-200 text-xs font-bold hover:bg-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteConfirmModal(false);
                  if (onDeleteDayRequest && selectedId) {
                    const idToDelete = selectedId;
                    await onDeleteDayRequest(idToDelete);
                    const remaining = dayRequests.filter(r => r.id !== idToDelete);
                    if (remaining.length > 0) {
                      setSelectedId(remaining[0].id);
                    } else {
                      setSelectedId('');
                    }
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white text-xs font-extrabold hover:opacity-95 cursor-pointer shadow-2xs"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: CUSTOM SAVE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-pink-200 pb-3">
              <div className="flex items-center space-x-2">
                <Check size={20} className="text-pink-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Успешно сохранено</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-800 leading-relaxed font-semibold">
              Изменения поста успешно сохранены в базе данных!
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white text-xs font-extrabold hover:opacity-95 cursor-pointer shadow-2xs"
              >
                Отлично
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: AI GENERATION OVERLAY (HEART ANIMATION + 0-120s TIMER) */}
      {/* ========================================================================= */}
      {(isGenerating || isGeneratingImage) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border-2 border-pink-300 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
            {/* Heart Animation Container */}
            <div className="relative flex items-center justify-center pt-2">
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-sky-300/40 via-pink-400/40 to-orange-300/40 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-white/90 border-2 border-pink-300 flex items-center justify-center shadow-lg">
                <Heart className="w-10 h-10 text-pink-500 fill-pink-500 animate-pulse drop-shadow-md" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                {isGenerating ? 'ИИ генерирует текст поста...' : 'ИИ генерирует изображение...'}
              </h3>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed max-w-xs mx-auto">
                {isGenerating 
                  ? 'Пожалуйста, подождите. Нейросеть составляет уникальный пост и проверяет форматирование.' 
                  : 'Нейросеть генерирует и оптимизирует изображение для публикации в Telegram.'}
              </p>
            </div>

            {/* Progress Bar & Live Timer */}
            <div className="space-y-2 bg-white/80 p-3.5 rounded-2xl border border-pink-200/80 shadow-2xs">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-800">
                <span className="flex items-center space-x-1">
                  <Loader2 size={12} className="animate-spin text-pink-600" />
                  <span>Обработка запроса</span>
                </span>
                <span className="text-pink-700 font-extrabold">{aiTimer} сек. / 120 сек.</span>
              </div>
              <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5 border border-pink-200">
                <div 
                  className="h-full bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, Math.max(3, (aiTimer / 120) * 100))}%` }}
                />
              </div>
            </div>

            {/* Cancel Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsGenerating(false);
                  setIsGeneratingImage(false);
                }}
                className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold hover:underline cursor-pointer"
              >
                Отменить генерацию
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DUPLICATE CENTER FLOATING STATUS NOTIFICATION */}
      {/* ========================================================================= */}
      {statusMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[90%] pointer-events-auto">
          <div className={`p-4 rounded-2xl shadow-xl border-2 flex items-center justify-between space-x-3 backdrop-blur-md ${
            statusMessage.type === 'success'
              ? 'bg-gradient-to-r from-sky-100 via-pink-100 to-orange-100 border-pink-400 text-slate-900'
              : 'bg-gradient-to-r from-rose-100 via-pink-100 to-orange-100 border-rose-400 text-slate-900'
          }`}>
            <div className="flex items-center space-x-2.5 flex-1 min-w-0">
              {statusMessage.type === 'success' ? (
                <Check size={20} className="text-pink-600 shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-rose-600 shrink-0" />
              )}
              <span className="text-xs font-bold leading-snug break-words">
                {statusMessage.text}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceRecorderOpen}
        onClose={() => setIsVoiceRecorderOpen(false)}
        onVoiceProcessed={(result) => {
          if (result && result.url) {
            setAudioUrls(prev => {
              const copy = [...prev];
              copy[0] = result.url;
              return copy;
            });
            setAudioFormat('voice');
            setAttachmentType('audio');
            setStatusMessage({
              type: 'success',
              text: 'Голосовое сообщение успешно записано, выгружено в галерею и прикреплено к посту!'
            });
          }
          setIsVoiceRecorderOpen(false);
        }}
        activeFriendName="Голосовое сообщение"
      />
    </div>
  );
}
