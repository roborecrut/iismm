import FormData from 'form-data';
import fetch from 'node-fetch';
import { DB, DayRequest } from './db';
import { getBotTokenFromSQLite } from './sqlite';
import { InlineButton } from '../types';
import {
  convertToTelegramHTML,
  stripHTML,
  fetchMediaBuffer,
  buildReplyMarkup
} from './telegram';

export interface TelegramRichSendResponse {
  ok: boolean;
  messageId?: string;
  channel?: string;
  error?: string;
  simulated?: boolean;
  fallbackNotice?: string;
}

/**
 * Prepares raw text specifically for Telegram Rich Message Markdown syntax.
 */
export function prepareRichMarkdownText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText.trim();

  // Normalize blockquotes with <cite> if in HTML format or markdown format
  // Ensure clean blockquotes: <blockquote>Text\n<cite>Author</cite></blockquote>
  text = text.replace(/<details.*?>\s*<summary>(.*?)<\/summary>([\s\S]*?)<\/details>/gi, '<b>$1</b>\n<blockquote expandable>$2</blockquote>');

  // Convert markdown quote prefixes to standard rich blockquote if needed
  text = text.replace(/^>>\s?(.*$)/gim, '<blockquote expandable>$1</blockquote>');

  // Preserve and standardize inline links [label](url)
  text = text.replace(/\\\[(.*?)\\\]\\\((.*?)\\\)/g, '[$1]($2)');

  return text;
}

/**
 * Dedicated Telegram Rich Message Sender
 * Uses Telegram /sendRichMessage endpoint with { chat_id, rich_message: { markdown } }
 * and handles media attachments, inline keyboards, and resilient fallback.
 * NOTE: Post/card title is NEVER included in the published message.
 */
export async function sendRichTelegramMessage(
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
): Promise<TelegramRichSendResponse> {
  const settings = DB.getSettings();
  const token = getBotTokenFromSQLite() || settings.telegramBotToken || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';

  const targetChannels = options?.channels && options.channels.length > 0
    ? options.channels
    : (dayRequest.channels && dayRequest.channels.length > 0 ? dayRequest.channels : [dayRequest.channel || settings.channelId || '@SAV_AI']);

  const linkPreviewEnabled = options?.linkPreviewEnabled !== undefined 
    ? options.linkPreviewEnabled 
    : (dayRequest.linkPreviewEnabled !== false);
  
  const inlineButtons = options?.inlineButtons || dayRequest.inlineButtons || [];

  // Strictly use post body text without prepending card/post title
  const rawText = content !== undefined && content !== null ? content : '';
  const richHtmlText = convertToTelegramHTML(rawText, 'rich');

  // Extract any inline markdown images from text: ![alt](url)
  const inlineImageUrls: string[] = [];
  const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)(?:\s+"[^"]*")?\)/g;
  let match;
  while ((match = imgRegex.exec(rawText)) !== null) {
    if (!match[2].startsWith('tg://emoji')) {
      inlineImageUrls.push(match[2].trim());
    }
  }

  // Also extract from <tg-collage> or <tg-slideshow>
  const collageMatch = rawText.match(/<tg-(?:collage|slideshow)[^>]*>([\s\S]*?)<\/tg-(?:collage|slideshow)>/gi);
  if (collageMatch) {
    collageMatch.forEach(block => {
      let subM;
      const subRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)(?:\s+"[^"]*")?\)/g;
      while ((subM = subRegex.exec(block)) !== null) {
        if (!subM[2].startsWith('tg://emoji') && !inlineImageUrls.includes(subM[2].trim())) {
          inlineImageUrls.push(subM[2].trim());
        }
      }
    });
  }

  // Prepare clean text without raw image markdown tags for photo captions
  const textWithoutImages = rawText
    .replace(/<tg-collage(?:\s+[^>]*)?>[\s\S]*?<\/tg-collage>/gi, '')
    .replace(/<tg-slideshow(?:\s+[^>]*)?>[\s\S]*?<\/tg-slideshow>/gi, '')
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)(?:\s+"[^"]*")?\)/g, '')
    .trim();
  const richHtmlWithoutImages = convertToTelegramHTML(textWithoutImages, 'rich');

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

      // -------------------------------------------------------------
      // 1. PRIMARY RICH MESSAGE CALL (via /sendRichMessage endpoint)
      // -------------------------------------------------------------
      const richPayload: any = {
        chat_id: channel,
        rich_message: {
          markdown: rawText
        }
      };
      if (replyMarkup) {
        richPayload.reply_markup = replyMarkup;
      }

      try {
        const richRes = await fetch(`https://api.telegram.org/bot${token}/sendRichMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(richPayload)
        });
        resultData = await richRes.json();
        if (resultData && resultData.ok) {
          sendSuccess = true;
        }
      } catch (richErr: any) {
        console.warn('[sendRichTelegramMessage] /sendRichMessage error:', richErr.message);
      }

      // -------------------------------------------------------------
      // 2. INLINE MEDIA COLLAGE / PHOTO FALLBACK (if /sendRichMessage didn't handle)
      // -------------------------------------------------------------
      if (!sendSuccess && inlineImageUrls.length >= 2) {
        try {
          const mediaBuffers = await Promise.all(inlineImageUrls.slice(0, 10).map(u => fetchMediaBuffer(u)));
          const validBuffers = mediaBuffers.filter(b => b !== null) as { buffer: Buffer; filename: string; contentType: string; mediaType: 'photo' | 'video' | 'audio' | 'document' }[];

          if (validBuffers.length >= 2) {
            const hasShortCaption = richHtmlWithoutImages.length <= 1024 && richHtmlWithoutImages.length > 0;
            const form = new FormData();
            form.append('chat_id', channel);

            const mediaArray = validBuffers.map((item, idx) => {
              const fieldName = `file_${idx}`;
              const safeName = item.filename || `media_${idx}.jpg`;
              const mimeType = item.contentType.startsWith('image/') ? item.contentType : 'image/jpeg';
              form.append(fieldName, item.buffer, { filename: safeName, contentType: mimeType });
              return {
                type: 'photo',
                media: `attach://${fieldName}`,
                caption: idx === 0 && hasShortCaption ? richHtmlWithoutImages : undefined,
                parse_mode: idx === 0 && hasShortCaption ? 'HTML' : undefined
              };
            });

            form.append('media', JSON.stringify(mediaArray));
            const mediaRes = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
              method: 'POST',
              headers: form.getHeaders(),
              body: form.getBuffer()
            });
            resultData = await mediaRes.json();
            if (resultData && resultData.ok) {
              sendSuccess = true;

              // If caption was too long or buttons exist, send the rich text message alongside
              if (!hasShortCaption || (replyMarkup && inlineButtons.length > 0)) {
                try {
                  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: channel,
                      text: richHtmlWithoutImages || 'Подробности',
                      parse_mode: 'HTML',
                      reply_markup: replyMarkup,
                      disable_web_page_preview: !linkPreviewEnabled
                    })
                  });
                } catch (btnErr) {}
              }
            }
          }
        } catch (mediaErr: any) {
          console.warn('[sendRichTelegramMessage] Media collage error:', mediaErr.message);
        }
      } else if (!sendSuccess && inlineImageUrls.length === 1) {
        try {
          const singleMedia = await fetchMediaBuffer(inlineImageUrls[0]);
          const hasShortCaption = richHtmlWithoutImages.length <= 1024 && richHtmlWithoutImages.length > 0;

          if (singleMedia) {
            const form = new FormData();
            form.append('chat_id', channel);
            form.append('photo', singleMedia.buffer, { filename: singleMedia.filename, contentType: singleMedia.contentType });
            if (hasShortCaption) {
              form.append('caption', richHtmlWithoutImages);
              form.append('parse_mode', 'HTML');
            }
            if (hasShortCaption && replyMarkup) {
              form.append('reply_markup', JSON.stringify(replyMarkup));
            }
            const photoRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
              method: 'POST',
              headers: form.getHeaders(),
              body: form.getBuffer()
            });
            resultData = await photoRes.json();
            if (resultData && resultData.ok) {
              sendSuccess = true;
              if (!hasShortCaption) {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    text: richHtmlWithoutImages,
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup
                  })
                });
              }
            }
          }
        } catch (singleErr: any) {
          console.warn('[sendRichTelegramMessage] Single photo error:', singleErr.message);
        }
      }

      // -------------------------------------------------------------
      // 3. PRIMARY RICH HTML MESSAGE CALL (via /sendMessage with parse_mode: 'HTML')
      // -------------------------------------------------------------
      if (!sendSuccess) {
        const textToSend = (inlineImageUrls.length > 0 && richHtmlWithoutImages) ? richHtmlWithoutImages : richHtmlText;
        const htmlRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channel,
            text: textToSend || 'Публикация',
            parse_mode: 'HTML',
            reply_markup: replyMarkup,
            disable_web_page_preview: !linkPreviewEnabled,
            link_preview_options: {
              is_disabled: !linkPreviewEnabled
            }
          })
        });
        resultData = await htmlRes.json();

        // If button URL was invalid or WebApp button issue, retry with safe URL fallback
        if (!resultData.ok && (resultData.description?.includes('BUTTON_TYPE_INVALID') || resultData.description?.includes('BUTTON_URL_INVALID'))) {
          const urlFallbackMarkup = buildReplyMarkup(inlineButtons, true);
          const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              text: textToSend || 'Публикация',
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

        // If Telegram couldn't parse HTML entities, fallback to clean text
        if (!resultData.ok && (resultData.description?.includes('can\'t parse entities') || resultData.description?.includes('tag'))) {
          console.warn('[sendRichTelegramMessage] HTML entity parse error, sending sanitized text:', resultData.description);
          const plainRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              text: stripHTML(rawText) || 'Публикация',
              reply_markup: replyMarkup,
              disable_web_page_preview: !linkPreviewEnabled,
              link_preview_options: {
                is_disabled: !linkPreviewEnabled
              }
            })
          });
          resultData = await plainRes.json();
        }

        if (resultData && resultData.ok) {
          sendSuccess = true;
        }
      }

      if (sendSuccess && resultData?.ok) {
        lastMessageId = Array.isArray(resultData.result) 
          ? resultData.result[0]?.message_id?.toString() 
          : resultData.result?.message_id?.toString() || '1';
        successChannels.push(channel);
      } else {
        const errorDesc = resultData?.description || 'Ошибка Telegram API при отправке Rich сообщения';
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
      fallbackNotice: errors.length > 0 ? `Частичная отправка Rich. Ошибки: ${errors.join('; ')}` : undefined
    };
  } else {
    return {
      ok: false,
      error: errors.join('; ') || 'Не удалось отправить Rich сообщение ни в один канал',
      simulated: false
    };
  }
}
