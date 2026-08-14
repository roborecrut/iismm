import { DB } from './db';

export interface ProTalkResponse {
  title: string;
  content: string;
}

/**
 * Generate a new topic by analyzing historical posts (ProTalk -> Local Fallback)
 */
export async function generateTopicFromHistory(
  topicCategory: string,
  recentPublications: string[]
): Promise<string> {
  const settings = DB.getSettings();
  const protalkBotId = settings?.protalkBotId?.trim() || process.env.PROTALK_BOT_ID || '66275';
  const protalkBotToken = settings?.protalkBotToken?.trim() || process.env.PROTALK_BOT_TOKEN || 'GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE';

  const promptForTopic = `Изучи последние ${recentPublications.length} постов на тему "${topicCategory}". Придумай 1 совершенно новую, конкретную, актуальную тему для следующего экспертного поста в Telegram, чтобы избежать повторений. Напиши ТОЛЬКО название темы (до 80 символов).`;

  // 1. Try ProTalk API
  if (protalkBotId && protalkBotToken) {
    try {
      console.log(`[ProTalk Topic] Executing ProTalk API call with Bot ID: ${protalkBotId}...`);
      const rawRes = await callProTalkBotApi(promptForTopic, protalkBotId, protalkBotToken);
      const clean = rawRes.replace(/^[#"'\s]+|[#"'\s]+$/g, '').slice(0, 100);
      if (clean && clean.length > 5) {
        return clean;
      }
    } catch (err: any) {
      console.warn('[ProTalk Topic Warning]: ProTalk API call failed for Bot ID ' + protalkBotId + ':', err?.message);
    }
  }

  // 2. Fallback Topic Generator if external API calls fail
  const fallbackTopics = [
    `Инновации и свежие кейсы в сфере ${topicCategory}`,
    `Разбор главных ошибок и решений в ${topicCategory}`,
    `Практическое руководство по автоматизации для ${topicCategory}`,
    `Ключевые тренды и перспективы в ${topicCategory}`
  ];
  return fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
}

/**
 * Direct call to ProTalk Bot API using send_message_async & get_last_reply polling protocol
 */
export async function callProTalkBotApi(
  promptText: string,
  botId?: string,
  botToken?: string,
  userChatId?: string
): Promise<string> {
  const settings = DB.getSettings();
  const rawId = botId || settings?.protalkBotId?.trim() || process.env.PROTALK_BOT_ID || '66275';
  const token = botToken || settings?.protalkBotToken?.trim() || process.env.PROTALK_BOT_TOKEN || 'GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE';

  if (!rawId || !token) {
    throw new Error('ProTalk API не настроен. Укажите ID бота (bot_id) и Токен API (bot_token) в Настройках системы.');
  }

  const numericBotId = isNaN(Number(rawId)) ? rawId : Number(rawId);
  const chatId = userChatId && String(userChatId).trim() ? String(userChatId).trim() : `ask${Math.floor(1000 + Math.random() * 9000)}`;

  console.log(`[ProTalk] Sending async message to bot_id=${numericBotId}, chat_id=${chatId}...`);

  // Step 1: Send message asynchronously
  const sendUrl = 'https://eu1.api.pro-talk.ru/api/v1.0/send_message_async';
  const sendRes = await fetch(sendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bot_id: numericBotId,
      bot_token: token,
      bot_chat_id: chatId,
      message: promptText
    })
  });

  if (!sendRes.ok) {
    const errText = await sendRes.text().catch(() => '');
    console.warn(`[ProTalk Send Error] HTTP ${sendRes.status}: ${errText}`);
    // Try fallback endpoint if primary domain is blocked
    const fallbackSend = await fetch(`https://pro-talk.ru/api/v1/bot/${numericBotId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bot_id: numericBotId,
        bot_token: token,
        message: promptText
      })
    }).catch(() => null);

    if (fallbackSend && fallbackSend.ok) {
      const fbData = await fallbackSend.json() as any;
      const fbMsg = fbData.response || fbData.message || fbData.text;
      if (fbMsg) return fbMsg.trim();
    }
  }

  // Step 2: Poll for last reply using get_last_reply
  const pollUrl = 'https://eu1.api.pro-talk.ru/api/v1.0/get_last_reply';
  const timeoutMs = 60000; // 60 seconds max
  const pollIntervalMs = 3000; // poll every 3 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    try {
      const pollRes = await fetch(pollUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: numericBotId,
          bot_token: token,
          bot_chat_id: chatId
        })
      });

      if (pollRes.ok) {
        const replyData = await pollRes.json() as any;
        const msg = replyData.message || replyData.data?.message || replyData.text || replyData.reply;
        if (msg && typeof msg === 'string' && msg.trim().length > 0) {
          console.log(`[ProTalk Success] Received response for bot_id=${numericBotId} in ${Math.round((Date.now() - startTime)/1000)}s`);
          return msg.trim();
        }
      }
    } catch (pollErr: any) {
      console.warn('[ProTalk Poll Retry Error]:', pollErr?.message);
    }
  }

  throw new Error(`ProTalk API timeout: ответ не получен от бота ${numericBotId} за 60 секунд.`);
}

/**
 * Generate Prokhor Prompt / Post using ProTalk API & System Prompts from DB
 */
export async function generateProkhorPrompt(
  dayOfWeek: string,
  category: string,
  requestTemplate: string,
  customInstructions?: string,
  recentPublications?: string[],
  extraParams?: {
    title?: string;
    currentText?: string;
    maxChars?: number;
    messageFormat?: string;
    escapeMode?: boolean;
    postStyle?: string;
    styleDesc?: string;
  }
): Promise<ProTalkResponse> {
  const settings = DB.getSettings();
  const protalkBotId = settings?.protalkBotId?.trim() || process.env.PROTALK_BOT_ID || '66275';
  const protalkBotToken = settings?.protalkBotToken?.trim() || process.env.PROTALK_BOT_TOKEN || 'GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE';

  // Fetch system prompt for post writer from DB
  const sysPromptObj = DB.getSystemPromptByKey('post_writer');
  let promptTemplate = sysPromptObj?.promptText;

  if (!promptTemplate) {
    promptTemplate = `Ты — харизматичный и высококлассный ИИ-копирайтер SMM-синдиката ProTalk. Твоя задача — генерировать увлекательные, структурированные, ценные и виральные публикации для Telegram.

[ИСХОДНЫЕ ДАННЫЕ И НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ]:
- Заголовок/Тема поста: {title}
- Запрос / Пожелания пользователя: {user_prompt}
- Исходный / Текущий текст (для доработки/продолжения): {current_text}
- Выбранный стиль поста: {post_style} ({style_desc})
- Ограничение по объему: НЕ БОЛЕЕ {max_chars} символов.
- Форматирование: {message_format} ({escape_mode})
- Категория / Тема: {category}
- День недели: {day_of_week}
- Дополнительные указания: {custom_instructions}
- Память уникальности (ранее опубликованные посты): {uniqueness_context}

[ПРАВИЛА И ТРЕБОВАНИЯ К ПОСТУ]:
1. Если заголовок, промпт и текущий текст пусты — сгенерируй полноценный, свежий, увлекательный экспертный пост на СВОБОДНУЮ АКТУАЛЬНУЮ ТЕМУ в сфере SMM, ИИ, Telegram, бизнеса или маркетинга и придумай сочный заголовок.
2. Строго соблюдай выбранный стиль поста "{post_style}" от первой до последней строчки.
3. Оформляй пост с использованием легко читаемых абзацев, подзаголовков, эмодзи и структурированных списков.
4. Не повторяй идеи и формулировки из памяти уникальности.
5. Соблюдай ограничение объёма ({max_chars} символов).

ВЫДАЙ ОТВЕТ СТРОГО В ФОРМАТЕ JSON:
{
  "title": "Сочный заголовок поста (без кавычек)",
  "content": "Полный текст поста с эмодзи и абзацами. Если есть инлайн-кнопки в конце, укажи их в формате ##INLINE:Кнопка 1;https://link.ru##"
}`;
  }

  const titleVal = extraParams?.title?.trim() || '';
  const userPromptVal = requestTemplate?.trim() || '';
  const currentTextVal = extraParams?.currentText?.trim() || '';
  const styleVal = extraParams?.postStyle || 'Стандартный SMM';
  const styleDescVal = extraParams?.styleDesc || 'Экспертный и увлекательный стиль';
  const maxCharsVal = extraParams?.maxChars ? String(extraParams.maxChars) : '2500';
  const formatVal = extraParams?.messageFormat === 'v2' ? 'Markdown V2' : 'Rich HTML';
  const escapeVal = extraParams?.escapeMode ? 'Соблюдать экранирование спецсимволов' : 'Пиши чисто без сбоев экранирования';
  const categoryVal = category || 'SMM & AI';
  const dayVal = dayOfWeek || 'Сегодня';
  const customVal = customInstructions || 'Нет дополнительных указаний';

  let uniquenessContext = 'Отсутствует (нет совпадений)';
  if (recentPublications && recentPublications.length > 0) {
    uniquenessContext = `Исключи повторы и совпадения с этими постами:\n` +
      recentPublications.map((p, idx) => `${idx + 1}. ${p.slice(0, 200)}...`).join('\n');
  }

  // Compile prompt template by replacing macros
  const compiledPrompt = promptTemplate
    .replace(/\{title\}/g, titleVal || 'Придумай сочный заголовок')
    .replace(/\{user_prompt\}/g, userPromptVal || 'Создать экспертную, полезную публикацию')
    .replace(/\{current_text\}/g, currentTextVal || 'Отсутствует')
    .replace(/\{post_style\}/g, styleVal)
    .replace(/\{style_desc\}/g, styleDescVal)
    .replace(/\{max_chars\}/g, maxCharsVal)
    .replace(/\{message_format\}/g, formatVal)
    .replace(/\{escape_mode\}/g, escapeVal)
    .replace(/\{category\}/g, categoryVal)
    .replace(/\{day_of_week\}/g, dayVal)
    .replace(/\{custom_instructions\}/g, customVal)
    .replace(/\{uniqueness_context\}/g, uniquenessContext);

  // 1. TRY PROTALK API
  if (protalkBotId && protalkBotToken) {
    try {
      console.log(`[ProTalk API] Requesting generation via bot_id: ${protalkBotId}...`);
      const rawResponse = await callProTalkBotApi(compiledPrompt, protalkBotId, protalkBotToken);

      // Attempt to parse JSON from response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.title || parsed.content) {
          return {
            title: parsed.title || titleVal || `Пост на тему ${category || 'SMM'}`,
            content: parsed.content || rawResponse
          };
        }
      }

      // If text response returned directly
      const lines = rawResponse.split('\n').filter(l => l.trim().length > 0);
      const firstLine = lines[0] ? lines[0].replace(/^[#*"\s]+|[#*"\s]+$/g, '') : `Пост: ${category || 'SMM'}`;
      return {
        title: firstLine.length < 100 ? firstLine : (titleVal || `Пост на тему ${category || 'SMM'}`),
        content: rawResponse
      };
    } catch (protalkError: any) {
      console.warn('[ProTalk API Fallback]:', protalkError?.message);
    }
  }

  // 2. ULTIMATE LOCAL FALLBACK
  const fallbackTitle = titleVal || `🔥 Экспертный пост: ${category || 'SMM & AI'}`;
  const fallbackContent = extraParams?.currentText 
    ? `${extraParams.currentText}\n\n✨ **Дополнение от ИИ:**\nНастройте автопостинг и интеграцию с ProTalk для непрерывного роста вашей аудитории!`
    : `🚀 **${fallbackTitle}**\n\nИскусственный интеллект и автоматизация SMM помогают привлекать новых подписчиков 24/7.\n\n✨ **Ключевые преимущества:**\n1. Глубокая уникализация контента.\n2. Публикации по часовым поясам.\n3. Умные автоответчики в чатах.\n\n👉 Запустите автопилот уже сегодня!`;

  return {
    title: fallbackTitle,
    content: fallbackContent
  };
}

/**
 * Generate Image Prompt based on Post text via ProTalk API
 */
export async function generateImagePromptFromPost(
  postTitle: string,
  postText: string,
  styleGuide?: string
): Promise<string> {
  const settings = DB.getSettings();
  const protalkBotId = settings?.protalkBotId?.trim() || process.env.PROTALK_BOT_ID || '66275';
  const protalkBotToken = settings?.protalkBotToken?.trim() || process.env.PROTALK_BOT_TOKEN || 'GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE';

  const promptRequest = `Ты — профессиональный арт-директор. На основе заголовка "${postTitle}" и текста поста "${postText.slice(0, 500)}" напиши 1 короткий, яркий промпт НА АНГЛИЙСКОМ ЯЗЫКЕ для генерации картинки в нейросети Flux / Midjourney / ProTalk AI. ${styleGuide ? `Стиль: ${styleGuide}` : ''}. Выдай исключительно чистый текст промпта на английском языке без кавычек и префиксов.`;

  if (protalkBotId && protalkBotToken) {
    try {
      const res = await callProTalkBotApi(promptRequest, protalkBotId, protalkBotToken);
      if (res && res.trim().length > 10) {
        return res.replace(/^["']|["']$/g, '').trim();
      }
    } catch (e) {
      console.warn('ProTalk image prompt generation fallback:', e);
    }
  }

  return `High resolution futuristic digital illustration for ${postTitle || 'AI automation'}, cinematic lighting, 8k, photorealistic details`;
}

/**
 * Generate image URL via ProTalk / Flux image engine using system prompt from DB
 */
export async function generateProTalkImage(promptText: string): Promise<string> {
  const settings = DB.getSettings();
  const protalkBotId = settings?.protalkBotId?.trim() || process.env.PROTALK_BOT_ID || '66275';
  const protalkBotToken = settings?.protalkBotToken?.trim() || process.env.PROTALK_BOT_TOKEN || 'GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE';

  const cleanPrompt = promptText.trim() || 'Futuristic AI concept art, 8k resolution';

  // Fetch system prompt for image generation from DB
  const sysPromptObj = DB.getSystemPromptByKey('image_prompt_generator');
  const baseSysPrompt = sysPromptObj?.promptText || 'Ты — профессиональный арт-директор. Составляй сочный англоязычный промпт для нейросети.';

  let enhancedPrompt = cleanPrompt;

  // Try calling ProTalk to optimize the image prompt if bot is configured
  if (protalkBotId && protalkBotToken) {
    try {
      const fullReq = `${baseSysPrompt}\n\n[ИСХОДНЫЙ ПРОМПТ ПОЛЬЗОВАТЕЛЯ]: "${cleanPrompt}"\nВыдай ТОЛЬКО итоговый оптимизированный англоязычный промпт для картинки.`;
      const res = await callProTalkBotApi(fullReq, protalkBotId, protalkBotToken);
      if (res && res.trim().length > 10) {
        enhancedPrompt = res.replace(/^["']|["']$/g, '').trim();
      }
    } catch (e) {
      console.warn('[ProTalk Image Prompt Optimization Warning]:', e);
    }
  }

  const seed = Math.floor(Math.random() * 1000000);
  const encoded = encodeURIComponent(enhancedPrompt);
  
  // Direct ProTalk FLUX image generator endpoint
  return `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=1080&nologo=true&seed=${seed}&model=flux`;
}
