import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { apiRouter } from "./src/server/api";
import { DB } from "./src/server/db";
import { fetchAllBlogPostsFromSQLite, fetchBlogPostByIdFromSQLite, getSQLiteDB } from "./src/server/sqlite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Dynamic XML Sitemap for Yandex, Google & AI Crawlers
app.get("/sitemap.xml", (req, res) => {
  try {
    const posts = fetchAllBlogPostsFromSQLite();
    const host = req.headers.host || "iism.ru";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const baseUrl = `${protocol}://${host}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
    
    // Main landing and functional pages
    const staticRoutes = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/blog', priority: '0.9', changefreq: 'daily' },
      { path: '/posts', priority: '0.9', changefreq: 'daily' },
      { path: '/channels', priority: '0.9', changefreq: 'daily' },
      { path: '/templates', priority: '0.8', changefreq: 'weekly' },
      { path: '/calendar', priority: '0.8', changefreq: 'daily' },
      { path: '/history', priority: '0.8', changefreq: 'daily' },
      { path: '/gallery', priority: '0.8', changefreq: 'daily' },
      { path: '/scenarios', priority: '0.8', changefreq: 'weekly' },
      { path: '/market', priority: '0.8', changefreq: 'daily' },
      { path: '/bundles', priority: '0.8', changefreq: 'daily' },
      { path: '/social', priority: '0.8', changefreq: 'daily' },
      { path: '/ai', priority: '0.9', changefreq: 'weekly' },
      { path: '/tarif', priority: '0.8', changefreq: 'weekly' },
      { path: '/oferta', priority: '0.5', changefreq: 'monthly' }
    ];

    staticRoutes.forEach(r => {
      xml += `  <url>\n    <loc>${baseUrl}${r.path}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`;
    });

    // DB Blog posts
    posts.forEach((p: any) => {
      xml += `  <url>\n    <loc>${baseUrl}/blog/${p.id}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n`;
      if (p.image) {
        xml += `    <image:image>\n      <image:loc>${p.image.startsWith('http') ? p.image : `${baseUrl}${p.image}`}</image:loc>\n      <image:title><![CDATA[${p.title}]]></image:title>\n    </image:image>\n`;
      }
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err: any) {
    res.status(500).send('Error generating sitemap');
  }
});

// Dynamic Robots.txt for Search Engines & AI Crawlers
app.get("/robots.txt", (req, res) => {
  const host = req.headers.host || "iism.ru";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const baseUrl = `${protocol}://${host}`;

  const robots = `User-agent: *
Allow: /
Allow: /blog
Allow: /blog/*
Allow: /posts
Allow: /channels
Allow: /templates
Allow: /calendar
Allow: /history
Allow: /gallery
Allow: /scenarios
Allow: /market
Allow: /bundles
Allow: /social
Allow: /ai
Allow: /oferta
Allow: /tarif
Allow: /file/*
Disallow: /api/
Disallow: /admin
Disallow: /admin/*
Disallow: /settings
Disallow: /reset-password
Disallow: /api-keys

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Yandex
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
Host: ${host}
`;

  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(robots);
});

// Dynamic RSS Feed for News Aggregators & AI Web Crawlers
app.get("/rss.xml", (req, res) => {
  try {
    const posts = fetchAllBlogPostsFromSQLite();
    const host = req.headers.host || "iismm.ru";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const baseUrl = `${protocol}://${host}`;

    let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
    rss += `<channel>\n`;
    rss += `  <title>Блог &amp; Новости ИИSMM — Автопостинг и Нейросети</title>\n`;
    rss += `  <link>${baseUrl}/blog</link>\n`;
    rss += `  <description>Официальный блог платформы ИИSMM. Новости нейросетей, SMM-связки, Telegram API и советы по автопостингу.</description>\n`;
    rss += `  <language>ru-ru</language>\n`;

    posts.forEach((p: any) => {
      rss += `  <item>\n`;
      rss += `    <title><![CDATA[${p.title}]]></title>\n`;
      rss += `    <link>${baseUrl}/blog/${p.id}</link>\n`;
      rss += `    <guid>${baseUrl}/blog/${p.id}</guid>\n`;
      rss += `    <description><![CDATA[${p.desc || p.title}]]></description>\n`;
      rss += `    <pubDate>${new Date().toUTCString()}</pubDate>\n`;
      rss += `  </item>\n`;
    });

    rss += `</channel>\n</rss>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(rss);
  } catch (err: any) {
    res.status(500).send('Error generating RSS');
  }
});

// Register tgsmm2 API Router
app.use("/api", apiRouter);

// Short URL Redirect endpoint: /f/:shortKey
app.get("/f/:shortKey", (req, res) => {
  const rawKey = req.params.shortKey || "";
  const cleanKey = rawKey.split(".")[0];
  const file = DB.getFileByShortKey(cleanKey);
  if (file && file.fullUrl) {
    return res.redirect(302, file.fullUrl);
  }
  return res.redirect(302, `https://file.pro-talk.ru/tgf/${rawKey}`);
});

// ProTalk Pro File Proxy Endpoint: /file/:id and /file/:id/:filename
app.get(["/file/:id", "/file/:id/:filename"], async (req, res) => {
  try {
    const paramId = req.params.id || "";
    const paramFilename = req.params.filename || "";

    // 1. First check if physical file exists on disk
    const diskCandidates = [
      path.join(process.cwd(), "public", "file", paramId, paramFilename),
      path.join(process.cwd(), "public", "file", paramId, `${paramId}.png`),
      path.join(process.cwd(), "public", "file", paramId, `${paramId}.svg`),
      path.join(process.cwd(), "dist", "file", paramId, paramFilename),
      path.join(process.cwd(), "public", paramFilename || paramId),
      path.join(process.cwd(), "dist", paramFilename || paramId)
    ];

    for (const pPath of diskCandidates) {
      if (pPath && fs.existsSync(pPath) && fs.statSync(pPath).isFile()) {
        return res.sendFile(pPath);
      }
    }

    const db = await getSQLiteDB();
    let file: any = null;

    if (db) {
      if (/^\d+$/.test(paramId)) {
        try {
          const stmt = db.prepare("SELECT * FROM file_storage WHERE id = ?");
          stmt.bind([parseInt(paramId, 10)]);
          if (stmt.step()) file = stmt.getAsObject();
          stmt.free();
        } catch (e) {}
      }

      if (!file) {
        try {
          const stmt = db.prepare("SELECT * FROM file_storage WHERE file_key = ? OR slug_name = ?");
          stmt.bind([paramId, paramId]);
          if (stmt.step()) file = stmt.getAsObject();
          stmt.free();
        } catch (e) {}
      }
    }

    // Fallback to legacy files lookup
    if (!file) {
      const legacy = DB.getFileByShortKey(paramId);
      if (legacy) {
        file = {
          original_url: legacy.fullUrl,
          mime_type: legacy.mimeType || 'application/octet-stream'
        };
      }
    }

    if (!file || (!file.original_url && !file.originalUrl && !file.fullUrl)) {
      return res.status(404).send("File not found");
    }

    const targetUrl = file.original_url || file.originalUrl || file.fullUrl;

    if (targetUrl.startsWith('/')) {
      const localRelPath = path.join(process.cwd(), "public", targetUrl);
      if (fs.existsSync(localRelPath) && fs.statSync(localRelPath).isFile()) {
        return res.sendFile(localRelPath);
      }
    }

    const fileRes = await fetch(targetUrl);
    if (!fileRes.ok) {
      return res.redirect(302, targetUrl);
    }

    const contentType = fileRes.headers.get("content-type") || file.mime_type || file.mimeType || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const arrayBuffer = await fileRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("File proxy error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Ensure uploads folder exists in dist
const uploadsDir = path.join(process.cwd(), "dist", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded voice recorder files statically
app.use("/uploads", express.static(uploadsDir));

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client successfully initialized.");
  } catch (err) {
    console.error("Error setting up Gemini Client:", err);
  }
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. The app will run in demo fallback mode.");
}

// Global state / API metadata
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!API_KEY,
    time: new Date().toISOString()
  });
});

// Endpoint 1: ИИ Рерайт под авторский стиль (AI Rewrite style helper)
app.post("/api/ai/rewrite", async (req, res) => {
  const { 
    content, 
    styleUrlOrChannel, 
    originalStyleDesc,
    customTextPrompt,
    customImagePrompt,
    customVideoPrompt,
    narrativeStyle,
    textExampleRef,
    imageExampleRef,
    videoExampleRef,
    useRecentPostsChannel,
    referenceChannelSelected
  } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Не передан текст для рерайта" });
  }

  if (!ai) {
    // Demonstration content if API key is not passed
    const currentDate = new Date().toLocaleDateString();
    return res.json({
      text: `[Режим ДЕМО | Отрерайчено по референсу] Исходный текст адаптирован под стиль ${styleUrlOrChannel || referenceChannelSelected || 'автора'}:\n\n🔥 SMM инсайт! ${content.slice(0, 100)}...\n\nМы полностью переложили ваши тезисы на новый лад. Теперь публикация читается на одном дыхании!\n\n🤖 Читайте также наш телеграм по SMM!`,
      imagePrompt: customImagePrompt || `Креативное промо-изображение, иллюстрирующее стиль канала ${styleUrlOrChannel || 'автора'}`,
      videoPrompt: customVideoPrompt || `Reels/Shorts сценарий: Видео-референс адаптации этого рерайта`,
      isDemo: true
    });
  }

  try {
    let prompt = `Пожалуйста, выступи в роли профессионального копирайтера и SMM-специалиста. 
Твоя задача — переписать (сделать глубокий рерайт) следующего поста, адаптировав его под стиль автора.

Сведения об авторском стиле (источник стиля): ${styleUrlOrChannel || referenceChannelSelected || "креативный, профессиональный, вовлекающий"}`;

    if (useRecentPostsChannel && referenceChannelSelected) {
      prompt += `\nВ качестве эталона стиля используй манеру публикаций канала: ${referenceChannelSelected}.`;
      prompt += `\nОриентируйся на последние 10 постов этого канала: пиши в меру коротко, структурировано, лаконично, с умеренным использованием профессионального юмора.`;
    }

    if (narrativeStyle || textExampleRef) {
      prompt += `\n\nСоблюдай следующий стиль повествования:\n${narrativeStyle || ""}`;
      if (textExampleRef) {
        prompt += `\nВот пример/референс текста, на силу которого нужно ориентироваться:\n"""\n${textExampleRef}\n"""`;
      }
    }

    if (customTextPrompt) {
      prompt += `\n\nТакже строго следуй этой инструкции для адаптации текста:\n"${customTextPrompt}"`;
    }

    prompt += `\n\nОригинальный пост для адаптации:
"""
${content}
"""`;

    prompt += `\n\nПомимо основного текста публикации, обязательно сгенерируй:`;
    prompt += `\n1. Направление / промпт для генерации иллюстрации (изображения).`;
    if (customImagePrompt) {
      prompt += ` (Учитывай пожелание пользователя для картинки: "${customImagePrompt}")`;
    } else if (imageExampleRef) {
      prompt += ` (Учитывай референс картинки от пользователя: "${imageExampleRef}")`;
    }
    
    prompt += `\n2. Сценарий / идеи для создания вовлекающего короткого видео (Reels/Shorts).`;
    if (customVideoPrompt) {
      prompt += ` (Учитывай пожелание пользователя для видео: "${customVideoPrompt}")`;
    } else if (videoExampleRef) {
      prompt += ` (Учитывай референс видео от пользователя: "${videoExampleRef}")`;
    }

    prompt += `\n\nОтвет предоставь в структурированном виде. Текст публикации должен быть готов к копированию. Раздели блоки заголовками:
### ТЕКСТ ПУБЛИКАЦИИ
[готовый текст]

### ИИ-ИЛЛЮСТРАЦИЯ (Промпт для генератора картинок)
[описание для картинки]

### ИИ-ВИДЕОСЦЕНАРИЙ
[пошаговый сценарий]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.85,
        systemInstruction: "Ты — искусственный интеллект-копирайтер ИИSMM. Переписывай посты так, чтобы они выглядели экспертно, вовлекали читателей, имели четкую структуру с абзацами и не содержали воды."
      }
    });

    const aiText = response.text || "Не удалось получить ответ от ИИ.";
    const { text, imagePrompt, videoPrompt } = extractBlocks(aiText);

    res.json({
      text,
      imagePrompt,
      videoPrompt
    });
  } catch (err: any) {
    console.error("Rewrite error:", err);
    res.status(500).json({ error: err.message || "Ошибка генерации на сервере" });
  }
});

// Endpoint for improving text (ИИ Улучшение текстав ручном редакторе)
app.post("/api/ai/improve", async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Введите текст для улучшения" });
  }

  if (!ai) {
    return res.json({
      text: `${content}\n\n[РЕЖИМ ДЕМО | УЛУЧШЕНО ИИSMM] ✨\n🚀 Текст был сделан более динамичным, ошибки исправлены, добавлены яркие призывы к действию и эмодзи! Подпишитесь на уведомления!`,
      isDemo: true
    });
  }

  try {
    const prompt = `Пожалуйста, выступи в роли опытного SMM-редактора. Улучши следующий текст: исправь грамматические и пунктуационные ошибки, сделай стиль изложения более сочным, профессиональным, легким для чтения и вовлекающим. Раздели на абзацы и добавь уместные эмодзи на замену серым формулировкам. Сохрани оригинальный смысл и 핵심-тезисы.
   
Оригинальный пост:
"""
${content}
"""

Напиши только готовый улучшенный текст, без каких-либо комментариев или вводных слов.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        systemInstruction: "Ты — главный редактор ИИSMM. Твоя задача — доводить авторские тексты до совершенства, сохраняя их мотивы, убирая лишнюю воду и унылые формулировки."
      }
    });

    res.json({
      text: response.text || content
    });
  } catch (err: any) {
    console.error("Improvement error:", err);
    res.status(500).json({ error: err.message || "Ошибка улучшения текста на сервере" });
  }
});

function extractBlocks(aiText: string) {
  let text = aiText;
  let imagePrompt = "Минималистичное концептуальное SMM изображение";
  let videoPrompt = "Динамичное Reels видео с тезисами по теме публикации";

  const textMatch = aiText.match(/(?:### ТЕКСТ ПУБЛИКАЦИИ|### ТЕКСТ|### Основной текст)([\s\S]*?)(?:### ИИ-ИЛЛЮСТРАЦИЯ|### ИИ-ВИДЕОСЦЕНАРИЙ|$)/i);
  const imageMatch = aiText.match(/(?:### ИИ-ИЛЛЮСТРАЦИЯ|### Иллюстрация|### Изображение|### Промпт для картинки)([\s\S]*?)(?:### ИИ-ВИДЕОСЦЕНАРИЙ|$)/i);
  const videoMatch = aiText.match(/(?:### ИИ-ВИДЕОСЦЕНАРИЙ|### Видеосценарий|### Сценарий видео|### Видео)([\s\S]*?)$/i);

  if (textMatch) text = textMatch[1].trim();
  if (imageMatch) imagePrompt = imageMatch[1].trim();
  if (videoMatch) videoPrompt = videoMatch[1].trim();

  // If match failed to find sections, just return the whole text as text and clean placeholders
  if (!textMatch && !imageMatch && !videoMatch) {
    text = aiText;
  }

  return { text, imagePrompt, videoPrompt };
}

// Endpoint 2: Автопостинг/генерация постов и поиск идей в интернете (Google Grounding)
app.post("/api/ai/generate", async (req, res) => {
  const { 
    topic, 
    platform, 
    enableSearch, 
    styleDesc,
    customTextPrompt,
    customImagePrompt,
    customVideoPrompt,
    narrativeStyle,
    textExampleRef,
    imageExampleRef,
    videoExampleRef,
    useRecentPostsChannel,
    referenceChannelSelected
  } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Тема поста обязательна" });
  }

  if (!ai) {
    // Demonstration content if API key is not passed
    const currentDate = new Date().toLocaleDateString();
    return res.json({
      text: `[Режим ДЕМО | Добавьте API KEY] ИИ-Пост на тему "${topic}" для ${platform || "Telegram"}:\n\n🔥 Тренды на ${currentDate}!\n\nАвтоматизированные публикации и ИИ-ассистенты показывают высочайшую вовлекаемость во второй половине 2026года. С помощью ИИSMM мы настраиваем гибкое расписание для ваших публикаций в один клик.\n\nЧто думаете об этом тренде? Обсудим 👇`,
      imagePrompt: customImagePrompt || `Креативная футуристичная иллюстрация: ${topic}, стиль flat design, высокое разрешение`,
      videoPrompt: customVideoPrompt || `Reels сценарий на тему "${topic}": 1. Завлекающее вступление (3 сек), 2. Раскрытие сути проблемы (7 сек), 3. Призыв зарегистрироваться в ИИSMM (5 сек)`,
      sources: [
        { title: `Поиск в Google: ${topic}`, uri: `https://google.com/search?q=${encodeURIComponent(topic)}` }
      ],
      isDemo: true
    });
  }

  try {
    let prompt = `Создай вовлекающий и полезный пост для платформы "${platform || 'Telegram'}" на тему: "${topic}".
Стиль написания: ${styleDesc || 'профессиональный, захватывающий, легкий для чтения'}.`;

    if (useRecentPostsChannel && referenceChannelSelected) {
      prompt += `\nВ качестве эталона стиля используй манеры публикаций канала: ${referenceChannelSelected}.`;
      prompt += `\nОриентируйся на последние 10 постов этого канала: пиши в меру коротко, структурировано, лаконично, с умеренным использованием профессионального юмора.`;
    }

    if (narrativeStyle || textExampleRef) {
      prompt += `\n\nСоблюдай следующий стиль повествования:\n${narrativeStyle || ""}`;
      if (textExampleRef) {
        prompt += `\nВот пример/референс текста, на силу которого нужно ориентироваться:\n"""\n${textExampleRef}\n"""`;
      }
    }

    if (customTextPrompt) {
      prompt += `\n\nТакже строго следуй этой инструкции для генерации основного текста публикации:\n"${customTextPrompt}"`;
    }

    prompt += `\n\nПомимо основного текста публикации, обязательно сгенерируй:`;
    prompt += `\n1. Направление / промпт для генерации иллюстрации (изображения).`;
    if (customImagePrompt) {
      prompt += ` (Учитывай пожелание пользователя для картинки: "${customImagePrompt}")`;
    } else if (imageExampleRef) {
      prompt += ` (Учитывай референс картинки от пользователя: "${imageExampleRef}")`;
    }
    
    prompt += `\n2. Сценарий / идеи для создания вовлекающего короткого видео (Reels/Shorts).`;
    if (customVideoPrompt) {
      prompt += ` (Учитывай пожелание пользователя для видео: "${customVideoPrompt}")`;
    } else if (videoExampleRef) {
      prompt += ` (Учитывай референс видео от пользователя: "${videoExampleRef}")`;
    }

    prompt += `\n\n${enableSearch ? "Обязательно найди актуальную информацию в интернете по этой теме перед написанием, чтобы подкрепить текст реальными фактами." : ""}`;

    prompt += `\n\nОтвет предоставь в структурированном виде. Текст публикации должен быть готов к копированию. Раздели блоки заголовками:
### ТЕКСТ ПУБЛИКАЦИИ
[готовый текст]

### ИИ-ИЛЛЮСТРАЦИЯ (Промпт для генератора картинок)
[описание для картинки]

### ИИ-ВИДЕОСЦЕНАРИЙ
[пошаговый сценарий]`;

    // Configure tools if search is requested
    const tools: any[] = [];
    if (enableSearch) {
      tools.push({ googleSearch: {} });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: tools.length > 0 ? tools : undefined,
        temperature: 0.75,
        systemInstruction: "Ты — контент-завод ИИSMM. Твоя цель — писать посты с безупречной логикой, завлекающим вступлением, полезной сутью и завершающими стильными интерактивными кнопками."
      }
    });

    // Extract search grounding chunks
    const sources: Array<{ title: string; uri: string }> = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      for (const chunk of groundingChunks) {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Справочный материал",
            uri: chunk.web.uri
          });
        }
      }
    }

    const aiText = response.text || "Пост успешно пуст.";
    const { text, imagePrompt, videoPrompt } = extractBlocks(aiText);

    res.json({
      text,
      imagePrompt,
      videoPrompt,
      sources
    });
  } catch (err: any) {
    console.error("Generator error:", err);
    res.status(500).json({ error: err.message || "Ошибка генерации на сервере" });
  }
});

// Endpoint 3: Чат с ассистентом (AI Assistant Chat with custom prompt via ProTalk API with SSE Streaming support)
app.post("/api/ai/chat", async (req, res) => {
  const { prompt, history, systemInstruction } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Не передан запрос" });
  }

  const botId = process.env.PROTALK_BOT_ID || "66275";
  const botToken = process.env.PROTALK_BOT_TOKEN || "GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE";
  const apiKey = `${botId}_${botToken}`;

  console.log(`Using ProTalk AI Assistant Chat with bot_id: ${botId}`);

  try {
    // Construct chat history messages for OpenAI style API
    const messages = [];
    if (systemInstruction) {
      messages.push({
        role: "system",
        content: systemInstruction
      });
    } else {
      messages.push({
        role: "system",
        content: "Ты — профессиональный ИИ-ассистент."
      });
    }

    // Additional reinforcement: Inject the assistant's specific instructions as user-assistant
    // conversation prefix to bypass ProTalk's automated "system" message filtering
    if (systemInstruction && prompt !== "/restart") {
      messages.push({
        role: "user",
        content: `[СИСТЕМНАЯ ИНСТРУКЦИЯ ДЛЯ ИИ - УСТАНОВКА РОЛИ]:\nДействуй строго по этой роли: ${systemInstruction}`
      });
      messages.push({
        role: "assistant",
        content: "Принято! Я полностью усвоил свою роль и буду отвечать в строгом соответствии с этой инструкцией."
      });
    }

    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text
        });
      });
    }

    // Final prompt: for non-command requests, inline the role into the user prompt block
    let finalPrompt = prompt;
    if (prompt !== "/restart" && systemInstruction) {
      finalPrompt = `[Установка твоей роли: В рамках этого диалога ты — ${systemInstruction}]\n\nЗапрос пользователя: ${prompt}`;
    }

    messages.push({
      role: "user",
      content: finalPrompt
    });

    // Make the API call to ProTalk API with stream: true as requested
    const openAiResponse = await fetch("https://ai.pro-talk.ru/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "iismm_landing",
        messages: messages,
        temperature: 0.7,
        stream: true
      })
    });

    if (!openAiResponse.ok) {
      const errText = await openAiResponse.text();
      throw new Error(`ProTalk API Error (Status ${openAiResponse.status}): ${errText}`);
    }

    let accumulatedText = "";

    if (openAiResponse.body) {
      const reader = openAiResponse.body.getReader ? openAiResponse.body.getReader() : null;
      if (reader) {
        const decoder = new TextDecoder("utf-8");
        let done = false;
        let buffer = "";

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            buffer += decoder.decode(value, { stream: !done });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              if (trimmed.startsWith("data: ")) {
                const dataContent = trimmed.substring(6).trim();
                if (dataContent === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(dataContent);
                  const deltaContent = parsed.choices?.[0]?.delta?.content;
                  if (deltaContent) {
                    accumulatedText += deltaContent;
                  }
                } catch (e) {
                  // Ignore JSON fragment parsing errors
                }
              }
            }
          }
        }

        // Parse trailing text if any
        if (buffer) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith("data: ")) {
            const dataContent = trimmed.substring(6).trim();
            if (dataContent !== "[DONE]") {
              try {
                const parsed = JSON.parse(dataContent);
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  accumulatedText += deltaContent;
                }
              } catch (e) {}
            }
          }
        }
      } else {
        // Fallback for environment constraints where reader is unsupported
        const rawText = await openAiResponse.text();
        try {
          const parsed = JSON.parse(rawText);
          accumulatedText = parsed.choices?.[0]?.message?.content || "";
        } catch {
          const lines = rawText.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataContent = trimmed.substring(6).trim();
              if (dataContent === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataContent);
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) accumulatedText += deltaContent;
              } catch (e) {}
            }
          }
        }
      }
    }

    if (!accumulatedText.trim()) {
      // Direct backup request using stream: false in case stream chunk collection was altogether empty
      const directResponse = await fetch("https://ai.pro-talk.ru/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "iismm_landing",
          messages: messages,
          temperature: 0.7,
          stream: false
        })
      });
      if (directResponse.ok) {
        const directJson = await directResponse.json();
        accumulatedText = directJson.choices?.[0]?.message?.content || "";
      }
    }

    if (!accumulatedText.trim()) {
      throw new Error("Не удалось получить сгенерированный текст от ProTalk API.");
    }

    return res.json({
      text: accumulatedText
    });

  } catch (err: any) {
    console.error("ProTalk Chat error:", err);
    
    // Auto Graceful fallback to Gemini if ProTalk encounters error and Gemini is configured
    if (ai) {
      console.log("ProTalk failed, auto-falling back to Gemini model gracefully...");
      try {
        const contents: any[] = [];
        if (history && Array.isArray(history)) {
          history.forEach((msg: any) => {
            contents.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
            });
          });
        }
        contents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });

        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: contents,
          config: {
            temperature: 0.7,
            systemInstruction: systemInstruction || "Ты — профессиональный ИИ-ассистент.",
          }
        });

        return res.json({
          text: fallbackResponse.text || "Извините, я не смог сформулировать ответ."
        });
      } catch (geminiErr: any) {
        console.error("Gemini fallback also failed:", geminiErr);
      }
    }

    res.status(500).json({ 
      error: `Ошибка при обращении к ИИ ProTalk: ${err.message || "Неизвестная ошибка"}` 
    });
  }
});

// Endpoint for saving base64 voice records as webm or wav static files
app.post("/api/ai/upload-voice", async (req, res) => {
  const { audioBase64, extension } = req.body;
  if (!audioBase64) {
    return res.status(400).json({ error: "Передан пустой аудиофайл (audioBase64 is required)" });
  }

  try {
    const filename = `voice_${Date.now()}.${extension || "webm"}`;
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(audioBase64, "base64");
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;
    console.log(`[ИИSMM] Аудиофайл успешно сохранён по ссылке: ${fileUrl}`);
    res.json({ url: fileUrl });
  } catch (err: any) {
    console.error("Ошибка при сохранении аудиофайла:", err);
    res.status(500).json({ error: `Не удалось сохранить голосовое сообщение: ${err.message}` });
  }
});

// Dynamic SSR HTML SEO & GEO Meta-Tags Injector for Blog Posts (Yandex, Google, GPTBot, ClaudeBot, etc.)
app.get(["/blog/:id", "/blog"], (req, res, next) => {
  const isPostRoute = req.path.startsWith('/blog/') && req.path.length > 6;
  const postId = isPostRoute ? req.path.substring(6) : '';
  const post = postId ? fetchBlogPostByIdFromSQLite(postId) : null;

  const htmlFilePath = process.env.NODE_ENV === "production" 
    ? path.join(process.cwd(), "dist", "index.html")
    : path.join(process.cwd(), "index.html");

  if (!fs.existsSync(htmlFilePath)) {
    return next();
  }

  try {
    let html = fs.readFileSync(htmlFilePath, "utf-8");
    const host = req.headers.host || "iismm.ru";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const baseUrl = `${protocol}://${host}`;
    const currentUrl = `${baseUrl}${req.path}`;

    const title = post ? `${post.title} — Блог & Новости ИИSMM` : 'Блог & Новости ИИSMM — Автопостинг и Нейросети 2026';
    const description = post ? (post.desc || post.title) : 'Свежие статьи, кейсы и инструкции по продвижению в Telegram, автопостингу и работе с нейросетями в 2026 году.';
    const image = post?.image || `${baseUrl}/file/2/iismmlogo.png`;
    const authorName = post?.author?.name || 'Администратор ИИSMM';

    // Build Schema.org BlogPosting JSON-LD
    const jsonLd = post ? {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": currentUrl
      },
      "headline": post.title,
      "description": post.desc,
      "articleBody": (post.content || post.desc || '').replace(/<[^>]*>?/gm, ''),
      "image": [image],
      "author": {
        "@type": "Person",
        "name": authorName
      },
      "publisher": {
        "@type": "Organization",
        "name": "ИИSMM — Платформа Автопостинга",
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/file/2/iismmlogo.png`
        }
      },
      "datePublished": post.date || "2026-06-01",
      "dateModified": new Date().toISOString().split('T')[0],
      "inLanguage": "ru-RU"
    } : null;

    const seoTags = `
      <title>${title}</title>
      <meta name="description" content="${description.replace(/"/g, '&quot;')}" />
      <meta name="keywords" content="${post?.tag || 'SMM'}, автопостинг, Telegram bot, нейросети 2026, ИИSMM, маркетинг, ИИ" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="author" content="${authorName}" />

      <!-- GEO Location Tags (Yandex & Google GEO Search) -->
      <meta name="geo.region" content="RU-MOW" />
      <meta name="geo.placename" content="Москва, Россия" />
      <meta name="geo.position" content="55.7558;37.6173" />
      <meta name="ICBM" content="55.7558, 37.6173" />

      <!-- OpenGraph Meta Tags for Social & Indexing -->
      <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
      <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
      <meta property="og:image" content="${image}" />
      <meta property="og:url" content="${currentUrl}" />
      <meta property="og:type" content="${post ? 'article' : 'website'}" />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:site_name" content="ИИSMM" />

      <!-- Twitter Meta Tags -->
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
      <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
      <meta name="twitter:image" content="${image}" />

      ${jsonLd ? `<script type="application/ld+json" id="seo-jsonld-ssr">${JSON.stringify(jsonLd)}</script>` : ''}
    `;

    // Replace title tag or inject into head
    if (html.includes('<title>')) {
      html = html.replace(/<title>.*?<\/title>/s, seoTags);
    } else {
      html = html.replace('</head>', `${seoTags}\n</head>`);
    }

    // Inject semantic hidden HTML snapshot for simple crawlers & AI bots
    if (post) {
      const articleSnapshot = `
        <div id="seo-prerender-content" style="display:none" aria-hidden="true">
          <article>
            <h1>${post.title}</h1>
            <p><strong>${post.desc}</strong></p>
            <p>Автор: ${authorName} | Дата: ${post.date} | Время чтения: ${post.readTime}</p>
            <div>${(post.content || '').replace(/\n/g, '<br/>')}</div>
          </article>
        </div>
      `;
      html = html.replace('</body>', `${articleSnapshot}\n</body>`);
    }

    res.header('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    console.error('[SEO SSR Error]', err);
    next();
  }
});

// Configure Vite or Static production serving
async function bootstrap() {
  try {
    await getSQLiteDB();
    console.log("[SQLite DB] Initialized and verified on startup.");
  } catch (err) {
    console.error("[SQLite DB] Startup initialization error:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted for local UI development.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production serving static files from /dist ready.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ИИSMM server is active & listening at http://localhost:${PORT}`);
  });
}

bootstrap();
