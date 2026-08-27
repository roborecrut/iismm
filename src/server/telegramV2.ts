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
 * Escapes characters reserved by Telegram MarkdownV2:
 * _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
export function sanitizeMarkdownV2(text: string): string {
  if (!text) return '';
  return text.replace(/(?<!\\)([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Prepare MarkdownV2 text preserving formatting entities:
 * code blocks, inline code, links, spoilers, bold, italic, underline, strikethrough
 */
export function prepareTelegramMarkdownV2(
  text: string,
  title?: string,
  uppercaseHeader: boolean = true
): string {
  let rawText = (text || '').trim();
  const formattedTitle = title ? (uppercaseHeader ? title.toUpperCase() : title).trim() : '';

  if (formattedTitle && !rawText.includes(formattedTitle)) {
    rawText = `*${sanitizeMarkdownV2(formattedTitle)}*\n\n${rawText}`;
  }

  if (!rawText) return '';

  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];
  const links: string[] = [];

  let str = rawText;

  // 1. Triple backtick code blocks: ```lang\ncode\n```
  str = str.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const cleanLang = lang ? lang.trim() : '';
    codeBlocks.push(`\`\`\`${cleanLang}\n${code}\n\`\`\``);
    return `\uE200CB${idx}\uE201`;
  });

  // 2. Inline code: `code`
  str = str.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`\`${code}\``);
    return `\uE200IC${idx}\uE201`;
  });

  // 3. Links: [label](url)
  str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const idx = links.length;
    links.push(`[${label}](${url})`);
    return `\uE200LK${idx}\uE201`;
  });

  // 4. Auto-escape remaining special characters for MarkdownV2
  // We need to carefully preserve *bold*, _italic_, __underline__, ~strike~, ||spoiler||, >quote
  // Escape non-formatting characters: # + - = { } . !
  str = str.replace(/(?<!\\)([#+\-={}.!])/g, '\\$1');

  // 5. Restore Links
  str = str.replace(/\uE200LK(\d+)\uE201/g, (_, idx) => links[Number(idx)] || '');

  // 6. Restore Inline Code
  str = str.replace(/\uE200IC(\d+)\uE201/g, (_, idx) => inlineCodes[Number(idx)] || '');

  // 7. Restore Code Blocks
  str = str.replace(/\uE200CB(\d+)\uE201/g, (_, idx) => codeBlocks[Number(idx)] || '');

  return str;
}

/**
 * Dedicated Telegram MarkdownV2 Sender
 */
export async function sendV2TelegramPost(
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

  const attachmentType = options?.attachmentType || dayRequest.attachmentType || 'none';
  const rawAttachmentUrl = (options?.attachmentUrl || dayRequest.attachmentUrl || '').trim();
  const rawAttachmentUrls = (options?.attachmentUrls || dayRequest.attachmentUrls || []).map(u => (u || '').trim()).filter(Boolean);

  const isVoiceMode = (attachmentType === 'voice') ||
    (attachmentType === 'audio' && ((options as any)?.audioFormat === 'voice' || (dayRequest as any)?.audioFormat === 'voice' || (dayRequest as any)?.audio_format === 'voice'));

  const inlineButtons = options?.inlineButtons || dayRequest.inlineButtons || [];

  // Generate MarkdownV2 text
  let v2Text = prepareTelegramMarkdownV2(content, title, uppercaseHeader);
  if (options?.signature) {
    v2Text += `\n\n_${sanitizeMarkdownV2(options.signature.trim())}_`;
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

      const hasShortCaption = v2Text.length <= 1024;
      const captionToSend = hasShortCaption ? v2Text : '';

      // 1. Photo
      if (attachmentType === 'photo' && rawAttachmentUrl) {
        const media = await fetchMediaBuffer(rawAttachmentUrl, 'photo.jpg', 'image/jpeg');
        if (media) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('photo', media.buffer, { filename: media.filename, contentType: media.contentType });
          if (hasShortCaption && captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'MarkdownV2');
          }
          if (replyMarkup) form.append('reply_markup', JSON.stringify(replyMarkup));

          const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
          });
          resultData = await res.json();
          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');
            if (!hasShortCaption) {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: channel,
                  text: v2Text,
                  parse_mode: 'MarkdownV2',
                  reply_markup: replyMarkup
                })
              });
            }
          }
        }
      }

      // 2. Video
      if (!sendSuccess && attachmentType === 'video' && rawAttachmentUrl) {
        const media = await fetchMediaBuffer(rawAttachmentUrl, 'video.mp4', 'video/mp4');
        if (media) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('video', media.buffer, { filename: media.filename, contentType: media.contentType });
          if (hasShortCaption && captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'MarkdownV2');
          }
          if (replyMarkup) form.append('reply_markup', JSON.stringify(replyMarkup));

          const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
          });
          resultData = await res.json();
          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');
          }
        }
      }

      // 3. Audio / Voice
      if (!sendSuccess && (attachmentType === 'audio' || attachmentType === 'voice') && rawAttachmentUrl) {
        const media = await fetchMediaBuffer(rawAttachmentUrl, isVoiceMode ? 'voice.ogg' : 'audio.mp3');
        if (media) {
          const method = isVoiceMode ? 'sendVoice' : 'sendAudio';
          const field = isVoiceMode ? 'voice' : 'audio';
          const buf = isVoiceMode ? await convertAudioToTelegramVoice(media.buffer) : media.buffer;

          const form = new FormData();
          form.append('chat_id', channel);
          form.append(field, buf, { filename: media.filename, contentType: media.contentType });
          if (hasShortCaption && captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'MarkdownV2');
          }
          if (replyMarkup) form.append('reply_markup', JSON.stringify(replyMarkup));

          const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
          });
          resultData = await res.json();
          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');
          }
        }
      }

      // 4. Document
      if (!sendSuccess && attachmentType === 'document' && rawAttachmentUrl) {
        const media = await fetchMediaBuffer(rawAttachmentUrl, 'document.bin');
        if (media) {
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('document', media.buffer, { filename: media.filename, contentType: media.contentType });
          if (hasShortCaption && captionToSend) {
            form.append('caption', captionToSend);
            form.append('parse_mode', 'MarkdownV2');
          }
          if (replyMarkup) form.append('reply_markup', JSON.stringify(replyMarkup));

          const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
          });
          resultData = await res.json();
          if (resultData.ok) {
            sendSuccess = true;
            lastMessageId = String(resultData.result?.message_id || '1');
          }
        }
      }

      // 5. Pure text message
      if (!sendSuccess) {
        const payload: any = {
          chat_id: channel,
          text: v2Text,
          parse_mode: 'MarkdownV2',
          link_preview_options: {
            is_disabled: !linkPreviewEnabled
          }
        };
        if (replyMarkup) payload.reply_markup = replyMarkup;

        let res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        resultData = await res.json();

        // If MarkdownV2 parsing error occurs, retry with sanitized plain text
        if (!resultData.ok && resultData.description && resultData.description.includes("can't parse entities")) {
          console.warn(`[sendV2TelegramPost] MarkdownV2 entity error, falling back to plain text:`, resultData.description);
          res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channel,
              text: stripHTML(content),
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

      if (sendSuccess) {
        successChannels.push(channel);
      } else {
        errors.push(`${channel}: ${resultData?.description || 'Неизвестная ошибка Telegram API'}`);
      }

    } catch (err: any) {
      console.error(`[sendV2TelegramPost] Exception sending to ${channel}:`, err);
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
