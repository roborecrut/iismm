import { DB, DayRequest } from './db';
import { getBotTokenFromSQLite } from './sqlite';
import { InlineButton } from '../types';

interface TelegramSendResponse {
  ok: boolean;
  messageId?: string;
  channel?: string;
  error?: string;
  simulated?: boolean;
  fallbackNotice?: string;
}

// Convert rich/v2 markdown text to Telegram HTML for flawless rendering
export function convertToTelegramHTML(text: string, format: string = 'v2'): string {
  if (!text) return '';

  let html = text;

  // 1. Custom Emoji: ![alt](tg://emoji?id=12345) -> <tg-emoji emoji-id="12345">alt</tg-emoji>
  html = html.replace(/!\[(.*?)\]\(tg:\/\/emoji\?id=(\d+)\)/gi, (_, alt, id) => {
    return `<tg-emoji emoji-id="${id}">${alt || '✨'}</tg-emoji>`;
  });

  // 2. Telegram Time: <tg-time unix="123" format="wDT">Label</tg-time> -> keep or format
  html = html.replace(/<tg-time.*?unix=["'](\d+)["'].*?>(.*?)<\/tg-time>/gi, '$2');

  // 3. Collapsible / Details: <details><summary>S</summary>C</details>
  html = html.replace(/<details.*?>\s*<summary>(.*?)<\/summary>([\s\S]*?)<\/details>/gi, '<b>$1</b>\n$2');

  // 4. Headings: # Heading -> <b>HEADING</b>
  html = html.replace(/^####\s+(.*$)/gim, '<b>$1</b>');
  html = html.replace(/^###\s+(.*$)/gim, '<b>$1</b>');
  html = html.replace(/^##\s+(.*$)/gim, '<b>$1</b>');
  html = html.replace(/^#\s+(.*$)/gim, '<b>$1</b>');

  // 5. Spoilers: ||text|| -> <span class="tg-spoiler">text</span>
  html = html.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="tg-spoiler">$1</span>');

  if (format === 'rich' || format === 'html') {
    // Bold: **text**
    html = html.replace(/\*\*([^\*\n]+)\*\*/g, '<b>$1</b>');
    // Strikethrough: ~~text~~
    html = html.replace(/~~([^~\n]+)~~/g, '<s>$1</s>');
    // Italic: *text*
    html = html.replace(/\*([^\*\n]+)\*/g, '<i>$1</i>');
  } else {
    // Markdown V2 format
    // Bold: *text*
    html = html.replace(/\*([^\*\n]+)\*/g, '<b>$1</b>');
    // Italic: _text_
    html = html.replace(/_([^\_\n]+)_/g, '<i>$1</i>');
    // Strikethrough: ~text~
    html = html.replace(/~([^~\n]+)~/g, '<s>$1</s>');
  }

  // Links: [label](url) -> <a href="url">label</a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Code inline: `code` -> <code>code</code>
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Blockquotes: > quote -> <blockquote>quote</blockquote>
  html = html.replace(/^>\s?(.*$)/gim, '<blockquote>$1</blockquote>');

  return html;
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
    inlineButtons?: InlineButton[][];
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
  const signature = options?.signature || dayRequest.signature || '';
  const attachmentType = options?.attachmentType || 'none';
  
  const resolveFullUrl = (urlStr: string): string => {
    if (!urlStr) return '';
    const trimmed = urlStr.trim();
    const match = trimmed.match(/f\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const file = DB.getFileByShortKey(match[1]);
      if (file && file.fullUrl) return file.fullUrl;
    }
    return trimmed;
  };

  const attachmentUrl = resolveFullUrl(options?.attachmentUrl || dayRequest.attachmentUrl || '');
  const attachmentUrls = (options?.attachmentUrls || dayRequest.attachmentUrls || []).map(resolveFullUrl);
  const inlineButtons = options?.inlineButtons || dayRequest.inlineButtons || [];

  const formattedTitle = uppercaseHeader ? title.toUpperCase() : title;

  let rawText = content !== undefined && content !== null ? content : '';
  if (!rawText && formattedTitle) {
    rawText = formattedTitle;
  }

  if (signature && signature.trim()) {
    rawText = `${rawText}\n\n${signature.trim()}`;
  }

  // Convert raw formatted text to Telegram HTML
  const fullHtmlText = convertToTelegramHTML(rawText, format);

  // Construct reply_markup for inline keyboard
  let replyMarkup: any = undefined;
  if (inlineButtons && inlineButtons.length > 0) {
    const keyboardRows = inlineButtons.map(row => {
      return row.map(btn => {
        const btnObj: any = { text: btn.text };
        if (btn.type === 'url') {
          btnObj.url = btn.url || 'https://example.com';
        } else if (btn.type === 'webapp') {
          btnObj.web_app = { url: btn.url || 'https://example.com' };
        } else {
          btnObj.callback_data = btn.callbackData || btn.text;
        }
        return btnObj;
      });
    });
    replyMarkup = { inline_keyboard: keyboardRows };
  }

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
        errors.push(`Не указан Telegram ID для отправки в ЛС`);
        continue;
      }
      channel = String(numericTgId);
    }

    try {
      let method = 'sendMessage';
      let bodyPayload: any = {};

      if (format === 'rich' && attachmentType === 'none') {
        method = 'sendRichMessage';
        bodyPayload = {
          chat_id: channel,
          rich_message: { markdown: rawText }
        };
        if (replyMarkup) bodyPayload.reply_markup = replyMarkup;
      } else {
        method = 'sendMessage';
        bodyPayload = { chat_id: channel, parse_mode: 'HTML' };
        if (replyMarkup) bodyPayload.reply_markup = replyMarkup;

        if (attachmentType === 'album' && attachmentUrls.length > 0) {
          method = 'sendMediaGroup';
          bodyPayload.media = attachmentUrls.slice(0, 10).map((url, idx) => ({
            type: url.match(/\.(mp4|mov|avi|mkv|webm)(\?.*)?$/i) ? 'video' : 'photo',
            media: url,
            caption: idx === 0 ? fullHtmlText : '',
            parse_mode: 'HTML'
          }));
        } else if (attachmentType === 'audio' && attachmentUrls.length > 1) {
          method = 'sendMediaGroup';
          bodyPayload.media = attachmentUrls.slice(0, 10).map((url, idx) => ({
            type: 'audio',
            media: url,
            caption: idx === 0 ? fullHtmlText : '',
            parse_mode: 'HTML'
          }));
        } else if (attachmentType === 'document' && attachmentUrls.length > 1) {
          method = 'sendMediaGroup';
          bodyPayload.media = attachmentUrls.slice(0, 10).map((url, idx) => ({
            type: 'document',
            media: url,
            caption: idx === 0 ? fullHtmlText : '',
            parse_mode: 'HTML'
          }));
        } else if (attachmentType !== 'none' && attachmentUrl.trim() !== '') {
          if (attachmentType === 'photo') {
            method = 'sendPhoto';
            bodyPayload.photo = attachmentUrl.trim();
            bodyPayload.caption = fullHtmlText;
          } else if (attachmentType === 'document') {
            method = 'sendDocument';
            bodyPayload.document = attachmentUrl.trim();
            bodyPayload.caption = fullHtmlText;
          } else if (attachmentType === 'video') {
            method = 'sendVideo';
            bodyPayload.video = attachmentUrl.trim();
            bodyPayload.caption = fullHtmlText;
          } else if (attachmentType === 'audio') {
            method = 'sendAudio';
            bodyPayload.audio = attachmentUrl.trim();
            bodyPayload.caption = fullHtmlText;
          } else if (attachmentType === 'video_note') {
            method = 'sendVideoNote';
            bodyPayload.video_note = attachmentUrl.trim();
            // If text is provided, send text first via sendMessage
            if (fullHtmlText && fullHtmlText.trim()) {
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: channel, text: fullHtmlText, parse_mode: 'HTML', reply_markup: replyMarkup })
                });
              } catch (e) {
                console.error('Failed to send text before video note:', e);
              }
            }
          }
        } else {
          bodyPayload.text = fullHtmlText;
        }
      }

      let url = `https://api.telegram.org/bot${token}/${method}`;
      let response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      let data = await response.json();

      if (!data.ok && method === 'sendRichMessage') {
        method = 'sendMessage';
        bodyPayload = { chat_id: channel, text: fullHtmlText, parse_mode: 'HTML' };
        if (replyMarkup) bodyPayload.reply_markup = replyMarkup;
        url = `https://api.telegram.org/bot${token}/${method}`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });
        data = await response.json();
      }

      if (data.ok) {
        lastMessageId = Array.isArray(data.result) ? data.result[0]?.message_id?.toString() : data.result?.message_id?.toString() || '1';
        successChannels.push(channel);
      } else {
        errors.push(`Ошибкa для ${channel}: ${data.description}`);
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

