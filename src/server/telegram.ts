import FormData from 'form-data';
import path from 'path';
import fs from 'fs';
import os from 'os';
import util from 'util';
import { execFile } from 'child_process';
import { DB, DayRequest } from './db';
import { getBotTokenFromSQLite, getSQLiteDB } from './sqlite';
import { fixUtf8Filename } from './db/filesTable';
import { InlineButton } from '../types';
import { sendV2TelegramMessage } from './telegramV2';
import { sendRichTelegramMessage, prepareRichMarkdownText } from './telegramRich';

const execFileAsync = util.promisify(execFile);

// Re-export specific sending handlers for external callers
export { sendV2TelegramMessage, sendRichTelegramMessage, prepareRichMarkdownText };

// Helper to auto-crop video to square 1:1, max 60s, H.264/AAC for Telegram Video Note
export async function convertVideoToTelegramVideoNote(inputBuffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const inputPath = path.join(tmpDir, `vn_in_${id}.bin`);
  const outputPath = path.join(tmpDir, `vn_out_${id}.mp4`);

  try {
    await fs.promises.writeFile(inputPath, inputBuffer);
    await execFileAsync('ffmpeg', [
      '-y',
      '-i', inputPath,
      '-vf', "crop='min(iw,ih)':'min(iw,ih)',scale=480:480:flags=lanczos",
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-c:a', 'aac',
      '-b:a', '64k',
      '-movflags', '+faststart',
      '-t', '60',
      outputPath
    ], { timeout: 30000 });

    if (fs.existsSync(outputPath)) {
      const outBuffer = await fs.promises.readFile(outputPath);
      return outBuffer;
    }
  } catch (err: any) {
    console.warn('[convertVideoToTelegramVideoNote] ffmpeg conversion warning, using raw video note:', err.message);
  } finally {
    try { if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath); } catch (e) {}
    try { if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath); } catch (e) {}
  }
  return inputBuffer;
}

// Helper to convert audio to OGG Opus for Telegram Voice Message
export async function convertAudioToTelegramVoice(inputBuffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const inputPath = path.join(tmpDir, `voice_in_${id}.bin`);
  const outputPath = path.join(tmpDir, `voice_out_${id}.ogg`);

  try {
    await fs.promises.writeFile(inputPath, inputBuffer);
    await execFileAsync('ffmpeg', [
      '-y',
      '-i', inputPath,
      '-c:a', 'libopus',
      '-b:a', '32k',
      '-vbr', 'on',
      outputPath
    ], { timeout: 30000 });

    if (fs.existsSync(outputPath)) {
      const outBuffer = await fs.promises.readFile(outputPath);
      return outBuffer;
    }
  } catch (err: any) {
    console.warn('[convertAudioToTelegramVoice] ffmpeg conversion warning, using raw audio:', err.message);
  } finally {
    try { if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath); } catch (e) {}
    try { if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath); } catch (e) {}
  }
  return inputBuffer;
}

export interface TelegramSendResponse {
  ok: boolean;
  messageId?: string;
  channel?: string;
  error?: string;
  simulated?: boolean;
  fallbackNotice?: string;
}

// Helper to strip HTML tags if fallback to plain text is needed
export function stripHTML(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Helper to format Markdown tables into aligned monospace blocks for Telegram
function formatMarkdownTableForTelegram(tableStr: string, isInsideBlockquote: boolean = false): string {
  const rawLines = tableStr.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const dataLines = rawLines.filter(l => !l.match(/^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)*\|?$/) && !l.match(/^:?-+:?(\s*\|\s*:?-+:?)+$/));
  if (dataLines.length === 0) return '';

  const rows: string[][] = dataLines.map(line => {
    let trimmed = line.trim();
    if (trimmed.startsWith('|') && !trimmed.startsWith('||')) trimmed = trimmed.slice(1);
    if (trimmed.endsWith('|') && !trimmed.endsWith('||')) trimmed = trimmed.slice(0, -1);
    return trimmed.split('|').map(c => c.trim());
  });

  if (rows.length === 0) return '';

  const colCount = Math.max(...rows.map(r => r.length));
  const colWidths = new Array(colCount).fill(0);

  rows.forEach(r => {
    r.forEach((c, idx) => {
      if (c.length > colWidths[idx]) colWidths[idx] = Math.min(c.length, 30);
    });
  });

  const formattedRows = rows.map((r, rowIdx) => {
    return r.map((cell, idx) => {
      const w = colWidths[idx] || 8;
      return cell.padEnd(w, ' ');
    }).join(' | ');
  });

  const formattedText = formattedRows.join('\n');
  return `<pre>${formattedText}</pre>`;
}

// Convert rich/v2 markdown text to flawless Telegram HTML
export function convertToTelegramHTML(text: string, format: string = 'v2'): string {
  if (!text) return '';

  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];
  const htmlProtected: string[] = [];

  let str = text;

  // 0a. Checkbox / Task lists (- [x] and - [ ])
  str = str.replace(/^([ \t]*)[-*+]\s+\[[xX]\]\s+/gm, '$1✅ ');
  str = str.replace(/^([ \t]*)[-*+]\s+\[\s*\]\s+/gm, '$1◻️ ');
  str = str.replace(/^([ \t]*\d+\.)\s+\[[xX]\]\s+/gm, '$1 ✅ ');
  str = str.replace(/^([ \t]*\d+\.)\s+\[\s*\]\s+/gm, '$1 ◻️ ');

  // 1. Triple backtick code blocks: ```lang\ncode\n``` or ```code```
  str = str.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const tag = lang ? `<pre><code class="language-${lang}">${escapedCode}</code></pre>` : `<pre>${escapedCode}</pre>`;
    codeBlocks.push(tag);
    return `\uE000CB${idx}\uE000`;
  });

  // 2. Single backtick inline code: `code`
  str = str.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = inlineCodes.length;
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    inlineCodes.push(`<code>${escapedCode}</code>`);
    return `\uE000IC${idx}\uE000`;
  });

  // 2b. Convert <details><summary>...</summary>...</details> to Telegram expandable blockquote
  str = str.replace(/<details(?:\s+[^>]*)?>\s*<summary(?:\s+[^>]*)?>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi, (_, summary, content) => {
    const cleanSummary = (summary || 'Подробнее').trim();
    let cleanContent = (content || '').trim();
    // Format any markdown table inside the details block so it doesn't use forbidden <pre> inside <blockquote>
    cleanContent = cleanContent.replace(/((?:(?:^|\n)\|[^\n]+\|[ \t]*){2,})/g, (tableMatch) => {
      return '\n' + formatMarkdownTableForTelegram(tableMatch, true) + '\n';
    });
    return `\n<blockquote expandable><b>${cleanSummary}</b>\n\n${cleanContent}</blockquote>\n`;
  });

  // 2b.2 Convert <details>...</details> without summary
  str = str.replace(/<details(?:\s+[^>]*)?>([\s\S]*?)<\/details>/gi, (_, content) => {
    let cleanContent = (content || '').trim();
    cleanContent = cleanContent.replace(/((?:(?:^|\n)\|[^\n]+\|[ \t]*){2,})/g, (tableMatch) => {
      return '\n' + formatMarkdownTableForTelegram(tableMatch, true) + '\n';
    });
    return `\n<blockquote expandable>${cleanContent}</blockquote>\n`;
  });

  // 2c. Convert <tg-time...>Label</tg-time> to bold readable time for Telegram
  str = str.replace(/<tg-time(?:\s+[^>]*)?>([\s\S]*?)<\/tg-time>/gi, (_, timeLabel) => {
    const label = (timeLabel || '').trim();
    return label ? `<b>${label}</b>` : '';
  });

  // 2d. Convert <cite>Author</cite> to Telegram compatible <i>— Author</i>
  str = str.replace(/<cite(?:\s+[^>]*)?>([\s\S]*?)<\/cite>/gi, '\n— <i>$1</i>');

  // 2e. Convert <tg-collage> and <tg-slideshow> to formatted media sections
  str = str.replace(/<tg-collage(?:\s+[^>]*)?>([\s\S]*?)<\/tg-collage>/gi, (_, inner) => {
    return `\n${inner.trim()}\n`;
  });
  str = str.replace(/<tg-slideshow(?:\s+[^>]*)?>([\s\S]*?)<\/tg-slideshow>/gi, (_, inner) => {
    return `\n${inner.trim()}\n`;
  });

  // 3. Protect pre-existing valid Telegram HTML tags (e.g., tg-emoji, blockquote, custom tags)
  str = str.replace(/<(blockquote(?: expandable)?|\/blockquote|tg-emoji[^>]*|\/tg-emoji|tg-spoiler|\/tg-spoiler|b|\/b|strong|\/strong|i|\/i|em|\/em|u|\/u|ins|\/ins|s|\/s|strike|\/strike|del|\/del|a\s+href="[^"]*"|\/a|code|\/code|pre|\/pre)>/gi, (match) => {
    const idx = htmlProtected.length;
    htmlProtected.push(match);
    return `\uE000HP${idx}\uE000`;
  });

  // 4. Custom Emoji tags: ![emoji](tg://emoji?id=12345) or [emoji](tg://emoji?id=12345) or <tg-emoji id="...">
  str = str.replace(/!?\[([^\]]*)\]\(tg:\/\/emoji\?id=([0-9]+)\)/gi, (_, alt, id) => {
    const idx = htmlProtected.length;
    htmlProtected.push(`<tg-emoji emoji-id="${id}">${alt || '✨'}</tg-emoji>`);
    return `\uE000HP${idx}\uE000`;
  });

  // 5. Escape HTML special characters for the rest of normal text
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 6. Markdown Tables (| col1 | col2 |)
  str = str.replace(/((?:(?:^|\n)\|[^\n]+\|[ \t]*){2,})/g, (tableMatch) => {
    return '\n' + formatMarkdownTableForTelegram(tableMatch, false) + '\n';
  });

  // 7. Markdown Blockquotes: > line (supporting multiline & expandable)
  // Expandable quote syntax: **> text or **>|| text
  str = str.replace(/(?:^|\n)\*\*>\|?\|?([\s\S]*?)(?=\n\n|$)/g, (match, content) => {
    const lines = content.split('\n').map((l: string) => l.replace(/^\s*\*\*>\s?/, '').trim()).join('\n');
    return `\n<blockquote expandable>${lines}</blockquote>\n`;
  });

  // Standard blockquote: > line
  str = str.replace(/(?:^|\n)(>[^\n]+(?:\n>[^\n]+)*)/g, (match, block) => {
    const cleaned = block.split('\n').map((l: string) => l.replace(/^>\s?/, '')).join('\n');
    return `\n<blockquote>${cleaned}</blockquote>\n`;
  });

  // 8. Headings: # H1, ## H2, ### H3, #### H4 (strictly requiring space to avoid hashtag conflict)
  str = str.replace(/^####\s+(.*$)/gim, '<b>$1</b>');
  str = str.replace(/^###\s+(.*$)/gim, '<b>$1</b>');
  str = str.replace(/^##\s+(.*$)/gim, '<b>$1</b>');
  str = str.replace(/^#\s+(.*$)/gim, '<b>$1</b>');

  // 9. Markdown Spoiler: ||spoiler text||
  str = str.replace(/\|\|([\s\S]*?)\|\|/g, '<tg-spoiler>$1</tg-spoiler>');

  // 10. Underline & Bold/Italic combinations in Markdown V2:
  // ***bold italic***
  str = str.replace(/\*\*\*([^\*]+)\*\*\*/g, '<b><i>$1</i></b>');
  // ___underline italic___
  str = str.replace(/___([^_]+)___/g, '<u><i>$1</i></u>');
  // __*bold underline*__ or *__bold underline__*
  str = str.replace(/__\*([^\*\n]+)\*__/g, '<u><b>$1</b></u>');
  str = str.replace(/\*__([^\n_]+)__\*/g, '<b><u>$1</u></b>');

  // 11. Underline: __text__ (standard Telegram MarkdownV2) or --text-- / <u>text</u>
  str = str.replace(/(?<!_)__([^_]+)__(?!_)/g, '<u>$1</u>');
  str = str.replace(/--([^\n\-]+)--/g, '<u>$1</u>');

  // 12. Strikethrough: ~text~ (standard Telegram MarkdownV2) or ~~text~~
  str = str.replace(/~~([^\n~]+)~~/g, '<s>$1</s>');
  str = str.replace(/(?<!~)\~([^~\n]+)\~(?!~)/g, '<s>$1</s>');

  // 13. Bold: *bold* or **bold**
  str = str.replace(/\*\*([^\*]+)\*\*/g, '<b>$1</b>');
  str = str.replace(/(?<!\*)\*([^\*\n]+)\*(?!\*)/g, '<b>$1</b>');

  // 14. Italic: _italic_
  str = str.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<i>$1</i>');

  // 14. Links: [text](url)
  str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('tg://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    return `<a href="${cleanUrl}">${text}</a>`;
  });

  // 15. Restore protected HTML
  str = str.replace(/\uE000HP(\d+)\uE000/g, (_, idx) => htmlProtected[Number(idx)] || '');

  // 16. Restore inline codes
  str = str.replace(/\uE000IC(\d+)\uE000/g, (_, idx) => inlineCodes[Number(idx)] || '');

  // 17. Restore code blocks
  str = str.replace(/\uE000CB(\d+)\uE000/g, (_, idx) => codeBlocks[Number(idx)] || '');

  return str.trim();
}

// Convert rich-specific text to Telegram HTML (alias / specialized helper)
export function convertRichToTelegramHTML(text: string): string {
  return convertToTelegramHTML(text, 'rich');
}

// Helper to escape MarkdownV2 special characters in user text
export function sanitizeMarkdownV2(text: string): string {
  if (!text) return '';
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// Helper to format structured MarkdownV2 posts
export function prepareTelegramMarkdownV2(title: string, content: string, signature?: string): string {
  let result = '';
  // Note: Card/post title is excluded from public output per user instructions
  if (content && content.trim()) {
    result += content.trim();
  }
  if (signature && signature.trim()) {
    result += `\n\n_${sanitizeMarkdownV2(signature.trim())}_`;
  }
  return result;
}

// Helper to detect correct file extension and MIME type from binary magic bytes
export function detectBufferMediaMeta(buffer: Buffer, originalName: string, fallbackContentType: string): {
  contentType: string;
  safeFilename: string;
  mediaType: 'photo' | 'video' | 'audio' | 'document';
} {
  const cleanName = fixUtf8Filename(originalName || 'file.bin');
  const ext = path.extname(cleanName).toLowerCase();

  let mime = fallbackContentType || 'application/octet-stream';
  let detectedExt = ext;
  let mediaType: 'photo' | 'video' | 'audio' | 'document' = 'document';

  // Check magic bytes
  if (buffer.length >= 4) {
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      mime = 'image/png';
      detectedExt = '.png';
      mediaType = 'photo';
    }
    // JPEG: FF D8 FF
    else if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      mime = 'image/jpeg';
      detectedExt = '.jpg';
      mediaType = 'photo';
    }
    // GIF: 47 49 46 38
    else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      mime = 'image/gif';
      detectedExt = '.gif';
      mediaType = 'photo';
    }
    // WEBP: RIFF....WEBP
    else if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      mime = 'image/webp';
      detectedExt = '.webp';
      mediaType = 'photo';
    }
    // MP4: ....ftyp
    else if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
      mime = 'video/mp4';
      detectedExt = '.mp4';
      mediaType = 'video';
    }
    // MP3: ID3 or FF FB / FF F3
    else if ((buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0)) {
      mime = 'audio/mpeg';
      detectedExt = '.mp3';
      mediaType = 'audio';
    }
    // OGG Opus: OggS
    else if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'OggS') {
      mime = 'audio/ogg';
      detectedExt = '.ogg';
      mediaType = 'audio';
    }
  }

  // If magic bytes didn't detect image/video/audio, check extension
  if (mediaType === 'document') {
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      mediaType = 'photo';
      mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
    } else if (['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(ext)) {
      mediaType = 'video';
      mime = ext === '.webm' ? 'video/webm' : 'video/mp4';
    } else if (['.mp3', '.ogg', '.wav', '.m4a', '.aac', '.flac'].includes(ext)) {
      mediaType = 'audio';
      mime = ext === '.ogg' ? 'audio/ogg' : ext === '.wav' ? 'audio/wav' : 'audio/mpeg';
    }
  }

  // Ensure safe filename with extension
  let baseName = path.basename(cleanName, ext);
  if (!baseName || baseName === '.' || baseName.trim() === '') {
    baseName = `file_${Date.now()}`;
  }
  const finalExt = ext || detectedExt || '.bin';
  const safeFilename = `${baseName}${finalExt}`;

  return {
    contentType: mime,
    safeFilename,
    mediaType
  };
}

// Convert Russian / Cyrillic filenames to clean ASCII for multipart headers
export function toSafeFilename(name: string): string {
  if (!name) return 'file.bin';
  const ext = path.extname(name);
  const base = path.basename(name, ext);

  const ruMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya'
  };

  let transliterated = '';
  for (const char of base.toLowerCase()) {
    transliterated += ruMap[char] !== undefined ? ruMap[char] : char;
  }

  const safe = transliterated.replace(/[^a-zA-Z0-9_\-\.]/g, '_').replace(/_+/g, '_');
  return `${safe || 'file'}${ext}`;
}

// Helper to fetch media from URL, /file/:key, /api/uploads/:id, or local disk
export async function fetchMediaBuffer(urlStr: string): Promise<{
  buffer: Buffer;
  filename: string;
  contentType: string;
  mediaType: 'photo' | 'video' | 'audio' | 'document';
} | null> {
  if (!urlStr || typeof urlStr !== 'string') return null;

  try {
    let cleanUrl = urlStr.trim();
    let fallbackName = '';
    let fallbackContentType = '';

    // Handle Data URL (e.g. data:image/png;base64,...)
    if (cleanUrl.startsWith('data:')) {
      const match = cleanUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const detected = detectBufferMediaMeta(buffer, 'upload.bin', mime);
        return {
          buffer,
          filename: detected.safeFilename,
          contentType: detected.contentType,
          mediaType: detected.mediaType
        };
      }
    }

    // Handle internal file storage shortlinks
    const fileKeyMatch = cleanUrl.match(/(?:\/|^)(?:file|f)\/([a-zA-Z0-9_-]+)/i);
    const apiUploadsMatch = cleanUrl.match(/(?:\/|^)api\/uploads\/([a-zA-Z0-9_-]+)/i);
    const searchKey = fileKeyMatch ? fileKeyMatch[1] : (apiUploadsMatch ? apiUploadsMatch[1] : '');

    if (searchKey) {
      try {
        const db = await getSQLiteDB();
        if (db) {
          const isNumeric = /^\d+$/.test(searchKey);
          let stmt: any = null;
          if (isNumeric) {
            stmt = db.prepare(`SELECT original_url, name, mime_type FROM file_storage WHERE id = ? LIMIT 1`);
            stmt.bind([parseInt(searchKey, 10)]);
          } else {
            stmt = db.prepare(`SELECT original_url, name, mime_type FROM file_storage WHERE file_key = ? OR slug_name = ? OR short_url LIKE ? OR name = ? LIMIT 1`);
            stmt.bind([searchKey, searchKey, `%${searchKey}%`, searchKey]);
          }

          if (stmt && stmt.step()) {
            const row = stmt.getAsObject() as any;
            stmt.free();

            if (row.original_url && typeof row.original_url === 'string') {
              cleanUrl = row.original_url;
              fallbackName = fixUtf8Filename(row.name || '');
              fallbackContentType = row.mime_type || '';
            }
          } else if (stmt) {
            stmt.free();
          }
        }
      } catch (e) {
        console.warn('[fetchMediaBuffer] SQLite file search error:', e);
      }

      // Check legacy DB files
      try {
        const legacyFile = DB.getFileByShortKey(searchKey);
        if (legacyFile) {
          if (legacyFile.fullUrl && legacyFile.fullUrl.startsWith('http')) {
            cleanUrl = legacyFile.fullUrl;
            fallbackName = fixUtf8Filename(legacyFile.name || '');
          }
        }
      } catch (e) {}
    }

    // Check if it's a relative path on local disk
    if (cleanUrl.startsWith('/') || cleanUrl.startsWith('./')) {
      const localFilePath = path.isAbsolute(cleanUrl) ? cleanUrl : path.join(process.cwd(), cleanUrl);
      if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
        const fileBuf = await fs.promises.readFile(localFilePath);
        const fileName = path.basename(localFilePath);
        const detected = detectBufferMediaMeta(fileBuf, fileName, '');
        return {
          buffer: fileBuf,
          filename: detected.safeFilename,
          contentType: detected.contentType,
          mediaType: detected.mediaType
        };
      }
    }

    // Check for uploads directory relative link
    if (cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('uploads/')) {
      const relPath = path.join(process.cwd(), cleanUrl.replace(/^\/?/, ''));
      if (fs.existsSync(relPath) && fs.statSync(relPath).isFile()) {
        const fileBuf = await fs.promises.readFile(relPath);
        const fileName = path.basename(relPath);
        const detected = detectBufferMediaMeta(fileBuf, fileName, '');
        return {
          buffer: fileBuf,
          filename: detected.safeFilename,
          contentType: detected.contentType,
          mediaType: detected.mediaType
        };
      }
    }

    // Fetch from remote URL
    let fetchUrl = cleanUrl;
    if (fetchUrl.startsWith('//')) {
      fetchUrl = `https:${fetchUrl}`;
    } else if (!fetchUrl.startsWith('http://') && !fetchUrl.startsWith('https://')) {
      if (fetchUrl.startsWith('/')) {
        fetchUrl = `http://127.0.0.1:3000${fetchUrl}`;
      } else {
        fetchUrl = `https://${fetchUrl}`;
      }
    }

    let response: any = null;
    try {
      response = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        },
        signal: AbortSignal.timeout(60000)
      });
    } catch (fetchErr: any) {
      console.warn(`[fetchMediaBuffer] Initial fetch failed for ${fetchUrl}:`, fetchErr.message);
    }

    // Fallback: try secondary attempt with relaxed headers / extended timeout
    if (!response || !response.ok) {
      try {
        response = await fetch(fetchUrl, {
          headers: {
            'User-Agent': 'TelegramBot (like TwitterBot)',
            'Accept': '*/*'
          },
          signal: AbortSignal.timeout(60000)
        });
      } catch (retryErr: any) {
        console.warn(`[fetchMediaBuffer] Retry fetch failed for ${fetchUrl}:`, retryErr.message);
      }
    }

    if (!response || !response.ok) {
      console.warn(`[fetchMediaBuffer] HTTP ${response?.status} fetching media from ${fetchUrl}`);
      return null;
    }

    const rawContentType = response.headers.get('content-type') || fallbackContentType || 'application/octet-stream';
    if (rawContentType.includes('text/html')) {
      console.warn(`[fetchMediaBuffer] Received HTML instead of media binary from ${fetchUrl}`);
      return null;
    }

    const arrayBuf = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    if (!buffer || buffer.length === 0) {
      console.warn(`[fetchMediaBuffer] Received empty buffer from ${fetchUrl}`);
      return null;
    }

    let parsedName = fallbackName || '';
    if (!parsedName || parsedName === 'media.bin') {
      try {
        const parsed = new URL(fetchUrl);
        const bname = path.basename(parsed.pathname);
        if (bname && bname !== '/' && bname !== 'tgf' && bname !== 'up' && !bname.startsWith('?')) {
          parsedName = decodeURIComponent(bname);
        }
      } catch (e) {}
    }
    if (!parsedName || parsedName === 'media.bin') {
      parsedName = `file_${Date.now()}.bin`;
    }

    const detected = detectBufferMediaMeta(buffer, parsedName, rawContentType);
    return {
      buffer,
      filename: detected.safeFilename,
      contentType: detected.contentType,
      mediaType: detected.mediaType
    };
  } catch (err: any) {
    console.warn(`[fetchMediaBuffer] Error fetching ${urlStr}:`, err.message);
    return null;
  }
}

// Helper to resolve public URL from SQLite or legacy DB for Telegram URL fallback
export async function resolvePublicUrl(urlStr: string): Promise<string> {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  const match = trimmed.match(/(?:\/|^)(?:file|f)\/([a-zA-Z0-9_-]+)/i);
  const searchKey = match ? match[1] : '';
  if (searchKey) {
    try {
      const db = await getSQLiteDB();
      if (db) {
        const isNumeric = /^\d+$/.test(searchKey);
        let stmt: any = null;
        if (isNumeric) {
          stmt = db.prepare(`SELECT original_url FROM file_storage WHERE id = ? LIMIT 1`);
          stmt.bind([parseInt(searchKey, 10)]);
        } else {
          stmt = db.prepare(`SELECT original_url FROM file_storage WHERE file_key = ? OR slug_name = ? OR short_url LIKE ? OR name = ? LIMIT 1`);
          stmt.bind([searchKey, searchKey, `%${searchKey}%`, searchKey]);
        }
        if (stmt && stmt.step()) {
          const row = stmt.getAsObject() as any;
          if (row.original_url && typeof row.original_url === 'string' && row.original_url.startsWith('http')) {
            const resolved = row.original_url.trim();
            stmt.free();
            return resolved;
          }
        }
        if (stmt) stmt.free();
      }
    } catch (e) {}

    try {
      const legacy = DB.getFileByShortKey(searchKey);
      if (legacy && legacy.fullUrl && legacy.fullUrl.startsWith('http')) {
        return legacy.fullUrl;
      }
    } catch (e) {}
  }
  return trimmed;
}

// Build reply_markup for inline keyboard with styles and resilient URL/callback handling
export function buildReplyMarkup(
  inlineButtons: any,
  fallbackWebappToUrl: boolean = false
): { inline_keyboard: any[][] } | undefined {
  if (!inlineButtons || !Array.isArray(inlineButtons) || inlineButtons.length === 0) {
    return undefined;
  }

  // Normalize 1D or 2D array into 2D
  let rows: any[][] = [];
  if (Array.isArray(inlineButtons[0])) {
    rows = inlineButtons;
  } else {
    rows = inlineButtons.map(btn => [btn]);
  }

  const keyboardRows: any[][] = [];

  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const mappedRow: any[] = [];
    for (const btn of row) {
      if (!btn || !btn.text) continue;
      const text = String(btn.text).trim();
      if (!text) continue;

      const btnObj: any = { text };

      // Apply button style ("primary" = blue, "success" = green, "danger" = red)
      const btnStyle = btn.style || btn.color;
      if (btnStyle && ['primary', 'success', 'danger'].includes(btnStyle)) {
        btnObj.style = btnStyle;
      } else if (btnStyle === 'green' || btnStyle === 'emerald') {
        btnObj.style = 'success';
      } else if (btnStyle === 'red') {
        btnObj.style = 'danger';
      } else if (btnStyle === 'blue') {
        btnObj.style = 'primary';
      }

      const btnType = btn.type || (btn.webAppUrl ? 'webapp' : (btn.url && btn.url.startsWith('http') ? 'url' : 'callback'));

      if (btnType === 'webapp' || btn.webAppUrl) {
        let webUrl = String(btn.url || btn.webAppUrl || '').trim();
        if (webUrl && !webUrl.startsWith('http://') && !webUrl.startsWith('https://')) {
          webUrl = `https://${webUrl}`;
        }
        const validWebUrl = (webUrl && webUrl !== 'https://' && webUrl !== 'http://') ? webUrl : 'https://t.me';
        if (fallbackWebappToUrl) {
          btnObj.url = validWebUrl;
        } else {
          btnObj.web_app = { url: validWebUrl };
        }
      } else if (btnType === 'url') {
        let rawUrl = String(btn.url || '').trim();
        if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && !rawUrl.startsWith('tg://')) {
          rawUrl = `https://${rawUrl}`;
        }
        // If URL is empty or invalid ("https://"), fallback safely to callback_data to prevent BUTTON_URL_INVALID error
        if (!rawUrl || rawUrl === 'https://' || rawUrl === 'http://') {
          btnObj.callback_data = String(btn.callbackData || btn.text || 'btn_action').slice(0, 64);
        } else {
          btnObj.url = rawUrl;
        }
      } else {
        // Callback action
        const actionData = String(btn.callbackData || btn.action || btn.text || 'action').trim();
        btnObj.callback_data = (actionData || 'action').slice(0, 64);
      }

      mappedRow.push(btnObj);
    }
    if (mappedRow.length > 0) {
      keyboardRows.push(mappedRow);
    }
  }

  return keyboardRows.length > 0 ? { inline_keyboard: keyboardRows } : undefined;
}

/**
 * Main Telegram Sender Dispatcher.
 * Delegates to dedicated telegramRich.ts or telegramV2.ts.
 * Note: Post/card title is NEVER included in published Telegram messages.
 */
export async function sendPromptToTelegram(
  title: string,
  content: string,
  dayRequest: DayRequest,
  options?: {
    messageFormat?: 'v2' | 'rich' | 'markdown' | 'html';
    uppercaseHeader?: boolean;
    signature?: string;
    linkPreviewEnabled?: boolean;
    attachmentType?: 'none' | 'photo' | 'document' | 'video' | 'audio' | 'album' | 'video_note' | 'voice';
    audioFormat?: 'audio' | 'voice';
    attachmentUrl?: string;
    attachmentUrls?: string[];
    inlineButtons?: InlineButton[][] | InlineButton[];
    channels?: string[];
    telegramId?: number | string;
  }
): Promise<TelegramSendResponse> {
  const format = options?.messageFormat || dayRequest.messageFormat || 'v2';

  if (format === 'rich') {
    return sendRichTelegramMessage(title, content, dayRequest, options);
  }

  return sendV2TelegramMessage(title, content, dayRequest, options);
}

export async function sendPrivateTelegramNotification(
  telegramId: number,
  message: string
): Promise<boolean> {
  const settings = DB.getSettings();
  const token = getBotTokenFromSQLite() || settings.telegramBotToken || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';

  if (!token || token.trim() === '') {
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    const data = await response.json();
    return data.ok === true;
  } catch (err) {
    console.error('Error sending private notification to Telegram:', err);
    return false;
  }
}
