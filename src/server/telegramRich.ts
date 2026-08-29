import fetch from 'node-fetch';
import { DB, DayRequest } from './db';
import { getBotTokenFromSQLite } from './sqlite';
import { InlineButton } from '../types';
import { buildReplyMarkup } from './telegram';

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
  let value = rawText.trim();
  // Restore inline links [label](url) if escaped
  value = value.replace(/\\\[(.*?)\\\]\\\((.*?)\\\)/g, '[$1]($2)');
  return value;
}

/**
 * Dedicated Telegram Rich Message Sender
 * Uses Telegram /sendRichMessage endpoint with { chat_id, rich_message: { markdown } }
 * and handles inline keyboards and errors.
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

  const inlineButtons = options?.inlineButtons || dayRequest.inlineButtons || [];

  // Strictly use post body text without prepending card/post title
  const rawText = content !== undefined && content !== null ? content : '';
  const postText = prepareRichMarkdownText(rawText);

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

    const replyMarkup = buildReplyMarkup(inlineButtons, false);

    try {
      let sendSuccess = false;
      let resultData: any = null;

      // 1. ПРЯМАЯ ОТПРАВКА ЧЕРЕЗ ЭНДПОИНТ /sendRichMessage
      const payload: any = {
        chat_id: String(channel).trim(),
        rich_message: {
          markdown: postText
        }
      };

      if (replyMarkup) {
        payload.reply_markup = replyMarkup;
      }

      const richRes = await fetch(`https://api.telegram.org/bot${token}/sendRichMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      try {
        resultData = await richRes.json();
      } catch (parseErr: any) {
        resultData = { ok: false, description: `Ошибка ответа сервера: ${parseErr.message}` };
      }

      // Если в кнопках были WebApp / нестандартные URL, пробуем с fallback URL
      if (!resultData.ok && (resultData.description?.includes('BUTTON_TYPE_INVALID') || resultData.description?.includes('BUTTON_URL_INVALID'))) {
        const fallbackMarkup = buildReplyMarkup(inlineButtons, true);
        payload.reply_markup = fallbackMarkup;
        const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendRichMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        resultData = await retryRes.json();
      }

      if (resultData && resultData.ok) {
        sendSuccess = true;
        lastMessageId = Array.isArray(resultData.result)
          ? resultData.result[0]?.message_id?.toString()
          : resultData.result?.message_id?.toString() || '1';
        successChannels.push(channel);
      } else {
        const errorDesc = resultData?.description || 'Неизвестная ошибка Telegram API при вызове /sendRichMessage';
        errors.push(`Ошибка для ${channel}: ${errorDesc}`);
      }
    } catch (err: any) {
      errors.push(`Критическая ошибка для ${channel}: ${err.message || err}`);
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
