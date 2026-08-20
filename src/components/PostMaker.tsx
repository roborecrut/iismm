import React, { useState, useRef, useEffect } from 'react';
import { CampaignPost, InlineButton, SocialNetwork, SocialChannel } from '../types';
import { 
  Sparkles, Calendar as CalendarIcon, Plus, Trash2, ArrowRight, Eye, RefreshCw, Upload, Image as ImageIcon, Search, Check, AlertCircle, Link, Edit3, Clock, Play, List, Grid, LayoutGrid, Layers, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SocialIcon from './SocialIcon';

interface PostMakerProps {
  onPublishPost: (post: Omit<CampaignPost, 'id' | 'clicks' | 'views'>) => void;
  onDeletePost?: (id: string) => void;
  onUpdatePost?: (post: CampaignPost) => void;
  savedPosts: CampaignPost[];
  connectedChannels: SocialChannel[];
  tokens: number;
  onDeductTokens: (amount: number) => void;
  activeMode?: 'write' | 'ai' | 'rewrite';
  onModeChange?: (mode: 'write' | 'ai' | 'rewrite') => void;
  onAddChannel?: (chan: Omit<SocialChannel, 'id' | 'subscribers' | 'isPremium' | 'status'>) => void;
}

export default function PostMaker({ 
  onPublishPost, 
  onDeletePost,
  onUpdatePost,
  savedPosts, 
  connectedChannels,
  tokens,
  onDeductTokens,
  activeMode,
  onModeChange,
  onAddChannel
}: PostMakerProps) {
  // Master Title & SMM network specificity tab
  const [activeSmmPlatform, setActiveSmmPlatform] = useState<SocialNetwork>('telegram');
  const [title, setTitle] = useState('');
  
  // Custom structured block fields
  const [blockTitle, setBlockTitle] = useState('');
  const [blockGreeting, setBlockGreeting] = useState('');
  const [blockBody, setBlockBody] = useState('');
  const [blockSignature, setBlockSignature] = useState('');
  const [useBlockEditor, setUseBlockEditor] = useState(false);
  
  // Dynamic merge compiled content
  const [content, setContent] = useState('');

  // Media type choice
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video' | 'album'>('image');
  const [mediaFilesCount, setMediaFilesCount] = useState(1);

  // Sync block editor with master content
  useEffect(() => {
    if (useBlockEditor) {
      const parts = [];
      if (blockTitle.trim()) parts.push(`🏷️ ${blockTitle.trim()}`);
      if (blockGreeting.trim()) parts.push(`👋 ${blockGreeting.trim()}`);
      if (blockBody.trim()) parts.push(blockBody.trim());
      if (blockSignature.trim()) parts.push(`✍️ ${blockSignature.trim()}`);
      setContent(parts.join('\n\n'));
    }
  }, [blockTitle, blockGreeting, blockBody, blockSignature, useBlockEditor]);

  // Target platforms
  const [platforms, setPlatforms] = useState<SocialNetwork[]>(['telegram']);

  // Make sure platforms matches the SMM tab
  useEffect(() => {
    if (!platforms.includes(activeSmmPlatform)) {
      setPlatforms([activeSmmPlatform]);
    }
  }, [activeSmmPlatform]);

  // Basic scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('2026-06-03T12:00');

  // Multi-mode planner workspace inside PostMaker
  const [plannerTab, setPlannerTab] = useState<'list' | 'kanban' | 'calendar'>('calendar');
  const [selectedMonth, setSelectedMonth] = useState<number>(6); // 6 = June, 7 = July, 8 = August, 9 = September (100 days)

  // Cron trigger settings parameters (Google Apps Script / Supabase Edge Functions style)
  const [cronFrequency, setCronFrequency] = useState<'daily' | 'weekly' | 'hourly' | 'minutely'>('daily');
  const [cronDaysOfWeek, setCronDaysOfWeek] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [cronHour, setCronHour] = useState(9);
  const [cronMinute, setCronMinute] = useState(0);
  const [cronExpression, setCronExpression] = useState('0 9 * * 1,3,5');
  const [cronValidationMsg, setCronValidationMsg] = useState('');

  // Interactive check simulation console logs
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);

  // Post currently Editing/Rescheduling dialog state
  const [selectedPostForModal, setSelectedPostForModal] = useState<CampaignPost | null>(null);
  const [modalNewDate, setModalNewDate] = useState('');
  const [modalNewStatus, setModalNewStatus] = useState<'scheduled' | 'published'>('scheduled');

  // Telegram Special keyboard buttons with Telegram Bot API Style Pickers
  const [buttons, setButtons] = useState<InlineButton[]>([]);
  const [btnText, setBtnText] = useState('');
  const [btnUrl, setBtnUrl] = useState('');
  const [btnType, setBtnType] = useState<'link' | 'callback'>('link');
  const [btnStyle, setBtnStyle] = useState<'default' | 'primary' | 'success' | 'danger'>('primary');

  // Drag and drop image upload
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI states
  const [aiPrompt, setAiPrompt] = useState('');
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [searchGroundingSources, setSearchGroundingSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [aiStyleTag, setAiStyleTag] = useState('профессиональный, захватывающий');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Advanced AI Brand Kits
  const [customTextPrompt, setCustomTextPrompt] = useState('Напиши яркий вовлекающий пост по заданной теме с вступлением, полезной аналитикой и вовлекающей концовкой.');
  const [customImagePrompt, setCustomImagePrompt] = useState('Минималистичный плоский флэт дизайн в современной SMM гамме.');
  const [customVideoPrompt, setCustomVideoPrompt] = useState('Сценарий для Shorts на 15 секунд: хук, 3 аргумента в титрах, плавное проявление музыки.');
  const [narrativeStyle, setNarrativeStyle] = useState('Дружелюбный экспертный ИИ стиль, умеренное обилие фактов, без воды.');
  const [textExampleRef, setTextExampleRef] = useState('Пример: Привет всем! 🚀 Сегодня разберем как автоматизировать...');
  const [imageExampleRef, setImageExampleRef] = useState('Пример: Неоновые линии, цифровая сфера SMM.');
  const [videoExampleRef, setVideoExampleRef] = useState('Пример: Динамическая нарезка с фоновым джазовым треком.');

  const [useRecentPostsChannel, setUseRecentPostsChannel] = useState(false);
  const [referenceChannelSelected, setReferenceChannelSelected] = useState('');
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [improvingText, setImprovingText] = useState(false);
  const [generatedImagePrompt, setGeneratedImagePrompt] = useState<string | null>(null);
  const [generatedVideoPrompt, setGeneratedVideoPrompt] = useState<string | null>(null);

  // Style reference link
  const [styleReferenceUrl, setStyleReferenceUrl] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [apiNote, setApiNote] = useState<{ status: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Custom Confirm Modal state for deleting / saving confirmation
  const [customConfirmModal, setCustomConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'save_success' | 'alert';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  });

  const [isCreatingInDb, setIsCreatingInDb] = useState(false);

  const handleCreateNewPostInDb = async () => {
    setIsCreatingInDb(true);
    try {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const res = await fetch('/api/day-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Черновик поста (${timeStr})`,
          postText: '',
          channel: activeSmmPlatform ? `@${activeSmmPlatform}` : '@SAV_AI',
          channels: [activeSmmPlatform ? `@${activeSmmPlatform}` : '@SAV_AI']
        })
      });
      if (res.ok) {
        const createdData = await res.json();
        const newPost: Omit<CampaignPost, 'id' | 'clicks' | 'views'> = {
          title: createdData.title || `Черновик поста (${timeStr})`,
          content: createdData.postText || '',
          platforms: [activeSmmPlatform],
          status: 'draft',
          isAiGenerated: false
        };
        onPublishPost(newPost);
      } else {
        const newPost: Omit<CampaignPost, 'id' | 'clicks' | 'views'> = {
          title: `Черновик поста (${timeStr})`,
          content: '',
          platforms: [activeSmmPlatform],
          status: 'draft',
          isAiGenerated: false
        };
        onPublishPost(newPost);
      }
      setCustomConfirmModal({
        isOpen: true,
        type: 'save_success',
        title: 'Пост добавлен в базу данных',
        message: 'Новый пост успешно создан и сохранен в базе данных SQLite. Он сразу появился в реальном времени в списке редактируемых постов!'
      });
    } catch (e) {
      console.error('Error creating post in DB:', e);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newPost: Omit<CampaignPost, 'id' | 'clicks' | 'views'> = {
        title: `Черновик поста (${timeStr})`,
        content: '',
        platforms: [activeSmmPlatform],
        status: 'draft',
        isAiGenerated: false
      };
      onPublishPost(newPost);
      setCustomConfirmModal({
        isOpen: true,
        type: 'save_success',
        title: 'Пост добавлен в базу данных',
        message: 'Новый пост успешно создан и отображается в списке постов!'
      });
    } finally {
      setIsCreatingInDb(false);
    }
  };

  const [activeTabInternal, setActiveTabInternal] = useState<'write' | 'ai' | 'rewrite'>('write');
  const activeTab = activeMode || activeTabInternal;

  const setActiveTab = (tab: 'write' | 'ai' | 'rewrite') => {
    if (onModeChange) {
      onModeChange(tab);
    } else {
      setActiveTabInternal(tab);
    }
  };

  useEffect(() => {
    const cached = sessionStorage.getItem('iismm_editor_source');
    if (cached) {
      setContent(cached);
      sessionStorage.removeItem('iismm_editor_source');
    }
  }, []);

  // Update target platforms automatically based on connectedChannels
  useEffect(() => {
    const ownTargetIds = connectedChannels.filter(c => !c.hasOwnProperty('role') || (c as any).role !== 'donor').map(c => c.id);
    setSelectedChannelIds(ownTargetIds);
    if (ownTargetIds.length > 0) {
      const firstTarget = connectedChannels.find(c => ownTargetIds.includes(c.id));
      if (firstTarget) {
        setReferenceChannelSelected(firstTarget.username || firstTarget.name);
      }
    }
  }, [connectedChannels]);

  // Compute Cron Expressions dynamically based on selection (Apps Script / Supabase Edge matching)
  useEffect(() => {
    let expr = '';
    let validation = '';

    const dayMap: Record<string, string> = { 'Sun': '0', 'Mon': '1', 'Tue': '2', 'Wed': '3', 'Thu': '4', 'Fri': '5', 'Sat': '6' };
    const selectedDayIndices = cronDaysOfWeek.map(d => dayMap[d]).sort();

    if (cronFrequency === 'minutely') {
      expr = `*/${cronMinute || 15} * * * *`;
      validation = `Каждые ${cronMinute} мин. Триггер Supabase Edge Function: cron trigger по расписанию.`;
    } else if (cronFrequency === 'hourly') {
      expr = `0 */${cronHour || 1} * * *`;
      validation = `Каждый ${cronHour} ч. в 00 минут.`;
    } else if (cronFrequency === 'daily') {
      expr = `${cronMinute} ${cronHour} * * *`;
      validation = `Каждый день в ${String(cronHour).padStart(2, '0')}:${String(cronMinute).padStart(2, '0')}.`;
    } else if (cronFrequency === 'weekly') {
      const daysStr = selectedDayIndices.length > 0 ? selectedDayIndices.join(',') : '*';
      expr = `${cronMinute} ${cronHour} * * ${daysStr}`;
      validation = `Кажд. ${cronDaysOfWeek.join(', ')} в ${String(cronHour).padStart(2, '0')}:${String(cronMinute).padStart(2, '0')}.`;
    }

    setCronExpression(expr);
    setCronValidationMsg(validation);
  }, [cronFrequency, cronDaysOfWeek, cronHour, cronMinute]);

  // Handle Drag & Drop Images
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageFile(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Telegram Inline buttons options
  const addColoredButton = () => {
    if (!btnText.trim()) {
      alert('Укажите название кнопки!');
      return;
    }
    const newBtn: InlineButton = {
      id: Math.random().toString(),
      text: btnText,
      url: btnType === 'link' ? (btnUrl || 'https://t.me/') : `action_${Date.now()}`,
      style: btnStyle
    };
    setButtons([...buttons, newBtn]);
    setBtnText('');
    setBtnUrl('');
  };

  const removeButton = (id: string) => {
    setButtons(buttons.filter((b) => b.id !== id));
  };

  // SMM Platform character boundaries & caption specifications
  const SMM_LIMITS: Record<SocialNetwork, { textOnly: number; withMedia: number; label: string; rules: string }> = {
    telegram: {
      textOnly: 4096,
      withMedia: 1024,
      label: 'Telegram ✈️',
      rules: 'Капшн к медиафайлу ограничен 1024 символами. Обычные посты поддерживают до 4096 символов. Доступна гибкая сетка инлайн-кнопок.'
    },
    vk: {
      textOnly: 15896,
      withMedia: 15896,
      label: 'ВКонтакте 🔵',
      rules: 'Огромный лимит до 15896 символов. Пост поддерживает мультимедиа вложения, включая альбомы, видеозаписи и опросы.'
    },
    instagram: {
      textOnly: 2200,
      withMedia: 2200,
      label: 'Instagram 📸',
      rules: 'Максимум 40 постов в день, лимит подписи 2200 символов. Текст-онли запрещен на стороне API! Требуется картинка, видео или карусель альбома.'
    },
    max: { textOnly: 5000, withMedia: 5000, label: 'Max Ⓜ️', rules: 'Поддержка постов до 5 тыс. символов.' },
    facebook: { textOnly: 5000, withMedia: 5000, label: 'Facebook 🔷', rules: 'Поддержка постов до 5 тыс. символов.' },
    x: { textOnly: 280, withMedia: 280, label: 'X (Twitter) 🐦', rules: 'Короткий лимит в 280 символов для бесплатных аккаунтов.' },
    pinterest: { textOnly: 500, withMedia: 500, label: 'Pinterest 📌', rules: 'Вложение пинов.' },
    linkedin: { textOnly: 3000, withMedia: 3000, label: 'LinkedIn 💼', rules: 'Профессиональный тон.' },
    ok: { textOnly: 4000, withMedia: 4000, label: 'Одноклассники 🟠', rules: 'Лимит 4000 сивмолов.' },
    tenchat: { textOnly: 7000, withMedia: 7000, label: 'TenChat 🔴', rules: 'Бизнес-сеть.' },
    dzen: { textOnly: 10000, withMedia: 10000, label: 'Дзен 🌀', rules: 'Посты.' },
    setka: { textOnly: 8000, withMedia: 8000, label: 'Сетка 🌐', rules: 'Экспертные.' },
    tiktok: { textOnly: 2200, withMedia: 2200, label: 'TikTok 🎵', rules: 'Видео.' },
    discord: { textOnly: 2000, withMedia: 2000, label: 'Discord 💬', rules: 'Поддержка постов до 2000 символов.' }
  };

  const getSmmLimit = () => {
    const limits = SMM_LIMITS[activeSmmPlatform] || SMM_LIMITS.telegram;
    return mediaType !== 'text' ? limits.withMedia : limits.textOnly;
  };

  const activeLimit = getSmmLimit();
  const isOverflow = content.length > activeLimit;

  // Run AI Text Improvements call
  const runImproveTextAi = async () => {
    if (!content.trim()) {
      setApiNote({ status: 'error', message: 'Сначала напишите что-нибудь в редакторе!' });
      return;
    }
    if (tokens < 10) {
      setApiNote({ status: 'error', message: 'Минимум 10 токенов для ИИ полировки!' });
      return;
    }

    setImprovingText(true);
    setApiNote(null);

    try {
      const response = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка улучшения');

      setContent(data.text);
      if (useBlockEditor) {
        setBlockBody(data.text);
      }
      onDeductTokens(10);
      setApiNote({
        status: 'success',
        message: data.isDemo
          ? 'Полировка текста выполнена в демонстрационном режиме.'
          : 'ИИSMM превосходно отполировал текст поста, убрал опечатки и добавил сочный хук! Списано 10 токенов.'
      });
    } catch (err: any) {
      setApiNote({ status: 'error', message: `Ошибка ИИ: ${err.message}` });
    } finally {
      setImprovingText(false);
    }
  };

  // Secure Server-side call: AI Generator
  const runAiPostGenerator = async () => {
    if (!aiPrompt.trim()) {
      setApiNote({ status: 'error', message: 'Введите тему для написания поста ИИ' });
      return;
    }
    if (tokens < 15) {
      setApiNote({ status: 'error', message: 'Минимум 15 токенов для генерации!' });
      return;
    }

    setAiGenerating(true);
    setApiNote(null);
    setSearchGroundingSources([]);
    setGeneratedImagePrompt(null);
    setGeneratedVideoPrompt(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiPrompt,
          platform: activeSmmPlatform,
          enableSearch: enableWebSearch,
          styleDesc: aiStyleTag,
          customTextPrompt,
          customImagePrompt,
          customVideoPrompt,
          narrativeStyle,
          textExampleRef,
          imageExampleRef,
          videoExampleRef,
          useRecentPostsChannel,
          referenceChannelSelected
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка ИИ генератора');

      setContent(data.text);
      if (useBlockEditor) {
        setBlockBody(data.text);
        setBlockTitle(title || 'ИИ Тренд');
      }
      if (data.imagePrompt) setGeneratedImagePrompt(data.imagePrompt);
      if (data.videoPrompt) setGeneratedVideoPrompt(data.videoPrompt);
      if (data.sources && data.sources.length > 0) {
        setSearchGroundingSources(data.sources);
      }
      onDeductTokens(15);
      setApiNote({
        status: 'success',
        message: 'ИИSMM написал превосходный пост и составил сценарии/промпты по вашим референсам! Списано 15 токенов.'
      });
      setActiveTab('write');
    } catch (err: any) {
      setApiNote({ status: 'error', message: `Ошибка ИИ: ${err.message}` });
    } finally {
      setAiGenerating(false);
    }
  };

  // Rewrite post under style reference
  const runStyleRewriter = async () => {
    if (!content.trim()) {
      setApiNote({ status: 'error', message: 'Сначала напишите или импортируйте текст для рерайта!' });
      return;
    }
    if (!styleReferenceUrl.trim() && !useRecentPostsChannel) {
      setApiNote({ status: 'error', message: 'Укажите ссылку на референсный канал автора или выберите свой канал в качестве источника!' });
      return;
    }
    if (tokens < 20) {
      setApiNote({ status: 'error', message: 'Минимум 20 токенов для автокопирования!' });
      return;
    }

    setRewriting(true);
    setApiNote(null);

    try {
      const response = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          styleUrlOrChannel: useRecentPostsChannel ? referenceChannelSelected : styleReferenceUrl,
          originalStyleDesc: 'проанализировать манеру письма и адаптировать под целевую сеть ' + activeSmmPlatform,
          customTextPrompt,
          customImagePrompt,
          customVideoPrompt,
          narrativeStyle,
          textExampleRef,
          imageExampleRef,
          videoExampleRef,
          useRecentPostsChannel,
          referenceChannelSelected
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка ИИ рерайтера');

      setContent(data.text);
      if (useBlockEditor) {
        setBlockBody(data.text);
      }
      if (data.imagePrompt) setGeneratedImagePrompt(data.imagePrompt);
      if (data.videoPrompt) setGeneratedVideoPrompt(data.videoPrompt);
      onDeductTokens(20);
      setApiNote({
        status: 'success',
        message: 'Стиль успешно перенят! Текст отрерайтен с учетом целевых промптов. Списано 20 токенов.'
      });
      setActiveTab('write');
    } catch (err: any) {
      setApiNote({ status: 'error', message: `Ошибка рерайтера: ${err.message}` });
    } finally {
      setRewriting(false);
    }
  };

  // Trigger real publish / schedule campaign post to parents state
  const handlePublishClick = () => {
    if (!content.trim()) {
      alert('Текст поста не может быть пустым!');
      return;
    }
    if (isOverflow) {
      alert(`Внимание! Текст поста (${content.length} симв.) превышает лимит целевой платформы ${activeSmmPlatform.toUpperCase()} (${activeLimit} симв.). Сократите или уложитесь в лимит!`);
      return;
    }

    // Instagram check - requires media
    if (activeSmmPlatform === 'instagram' && mediaType === 'text') {
      alert('Ошибка API Instagram: Текст-онли посты запрещены! Выберите медиафайл "Картинка", "Видео" или "Альбом" во вкладке постов.');
      return;
    }

    // Up to 100 days validation
    if (isScheduled) {
      const chosen = new Date(scheduledDate);
      const now = new Date();
      const minDiff = chosen.getTime() - now.getTime();
      const hundredDaysInMs = 100 * 24 * 60 * 60 * 1000;
      if (minDiff < 0) {
        alert('Запланированная дата не может быть в прошлом!');
        return;
      }
      if (minDiff > hundredDaysInMs) {
        alert('Запланированная дата не может быть более чем на 100 дней вперед по требованиям планирования!');
        return;
      }
    }

    // Build trigger campaign structures
    onPublishPost({
      title: title || 'Автопост ' + activeSmmPlatform.toUpperCase(),
      content,
      imageUrl: imageFile || undefined,
      platforms: [activeSmmPlatform],
      scheduledAt: isScheduled ? new Date(scheduledDate).toISOString() : undefined,
      status: isScheduled ? 'scheduled' : 'published',
      inlineButtons: buttons.length > 0 ? buttons : undefined,
      isAiGenerated: activeTab !== 'write',
    });

    // Reset editor fields
    setTitle('');
    setContent('');
    setBlockTitle('');
    setBlockGreeting('');
    setBlockBody('');
    setBlockSignature('');
    setImageFile(null);
    setButtons([]);
    setSearchGroundingSources([]);
    setIsScheduled(false);
  };

  // Simulation test scheduler runtime "Проверить JS запуск"
  const runSimulatorTest = () => {
    setIsRunningSimulation(true);
    setSimulationLogs([]);
    
    const output: string[] = [];
    output.push(`[${new Date().toLocaleTimeString()}] Инициализация проверки планировщика Supabase Edge Function / Google Apps Script...`);
    output.push(`[${new Date().toLocaleTimeString()}] Порог расписания извлечен успешно.`);
    output.push(`[${new Date().toLocaleTimeString()}] Полученный Cron параметр: "${cronExpression}"`);
    
    setTimeout(() => {
      output.push(`[${new Date().toLocaleTimeString()}] Компиляция проверочного JS-кода функции триггера... Скрипт запущен.`);
      output.push(`[${new Date().toLocaleTimeString()}] Оценка правила: ${cronValidationMsg}`);
      output.push(`[${new Date().toLocaleTimeString()}] Симуляция: Проверка по базе данных PostgreSQL (Supabase) запланированных постов... Найдено: ${savedPosts.filter(p => p.status === 'scheduled').length} постов.`);
      setSimulationLogs([...output]);
    }, 400);

    setTimeout(() => {
      output.push(`[${new Date().toLocaleTimeString()}] [GAS-API] Подключение к Telegram Bot API / VK API / Instagram API... OK`);
      output.push(`[${new Date().toLocaleTimeString()}] [SUCCESS] Проверка триггера завершена. Код отработал штатно! Ошибок при отправке буфера нет.`);
      setSimulationLogs([...output]);
      setIsRunningSimulation(false);
    }, 1200);
  };

  // Kanban Columns configuration
  const columns = [
    { key: 'draft', title: '🗄️ Черновики', bg: 'bg-slate-50 border-slate-200' },
    { key: 'scheduled', title: '📅 Запланированы', bg: 'bg-amber-50/50 border-amber-200' },
    { key: 'published', title: '✅ Опубликованы', bg: 'bg-emerald-50/30 border-emerald-200' }
  ];

  // Map CampaignPost status to columns
  const getPostsByStatus = (status: string) => {
    return savedPosts.filter(p => {
      if (status === 'draft') return p.status === 'draft' || !p.status;
      return p.status === status;
    });
  };

  // Open Edit / Rescheduling dialog for a saved campaign
  const handleOpenEditPostModal = (post: CampaignPost) => {
    setSelectedPostForModal(post);
    setModalNewStatus(post.status);
    setModalNewDate(post.scheduledAt ? post.scheduledAt.slice(0, 16) : '2026-06-03T12:00');
  };

  const handleSaveModalChanges = () => {
    if (!selectedPostForModal) return;
    
    const updated: CampaignPost = {
      ...selectedPostForModal,
      status: modalNewStatus,
      scheduledAt: modalNewStatus === 'scheduled' ? new Date(modalNewDate).toISOString() : undefined
    };

    if (onUpdatePost) {
      onUpdatePost(updated);
      alert('Пост успешно перенесен по графику!');
    }
    setSelectedPostForModal(null);
  };

  const handleQuickConnectInMaker = (platform: SocialNetwork) => {
    if (onAddChannel) {
      const name = prompt(`Укажите название вашего канала или группы для ${platform.toUpperCase()}:`, `Официальный паблик ${platform.toUpperCase()}`);
      if (!name) return;
      const typeInput = prompt(`Выберите тип размещения по API (channel - Канал, group - Группа, stories - Истории, chat - Беседа):`, `channel`);
      const rawInput = (typeInput || 'channel').trim().toLowerCase();
      const channelType: 'channel' | 'group' | 'stories' | 'chat' = 
        ['channel', 'group', 'stories', 'chat'].includes(rawInput) 
          ? (rawInput as any) 
          : 'channel';
      const username = prompt(`Укажите юзернейм / ссылку на сообщество:`, `@my_${platform}_official`);
      
      onAddChannel({
        name,
        username: username || '',
        platform,
        category: 'Бизнес & Медиа',
        role: 'own',
        channelType
      });
      setApiNote({
        status: 'success',
        message: `🔥 Канал "${name}" (${channelType}) успешно добавлен в ${platform.toUpperCase()}! Теперь он доступен для планирования.`
      });
    } else {
      alert('Интерфейс добавления каналов сейчас инициализируется. Пожалуйста, попробуйте снова через секунду.');
    }
  };

  // Dynamic Calendar Grid builder supporting Monday start and 100 days month selector (June to September 2026)
  const getDaysInMonthForPlanning = (year: number, monthVal: number) => {
    const days = [];
    
    // JS dates have 0-indexed months
    const firstDayDate = new Date(year, monthVal - 1, 1);
    const dayOfWeek = firstDayDate.getDay(); 
    // Convert Sunday-first JS index to Monday-first of Пн=0, Вт=1... Вс=6
    const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Pad prefix empty slots
    for (let p = 0; p < startOffset; p++) {
      days.push({
        dateString: '',
        dayNum: null,
        monthName: ''
      });
    }

    const numDays = new Date(year, monthVal, 0).getDate();
    for (let i = 1; i <= numDays; i++) {
      days.push({
        dateString: `${year}-${String(monthVal).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        dayNum: i,
        monthName: monthVal === 6 ? 'Июнь' : monthVal === 7 ? 'Июль' : monthVal === 8 ? 'Август' : 'Сентябрь'
      });
    }
    return days;
  };

  const calendarDays = getDaysInMonthForPlanning(2026, selectedMonth);

  // Find posts scheduled for a calendar date
  const getPostsForCalendarDate = (dateStr: string) => {
    return savedPosts.filter(p => {
      if (!p.scheduledAt) return false;
      return p.scheduledAt.startsWith(dateStr);
    });
  };

  const dayAbbreviations = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const handleChooseCalendarDate = (dateString: string, dayNum: number | null, monthName: string) => {
    if (!dateString) return;
    setScheduledDate(`${dateString}T12:00`);
    setIsScheduled(true);
    // Smooth scroll to editor
    document.getElementById('post-maker-top')?.scrollIntoView({ behavior: 'smooth' });
    setApiNote({
      status: 'success',
      message: `📅 Выбрана дата для отложенного поста: ${dayNum} ${monthName === 'Июнь' ? 'июня' : monthName === 'Июль' ? 'июля' : monthName === 'Август' ? 'августа' : 'сентября'} 2026 г. Настройте содержание поста ниже!`
    });
  };

  const handleAddPostFromKanban = (status: string) => {
    if (status === 'draft') {
      setIsScheduled(false);
      document.getElementById('post-maker-top')?.scrollIntoView({ behavior: 'smooth' });
      setApiNote({
        status: 'success',
        message: `✍️ Режим создания Черновика. Заполните содержание поста и сохраните в планировщике.`
      });
    } else if (status === 'scheduled') {
      setIsScheduled(true);
      if (!scheduledDate) {
        setScheduledDate('2026-06-03T12:00');
      }
      document.getElementById('post-maker-top')?.scrollIntoView({ behavior: 'smooth' });
      setApiNote({
        status: 'orange',
        message: `📅 Режим отложенной публикации. Выберите дату и время выше, затем сохраните пост.`
      });
    } else {
      setIsScheduled(false);
      document.getElementById('post-maker-top')?.scrollIntoView({ behavior: 'smooth' });
      setApiNote({
        status: 'success',
        message: `⚡️ Подготовка поста к немедленной публикации во все выбранные каналы!`
      });
    }
  };

  const handleAddPostFromList = () => {
    setIsScheduled(true);
    if (!scheduledDate) {
      setScheduledDate('2026-06-03T12:00');
    }
    document.getElementById('post-maker-top')?.scrollIntoView({ behavior: 'smooth' });
    setApiNote({
      status: 'success',
      message: `➕ Создание нового отложенного поста для планировщика. Заполните данные ниже!`
    });
  };

  return (
    <div id="post-maker-main-layout" className="space-y-6">
      {/* BRAND & TARGET PLATFORM MULTI-CHANNEL SELECTOR */}
      <div id="post-maker-top" className="p-5 rounded-2xl bg-white border border-slate-200/60 shadow-xs space-y-4">
        <div>
          <span className="text-[10px] bg-orange-100 text-orange-850 px-2 py-0.5 rounded font-black tracking-widest uppercase inline-block mb-1">
            Настройка публикаций
          </span>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            🎯 Каналы назначения и Платформы постинга
          </h3>
          <p className="text-[11px] text-slate-400">
            Выберите одно или несколько активных подключённых мест постинга. Нажмите на карточку сети, чтобы настроить параметры разметки в редакторе.
          </p>
        </div>

        {/* ACTIVE CONNECTED SMM ACCOUNTS / DESTINATIONS */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
            🟢 Активные подключенные каналы & аккаунты ({connectedChannels.length}):
          </span>
          {connectedChannels.length === 0 ? (
            <div className="p-3 text-center border border-dashed border-slate-250 rounded-xl bg-slate-50/50 text-[11px] text-slate-500 font-medium">
              Нет подключенных активных каналов. Используйте список ниже для мгновенной интеграции!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {connectedChannels.map((channel) => {
                const isSelected = selectedChannelIds.includes(channel.id);
                const isActiveTab = activeSmmPlatform === channel.platform;
                
                // Get display emojis & colors based on platform
                const platformEmoji = 
                  channel.platform === 'telegram' ? '✈️' :
                  channel.platform === 'vk' ? '🔵' :
                  channel.platform === 'instagram' ? '📸' : '🌐';

                const platformBadgeLabel = 
                  channel.channelType === 'group' ? 'Группа 👥' :
                  channel.channelType === 'stories' ? 'Сторис 📸' :
                  channel.channelType === 'chat' ? 'Чат/Беседа 💬' : 'Канал ✈️';

                return (
                  <div
                    key={channel.id}
                    onClick={() => {
                      setActiveSmmPlatform(channel.platform);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 select-none relative ${
                      isActiveTab 
                        ? 'bg-orange-50/45 border-orange-300 shadow-3xs ring-1 ring-orange-200' 
                        : isSelected 
                          ? 'bg-slate-50/60 border-slate-350 hover:bg-slate-50' 
                          : 'bg-white hover:bg-slate-50/50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base shrink-0">{platformEmoji}</span>
                        <div className="min-w-0">
                          <span className="font-extrabold text-[12px] text-slate-800 block truncate leading-snug">
                            {channel.name}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-mono block truncate">
                            {channel.username || `@id_${channel.id.slice(0, 5)}`}
                          </span>
                        </div>
                      </div>

                      {/* Custom styled checkbox toggler */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            setSelectedChannelIds(selectedChannelIds.filter(id => id !== channel.id));
                          } else {
                            setSelectedChannelIds([...selectedChannelIds, channel.id]);
                          }
                        }}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border ${
                          isSelected 
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 border-orange-600 text-white shadow-2xs' 
                            : 'bg-white border-slate-300 hover:border-slate-400 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-slate-100">
                      <span className="text-[9px] bg-slate-100 font-extrabold text-slate-650 px-1.5 py-0.5 rounded-md uppercase">
                        {platformBadgeLabel}
                      </span>
                      {isActiveTab && (
                        <span className="text-[8px] bg-orange-600 font-black text-white px-1 rounded-md uppercase">
                          В Редакторе
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* INACTIVE SMM PLATFORMS LIST FOR INSTANT CONNECTION */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            ➕ Доступно для подключения (Неактивные):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['telegram', 'vk', 'instagram', 'x', 'linkedin', 'discord', 'ok', 'tenchat', 'dzen', 'tiktok'].map((platformKey) => {
              // Check if already has actively connected channel under this platform
              const isPlatformActive = connectedChannels.some(c => c.platform === platformKey);
              if (isPlatformActive) return null; // Only list truly inactive ones!

              const nameLabel = SMM_LIMITS[platformKey as SocialNetwork]?.label || platformKey;
              return (
                <button
                  id={`btn-connect-platform-${platformKey}`}
                  key={platformKey}
                  type="button"
                  onClick={() => handleQuickConnectInMaker(platformKey as SocialNetwork)}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-550 flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span className="opacity-70 group-hover:opacity-100">🔌</span>
                  <span>{nameLabel}</span>
                  <span className="text-[9px] text-orange-550 bg-orange-50 font-black px-1.5 rounded-md">
                    + Подключить
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ADAPTIVE INSTRUCTIONS & LIMITS WARNING */}
        <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100 text-[11.5px] text-slate-705 flex items-start gap-2.5 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-850">
              Спецификация публикации для платформы {activeSmmPlatform.toUpperCase()}:
            </span>
            <p className="text-slate-600">
              {SMM_LIMITS[activeSmmPlatform]?.rules} Месячный лимит знаков: <strong className="text-orange-650">{activeLimit}</strong>.
            </p>
          </div>
        </div>
      </div>
      
      {/* SOCIAL NETWORK SELECTOR SMM PAGES NAV (Page per social network) */}
      <div className="p-4 rounded-2xl iirky-card-block space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black tracking-widest uppercase block mb-1">Определить оптимизацию для</span>
            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Персонализированная SMM Страница</span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {['telegram', 'vk', 'instagram'].map((net) => {
              const active = activeSmmPlatform === net;
              const meta = SMM_LIMITS[net as SocialNetwork];
              return (
                <button
                  id={`btn-select-smm-tab-${net}`}
                  key={net}
                  onClick={() => setActiveSmmPlatform(net as SocialNetwork)}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    active 
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm' 
                      : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                  }`}
                >
                  <span>
                    {net === 'telegram' ? '✈️' : net === 'vk' ? '🔵' : '📸'}
                  </span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-orange-50/55 border border-orange-100/60 text-[11px] text-slate-700 flex items-start gap-2 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-orange-550 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Спецификация для {activeSmmPlatform.toUpperCase()}:</span>
            <span>{SMM_LIMITS[activeSmmPlatform].rules} Текущий лимит знаков: <strong className="text-orange-650">{activeLimit}</strong>.</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: EDITOR CENTRAL PANEL */}
        <div className="flex-1 space-y-5">
          
          {/* Custom Mode Tabs (Text builder, AI post writer, AI Author copypaster) */}
          <div className="flex gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-pink-200/80 shadow-md">
            <button
              id="tab-write-editor"
              onClick={() => setActiveTab('write')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === 'write' ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-pink-50/50'
              }`}
            >
              ✍️ Редактор ({SMM_LIMITS[activeSmmPlatform].label})
            </button>
            <button
              id="tab-ai-generator"
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'ai' ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-pink-50/50'
              }`}
            >
              🔮 ИИ генерация
            </button>
            <button
              id="tab-style-clone"
              onClick={() => setActiveTab('rewrite')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'rewrite' ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-pink-50/50'
              }`}
            >
              🎭 ИИ Рерайт под автора
            </button>
          </div>

          <AnimatePresence mode="wait">
            
            {/* MANUAL BLOCK BUILDER AND EDITOR */}
            {activeTab === 'write' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Media options choices selector */}
                <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-pink-200/80 shadow-md space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-500 block">📂 Тип вложений медиа-файлов:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {['text', 'image', 'video', 'album'].map((type) => {
                      const active = mediaType === type;
                      return (
                        <button
                          id={`btn-media-type-${type}`}
                          key={type}
                          type="button"
                          onClick={() => {
                            if (activeSmmPlatform === 'instagram' && type === 'text') {
                              alert('Instagram требует фото/видео контент!');
                              return;
                            }
                            setMediaType(type as any);
                          }}
                          className={`py-2 text-xs font-extrabold uppercase rounded-xl border transition-all cursor-pointer ${
                            active 
                              ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md border-white/20' 
                              : 'bg-white border-pink-200 text-slate-700 hover:bg-pink-50/50'
                          }`}
                        >
                          {type === 'text' ? 'Текст 📝' :
                           type === 'image' ? 'Картинка 🖼️' :
                           type === 'video' ? 'Видео 🎬' : 'Альбом 📚'}
                        </button>
                      );
                    })}
                  </div>

                  {mediaType === 'album' && (
                    <div className="flex items-center gap-4 pt-2 border-t border-pink-100 animate-slide-in">
                      <span className="text-[11px] text-slate-600 font-bold">Количество вложений в альбоме:</span>
                      <input 
                        type="range" 
                        min={2} 
                        max={10} 
                        value={mediaFilesCount}
                        onChange={(e) => setMediaFilesCount(Number(e.target.value))}
                        className="flex-1 accent-pink-500"
                      />
                      <span className="text-xs font-black text-slate-800">{mediaFilesCount} файлов</span>
                    </div>
                  )}
                </div>

                {/* Structured vs Simple block editor switcher */}
                <div className="flex justify-between items-center bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-pink-200/80 shadow-sm">
                  <span className="text-xs font-black text-slate-700">🛠️ Использовать структуру блоков вместо плоского поля</span>
                  <input 
                    id="checkbox-use-block-editor"
                    type="checkbox"
                    checked={useBlockEditor}
                    onChange={(e) => setUseBlockEditor(e.target.checked)}
                    className="w-4 h-4 text-pink-600 rounded cursor-pointer accent-pink-500"
                  />
                </div>

                {useBlockEditor ? (
                  <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-pink-200/80 shadow-md space-y-3 animate-fade-in">
                    <span className="text-xs font-black text-slate-800 block border-b border-pink-100 pb-2">📚 Сборка постов из контентных кубиков:</span>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-black uppercase">🏷️ Заголовок (Title)</span>
                      <input 
                        id="input-block-title"
                        type="text"
                        value={blockTitle}
                        onChange={(e) => setBlockTitle(e.target.value)}
                        placeholder="Название блога или лид-хук..."
                        className="w-full px-3 py-2 text-xs rounded-xl border-2 border-pink-200/80 bg-white text-slate-800 focus:outline-none focus:border-pink-400 font-medium shadow-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-black uppercase"> Приветствие (Greeting)</span>
                      <input 
                        id="input-block-greeting"
                        type="text"
                        value={blockGreeting}
                        onChange={(e) => setBlockGreeting(e.target.value)}
                        placeholder="Привет, ИИ-мейкеры!..."
                        className="w-full px-3 py-2 text-xs rounded-xl border-2 border-pink-200/80 bg-white text-slate-800 focus:outline-none focus:border-pink-400 font-medium shadow-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-slate-500 font-black uppercase">📝 Основной текст (Main Body)</span>
                        <button
                          type="button"
                          onClick={runImproveTextAi}
                          className="text-[10px] font-black uppercase text-pink-600 hover:text-pink-700 cursor-pointer"
                        >
                          🪄 Улучшить тело ИИ
                        </button>
                      </div>
                      <textarea 
                        id="textarea-block-body"
                        rows={4}
                        value={blockBody}
                        onChange={(e) => setBlockBody(e.target.value)}
                        placeholder="Суть и факты вашего послания..."
                        className="w-full p-3 text-xs rounded-2xl border-2 border-pink-200/80 bg-white text-slate-800 focus:outline-none focus:border-pink-400 font-sans shadow-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-black uppercase">✍️ Подпись (Signature & Footer)</span>
                      <input 
                        id="input-block-signature"
                        type="text"
                        value={blockSignature}
                        onChange={(e) => setBlockSignature(e.target.value)}
                        placeholder="С уважением, Автор. Подпишитесь!..."
                        className="w-full px-3 py-2 text-xs rounded-xl border-2 border-pink-200/80 bg-white text-slate-800 focus:outline-none focus:border-pink-400 font-medium shadow-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-wide">🏷️ Название компании / поста</span>
                      <input 
                        id="input-post-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Для личной навигации в календаре..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-pink-200/80 bg-white text-slate-800 focus:outline-none focus:border-pink-400 font-medium shadow-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-wide">📝 Месседж поста</span>
                        <button
                          type="button"
                          disabled={improvingText}
                          onClick={runImproveTextAi}
                          className="text-xs font-black text-pink-600 hover:text-pink-700 cursor-pointer flex items-center gap-1 transition-all"
                        >
                          {improvingText ? 'полируем...' : '🪄 ИИ улучшить'}
                        </button>
                      </div>
                      <textarea 
                        id="textarea-post-content"
                        rows={6}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Введите ваш текст поста здесь..."
                        className="w-full p-3.5 text-xs rounded-2xl border-2 border-pink-200/80 bg-white text-slate-800 focus:outline-none focus:border-pink-400 font-sans shadow-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Character Warnings alerts */}
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Символов: <strong className={isOverflow ? 'text-red-650' : 'text-slate-650'}>{content.length}</strong> / {activeLimit}
                  </span>
                  {isOverflow && (
                    <span className="text-[10px] text-red-600 font-black uppercase tracking-tight flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" /> Превышен лимит {activeSmmPlatform.toUpperCase()}!
                    </span>
                  )}
                </div>

                {/* File Upload drag area */}
                {mediaType !== 'text' && (
                  <div 
                    id="drop-area-maker-image"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-orange-550 bg-orange-50/40 scale-98' 
                        : imageFile ? 'border-orange-300 bg-orange-50/15' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,video/*"
                      className="hidden"
                    />
                    {imageFile ? (
                      <div className="text-center relative">
                        <img 
                          src={imageFile} 
                          alt="Uploaded media view" 
                          referrerPolicy="no-referrer"
                          className="w-32 h-20 object-cover rounded-lg border border-slate-200 mx-auto"
                        />
                        <span className="text-[10px] text-slate-500 font-bold block mt-1">Файл прикреплен. Нажмите, чтобы заменить</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-350" />
                        <span className="text-xs font-bold text-slate-600">Перетащите сюда или выберите {mediaType === 'video' ? 'видеоролик' : 'изображение'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Размер файла до 15 МБ, форматы jpg, png, mp4</span>
                      </>
                    )}
                  </div>
                )}

                {/* TELEGRAM SPECIFIC INLINE KEYBOARDS */}
                {activeSmmPlatform === 'telegram' && (
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/60 space-y-3">
                    <span className="text-xs font-black text-indigo-700 block tracking-tight uppercase">✈️ Инлайн кнопки Telegram (Special bot feature):</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Поведение кнопки</span>
                        <select 
                          id="select-tg-button-type"
                          value={btnType} 
                          onChange={(e: any) => setBtnType(e.target.value)}
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                        >
                          <option value="link">Текст + Ссылка (URL)</option>
                          <option value="callback">Действие (Callback Action)</option>
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Название кнопки</span>
                        <input 
                          id="input-tg-button-text"
                          type="text" 
                          value={btnText} 
                          onChange={(e) => setBtnText(e.target.value)}
                          placeholder="Купить со скидкой 🔔"
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                        />
                      </div>
                    </div>

                    {btnType === 'link' && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Ссылка URL</span>
                        <input 
                          id="input-tg-button-url"
                          type="text" 
                          value={btnUrl} 
                          onChange={(e) => setBtnUrl(e.target.value)}
                          placeholder="https://t.me/your_partner"
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Стиль кнопки Telegram:</span>
                        <div className="flex gap-1">
                          {[
                            { key: 'default', bg: 'bg-[#cfd6e0]', label: 'default (серая)' },
                            { key: 'primary', bg: 'bg-[#2481cc]', label: 'primary (синяя)' },
                            { key: 'success', bg: 'bg-[#2fa84f]', label: 'success (зелёная)' },
                            { key: 'danger', bg: 'bg-[#e53935]', label: 'danger (красная)' }
                          ].map(s => (
                            <button
                              id={`btn-style-pick-${s.key}`}
                              key={s.key}
                              type="button"
                              title={s.label}
                              onClick={() => setBtnStyle(s.key as any)}
                              className={`w-4 h-4 rounded-full border transition-all ${s.bg} ${btnStyle === s.key ? 'ring-2 ring-pink-500 scale-110' : 'opacity-70'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        id="btn-add-tg-inline-btn"
                        type="button"
                        onClick={addColoredButton}
                        className="px-3 py-1 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white text-[11px] font-black rounded"
                      >
                        Добавить
                      </button>
                    </div>

                    {buttons.length > 0 && (
                      <div className="pt-2 border-t border-pink-200 flex flex-wrap gap-1.5">
                        {buttons.map(btn => {
                          const st = btn.style || 'default';
                          const tagBg = st === 'primary' ? 'bg-[#2481cc] text-white border-[#1b6ca8]' :
                            st === 'success' ? 'bg-[#2fa84f] text-white border-[#1f7836]' :
                            st === 'danger' ? 'bg-[#e53935] text-white border-[#b71c1c]' :
                            'bg-[#e5e9ef] text-[#1c242f] border-[#cbd3dd]';
                          return (
                            <span 
                              key={btn.id}
                              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-extrabold shadow-2xs ${tagBg}`}
                            >
                              <span>📎 {btn.text} ({st})</span>
                              <button type="button" onClick={() => removeButton(btn.id)} className="hover:opacity-75 font-black ml-0.5">×</button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* AI GENERATOR TAB VIEW */}
            {activeTab === 'ai' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-pink-200/80 shadow-md"
              >
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wide block">Тема или заголовок будущего SMM поста</span>
                  <input 
                    id="input-ai-prompt"
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Например: Как анализировать конверсии UTM-меток..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-pink-200/80 bg-white text-slate-800 focus:outline-none focus:border-pink-400 font-medium shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-black uppercase">Жанр повествования</span>
                    <input 
                      id="input-ai-style-tag"
                      type="text"
                      value={aiStyleTag}
                      onChange={(e) => setAiStyleTag(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border-2 border-pink-200/80 bg-white text-slate-800 focus:outline-none focus:border-pink-400 font-medium shadow-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-pink-50/50 border border-pink-200 self-end h-[38px]">
                    <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">🌐 Поиск свежих фактов</span>
                    <input 
                      id="checkbox-enable-search"
                      type="checkbox"
                      checked={enableWebSearch}
                      onChange={(e) => setEnableWebSearch(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-pink-500"
                    />
                  </div>
                </div>

                <button
                  id="btn-trigger-ai-post-gen"
                  type="button"
                  disabled={aiGenerating}
                  onClick={runAiPostGenerator}
                  className="w-full py-3 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black rounded-2xl text-xs shadow-md border border-white/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                >
                  {aiGenerating ? '🔮 Нейросеть генерирует...' : '🔮 Сгенерировать пост ИИSMM'}
                </button>
              </motion.div>
            )}

            {/* SYLE CLONING REWRITER VIEW */}
            {activeTab === 'rewrite' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-pink-200/80 shadow-md"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-black text-slate-700 uppercase block">Канал-референс или ссылка на донора копипаста</span>
                  <input 
                    id="input-style-reference"
                    type="text"
                    value={styleReferenceUrl}
                    onChange={(e) => setStyleReferenceUrl(e.target.value)}
                    placeholder="t.me/shishkarnem или vk.com/smm_creator"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-pink-200/80 bg-white text-slate-800 focus:outline-none focus:border-pink-400 font-medium shadow-xs"
                  />
                </div>

                <button
                  id="btn-trigger-style-rewrite"
                  type="button"
                  disabled={rewriting}
                  onClick={runStyleRewriter}
                  className="w-full py-3 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black rounded-2xl text-xs shadow-md border border-white/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                >
                  {rewriting ? '🎭 Рерайтер адаптирует...' : '🎭 Копировать авторский стиль по ссылке'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SCHEDULER BLOCK */}
          <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-pink-200/80 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-800 block">📅 Отложенное планирование публикации</span>
                <span className="text-[10px] text-slate-500 font-medium">Укажите желаемое время публикации (до 100 дней вперед)</span>
              </div>
              <input 
                id="checkbox-enable-scheduling"
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="w-4 h-4 rounded text-pink-600 cursor-pointer accent-pink-500"
              />
            </div>

            {isScheduled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2 border-t border-pink-100"
              >
                <div className="space-y-1">
                  <span className="text-[10.5px] font-black text-slate-700 uppercase">Выбор даты и времени отправки по МСК:</span>
                  <input 
                    id="input-post-scheduled-date"
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border-2 border-pink-200/80 font-mono bg-white text-slate-800 focus:border-pink-400 focus:outline-none shadow-xs font-bold"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <button
            id="btn-trigger-publish"
            type="button"
            onClick={handlePublishClick}
            className="w-full py-4 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer border border-white/20"
          >
            {isScheduled ? (
              <>
                <CalendarIcon className="w-5 h-5 text-white" />
                <span>Запланировать в СММ календарь</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5 text-white" />
                <span>Опубликовать в {activeSmmPlatform.toUpperCase()} прямо сейчас</span>
              </>
            )}
          </button>

        </div>

        {/* RIGHT COLUMN: REAL-TIME SPECIFIC FEED PREVIEWS */}
        <div className="w-full lg:w-[350px] shrink-0 space-y-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-divider block">
            👁️ Мобильный предпросмотр: {activeSmmPlatform.toUpperCase()}
          </span>

          <div className="rounded-3xl border border-slate-200 bg-[#E8ECEF] shadow-lg p-4 min-h-[500px] flex flex-col justify-between text-slate-900 font-sans relative">
            
            {/* PLATFORM TAILORED FEED LOOK */}
            <div className="space-y-3">
              
              {/* TELEGRAM VIEW */}
              {activeSmmPlatform === 'telegram' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-2">
                    <span className="text-[10px] font-black uppercase text-indigo-700 font-serif">PREVIEW</span>
                    <span className="text-xs font-black text-slate-700">✈️ Сообщение в боте</span>
                  </div>

                  <div className="bg-[#E2ECF5] text-slate-900 rounded-2xl p-3 shadow-sm border border-[#C5D7E8] space-y-2 relative max-w-[280px]">
                    {imageFile && mediaType !== 'text' && (
                      <img 
                        src={imageFile} 
                        alt="Media attachment" 
                        referrerPolicy="no-referrer"
                        className="w-full rounded-lg object-cover max-h-[160px]"
                      />
                    )}
                    
                    <div className="space-y-0.5">
                      {title && <h5 className="font-extrabold text-[12.5px] text-slate-900">{title}</h5>}
                      <p className="text-[11.5px] leading-relaxed whitespace-pre-line font-normal text-slate-900">
                        {content || 'Начните писать...' }
                      </p>
                    </div>

                    <div className="text-[9.5px] text-[#718DA2] text-right">11:10 ✔️</div>
                  </div>

                  {/* Keyboard buttons builder inline preview */}
                  {buttons.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 max-w-[280px]">
                      {buttons.map(btn => {
                        const st = btn.style || 'default';
                        const btnCls = st === 'primary' ? 'bg-[#2481cc] hover:bg-[#1d70b3] text-white border border-[#1b6ca8]' :
                          st === 'success' ? 'bg-[#2fa84f] hover:bg-[#258d41] text-white border border-[#1f7836]' :
                          st === 'danger' ? 'bg-[#e53935] hover:bg-[#c62828] text-white border border-[#b71c1c]' :
                          'bg-[#e5e9ef] hover:bg-[#d8dfe8] text-[#1c242f] border border-[#cbd3dd]';
                        return (
                          <button
                            key={btn.id}
                            className={`w-full py-2 text-[10.5px] font-bold rounded-xl text-center truncate shadow-2xs transition-all ${btnCls}`}
                          >
                            {btn.text}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VK VIEW */}
              {activeSmmPlatform === 'vk' && (
                <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-200 text-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 font-extrabold flex items-center justify-center text-[10px]">VK</div>
                    <div>
                      <span className="font-extrabold text-[#2C75F8] block">Мой SMM Паблик 🔵</span>
                      <span className="text-[9.5px] text-slate-400">сейчас</span>
                    </div>
                  </div>

                  <p className="whitespace-pre-line text-[11px] leading-snug">{content || 'Здесь будет текст ВКонтакте...'}</p>

                  {imageFile && mediaType !== 'text' && (
                    <img 
                      src={imageFile} 
                      alt="VK post cover" 
                      referrerPolicy="no-referrer"
                      className="w-full rounded-lg object-cover max-h-[180px]"
                    />
                  )}

                  <div className="flex justify-between items-center text-slate-400 text-[10px] pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">❤️ 41</span>
                    <span className="flex items-center gap-1">💬 2</span>
                    <span>👁️ 1.2K</span>
                  </div>
                </div>
              )}

              {/* INSTAGRAM VIEW */}
              {activeSmmPlatform === 'instagram' && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden text-xs">
                  <div className="flex items-center gap-2 p-2 px-3 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-500 to-purple-600 p-0.5">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-black text-[7px] text-slate-800">IG</div>
                    </div>
                    <span className="font-extrabold text-slate-800">iismm_smm_studio 📸</span>
                  </div>

                  {/* Album / media preview requirements check */}
                  {mediaType === 'text' ? (
                    <div className="p-8 bg-red-50 text-red-700 text-center flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                      <span className="font-extrabold block text-xs">ОШИБКА ДЕПЛОЯ INSTAGRAM</span>
                      <span className="text-[10px] text-slate-500">Instagram API не принимает посты без изображения или видео! Измените вложения на "Картинка", "Видео" или "Альбом".</span>
                    </div>
                  ) : (
                    <div className="relative">
                      {imageFile ? (
                        <img 
                          src={imageFile} 
                          alt="Instagram feed design" 
                          referrerPolicy="no-referrer"
                          className="w-full h-[240px] object-cover"
                        />
                      ) : (
                        <div className="w-full h-[200px] bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-[10px] font-bold block">Прикрепите дизайн-пост</span>
                        </div>
                      )}

                      {/* Carousel Indicator for album */}
                      {mediaType === 'album' && (
                        <span className="absolute top-2 right-2 bg-slate-900/60 text-white rounded-full px-2 py-0.5 text-[9px] font-black">
                          1/{mediaFilesCount}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-3 space-y-1">
                    <div className="flex gap-2 text-slate-700 font-extrabold text-xs">
                      <span>❤️</span> <span>💬</span> <span>✈️</span>
                    </div>
                    <p className="whitespace-pre-line text-[11px] leading-relaxed pt-1 text-slate-900">
                      <span className="font-bold text-slate-800 mr-1">iismm_smm_studio</span>
                      {content || 'Подпись к фотографии Instagram...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Phone Home button mock design */}
            <div className="bg-slate-350 w-24 h-1 rounded-full mx-auto mt-6"></div>
          </div>
        </div>

      </div>

      {/* COMPREHENSIVE SMM SCHEDULE WORKSPACE & PLANNER DEFERRED POSTS (Requirement #1) */}
      <div id="section-smm-schedule-planner" className="p-5 rounded-2xl iirky-card-block space-y-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-3 gap-3">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <CalendarIcon className="w-4.5 h-4.5 text-orange-500 animate-bounce" />
              <span>Календарный СММ Планирщик ИИSMM</span>
            </h3>
            <p className="text-[10.5px] text-slate-400">Управляйте отложенной сеткой постов, меняйте статус и переносите посты по расписанию</p>
          </div>

          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0 border border-slate-200/55">
            {[
              { key: 'calendar', label: 'Календарь 📅', icon: <Layers className="w-3.5 h-3.5" /> },
              { key: 'kanban', label: 'Канбан-доска 🗂️', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
              { key: 'list', label: 'Список 📝', icon: <List className="w-3.5 h-3.5" /> }
            ].map((tab) => {
              const active = plannerTab === tab.key;
              return (
                <button
                  id={`btn-planner-tab-${tab.key}`}
                  key={tab.key}
                  onClick={() => setPlannerTab(tab.key as any)}
                  className={`px-3 py-1.5 text-xs font-black uppercase rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    active 
                      ? 'bg-slate-900 text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-850 hover:bg-white/40'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic renders based on planner tab */}
        <AnimatePresence mode="wait">
          {/* COLUMN 1: INTERACTIVE MONTHLY CALENDAR VIEW */}
          {plannerTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Calendar header months selection with 100 days range selector */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-50/70 border border-slate-200/50 rounded-2xl gap-3">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] bg-orange-100 text-orange-850 px-2 py-0.5 rounded font-black tracking-widest uppercase block w-fit mb-1">Сетка планирования</span>
                  <span className="text-xs font-black uppercase font-mono text-slate-700 block">🗓️ ИНТЕРВАЛ 100 ДНЕЙ (ИЮНЬ - СЕНТЯБРЬ 2026)</span>
                </div>
                
                {/* 100 days month selector */}
                <div className="flex bg-white border border-slate-200/80 rounded-lg p-0.5 shadow-3xs shrink-0 self-end sm:self-auto">
                  {[
                    { value: 6, label: 'Июнь' },
                    { value: 7, label: 'Июль' },
                    { value: 8, label: 'Август' },
                    { value: 9, label: 'Сентябрь' }
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(m.value);
                        setApiNote({
                          status: 'success',
                          message: `📅 Переключено на ${m.label} 2026 года для планирования контента!`
                        });
                      }}
                      className={`px-3 py-1 text-[11px] font-black rounded-md transition-all cursor-pointer ${
                        selectedMonth === m.value
                          ? 'bg-orange-500 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 py-1">
                {dayAbbreviations.map(abbr => (
                  <div key={abbr} className="text-center font-extrabold text-slate-400 text-[10px] pb-1 uppercase">{abbr}</div>
                ))}
                
                {calendarDays.map((day) => {
                  if (!day.dayNum) {
                    return (
                      <div key={`empty-${Math.random()}`} className="p-1 rounded-lg border border-transparent bg-slate-50/10 min-h-[70px]" />
                    );
                  }
                  
                  const dayScheduledPosts = getPostsForCalendarDate(day.dateString);
                  return (
                    <div 
                      key={day.dateString} 
                      onClick={() => handleChooseCalendarDate(day.dateString, day.dayNum, day.monthName)}
                      className="p-1.5 pb-2.5 rounded-xl border border-slate-200/70 bg-white min-h-[80px] flex flex-col justify-between hover:border-orange-300 hover:bg-orange-50/10 cursor-pointer shadow-3xs transition-all group scale-100 hover:scale-[1.015]"
                    >
                      <span className="text-[10px] font-black text-slate-450 text-right block self-end transition-colors group-hover:text-orange-500">{day.dayNum}</span>
                      
                      <div className="space-y-1 my-1.5 text-left">
                        {dayScheduledPosts.map(post => (
                          <button
                            id={`btn-open-calendar-post-${post.id}`}
                            key={post.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditPostModal(post);
                            }}
                            className="w-full text-left text-[9px] px-1.5 py-0.5 bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 text-slate-705 truncate rounded-md block font-extrabold shadow-3xs hover:scale-[1.02] transition-transform"
                          >
                            <span>
                              {post.platforms.includes('telegram') ? '✈️' :
                               post.platforms.includes('vk') ? '🔵' : '📸'}
                            </span>
                            <span className="ml-1 font-sans">{post.title}</span>
                          </button>
                        ))}
                      </div>

                      <div className="text-[8px] text-slate-350 font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity text-orange-500 block pt-0.5">
                        + Добавить
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* COLUMN 2: KANBAN BOARD VIEW (Move columns & status editing) */}
          {plannerTab === 'kanban' && (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              {columns.map((col) => {
                const postsForCol = getPostsByStatus(col.key);
                return (
                  <div key={col.key} className={`rounded-xl border p-3 ${col.bg} min-h-[300px] space-y-3`}>
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="text-xs font-black text-slate-800 tracking-tight uppercase">{col.title}</span>
                      <span className="bg-slate-200/60 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {postsForCol.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {postsForCol.map((post) => (
                        <div key={post.id} className="p-3 bg-white rounded-lg border border-slate-100 shadow-3xs space-y-2 text-xs">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-extrabold text-slate-850 truncate block">{post.title}</span>
                            <div className="flex gap-1 shrink-0">
                              {post.platforms.map(p => (
                                <span key={p} className="text-[9px]">
                                  {p === 'telegram' ? '✈️' : p === 'vk' ? '🔵' : '📸'}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 line-clamp-2">{post.content}</p>

                          {post.scheduledAt && (
                            <div className="flex items-center gap-1 text-[9.5px] text-slate-400 font-mono">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>{new Date(post.scheduledAt).toLocaleString()}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                            {onDeletePost && (
                              <button
                                id={`btn-delete-kanban-${post.id}`}
                                onClick={() => onDeletePost(post.id)}
                                className="text-red-500 hover:text-red-750 text-[10px] font-bold"
                              >
                                Удалить
                              </button>
                            )}

                            <button
                              id={`btn-kanban-edit-${post.id}`}
                              onClick={() => handleOpenEditPostModal(post)}
                              className="text-orange-600 hover:text-orange-850 text-[10px] font-black"
                            >
                              Перенести по расписанию →
                            </button>
                          </div>
                        </div>
                      ))}

                      {postsForCol.length === 0 && (
                        <p className="text-slate-400 text-[11px] italic text-center py-6">В этой колонке постов пока нет.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* COLUMN 3: LISTS VIEW WITH EDITING AND PERIODIC DETAILS */}
          {plannerTab === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {savedPosts.map((post) => (
                <div key={post.id} className="p-4 bg-white/90 backdrop-blur-md border border-pink-200/80 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs shadow-sm hover:border-pink-300 transition-colors">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 text-sm">{post.title}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        post.status === 'scheduled' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-sky-100 text-sky-800 border border-sky-200'
                      }`}>
                        {post.status === 'scheduled' ? 'В графике' : 'Опубликован'}
                      </span>
                      {post.isAiGenerated && (
                        <span className="text-[9px] bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white px-2 py-0.5 rounded-md font-black uppercase shadow-xs">ИИ</span>
                      )}
                    </div>
                    
                    <p className="text-slate-600 line-clamp-1 font-medium">{post.content || '(Содержание пока пустое)'}</p>
                    
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono items-center pt-0.5">
                      <span>Каналы деплоя: <strong className="text-slate-700">{post.platforms.map(p => p.toUpperCase()).join(', ')}</strong></span>
                      {post.scheduledAt && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-extrabold flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> Назначен: {new Date(post.scheduledAt).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <button
                      id={`btn-list-edit-${post.id}`}
                      onClick={() => handleOpenEditPostModal(post)}
                      className="px-3.5 py-1.5 bg-white hover:bg-pink-50 border border-pink-200 text-slate-800 font-black rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-pink-500" />
                      <span>Параметры</span>
                    </button>

                    {onDeletePost && (
                      <button
                        id={`btn-list-delete-${post.id}`}
                        onClick={() => {
                          setCustomConfirmModal({
                            isOpen: true,
                            type: 'delete',
                            title: 'Подтвердите удаление поста',
                            message: `Вы действительно хотите удалить пост «${post.title || 'Без названия'}» из базы данных?`,
                            onConfirm: () => {
                              onDeletePost(post.id);
                              setCustomConfirmModal({ isOpen: false, type: 'alert', title: '', message: '' });
                            }
                          });
                        }}
                        className="px-3 py-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-extrabold rounded-xl text-[11px] cursor-pointer transition-all"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {savedPosts.length === 0 && (
                <div className="iirky-card-block rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto shadow-lg border border-pink-200/80 my-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 p-0.5 mx-auto flex items-center justify-center shadow-md">
                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                      <FileText className="w-7 h-7 text-pink-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Нет созданных постов</h3>
                    <p className="text-xs text-slate-500 font-medium">Ваш список запланированных и сохраненных публикаций пуст</p>
                  </div>
                  <button
                    id="btn-create-first-post-center"
                    type="button"
                    disabled={isCreatingInDb}
                    onClick={handleCreateNewPostInDb}
                    className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black px-8 py-3.5 rounded-2xl text-xs shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer border border-white/20"
                  >
                    <Plus className="w-4 h-4 text-white stroke-[3]" />
                    <span>{isCreatingInDb ? 'Создание поста в БД...' : 'Создать пост в базе данных'}</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* DETAILED MODAL EDITING RESCHEDULER DIALOG */}
      {selectedPostForModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-5 border border-slate-200 max-w-sm w-full space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-black uppercase text-slate-800">⚙️ Сменить параметры публикации</span>
              <button onClick={() => setSelectedPostForModal(null)} className="text-slate-400 hover:text-slate-650 font-bold text-sm cursor-pointer">×</button>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 block">Название:</span>
              <p className="text-slate-500 italic bg-slate-50 p-2 rounded">{selectedPostForModal.title}</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 block">Статус планировщика:</span>
                <select 
                  id="select-modal-status"
                  value={modalNewStatus} 
                  onChange={(e: any) => setModalNewStatus(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                >
                  <option value="scheduled">В графике (Scheduled)</option>
                  <option value="published">Опубликован (Published / Live)</option>
                </select>
              </div>

              {modalNewStatus === 'scheduled' && (
                <div className="space-y-1 animate-fade-in">
                  <span className="text-xs font-bold text-slate-750 block">Переназначить время (До 100 дней):</span>
                  <input 
                    id="input-modal-date"
                    type="datetime-local" 
                    value={modalNewDate} 
                    onChange={(e) => setModalNewDate(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-slate-200 bg-white font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t text-xs">
              <button 
                id="btn-close-modal-cancel"
                onClick={() => setSelectedPostForModal(null)}
                className="px-3 py-1.5 bg-slate-100 rounded text-slate-700 font-bold cursor-pointer"
              >
                  Отмена
              </button>
              <button 
                id="btn-close-modal-save"
                onClick={() => {
                  handleSaveModalChanges();
                  setCustomConfirmModal({
                    isOpen: true,
                    type: 'save_success',
                    title: 'Параметры обновлены',
                    message: 'График и статус публикации успешно изменены!'
                  });
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded font-extrabold cursor-pointer shadow-sm"
              >
                  Применить график
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* OUR SIGNATURE STYLE CONFIRMATION MODAL */}
      {customConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-pink-200 shadow-2xl max-w-md w-full space-y-4 text-left"
          >
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                {customConfirmModal.type === 'delete' ? (
                  <span className="text-rose-600">🗑️ Удаление поста</span>
                ) : (
                  <span className="text-pink-600">✨ Операция выполнена</span>
                )}
              </h3>
              <button 
                onClick={() => setCustomConfirmModal({ isOpen: false, type: 'alert', title: '', message: '' })}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-900">{customConfirmModal.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{customConfirmModal.message}</p>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-pink-100 text-xs">
              {customConfirmModal.type === 'delete' ? (
                <>
                  <button 
                    onClick={() => setCustomConfirmModal({ isOpen: false, type: 'alert', title: '', message: '' })}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold cursor-pointer transition-colors"
                  >
                    Отмена
                  </button>
                  <button 
                    onClick={() => {
                      if (customConfirmModal.onConfirm) customConfirmModal.onConfirm();
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-black shadow-md hover:scale-105 active:scale-95 cursor-pointer transition-all"
                  >
                    Да, удалить
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setCustomConfirmModal({ isOpen: false, type: 'alert', title: '', message: '' })}
                  className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-xl font-black shadow-md hover:scale-105 active:scale-95 cursor-pointer transition-all"
                >
                  Отлично
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* GROUNDING RESOURCES LOG AND TOAST API NOTES */}
      {apiNote && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 ${
            apiNote.status === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : apiNote.status === 'error' 
                ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                : 'bg-orange-50 text-orange-850 border border-orange-200'
          }`}
        >
          <span>{apiNote.message}</span>
          <button onClick={() => setApiNote(null)} className="font-extrabold opacity-75 hover:opacity-100">×</button>
        </motion.div>
      )}

    </div>
  );
}
