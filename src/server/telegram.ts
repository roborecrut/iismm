import FormData from 'form-data';
import { DB, DayRequest } from './db';
import { getBotTokenFromSQLite, getSQLiteDB } from './sqlite';
import { InlineButton } from '../types';

interface TelegramSendResponse {
  ok: boolean;
  messageId?: string;
  channel?: string;
  error?: string;
  simulated?: boolean;
  fallbackNotice?: string;
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

  // Calculate column widths
  const colCount = Math.max(...rows.map(r => r.length));
  const colWidths = new Array(colCount).fill(0);

  rows.forEach(r => {
    r.forEach((c, idx) => {
      if (c.length > colWidths[idx]) colWidths[idx] = Math.min(c.length, 30);
    });
  });

  // Build aligned text table inside <pre>
  const formattedRows = rows.map(r => {
    return r.map((cell, idx) => {
      const w = colWidths[idx] || 10;
      return cell.padEnd(w, ' ');
    }).join(' | ');
  });

  return `<pre>\n${formattedRows.join('\n')}\n</pre>`;
}

// Convert rich markdown text to Telegram HTML for Rich mode
export function convertRichToTelegramHTML(text: string): string {
  if (!text) return '';

  let html = text;

  // 1. Custom Emoji: ![alt](tg://emoji?id=12345) -> <tg-emoji emoji-id="12345">alt</tg-emoji>
  html = html.replace(/!\[(.*?)\]\(tg:\/\/emoji\?id=(\d+)\)/gi, (_, alt, id) => {
    return `<tg-emoji emoji-id="${id}">${alt || '✨'}</tg-emoji>`;
  });

  // 2. Telegram Time: <tg-time unix="123" format="wDT">Label</tg-time> -> keep label
  html = html.replace(/<tg-time.*?unix=["'](\d+)["'].*?>(.*?)<\/tg-time>/gi, '$2');

  // 3. Collapsible / Details: <details><summary>S</summary>C</details>
  html = html.replace(/<details.*?>\s*<summary>(.*?)<\/summary>([\s\S]*?)<\/details>/gi, '<b>$1</b>\n<blockquote expandable>$2</blockquote>');

  // 4. Tables in Markdown (Rich mode)
  html = html.replace(/(?:^|\n)(\|.+?\|\n\|[\s\-:|]+\|\n(?:\|.+?\|(?:\n|$))+)/g, (match) => {
    return '\n' + formatMarkdownTableForTelegram(match) + '\n';
  });

  // 5. Code blocks: ```lang\ncode\n``` -> <pre><code class="language-lang">code</code></pre>
  html = html.replace(/```([a-zA-Z0-9_\-]+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const cleanCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return lang ? `<pre><code class="language-${lang}">${cleanCode}</code></pre>` : `<pre>${cleanCode}</pre>`;
  });

  // 6. Spoilers: ||text|| -> <tg-spoiler>text</tg-spoiler>
  html = html.replace(/\|\|([\s\S]+?)\|\|/g, '<tg-spoiler>$1</tg-spoiler>');

  // 7. Checklists & Lists
  html = html.replace(/^[\-\*]\s+\[\s*\]\s+(.+)$/gim, '☐ $1');
  html = html.replace(/^[\-\*]\s+\[[xX]\]\s+(.+)$/gim, '✓ <s>$1</s>');
  html = html.replace(/^[\-\*]\s+(.+)$/gim, '• $1');

  // 8. Headings: # Heading -> <b>HEADING</b>
  html = html.replace(/^####\s+(.+)$/gim, '<b>$1</b>');
  html = html.replace(/^###\s+(.+)$/gim, '<b>$1</b>');
  html = html.replace(/^##\s+(.+)$/gim, '<b>$1</b>');
  html = html.replace(/^#\s+(.+)$/gim, '<b>$1</b>');

  // Underline: __text__ or <u>text</u>
  html = html.replace(/__([^_]+)__/g, '<u>$1</u>');
  // Bold: **text**
  html = html.replace(/\*\*([^\*\n]+)\*\*/g, '<b>$1</b>');
  // Strikethrough: ~~text~~
  html = html.replace(/~~([^~\n]+)~~/g, '<s>$1</s>');
  // Italic: *text* or _text_
  html = html.replace(/\*([^\*\n]+)\*/g, '<i>$1</i>');
  html = html.replace(/_([^_\n]+)_/g, '<i>$1</i>');

  // Links: [label](url) -> <a href="url">label</a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Code inline: `code` -> <code>code</code>
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Blockquotes: > quote -> <blockquote>quote</blockquote>
  html = html.replace(/^>\s?(.*$)/gim, '<blockquote>$1</blockquote>');

  return html;
}

// Convert/Validate text for Telegram HTML (Rich/HTML mode) or MarkdownV2
export function convertToTelegramHTML(text: string, format: string = 'v2'): string {
  if (format === 'rich' || format === 'html') {
    return convertRichToTelegramHTML(text);
  }
  return text;
}

// Auto-escape unescaped Markdown V2 characters
export function sanitizeMarkdownV2(text: string): string {
  if (!text) return '';
  // Escapes reserved chars that are not already preceded by a backslash
  return text.replace(/(?<!\\)([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// Strip HTML tags for fallback
function stripHTML(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}

// Helper to fetch media file into buffer
export async function fetchMediaBuffer(urlStr: string): Promise<{ buffer: Buffer; filename: string; contentType: string } | null> {
  if (!urlStr || typeof urlStr !== 'string') return null;
  const trimmed = urlStr.trim();
  if (!trimmed) return null;

  try {
    // 1. Data URI
    if (trimmed.startsWith('data:')) {
      const commaIdx = trimmed.indexOf(',');
      if (commaIdx !== -1) {
        const meta = trimmed.substring(0, commaIdx);
        const base64Data = trimmed.substring(commaIdx + 1);
        const mimeMatch = meta.match(/data:(.*?);/);
        const contentType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = contentType.split('/')[1]?.split('+')[0] || 'bin';
        return { buffer, filename: `file.${ext}`, contentType };
      }
    }

    // 2. Resolve short URLs or SQLite URLs
    let fetchUrl = trimmed;
    try {
      const db = await getSQLiteDB();
      if (db) {
        const match = trimmed.match(/f\/([a-zA-Z0-9_-]+)/) || trimmed.match(/file\/([a-zA-Z0-9_-]+)/);
        const searchKey = match ? match[1] : trimmed;
        const res = db.exec("SELECT original_url, name, mime_type FROM file_storage WHERE file_key = ? OR short_url LIKE ? OR name = ? LIMIT 1", [searchKey, `%${searchKey}%`, searchKey]);
        if (res.length > 0 && res[0].values.length > 0) {
          const row = res[0].values[0];
          if (row[0] && typeof row[0] === 'string' && (row[0].startsWith('http://') || row[0].startsWith('https://'))) {
            fetchUrl = row[0];
          }
        }
      }
    } catch (e) {}

    // If still relative path (e.g. /file/... or /api/...), prefix with localhost
    if (fetchUrl.startsWith('/')) {
      fetchUrl = `http://127.0.0.1:3000${fetchUrl}`;
    }

    // Download via fetch
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'TelegramBot (like TwitterBot)',
        'Accept': '*/*'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.warn(`[fetchMediaBuffer] HTTP ${response.status} from ${fetchUrl}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuf = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    // Determine filename
    let filename = 'media.bin';
    try {
      const urlObj = new URL(fetchUrl);
      const pathname = urlObj.pathname;
      const lastPart = pathname.split('/').pop();
      if (lastPart && lastPart.includes('.')) {
        filename = decodeURIComponent(lastPart);
      } else {
        const ext = contentType.includes('png') ? 'png' :
                    contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' :
                    contentType.includes('gif') ? 'gif' :
                    contentType.includes('mp4') ? 'mp4' :
                    contentType.includes('webm') ? 'webm' :
                    contentType.includes('audio') || contentType.includes('mp3') ? 'mp3' :
                    contentType.includes('ogg') ? 'ogg' :
                    contentType.includes('pdf') ? 'pdf' : 'bin';
        filename = `file_${Date.now()}.${ext}`;
      }
    } catch (e) {
      filename = `media_${Date.now()}.bin`;
    }

    return { buffer, filename, contentType };
  } catch (err: any) {
    console.warn(`[fetchMediaBuffer] Error fetching ${urlStr}:`, err.message);
    return null;
  }
}

// Build reply_markup for inline keyboard
function buildReplyMarkup(
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
      if (btnUrl && !btnUrl.startsWith('http://') && !btnUrl.startsWith('https://') && !btnUrl.startsWith('tg://')) {
        btnUrl = `https://${btnUrl}`;
      }

      const btnObj: any = { text };

      if (btn.type === 'webapp') {
        const validWebUrl = btnUrl || 'https://t.me';
        if (fallbackWebappToUrl) {
          btnObj.url = validWebUrl;
        } else {
          // Standard Telegram Mini App format
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
  const isV2 = format === 'v2';
  const isRich = format === 'rich' || format === 'html';
  const uppercaseHeader = options?.uppercaseHeader !== false;
  const signature = options?.signature || dayRequest.signature || '';
  const attachmentType = options?.attachmentType || dayRequest.attachmentType || 'none';
  
  const rawAttachmentUrl = (options?.attachmentUrl || dayRequest.attachmentUrl || '').trim();
  const rawAttachmentUrls = (options?.attachmentUrls || dayRequest.attachmentUrls || []).map(u => (u || '').trim()).filter(Boolean);
  const inlineButtons = options?.inlineButtons || dayRequest.inlineButtons || [];

  const formattedTitle = uppercaseHeader ? title.toUpperCase() : title;

  let rawText = content !== undefined && content !== null ? content : '';
  if (!rawText && formattedTitle) {
    rawText = formattedTitle;
  }

  if (signature && signature.trim()) {
    rawText = `${rawText}\n\n${signature.trim()}`;
  }

  // Determine parseMode and formatted text based on format
  const parseMode = isV2 ? 'MarkdownV2' : 'HTML';
  const formattedText = isRich ? convertRichToTelegramHTML(rawText) : rawText;

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

      const hasShortCaption = formattedText.length <= 1024;
      const captionToSend = hasShortCaption ? formattedText : '';

      // -------------------------------------------------------------
      // 1. ALBUM ATTACHMENTS (Multiple Photos / Videos)
      // -------------------------------------------------------------
      if (attachmentType === 'album' && (rawAttachmentUrls.length > 0 || rawAttachmentUrl)) {
        const urlsToProcess = rawAttachmentUrls.length > 0 ? rawAttachmentUrls : [rawAttachmentUrl];
        const mediaBuffers = await Promise.all(urlsToProcess.slice(0, 10).map(u => fetchMediaBuffer(u)));
        const validBuffers = mediaBuffers.filter(b => b !== null) as { buffer: Buffer; filename: string; contentType: string }[];

        if (validBuffers.length > 0) {
          const form = new FormData();
          form.append('chat_id', channel);

          const mediaArray = validBuffers.map((item, idx) => {
            const fieldName = `file_${idx}`;
            form.append(fieldName, item.buffer, { filename: item.filename, contentType: item.contentType });
            const isVideo = item.filename.match(/\.(mp4|mov|avi|webm)$/i) || item.contentType.includes('video');
            return {
              type: isVideo ? 'video' : 'photo',
              media: `attach://${fieldName}`,
              caption: idx === 0 && hasShortCaption ? captionToSend : undefined,
              parse_mode: idx === 0 && hasShortCaption ? parseMode : undefined
            };
          });

          form.append('media', JSON.stringify(mediaArray));

          const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
            method: 'POST',
            headers: form.getHeaders(),
            body: form.getBuffer()
          });
          resultData = await res.json();

          // Retry with sanitized caption if entity error
          if (!resultData.ok && (resultData.description?.includes('can\'t parse entities') || resultData.description?.includes('entity'))) {
            const plainCaption = isV2 ? sanitizeMarkdownV2(captionToSend) : stripHTML(captionToSend);
            const retryForm = new FormData();
            retryForm.append('chat_id', channel);
            const retryMediaArray = validBuffers.map((item, idx) => {
              const fieldName = `file_${idx}`;
              retryForm.append(fieldName, item.buffer, { filename: item.filename, contentType: item.contentType });
              const isVideo = item.filename.match(/\.(mp4|mov|avi|webm)$/i) || item.contentType.includes('video');
              return {
                type: isVideo ? 'video' : 'photo',
                media: `attach://${fieldName}`,
                caption: idx === 0 && plainCaption ? plainCaption : undefined,
                parse_mode: idx === 0 && plainCaption ? parseMode : undefined
              };
            });
            retryForm.append('media', JSON.stringify(retryMediaArray));
            const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
              method: 'POST',
              headers: retryForm.getHeaders(),
              body: retryForm.getBuffer()
            });
            resultData = await retryRes.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            // Send follow-up message if text > 1024 chars or if inline buttons exist (sendMediaGroup does not support inline keyboards directly)
            if (!hasShortCaption || (replyMarkup && replyMarkup.inline_keyboard.length > 0)) {
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    text: formattedText || 'Подробнее:',
                    parse_mode: parseMode,
                    reply_markup: replyMarkup
                  })
                });
              } catch (e) {}
            }
          }
        }

        // Direct URL fallback for album if buffers failed
        if (!sendSuccess && urlsToProcess.length > 0) {
          const mediaArray = urlsToProcess.slice(0, 10).map((u, idx) => {
            const isVideo = Boolean(u.match(/\.(mp4|mov|avi|webm)$/i));
            return {
              type: isVideo ? 'video' : 'photo',
              media: u,
              caption: idx === 0 && hasShortCaption ? captionToSend : undefined,
              parse_mode: idx === 0 && hasShortCaption ? parseMode : undefined
            };
          });

          const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              media: mediaArray
            })
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
                    text: formattedText || 'Подробнее:',
                    parse_mode: parseMode,
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
            form.append('parse_mode', parseMode);
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
              retryForm.append('parse_mode', parseMode);
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

          // Retry if entity parse error
          if (!resultData.ok && (resultData.description?.includes('can\'t parse entities') || resultData.description?.includes('tag'))) {
            const safeCaption = isV2 ? sanitizeMarkdownV2(captionToSend) : stripHTML(captionToSend);
            const retryForm = new FormData();
            retryForm.append('chat_id', channel);
            retryForm.append('photo', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
            if (safeCaption) {
              retryForm.append('caption', safeCaption);
              retryForm.append('parse_mode', parseMode);
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
            if (!hasShortCaption && formattedText) {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: channel, text: formattedText, parse_mode: parseMode, reply_markup: replyMarkup })
              });
            }
          }
        }

        // Fallback to sending URL directly if buffer failed
        if (!sendSuccess) {
          const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              photo: targetUrl,
              caption: captionToSend || undefined,
              parse_mode: captionToSend ? parseMode : undefined,
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
                photo: targetUrl,
                caption: captionToSend || undefined,
                parse_mode: captionToSend ? parseMode : undefined,
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
            form.append('parse_mode', parseMode);
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
              retryForm.append('parse_mode', parseMode);
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
            if (!hasShortCaption && formattedText) {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: channel, text: formattedText, parse_mode: parseMode, reply_markup: replyMarkup })
              });
            }
          }
        }

        if (!sendSuccess) {
          const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              video: targetUrl,
              caption: captionToSend || undefined,
              parse_mode: captionToSend ? parseMode : undefined,
              reply_markup: (hasShortCaption && replyMarkup) ? replyMarkup : undefined
            })
          });
          resultData = await res.json();
          if (resultData.ok) sendSuccess = true;
        }
      }

      // -------------------------------------------------------------
      // 4. AUDIO ATTACHMENT
      // -------------------------------------------------------------
      else if (attachmentType === 'audio' && (rawAttachmentUrl || rawAttachmentUrls.length > 0)) {
        const targetUrl = rawAttachmentUrl || rawAttachmentUrls[0];
        const mediaFile = await fetchMediaBuffer(targetUrl);

        if (mediaFile) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('audio', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
          if (captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', parseMode);
          }
          if (hasShortCaption && replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }

          const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
            method: 'POST',
            headers: form.getHeaders(),
            body: form.getBuffer()
          });
          resultData = await res.json();
          if (resultData.ok) sendSuccess = true;
        }

        if (!sendSuccess) {
          const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              audio: targetUrl,
              caption: captionToSend || undefined,
              parse_mode: captionToSend ? parseMode : undefined,
              reply_markup: (hasShortCaption && replyMarkup) ? replyMarkup : undefined
            })
          });
          resultData = await res.json();
          if (resultData.ok) sendSuccess = true;
        }
      }

      // -------------------------------------------------------------
      // 5. DOCUMENT ATTACHMENT
      // -------------------------------------------------------------
      else if (attachmentType === 'document' && (rawAttachmentUrl || rawAttachmentUrls.length > 0)) {
        const targetUrl = rawAttachmentUrl || rawAttachmentUrls[0];
        const mediaFile = await fetchMediaBuffer(targetUrl);

        if (mediaFile) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('document', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
          if (captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', parseMode);
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
          if (resultData.ok) sendSuccess = true;
        }

        if (!sendSuccess) {
          const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              document: targetUrl,
              caption: captionToSend || undefined,
              parse_mode: captionToSend ? parseMode : undefined,
              reply_markup: (hasShortCaption && replyMarkup) ? replyMarkup : undefined
            })
          });
          resultData = await res.json();
          if (resultData.ok) sendSuccess = true;
        }
      }

      // -------------------------------------------------------------
      // 6. VIDEO NOTE (Кружок)
      // -------------------------------------------------------------
      else if (attachmentType === 'video_note' && rawAttachmentUrl) {
        const mediaFile = await fetchMediaBuffer(rawAttachmentUrl);
        if (mediaFile) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('video_note', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
          if (replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }
          const res = await fetch(`https://api.telegram.org/bot${token}/sendVideoNote`, {
            method: 'POST',
            headers: form.getHeaders(),
            body: form.getBuffer()
          });
          resultData = await res.json();
          if (resultData.ok) {
            sendSuccess = true;
            if (formattedText && formattedText.trim()) {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: channel, text: formattedText, parse_mode: parseMode, reply_markup: replyMarkup })
              });
            }
          }
        }
      }

      // -------------------------------------------------------------
      // 7. STANDARD TEXT MESSAGE (Only for text posts or if media is not used)
      // -------------------------------------------------------------
      if (!sendSuccess && (attachmentType === 'none' || !resultData?.ok)) {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channel,
            text: formattedText || 'Новая публикация',
            parse_mode: parseMode,
            reply_markup: replyMarkup
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
              text: formattedText || 'Новая публикация',
              parse_mode: parseMode,
              reply_markup: urlFallbackMarkup
            })
          });
          resultData = await retryRes.json();
        }

        // If parse error in MarkdownV2 or HTML, retry with safe text
        if (!resultData.ok && (resultData.description?.includes('can\'t parse entities') || resultData.description?.includes('tag'))) {
          const fallbackText = isV2 ? sanitizeMarkdownV2(rawText) : (stripHTML(rawText) || 'Новая публикация');
          const plainRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              text: fallbackText,
              parse_mode: isV2 ? 'MarkdownV2' : undefined,
              reply_markup: replyMarkup
            })
          });
          resultData = await plainRes.json();

          // Last plain text fallback
          if (!resultData.ok) {
            const rawPlainRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: channel,
                text: stripHTML(rawText) || 'Новая публикация',
                reply_markup: replyMarkup
              })
            });
            resultData = await rawPlainRes.json();
          }
        }

        if (resultData.ok) {
          sendSuccess = true;
        }
      }

      if (sendSuccess && resultData?.ok) {
        lastMessageId = Array.isArray(resultData.result) ? resultData.result[0]?.message_id?.toString() : resultData.result?.message_id?.toString() || '1';
        successChannels.push(channel);
      } else {
        const errMsg = resultData?.description || resultData?.error || 'Неизвестная ошибка Telegram API';
        errors.push(`Ошибка для ${channel}: ${errMsg}`);
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


