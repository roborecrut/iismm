import FormData from 'form-data';
import fetch from 'node-fetch';
import { DB, DayRequest } from './db';
import { getBotTokenFromSQLite } from './sqlite';
import { InlineButton } from '../types';
import {
  convertToTelegramHTML,
  stripHTML,
  fetchMediaBuffer,
  resolvePublicUrl,
  buildReplyMarkup,
  convertAudioToTelegramVoice,
  convertVideoToTelegramVideoNote
} from './telegram';

export interface TelegramV2SendResponse {
  ok: boolean;
  messageId?: string;
  channel?: string;
  error?: string;
  simulated?: boolean;
  fallbackNotice?: string;
}

/**
 * Dedicated Telegram V2 Sender (MarkdownV2 / HTML standard API workflow)
 * NOTE: Post/card title is NEVER included in the published message.
 */
export async function sendV2TelegramMessage(
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
): Promise<TelegramV2SendResponse> {
  const settings = DB.getSettings();
  const token = getBotTokenFromSQLite() || settings.telegramBotToken || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';

  const targetChannels = options?.channels && options.channels.length > 0
    ? options.channels
    : (dayRequest.channels && dayRequest.channels.length > 0 ? dayRequest.channels : [dayRequest.channel || settings.channelId || '@SAV_AI']);

  const linkPreviewEnabled = options?.linkPreviewEnabled !== undefined 
    ? options.linkPreviewEnabled 
    : (dayRequest.linkPreviewEnabled !== false);
  const attachmentType = options?.attachmentType || dayRequest.attachmentType || 'none';

  const isVoiceMode = (attachmentType === 'voice') || 
    (attachmentType === 'audio' && ((options as any)?.audioFormat === 'voice' || (dayRequest as any)?.audioFormat === 'voice' || (dayRequest as any)?.audio_format === 'voice'));

  const rawAttachmentUrl = (options?.attachmentUrl || dayRequest.attachmentUrl || '').trim();
  const rawAttachmentUrls = (options?.attachmentUrls || dayRequest.attachmentUrls || []).map(u => (u || '').trim()).filter(Boolean);
  const inlineButtons = options?.inlineButtons || dayRequest.inlineButtons || [];

  // Strictly use post body text without prepending card/post title
  let rawText = content !== undefined && content !== null ? content : '';

  // Convert to Telegram V2 HTML
  const fullHtmlText = convertToTelegramHTML(rawText, 'v2');

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

      const hasShortCaption = fullHtmlText.length <= 1024;
      const captionToSend = hasShortCaption ? fullHtmlText : '';

      // 1. ALBUM ATTACHMENTS
      if (attachmentType === 'album' && (rawAttachmentUrls.length > 0 || rawAttachmentUrl)) {
        const urlsToProcess = (rawAttachmentUrls.length > 0 ? rawAttachmentUrls : [rawAttachmentUrl]).filter(u => Boolean(u && typeof u === 'string' && u.trim()));
        const mediaBuffers = await Promise.all(urlsToProcess.slice(0, 10).map(u => fetchMediaBuffer(u)));
        const validBuffers = mediaBuffers.filter(b => b !== null) as { buffer: Buffer; filename: string; contentType: string; mediaType: 'photo' | 'video' | 'audio' | 'document' }[];

        if (validBuffers.length === 1) {
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

      // 2. SINGLE PHOTO
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

          if (!resultData.ok && resultData.description && (resultData.description.includes('entities') || resultData.description.includes('tag') || resultData.description.includes('HTML'))) {
            const retryForm = new FormData();
            retryForm.append('chat_id', channel);
            retryForm.append('photo', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
            if (captionToSend) {
              retryForm.append('caption', stripHTML(captionToSend));
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
          }
        }

        // Direct URL fallback if buffer wasn't loaded or buffer upload failed
        if (!sendSuccess) {
          const publicUrl = await resolvePublicUrl(targetUrl);
          if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
            try {
              const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: channel,
                  photo: publicUrl,
                  caption: captionToSend || undefined,
                  parse_mode: captionToSend ? 'HTML' : undefined,
                  reply_markup: hasShortCaption ? replyMarkup : undefined
                })
              });
              resultData = await res.json();
              if (resultData.ok) sendSuccess = true;
            } catch (e) {}
          }
        }

        if (sendSuccess && (!hasShortCaption || (!hasShortCaption && replyMarkup))) {
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

      // 3. SINGLE VIDEO
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

          if (resultData.ok) {
            sendSuccess = true;
          }
        }

        // Direct URL fallback if buffer wasn't loaded or buffer upload failed
        if (!sendSuccess) {
          const publicUrl = await resolvePublicUrl(targetUrl);
          if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
            try {
              const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: channel,
                  video: publicUrl,
                  caption: captionToSend || undefined,
                  parse_mode: captionToSend ? 'HTML' : undefined,
                  reply_markup: hasShortCaption ? replyMarkup : undefined
                })
              });
              resultData = await res.json();
              if (resultData.ok) sendSuccess = true;
            } catch (e) {}
          }
        }
      }

      // 4. VIDEO NOTE (Кружок)
      else if (attachmentType === 'video_note' && (rawAttachmentUrl || rawAttachmentUrls.length > 0)) {
        const targetUrl = rawAttachmentUrl || rawAttachmentUrls[0];
        const mediaFile = await fetchMediaBuffer(targetUrl);

        if (mediaFile) {
          const processedVideoNote = await convertVideoToTelegramVideoNote(mediaFile.buffer);
          const form = new FormData();
          form.append('chat_id', channel);
          form.append('video_note', processedVideoNote, { filename: 'video_note.mp4', contentType: 'video/mp4' });
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
            if (fullHtmlText) {
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
      }

      // 5. AUDIO OR VOICE
      else if ((attachmentType === 'audio' || attachmentType === 'voice') && (rawAttachmentUrl || rawAttachmentUrls.length > 0)) {
        const urlsToProcess = (rawAttachmentUrls.length > 0 ? rawAttachmentUrls : [rawAttachmentUrl]).filter(u => Boolean(u && typeof u === 'string' && u.trim()));

        if (isVoiceMode) {
          // Voice mode: Telegram sendVoice does not support album groupings
          for (let i = 0; i < urlsToProcess.length; i++) {
            const targetUrl = urlsToProcess[i];
            const mediaFile = await fetchMediaBuffer(targetUrl);
            const isFirst = (i === 0);
            const isLast = (i === urlsToProcess.length - 1);
            const voiceCaption = isFirst && hasShortCaption ? captionToSend : undefined;
            const voiceMarkup = isLast ? replyMarkup : undefined;

            if (mediaFile) {
              const voiceBuffer = await convertAudioToTelegramVoice(mediaFile.buffer);
              const form = new FormData();
              form.append('chat_id', channel);
              form.append('voice', voiceBuffer, { filename: `voice_${i}.ogg`, contentType: 'audio/ogg' });
              if (voiceCaption) {
                form.append('caption', voiceCaption);
                form.append('parse_mode', 'HTML');
              }
              if (voiceMarkup) {
                form.append('reply_markup', JSON.stringify(voiceMarkup));
              }

              const res = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, {
                method: 'POST',
                headers: form.getHeaders(),
                body: form.getBuffer()
              });
              resultData = await res.json();
              if (resultData?.ok) sendSuccess = true;
            }
          }
        } else if (urlsToProcess.length === 1) {
          // Single Audio Track
          const targetUrl = urlsToProcess[0];
          const mediaFile = await fetchMediaBuffer(targetUrl);

          if (mediaFile) {
            const form = new FormData();
            form.append('chat_id', channel);
            form.append('audio', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
            if (captionToSend) {
              form.append('caption', captionToSend);
              form.append('parse_mode', 'HTML');
            }
            if (replyMarkup) {
              form.append('reply_markup', JSON.stringify(replyMarkup));
            }

            const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
              method: 'POST',
              headers: form.getHeaders(),
              body: form.getBuffer()
            });
            resultData = await res.json();

            if (resultData?.ok) {
              sendSuccess = true;
            }
          }

          // Direct URL fallback for audio if buffer failed
          if (!sendSuccess) {
            const publicUrl = await resolvePublicUrl(targetUrl);
            if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
              try {
                const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    audio: publicUrl,
                    caption: captionToSend || undefined,
                    parse_mode: captionToSend ? 'HTML' : undefined,
                    reply_markup: replyMarkup
                  })
                });
                resultData = await res.json();
                if (resultData.ok) sendSuccess = true;
              } catch (e) {}
            }
          }
        } else {
          // Multiple Audio Tracks -> Group into single sendMediaGroup album!
          const mediaBuffers = await Promise.all(urlsToProcess.slice(0, 10).map(u => fetchMediaBuffer(u)));
          const validBuffers = mediaBuffers.filter(b => b !== null) as { buffer: Buffer; filename: string; contentType: string; mediaType: 'photo' | 'video' | 'audio' | 'document' }[];

          if (validBuffers.length >= 2) {
            const form = new FormData();
            form.append('chat_id', channel);

            const mediaArray = validBuffers.map((item, idx) => {
              const fieldName = `audio_${idx}`;
              const safeName = item.filename || `track_${idx + 1}.mp3`;
              const mimeType = item.contentType?.includes('audio') ? item.contentType : 'audio/mpeg';
              form.append(fieldName, item.buffer, { filename: safeName, contentType: mimeType });
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

            // Retry with stripped HTML if formatting entities failed
            if (!resultData.ok && resultData.description && (resultData.description.includes('entities') || resultData.description.includes('tag') || resultData.description.includes('HTML'))) {
              const retryForm = new FormData();
              retryForm.append('chat_id', channel);
              const plainCaption = hasShortCaption ? stripHTML(captionToSend) : undefined;
              const retryMedia = validBuffers.map((item, idx) => {
                const fieldName = `audio_${idx}`;
                const safeName = item.filename || `track_${idx + 1}.mp3`;
                const mimeType = item.contentType?.includes('audio') ? item.contentType : 'audio/mpeg';
                retryForm.append(fieldName, item.buffer, { filename: safeName, contentType: mimeType });
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
          } else if (validBuffers.length === 1) {
            const item = validBuffers[0];
            const form = new FormData();
            form.append('chat_id', channel);
            form.append('audio', item.buffer, { filename: item.filename, contentType: item.contentType });
            if (captionToSend) {
              form.append('caption', captionToSend);
              form.append('parse_mode', 'HTML');
            }
            if (replyMarkup) {
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

          // Direct public URL fallback for multiple audio files
          if (!sendSuccess) {
            const resolvedUrls = (await Promise.all(urlsToProcess.map(u => resolvePublicUrl(u)))).filter(u => u && (u.startsWith('http://') || u.startsWith('https://')));
            if (resolvedUrls.length >= 2) {
              try {
                const mediaArray = resolvedUrls.slice(0, 10).map((url, idx) => ({
                  type: 'audio',
                  media: url,
                  caption: idx === 0 && hasShortCaption ? captionToSend : undefined,
                  parse_mode: idx === 0 && hasShortCaption ? 'HTML' : undefined
                }));
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
                          text: fullHtmlText || 'Подробнее:',
                          parse_mode: 'HTML',
                          reply_markup: replyMarkup
                        })
                      });
                    } catch (e) {}
                  }
                }
              } catch (e) {}
            } else if (resolvedUrls.length === 1) {
              try {
                const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    audio: resolvedUrls[0],
                    caption: captionToSend || undefined,
                    parse_mode: captionToSend ? 'HTML' : undefined,
                    reply_markup: replyMarkup
                  })
                });
                resultData = await res.json();
                if (resultData.ok) sendSuccess = true;
              } catch (e) {}
            }
          }
        }
      }

      // 6. DOCUMENT / FILE
      else if (attachmentType === 'document' && (rawAttachmentUrl || rawAttachmentUrls.length > 0)) {
        const urlsToProcess = (rawAttachmentUrls.length > 0 ? rawAttachmentUrls : [rawAttachmentUrl]).filter(u => Boolean(u && typeof u === 'string' && u.trim()));

        if (urlsToProcess.length === 1) {
          // Single Document
          const targetUrl = urlsToProcess[0];
          const mediaFile = await fetchMediaBuffer(targetUrl);

          if (mediaFile) {
            const form = new FormData();
            form.append('chat_id', channel);
            form.append('document', mediaFile.buffer, { filename: mediaFile.filename, contentType: mediaFile.contentType });
            if (captionToSend) {
              form.append('caption', captionToSend);
              form.append('parse_mode', 'HTML');
            }
            if (replyMarkup) {
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
            }
          }

          // Direct URL fallback for document if buffer failed
          if (!sendSuccess) {
            const publicUrl = await resolvePublicUrl(targetUrl);
            if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
              try {
                const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    document: publicUrl,
                    caption: captionToSend || undefined,
                    parse_mode: captionToSend ? 'HTML' : undefined,
                    reply_markup: replyMarkup
                  })
                });
                resultData = await res.json();
                if (resultData.ok) sendSuccess = true;
              } catch (e) {}
            }
          }
        } else {
          // Multiple Documents -> Group into single sendMediaGroup album!
          const mediaBuffers = await Promise.all(urlsToProcess.slice(0, 10).map(u => fetchMediaBuffer(u)));
          const validBuffers = mediaBuffers.filter(b => b !== null) as { buffer: Buffer; filename: string; contentType: string; mediaType: 'photo' | 'video' | 'audio' | 'document' }[];

          if (validBuffers.length >= 2) {
            const form = new FormData();
            form.append('chat_id', channel);

            const mediaArray = validBuffers.map((item, idx) => {
              const fieldName = `doc_${idx}`;
              const safeName = item.filename || `document_${idx + 1}.bin`;
              const mimeType = item.contentType || 'application/octet-stream';
              form.append(fieldName, item.buffer, { filename: safeName, contentType: mimeType });
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

            // Retry with stripped HTML if formatting entities failed
            if (!resultData.ok && resultData.description && (resultData.description.includes('entities') || resultData.description.includes('tag') || resultData.description.includes('HTML'))) {
              const retryForm = new FormData();
              retryForm.append('chat_id', channel);
              const plainCaption = hasShortCaption ? stripHTML(captionToSend) : undefined;
              const retryMedia = validBuffers.map((item, idx) => {
                const fieldName = `doc_${idx}`;
                const safeName = item.filename || `document_${idx + 1}.bin`;
                const mimeType = item.contentType || 'application/octet-stream';
                retryForm.append(fieldName, item.buffer, { filename: safeName, contentType: mimeType });
                return {
                  type: 'document',
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
          } else if (validBuffers.length === 1) {
            const item = validBuffers[0];
            const form = new FormData();
            form.append('chat_id', channel);
            form.append('document', item.buffer, { filename: item.filename, contentType: item.contentType });
            if (captionToSend) {
              form.append('caption', captionToSend);
              form.append('parse_mode', 'HTML');
            }
            if (replyMarkup) {
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

          // Direct public URL fallback for multiple documents
          if (!sendSuccess) {
            const resolvedUrls = (await Promise.all(urlsToProcess.map(u => resolvePublicUrl(u)))).filter(u => u && (u.startsWith('http://') || u.startsWith('https://')));
            if (resolvedUrls.length >= 2) {
              try {
                const mediaArray = resolvedUrls.slice(0, 10).map((url, idx) => ({
                  type: 'document',
                  media: url,
                  caption: idx === 0 && hasShortCaption ? captionToSend : undefined,
                  parse_mode: idx === 0 && hasShortCaption ? 'HTML' : undefined
                }));
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
                          text: fullHtmlText || 'Подробнее:',
                          parse_mode: 'HTML',
                          reply_markup: replyMarkup
                        })
                      });
                    } catch (e) {}
                  }
                }
              } catch (e) {}
            } else if (resolvedUrls.length === 1) {
              try {
                const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: channel,
                    document: resolvedUrls[0],
                    caption: captionToSend || undefined,
                    parse_mode: captionToSend ? 'HTML' : undefined,
                    reply_markup: replyMarkup
                  })
                });
                resultData = await res.json();
                if (resultData.ok) sendSuccess = true;
              } catch (e) {}
            }
          }
        }
      }

      // 7. STANDARD TEXT MESSAGE (or fallback when attachmentType === 'none' or media upload failed)
      if (!sendSuccess) {
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
