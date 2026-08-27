import FormData from 'form-data';
import { DB, DayRequest } from './db';
import { getBotTokenFromSQLite } from './sqlite';
import { InlineButton } from '../types';
import { 
  buildReplyMarkup, 
  fetchMediaBuffer, 
  convertVideoToTelegramVideoNote, 
  convertAudioToTelegramVoice,
  resolvePublicUrl,
  stripHTML,
  TelegramSendResponse
} from './telegramUtils';

/**
 * Format Markdown table into aligned monospace <pre> block for Telegram HTML
 */
export function formatRichTableForTelegram(tableStr: string): string {
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

/**
 * Tag auto-balancer and sanitizer to guarantee Telegram HTML never has unclosed, mismatched, or unexpected end tags.
 * Telegram Bot API strictly enforces LIFO stack order and a whitelist of tags.
 */
export function balanceTelegramHTMLTags(html: string): string {
  if (!html) return '';

  const validTagNames = new Set(['b', 'i', 'u', 's', 'tg-spoiler', 'a', 'tg-emoji', 'code', 'pre', 'blockquote']);

  // Stack of currently open tags: [{ tag: 'b', closeTag: '</b>' }, ...]
  const stack: { tag: string; closeTag: string }[] = [];
  let result = '';

  // Regex to match any HTML tag
  const tagRegex = /<\/?([a-zA-Z0-9_-]+)((?:\s+[^>]*)?)\/?>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    // 1. Text before this tag
    const textChunk = html.slice(lastIndex, match.index);
    result += textChunk;
    lastIndex = tagRegex.lastIndex;

    const fullMatch = match[0];
    let rawTagName = match[1].toLowerCase();
    const rawAttrs = match[2] || '';
    const isClosing = fullMatch.startsWith('</');

    // Normalize tag aliases
    if (rawTagName === 'strong') rawTagName = 'b';
    else if (rawTagName === 'em') rawTagName = 'i';
    else if (rawTagName === 'ins') rawTagName = 'u';
    else if (rawTagName === 'strike' || rawTagName === 'del') rawTagName = 's';
    else if (rawTagName === 'span' && /class=["']tg-spoiler["']/i.test(rawAttrs)) rawTagName = 'tg-spoiler';

    // If closing span but tg-spoiler was opened
    if (isClosing && rawTagName === 'span') {
      const topSpoilerIdx = stack.map(s => s.tag).lastIndexOf('tg-spoiler');
      if (topSpoilerIdx !== -1) {
        rawTagName = 'tg-spoiler';
      }
    }

    // Ignore unsupported tags
    if (!validTagNames.has(rawTagName)) {
      continue;
    }

    if (isClosing) {
      // Find where this tag is in the stack
      const tagIndex = stack.map(s => s.tag).lastIndexOf(rawTagName);
      if (tagIndex === -1) {
        // Tag was never opened: DROP IT! This eliminates "Unexpected end tag" errors.
        continue;
      }

      // Pop all open tags from the top of the stack down to this tag
      while (stack.length > tagIndex) {
        const popped = stack.pop()!;
        result += popped.closeTag;
      }
    } else {
      // Opening tag
      let normalizedOpen = `<${rawTagName}>`;
      let normalizedClose = `</${rawTagName}>`;

      if (rawTagName === 'a') {
        const hrefMatch = rawAttrs.match(/href=["']([^"']*)["']/i);
        const href = hrefMatch ? hrefMatch[1] : '';
        if (!href) {
          // <a> without href is invalid in Telegram
          continue;
        }
        normalizedOpen = `<a href="${href}">`;
      } else if (rawTagName === 'tg-emoji') {
        const idMatch = rawAttrs.match(/emoji-id=["'](\d+)["']/i);
        const emojiId = idMatch ? idMatch[1] : '';
        if (!emojiId) {
          continue;
        }
        normalizedOpen = `<tg-emoji emoji-id="${emojiId}">`;
      } else if (rawTagName === 'code') {
        const classMatch = rawAttrs.match(/class=["']([^"']*)["']/i);
        if (classMatch && classMatch[1]) {
          normalizedOpen = `<code class="${classMatch[1]}">`;
        }
      } else if (rawTagName === 'blockquote') {
        if (/expandable/i.test(rawAttrs)) {
          normalizedOpen = `<blockquote expandable>`;
        }
      }

      stack.push({ tag: rawTagName, closeTag: normalizedClose });
      result += normalizedOpen;
    }
  }

  // Append remaining text after last tag
  if (lastIndex < html.length) {
    result += html.slice(lastIndex);
  }

  // Close any tags still remaining on the stack in reverse order
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    result += unclosed.closeTag;
  }

  // Clean up redundant empty tags like <b></b> or <i></i>
  result = result.replace(/<(b|i|u|s|tg-spoiler)>\s*<\/\1>/g, '');

  return result;
}

/**
 * Process Rich text into 100% compliant Telegram HTML format:
 * - Headings: # H1 -> <b>H1</b>
 * - Expandable blockquotes: <details><summary>S</summary>B</details> -> <b>S</b>\n<blockquote expandable>B</blockquote>
 * - >> quote -> <blockquote expandable>quote</blockquote>
 * - > quote -> <blockquote>quote</blockquote>
 * - Custom Emojis: <tg-emoji emoji-id="123">alt</tg-emoji> or ![alt](tg://emoji?id=123)
 * - Spoilers: ||spoiler|| or <tg-spoiler>spoiler</tg-spoiler>
 * - Time: <tg-time unix="123" format="...">Label</tg-time> -> Label
 * - Tables: converted to monospace <pre>
 * - Bold: **text** or <b>text</b>
 * - Italic: *text* or _text_ or <i>text</i>
 * - Underline: __text__ or <u>text</u>
 * - Strikethrough: ~~text~~ or <s>text</s>
 * - Code: `code` -> <code>code</code> and ```lang\ncode``` -> <pre><code class="language-lang">code</code></pre>
 * - Links: [label](url) -> <a href="url">label</a>
 */
export function processRichTextToTelegramHTML(
  text: string,
  _title?: string,
  _uppercaseHeader: boolean = true
): string {
  const rawText = (text || '').trim();
  if (!rawText) return '';

  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];
  const customEmojis: string[] = [];
  const tables: string[] = [];
  const links: string[] = [];

  let str = rawText;

  // 1. Triple backtick code blocks: ```lang\ncode\n``` or ```code```
  str = str.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    if (lang && lang.trim()) {
      codeBlocks.push(`<pre><code class="language-${lang.trim()}">${escapedCode}</code></pre>`);
    } else {
      codeBlocks.push(`<pre>${escapedCode}</pre>`);
    }
    return `\uE100CB${idx}\uE101`;
  });

  // 2. Inline code: `code`
  str = str.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = inlineCodes.length;
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    inlineCodes.push(`<code>${escapedCode}</code>`);
    return `\uE100IC${idx}\uE101`;
  });

  // 3. Custom Emoji: ![alt](tg://emoji?id=12345) or <tg-emoji emoji-id="123">alt</tg-emoji>
  str = str.replace(/!\[(.*?)\]\(tg:\/\/emoji\?id=(\d+)\)/gi, (_, alt, id) => {
    const idx = customEmojis.length;
    customEmojis.push(`<tg-emoji emoji-id="${id}">${alt || '✨'}</tg-emoji>`);
    return `\uE100EM${idx}\uE101`;
  });

  str = str.replace(/<tg-emoji\s+emoji-id=["'](\d+)["']>(.*?)<\/tg-emoji>/gi, (_, id, alt) => {
    const idx = customEmojis.length;
    customEmojis.push(`<tg-emoji emoji-id="${id}">${alt || '✨'}</tg-emoji>`);
    return `\uE100EM${idx}\uE101`;
  });

  // 4. Telegram Time: <tg-time unix="123" format="...">Label</tg-time>
  str = str.replace(/<tg-time.*?unix=["'](\d+)["'].*?>(.*?)<\/tg-time>/gi, '$2');

  // 5. Markdown Tables -> monospace <pre>
  str = str.replace(/(?:^|\n)(\|.+?\|\n\|[\s\-:|]+\|\n(?:\|.+?\|(?:\n|$))+)/g, (match) => {
    const idx = tables.length;
    tables.push('\n' + formatRichTableForTelegram(match) + '\n');
    return `\uE100TB${idx}\uE101`;
  });

  // 6. Links: [label](url)
  str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const idx = links.length;
    const cleanUrl = url.trim().replace(/&amp;/g, '&');
    links.push(`<a href="${cleanUrl}">${label}</a>`);
    return `\uE100LK${idx}\uE101`;
  });

  // 7. Expandable details blocks: <details><summary>Title</summary>Body</details>
  str = str.replace(/<details.*?>\s*<summary>(.*?)<\/summary>([\s\S]*?)<\/details>/gi, (_, summary, body) => {
    const cleanBody = body.trim();
    return `<b>${summary.trim()}</b>\n<blockquote expandable>${cleanBody}</blockquote>`;
  });

  // 8. Checklists
  str = str.replace(/^[\-\*]\s+\[\s*\]\s+(.+)$/gim, '☐ $1');
  str = str.replace(/^[\-\*]\s+\[[xX]\]\s+(.+)$/gim, '✓ <s>$1</s>');

  // 9. Remove container tags like collage / slideshow
  str = str.replace(/<\/?tg-collage>/gi, '');
  str = str.replace(/<\/?tg-slideshow>/gi, '');

  // 10. Headings: # Heading -> <b>Heading</b>
  str = str.replace(/^#{1,6}\s+(.+)$/gim, '<b>$1</b>');

  // 11. Blockquotes from Markdown
  // Group consecutive expandable quotes (>>)
  str = str.replace(/(?:^>>\s?.*$\n?)+/gm, (block) => {
    const cleanContent = block
      .split('\n')
      .map(l => l.replace(/^>>\s?/, ''))
      .filter(l => l.length > 0)
      .join('\n');
    return `<blockquote expandable>${cleanContent}</blockquote>\n`;
  });

  // Group consecutive standard quotes (>)
  str = str.replace(/(?:^>\s?.*$\n?)+/gm, (block) => {
    const cleanContent = block
      .split('\n')
      .map(l => l.replace(/^>\s?/, ''))
      .filter(l => l.length > 0)
      .join('\n');
    return `<blockquote>${cleanContent}</blockquote>\n`;
  });

  // 12. Spoilers: ||spoiler||
  str = str.replace(/\|\|([\s\S]+?)\|\|/g, '<tg-spoiler>$1</tg-spoiler>');

  // 13. Inline Markdown Formatting:
  // Bold-Italic (***text*** or ___text___)
  str = str.replace(/\*\*\*([^*\n]+?)\*\*\*/g, '<b><i>$1</i></b>');
  str = str.replace(/___([^_\n]+?)___/g, '<b><i>$1</i></b>');

  // Bold (**text**)
  str = str.replace(/\*\*([^*\n]+?)\*\*/g, '<b>$1</b>');

  // Underline (__text__)
  str = str.replace(/__([^_\n]+?)__/g, '<u>$1</u>');

  // Strikethrough (~~text~~)
  str = str.replace(/~~([^~\n]+?)~~/g, '<s>$1</s>');

  // Italic (*text* with word boundary)
  str = str.replace(/(^|[\s(>.,!?;:'"«»—-])\*([^*\n\s]+|[^*\n\s][^*\n]*?[^*\n\s])\*(?=$|[\s)>.,!?;:'"«»—-])/g, '$1<i>$2</i>');

  // Italic (_text_ with word boundary)
  str = str.replace(/(^|[\s(>.,!?;:'"«»—-])_([^_\n\s]+|[^_\n\s][^_\n]*?[^_\n\s])_(?=$|[\s)>.,!?;:'"«»—-])/g, '$1<i>$2</i>');

  // 14. Restore Placeholders
  // Restore Links
  str = str.replace(/\uE100LK(\d+)\uE101/g, (_, idx) => links[Number(idx)] || '');

  // Restore Tables
  str = str.replace(/\uE100TB(\d+)\uE101/g, (_, idx) => tables[Number(idx)] || '');

  // Restore Custom Emojis
  str = str.replace(/\uE100EM(\d+)\uE101/g, (_, idx) => customEmojis[Number(idx)] || '');

  // Restore Inline Code
  str = str.replace(/\uE100IC(\d+)\uE101/g, (_, idx) => inlineCodes[Number(idx)] || '');

  // Restore Code Blocks
  str = str.replace(/\uE100CB(\d+)\uE101/g, (_, idx) => codeBlocks[Number(idx)] || '');

  // 15. Run bulletproof balancer and sanitizer
  return balanceTelegramHTMLTags(str);
}

/**
 * Extract image URLs from collage or markdown tags in text to auto-enrich media groups
 */
export function extractEmbeddedImageUrls(text: string): string[] {
  if (!text) return [];
  const urls: string[] = [];
  const mdRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+|\/uploads\/[^\s\)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(text)) !== null) {
    if (match[1] && !match[1].startsWith('tg://emoji') && !urls.includes(match[1])) {
      urls.push(match[1]);
    }
  }
  return urls;
}

/**
 * Dedicated Telegram Rich Message Sender (Markdown Rich / HTML Pipeline)
 */
export async function sendRichTelegramPost(
  title: string,
  content: string,
  dayRequest: DayRequest,
  options?: {
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
  const settings = DB.getSettings();
  const token = getBotTokenFromSQLite() || settings.telegramBotToken || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';

  if (!token || token.trim() === '') {
    return {
      ok: false,
      error: 'Не указан токен Telegram бота в настройках.',
      simulated: true
    };
  }

  const targetChannels = options?.channels && options.channels.length > 0
    ? options.channels
    : (dayRequest.channels && dayRequest.channels.length > 0 ? dayRequest.channels : [dayRequest.channel || settings.channelId || '@SAV_AI']);

  const uppercaseHeader = options?.uppercaseHeader !== false;
  const linkPreviewEnabled = options?.linkPreviewEnabled !== undefined
    ? options.linkPreviewEnabled
    : (dayRequest.linkPreviewEnabled !== false);

  let attachmentType = options?.attachmentType || dayRequest.attachmentType || 'none';
  const rawAttachmentUrl = (options?.attachmentUrl || dayRequest.attachmentUrl || '').trim();
  let rawAttachmentUrls = (options?.attachmentUrls || dayRequest.attachmentUrls || []).map(u => (u || '').trim()).filter(Boolean);

  // Auto-detect collage / slideshow images in text if album was not explicitly configured
  const embeddedImages = extractEmbeddedImageUrls(content);
  if (embeddedImages.length > 1 && (attachmentType === 'none' || attachmentType === 'album') && rawAttachmentUrls.length === 0) {
    attachmentType = 'album';
    rawAttachmentUrls = embeddedImages;
  }

  const isVoiceMode = (attachmentType === 'voice') ||
    (attachmentType === 'audio' && ((options as any)?.audioFormat === 'voice' || (dayRequest as any)?.audioFormat === 'voice' || (dayRequest as any)?.audio_format === 'voice'));

  const inlineButtons = options?.inlineButtons || dayRequest.inlineButtons || [];

  // Prepare clean Markdown for native Telegram Rich Message (do NOT prepend card title!)
  let cleanRichMarkdown = (content || '').trim();
  if (options?.signature) {
    cleanRichMarkdown += `\n\n_${options.signature.trim()}_`;
  }

  // Generate Rich Telegram HTML for captions & fallback
  let richHTML = processRichTextToTelegramHTML(content);
  if (options?.signature) {
    richHTML += `\n\n<i>${options.signature.trim()}</i>`;
  }

  const successChannels: string[] = [];
  const errors: string[] = [];
  let lastMessageId = '1';

  for (const rawCh of targetChannels) {
    let channel = rawCh;

    if (channel === 'bot_dm' || channel === '@bot_dm' || channel === 'direct_message') {
      const numericTgId = options?.telegramId || settings.channelId;
      if (!numericTgId) {
        errors.push('Не указан Telegram ID для отправки в личные сообщения');
        continue;
      }
      channel = String(numericTgId);
    } else {
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

    const replyMarkup = buildReplyMarkup(inlineButtons, false);

    try {
      let sendSuccess = false;
      let resultData: any = null;

      const hasShortCaption = richHTML.length <= 1024;
      const captionToSend = hasShortCaption ? richHTML : '';

      // -------------------------------------------------------------
      // 1. ALBUM ATTACHMENTS (Multiple Photos / Videos)
      // -------------------------------------------------------------
      if (attachmentType === 'album' && rawAttachmentUrls.length > 0) {
        const validUrls = rawAttachmentUrls.slice(0, 10);
        const downloadedMedia: { buffer: Buffer; filename: string; contentType: string; mediaType: string }[] = [];

        for (let i = 0; i < validUrls.length; i++) {
          const media = await fetchMediaBuffer(validUrls[i], `album_${i + 1}.bin`);
          if (media) {
            downloadedMedia.push(media);
          }
        }

        if (downloadedMedia.length > 0) {
          const form = new FormData();
          form.append('chat_id', channel);

          const mediaArray = downloadedMedia.map((m, idx) => {
            const isVideo = m.mediaType === 'video' || m.contentType.startsWith('video/') || m.filename.endsWith('.mp4');
            const mediaItem: any = {
              type: isVideo ? 'video' : 'photo',
              media: `attach://file_${idx}`,
              has_spoiler: false
            };
            if (idx === 0 && hasShortCaption && captionToSend) {
              mediaItem.caption = captionToSend;
              mediaItem.parse_mode = 'HTML';
            }
            return mediaItem;
          });

          form.append('media', JSON.stringify(mediaArray));

          downloadedMedia.forEach((m, idx) => {
            form.append(`file_${idx}`, m.buffer, {
              filename: m.filename,
              contentType: m.contentType
            });
          });

          let res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
          });

          resultData = await res.json();

          // Fallback if Telegram entity parsing failed in caption
          if (!resultData.ok && resultData.description && resultData.description.includes("can't parse entities")) {
            console.warn(`[sendRichTelegramPost] sendMediaGroup entity error, retrying without HTML:`, resultData.description);
            const plainCaption = stripHTML(captionToSend);
            const fallbackForm = new FormData();
            fallbackForm.append('chat_id', channel);
            const fallbackMediaArray = downloadedMedia.map((m, idx) => {
              const isVideo = m.mediaType === 'video' || m.contentType.startsWith('video/') || m.filename.endsWith('.mp4');
              const mediaItem: any = {
                type: isVideo ? 'video' : 'photo',
                media: `attach://file_${idx}`,
                has_spoiler: false
              };
              if (idx === 0 && hasShortCaption && plainCaption) {
                mediaItem.caption = plainCaption;
              }
              return mediaItem;
            });
            fallbackForm.append('media', JSON.stringify(fallbackMediaArray));
            downloadedMedia.forEach((m, idx) => {
              fallbackForm.append(`file_${idx}`, m.buffer, {
                filename: m.filename,
                contentType: m.contentType
              });
            });
            res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
              method: 'POST',
              body: fallbackForm as any,
              headers: fallbackForm.getHeaders()
            });
            resultData = await res.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.[0]?.message_id || resultData.result?.message_id || '1');

            // If caption was too long or we have inline keyboard buttons, send text message follow-up
            if (!hasShortCaption || (replyMarkup && replyMarkup.inline_keyboard?.length)) {
              let textRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: channel,
                  text: richHTML,
                  parse_mode: 'HTML',
                  reply_markup: replyMarkup
                })
              });
              let textData = await textRes.json();
              if (!textData.ok && textData.description && textData.description.includes("can't parse entities")) {
                textRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    text: stripHTML(richHTML),
                    reply_markup: replyMarkup
                  })
                });
                textData = await textRes.json();
              }
              if (textData.ok) {
                lastMessageId = String(textData.result?.message_id || lastMessageId);
              }
            }
          } else {
            console.warn(`[sendRichTelegramPost] sendMediaGroup error for ${channel}:`, resultData.description);
          }
        }
      }

      // -------------------------------------------------------------
      // 2. VIDEO NOTE (Circular 1:1 format)
      // -------------------------------------------------------------
      if (!sendSuccess && attachmentType === 'video_note' && rawAttachmentUrl) {
        const media = await fetchMediaBuffer(rawAttachmentUrl, 'videonote.mp4', 'video/mp4');
        if (media) {
          const convertedBuffer = await convertVideoToTelegramVideoNote(media.buffer);
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('video_note', convertedBuffer, {
            filename: 'videonote.mp4',
            contentType: 'video/mp4'
          });

          const res = await fetch(`https://api.telegram.org/bot${token}/sendVideoNote`, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
          });

          resultData = await res.json();
          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');

            if (richHTML.trim()) {
              const textRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: channel,
                  text: richHTML,
                  parse_mode: 'HTML',
                  reply_markup: replyMarkup
                })
              });
              const textData = await textRes.json();
              if (textData.ok) {
                lastMessageId = String(textData.result?.message_id || lastMessageId);
              }
            }
          }
        }
      }

      // -------------------------------------------------------------
      // 3. VOICE MESSAGE (sendVoice)
      // -------------------------------------------------------------
      if (!sendSuccess && isVoiceMode && rawAttachmentUrl) {
        const media = await fetchMediaBuffer(rawAttachmentUrl, 'voice.ogg', 'audio/ogg');
        if (media) {
          const voiceBuffer = await convertAudioToTelegramVoice(media.buffer);
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('voice', voiceBuffer, {
            filename: 'voice.ogg',
            contentType: 'audio/ogg'
          });
          if (hasShortCaption && captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'HTML');
          }
          if (replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }

          let res = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
          });

          resultData = await res.json();

          // Fallback if Telegram entity parsing failed in voice caption
          if (!resultData.ok && resultData.description && resultData.description.includes("can't parse entities")) {
            console.warn(`[sendRichTelegramPost] sendVoice entity error, retrying without HTML:`, resultData.description);
            const fallbackForm = new FormData();
            fallbackForm.append('chat_id', channel);
            fallbackForm.append('voice', voiceBuffer, {
              filename: 'voice.ogg',
              contentType: 'audio/ogg'
            });
            if (hasShortCaption && captionToSend) {
              fallbackForm.append('caption', stripHTML(captionToSend));
            }
            if (replyMarkup) {
              fallbackForm.append('reply_markup', JSON.stringify(replyMarkup));
            }
            res = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, {
              method: 'POST',
              body: fallbackForm as any,
              headers: fallbackForm.getHeaders()
            });
            resultData = await res.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');

            if (!hasShortCaption) {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: channel,
                  text: richHTML,
                  parse_mode: 'HTML',
                  reply_markup: replyMarkup
                })
              });
            }
          }
        }
      }

      // -------------------------------------------------------------
      // 4. PHOTO ATTACHMENT (sendPhoto)
      // -------------------------------------------------------------
      if (!sendSuccess && attachmentType === 'photo' && rawAttachmentUrl) {
        const media = await fetchMediaBuffer(rawAttachmentUrl, 'photo.jpg', 'image/jpeg');
        if (media) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('photo', media.buffer, {
            filename: media.filename,
            contentType: media.contentType
          });
          if (hasShortCaption && captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'HTML');
          }
          if (replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }

          let res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
          });

          resultData = await res.json();

          // Fallback if Telegram entity parsing failed in photo caption
          if (!resultData.ok && resultData.description && resultData.description.includes("can't parse entities")) {
            console.warn(`[sendRichTelegramPost] sendPhoto entity error, retrying without HTML:`, resultData.description);
            const fallbackForm = new FormData();
            fallbackForm.append('chat_id', channel);
            fallbackForm.append('photo', media.buffer, {
              filename: media.filename,
              contentType: media.contentType
            });
            if (hasShortCaption && captionToSend) {
              fallbackForm.append('caption', stripHTML(captionToSend));
            }
            if (replyMarkup) {
              fallbackForm.append('reply_markup', JSON.stringify(replyMarkup));
            }
            res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
              method: 'POST',
              body: fallbackForm as any,
              headers: fallbackForm.getHeaders()
            });
            resultData = await res.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');

            if (!hasShortCaption) {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: channel,
                  text: richHTML,
                  parse_mode: 'HTML',
                  reply_markup: replyMarkup
                })
              });
            }
          } else {
            console.warn(`[sendRichTelegramPost] sendPhoto binary upload error:`, resultData.description);
          }
        }

        // Direct URL fallback if binary upload was not executed
        if (!sendSuccess) {
          const publicUrl = await resolvePublicUrl(rawAttachmentUrl);
          let res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              photo: publicUrl,
              caption: captionToSend || undefined,
              parse_mode: captionToSend ? 'HTML' : undefined,
              reply_markup: replyMarkup
            })
          });
          resultData = await res.json();
          if (!resultData.ok && resultData.description && resultData.description.includes("can't parse entities")) {
            res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: channel,
                photo: publicUrl,
                caption: captionToSend ? stripHTML(captionToSend) : undefined,
                reply_markup: replyMarkup
              })
            });
            resultData = await res.json();
          }
          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');
          }
        }
      }

      // -------------------------------------------------------------
      // 5. VIDEO ATTACHMENT (sendVideo)
      // -------------------------------------------------------------
      if (!sendSuccess && attachmentType === 'video' && rawAttachmentUrl) {
        const media = await fetchMediaBuffer(rawAttachmentUrl, 'video.mp4', 'video/mp4');
        if (media) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('video', media.buffer, {
            filename: media.filename,
            contentType: media.contentType
          });
          form.append('supports_streaming', 'true');
          if (hasShortCaption && captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'HTML');
          }
          if (replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }

          let res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
          });

          resultData = await res.json();

          // Fallback if Telegram entity parsing failed in video caption
          if (!resultData.ok && resultData.description && resultData.description.includes("can't parse entities")) {
            console.warn(`[sendRichTelegramPost] sendVideo entity error, retrying without HTML:`, resultData.description);
            const fallbackForm = new FormData();
            fallbackForm.append('chat_id', channel);
            fallbackForm.append('video', media.buffer, {
              filename: media.filename,
              contentType: media.contentType
            });
            fallbackForm.append('supports_streaming', 'true');
            if (hasShortCaption && captionToSend) {
              fallbackForm.append('caption', stripHTML(captionToSend));
            }
            if (replyMarkup) {
              fallbackForm.append('reply_markup', JSON.stringify(replyMarkup));
            }
            res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
              method: 'POST',
              body: fallbackForm as any,
              headers: fallbackForm.getHeaders()
            });
            resultData = await res.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');
          }
        }
      }

      // -------------------------------------------------------------
      // 6. AUDIO ATTACHMENT (sendAudio)
      // -------------------------------------------------------------
      if (!sendSuccess && attachmentType === 'audio' && rawAttachmentUrl) {
        const media = await fetchMediaBuffer(rawAttachmentUrl, 'audio.mp3', 'audio/mpeg');
        if (media) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('audio', media.buffer, {
            filename: media.filename,
            contentType: media.contentType
          });
          if (hasShortCaption && captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'HTML');
          }
          if (replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }

          let res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
          });

          resultData = await res.json();

          // Fallback if Telegram entity parsing failed in audio caption
          if (!resultData.ok && resultData.description && resultData.description.includes("can't parse entities")) {
            console.warn(`[sendRichTelegramPost] sendAudio entity error, retrying without HTML:`, resultData.description);
            const fallbackForm = new FormData();
            fallbackForm.append('chat_id', channel);
            fallbackForm.append('audio', media.buffer, {
              filename: media.filename,
              contentType: media.contentType
            });
            if (hasShortCaption && captionToSend) {
              fallbackForm.append('caption', stripHTML(captionToSend));
            }
            if (replyMarkup) {
              fallbackForm.append('reply_markup', JSON.stringify(replyMarkup));
            }
            res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
              method: 'POST',
              body: fallbackForm as any,
              headers: fallbackForm.getHeaders()
            });
            resultData = await res.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');
          }
        }
      }

      // -------------------------------------------------------------
      // 7. DOCUMENT ATTACHMENT (sendDocument)
      // -------------------------------------------------------------
      if (!sendSuccess && attachmentType === 'document' && rawAttachmentUrl) {
        const media = await fetchMediaBuffer(rawAttachmentUrl, 'document.bin');
        if (media) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('document', media.buffer, {
            filename: media.filename,
            contentType: media.contentType
          });
          if (hasShortCaption && captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'HTML');
          }
          if (replyMarkup) {
            form.append('reply_markup', JSON.stringify(replyMarkup));
          }

          let res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
          });

          resultData = await res.json();

          // Fallback if Telegram entity parsing failed in document caption
          if (!resultData.ok && resultData.description && resultData.description.includes("can't parse entities")) {
            console.warn(`[sendRichTelegramPost] sendDocument entity error, retrying without HTML:`, resultData.description);
            const fallbackForm = new FormData();
            fallbackForm.append('chat_id', channel);
            fallbackForm.append('document', media.buffer, {
              filename: media.filename,
              contentType: media.contentType
            });
            if (hasShortCaption && captionToSend) {
              fallbackForm.append('caption', stripHTML(captionToSend));
            }
            if (replyMarkup) {
              fallbackForm.append('reply_markup', JSON.stringify(replyMarkup));
            }
            res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
              method: 'POST',
              body: fallbackForm as any,
              headers: fallbackForm.getHeaders()
            });
            resultData = await res.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');
          }
        }
      }

      // -------------------------------------------------------------
      // 8. PURE RICH TEXT MESSAGE (sendRichMessage with Markdown)
      // -------------------------------------------------------------
      if (!sendSuccess) {
        // Attempt Telegram API 10.1+ sendRichMessage method with native markdown
        try {
          const richPayload: any = {
            chat_id: channel,
            rich_message: {
              markdown: cleanRichMarkdown
            }
          };
          if (replyMarkup) {
            richPayload.reply_markup = replyMarkup;
          }

          let richRes = await fetch(`https://api.telegram.org/bot${token}/sendRichMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(richPayload)
          });

          resultData = await richRes.json();

          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');
          } else {
            console.warn(`[sendRichTelegramPost] sendRichMessage not accepted (${resultData.description || 'unknown'}), falling back to sendMessage`);
          }
        } catch (richErr) {
          console.warn(`[sendRichTelegramPost] sendRichMessage network/endpoint exception:`, richErr);
        }

        // Fallback to sendMessage with HTML if sendRichMessage failed
        if (!sendSuccess) {
          const textPayload: any = {
            chat_id: channel,
            text: richHTML,
            parse_mode: 'HTML',
            link_preview_options: {
              is_disabled: !linkPreviewEnabled,
              prefer_small_media: true
            }
          };

          if (replyMarkup) {
            textPayload.reply_markup = replyMarkup;
          }

          let res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(textPayload)
          });

          resultData = await res.json();

          // If Telegram HTML parsing failed (e.g. invalid user entity), attempt sanitized stripped fallback
          if (!resultData.ok && resultData.description && resultData.description.includes("can't parse entities")) {
            console.warn(`[sendRichTelegramPost] HTML entity error, retrying with stripped text:`, resultData.description);
            const plainText = stripHTML(richHTML);
            res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: channel,
                text: plainText,
                link_preview_options: { is_disabled: !linkPreviewEnabled },
                reply_markup: replyMarkup
              })
            });
            resultData = await res.json();
          }

          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');
          }
        }
      }

      if (sendSuccess) {
        successChannels.push(channel);
      } else {
        errors.push(`${channel}: ${resultData?.description || 'Неизвестная ошибка Telegram API'}`);
      }

    } catch (err: any) {
      console.error(`[sendRichTelegramPost] Exception sending to ${channel}:`, err);
      errors.push(`${channel}: ${err.message}`);
    }
  }

  if (successChannels.length > 0) {
    return {
      ok: true,
      messageId: lastMessageId,
      channel: successChannels.join(', ')
    };
  }

  return {
    ok: false,
    error: errors.join('; ') || 'Не удалось отправить сообщение ни в один канал.'
  };
}
