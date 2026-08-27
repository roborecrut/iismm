import path from 'path';
import fs from 'fs';
import os from 'os';
import util from 'util';
import { execFile } from 'child_process';
import { DB } from './db';
import { getSQLiteDB } from './sqlite';
import { fixUtf8Filename } from './db/filesTable';

const execFileAsync = util.promisify(execFile);

export interface TelegramSendResponse {
  ok: boolean;
  messageId?: string;
  channel?: string;
  error?: string;
  simulated?: boolean;
  fallbackNotice?: string;
}

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

// Helper to clean filenames for FormData headers in Telegram Bot API while preserving original name (UTF-8 / Cyrillic)
export function toSafeFilename(originalName: string, defaultExt: string = 'bin', prefix: string = 'file'): string {
  if (!originalName || typeof originalName !== 'string') {
    return `${prefix}_${Date.now()}.${defaultExt}`;
  }
  let clean = fixUtf8Filename(originalName).trim();
  clean = clean.replace(/[\0\r\n\t"]/g, '').replace(/[\/\\]+/g, '_');
  clean = clean.replace(/[?#].*$/, '');
  if (!clean || clean === '.' || clean === '_') {
    return `${prefix}_${Date.now()}.${defaultExt}`;
  }
  if (!clean.includes('.')) {
    clean = `${clean}.${defaultExt}`;
  }
  return clean;
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
    // PNG: 89 50 4E 47
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

  const safeFilename = toSafeFilename(fallbackName, ext, mediaType);
  return { ext, contentType, mediaType, safeFilename };
}

// Helper to fetch media from local storage, pro-talk or external URL into Buffer
export async function fetchMediaBuffer(
  urlStr: string,
  fallbackFilename: string = 'media.bin',
  forcedContentType?: string
): Promise<{ buffer: Buffer; filename: string; contentType: string; mediaType: 'photo' | 'video' | 'audio' | 'document' } | null> {
  if (!urlStr || typeof urlStr !== 'string') return null;

  try {
    let fetchUrl = urlStr.trim();
    const trimmed = fetchUrl;
    let fallbackName = fallbackFilename;
    let fallbackContentType = forcedContentType || 'application/octet-stream';

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
      trimmed,
      path.join(process.cwd(), 'dist', trimmed.replace(/^\.?\//, '')),
      path.join(process.cwd(), 'public', trimmed.replace(/^\.?\//, '')),
      path.join(process.cwd(), trimmed.replace(/^\.?\//, ''))
    ];

    for (const lp of possibleLocalPaths) {
      if (fs.existsSync(lp) && fs.statSync(lp).isFile()) {
        const buffer = await fs.promises.readFile(lp);
        const detected = detectBufferMediaMeta(buffer, fallbackName || path.basename(lp), fallbackContentType);
        return { buffer, filename: detected.safeFilename, contentType: detected.contentType, mediaType: detected.mediaType };
      }
    }

    // 3. Check SQLite file_storage for /file/... or /f/... URLs
    const fileMatch = trimmed.match(/(?:\/|^)(?:file|f)\/([a-zA-Z0-9_-]+)/i);
    if (fileMatch) {
      const searchKey = fileMatch[1];
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
              if (row.name) fallbackName = fixUtf8Filename(row.name);
              if (row.mime_type) fallbackContentType = row.mime_type;
            }
          }
          if (stmt) stmt.free();
        }
      } catch (e) {
        console.warn('[fetchMediaBuffer] SQLite lookup error:', e);
      }

      if (fetchUrl === trimmed) {
        try {
          const legacy = DB.getFileByShortKey(searchKey);
          if (legacy && legacy.fullUrl) {
            fetchUrl = legacy.fullUrl;
            if (legacy.name) fallbackName = fixUtf8Filename(legacy.name);
            if (legacy.mimeType) fallbackContentType = legacy.mimeType;
          }
        } catch (e) {}
      }
    } else {
      try {
        const db = await getSQLiteDB();
        if (db) {
          const stmt = db.prepare(`SELECT name, mime_type FROM file_storage WHERE original_url = ? OR original_url LIKE ? LIMIT 1`);
          stmt.bind([trimmed, `%${trimmed}%`]);
          if (stmt.step()) {
            const row = stmt.getAsObject() as any;
            if (row.name) fallbackName = fixUtf8Filename(row.name);
            if (row.mime_type) fallbackContentType = row.mime_type;
          }
          stmt.free();
        }
      } catch (e) {}
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
        if (!rawUrl || rawUrl === 'https://' || rawUrl === 'http://') {
          btnObj.callback_data = String(btn.callbackData || btn.text || 'btn_action').slice(0, 64);
        } else {
          btnObj.url = rawUrl;
        }
      } else {
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
