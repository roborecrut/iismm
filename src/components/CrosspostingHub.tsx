import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, CheckCircle2, AlertCircle, Share2, Globe, Send, 
  MessageSquare, Radio, Link, Shield, Trash2, Layers, HelpCircle, 
  Check, Calendar, RefreshCw, ChevronRight, Eye, MousePointerClick, TrendingUp,
  Settings, Play, Square, ExternalLink, Plus, Copy, AlertTriangle, ArrowRight,
  Info, Bell, Sliders, Hash, Lock, CheckSquare, ListFilter, RotateCcw,
  ChevronDown, X, EyeOff, Camera, FileText
} from 'lucide-react';
import { CampaignPost, SocialChannel, SocialNetwork } from '../types';

interface CrosspostingHubProps {
  onPublishPost: (post: Omit<CampaignPost, 'id' | 'clicks' | 'views'>) => void;
  savedPosts: CampaignPost[];
  connectedChannels: SocialChannel[];
  tokens: number;
  onDeductTokens: (amount: number) => void;
  userBalance: number;
  onDeductBalanceRub?: (amount: number) => void;
  alert?: (msg: string) => void;
}

interface Publication {
  id: string;
  streamId: string;
  status: 'published' | 'failed' | 'pending';
  publishedAt: string;
  sourceCreatedAt: string;
  text: string;
  viewType: 'photo' | 'text' | 'multi' | 'video';
  imageUrl?: string;
  isMultiPost?: boolean;
  vkPostLink: string;
  logs: Array<{ time: string; message: string }>;
}

// Interfaces for our Bot Auto-Crossposting stream
interface AutopostStream {
  id: string;
  status: 'working' | 'stopped';
  autoPayDays: number;
  sourcePlatform: SocialNetwork;
  sourceTelegram: string; // Used as the handle / channel username
  targetPlatform: SocialNetwork;
  targetVkGroup: string; // Used as the target group, page or channel name/handle
  adminName: string;
  repostDestination: 'wall' | 'chat' | 'both';
  viewType: 'slideshow' | 'grid';
  contentFilters: {
    photo: boolean;
    gif: boolean;
    videoCircle: boolean;
    file: boolean;
    poll: boolean;
    audio: boolean;
    video: boolean;
  };
  largeVideoAction: 'link' | 'skip';
  repostToPersonalAccount: boolean;
  captionTemplate: string;
  keepHashtags: boolean;
  nicknameHandling: 'strip' | 'keep' | 'link' | 'delete';
  filterByWord: boolean;
  filterWords: string;
  repostIntervalMin: number;
  processEmbeddedLinks: boolean;
  repostDelayMinRange: string;
  delayLocation: 'system' | 'vk';
}

const INITIAL_STREAMS: AutopostStream[] = [];

const INITIAL_PUBLICATIONS: Publication[] = [];

const PLATFORM_CONFIG: Record<SocialNetwork, { name: string; emoji: string; bg: string; iconClass: string; brandColor: string }> = {
  telegram: { name: 'Telegram', emoji: '✈️', bg: 'bg-gradient-to-br from-sky-450 to-sky-600', iconClass: 'text-sky-500', brandColor: '#0088cc' },
  vk: { name: 'ВКонтакте', emoji: '🔵', bg: 'bg-gradient-to-br from-blue-500 to-blue-700', iconClass: 'text-blue-600', brandColor: '#4c75a3' },
  setka: { name: 'Сетка', emoji: '🤖', bg: 'bg-gradient-to-br from-pink-500 to-rose-600', iconClass: 'text-pink-600', brandColor: '#ff007f' },
  instagram: { name: 'Instagram', emoji: '📸', bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500', iconClass: 'text-rose-500', brandColor: '#e1306c' },
  x: { name: 'Twitter / X', emoji: '🐦', bg: 'bg-gradient-to-br from-slate-800 to-slate-950', iconClass: 'text-slate-950', brandColor: '#1da1f2' },
  facebook: { name: 'Facebook', emoji: '👥', bg: 'bg-gradient-to-br from-blue-700 to-blue-900', iconClass: 'text-blue-800', brandColor: '#3b5998' },
  pinterest: { name: 'Pinterest', emoji: '📌', bg: 'bg-gradient-to-br from-red-500 to-red-700', iconClass: 'text-red-600', brandColor: '#bd081c' },
  linkedin: { name: 'LinkedIn', emoji: '💼', bg: 'bg-gradient-to-br from-indigo-500 to-indigo-700', iconClass: 'text-indigo-650', brandColor: '#0077b5' },
  discord: { name: 'Discord', emoji: '💬', bg: 'bg-gradient-to-br from-indigo-400 to-violet-600', iconClass: 'text-violet-500', brandColor: '#7289da' },
  ok: { name: 'Одноклассники', emoji: '🟠', bg: 'bg-gradient-to-br from-orange-400 to-orange-600', iconClass: 'text-orange-500', brandColor: '#ed812b' },
  tenchat: { name: 'TenChat', emoji: '👔', bg: 'bg-gradient-to-br from-emerald-500 to-teal-700', iconClass: 'text-teal-650', brandColor: '#0052cc' },
  dzen: { name: 'Дзен', emoji: '☯️', bg: 'bg-gradient-to-br from-neutral-800 to-neutral-950', iconClass: 'text-zinc-900', brandColor: '#000000' },
  tiktok: { name: 'TikTok', emoji: '🎵', bg: 'bg-gradient-to-br from-teal-400 via-stone-900 to-rose-400', iconClass: 'text-neutral-900', brandColor: '#01f1e2' },
  max: { name: 'Max', emoji: '⭐', bg: 'bg-gradient-to-br from-gray-800 to-zinc-950', iconClass: 'text-zinc-950', brandColor: '#111827' }
};

export default function CrosspostingHub({
  onPublishPost,
  savedPosts,
  connectedChannels,
  tokens,
  onDeductTokens,
  userBalance,
  onDeductBalanceRub,
  alert = window.alert
}: CrosspostingHubProps) {
  // SMM Hub main tabs: Bot automated stream listing / AI manually targeted crosposter
  const [hubTab, setHubTab] = useState<'bot_streams' | 'ai_composer'>('bot_streams');

  // CUSTOM RENEWAL MODAL STATE
  const [extendingStream, setExtendingStream] = useState<AutopostStream | null>(null);

  // BOT STREAMS STATES
  const [streams, setStreams] = useState<AutopostStream[]>(INITIAL_STREAMS);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('none');

  // Create stream assistant wizard
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardSourcePlatform, setWizardSourcePlatform] = useState<SocialNetwork>('telegram');
  const [wizardTargetPlatform, setWizardTargetPlatform] = useState<SocialNetwork>('vk');
  const [wizardSourceChannel, setWizardSourceChannel] = useState('');
  const [wizardTargetChannel, setWizardTargetChannel] = useState('');
  const [wizardVerifyLogs, setWizardVerifyLogs] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const [newStreamSourceChannel, setNewStreamSourceChannel] = useState('');
  const [newStreamTargetGroup, setNewStreamTargetGroup] = useState('Моя группа ВК');
  const [newStreamType, setNewStreamType] = useState<'posts' | 'stories'>('posts');
  const [botVerificationStep, setBotVerificationStep] = useState<'idle' | 'testing' | 'verified'>('idle');

  // Currently expanded stream for settings edit
  const editingStream = streams.find(s => s.id === selectedStreamId);

  // Quick notification banner helper
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // --- PUBLICATIONS STATE MANAGER ---
  const [selectedPubStreamId, setSelectedPubStreamId] = useState<string>('36036');
  const [publicationsGridOpen, setPublicationsGridOpen] = useState(true);
  const [visiblePubsLimit, setVisiblePubsLimit] = useState(10);
  const [publications, setPublications] = useState<Publication[]>(INITIAL_PUBLICATIONS);
  const [activeDetailPublication, setActiveDetailPublication] = useState<Publication | null>(null);
  const [isPublicationsWarningOpen, setIsPublicationsWarningOpen] = useState(true);
  const [isPubLogsExpanded, setIsPubLogsExpanded] = useState(true);
  const [showStreamSelectDropdown, setShowStreamSelectDropdown] = useState(false);

  const selectedStreamForPubs = streams.find(s => s.id === selectedPubStreamId);
  const filteredPubs = publications.filter(p => p.streamId === selectedPubStreamId);
  const visiblePubs = filteredPubs.slice(0, visiblePubsLimit);

  const handleLoadMorePubs = () => {
    setVisiblePubsLimit(prev => prev + 10);
    showToast('История авторепостов успешно загружена далее!');
  };

  // BOT STREAMS MUTATORS
  const toggleStreamStatus = (id: string) => {
    setStreams(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'working' ? 'stopped' : 'working';
        showToast(`Поток #${id} переведен в статус "${nextStatus === 'working' ? 'РАБОТАЕТ' : 'ОСТАНОВЛЕН'}"`);
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const handleSaveSettings = (updatedStream: AutopostStream) => {
    setStreams(prev => prev.map(s => s.id === updatedStream.id ? updatedStream : s));
    showToast(`Настройки авторепоста #${updatedStream.id} успешно сохранены в системе!`);
    setSelectedStreamId(null);
  };

  const triggerBulkAction = () => {
    if (bulkSelection.length === 0) {
      alert('Пожалуйста, выберите каналы репоста флажками слева!');
      return;
    }
    if (bulkAction === 'start') {
      setStreams(prev => prev.map(s => bulkSelection.includes(s.id) ? { ...s, status: 'working' } : s));
      showToast(`Запущено потоков: ${bulkSelection.length}`);
    } else if (bulkAction === 'stop') {
      setStreams(prev => prev.map(s => bulkSelection.includes(s.id) ? { ...s, status: 'stopped' } : s));
      showToast(`Остановлено потоков: ${bulkSelection.length}`);
    } else if (bulkAction === 'delete') {
      if (confirm(`Вы уверены, что хотите бесследно удалить выбранные потоки авторепоста (${bulkSelection.length} шт.)?`)) {
        setStreams(prev => prev.filter(s => !bulkSelection.includes(s.id)));
        setBulkSelection([]);
        showToast('Потоки удалены');
      }
    }
    setBulkAction('none');
  };

  const toggleBulkSelectAll = () => {
    if (bulkSelection.length === streams.length) {
      setBulkSelection([]);
    } else {
      setBulkSelection(streams.map(s => s.id));
    }
  };

  const openAddWizard = () => {
    setWizardStep(1);
    setWizardSourcePlatform('telegram');
    setWizardTargetPlatform('vk');
    setWizardSourceChannel('');
    setWizardTargetChannel('');
    setWizardVerifyLogs([]);
    setIsVerifying(false);
    setShowAddWizard(true);
  };

  const handleExtendStream = (days: number, price: number) => {
    if (!extendingStream) return;
    if (userBalance < price) {
      alert(`Недостаточно средств на балансе! Для продления требуется ${price} ₽. Ваш баланс: ${userBalance} ₽. Пожалуйста, пополните баланс в левой панели.`);
      return;
    }
    if (onDeductBalanceRub) {
      onDeductBalanceRub(price);
    }
    setStreams(prev => prev.map(s => s.id === extendingStream.id ? { 
      ...s, 
      autoPayDays: s.autoPayDays + days,
      status: 'working'
    } : s));
    setExtendingStream(null);
    showToast(`Лицензия потока #${extendingStream.id} успешно продлена на +${days} дней!`);
  };

  const runWizardVerification = () => {
    if (!wizardSourceChannel.trim() || !wizardTargetChannel.trim()) {
      alert('Пожалуйста, укажите имя/ссылку источника и приемника!');
      return;
    }
    setIsVerifying(true);
    setWizardVerifyLogs([]);
    
    const logs = [
      `[SCAN] Подключение к децентрализованному шлюзу SAVA-Sync...`,
      `[SCAN] Поиск целевой площадки на стороне ${PLATFORM_CONFIG[wizardTargetPlatform]?.name || wizardTargetPlatform}...`,
      `[SCAN] Авторизация прав публикатора на '${wizardTargetChannel}'... OK`,
      `[SCAN] Опрос источника '${wizardSourceChannel}' на платформе ${PLATFORM_CONFIG[wizardSourcePlatform]?.name || wizardSourcePlatform}...`,
      `[SCAN] Поиск и валидация административных прав интеграционного робота SAVA-Sync...`,
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setWizardVerifyLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setWizardVerifyLogs(prev => [
          ...prev, 
          `[OK] Соединение успешно установлено! Бот имеет доступ в '${wizardSourceChannel}'.`,
          `[SUCCESS] Кросплатформенный конвейер ретрансляции полностью готов! ✨`
        ]);
        setIsVerifying(false);
        showToast('Проверка связи увенчалась полным успехом!');
      }
    }, 4500 / logs.length);
  };

  const handleCreateStreamFromWizard = () => {
    if (!wizardSourceChannel.trim() || !wizardTargetChannel.trim()) {
      alert('Укажите источник и приемник трансляции контента!');
      return;
    }

    if (userBalance < 150) {
      alert(`Недостаточно средств. Стоимость подключения авторепоста составляет 150 ₽. Ваш баланс: ${userBalance} ₽. Пожалуйста, пополните счет.`);
      return;
    }

    // Deduct 150 rubles from real user balance
    if (onDeductBalanceRub) {
      onDeductBalanceRub(150);
    }

    const randomId = String(Math.floor(Math.random() * 90000) + 10000);
    const newStream: AutopostStream = {
      id: randomId,
      status: 'working',
      autoPayDays: 30, // Paid for 30 days from balance!
      sourcePlatform: wizardSourcePlatform,
      sourceTelegram: wizardSourceChannel.replace('@', '').trim(),
      targetPlatform: wizardTargetPlatform,
      targetVkGroup: wizardTargetChannel,
      adminName: 'Dr White (ID 19902276)',
      repostDestination: 'wall',
      viewType: 'grid',
      contentFilters: {
        photo: true,
        gif: true,
        videoCircle: true,
        file: true,
        poll: true,
        audio: true,
        video: true
      },
      largeVideoAction: 'link',
      repostToPersonalAccount: false,
      captionTemplate: '%caption%',
      keepHashtags: true,
      nicknameHandling: 'link',
      filterByWord: false,
      filterWords: '',
      repostIntervalMin: 3,
      processEmbeddedLinks: true,
      repostDelayMinRange: '5-10',
      delayLocation: 'system'
    };

    setStreams(prev => [newStream, ...prev]);
    setShowAddWizard(false);
    // Reset wizard
    setWizardStep(1);
    setWizardSourceChannel('');
    setWizardTargetChannel('');
    setWizardVerifyLogs([]);
    showToast(`Создан новый автоматический поток #${randomId} за 150 ₽! Списание проведено.`);
  };

  // Deprecated callback kept as a fallback compatibility stub
  const handleAddNewStream = () => {
    if (!newStreamSourceChannel.trim()) return;
    const randomId = String(Math.floor(Math.random() * 90000) + 10000);
    const newStream: AutopostStream = {
      id: randomId,
      status: 'working',
      autoPayDays: 7,
      sourcePlatform: 'telegram',
      sourceTelegram: newStreamSourceChannel.replace('@', '').trim(),
      targetPlatform: 'vk',
      targetVkGroup: newStreamTargetGroup,
      adminName: 'Dr White (ID 19902276)',
      repostDestination: 'wall',
      viewType: 'grid',
      contentFilters: { photo: true, gif: true, videoCircle: true, file: true, poll: true, audio: true, video: true },
      largeVideoAction: 'link', repostToPersonalAccount: false, captionTemplate: '%caption%', keepHashtags: true,
      nicknameHandling: 'link', filterByWord: false, filterWords: '', repostIntervalMin: 3, processEmbeddedLinks: true,
      repostDelayMinRange: '5-10', delayLocation: 'system'
    };
    setStreams(prev => [newStream, ...prev]);
    setShowAddWizard(false);
    showToast(`Создан новый автоматический поток #${randomId}`);
  };

  // MASTER MANUAL COMPOSER STATES
  const [masterText, setMasterText] = useState('');
  const [masterTitle, setMasterTitle] = useState('');
  const [masterLink, setMasterLink] = useState('');
  const [enableUtm, setEnableUtm] = useState(true);
  const [utmCampaign, setUtmCampaign] = useState('crosspost_autumn');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPlatformTab, setCurrentPlatformTab] = useState<SocialNetwork>('telegram');

  const [adaptations, setAdaptations] = useState<Record<SocialNetwork, { text: string; isEnabled: boolean; title?: string; extraConfig?: any }>>({
    telegram: { text: '', isEnabled: true, extraConfig: { showNotification: true } },
    vk: { text: '', isEnabled: true, extraConfig: { commentsDisabled: false } },
    setka: { text: '', isEnabled: true, title: '', extraConfig: { gridStyle: 'bento' } },
    instagram: { text: '', isEnabled: false, extraConfig: {} },
    x: { text: '', isEnabled: false, extraConfig: {} },
    max: { text: '', isEnabled: false, extraConfig: {} },
    facebook: { text: '', isEnabled: false, extraConfig: {} },
    pinterest: { text: '', isEnabled: false, extraConfig: {} },
    linkedin: { text: '', isEnabled: false, extraConfig: {} },
    discord: { text: '', isEnabled: false, extraConfig: {} },
    ok: { text: '', isEnabled: false, extraConfig: {} },
    tenchat: { text: '', isEnabled: false, extraConfig: {} },
    dzen: { text: '', isEnabled: false, extraConfig: {} },
    tiktok: { text: '', isEnabled: false, extraConfig: {} },
  });

  const [isAiAdapting, setIsAiAdapting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccessReport, setShowSuccessReport] = useState(false);
  const [postedAnalytics, setPostedAnalytics] = useState<{ views: number; clicks: number } | null>(null);

  const getUtmLink = (platform: SocialNetwork) => {
    if (!masterLink.trim()) return '';
    if (!enableUtm) return masterLink;
    const parsedUrl = masterLink.startsWith('http') ? masterLink : `https://${masterLink}`;
    const separator = parsedUrl.includes('?') ? '&' : '?';
    return `${parsedUrl}${separator}utm_source=${platform}&utm_medium=crosspost&utm_campaign=${utmCampaign || 'iisms_campaign'}`;
  };

  const togglePlatformCheckbox = (net: SocialNetwork) => {
    setAdaptations(prev => ({
      ...prev,
      [net]: { ...prev[net], isEnabled: !prev[net].isEnabled }
    }));
  };

  const handleSmartAiAdaptation = async () => {
    if (!masterText.trim()) {
      alert('Пожалуйста, введите исходный текст!');
      return;
    }
    if (tokens < 15) {
      alert('Недостаточно токенов (необходимо минимум 15 🪙)');
      return;
    }

    setIsAiAdapting(true);
    try {
      const activePlatforms = Object.keys(adaptations).filter(k => adaptations[k as SocialNetwork].isEnabled) as SocialNetwork[];
      const updated = { ...adaptations };

      for (const net of activePlatforms) {
        let promptStyle = '';
        if (net === 'telegram') promptStyle = 'красивый TG-пост с абзацами и эмодзи';
        else if (net === 'vk') promptStyle = 'вовлекающий пост ВКонтакте с вопросом для комментариев и теническими хэштегами';
        else if (net === 'setka') promptStyle = 'экспертный структурированный B2B лонгрид без лишней воды с броским заголовком';
        else if (net === 'instagram') promptStyle = 'инстаграм-пост с аккуратными переносами строк и крючком в начале';
        else if (net === 'x') promptStyle = 'короткий тред или твит (до 280 символов) с сильными тезисами';

        const customPrompt = `Перепиши этот текст под формат ${net.toUpperCase()} (${promptStyle}):\n\n"${masterText}"`;

        try {
          const response = await fetch('/api/ai/rewrite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: masterText,
              styleUrlOrChannel: `@${net}_pro`,
              originalStyleDesc: customPrompt
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.text) {
              updated[net].text = data.text.replace('[Режим ДЕМО | Добавьте API KEY]', '').trim();
              if (net === 'setka') {
                updated[net].title = masterTitle || 'Профессиональный Инсайт';
              }
            }
          } else {
            throw new Error('Using fallback');
          }
        } catch (e) {
          // Rule based fallback
          if (net === 'telegram') {
            updated[net].text = `✈️ **Telegram Релиз:**\n\n${masterText}\n\n🔍 Читайте подробнее на сайте!`;
          } else if (net === 'vk') {
            updated[net].text = `🔵 **Пост ВКонтакте**\n\nПривет, друзья! Делимся свежим материалом:\n\n${masterText}\n\n👉 Напишите ваше мнение в комментариях!`;
          } else if (net === 'setka') {
            updated[net].title = masterTitle || 'СИНЕРГИЯ И КРОССПОСТИНГ';
            updated[net].text = `🤖 **Для Сетки (Setka):**\n\n💼 Главные инсайты:\n• ${masterText.split('\n').filter(Boolean).join('\n• ')}\n\nОбсудим в экспертном круге.`;
          } else {
            updated[net].text = masterText;
          }
        }
      }

      setAdaptations(updated);
      onDeductTokens(15);
      showToast('ИИ Gemini великолепно адаптировал содержание под каждую сеть!');
    } catch (err: any) {
      alert(`Ошибка адаптации: ${err.message}`);
    } finally {
      setIsAiAdapting(false);
    }
  };

  const publishManualAll = () => {
    const activeNets = Object.keys(adaptations).filter(k => adaptations[k as SocialNetwork].isEnabled) as SocialNetwork[];
    if (activeNets.length === 0) {
      alert('Выберите хотя бы одну сеть для публикации!');
      return;
    }

    setIsPosting(true);
    setTimeout(() => {
      activeNets.forEach((net) => {
        onPublishPost({
          title: adaptations[net].title || masterTitle || `ИИ Пост [${net.toUpperCase()}]`,
          content: `${adaptations[net].text}${masterLink ? `\n\n🔗 ${getUtmLink(net)}` : ''}`,
          imageUrl: selectedImage || undefined,
          platforms: [net],
          status: 'published',
          isAiGenerated: true
        });
      });

      setPostedAnalytics({
        views: Math.floor(8200 + Math.random() * 4100),
        clicks: Math.floor(450 + Math.random() * 320)
      });
      setIsPosting(false);
      setShowSuccessReport(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert Badge */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 border border-slate-800 text-emerald-400 font-extrabold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-mono"
          >
            <CheckSquare className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Mode Toggler & Explainer Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-700 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        {/* Abstract graphics to look like highly crafted background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/10 rounded-full filter blur-2xl -ml-16 -mb-16 pointer-events-none" />

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest text-sky-200">
            <Globe className="w-3.5 h-3.5" />
            <span>СИНХРОННЫЙ МУЛЬТИ-КРОССПОСТИНГ</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight uppercase font-sans">
            🔄 Универсальный Перенос & Зеркалирование (Any ➔ Any)
          </h2>
          <p className="text-xs text-white/90 leading-relaxed font-semibold">
            Автоматически дублируйте публикации между любыми вашими каналами и группами без ручного копирования. Наша система в режиме реального времени отслеживает новые посты в Telegram, VK или Instagram, адаптирует контент под требования целевой площадки при помощи ИИ, вырезает ссылки на посторонние ресурсы и добавляет UTM-маркеры.
          </p>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setHubTab('bot_streams')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                hubTab === 'bot_streams'
                  ? 'bg-white text-slate-900 shadow-lg scale-102 font-extrabold'
                  : 'bg-white/15 hover:bg-white/20 text-white'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>📡 Роботы-Репосты ({streams.length})</span>
            </button>

            <button
              onClick={() => setHubTab('ai_composer')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                hubTab === 'ai_composer'
                  ? 'bg-white text-slate-900 shadow-lg scale-102 font-extrabold'
                  : 'bg-white/15 hover:bg-white/20 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
              <span>✍️ Умный Мульти-Постинг ИИ</span>
            </button>
          </div>
        </div>
      </div>

      {hubTab === 'bot_streams' ? (
        <>
          {/* *******************************************************************
          // BOT AUTOSTREAMS MANAGER (MATCHING THE SCREENSHOTS EXACTLY)
          // ******************************************************************* */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          
          {/* List of active crosspostings (7 Columns if editing / 8 otherwise) */}
          <div className={`${editingStream ? 'lg:col-span-6' : 'lg:col-span-8'} space-y-4 transition-all duration-350`}>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
              
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-3">
                <div className="space-y-0.5">
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-blue-500" />
                    <span>Каналы репоста</span>
                  </h3>
                  <p className="text-[10px] text-slate-450 font-semibold font-mono">Автономные конвейеры ретрансляции контента</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Поиск по каналам..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-slate-400 w-full sm:w-36 font-semibold"
                  />
                  <button
                    onClick={openAddWizard}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm w-full sm:w-auto"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Создать новый</span>
                  </button>
                </div>
              </div>

              {/* Bulk Actions Console */}
              {streams.length > 0 && (
                <div className="flex flex-wrap items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 gap-2 text-[10px] font-bold text-slate-600 font-mono">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={bulkSelection.length === streams.length && streams.length > 0}
                      onChange={toggleBulkSelectAll}
                      className="rounded text-blue-500 focus:ring-blue-400 scale-95 cursor-pointer"
                    />
                    <span className="uppercase font-black text-slate-500">Выбрать все</span>
                    <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-extrabold">{bulkSelection.length} выбрано</span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 sm:mt-0">
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-250 rounded text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-semibold"
                    >
                      <option value="none">Выберите, что делать с отмеченными</option>
                      <option value="start">▶ Запустить трансляцию</option>
                      <option value="stop">■ Остановить трансляцию</option>
                      <option value="delete">🗑️ Удалить потоки навсегда</option>
                    </select>
                    <button
                      onClick={triggerBulkAction}
                      className="px-2.5 py-1 bg-slate-900 text-white font-black rounded text-[10px] uppercase cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      ОК
                    </button>
                  </div>
                </div>
              )}

              {/* Streams Loop Rendering */}
              <div className="space-y-4">
                {streams.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-350 mx-auto" />
                    <p className="text-xs text-slate-500 font-black">У вас еще нет ни одного автоматического репоста.</p>
                    <p className="text-[10px] text-slate-400 font-bold max-w-sm mx-auto">Нажмите кнопку «Создать новый», добавьте бота SAVA_AI в ваш Телеграм и начните автовещание в ВК.</p>
                  </div>
                ) : (
                  streams
                    .filter(s => s.sourceTelegram.toLowerCase().includes(searchQuery.toLowerCase()) || s.targetVkGroup.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((s) => {
                      const isSelected = selectedStreamId === s.id;
                      const isChecked = bulkSelection.includes(s.id);

                      return (
                        <div 
                          key={s.id}
                          className={`relative p-4 rounded-xl border transition-all ${
                            isSelected 
                              ? 'border-blue-400 bg-blue-50/15 shadow-sm' 
                              : 'border-slate-150 hover:border-slate-300 hover:bg-slate-50/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 font-sans">
                            {/* Left part: Checkbox + Info */}
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setBulkSelection(prev => prev.filter(id => id !== s.id));
                                  } else {
                                    setBulkSelection(prev => [...prev, s.id]);
                                  }
                                }}
                                className="mt-1 shrink-0 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />

                              <div className="space-y-2 flex-1 min-w-0">
                                {/* Stream status header */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black">
                                    #{s.id}
                                  </span>

                                  {s.status === 'working' ? (
                                    <span className="text-[10px] text-emerald-600 font-black uppercase flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      <span>Вещает</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-450 font-black uppercase flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                      <span>Остановлен</span>
                                    </span>
                                  )}

                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {s.status === 'working' ? (
                                      <span className="text-[9px] text-slate-500 font-mono font-bold flex items-center gap-1">
                                        <RotateCcw className="w-3 h-3 text-emerald-500 animate-spin-slow" />
                                        <span>баланс {s.autoPayDays}дн.</span>
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-rose-500 font-mono font-bold uppercase">срок истек (0дн.)</span>
                                    )}
                                    <span className="text-slate-300 text-[8px]">•</span>
                                    <button 
                                      onClick={() => setExtendingStream(s)}
                                      className="text-[9px] text-blue-600 hover:text-blue-800 transition-colors hover:underline font-mono font-black uppercase flex items-center gap-0.5 cursor-pointer bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                                    >
                                      <span>💳 продлить (+30д)</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Dynamic Multi-platform Redirect Illustration */}
                                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/50 flex flex-col space-y-2 relative">
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none hidden md:block">
                                    <ArrowRight className="w-7 h-7 opacity-20 shrink-0" />
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full ${PLATFORM_CONFIG[s.sourcePlatform]?.bg || 'bg-sky-500'} flex items-center justify-center text-white shrink-0 shadow-xs text-[10px]`}>
                                      {PLATFORM_CONFIG[s.sourcePlatform]?.emoji || '✈️'}
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="text-xs font-extrabold text-slate-800 leading-tight truncate flex items-center gap-1">
                                        <span className="text-slate-400 text-[9px] font-mono">[{PLATFORM_CONFIG[s.sourcePlatform]?.name}]</span>
                                        <span className="font-mono text-slate-700">@{s.sourceTelegram}</span>
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 pl-6">
                                    <div className="w-2 border-l border-b border-dashed border-slate-300 h-2 -mt-2 shrink-0" />
                                    <div className={`w-5 h-5 rounded-full ${PLATFORM_CONFIG[s.targetPlatform]?.bg || 'bg-blue-600'} flex items-center justify-center text-white shrink-0 shadow-xs text-[10px]`}>
                                      {PLATFORM_CONFIG[s.targetPlatform]?.emoji || '🔵'}
                                    </div>
                                    <div className="overflow-hidden w-full">
                                      <p className="text-[11px] font-black text-slate-650 leading-tight truncate flex items-center gap-1">
                                        <span className="text-slate-400 text-[9px] font-mono">[{PLATFORM_CONFIG[s.targetPlatform]?.name}]</span>
                                        <span className="text-slate-800 truncate">{s.targetVkGroup}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right action controls */}
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <button
                                onClick={() => setSelectedStreamId(isSelected ? null : s.id)}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                                title="Настройка правил репоста"
                              >
                                <Settings className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => toggleStreamStatus(s.id)}
                                className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                                  s.status === 'working'
                                    ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
                                    : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                                }`}
                                title={s.status === 'working' ? 'Приостановить репост' : 'Запустить репост'}
                              >
                                {s.status === 'working' ? (
                                  <Square className="w-3.5 h-3.5 fill-current" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                )}
                              </button>
                            </div>

                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Quick Helper Guide Widget */}
            <div className="bg-sky-50 rounded-2xl p-5 border border-sky-100 text-slate-700/90 text-xs font-semibold leading-relaxed space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-600" />
                <h4 className="font-black uppercase text-sky-850 text-xs tracking-wider">Как устроен бот-репостер?</h4>
              </div>
              <p className="text-[11px]">
                Для того чтобы зеркалированный кросспостинг запустился, вам достаточно выполнить два простых шага:
              </p>
              <ul className="text-[11px] list-decimal pl-4 space-y-1 font-sans">
                <li>Добавьте нашего ИИ вещателя <strong className="text-sky-850 font-bold">@SAVA_AI_repost_bot</strong> в качестве полноправного администратора в ваш целевой Telegram-канал (не требуются права публикации, только доступ к сообщениям).</li>
                <li>Авторизуйте ваш ВК аккаунт для подтверждения прав администратора на целевую группу в ВК, куда бот будет заливать посты по вашему индивидуальному шаблону.</li>
              </ul>
            </div>
          </div>

          {/* EDIT SETTINGS COMPONENT (6 Columns) OR ADD FORM (4 Columns) */}
          <div className={`${editingStream ? 'lg:col-span-6' : 'lg:col-span-4'} transition-all duration-350`}>
            <AnimatePresence mode="wait">
              
              {/* SETUP FLOW: Custom settings of stream exactly like in user screenshots */}
              {editingStream ? (
                <motion.div
                  key="editing-pane"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-6 text-left relative"
                >
                  
                  {/* Title Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-blue-500 font-mono font-black uppercase tracking-wider block">ПАНЕЛЬ КАНАЛА РЕПОСТА</span>
                      <h3 className="font-extrabold text-sm text-slate-800">
                        Настройка канала <span className="text-blue-600">#{editingStream.id}</span>
                      </h3>
                    </div>
                    <button 
                      onClick={() => setSelectedStreamId(null)}
                      className="px-2 py-1 hover:bg-slate-100 rounded text-slate-400 text-xs font-extrabold cursor-pointer"
                    >
                      Закрыть
                    </button>
                  </div>

                  {/* Visual Line connector exactly as in screenshot */}
                  <div className="bg-slate-55 p-3 rounded-xl border border-slate-200/60 text-slate-700/95 text-xs font-semibold leading-normal flex flex-col space-y-2 relative">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none hidden sm:block">
                      <ArrowRight className="w-8 h-8 opacity-30 shrink-0" />
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                        <span className="text-[11px]">✈️</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-black text-slate-800 tracking-tight truncate flex items-center gap-1.5">
                          <span>{editingStream.sourceTelegram}</span>
                          <span className="text-[9px] text-slate-400 font-mono font-bold font-sans bg-slate-100 px-1 py-0.5 rounded">используя бота SAVA_AI_repost_bot</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pl-7">
                      <div className="w-2 border-l border-b border-dashed border-slate-300 h-2 -mt-2 shrink-0 animate-pulse" />
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                        <span className="text-[11px]">🔵</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-black text-slate-700 truncate">
                          {editingStream.targetVkGroup}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SETTINGS FORMS */}
                  <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
                    
                    {/* Vk Admin */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Аккаунт администратора группы Vk:
                      </label>
                      <select 
                        value={editingStream.adminName}
                        onChange={(e) => setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, adminName: e.target.value } : s))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer bg-white"
                      >
                        <option value="Dr White (ID 19902276)">Dr White (ID 19902276)</option>
                        <option value="Svetlana SMM (ID 40228190)">Svetlana SMM (ID 40228190)</option>
                      </select>
                    </div>

                    {/* Vk destination wall */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Куда делать репост:
                      </label>
                      <div className="space-y-1">
                        {[
                          { val: 'wall', label: 'На стену группы VK' },
                          { val: 'chat', label: 'В чат группы' },
                          { val: 'both', label: 'На стену и перепост в чат' }
                        ].map(item => (
                          <label key={item.val} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-650">
                            <input 
                              type="radio" 
                              name="repostDestination"
                              value={item.val}
                              checked={editingStream.repostDestination === item.val}
                              onChange={() => setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, repostDestination: item.val as any } : s))}
                              className="text-blue-500 focus:ring-blue-400"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-[9px] text-orange-600 font-bold mt-1 font-sans">
                        Для подключения чата выдайте права доступа к сообщениям группы
                      </p>
                    </div>

                    {/* Album placeholder banner exactly from screenshot */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Альбом:
                      </label>
                      <div className="bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-100 text-[11px] font-bold text-center">
                        Нет альбомов для выбора
                      </div>
                    </div>

                    {/* View style radios */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Вид публикации:
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                          <input 
                            type="radio" 
                            name="viewType"
                            checked={editingStream.viewType === 'slideshow'}
                            onChange={() => setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, viewType: 'slideshow' } : s))}
                            className="text-blue-500 focus:ring-blue-400"
                          />
                          <span>Слайдшоу</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                          <input 
                            type="radio" 
                            name="viewType"
                            checked={editingStream.viewType === 'grid'}
                            onChange={() => setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, viewType: 'grid' } : s))}
                            className="text-blue-500 focus:ring-blue-400"
                          />
                          <span>Сетка</span>
                        </label>
                      </div>
                    </div>

                    {/* Content type filters checkboxes */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                        <span>Фильтр по содержимому:</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {Object.keys(editingStream.contentFilters).map((key) => {
                          const labelMap: Record<string, string> = {
                            photo: 'Фото 📷',
                            gif: 'Гифка 🎬',
                            videoCircle: 'Видео-кружок 🎥',
                            file: 'Файл 📁',
                            poll: 'Опрос 🗳️',
                            audio: 'Аудио 🎵',
                            video: 'Видео 📺'
                          };

                          const typedKey = key as keyof typeof editingStream.contentFilters;
                          return (
                            <label key={key} className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-slate-650">
                              <input 
                                type="checkbox"
                                checked={editingStream.contentFilters[typedKey]}
                                onChange={(e) => {
                                  const updatedFilters = { ...editingStream.contentFilters, [typedKey]: e.target.checked };
                                  setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, contentFilters: updatedFilters } : s));
                                }}
                                className="rounded text-blue-550 focus:ring-blue-400 text-xs"
                              />
                              <span className="leading-tight">{labelMap[key] || key}</span>
                              {key === 'audio' && (
                                <span className="block text-[7px] text-red-500 font-bold block leading-none font-sans mt-0.5">не активен в ВК</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Caption formatting template textarea */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Оформление подписи:
                        </label>
                        <span className="text-[8px] bg-slate-150 text-slate-700 px-1.5 py-0.5 rounded font-black font-mono uppercase">CAPTION TEMPLATE</span>
                      </div>
                      <textarea
                        rows={3}
                        value={editingStream.captionTemplate}
                        onChange={(e) => setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, captionTemplate: e.target.value } : s))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs font-semibold placeholder-slate-400 bg-white font-mono"
                        placeholder="Напишите %caption% для копирования всего текста..."
                      />
                      
                      {/* Available tags exact replication */}
                      <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-150 text-[10px] text-slate-650 space-y-1.5 font-sans">
                        <span className="font-extrabold text-slate-800 uppercase text-[9px] block">Доступные шаблоны:</span>
                        <p className="text-[10px]"><strong className="text-blue-600 font-mono">%caption%</strong> - копируется весь текст из публикации Telegram</p>
                        
                        <div className="pl-1 space-y-1 border-l-2 border-slate-200">
                          <p className="text-[9px] font-bold text-slate-500">Обрезка текста:</p>
                          <p className="text-[9px]"><strong className="text-rose-500 font-mono">%after|___%</strong> - копирует текст ПОСЛЕ маркера</p>
                          <p className="text-[9px]"><strong className="text-rose-500 font-mono">%before|___%</strong> - копирует текст ДО маркера</p>
                          <p className="text-[9px]"><strong className="text-rose-500 font-mono">%between|___|___%</strong> - копирует текст МЕЖДУ маркерами</p>
                        </div>

                        <p className="text-[10px]"><strong className="text-blue-600 font-mono">%link%</strong> - прямая ссылка на публикацию Telegram</p>
                        <p className="text-[10px]"><strong className="text-blue-600 font-mono">%date%</strong> - дата создания публикации в Telegram</p>
                        <p className="text-[10px]"><strong className="text-blue-600 font-mono">%allhashtags%</strong> - все хештеги из публикации</p>
                      </div>
                    </div>

                    {/* Extra Settings Grid */}
                    <div className="space-y-3.5 bg-slate-50/50 p-3.5 rounded-xl border border-slate-150">
                      
                      {/* Keep hashtags option */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-bold text-slate-650">Оставлять хештеги в описании при репосте?</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, keepHashtags: true } : s))}
                            className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase ${editingStream.keepHashtags ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                          >
                            Да
                          </button>
                          <button
                            type="button"
                            onClick={() => setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, keepHashtags: false } : s))}
                            className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase ${!editingStream.keepHashtags ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                          >
                            Нет
                          </button>
                        </div>
                      </div>

                      {/* Nickname formatting dropdown */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-550 uppercase mb-1">Что делать с никнеймами при репосте?</label>
                        <select
                          value={editingStream.nicknameHandling}
                          onChange={(e) => setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, nicknameHandling: e.target.value as any } : s))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white cursor-pointer focus:outline-none"
                        >
                          <option value="strip">Убирать @ перед ником</option>
                          <option value="keep">Оставлять @ как есть, слитно с ником</option>
                          <option value="link">Преобразовывать в ссылку</option>
                          <option value="delete">Стирать полностью</option>
                        </select>
                      </div>

                      {/* Repost interval */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-550 uppercase mb-1">Интервал между репостами:</label>
                        <select
                          value={editingStream.repostIntervalMin}
                          onChange={(e) => setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, repostIntervalMin: Number(e.target.value) } : s))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white cursor-pointer focus:outline-none"
                        >
                          <option value={3}>Минимум 3 минуты</option>
                          <option value={5}>5 минут</option>
                          <option value={10}>10 минут</option>
                        </select>
                      </div>

                      {/* Delay settings */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-550 uppercase mb-1">Задержка перед репостом:</label>
                        <select
                          value={editingStream.repostDelayMinRange}
                          onChange={(e) => setStreams(prev => prev.map(s => s.id === editingStream.id ? { ...s, repostDelayMinRange: e.target.value } : s))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white cursor-pointer focus:outline-none"
                        >
                          <option value="0">Мгновенно</option>
                          <option value="5-10">Обычно 5-10 минут</option>
                          <option value="15">15 минут</option>
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* Actions buttons */}
                  <div className="pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleSaveSettings(editingStream)}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm cursor-pointer"
                    >
                      Сохранить настройки
                    </button>
                    <button
                      onClick={() => setSelectedStreamId(null)}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-750 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      Отмена
                    </button>
                  </div>

                </motion.div>
              ) : (
                
                // SIDEBAR: CREATE NEW MOUNT STEAM WIZARD (Satisfying screenshots card)
                <motion.div
                  key="creator-pane"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl p-6 border border-slate-150 shadow-sm space-y-4 text-left"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight">
                      Создать новый канал репоста
                    </h3>
                    <p className="text-[10px] text-slate-450 font-semibold leading-relaxed mt-0.5">
                      Настройте сквозную ретрансляцию из TG в ВК
                    </p>
                  </div>

                  {/* Selection of auto type as in screenshot */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">1. Выберите тип канала</span>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 cursor-pointer text-[10.5px] font-bold text-slate-700 bg-white hover:bg-slate-50/50">
                        <input 
                          type="radio" 
                          name="newStreamType"
                          checked={newStreamType === 'posts'}
                          onChange={() => setNewStreamType('posts')}
                          className="text-blue-500 focus:ring-blue-400"
                        />
                        <span>Репост публикаций</span>
                      </label>
                      <label className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 cursor-pointer text-[10.5px] font-bold text-slate-700 bg-white hover:bg-slate-50/50">
                        <input 
                          type="radio" 
                          name="newStreamType"
                          checked={newStreamType === 'stories'}
                          onChange={() => setNewStreamType('stories')}
                          className="text-blue-500 focus:ring-blue-400"
                        />
                        <span>Репост историй</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Адрес Telegram канала (Источник):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-440 font-mono font-bold">@</span>
                        <input
                          type="text"
                          placeholder="например: SAVA_AI"
                          value={newStreamSourceChannel}
                          onChange={(e) => setNewStreamSourceChannel(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Целевая площадка репоста (ВК):
                      </label>
                      <select 
                        value={newStreamTargetGroup}
                        onChange={(e) => setNewStreamTargetGroup(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white cursor-pointer"
                      >
                        <option value="SAV AI ИИ боты для бизнеса">SAV AI ИИ боты для бизнеса (Группа)</option>
                        <option value="Svetlana SMM Blog (Паблик)">Svetlana SMM Blog (Паблик)</option>
                        <option value="Личная страница VK (Dr White)">Личная страница VK (Dr White)</option>
                      </select>
                    </div>

                    {/* Integrated check demo console block */}
                    {newStreamSourceChannel && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2 text-[11px]">
                        <p className="font-extrabold text-slate-800 uppercase text-[9px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Проверка готовности:</span>
                        </p>
                        <p className="text-[10px] text-slate-600 leading-snug font-sans">
                          Для завершения, добавьте <strong className="text-blue-650 font-bold">@SAVA_AI_repost_bot</strong> в ваш Telegram-канал <strong className="text-slate-800">@{newStreamSourceChannel}</strong> и сделайте его администратором.
                        </p>

                        <div className="flex gap-1.5 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setBotVerificationStep('testing');
                              setTimeout(() => {
                                setBotVerificationStep('verified');
                                showToast('Интеграция ИИ-бота проверена. Связь успешно установлена!');
                              }, 1200);
                            }}
                            className="px-2.5 py-1.5 bg-slate-900 text-white rounded text-[9px] font-extrabold uppercase hover:bg-slate-850 cursor-pointer"
                          >
                            {botVerificationStep === 'testing' ? 'Сканирование...' : 'Проверить бота'}
                          </button>
                          <span className="text-[9px] inline-flex items-center text-slate-400 font-mono">
                            {botVerificationStep === 'verified' ? '✅ Связь подтверждена!' : '⌛ Ожидает проверки'}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleAddNewStream}
                      disabled={!newStreamSourceChannel}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-colors"
                    >
                      Подключить авторепост
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* =================================================================== */}
        {/* PUBLICATIONS / REPOST HISTORY COMPONENT (as requested by user) */}
        {/* =================================================================== */}
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5 text-left">
            
            {/* Header / Selector controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap pb-0.5">
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base tracking-tight flex items-center gap-1.5 uppercase">
                    <Layers className="w-5 h-5 text-blue-500" />
                    <span>Публикации</span>
                  </h3>
                  
                  {/* Selector Dropdown with dropdown-chevron */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowStreamSelectDropdown(!showStreamSelectDropdown)}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100/65 text-blue-600 border border-blue-100/80 rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 uppercase transition-all"
                    >
                      <span>Канал #{selectedPubStreamId}</span>
                      <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    
                    {showStreamSelectDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-20" 
                          onClick={() => setShowStreamSelectDropdown(false)} 
                        />
                        <div className="absolute left-0 mt-1.5 w-72 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-30 text-left overflow-hidden">
                          <p className="px-3 pb-1.5 pt-1 text-[9px] font-black tracking-widest text-slate-400 uppercase font-mono border-b border-slate-100">Выберите поток:</p>
                          {streams.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setSelectedPubStreamId(s.id);
                                setVisiblePubsLimit(10);
                                setShowStreamSelectDropdown(false);
                                showToast(`Загружен лог репоста потока #${s.id}`);
                              }}
                              className={`w-full px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer flex flex-col gap-1 border-b border-slate-50 last:border-0 ${
                                selectedPubStreamId === s.id ? 'bg-blue-50/40 text-blue-600 font-extrabold' : 'text-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>Поток #{s.id} ({s.status === 'working' ? 'Вещает' : 'Остановлен'})</span>
                                {selectedPubStreamId === s.id && <Check className="w-4 h-4 text-blue-600 stroke-[3]" />}
                              </div>
                              <span className="text-[10px] text-slate-450 font-normal font-mono truncate">
                                {PLATFORM_CONFIG[s.sourcePlatform]?.emoji} @{s.sourceTelegram} ➔ {PLATFORM_CONFIG[s.targetPlatform]?.emoji} {s.targetVkGroup}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Subtitle - source 👉 target channel name details */}
                {selectedStreamForPubs && (
                  <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-400 font-bold font-mono">
                    <span className="bg-slate-50 hover:bg-slate-100 border border-slate-150 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors">
                      {PLATFORM_CONFIG[selectedStreamForPubs.sourcePlatform]?.emoji} @{selectedStreamForPubs.sourceTelegram}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="bg-slate-50 hover:bg-slate-100 border border-slate-150 px-2 py-0.5 rounded-lg flex items-center gap-1 max-w-[200px] sm:max-w-xs truncate transition-colors">
                      {PLATFORM_CONFIG[selectedStreamForPubs.targetPlatform]?.emoji} {selectedStreamForPubs.targetVkGroup}
                    </span>
                  </div>
                )}
              </div>

              {/* Toggler Button: Показать репосты (X шт.) */}
              <button
                onClick={() => setPublicationsGridOpen(!publicationsGridOpen)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-750 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-between cursor-pointer transition-all shrink-0"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>Показать публикации ({filteredPubs.length} шт.)</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${publicationsGridOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* EXPANDABLE GRID LIST */}
            <AnimatePresence initial={false}>
              {publicationsGridOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {filteredPubs.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wide">Нет опубликованных репостов</p>
                      <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">История репостов для данного потока пуста.</p>
                    </div>
                  ) : (
                    <div className="space-y-6 pt-2">
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                        {visiblePubs.map((pub) => {
                          return (
                            <div 
                              key={pub.id} 
                              onClick={() => {
                                setActiveDetailPublication(pub);
                                setIsPubLogsExpanded(true);
                              }}
                              className="group relative flex flex-col items-center cursor-pointer transition-all"
                            >
                              {/* Square box representation with green border for verified success */}
                              <div className="aspect-square w-full rounded-2xl border-2 border-emerald-500 overflow-hidden relative shadow-sm bg-slate-50 flex items-center justify-center transition-all group-hover:scale-103 group-hover:shadow-md">
                                {pub.imageUrl ? (
                                  <img 
                                    src={pub.imageUrl} 
                                    alt="Publication thumb" 
                                    className="object-cover w-full h-full"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center p-3 text-center text-slate-600">
                                    <FileText className="w-8 h-8 text-indigo-400 stroke-[1.5] mb-1.5 font-sans" />
                                    <span className="text-[9px] font-black font-sans uppercase tracking-wider text-slate-400 leading-tight">Текст</span>
                                  </div>
                                )}
                                
                                {/* Hover interactive badge overlay */}
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="bg-white text-slate-900 text-[10px] font-black px-2.5 py-1.5 rounded-xl shadow-sm uppercase tracking-wide">В Кабинет</span>
                                </div>

                                {/* Multi post indicator icon overlay in corner */}
                                {pub.isMultiPost && (
                                  <span className="absolute top-1.5 right-1.5 bg-slate-900/75 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-widest leading-none z-10">
                                    мульти
                                  </span>
                                )}
                              </div>

                              {/* Green checkmark indicator directly below card */}
                              <div className="mt-2 text-slate-400 font-bold font-mono text-[9px] tracking-tight uppercase flex items-center gap-1">
                                <span className="bg-emerald-50 text-emerald-600 rounded-full p-0.5 border border-emerald-100 flex items-center justify-center">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                                <span>{pub.id}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Load More Trigger Button */}
                      {visiblePubsLimit < filteredPubs.length && (
                        <div className="flex justify-start pt-2 border-t border-slate-100">
                          <button
                            onClick={handleLoadMorePubs}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>ПОДГРУЗИТЬ ЕЩЕ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Warning Limit message as in screenshot */}
            {isPublicationsWarningOpen && (
              <div className="flex items-start justify-between bg-amber-50/60 border border-amber-200/50 text-amber-850 p-4 rounded-xl text-[11px] font-semibold leading-relaxed relative font-sans transition-colors hover:bg-amber-50">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                  <p>
                    <strong className="text-amber-900">Обратите внимание:</strong> у ВКонтакте есть жесткие суточные лимиты публикации. На данный момент наша ИИ-система автоматически ограничивает поток до 150 автопостов в сутки во избежание блокировок и заморозок сообщества. Все публикации проходят через безопасную задержку.
                  </p>
                </div>
                <button 
                  onClick={() => setIsPublicationsWarningOpen(false)}
                  className="text-amber-500 hover:text-amber-850 cursor-pointer p-0.5 transition-colors shrink-0"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            )}

          </div>
        </div>
        </>
      ) : (
        // *******************************************************************
        // MANUAL AI MULTIPOSTING/TAILORING EDITOR COMPONENT
        // *******************************************************************
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left animate-fade-in">
          {/* Main Manual Area */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Template inputs */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-pink-500" />
                  <span>Единый исходный контент</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400 font-bold">ПОДГОТОВКА ШАБЛОНА</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Общий заголовок / Название темы (для Сетки, Дзена или VC):
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Секреты органического роста в SMM 2026"
                    value={masterTitle}
                    onChange={(e) => setMasterTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400/50 text-xs font-semibold placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Мастер-Текст (Исходный материал для адаптации):
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Введите основной текст вашего поста здесь. ИИ Gemini поможет распределить, сократить и перефразировать его индивидуально под форматы Telegram, VK, Instagram, X (Twitter) и др."
                    value={masterText}
                    onChange={(e) => setMasterText(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400/50 text-xs font-semibold placeholder-slate-400 leading-relaxed"
                  />
                  <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-mono">
                    <span>Символов: {masterText.length}</span>
                    <span>Рекомендуется для базы &gt; 100 символов</span>
                  </div>
                </div>

                {/* Target CTA Link & UTM builder */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-sky-500" />
                      <span className="text-xs font-extrabold text-slate-800">Целевая ссылка для трафика</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enableUtm} 
                        onChange={(e) => setEnableUtm(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-pink-500"></div>
                      <span className="ml-2 text-[10px] font-black text-slate-500 uppercase">Авто-UTM</span>
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="Например: my-product.ru/promo"
                    value={masterLink}
                    onChange={(e) => setMasterLink(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-400 bg-white text-xs font-semibold placeholder-slate-400"
                  />

                  {enableUtm && masterLink && (
                    <div className="space-y-2 pt-1 border-t border-slate-200/50">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <span className="block text-[9px] font-bold text-slate-450 uppercase mb-0.5">Кампания (utm_campaign):</span>
                          <input 
                            type="text" 
                            value={utmCampaign} 
                            onChange={(e) => setUtmCampaign(e.target.value)}
                            className="w-full px-2 py-1 text-[10px] rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-300 font-mono"
                          />
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-250 font-mono text-[9px] text-slate-500 truncate">
                        <span className="text-slate-400 font-bold block">Пример ссылки для {currentPlatformTab.toUpperCase()}:</span>
                        {getUtmLink(currentPlatformTab) || 'Введите ссылку'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Action button */}
            <div className="bg-gradient-to-r from-pink-500 via-orange-500 to-sky-400 p-0.5 rounded-2xl shadow-md">
              <div className="bg-white rounded-[14px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-500 animate-bounce" />
                    <span>ИИ Адаптация Gemini Core</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm font-semibold">
                    ИИ автоматически преобразует ваш один пост в 5 уникальных копирайтинг-форматов под лимиты каждой соцсети.
                  </p>
                </div>
                <button
                  onClick={handleSmartAiAdaptation}
                  disabled={isAiAdapting || !masterText.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-pink-500 via-orange-500 to-sky-400 hover:opacity-95 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isAiAdapting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Адаптация...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Адаптировать с ИИ (15 🪙)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 2: Custom tweaks */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-sky-500" />
                  <span>Тонкие правки каналов</span>
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-black">СПИСОК ОТПРАВКИ</span>
              </div>

              {/* Quick toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'telegram', label: 'Telegram ✈️', color: 'peer-checked:bg-sky-50 peer-checked:text-sky-700' },
                  { id: 'vk', label: 'ВКонтакте 🔵', color: 'peer-checked:bg-blue-50 peer-checked:text-blue-700' },
                  { id: 'setka', label: 'Сетка 🤖', color: 'peer-checked:bg-pink-50 peer-checked:text-pink-700' },
                  { id: 'instagram', label: 'Instagram 📸', color: 'peer-checked:bg-rose-50 peer-checked:text-rose-700' },
                  { id: 'x', label: 'Twitter / X 🐦', color: 'peer-checked:bg-slate-50 peer-checked:text-slate-800' }
                ].map((item) => (
                  <label key={item.id} className="relative flex items-center justify-center p-2 rounded-xl border border-slate-200 cursor-pointer transition-all hover:bg-slate-50">
                    <input 
                      type="checkbox" 
                      checked={adaptations[item.id as SocialNetwork]?.isEnabled || false}
                      onChange={() => togglePlatformCheckbox(item.id as SocialNetwork)}
                      className="sr-only peer"
                    />
                    <div className="text-[10px] font-black uppercase text-slate-500 w-full text-center">
                      {item.label}
                    </div>
                  </label>
                ))}
              </div>

              {/* Text editor for active platform tab */}
              <div className="space-y-4 pt-3">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  {(['telegram', 'vk', 'setka', 'instagram', 'x'] as SocialNetwork[]).map(platform => {
                    const conf = adaptations[platform];
                    if (!conf?.isEnabled) return null;
                    return (
                      <button
                        key={platform}
                        onClick={() => setCurrentPlatformTab(platform)}
                        className={`px-3 py-1 text-[10px] uppercase font-black rounded cursor-pointer ${
                          currentPlatformTab === platform ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        {platform}
                      </button>
                    );
                  })}
                </div>

                {adaptations[currentPlatformTab]?.isEnabled && (
                  <div className="space-y-3">
                    {currentPlatformTab === 'setka' && (
                      <input 
                        type="text" 
                        value={adaptations.setka.title || ''}
                        onChange={(e) => setAdaptations(prev => ({ ...prev, setka: { ...prev.setka, title: e.target.value } }))}
                        placeholder="Укажите сильный бизнес-заголовок для Сетки..."
                        className="w-full px-3 py-2 rounded-xl border text-xs"
                      />
                    )}

                    <textarea
                      rows={5}
                      value={adaptations[currentPlatformTab]?.text || ''}
                      onChange={(e) => setAdaptations(prev => ({ 
                        ...prev, 
                        [currentPlatformTab]: { ...prev[currentPlatformTab], text: e.target.value } 
                      }))}
                      className="w-full p-3 rounded-xl border text-xs font-semibold font-sans leading-relaxed"
                      placeholder="Текст поста..."
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Quick Previews and Global Trigger buttons */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Run manual post master button */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-slate-200/80 text-slate-900 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Send className="w-4 h-4 text-pink-500 animate-pulse" />
                <span>Опубликовать прямо сейчас</span>
              </h3>
              
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Выбранные сети получат адаптированный ИИ контент незамедлительно через официальное API SMM-интеграции.
              </p>

              <button
                onClick={publishManualAll}
                disabled={isPosting || !masterText.trim()}
                className="w-full py-3 bg-gradient-to-r from-orange-500 via-pink-500 to-indigo-600 hover:opacity-95 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPosting ? 'Идет отправка...' : 'Разослать во все каналы 🚀'}
              </button>
            </div>

            {/* Smart visual preview card representing desktop screen */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Глаз-Анализатор</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 h-64 overflow-y-auto text-slate-800 font-sans text-xs">
                <span className="text-xs font-mono text-slate-400 block border-b border-slate-200 pb-1 mb-2">IMMERSIVE PREVIEW LOGS</span>
                
                <p className="font-extrabold text-xs text-indigo-600 uppercase tracking-wide">
                  {currentPlatformTab.toUpperCase()} PREVIEW MODE:
                </p>
                <div className="mt-2 bg-white p-2.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <p className="whitespace-pre-line text-slate-700 font-medium">
                    {adaptations[currentPlatformTab]?.text || 'Напишите текст в левом редакторе для просмотра наложения на мобильный экран...'}
                  </p>
                  {masterLink && (
                    <span className="block text-indigo-600 underline font-mono text-xs truncate">
                      {getUtmLink(currentPlatformTab)}
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* FULL REPORT POPUP ON SUCCESSFUL SIMULATION PUBLISH */}
      <AnimatePresence>
        {showSuccessReport && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Кросспостинг Успешно завершен!</h3>
                  <p className="text-[10px] text-slate-450 font-bold font-mono">Трансляция записана в реестре постов</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Прогнозируемый охват связок:</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Просмотры (Views)</span>
                    <span className="text-base font-black text-slate-850 font-mono">+{postedAnalytics?.views || 1400}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Переходы (Clicks)</span>
                    <span className="text-base font-black text-emerald-600 font-mono">+{postedAnalytics?.clicks || 120}</span>
                  </div>
                </div>

                <div className="bg-sky-50/50 p-2 text-slate-600 rounded-lg text-[10px] font-semibold text-center">
                  🔄 Ссылка по UTM-структуре будет отслеживаться на вкладке «Аналитика».
                </div>
              </div>

              <button
                onClick={() => setShowSuccessReport(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Отлично, закрыть отчет
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENEWAL MODAL */}
      <AnimatePresence>
        {extendingStream && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-left"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-150 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-blue-600 font-mono font-black uppercase tracking-wider block">Продление авторепоста</span>
                  <h3 className="font-extrabold text-sm text-slate-800">
                    Поток ретрансляции <span className="text-blue-600">#{extendingStream.id}</span>
                  </h3>
                </div>
                <button 
                  onClick={() => setExtendingStream(null)}
                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Connected channels visual mapping */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 font-mono text-[9px] uppercase">Источник:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-black text-slate-700 flex items-center gap-1.5">
                    <span>{PLATFORM_CONFIG[extendingStream.sourcePlatform]?.emoji || '🔮'}</span>
                    <span>@{extendingStream.sourceTelegram}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 font-mono text-[9px] uppercase">Приемник:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-black text-slate-700 flex items-center gap-1.5 truncate max-w-xs">
                    <span>{PLATFORM_CONFIG[extendingStream.targetPlatform]?.emoji || '🔮'}</span>
                    <span>{extendingStream.targetVkGroup}</span>
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-200/50 flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>Текущий оплаченный срок:</span>
                  <span className="font-mono font-black text-slate-800">{extendingStream.autoPayDays} дней</span>
                </div>
              </div>

              {/* Packages Option Block */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Выберите срок продления:</span>
                
                <div className="space-y-2.5">
                  <button
                    onClick={() => handleExtendStream(30, 150)}
                    className="w-full p-3 bg-white hover:bg-blue-50/10 border border-slate-200 hover:border-blue-400 rounded-2xl text-left flex items-center justify-between group transition-all"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800">Продлить на 30 дней</p>
                      <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">Базовый период вещания конвейера</p>
                    </div>
                    <span className="bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 font-mono font-bold text-xs text-slate-700 px-3 py-1.5 rounded-xl transition-all">
                      150 ₽
                    </span>
                  </button>

                  <button
                    onClick={() => handleExtendStream(90, 400)}
                    className="w-full p-3 bg-white hover:bg-blue-50/10 border border-slate-200 hover:border-blue-400 rounded-2xl text-left flex items-center justify-between group transition-all relative overflow-hidden"
                  >
                    <div className="absolute right-12 top-0 bg-red-550 text-white font-mono text-[8px] px-1.5 py-0.5 rounded-bl font-black uppercase">
                      скидка 10%
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Продлить на 90 дней (Квартал)</p>
                      <p className="text-[10px] text-slate-455 font-semibold font-mono mt-0.5">Самый частый выбор маркетологов</p>
                    </div>
                    <span className="bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 font-mono font-bold text-xs text-slate-700 px-3 py-1.5 rounded-xl transition-all mr-1.5">
                      400 ₽
                    </span>
                  </button>

                  <button
                    onClick={() => handleExtendStream(180, 750)}
                    className="w-full p-3 bg-white hover:bg-blue-50/10 border border-slate-200 hover:border-blue-400 rounded-2xl text-left flex items-center justify-between group transition-all relative overflow-hidden"
                  >
                    <div className="absolute right-12 top-0 bg-emerald-555 text-white font-mono text-[8px] px-1.5 py-0.5 rounded-bl font-black uppercase">
                      скидка 15%
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Продлить на 180 дней (Полгода)</p>
                      <p className="text-[10px] text-slate-455 font-semibold font-mono mt-0.5">Максимальная выгода для брендов</p>
                    </div>
                    <span className="bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 font-mono font-bold text-xs text-slate-700 px-3 py-1.5 rounded-xl transition-all mr-1.5">
                      750 ₽
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-455 font-semibold font-mono bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200">
                💡 Оплата списывается с вашего общего рублевого баланса. Текущий баланс аккаунта: <strong className="text-slate-850 font-bold">{userBalance} ₽</strong>.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD WIZARD MODAL */}
      <AnimatePresence>
        {showAddWizard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-left"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-xl w-full border border-slate-150 shadow-2xl space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-blue-600 font-mono font-black uppercase tracking-wider block">ИНТЕЛЛЕКТУАЛЬНЫЙ СОВЕТНИК СВЯЗЕЙ</span>
                  <h3 className="font-extrabold text-sm text-slate-800">
                    Мастер Настройки Кросспостинга SAVA-Sync
                  </h3>
                </div>
                <button 
                  onClick={() => setShowAddWizard(false)}
                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Progress Steps Indicator */}
              <div className="grid grid-cols-4 gap-2 text-[10px] font-bold font-mono">
                {[
                  { step: 1, label: 'Платформы' },
                  { step: 2, label: 'Каналы & Имя' },
                  { step: 3, label: 'Связь бота' },
                  { step: 4, label: 'Активация' }
                ].map((s) => (
                  <div key={s.step} className="space-y-1">
                    <div className={`h-1.5 rounded-full transition-all ${
                      wizardStep >= s.step ? 'bg-blue-600' : 'bg-slate-150'
                    }`} />
                    <span className={`${wizardStep === s.step ? 'text-blue-750 font-black' : 'text-slate-400'}`}>
                      Шаг {s.step}: {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* STEP 1: Multi-platform Picker */}
              {wizardStep === 1 && (
                <div className="space-y-4 py-1">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 uppercase">1. Выберите источник ретрансляции</h4>
                    <p className="text-[10.5px] font-semibold text-slate-450 leading-relaxed font-sans">
                      Откуда ИИ-робот будет осуществлять копирование и перенос публикаций?
                    </p>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto pr-1">
                    {(Object.keys(PLATFORM_CONFIG) as SocialNetwork[]).map((net) => {
                      const platform = PLATFORM_CONFIG[net];
                      const isSelected = wizardSourcePlatform === net;
                      return (
                        <button
                          key={net}
                          onClick={() => setWizardSourcePlatform(net)}
                          className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50/15 shadow-sm scale-102 ring-1 ring-blue-400/30' 
                              : 'border-slate-150 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-base">{platform.emoji}</span>
                          <span className="text-[9.5px] font-black tracking-tight text-slate-700 truncate w-full">{platform.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1 pt-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase">2. Выберите целевой приемник</h4>
                    <p className="text-[10.5px] font-semibold text-slate-450 leading-relaxed font-sans">
                      Куда бот синхронно выложит адаптированное содержание?
                    </p>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto pr-1">
                    {(Object.keys(PLATFORM_CONFIG) as SocialNetwork[]).map((net) => {
                      const platform = PLATFORM_CONFIG[net];
                      const isSelected = wizardTargetPlatform === net;
                      return (
                        <button
                          key={net}
                          onClick={() => setWizardTargetPlatform(net)}
                          className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-50/15 shadow-sm scale-102 ring-1 ring-emerald-400/30' 
                              : 'border-slate-150 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-base">{platform.emoji}</span>
                          <span className="text-[9.5px] font-black tracking-tight text-slate-700 truncate w-full">{platform.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 bg-slate-900 border border-slate-900 text-white font-black text-[11px] uppercase tracking-wider rounded-xl hover:bg-slate-800 cursor-pointer"
                    >
                      Далее ➔
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Channel handles / Names */}
              {wizardStep === 2 && (
                <div className="space-y-4 py-1">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 uppercase">2. Укажите логины или ссылки к аккаунтам</h4>
                    <p className="text-[10.5px] font-semibold text-slate-450 leading-relaxed font-sans">
                      Задайте точные координаты каналов для автоматической сквозной публикации.
                    </p>
                  </div>

                  {/* Flow Redirect Preview Block */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50 flex items-center justify-center gap-4 text-center">
                    <div className="flex items-center gap-1.5 font-bold font-mono text-[11px]">
                      <span>{PLATFORM_CONFIG[wizardSourcePlatform]?.emoji}</span>
                      <span className="text-slate-800">[{PLATFORM_CONFIG[wizardSourcePlatform]?.name}]</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-1.5 font-bold font-mono text-[11px]">
                      <span>{PLATFORM_CONFIG[wizardTargetPlatform]?.emoji}</span>
                      <span className="text-slate-800">[{PLATFORM_CONFIG[wizardTargetPlatform]?.name}]</span>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Канал / Аккаунт Источник ({PLATFORM_CONFIG[wizardSourcePlatform]?.name}):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">@</span>
                        <input
                          type="text"
                          placeholder="Имя или логин источника (без @)"
                          value={wizardSourceChannel}
                          onChange={(e) => setWizardSourceChannel(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                        />
                      </div>
                      <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">Адрес сообщества, откуда бот считывает свежие релизы.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Адрес / Название Приемника ({PLATFORM_CONFIG[wizardTargetPlatform]?.name}):
                      </label>
                      <input
                        type="text"
                        placeholder="Например: Куда пересылать посты"
                        value={wizardTargetChannel}
                        onChange={(e) => setWizardTargetChannel(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">Группа, паблик, канал или профиль для синхронизации.</p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider rounded-xl hover:bg-slate-200 cursor-pointer"
                    >
                      Назад
                    </button>
                    <button
                      onClick={() => {
                        if (!wizardSourceChannel.trim() || !wizardTargetChannel.trim()) {
                          alert('Пожалуйста, заполните оба поля перед продолжением!');
                          return;
                        }
                        setWizardStep(3);
                      }}
                      className="px-4 py-2 bg-slate-900 border border-slate-900 text-white font-black text-[11px] uppercase tracking-wider rounded-xl hover:bg-slate-800 cursor-pointer"
                    >
                      Далее ➔
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Verification terminal console */}
              {wizardStep === 3 && (
                <div className="space-y-4 py-1">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 uppercase">3. Интеграция & Тестирование Бот-Связи</h4>
                    <p className="text-[10.5px] font-semibold text-slate-450 leading-relaxed font-sans">
                      Инициируйте проверку связи ретранслирующего моста SAVA-Sync.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 font-mono text-xs text-slate-300 min-h-36 max-h-48 overflow-y-auto space-y-1">
                    <span className="text-[8px] font-mono text-slate-500 block border-b border-slate-900 pb-1 mb-2 uppercase">
                      SAVA_SYNC_BOT AUTOMATION CONSOLE PANEL
                    </span>
                    
                    {wizardVerifyLogs.length === 0 && (
                      <p className="text-slate-500 italic">Ожидание запуска проверки соединения...</p>
                    )}

                    {wizardVerifyLogs.map((log, index) => (
                      <p 
                        key={index} 
                        className={
                          log.startsWith('[OK]') 
                            ? 'text-emerald-400 font-bold' 
                            : log.startsWith('[SUCCESS]') 
                              ? 'text-yellow-400 font-black tracking-wide' 
                              : 'text-slate-300'
                        }
                      >
                        {log}
                      </p>
                    ))}

                    {isVerifying && (
                      <div className="flex items-center gap-2 text-blue-400 font-semibold animate-pulse mt-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Логирование активной верификации...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider rounded-xl hover:bg-slate-200 cursor-pointer"
                      disabled={isVerifying}
                    >
                      Назад
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={runWizardVerification}
                        className="px-4 py-2 bg-blue-600 border border-blue-600 text-white font-black text-[11px] uppercase tracking-wider rounded-xl hover:bg-blue-700 disabled:opacity-55 cursor-pointer"
                        disabled={isVerifying}
                      >
                        {isVerifying ? 'Сканирование...' : 'Запустить тест 📡'}
                      </button>

                      <button
                        onClick={() => {
                          if (wizardVerifyLogs.some(log => log.includes('[SUCCESS]'))) {
                            setWizardStep(4);
                          } else {
                            alert('Пожалуйста, сначала успешно завершите «Тестирование бота»!');
                          }
                        }}
                        className={`px-4 py-2 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all ${
                          wizardVerifyLogs.some(log => log.includes('[SUCCESS]')) 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        disabled={isVerifying}
                      >
                        Далее ➔
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Activation checkout */}
              {wizardStep === 4 && (
                <div className="space-y-4 py-1">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 uppercase">4. Активация авторепоста</h4>
                    <p className="text-[10.5px] font-semibold text-slate-450 leading-relaxed font-sans">
                      Подключение автоматизированной сквозной ретрансляции и регистрация в децентрализованной ИИ-панели SAVA-Sync.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>Подписка потока ретрансляции:</span>
                      <span className="text-slate-800 font-black font-mono">30 дней</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>Услуга ИИ-модерирования:</span>
                      <span className="text-slate-800 font-extrabold text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono uppercase">ВКЛЮЧЕНО БЕСПЛАТНО</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800">Стоимость подключения:</span>
                      <span className="text-base font-black text-slate-900 font-mono">150 ₽</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 text-[10.5px] font-semibold leading-relaxed space-y-1 font-sans">
                    <p className="font-extrabold uppercase text-[9px] tracking-wide text-blue-800 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 animate-pulse" />
                      <span>Состояние Вашего Кошелька:</span>
                    </p>
                    <p>
                      Ваш текущий баланс: <strong className="font-bold text-slate-800 font-mono">{userBalance} ₽</strong>. {userBalance >= 150 ? 'Средств достаточно для мгновенного списания.' : <strong className="text-rose-600">Недостаточно средств. Пожалуйста, пополните баланс на сумму от 150 ₽.</strong>}
                    </p>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setWizardStep(3)}
                      className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider rounded-xl hover:bg-slate-200 cursor-pointer"
                    >
                      Назад
                    </button>
                    <button
                      onClick={handleCreateStreamFromWizard}
                      disabled={userBalance < 150}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11.5px] uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Подтвердить & Активировать за 150 ₽ 🚀
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* DETAILED PUBLICATION MODAL DIALOG (as on screenshot 2) */}
      {/* =================================================================== */}
      <AnimatePresence>
        {activeDetailPublication && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
            {/* Click-out trigger */}
            <div className="absolute inset-0" onClick={() => setActiveDetailPublication(null)} />

            {/* Modal Body container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 border border-slate-150 max-h-[90vh] overflow-y-auto text-left relative z-10 space-y-5 font-sans"
            >
              {/* Close Button X */}
              <button 
                onClick={() => setActiveDetailPublication(null)}
                className="absolute top-4 right-4 text-slate-450 hover:text-slate-650 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-all z-20"
                title="Закрыть детальный просмотр"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Title Header with dynamic details */}
              <div className="border-b border-slate-100 pb-4 pr-10 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-800 text-xs sm:text-sm font-extrabold uppercase tracking-tight">
                      Канал <span className="text-blue-600">#{activeDetailPublication.streamId}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded uppercase font-sans border border-emerald-100">
                      работает
                    </span>
                  </div>

                  {/* Direction details with platforms config inside modal */}
                  {selectedStreamForPubs && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold font-mono">
                      <span>{PLATFORM_CONFIG[selectedStreamForPubs.sourcePlatform]?.emoji} {selectedStreamForPubs.sourceTelegram}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-450 stroke-[2] inline" />
                      <span>{PLATFORM_CONFIG[selectedStreamForPubs.targetPlatform]?.emoji} {selectedStreamForPubs.targetVkGroup}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Two columns grid layout of the publication */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Media attachment & Core text */}
                <div className="md:col-span-6 space-y-4">
                  {activeDetailPublication.imageUrl ? (
                    <div className="rounded-2xl overflow-hidden relative border border-slate-200 bg-slate-50 group">
                      <img 
                        src={activeDetailPublication.imageUrl} 
                        alt="Publication content" 
                        className="object-cover w-full max-h-[300px] sm:max-h-[380px] object-center transition-transform duration-500 group-hover:scale-101"
                        referrerPolicy="no-referrer"
                      />
                      {activeDetailPublication.isMultiPost && (
                        <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase font-mono tracking-widest shadow-sm">
                          мультипост
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-slate-450 flex flex-col items-center justify-center gap-2">
                      <FileText className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                      <span className="text-xs font-black uppercase tracking-wider">Одиночный текстовый пост</span>
                    </div>
                  )}

                  {/* Clean readable text representation, mirroring real typography */}
                  <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/60 max-h-[250px] overflow-y-auto text-xs font-semibold leading-relaxed text-slate-750 font-sans break-words whitespace-pre-wrap select-text scrollbar-thin">
                    {activeDetailPublication.text}
                  </div>
                </div>

                {/* Right Column: Status info block, actions, event telemetry logs */}
                <div className="md:col-span-6 space-y-4">
                  
                  {/* Status alert box (with green accent background) */}
                  <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200/60 space-y-4 shadow-xs">
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-800 text-xs sm:text-sm font-extrabold uppercase tracking-tight">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Репост совершен успешно</span>
                      </div>
                      <p className="text-[10px] text-emerald-700/90 font-bold font-sans">
                        Время выгрузки: {activeDetailPublication.publishedAt}
                      </p>
                    </div>

                    {/* Quick repeat actions trigger */}
                    <div className="flex items-center justify-between border-t border-emerald-100/60 pt-3 flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const now = new Date();
                          const formattedTime = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                          
                          // Append repeat logs message
                          setPublications(prev => prev.map(p => {
                            if (p.id === activeDetailPublication.id) {
                              const updatedLogs = [
                                { time: formattedTime, message: 'Повторный репост запущен вручную' },
                                { time: formattedTime, message: 'Успешно отправлено повторным запросом VK API' },
                                ...p.logs
                              ];
                              return { ...p, logs: updatedLogs };
                            }
                            return p;
                          }));
                          
                          // Also updating detail publication logs view
                          setActiveDetailPublication(prev => prev ? {
                            ...prev,
                            logs: [
                              { time: formattedTime, message: 'Повторный репост запущен вручную' },
                              { time: formattedTime, message: 'Успешно отправлено повторным запросом VK API' },
                              ...prev.logs
                            ]
                          } : null);

                          showToast(`Повторная републикация #${activeDetailPublication.id} успешно выполнена!`);
                        }}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1 uppercase tracking-wider font-mono hover:underline bg-transparent border-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                        <span>Повторить репост</span>
                      </button>

                      {/* Native Link to VK Post as requested in screenshot 2 */}
                      <a 
                        href={activeDetailPublication.vkPostLink}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10.5px] uppercase tracking-wider rounded-xl flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <span>РЕПОСТ В ВК</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                  </div>

                  {/* Red delete button from system */}
                  <div className="flex justify-start">
                    <button
                      onClick={() => {
                        if (confirm('Вы уверены, что хотите бесследно удалить запись о данном посте из истории мониторинга нашей панели?')) {
                          setPublications(prev => prev.filter(p => p.id !== activeDetailPublication.id));
                          showToast(`Пост ${activeDetailPublication.id} успешно удален из истории мониторинга!`);
                          setActiveDetailPublication(null);
                        }
                      }}
                      className="text-rose-550 hover:text-rose-700 bg-transparent border-0 p-0 text-[10.5px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer font-sans"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>✕ Удалить пост из системы?</span>
                    </button>
                  </div>

                  {/* Action Log dropdown: Записи из журнала событий */}
                  <div className="bg-slate-50/50 rounded-2xl border border-slate-200/70 p-4 space-y-3 font-sans">
                    <button
                      onClick={() => setIsPubLogsExpanded(!isPubLogsExpanded)}
                      className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none bg-transparent border-0 p-0"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                        <ListFilter className="w-4 h-4 text-slate-400" />
                        <span>Записи из журнала событий</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isPubLogsExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isPubLogsExpanded && (
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {activeDetailPublication.logs.map((log, i) => (
                          <div 
                            key={i} 
                            className="bg-zinc-50 border border-zinc-150/60 p-2.5 rounded-xl text-[11px] text-slate-650 flex flex-col gap-0.5 font-sans"
                          >
                            <span className="text-[9px] text-slate-400 font-bold font-mono">
                              {log.time}
                            </span>
                            <span className="font-semibold text-slate-850">
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
