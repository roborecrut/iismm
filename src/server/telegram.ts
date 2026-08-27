import { DB, DayRequest } from './db';
import { getBotTokenFromSQLite } from './sqlite';
import { InlineButton } from '../types';
import { 
  TelegramSendResponse,
  convertVideoToTelegramVideoNote,
  convertAudioToTelegramVoice,
  stripHTML,
  toSafeFilename,
  detectBufferMediaMeta,
  fetchMediaBuffer,
  resolvePublicUrl,
  buildReplyMarkup
} from './telegramUtils';
import { sendRichTelegramPost, processRichTextToTelegramHTML, balanceTelegramHTMLTags, formatRichTableForTelegram } from './telegramRich';
import { sendV2TelegramPost, prepareTelegramMarkdownV2, sanitizeMarkdownV2 } from './telegramV2';

// Re-export types and utility functions
export type { TelegramSendResponse };
export {
  convertVideoToTelegramVideoNote,
  convertAudioToTelegramVoice,
  stripHTML,
  toSafeFilename,
  detectBufferMediaMeta,
  fetchMediaBuffer,
  resolvePublicUrl,
  buildReplyMarkup,
  sendRichTelegramPost,
  processRichTextToTelegramHTML,
  balanceTelegramHTMLTags,
  formatRichTableForTelegram,
  sendV2TelegramPost,
  prepareTelegramMarkdownV2,
  sanitizeMarkdownV2
};

// Legacy alias helpers for backwards compatibility
export function convertToTelegramHTML(text: string, format: string = 'v2'): string {
  if (format === 'rich' || format === 'html') {
    return processRichTextToTelegramHTML(text, '', false);
  }
  return prepareTelegramMarkdownV2(text, '', false);
}

export function convertRichToTelegramHTML(text: string): string {
  return processRichTextToTelegramHTML(text, '', false);
}

/**
 * Main Telegram Dispatcher:
 * Automatically routes messages to the dedicated Rich pipeline or V2 pipeline based on format!
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
  const format = (options?.messageFormat || dayRequest?.messageFormat || 'rich').toLowerCase();

  if (format === 'rich' || format === 'html') {
    return sendRichTelegramPost(title, content, dayRequest, options);
  } else {
    return sendV2TelegramPost(title, content, dayRequest, options);
  }
}

/**
 * Send direct private Telegram notification (admin alerts, logs, etc.)
 */
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
