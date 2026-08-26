import FormData from 'form-data';
import path from 'path';
import fs from 'fs';
import os from 'os';
import util from 'util';
import { execFile } from 'child_process';
import { DB, DayRequest } from './db';
import { getBotTokenFromSQLite, getSQLiteDB } from './sqlite';
import { InlineButton } from '../types';

const execFileAsync = util.promisify(execFile);

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

interface TelegramSendResponse {
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
function formatMarkdownTableForTelegram(tableStr: string): string {
  const rawLines = tableStr.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const dataLines = rawLines.filter(l => !l.match(/^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)*\|?$/));
  if (dataLines.length === 0) return tableStr;

  const rows: string[][] = dataLines.map(line => {
    const cells = line.split('|').map(c => c.trim());
    if (cells.length > 0 && cells[0] === '') cells.shift();
    if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
    return cells;
  });

  if (rows.length === 0) return tableStr;

  const colCount = Math.max(...rows.map(r => r.length));
  const colWidths = new Array(colCount).fill(0);

  rows.forEach(r => {
    r.forEach((c, idx) => {
      if (c.length > colWidths[idx]) colWidths[idx] = Math.min(c.length, 30);
    });
  });

  const formattedRows = rows.map(r => {
    return r.map((cell, idx) => {
      const w = colWidths[idx] || 10;
      return cell.padEnd(w, ' ');
    }).join(' | ');
  });

  return `<pre>\n${formattedRows.join('\n')}\n</pre>`;
}

// Convert rich/v2 markdown text to flawless Telegram HTML
export function convertToTelegramHTML(text: string, format: string = 'v2'): string {
  if (!text) return '';

  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];

  let str = text;

  // 1. Triple backtick code blocks: ```lang\ncode\n``` or ```code```
  str = str.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    if (lang) {
      codeBlocks.push(`<pre><code class="language-${lang}">${escapedCode}</code></pre>`);
    } else {
      codeBlocks.push(`<pre>${escapedCode}</pre>`);
    }
    return `\uE000CB${idx}\uE001`;
  });

  // 2. Inline code: `code`
  str = str.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = inlineCodes.length;
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    inlineCodes.push(`<code>${escapedCode}</code>`);
    return `\uE000IC${idx}\uE001`;
  });

  // 3. Custom Emoji: ![alt](tg://emoji?id=12345) -> <tg-emoji emoji-id="12345">alt</tg-emoji>
  const customEmojis: string[] = [];
  str = str.replace(/!\[(.*?)\]\(tg:\/\/emoji\?id=(\d+)\)/gi, (_, alt, id) => {
    const idx = customEmojis.length;
    customEmojis.push(`<tg-emoji emoji-id="${id}">${alt || '✨'}</tg-emoji>`);
    return `\uE000EM${idx}\uE001`;
  });

  // 4. Telegram Time: <tg-time unix="123" format="wDT">Label</tg-time> -> keep label
  str = str.replace(/<tg-time.*?unix=["'](\d+)["'].*?>(.*?)<\/tg-time>/gi, '$2');

  // 5. Collapsible / Details: <details><summary>S</summary>C</details>
  str = str.replace(/<details.*?>\s*<summary>(.*?)<\/summary>([\s\S]*?)<\/details>/gi, '<b>$1</b>\n<blockquote expandable>$2</blockquote>');

  // 6. Markdown Tables
  str = str.replace(/(?:^|\n)(\|.+?\|\n\|[\s\-:|]+\|\n(?:\|.+?\|(?:\n|$))+)/g, (match) => {
    return '\n' + formatMarkdownTableForTelegram(match) + '\n';
  });

  // 7. Checklists
  str = str.replace(/^[\-\*]\s+\[\s*\]\s+(.+)$/gim, '☐ $1');
  str = str.replace(/^[\-\*]\s+\[[xX]\]\s+(.+)$/gim, '✓ <s>$1</s>');

  // 8. Escape HTML special characters in the rest of the text
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 9. Expandable blockquotes: >> quote
  str = str.replace(/^&gt;&gt;\s?(.*$)/gim, '<blockquote expandable>$1</blockquote>');

  // 10. Standard blockquotes: > quote
  str = str.replace(/^&gt;\s?(.*$)/gim, '<blockquote>$1</blockquote>');

  // 11. Headings: # Heading -> <b>Heading</b>
  str = str.replace(/^#{1,6}\s+(.*$)/gim, '<b>$1</b>');

  // 12. Spoilers: ||spoiler|| -> <span class="tg-spoiler">spoiler</span>
  str = str.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="tg-spoiler">$1</span>');

  // 13. Underline: __text__ -> <u>text</u>
  str = str.replace(/__([^_]+)__/g, '<u>$1</u>');

  // 14. Bold, Italic, Strikethrough according to format
  if (format === 'rich' || format === 'html') {
    // Bold: **text**
    str = str.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
    // Strikethrough: ~~text~~
    str = str.replace(/~~([^~\n]+)~~/g, '<s>$1</s>');
    // Italic: *text* or _text_
    str = str.replace(/\*([^*\n]+)\*/g, '<i>$1</i>');
    str = str.replace(/_([^_]+)_/g, '<i>$1</i>');
  } else {
    // V2 / Standard Markdown:
    // Bold: **text** or *text*
    str = str.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
    str = str.replace(/\*([^*\n]+)\*/g, '<b>$1</b>');
    // Strikethrough: ~~text~~ or ~text~
    str = str.replace(/~~([^~\n]+)~~/g, '<s>$1</s>');
    str = str.replace(/~([^~\n]+)~/g, '<s>$1</s>');
    // Italic: _text_
    str = str.replace(/_([^_]+)_/g, '<i>$1</i>');
  }

  // 15. Links: [label](url) -> <a href="url">label</a>
  str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const cleanUrl = url.replace(/&amp;/g, '&');
    return `<a href="${cleanUrl}">${label}</a>`;
  });

  // 16. Restore Custom Emojis
  str = str.replace(/\uE000EM(\d+)\uE001/g, (_, idx) => customEmojis[Number(idx)] || '');

  // 17. Restore Inline Code
  str = str.replace(/\uE000IC(\d+)\uE001/g, (_, idx) => inlineCodes[Number(idx)] || '');

  // 18. Restore Code Blocks
  str = str.replace(/\uE000CB(\d+)\uE001/g, (_, idx) => codeBlocks[Number(idx)] || '');

  return str;
}

export function convertRichToTelegramHTML(text: string): string {
  return convertToTelegramHTML(text, 'rich');
}

// Auto-escape unescaped Markdown V2 punctuation for Telegram (kept for backwards compatibility)
export function sanitizeMarkdownV2(text: string): string {
  if (!text) return '';
  return text.replace(/(?<!\\)([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// Prepare MarkdownV2 text (kept for backwards compatibility)
export function prepareTelegramMarkdownV2(text: string): string {
  return convertToTelegramHTML(text, 'v2');
}

// Helper to clean filenames for safe ASCII FormData headers in Telegram Bot API
export function toSafeAsciiFilename(originalName: string, defaultExt: string = 'bin', prefix: string = 'file'): string {
  if (!originalName || typeof originalName !== 'string') {
    return `${prefix}_${Date.now()}.${defaultExt}`;
  }
  const extMatch = originalName.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
  const ext = extMatch ? extMatch[1].toLowerCase() : defaultExt;
  const baseOnly = originalName.replace(/\.[^/.]+$/, "").replace(/[?#].*$/, "");
  const cleanBase = baseOnly.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/^_+|_+$/g, "").slice(0, 32);
  return cleanBase ? `${cleanBase}.${ext}` : `${prefix}_${Date.now()}.${ext}`;
}

// Magic bytes analyzer to determine exact format and prevent IMAGE_PROCESS_FAILED in Telegram API
export function detectBufferMediaMeta(
  buffer: Buffer,
  fallbackName: string = 'media.bin',
  fallbackContentType: string = 'application/octet-stream'
): { ext: string; contentType: string; mediaType: 'photo' | 'video' | 'audio' | 'document'; safeFilename: string } {
  let ext = '';
  let contentType = '';
  let mediaType: 'photo' | 'video' | 'audio' | 'document' = 'document';

  if (buffer && buffer.length >= 4) {
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      ext = 'jpg';
      contentType = 'image/jpeg';
      mediaType = 'photo';
    }
    // PNG: 89 50 4E 47 (0D 0A 1A 0A)
    else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      ext = 'png';
      contentType = 'image/png';
      mediaType = 'photo';
    }
    // GIF: 47 49 46 38
    else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      ext = 'gif';
      contentType = 'image/gif';
      mediaType = 'photo';
    }
    // WEBP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
    else if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.toString('utf8', 8, 12) === 'WEBP'
    ) {
      ext = 'webp';
      contentType = 'image/webp';
      mediaType = 'photo';
    }
    // MP4 / MOV: ftyp at offset 4
    else if (buffer.length >= 8 && buffer.toString('utf8', 4, 8) === 'ftyp') {
      ext = 'mp4';
      contentType = 'video/mp4';
      mediaType = 'video';
    }
    // MKV / WebM: 1A 45 DF A3
    else if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
      ext = 'webm';
      contentType = 'video/webm';
      mediaType = 'video';
    }
    // OGG: 4F 67 67 53 (OggS)
    else if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
      ext = 'ogg';
      contentType = 'audio/ogg';
      mediaType = 'audio';
    }
    // MP3: ID3 (49 44 33) or sync frame FF FB / FF F3 / FF F2
    else if (
      (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
      (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0)
    ) {
      ext = 'mp3';
      contentType = 'audio/mpeg';
      mediaType = 'audio';
    }
    // WAV: RIFF ... WAVE
    else if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.toString('utf8', 8, 12) === 'WAVE'
    ) {
      ext = 'wav';
      contentType = 'audio/wav';
      mediaType = 'audio';
    }
    // PDF: %PDF
    else if (buffer.toString('utf8', 0, 4) === '%PDF') {
      ext = 'pdf';
      contentType = 'application/pdf';
      mediaType = 'document';
    }
  }

  // Fallback by name / header if magic bytes did not match
  if (!ext) {
    const lowerName = fallbackName.toLowerCase();
    const lowerHeader = fallbackContentType.toLowerCase();

    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerHeader.includes('jpeg') || lowerHeader.includes('jpg')) {
      ext = 'jpg';
      contentType = 'image/jpeg';
      mediaType = 'photo';
    } else if (lowerName.endsWith('.png') || lowerHeader.includes('png')) {
      ext = 'png';
      contentType = 'image/png';
      mediaType = 'photo';
    } else if (lowerName.endsWith('.webp') || lowerHeader.includes('webp')) {
      ext = 'webp';
      contentType = 'image/webp';
      mediaType = 'photo';
    } else if (lowerName.endsWith('.gif') || lowerHeader.includes('gif')) {
      ext = 'gif';
      contentType = 'image/gif';
      mediaType = 'photo';
    } else if (lowerName.endsWith('.mp4') || lowerName.endsWith('.mov') || lowerHeader.includes('video')) {
      ext = 'mp4';
      contentType = 'video/mp4';
      mediaType = 'video';
    } else if (lowerName.endsWith('.mp3') || lowerHeader.includes('mpeg') || lowerHeader.includes('mp3')) {
      ext = 'mp3';
      contentType = 'audio/mpeg';
      mediaType = 'audio';
    } else if (lowerName.endsWith('.ogg') || lowerHeader.includes('ogg')) {
      ext = 'ogg';
      contentType = 'audio/ogg';
      mediaType = 'audio';
    } else if (lowerName.endsWith('.wav') || lowerHeader.includes('wav')) {
      ext = 'wav';
      contentType = 'audio/wav';
      mediaType = 'audio';
    } else if (lowerName.endsWith('.pdf') || lowerHeader.includes('pdf')) {
      ext = 'pdf';
      contentType = 'application/pdf';
      mediaType = 'document';
    } else {
      ext = 'bin';
      contentType = fallbackContentType || 'application/octet-stream';
      mediaType = 'document';
    }
  }

  const safeFilename = toSafeAsciiFilename(fallbackName, ext, mediaType);
  return { ext, contentType, mediaType, safeFilename };
}

// Helper to fetch media from local storage, pro-talk or external URL into Buffer
export async function fetchMediaBuffer(
  urlStr: string
): Promise<{ buffer: Buffer; filename: string; contentType: string; mediaType: 'photo' | 'video' | 'audio' | 'document' } | null> {
  if (!urlStr || typeof urlStr !== 'string') return null;

  try {
    let fetchUrl = urlStr.trim();
    const trimmed = fetchUrl;
    let fallbackName = 'media.bin';
    let fallbackContentType = 'application/octet-stream';

    // 1. Handle base64 data URIs directly
    if (trimmed.startsWith('data:')) {
      const commaIdx = trimmed.indexOf(',');
      if (commaIdx !== -1) {
        const meta = trimmed.substring(5, commaIdx);
        const isBase64 = meta.includes('base64');
        const mime = meta.split(';')[0] || 'application/octet-stream';
        const rawData = trimmed.substring(commaIdx + 1);
        const buffer = Buffer.from(rawData, isBase64 ? 'base64' : 'utf-8');
        const detected = detectBufferMediaMeta(buffer, `data_file_${Date.now()}`, mime);
        return { buffer, filename: detected.safeFilename, contentType: detected.contentType, mediaType: detected.mediaType };
      }
    }

    // 2. Check direct local disk paths
    const possibleLocalPaths = [
      trimmed.startsWith('/') ? path.join(process.cwd(), 'dist', trimmed.replace(/^\//, '')) : null,
      trimmed.startsWith('/') ? path.join(process.cwd(), 'public', trimmed.replace(/^\//, '')) : null,
      trimmed.startsWith('/') ? path.join(process.cwd(), trimmed.replace(/^\//, '')) : null,
      path.join(process.cwd(), 'dist', trimmed),
      path.join(process.cwd(), 'public', trimmed)
    ].filter(Boolean) as string[];

    for (const p of possibleLocalPaths) {
      try {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          const buffer = await fs.promises.readFile(p);
          const detected = detectBufferMediaMeta(buffer, path.basename(p));
          return { buffer, filename: detected.safeFilename, contentType: detected.contentType, mediaType: detected.mediaType };
        }
      } catch (e) {}
    }

    // 3. Resolve from SQLite file_storage for any /file/... or /f/... URL pattern
    const proxyMatch = trimmed.match(/(?:\/|^)(?:file|f)\/([a-zA-Z0-9_-]+)/i);
    const searchKey = proxyMatch ? proxyMatch[1] : '';

    if (searchKey) {
      // Check disk under public/file or dist/file
      const keyDiskCandidates = [
        path.join(process.cwd(), 'public', 'file', searchKey),
        path.join(process.cwd(), 'dist', 'file', searchKey),
        path.join(process.cwd(), 'public', 'file', searchKey, `${searchKey}.png`),
        path.join(process.cwd(), 'public', 'file', searchKey, `${searchKey}.mp3`),
        path.join(process.cwd(), 'public', `${searchKey}.png`),
        path.join(process.cwd(), `${searchKey}.png`)
      ];
      for (const kp of keyDiskCandidates) {
        try {
          if (fs.existsSync(kp) && fs.statSync(kp).isFile()) {
            const buffer = await fs.promises.readFile(kp);
            const detected = detectBufferMediaMeta(buffer, path.basename(kp));
            return { buffer, filename: detected.safeFilename, contentType: detected.contentType, mediaType: detected.mediaType };
          }
        } catch (e) {}
      }

      // Query SQLite database
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
            if (row.original_url && typeof row.original_url === 'string' && row.original_url.trim()) {
              fetchUrl = row.original_url.trim();
              if (row.name) fallbackName = row.name;
              if (row.mime_type) fallbackContentType = row.mime_type;
            }
          }
          if (stmt) stmt.free();
        }
      } catch (e) {
        console.warn('[fetchMediaBuffer] SQLite lookup error:', e);
      }

      // Check legacy DB files lookup
      if (fetchUrl === trimmed) {
        try {
          const legacy = DB.getFileByShortKey(searchKey);
          if (legacy && legacy.fullUrl) {
            fetchUrl = legacy.fullUrl;
            if (legacy.name) fallbackName = legacy.name;
            if (legacy.mimeType) fallbackContentType = legacy.mimeType;
          }
        } catch (e) {}
      }
    }

    // 4. If relative path after resolution
    if (fetchUrl.startsWith('/') || fetchUrl.startsWith('./')) {
      const relPath = fetchUrl.replace(/^\.?\//, '');
      const localRelCandidates = [
        path.join(process.cwd(), 'dist', relPath),
        path.join(process.cwd(), 'public', relPath),
        path.join(process.cwd(), relPath)
      ];
      for (const lr of localRelCandidates) {
        if (fs.existsSync(lr) && fs.statSync(lr).isFile()) {
          const buffer = await fs.promises.readFile(lr);
          const detected = detectBufferMediaMeta(buffer, fallbackName || path.basename(lr), fallbackContentType);
          return { buffer, filename: detected.safeFilename, contentType: detected.contentType, mediaType: detected.mediaType };
        }
      }
      fetchUrl = `http://127.0.0.1:3000/${relPath}`;
    }

    // 5. Network fetch with headers & fallback
    const defaultToken = "b2VcU3NrVVttYlh3GHM_AEQ4eA8yDR4FGREODwsaLyUqQjpTEA8HGzMdFB8aORQYaG9dWGpkVQRvAXM";
    let response: any = null;

    try {
      response = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-Upload-Token': defaultToken
        },
        signal: AbortSignal.timeout(25000)
      });
    } catch (netErr: any) {
      console.warn(`[fetchMediaBuffer] Initial fetch failed for ${fetchUrl}:`, netErr.message);
    }

    // Retry without X-Upload-Token if failed or returned error status
    if (!response || !response.ok) {
      try {
        response = await fetch(fetchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(25000)
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

    let parsedName = fallbackName || 'media.bin';
    try {
      const parsed = new URL(fetchUrl);
      const bname = path.basename(parsed.pathname);
      if (bname && bname !== '/' && bname !== 'tgf' && bname !== 'up') {
        parsedName = bname;
      }
    } catch (e) {
      if (!parsedName || parsedName === 'media.bin') {
        parsedName = `media_${Date.now()}.bin`;
      }
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

// Build reply_markup for inline keyboard WITHOUT injecting extra emoji circles
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

      let btnUrl = String(btn.url || btn.webAppUrl || '').trim();
      // Strip accidentally duplicated or invalid protocol prefixes
      btnUrl = btnUrl.replace(/^(?:https?:\/\/)?(?:action)?(?:https?:\/\/)+/i, 'https://');
      if (btnUrl && !btnUrl.startsWith('http://') && !btnUrl.startsWith('https://') && !btnUrl.startsWith('tg://')) {
        btnUrl = `https://${btnUrl}`;
      }

      const btnObj: any = { text };

      if (btn.type === 'webapp' || btn.webAppUrl) {
        const validWebUrl = btnUrl || 'https://t.me';
        if (fallbackWebappToUrl) {
          btnObj.url = validWebUrl;
        } else {
          btnObj.web_app = { url: validWebUrl };
        }
      } else if (btn.type === 'url' || btnUrl) {
        btnObj.url = btnUrl || 'https://t.me';
      } else {
        btnObj.callback_data = String(btn.callbackData || btn.text).slice(0, 64);
      }

      mappedRow.push(btnObj);
    }
    if (mappedRow.length > 0) {
      keyboardRows.push(mappedRow);
    }
  }

  return keyboardRows.length > 0 ? { inline_keyboard: keyboardRows } : undefined;
}

export async function sendPromptToTelegram(
  title: string,
  content: string,
  dayRequest: DayRequest,
  options?: {
    messageFormat?: 'v2' | 'rich' | 'markdown' | 'html';
    uppercaseHeader?: boolean;
    signature?: string;
    linkPreviewEnabled?: boolean;
    attachmentType?: 'none' | 'photo' | 'document' | 'video' | 'audio' | 'album' | 'video_note';
    attachmentUrl?: string;
    attachmentUrls?: string[];
    inlineButtons?: InlineButton[][] | InlineButton[];
    channels?: string[];
    telegramId?: number | string;
  }
): Promise<TelegramSendResponse> {
  const settings = DB.getSettings();
  const token = getBotTokenFromSQLite() || settings.telegramBotToken || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';
  
  const targetChannels = options?.channels && options.channels.length > 0
    ? options.channels
    : (dayRequest.channels && dayRequest.channels.length > 0 ? dayRequest.channels : [dayRequest.channel || settings.channelId || '@SAV_AI']);

  // Extract option settings or apply defaults
  const format = options?.messageFormat || dayRequest.messageFormat || 'v2';
  const uppercaseHeader = options?.uppercaseHeader !== false;
  const linkPreviewEnabled = options?.linkPreviewEnabled !== undefined 
    ? options.linkPreviewEnabled 
    : (dayRequest.linkPreviewEnabled !== false);
  const attachmentType = options?.attachmentType || dayRequest.attachmentType || 'none';
  
  const rawAttachmentUrl = (options?.attachmentUrl || dayRequest.attachmentUrl || '').trim();
  const rawAttachmentUrls = (options?.attachmentUrls || dayRequest.attachmentUrls || []).map(u => (u || '').trim()).filter(Boolean);
  const inlineButtons = options?.inlineButtons || dayRequest.inlineButtons || [];

  const formattedTitle = uppercaseHeader ? title.toUpperCase() : title;

  let rawText = content !== undefined && content !== null ? content : '';
  if (!rawText && formattedTitle) {
    rawText = formattedTitle;
  }

  // Convert raw formatted text to Telegram HTML
  const fullHtmlText = convertToTelegramHTML(rawText, format);

  // Check if token is provided
  if (!token || token.trim() === '') {
    return {
      ok: false,
      error: 'Не указан токен Telegram бота в настройках.',
      simulated: true
    };
  }

  const successChannels: string[] = [];
  const errors: string[] = [];
  let lastMessageId = '1';

  for (const rawCh of targetChannels) {
    let channel = rawCh;

    if (channel === 'bot_dm' || channel === '@bot_dm' || channel === 'direct_message') {
      const numericTgId = options?.telegramId || settings.channelId;
      if (!numericTgId) {
        errors.push(`Не указан Telegram ID для отправки в личные сообщения`);
        continue;
      }
      channel = String(numericTgId);
    } else {
      // Resolve internal channel IDs
      if (channel && (channel.startsWith('ch_') || channel.startsWith('channel_') || (!channel.startsWith('@') && isNaN(Number(channel))))) {
        const dbChannels = DB.getChannels() || [];
        const found = dbChannels.find((c: any) => c.id === channel || c.channelId === channel || c.username === channel || c.name === channel);
        if (found) {
          channel = found.username || (found.telegramId ? String(found.telegramId) : '') || found.name || channel;
        }
        if (channel && !channel.startsWith('@') && !channel.startsWith('-100') && isNaN(Number(channel))) {
          channel = `@${channel.replace(/^@/, '')}`;
        }
      }
    }

    let replyMarkup = buildReplyMarkup(inlineButtons, false);

    try {
      let sendSuccess = false;
      let resultData: any = null;

      const hasShortCaption = fullHtmlText.length <= 1024;
      const captionToSend = hasShortCaption ? fullHtmlText : '';

      // -------------------------------------------------------------
      // 1. ALBUM ATTACHMENTS (Multiple Photos / Videos)
      // -------------------------------------------------------------
      if (attachmentType === 'album' && (rawAttachmentUrls.length > 0 || rawAttachmentUrl)) {
        const urlsToProcess = (rawAttachmentUrls.length > 0 ? rawAttachmentUrls : [rawAttachmentUrl]).filter(u => Boolean(u && typeof u === 'string' && u.trim()));
        const mediaBuffers = await Promise.all(urlsToProcess.slice(0, 10).map(u => fetchMediaBuffer(u)));
        const validBuffers = mediaBuffers.filter(b => b !== null) as { buffer: Buffer; filename: string; contentType: string; mediaType: 'photo' | 'video' | 'audio' | 'document' }[];

        if (validBuffers.length === 1) {
          // Telegram sendMediaGroup requires 2-10 items; for a single item send as single photo or video
          const item = validBuffers[0];
          const isVideo = item.mediaType === 'video' || item.filename.match(/\.(mp4|mov|avi|webm)$/i) || item.contentType.includes('video');
          const safeName = item.filename || `media_0.${isVideo ? 'mp4' : 'jpg'}`;
          const mimeType = isVideo ? (item.contentType.includes('video') ? item.contentType : 'video/mp4') : (item.contentType.startsWith('image/') ? item.contentType : 'image/jpeg');

          const singleForm = new FormData();
          singleForm.append('chat_id', channel);
          singleForm.append(isVideo ? 'video' : 'photo', item.buffer, { filename: safeName, contentType: mimeType });
          if (captionToSend) {
            singleForm.append('caption', captionToSend);
            singleForm.append('parse_mode', 'HTML');
          }
          if (replyMarkup) {
            singleForm.append('reply_markup', JSON.stringify(replyMarkup));
          }

          const endpoint = isVideo ? 'sendVideo' : 'sendPhoto';
          const res = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
            method: 'POST',
            headers: singleForm.getHeaders(),
            body: singleForm.getBuffer()
          });
          resultData = await res.json();

          if (!resultData.ok && resultData.description && (resultData.description.includes('entities') || resultData.description.includes('tag') || resultData.description.includes('HTML'))) {
            const retrySingleForm = new FormData();
            retrySingleForm.append('chat_id', channel);
            retrySingleForm.append(isVideo ? 'video' : 'photo', item.buffer, { filename: safeName, contentType: mimeType });
            if (captionToSend) {
              retrySingleForm.append('caption', stripHTML(captionToSend));
            }
            if (replyMarkup) {
              retrySingleForm.append('reply_markup', JSON.stringify(replyMarkup));
            }
            const retryRes = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
              method: 'POST',
              headers: retrySingleForm.getHeaders(),
              body: retrySingleForm.getBuffer()
            });
            resultData = await retryRes.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');
            if (!hasShortCaption || (replyMarkup && replyMarkup.inline_keyboard.length > 0)) {
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    text: fullHtmlText || 'Подробнее:',
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup
                  })
                });
              } catch (e) {}
            }
          }
        } else if (validBuffers.length >= 2) {
          const form = new FormData();
          form.append('chat_id', channel);

          const mediaArray = validBuffers.map((item, idx) => {
            const fieldName = `file_${idx}`;
            const isVideo = item.mediaType === 'video' || item.filename.match(/\.(mp4|mov|avi|webm)$/i) || item.contentType.includes('video');
            const safeName = item.filename || `media_${idx}.${isVideo ? 'mp4' : 'jpg'}`;
            const mimeType = isVideo ? (item.contentType.includes('video') ? item.contentType : 'video/mp4') : (item.contentType.startsWith('image/') ? item.contentType : 'image/jpeg');
            form.append(fieldName, item.buffer, { filename: safeName, contentType: mimeType });
            return {
              type: isVideo ? 'video' : 'photo',
              media: `attach://${fieldName}`,
              caption: idx === 0 && hasShortCaption ? captionToSend : undefined,
              parse_mode: idx === 0 && hasShortCaption ? 'HTML' : undefined
            };
          });

          form.append('media', JSON.stringify(mediaArray));

          const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
            method: 'POST',
            headers: form.getHeaders(),
            body: form.getBuffer()
          });
          resultData = await res.json();

          // Retry without HTML if entity error
          if (!resultData.ok && resultData.description && (resultData.description.includes('entities') || resultData.description.includes('tag') || resultData.description.includes('HTML'))) {
            const retryForm = new FormData();
            retryForm.append('chat_id', channel);
            const plainCaption = hasShortCaption ? stripHTML(captionToSend) : undefined;
            const retryMedia = validBuffers.map((item, idx) => {
              const fieldName = `file_${idx}`;
              const isVideo = item.mediaType === 'video' || item.filename.match(/\.(mp4|mov|avi|webm)$/i) || item.contentType.includes('video');
              const safeName = item.filename || `media_${idx}.${isVideo ? 'mp4' : 'jpg'}`;
              const mimeType = isVideo ? (item.contentType.includes('video') ? item.contentType : 'video/mp4') : (item.contentType.startsWith('image/') ? item.contentType : 'image/jpeg');
              retryForm.append(fieldName, item.buffer, { filename: safeName, contentType: mimeType });
              return {
                type: isVideo ? 'video' : 'photo',
                media: `attach://${fieldName}`,
                caption: idx === 0 ? plainCaption : undefined
              };
            });
            retryForm.append('media', JSON.stringify(retryMedia));
            const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
              method: 'POST',
              headers: retryForm.getHeaders(),
              body: retryForm.getBuffer()
            });
            resultData = await retryRes.json();
          }

          // Fallback: If sendMediaGroup failed (e.g. IMAGE_PROCESS_FAILED or size limits), send each media sequentially
          if (!resultData.ok && validBuffers.length > 0) {
            console.warn(`[sendMediaGroup] Album failed (${resultData.description}), switching to sequential fallback.`);
            let fallbackCount = 0;
            for (let idx = 0; idx < validBuffers.length; idx++) {
              const item = validBuffers[idx];
              const isVideo = item.mediaType === 'video' || item.filename.match(/\.(mp4|mov|avi|webm)$/i) || item.contentType.includes('video');
              const isShort = idx === 0 && hasShortCaption;
              const safeName = item.filename || `media_${idx}.${isVideo ? 'mp4' : 'jpg'}`;
              const mimeType = isVideo ? (item.contentType.includes('video') ? item.contentType : 'video/mp4') : (item.contentType.startsWith('image/') ? item.contentType : 'image/jpeg');
              
              const subForm = new FormData();
              subForm.append('chat_id', channel);
              if (isShort && captionToSend) {
                subForm.append('caption', captionToSend);
                subForm.append('parse_mode', 'HTML');
              }
              if (isShort && replyMarkup) {
                subForm.append('reply_markup', JSON.stringify(replyMarkup));
              }

              let endpoint = isVideo ? 'sendVideo' : 'sendPhoto';
              let fieldKey = isVideo ? 'video' : 'photo';
              subForm.append(fieldKey, item.buffer, { filename: safeName, contentType: mimeType });

              let subRes = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
                method: 'POST',
                headers: subForm.getHeaders(),
                body: subForm.getBuffer()
              });
              let subData = await subRes.json();

              // If sendPhoto failed with IMAGE_PROCESS_FAILED, send as document
              if (!subData.ok && !isVideo) {
                const docForm = new FormData();
                docForm.append('chat_id', channel);
                docForm.append('document', item.buffer, { filename: safeName, contentType: mimeType });
                if (isShort && captionToSend) {
                  docForm.append('caption', captionToSend);
                  docForm.append('parse_mode', 'HTML');
                }
                const docRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
                  method: 'POST',
                  headers: docForm.getHeaders(),
                  body: docForm.getBuffer()
                });
                subData = await docRes.json();
              }

              if (subData.ok) {
                fallbackCount++;
                if (idx === 0) lastMessageId = String(subData.result?.message_id || '1');
              }
            }

            if (fallbackCount > 0) {
              sendSuccess = true;
              resultData = { ok: true, fallback: true };
            }
          }

          if (resultData.ok) {
            sendSuccess = true;
            if (!hasShortCaption || (replyMarkup && replyMarkup.inline_keyboard.length > 0)) {
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    text: fullHtmlText || 'Подробнее:',
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup
                  })
                });
              } catch (e) {}
            }
          }
        }
      }

      // -------------------------------------------------------------
      // 2. SINGLE PHOTO
      // -------------------------------------------------------------
      else if (attachmentType === 'photo' && (rawAttachmentUrl || rawAttachmentUrls.length > 0)) {
        const targetUrl = rawAttachmentUrl || rawAttachmentUrls[0];
        const mediaFile = await fetchMediaBuffer(targetUrl);

        if (mediaFile) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('photo', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
          if (captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'HTML');
          }
          if (hasShortCaption && replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }

          const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            headers: form.getHeaders(),
            body: form.getBuffer()
          });
          resultData = await res.json();

          // Retry if BUTTON_TYPE_INVALID (e.g. web_app in channel)
          if (!resultData.ok && (resultData.description?.includes('BUTTON_TYPE_INVALID') || resultData.description?.includes('BUTTON_URL_INVALID'))) {
            const urlFallbackMarkup = buildReplyMarkup(inlineButtons, true);
            const retryForm = new FormData();
            retryForm.append('chat_id', channel);
            retryForm.append('photo', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
            if (captionToSend) {
              retryForm.append('caption', captionToSend);
              retryForm.append('parse_mode', 'HTML');
            }
            if (hasShortCaption && urlFallbackMarkup) {
              retryForm.append('reply_markup', JSON.stringify(urlFallbackMarkup));
            }
            const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
              method: 'POST',
              headers: retryForm.getHeaders(),
              body: retryForm.getBuffer()
            });
            resultData = await retryRes.json();
          }

          // Retry with stripped plain text if entity error
          if (!resultData.ok && (resultData.description?.includes('can\'t parse entities') || resultData.description?.includes('tag'))) {
            const safeCaption = stripHTML(captionToSend);
            const retryForm = new FormData();
            retryForm.append('chat_id', channel);
            retryForm.append('photo', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
            if (safeCaption) {
              retryForm.append('caption', safeCaption);
            }
            if (hasShortCaption && replyMarkup) {
              retryForm.append('reply_markup', JSON.stringify(replyMarkup));
            }
            const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
              method: 'POST',
              headers: retryForm.getHeaders(),
              body: retryForm.getBuffer()
            });
            resultData = await retryRes.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            if (!hasShortCaption && fullHtmlText) {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: channel,
                  text: fullHtmlText,
                  parse_mode: 'HTML',
                  reply_markup: replyMarkup,
                  disable_web_page_preview: !linkPreviewEnabled,
                  link_preview_options: { is_disabled: !linkPreviewEnabled }
                })
              });
            }
          }
        }

        // Fallback to sending URL directly if buffer failed
        if (!sendSuccess) {
          const publicPhotoUrl = await resolvePublicUrl(targetUrl);
          const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              photo: publicPhotoUrl,
              caption: captionToSend || undefined,
              parse_mode: captionToSend ? 'HTML' : undefined,
              reply_markup: (hasShortCaption && replyMarkup) ? replyMarkup : undefined
            })
          });
          resultData = await res.json();

          if (!resultData.ok && (resultData.description?.includes('BUTTON_TYPE_INVALID') || resultData.description?.includes('BUTTON_URL_INVALID'))) {
            const urlFallbackMarkup = buildReplyMarkup(inlineButtons, true);
            const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: channel,
                photo: publicPhotoUrl,
                caption: captionToSend || undefined,
                parse_mode: captionToSend ? 'HTML' : undefined,
                reply_markup: (hasShortCaption && urlFallbackMarkup) ? urlFallbackMarkup : undefined
              })
            });
            resultData = await retryRes.json();
          }

          if (resultData.ok) sendSuccess = true;
        }
      }

      // -------------------------------------------------------------
      // 3. VIDEO ATTACHMENT
      // -------------------------------------------------------------
      else if (attachmentType === 'video' && (rawAttachmentUrl || rawAttachmentUrls.length > 0)) {
        const targetUrl = rawAttachmentUrl || rawAttachmentUrls[0];
        const mediaFile = await fetchMediaBuffer(targetUrl);

        if (mediaFile) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('video', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
          if (captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'HTML');
          }
          if (hasShortCaption && replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }

          const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
            method: 'POST',
            headers: form.getHeaders(),
            body: form.getBuffer()
          });
          resultData = await res.json();

          if (!resultData.ok && (resultData.description?.includes('BUTTON_TYPE_INVALID') || resultData.description?.includes('BUTTON_URL_INVALID'))) {
            const urlFallbackMarkup = buildReplyMarkup(inlineButtons, true);
            const retryForm = new FormData();
            retryForm.append('chat_id', channel);
            retryForm.append('video', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
            if (captionToSend) {
              retryForm.append('caption', captionToSend);
              retryForm.append('parse_mode', 'HTML');
            }
            if (hasShortCaption && urlFallbackMarkup) {
              retryForm.append('reply_markup', JSON.stringify(urlFallbackMarkup));
            }
            const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
              method: 'POST',
              headers: retryForm.getHeaders(),
              body: retryForm.getBuffer()
            });
            resultData = await retryRes.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            if (!hasShortCaption && fullHtmlText) {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: channel,
                  text: fullHtmlText,
                  parse_mode: 'HTML',
                  reply_markup: replyMarkup,
                  disable_web_page_preview: !linkPreviewEnabled,
                  link_preview_options: { is_disabled: !linkPreviewEnabled }
                })
              });
            }
          }
        }

        if (!sendSuccess) {
          const publicVideoUrl = await resolvePublicUrl(targetUrl);
          const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              video: publicVideoUrl,
              caption: captionToSend || undefined,
              parse_mode: captionToSend ? 'HTML' : undefined,
              reply_markup: (hasShortCaption && replyMarkup) ? replyMarkup : undefined
            })
          });
          resultData = await res.json();
          if (resultData.ok) sendSuccess = true;
        }
      }

      // -------------------------------------------------------------
      // 4. VOICE MESSAGE ATTACHMENT (Telegram Voice OGG Opus)
      // -------------------------------------------------------------
      else if (((attachmentType as string) === 'voice' || (attachmentType === 'audio' && ((options as any)?.audioFormat === 'voice' || (dayRequest as any)?.audioFormat === 'voice' || (dayRequest as any)?.audio_format === 'voice'))) && (rawAttachmentUrl || rawAttachmentUrls.length > 0)) {
        const targetUrl = rawAttachmentUrl || rawAttachmentUrls[0];
        const mediaFile = await fetchMediaBuffer(targetUrl);

        if (mediaFile) {
          // Auto-convert to OGG Opus via ffmpeg
          const voiceBuffer = await convertAudioToTelegramVoice(mediaFile.buffer);

          const form = new FormData();
          form.append('chat_id', channel);
          form.append('voice', voiceBuffer, { filename: 'voice.ogg', contentType: 'audio/ogg' });
          if (captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'HTML');
          }
          if (hasShortCaption && replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }

          const res = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, {
            method: 'POST',
            headers: form.getHeaders(),
            body: form.getBuffer()
          });
          resultData = await res.json();
          if (resultData.ok) {
            sendSuccess = true;
            if (!hasShortCaption && fullHtmlText) {
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    text: fullHtmlText,
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup
                  })
                });
              } catch (e) {}
            }
          }
        }

        // Fallback to sendAudio if sendVoice fails
        if (!sendSuccess) {
          const publicAudioUrl = await resolvePublicUrl(targetUrl);
          const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              audio: publicAudioUrl,
              caption: captionToSend || undefined,
              parse_mode: captionToSend ? 'HTML' : undefined,
              reply_markup: (hasShortCaption && replyMarkup) ? replyMarkup : undefined
            })
          });
          resultData = await res.json();
          if (resultData.ok) sendSuccess = true;
        }
      }

      // -------------------------------------------------------------
      // 5. AUDIO ATTACHMENT (Multiple up to 10 or Single)
      // -------------------------------------------------------------
      else if (attachmentType === 'audio' && (rawAttachmentUrl || rawAttachmentUrls.length > 0)) {
        const urlsToProcess = (rawAttachmentUrls.length > 0 ? rawAttachmentUrls : [rawAttachmentUrl]).filter(u => Boolean(u && typeof u === 'string' && u.trim()));
        const mediaBuffers = await Promise.all(urlsToProcess.slice(0, 10).map(u => fetchMediaBuffer(u)));
        const validBuffers = mediaBuffers.filter(b => b !== null) as { buffer: Buffer; filename: string; contentType: string; mediaType: 'photo' | 'video' | 'audio' | 'document' }[];

        // If multiple audio tracks (>= 2), group into an album (sendMediaGroup type: 'audio')
        if (validBuffers.length >= 2) {
          const form = new FormData();
          form.append('chat_id', channel);

          const mediaArray = validBuffers.map((item, idx) => {
            const fieldName = `audio_${idx}`;
            const safeName = item.filename || `track_${idx + 1}.mp3`;
            form.append(fieldName, item.buffer, { 
              filename: safeName, 
              contentType: item.contentType || 'audio/mpeg' 
            });
            return {
              type: 'audio',
              media: `attach://${fieldName}`,
              caption: idx === 0 && hasShortCaption ? captionToSend : undefined,
              parse_mode: idx === 0 && hasShortCaption ? 'HTML' : undefined
            };
          });

          form.append('media', JSON.stringify(mediaArray));

          const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
            method: 'POST',
            headers: form.getHeaders(),
            body: form.getBuffer()
          });
          resultData = await res.json();

          // Retry without HTML if entity error
          if (!resultData.ok && resultData.description && (resultData.description.includes('entities') || resultData.description.includes('tag') || resultData.description.includes('HTML'))) {
            const retryForm = new FormData();
            retryForm.append('chat_id', channel);
            const plainCaption = hasShortCaption ? stripHTML(captionToSend) : undefined;
            const retryMedia = validBuffers.map((item, idx) => {
              const fieldName = `audio_${idx}`;
              const safeName = item.filename || `track_${idx + 1}.mp3`;
              retryForm.append(fieldName, item.buffer, { 
                filename: safeName, 
                contentType: item.contentType || 'audio/mpeg' 
              });
              return {
                type: 'audio',
                media: `attach://${fieldName}`,
                caption: idx === 0 ? plainCaption : undefined
              };
            });
            retryForm.append('media', JSON.stringify(retryMedia));
            const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
              method: 'POST',
              headers: retryForm.getHeaders(),
              body: retryForm.getBuffer()
            });
            resultData = await retryRes.json();
          }

          // Fallback: If sendMediaGroup failed for audio album, send ALL tracks sequentially via sendAudio
          if (!resultData.ok && validBuffers.length > 0) {
            console.warn(`[sendMediaGroup] Audio group failed (${resultData?.description}), sequentially sending all ${validBuffers.length} audio tracks.`);
            let sentCount = 0;
            for (let idx = 0; idx < validBuffers.length; idx++) {
              const item = validBuffers[idx];
              const isShort = idx === 0 && hasShortCaption;
              const safeName = item.filename || `track_${idx + 1}.mp3`;
              const mime = item.contentType || 'audio/mpeg';
              const subForm = new FormData();
              subForm.append('chat_id', channel);
              subForm.append('audio', item.buffer, { filename: safeName, contentType: mime });
              if (isShort && captionToSend) {
                subForm.append('caption', captionToSend);
                subForm.append('parse_mode', 'HTML');
              }
              if (isShort && replyMarkup) {
                subForm.append('reply_markup', JSON.stringify(replyMarkup));
              }

              let subRes = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
                method: 'POST',
                headers: subForm.getHeaders(),
                body: subForm.getBuffer()
              });
              let subData = await subRes.json();

              // If sendAudio failed, retry as sendDocument
              if (!subData.ok) {
                const docForm = new FormData();
                docForm.append('chat_id', channel);
                docForm.append('document', item.buffer, { filename: safeName, contentType: mime });
                if (isShort && captionToSend) {
                  docForm.append('caption', captionToSend);
                  docForm.append('parse_mode', 'HTML');
                }
                const docRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
                  method: 'POST',
                  headers: docForm.getHeaders(),
                  body: docForm.getBuffer()
                });
                subData = await docRes.json();
              }

              if (subData.ok) {
                sentCount++;
                if (idx === 0) lastMessageId = String(subData.result?.message_id || '1');
              }
            }

            if (sentCount > 0) {
              sendSuccess = true;
              resultData = { ok: true, fallback: true };
            }
          }

          if (resultData.ok) {
            sendSuccess = true;
            if (!hasShortCaption || (replyMarkup && replyMarkup.inline_keyboard.length > 0)) {
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    text: fullHtmlText || 'Аудиозаписи:',
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup
                  })
                });
              } catch (e) {}
            }
          }
        }

        // If single audio (1 track) or fallback if sendMediaGroup failed
        if (!sendSuccess && validBuffers.length > 0) {
          let sentCount = 0;
          for (let idx = 0; idx < validBuffers.length; idx++) {
            const item = validBuffers[idx];
            const isShort = idx === 0 && hasShortCaption;
            const form = new FormData();
            form.append('chat_id', channel);
            form.append('audio', item.buffer, { filename: item.filename, contentType: item.contentType || 'audio/mpeg' });
            if (isShort && captionToSend) {
              form.append('caption', captionToSend);
              form.append('parse_mode', 'HTML');
            }
            if (isShort && replyMarkup) {
              form.append('reply_markup', JSON.stringify(replyMarkup));
            }

            const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
              method: 'POST',
              headers: form.getHeaders(),
              body: form.getBuffer()
            });
            const data = await res.json();
            if (data.ok) {
              sentCount++;
              if (idx === 0) lastMessageId = String(data.result?.message_id || '1');
            }
          }

          if (sentCount > 0) {
            sendSuccess = true;
            if (!hasShortCaption && fullHtmlText) {
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    text: fullHtmlText,
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup
                  })
                });
              } catch (e) {}
            }
          }
        }

        // Direct URL fallback (send ALL audio URLs)
        if (!sendSuccess && urlsToProcess.length > 0) {
          let sentCount = 0;
          for (let idx = 0; idx < urlsToProcess.length; idx++) {
            const isShort = idx === 0 && hasShortCaption;
            const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: channel,
                audio: urlsToProcess[idx],
                caption: isShort ? (captionToSend || undefined) : undefined,
                parse_mode: isShort && captionToSend ? 'HTML' : undefined,
                reply_markup: (isShort && replyMarkup) ? replyMarkup : undefined
              })
            });
            const data = await res.json();
            if (data.ok) {
              sentCount++;
              if (idx === 0) lastMessageId = String(data.result?.message_id || '1');
            }
          }
          if (sentCount > 0) {
            sendSuccess = true;
            resultData = { ok: true };
          }
        }
      }

      // -------------------------------------------------------------
      // 6. DOCUMENT ATTACHMENT (Multiple up to 10 or Single)
      // -------------------------------------------------------------
      else if (attachmentType === 'document' && (rawAttachmentUrl || rawAttachmentUrls.length > 0)) {
        const urlsToProcess = rawAttachmentUrls.length > 0 ? rawAttachmentUrls : [rawAttachmentUrl];
        const mediaBuffers = await Promise.all(urlsToProcess.slice(0, 10).map(u => fetchMediaBuffer(u)));
        const validBuffers = mediaBuffers.filter(b => b !== null) as { buffer: Buffer; filename: string; contentType: string }[];

        // If multiple documents (2..10), send via sendMediaGroup
        if (validBuffers.length >= 2) {
          const form = new FormData();
          form.append('chat_id', channel);

          const mediaArray = validBuffers.map((item, idx) => {
            const fieldName = `doc_${idx}`;
            form.append(fieldName, item.buffer, { 
              filename: item.filename || `document_${idx + 1}.bin`, 
              contentType: item.contentType || 'application/octet-stream' 
            });
            return {
              type: 'document',
              media: `attach://${fieldName}`,
              caption: idx === 0 && hasShortCaption ? captionToSend : undefined,
              parse_mode: idx === 0 && hasShortCaption ? 'HTML' : undefined
            };
          });

          form.append('media', JSON.stringify(mediaArray));

          const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
            method: 'POST',
            headers: form.getHeaders(),
            body: form.getBuffer()
          });
          resultData = await res.json();

          if (resultData.ok) {
            sendSuccess = true;
            if (!hasShortCaption || (replyMarkup && replyMarkup.inline_keyboard.length > 0)) {
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    text: fullHtmlText || 'Документы и файлы:',
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup
                  })
                });
              } catch (e) {}
            }
          }
        }

        // If single document or fallback
        if (!sendSuccess && validBuffers.length > 0) {
          const firstDoc = validBuffers[0];
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('document', firstDoc.buffer, { filename: firstDoc.filename, contentType: firstDoc.contentType });
          if (captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'HTML');
          }
          if (hasShortCaption && replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }

          const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
            method: 'POST',
            headers: form.getHeaders(),
            body: form.getBuffer()
          });
          resultData = await res.json();
          if (resultData.ok) {
            sendSuccess = true;
            // Send remaining files sequentially
            for (let i = 1; i < validBuffers.length; i++) {
              try {
                const extraForm = new FormData();
                extraForm.append('chat_id', channel);
                extraForm.append('document', validBuffers[i].buffer, { 
                  filename: validBuffers[i].filename, 
                  contentType: validBuffers[i].contentType 
                });
                await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
                  method: 'POST',
                  headers: extraForm.getHeaders(),
                  body: extraForm.getBuffer()
                });
              } catch (e) {}
            }
            if (!hasShortCaption && fullHtmlText) {
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    text: fullHtmlText,
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup
                  })
                });
              } catch (e) {}
            }
          }
        }

        // Direct URL fallback
        if (!sendSuccess) {
          const publicDocUrl = await resolvePublicUrl(urlsToProcess[0]);
          const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              document: publicDocUrl,
              caption: captionToSend || undefined,
              parse_mode: captionToSend ? 'HTML' : undefined,
              reply_markup: (hasShortCaption && replyMarkup) ? replyMarkup : undefined
            })
          });
          resultData = await res.json();
          if (resultData.ok) sendSuccess = true;
        }
      }

      // -------------------------------------------------------------
      // 7. VIDEO NOTE (Кружок с ffmpeg авто-кропом 1:1)
      // -------------------------------------------------------------
      else if (attachmentType === 'video_note' && (rawAttachmentUrl || rawAttachmentUrls.length > 0)) {
        const targetUrl = rawAttachmentUrl || rawAttachmentUrls[0];
        const mediaFile = await fetchMediaBuffer(targetUrl);
        if (mediaFile) {
          // Auto crop to 1:1 square MP4 H.264
          const convertedVideoNoteBuffer = await convertVideoToTelegramVideoNote(mediaFile.buffer);

          const form = new FormData();
          form.append('chat_id', channel);
          form.append('video_note', convertedVideoNoteBuffer, { filename: 'video_note.mp4', contentType: 'video/mp4' });
          if (replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }
          const res = await fetch(`https://api.telegram.org/bot${token}/sendVideoNote`, {
            method: 'POST',
            headers: form.getHeaders(),
            body: form.getBuffer()
          });
          resultData = await res.json();

          // Fallback: If Telegram rejects video_note (e.g. format restriction), send as video
          if (!resultData.ok) {
            console.warn('[sendVideoNote] Telegram rejected video note, falling back to sendVideo:', resultData.description);
            const fallbackForm = new FormData();
            fallbackForm.append('chat_id', channel);
            fallbackForm.append('video', mediaFile.buffer, { filename: mediaFile.filename || 'video.mp4', contentType: 'video/mp4' });
            if (captionToSend) {
              fallbackForm.append('caption', captionToSend);
              fallbackForm.append('parse_mode', 'HTML');
            }
            if (hasShortCaption && replyMarkup) {
              fallbackForm.append('reply_markup', JSON.stringify(replyMarkup));
            }
            const fbRes = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
              method: 'POST',
              headers: fallbackForm.getHeaders(),
              body: fallbackForm.getBuffer()
            });
            resultData = await fbRes.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            if (fullHtmlText && fullHtmlText.trim()) {
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    text: fullHtmlText,
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup,
                    disable_web_page_preview: !linkPreviewEnabled,
                    link_preview_options: { is_disabled: !linkPreviewEnabled }
                  })
                });
              } catch (e) {}
            }
          }
        }
      }

      // -------------------------------------------------------------
      // 7. STANDARD TEXT MESSAGE (Only for text posts or fallback)
      // -------------------------------------------------------------
      if (!sendSuccess && attachmentType === 'none') {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channel,
            text: fullHtmlText || 'Новая публикация',
            parse_mode: 'HTML',
            reply_markup: replyMarkup,
            disable_web_page_preview: !linkPreviewEnabled,
            link_preview_options: {
              is_disabled: !linkPreviewEnabled
            }
          })
        });
        resultData = await res.json();

        // If BUTTON_TYPE_INVALID error (e.g. web_app in channel), retry with web_app converted to url
        if (!resultData.ok && (resultData.description?.includes('BUTTON_TYPE_INVALID') || resultData.description?.includes('BUTTON_URL_INVALID'))) {
          const urlFallbackMarkup = buildReplyMarkup(inlineButtons, true);
          const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              text: fullHtmlText || 'Новая публикация',
              parse_mode: 'HTML',
              reply_markup: urlFallbackMarkup,
              disable_web_page_preview: !linkPreviewEnabled,
              link_preview_options: {
                is_disabled: !linkPreviewEnabled
              }
            })
          });
          resultData = await retryRes.json();
        }

        // If parse error in HTML, retry with stripped plain text
        if (!resultData.ok && (resultData.description?.includes('can\'t parse entities') || resultData.description?.includes('tag'))) {
          const fallbackText = stripHTML(rawText) || 'Новая публикация';
          const plainRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              text: fallbackText,
              reply_markup: replyMarkup,
              disable_web_page_preview: !linkPreviewEnabled,
              link_preview_options: {
                is_disabled: !linkPreviewEnabled
              }
            })
          });
          resultData = await plainRes.json();
        }

        if (resultData.ok) sendSuccess = true;
      }

      if (sendSuccess && resultData?.ok) {
        lastMessageId = Array.isArray(resultData.result) 
          ? resultData.result[0]?.message_id?.toString() 
          : resultData.result?.message_id?.toString() || '1';
        successChannels.push(channel);
      } else {
        const errorDesc = resultData?.description || 'Ошибка Telegram API';
        errors.push(`Ошибка для ${channel}: ${errorDesc}`);
      }
    } catch (err: any) {
      errors.push(`Ошибка сети для ${channel}: ${err.message || err}`);
    }
  }

  if (successChannels.length > 0) {
    return {
      ok: true,
      messageId: lastMessageId,
      channel: successChannels.join(', '),
      simulated: false,
      fallbackNotice: errors.length > 0 ? `Частичная отправка. Ошибки: ${errors.join('; ')}` : undefined
    };
  } else {
    return {
      ok: false,
      error: errors.join('; ') || 'Не удалось отправить ни в один канал',
      simulated: false
    };
  }
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
