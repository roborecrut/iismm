import React, { useState, useEffect } from 'react';
import { SocialChannel, SocialNetwork } from '../types';
import { 
  Plus, Check, AlertTriangle, ShieldCheck, ArrowRight, Sparkles, CreditCard, 
  ExternalLink, HelpCircle, ArrowLeft, Settings, Trash2, Activity, Wifi, 
  Sparkle, ShieldAlert, Bot, Sliders, CheckCircle2, RefreshCw, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SocialIcon from './SocialIcon';

interface ChannelListProps {
  channels: SocialChannel[];
  onAddChannel: (channel: Omit<SocialChannel, 'id' | 'subscribers' | 'isPremium' | 'status'>) => boolean | string;
  onRemoveChannel: (id: string) => void;
  tariff: 'free' | 'pro' | 'vip';
  userBalance: number;
  onBuySlot: (slotsCount: number) => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

const NETWORK_LABELS: Record<SocialNetwork, { name: string; icon: string; bg: string; text: string }> = {
  telegram: { name: 'Telegram', icon: '✈️', bg: 'bg-sky-500/10 hover:bg-sky-500/20', text: 'text-sky-600' },
  vk: { name: 'ВКонтакте', icon: '🔵', bg: 'bg-blue-600/10 hover:bg-blue-600/20', text: 'text-blue-600' },
  max: { name: 'Max (Social)', icon: 'Ⓜ️', bg: 'bg-indigo-600/10 hover:bg-indigo-600/20', text: 'text-indigo-600' },
  instagram: { name: 'Instagram', icon: '📸', bg: 'bg-pink-600/10 hover:bg-pink-600/20', text: 'text-pink-600' },
  facebook: { name: 'Facebook', icon: '🔷', bg: 'bg-blue-700/10 hover:bg-blue-700/20', text: 'text-blue-700' },
  pinterest: { name: 'Pinterest', icon: '📌', bg: 'bg-red-600/10 hover:bg-red-600/20', text: 'text-red-600' },
  linkedin: { name: 'LinkedIn', icon: '💼', bg: 'bg-sky-700/10 hover:bg-sky-700/20', text: 'text-sky-700' },
  discord: { name: 'Discord', icon: '👾', bg: 'bg-indigo-500/10 hover:bg-indigo-500/20', text: 'text-indigo-500' },
  x: { name: 'X (Twitter)', icon: '🐦', bg: 'bg-slate-900/10 hover:bg-slate-900/20', text: 'text-slate-900' },
  ok: { name: 'Одноклассники', icon: '🟠', bg: 'bg-orange-500/10 hover:bg-orange-500/20', text: 'text-orange-500' },
  tenchat: { name: 'TenChat', icon: '🔴', bg: 'bg-red-500/10 hover:bg-red-500/20', text: 'text-red-500' },
  dzen: { name: 'Яндекс.Дзен', icon: '☯️', bg: 'bg-amber-600/10 hover:bg-amber-600/20', text: 'text-amber-700' },
  setka: { name: 'Сетка', icon: '🕸️', bg: 'bg-sky-600/10 hover:bg-sky-600/20', text: 'text-sky-700' },
  tiktok: { name: 'TikTok', icon: '🎵', bg: 'bg-black/10 hover:bg-black/20', text: 'text-slate-800' }
};

export default function ChannelList({ 
  channels, 
  onAddChannel, 
  onRemoveChannel, 
  tariff, 
  userBalance,
  onBuySlot,
  currentPath = '/channels',
  onNavigate
}: ChannelListProps) {
  const [platform, setPlatform] = useState<SocialNetwork>('telegram');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('Бизнес/Маркетинг');
  const [errorMsg, setErrorMsg] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'plan' | 'pay' | 'success'>('plan');
  const [slotsToBuy, setSlotsToBuy] = useState(1);
  
  // Simulated Card Info
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Interactive SMM simulator configurations
  const [connectionStepLoading, setConnectionStepLoading] = useState<number | null>(null);
  const [connectionSuccessAlert, setConnectionSuccessAlert] = useState(false);

  // Custom Settings Toggles inside Channel Details View
  const [commentsFilterEnabled, setCommentsFilterEnabled] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkText, setWatermarkText] = useState('@iismm');
  const [hashtagAiSuggest, setHashtagAiSuggest] = useState(true);
  const [customSignature, setCustomSignature] = useState('⚡ Публикация заряжена ИИ-Маркетологом ИИSMM');
  const [postQueueAlert, setPostQueueAlert] = useState(false);
  const [isAutoPosting, setIsAutoPosting] = useState(true);
  const [newChannelRole, setNewChannelRole] = useState<'own' | 'donor'>('own');
  
  // Donor specific settings state
  const [donorAutoRewrite, setDonorAutoRewrite] = useState(true);
  const [donorCheckInterval, setDonorCheckInterval] = useState('15m');
  const [donorStopWords, setDonorStopWords] = useState('реклама, промокод, розыгрыш, скидка, акция, подпишись');
  const [donorSuccessAlert, setDonorSuccessAlert] = useState<string | null>(null);

  // Channel verification state
  const [verifyingChannelId, setVerifyingChannelId] = useState<string | null>(null);

  const handleVerifyChannel = async (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    setVerifyingChannelId(channelId);
    try {
      const res = await fetch(`/api/channels/${channelId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || '🎉 Канал проверен! Бот найден и активен.');
        window.dispatchEvent(new Event('popstate'));
      } else {
        alert(`⚠️ ${data.error || 'Бот не найден в канале. Назначьте бота @IIrkiBot администратором и попробуйте снова.'}`);
        window.dispatchEvent(new Event('popstate'));
      }
    } catch (err: any) {
      alert(`Ошибка проверки: ${err.message || 'Сбой сети'}`);
    } finally {
      setVerifyingChannelId(null);
    }
  };

  const freeLimit = 3;
  const isOverLimit = channels.length >= freeLimit && tariff === 'free';

  // Routing Parsers
  const pathPart = currentPath ? currentPath.replace('/channels', '') : '';
  const platformName = pathPart.startsWith('/') ? pathPart.substring(1) : '';
  const isPlatformConnection = (Object.keys(NETWORK_LABELS) as string[]).includes(platformName);

  // Locate matched channel by ID
  let matchedChannel: SocialChannel | undefined = undefined;
  if (pathPart.startsWith('/')) {
    const channelParam = pathPart.substring(1);
    matchedChannel = channels.find(c => {
      if (c.id === channelParam) return true;
      // Match by replacing prefix 'ch-' or 'id'
      const cleanId = c.id.replace('ch-', '');
      const cleanParam = channelParam.replace('id', '').replace('ch-', '');
      return cleanId === cleanParam;
    });
  }

  // Routing Handler
  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState(null, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Sync state if routing changes
  useEffect(() => {
    if (isPlatformConnection) {
      setPlatform(platformName as SocialNetwork);
      // Clean custom messages when navigating
      setConnectionStepLoading(null);
      setConnectionSuccessAlert(false);
      setErrorMsg('');
    }
  }, [currentPath, platformName, isPlatformConnection]);

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      setErrorMsg('Пожалуйста, введите название и ссылку/username канала');
      return;
    }

    if (isOverLimit) {
      setErrorMsg('У вас исчерпан лимит бесплатных каналов (максимум 3). Купите дополнительный слот или Premium подписку!');
      setShowCheckoutModal(true);
      return;
    }

    const cleanUsername = username.startsWith('@') ? username : `@${username}`;

    // Cute connection loading simulation!
    setConnectionStepLoading(1);
    
    setTimeout(() => {
      setConnectionStepLoading(2);
      setTimeout(() => {
        setConnectionStepLoading(3);
        setTimeout(() => {
          const result = onAddChannel({
            name,
            username: cleanUsername,
            platform,
            category,
            role: newChannelRole
          });

          if (typeof result === 'string') {
            setErrorMsg(result);
            setConnectionStepLoading(null);
          } else {
            setName('');
            setUsername('');
            setErrorMsg('');
            setConnectionStepLoading(null);
            setConnectionSuccessAlert(true);
            setTimeout(() => {
              setConnectionSuccessAlert(false);
              handleNavigate('/channels');
            }, 1800);
          }
        }, 800);
      }, 700);
    }, 600);
  };

  const getChannelPath = (channel: SocialChannel) => {
    const cleanId = channel.id.replace('ch-', '');
    return `/channels/id${cleanId}`;
  };

  const executeBuySlot = () => {
    setCheckoutStep('pay');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBuySlot(slotsToBuy);
    setCheckoutStep('success');
  };

  // Dedicated Platform Instructional content mapping
  const PLATFORM_MANUALS: Record<SocialNetwork, { title: string; steps: string[]; warning?: string }> = {
    telegram: {
      title: 'Интеграция Telegram-канала / Группы',
      steps: [
        'Найдите бота контроля @IIrkiBot в поиске Telegram.',
        'Добавьте бота в ваш канал или группу в качестве Администратора.',
        'Разрешите боту права на «Публикацию постов» (Post Messages) и «Изменение информации».',
        'Введите юзернейм канала (начинающийся с @) или скопируйте числовой ID ниже.'
      ],
      warning: 'Бот не собирает данные ваших пользователей. Все права шифруются через Telegram BOT API.'
    },
    vk: {
      title: 'Интеграция паблика ВКонтакте',
      steps: [
        'Перейдите в меню вашего Сообщества → Настройки → Работа с API.',
        'Создайте новый «Ключ доступа» сообщества.',
        'Отметьте галочками права: Wall (Записи на стене), Photos/Docs (Загрузка медиа постов).',
        'Вставьте полученный Access Token в поле ссылки / ID источника ниже.'
      ],
      warning: 'Это позволяет комбайну ИИSMM моментально доставлять посты на стену сообщества ВК.'
    },
    instagram: {
      title: 'Интеграция профессионального Instagram',
      steps: [
        'Проверьте, что ваш Instagram переведен в статус Бизнес / Автора.',
        'Свяжите Instagram с публичной бизнес-страницей Facebook.',
        'Введите юзернейм вашей страницы ниже — ИИ-модерация сделает сопоставление.',
        'Подтвердите разрешение API при первой плановой публикации комбайна.'
      ],
      warning: 'Ограничения платформы Meta требуют наличие профессионального аккаунта.'
    },
    x: {
      title: 'Интеграция X (Twitter) канала',
      steps: [
        'Пропишите юзернейм вашего микроблога в поле ввода ниже.',
        'Авторизация и рукопожатие серверов ИИSMM пройдет в фоновом режиме.',
        'Все отложенные посты будут автоматически размечаться вашими персональными хэштегами.'
      ]
    },
    tiktok: {
      title: 'Подключение TikTok для видео-постинга',
      steps: [
        'Укажите ссылку на ваш TikTok канал/профиль (@username).',
        'Видео, сгенерированные ИИ-моделями в разделе «Посты», будут напрямую отправляться в черновики вашего TikTok аккаунта.'
      ]
    },
    facebook: {
      title: 'Подключение Facebook Бизнес Страницы',
      steps: [
        'Создайте или откройте Facebook Page (Страницу бренда).',
        'Введите системный URL страницы или её буквенный адрес.',
        'ИИSMM подключит прямую доставку постов.'
      ]
    },
    pinterest: {
      title: 'Интеграция досок Pinterest',
      steps: [
        'Укажите вашу доску Pinterest во втором поле ввода.',
        'Комбайн будет публиковать вертикальные карточки (Пины) с автогенерацией описания по формуле AIDA.'
      ]
    },
    linkedin: {
      title: 'Интеграция LinkedIn Профиля / Организации',
      steps: [
        'Пропишите URL вашей LinkedIn страницы.',
        'Посты будут публиковаться в деловой стилистике с адаптацией текста ИИ-куратором ИИSMM.'
      ]
    },
    discord: {
      title: 'Подключение Discord Сервера',
      steps: [
        'Создайте Webhook в настройках вашего текстового канала в Discord.',
        'Вставьте полный URL вебхука в поле ввода адреса ниже.',
        'Каждая публикация будет сопровождаться эмбед-карточками с вашим брендингом.'
      ]
    },
    ok: {
      title: 'Интеграция группы в Одноклассниках',
      steps: [
        'Зайдите в настройки группы → Настройки разработчика API.',
        'Вставьте токен или адрес группы ниже — ИИ-боты синхронизируют посты за 1 секунду.'
      ]
    },
    tenchat: {
      title: 'Подключение вашего блога TenChat',
      steps: [
        'Скопируйте ссылку на ваш профиль в приложении TenChat.',
        'Введите ссылку ниже и выберите подходящую тематику публикаций.'
      ]
    },
    dzen: {
      title: 'Подключение Яндекс.Дзен в 3 простых клика',
      steps: [
        'Откройте вашу Яндекс.Дзен Студию управления.',
        'Добавьте адрес вебхука: https://iismm.ru/webhook/channel в настройках интеграции.',
        'Отправьте команду /connect {username} нашему боту в Дзен Console — готово!'
      ]
    },
    setka: {
      title: 'Синхронизация с платформой Сетка (Setka)',
      steps: [
        'Откройте персональные настройки вашего пространства в Сетке.',
        'Интегрируйте вебхук автоматизации ИИSMM.',
        'Пропишите юзернейм пространства/паблика в форме добавления ниже.'
      ]
    },
    max: {
      title: 'Подключение источника Max (Social Network)',
      steps: [
        'Введите адрес вашего аккаунта внутри децентрализованной сети Max.',
        'ИИSMM выполнит безопасное сквозное шифрование для автоматических публикаций.'
      ]
    }
  };

  // View 1: Detailed Single Channel Dashboard Page
  if (matchedChannel) {
    const isDonor = matchedChannel.role === 'donor';
    const info = NETWORK_LABELS[matchedChannel.platform] || { name: matchedChannel.platform, icon: '🔗', bg: 'bg-slate-100', text: 'text-slate-600' };
    
    // Simulate some stats based on channel subscribers
    const parsedSubs = matchedChannel.subscribers;
    const avgViews = Math.round(parsedSubs * 0.42);
    const engagementRate = '58.4%';
    const ctrValue = '14.2%';

    const handleSimulateTestPost = () => {
      setPostQueueAlert(true);
      setTimeout(() => {
        setPostQueueAlert(false);
      }, 5000);
    };

    if (isDonor) {
      const simulatedDonorFeed = [
        {
          id: 'df-1',
          time: '12 минут назад',
          text: `🔥 Разбор: Какими будут SMM-бюджеты во второй половине 2026 года? Спойлер — закупку рекламы полностью доверяют нейронным сетям. Лид-магниты уходят на второй план, в лидерах — персонализированные интерактивные воронки.`,
          status: 'new'
        },
        {
          id: 'df-2',
          time: '3 часа назад',
          text: `⚡️ Инструкция: Как набрать первые 5000 подписчиков в авторский телеграм-канал без вложений. Кросспостинг, комментинг от имени канала и виральный контент рулят.`,
          status: 'scraped'
        },
        {
          id: 'df-3',
          time: 'Вчера, 14:20',
          text: `Завтра проведем прямой эфир со всеми экспертами SMM о правильной маркировке рекламы. Ссылки на трансляцию будут в чате пакета! Скидка по промокоду PROMO77.`,
          status: 'ignored'
        }
      ];

      return (
        <div className="space-y-6">
          {/* Header breadcrumb */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => handleNavigate('/channels')}
              className="px-3.5 py-2 inline-flex items-center gap-2 text-xs font-black text-slate-800 bg-white/70 hover:bg-white border border-slate-200/50 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer font-sans"
            >
              <ArrowLeft className="w-4 h-4 text-pink-500" />
              <span>Вернуться к каналам</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
              <span>Донор:</span>
              <code className="bg-orange-55 text-orange-950 px-2.5 py-0.5 rounded font-mono text-xs font-bold border border-orange-200 uppercase">АКТИВНЫЙ МОНИТОРИНГ</code>
            </div>
          </div>

          {/* Main header block for donor */}
          <div className="p-5 rounded-3xl bg-amber-50/70 border border-orange-200/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 p-[1.5px] shadow-xs flex items-center justify-center">
                <div className="w-full h-full rounded-[13px] bg-white flex items-center justify-center text-xl font-bold text-orange-600">
                  📥
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 leading-tight">{matchedChannel.name}</h2>
                  <span className="text-[10px] bg-orange-100 text-orange-850 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Канал-Донор</span>
                </div>
                <p className="text-xs font-mono text-slate-500 flex items-center gap-1">
                  <span>{matchedChannel.username}</span>
                  <span className="text-slate-350">•</span>
                  <span className="text-[10px] uppercase font-bold text-orange-550">{NETWORK_LABELS[matchedChannel.platform]?.name}</span>
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">ИИ-парсер активен • {donorCheckInterval === '5m' ? 'каждые 5м (VIP)' : `каждые ${donorCheckInterval}`}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onRemoveChannel(matchedChannel!.id);
                  handleNavigate('/channels');
                }}
                className="px-4 py-2 bg-red-50 text-red-650 hover:bg-red-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-red-150"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Прекратить слежение</span>
              </button>
            </div>
          </div>

          {/* Donor stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
              <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Подписчики донора</div>
              <div className="text-lg font-black text-slate-900 font-mono">{matchedChannel.subscribers.toLocaleString()}</div>
              <span className="text-[9.5px] text-slate-500 font-semibold block">Внешняя аудитория</span>
            </div>
            
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
              <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Спарсено постов</div>
              <div className="text-lg font-black text-slate-900 font-mono font-bold">142 постов</div>
              <span className="text-[9.5px] text-emerald-600 font-bold block">▲ +12 за сегодня</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
              <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">ИИ Авто-рерайты</div>
              <div className="text-lg font-black text-slate-900 font-mono font-bold">{donorAutoRewrite ? "Включено" : "Выключено"}</div>
              <span className="text-[9.5px] text-slate-500 block font-semibold">Черновик обновляется</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
              <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Лимит сканирования</div>
              <div className="text-lg font-black text-slate-900 font-mono font-bold">Безлимитно</div>
              <span className="text-[9.5px] text-orange-600 font-bold block">Premium уровень</span>
            </div>
          </div>

          {/* Grid: Donor Settings & Activity Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
            
            {/* Left Col: Donor Crawler controls */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-orange-400" />
                  <span>Панель краулинга донора</span>
                </h3>
                <span className="text-[9px] bg-orange-100 text-orange-850 px-2 py-0.5 rounded-full font-black font-mono">CRAWLER v2.8</span>
              </div>

              <div className="space-y-4">
                
                {/* Auto rewrite option */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/50 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 text-left">
                      <span className="font-extrabold text-xs text-slate-800 block">Мгновенный ИИ-Авторерайт</span>
                      <span className="text-[10px] text-slate-450 font-bold block">Автоматически переписывать спарсенные посты</span>
                    </div>
                    <button 
                      onClick={() => setDonorAutoRewrite(!donorAutoRewrite)}
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${donorAutoRewrite ? 'bg-orange-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${donorAutoRewrite ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal font-semibold">
                    ИИSMM перепишет каждый найденный авторский пост донора уникальным слогом, сохраняя смысл, и поместит его в ваши Черновики.
                  </p>
                </div>

                {/* Updates check frequency dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">Частота сканирования донора:</label>
                  <select
                    value={donorCheckInterval}
                    onChange={(e) => setDonorCheckInterval(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 bg-slate-50 text-slate-700 font-bold"
                  >
                    <option value="5m">⚡ Каждые 5 минут (SuperVIP)</option>
                    <option value="15m">⏳ Каждые 15 минут (Стандарт)</option>
                    <option value="30m">📅 Каждые 30 минут</option>
                    <option value="2h">⌚ Каждые 2 часа</option>
                    <option value="24h">🌙 Раз в сутки</option>
                  </select>
                </div>

                {/* Stop words exclusion list */}
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">Фильтр стоп-слов (Анти-Реклама):</label>
                  <textarea
                    rows={2}
                    value={donorStopWords}
                    onChange={(e) => setDonorStopWords(e.target.value)}
                    className="w-full p-2.5 text-xs text-slate-700 bg-slate-50 focus:outline-none rounded-xl border border-slate-200 font-mono font-bold"
                    placeholder="Например: реклама, промокод, купить, ссылка..."
                  />
                  <p className="text-[9.5px] text-slate-400 italic font-semibold">Посты донора, содержащие эти слова, будут автоматически проигнорированы.</p>
                </div>

              </div>

              <div className="pt-2 border-t flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDonorSuccessAlert("Настройки мониторинга донора успешно сохранены!");
                    setTimeout(() => setDonorSuccessAlert(null), 3500);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-orange-450 to-pink-500 hover:opacity-95 text-white text-xs font-black rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  Сохранить настройки
                </button>
              </div>

              {donorSuccessAlert && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-lg bg-emerald-50 text-emerald-850 text-[11px] font-bold text-center border border-emerald-100 w-full"
                >
                  ✓ {donorSuccessAlert}
                </motion.div>
              )}
            </div>

            {/* Right Col: Activity Graph or Visual */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span>Активность публикаций донора</span>
                </h3>
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Парсинг 7д</span>
              </div>

              <div className="h-44 w-full relative flex items-end pt-3">
                <svg className="w-full h-full" viewBox="0 0 400 130">
                  <defs>
                    <linearGradient id="donorBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb923c"/>
                      <stop offset="100%" stopColor="#f472b6"/>
                    </linearGradient>
                  </defs>
                  
                  <line x1="10" y1="15" x2="390" y2="15" stroke="#f8fafc" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="10" y1="50" x2="390" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="10" y1="85" x2="390" y2="85" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="10" y1="120" x2="390" y2="120" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Horizontal bars */}
                  {[
                    { day: 'Пн', val: 5, h: 90 },
                    { day: 'Вт', val: 3, h: 54 },
                    { day: 'Ср', val: 6, h: 108 },
                    { day: 'Чт', val: 2, h: 36 },
                    { day: 'Пт', val: 4, h: 72 },
                    { day: 'Сб', val: 1, h: 18 },
                    { day: 'Вс', val: 3, h: 54 }
                  ].map((bar, bidx) => {
                    const barWidth = 24;
                    const xCoord = 40 + bidx * 50;
                    return (
                      <g key={bidx}>
                        <rect x={xCoord} y="15" width={barWidth} height="105" rx="4" className="fill-slate-50" />
                        <rect x={xCoord} y={120 - bar.h} width={barWidth} height={bar.h} rx="4" fill="url(#donorBarGradient)" className="transition-all hover:brightness-105 cursor-pointer" />
                        <text x={xCoord + barWidth / 2} y={120 - bar.h - 4} className="text-[8px] fill-slate-500 font-bold font-mono" textAnchor="middle">{bar.val} п</text>
                        <text x={xCoord + barWidth / 2} y="129" className="text-[9px] fill-slate-400 font-extrabold uppercase" textAnchor="middle">{bar.day}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <p className="text-[10px] text-slate-400 font-semibold italic mt-2 text-center text-slate-450 border-t pt-2.5">
                ИИSMM регистрирует в среднем 3.4 поста в день в исходном канале донора. Все материалы успешно фильтруются.
              </p>
            </div>

          </div>

          {/* Section 5: Feed / Scraped Posts List */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4 text-left">
            <div className="flex border-b pb-2.5 items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm uppercase text-slate-800 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-orange-400" />
                  <span>Последние спарсенные посты донора за 24ч</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold font-medium">Экспериментируйте с авто-рерайтом, копируйте в черновики или отправляйте прямо в редактор</p>
              </div>
              <span className="text-[9px] font-black uppercase text-slate-450 bg-slate-100 px-2 py-0.5 rounded">Потоковый парсинг</span>
            </div>

            <div className="space-y-3.5">
              {simulatedDonorFeed.map((post) => (
                <div key={post.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/40 hover:bg-slate-50 duration-150 relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-black font-mono text-slate-400 uppercase tracking-widest">{post.time}</span>
                    
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      post.status === 'new' 
                        ? 'bg-emerald-55 text-emerald-800' 
                        : post.status === 'scraped' 
                        ? 'bg-sky-55 text-sky-800'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {post.status === 'new' ? '💎 Новый' : post.status === 'scraped' ? '✓ Спарсен/Рерайт готов' : '✕ Пропущен (Реклама)'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-705 leading-relaxed font-semibold whitespace-pre-wrap">
                    {post.text}
                  </p>

                  <div className="pt-2 border-t border-dashed border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          sessionStorage.setItem('iismm_editor_source', post.text);
                          handleNavigate(`/posts/rewright`);
                        }}
                        className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100/80 text-pink-700 rounded-lg text-[10.5px] font-black uppercase tracking-tight duration-150 cursor-pointer flex items-center gap-1 border border-pink-150"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>✨ В ИИ-Рерайтер</span>
                      </button>

                      <button
                        onClick={() => {
                          sessionStorage.setItem('iismm_editor_source', post.text);
                          handleNavigate(`/posts/redactor`);
                        }}
                        className="px-3 py-1.5 bg-slate-105 hover:bg-slate-150 text-slate-705 rounded-lg text-[10.5px] font-black uppercase tracking-tight duration-150 cursor-pointer flex items-center gap-1 border border-slate-200"
                      >
                        <Settings className="w-3.5 h-3.5 animate-spin duration-3000" />
                        <span>✍️ В Редактор</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setDonorSuccessAlert(`Пост успешно склонирован в ваши локальные черновики!`);
                        setTimeout(() => setDonorSuccessAlert(null), 3500);
                      }}
                      className="px-2.5 py-1.5 text-[10px] uppercase font-black text-slate-500 hover:text-slate-800 duration-150 cursor-pointer"
                    >
                      Сохранить черновиком
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => handleNavigate('/channels')}
            className="px-3.5 py-2 inline-flex items-center gap-2 text-xs font-black text-slate-800 bg-white/70 hover:bg-white border border-slate-200/50 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer font-sans"
          >
            <ArrowLeft className="w-4 h-4 text-pink-500" />
            <span>Вернуться к каналам</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <span>Путь:</span>
            <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-purple-600 font-semibold">{currentPath}</code>
          </div>
        </div>

        {/* Channel Main Header Card */}
        <div className="p-5 rounded-3xl iirky-card-block flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c)] p-[1.5px] shadow-sm flex items-center justify-center`}>
              <div className="w-full h-full rounded-[13px] bg-white flex items-center justify-center text-xl font-bold text-slate-800">
                {matchedChannel.name.charAt(0)}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 leading-tight">{matchedChannel.name}</h2>
                {matchedChannel.isPremium && <Sparkles className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />}
              </div>
              <p className="text-xs font-mono text-slate-500 flex items-center gap-1">
                <span>{matchedChannel.username}</span>
                <span className="text-slate-350">•</span>
                <span className="text-[10px] uppercase font-bold text-purple-500">{NETWORK_LABELS[matchedChannel.platform]?.name}</span>
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold text-slate-600 uppercase">Связь с ботом: Стабильна (14ms)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRemoveChannel(matchedChannel!.id);
                handleNavigate('/channels');
              }}
              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-red-150"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Отключить канал</span>
            </button>
          </div>
        </div>

        {/* Custom Live Channels Stats Widgets Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-white/80 border border-white/50 rounded-2xl shadow-2xs space-y-1">
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Подписчики</div>
            <div className="text-xl font-black text-slate-800 font-mono">{parsedSubs.toLocaleString()}</div>
            <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span>▲ +145 за неделю</span>
            </div>
          </div>
          
          <div className="p-4 bg-white/80 border border-white/50 rounded-2xl shadow-2xs space-y-1">
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Охват поста</div>
            <div className="text-xl font-black text-slate-800 font-mono">{avgViews.toLocaleString()}</div>
            <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span>▲ +5.2% ER рост</span>
            </div>
          </div>

          <div className="p-4 bg-white/80 border border-white/50 rounded-2xl shadow-2xs space-y-1">
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Рейтинг ER</div>
            <div className="text-xl font-black text-slate-800 font-mono">{engagementRate}</div>
            <div className="text-[9px] text-slate-400 font-medium">Выше среднего по категории</div>
          </div>

          <div className="p-4 bg-white/80 border border-white/50 rounded-2xl shadow-2xs space-y-1">
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Средний CTR</div>
            <div className="text-xl font-black text-slate-800 font-mono">{ctrValue}</div>
            <div className="text-[9px] text-sky-600 font-bold">Выдающийся показатель!</div>
          </div>
        </div>

        {/* Bespoke Interactive SVG Dashboard Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Audience line Area Chart */}
          <div className="bg-white/85 rounded-3xl p-5 border border-white/50 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-sky-500" />
                <span>Динамика роста подписчиков</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">7 дней</span>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="h-44 w-full relative flex items-end">
              <svg className="w-full h-full" viewBox="0 0 400 150">
                <defs>
                  <linearGradient id="glowAndArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45"/>
                    <stop offset="100%" stopColor="#f472b6" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Grid horizontal lines */}
                <line x1="10" y1="20" x2="390" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="10" y1="60" x2="390" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="10" y1="100" x2="390" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="10" y1="140" x2="390" y2="140" stroke="#e2e8f0" strokeWidth="1" />

                {/* Subtitle scale markers */}
                <text x="350" y="15" className="text-[8px] fill-slate-400 font-black" textAnchor="middle">+{Math.round(parsedSubs + 500)}</text>
                <text x="350" y="55" className="text-[8px] fill-slate-400 font-black" textAnchor="middle">+{parsedSubs}</text>
                <text x="350" y="95" className="text-[8px] fill-slate-400 font-black" textAnchor="middle">+{Math.round(parsedSubs - 400)}</text>

                {/* Simulated Growth Area Path */}
                <path 
                  d="M 10 120 Q 70 100 130 90 T 250 50 T 390 30 L 390 140 L 10 140 Z" 
                  fill="url(#glowAndArea)" 
                />
                {/* Glowing Outline Curve */}
                <path 
                  d="M 10 120 Q 70 100 130 90 T 250 50 T 390 30" 
                  fill="none" 
                  stroke="url(#glowAreaCurve)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="glowAreaCurve" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#38bdf8"/>
                    <stop offset="50%" stopColor="#f472b6"/>
                    <stop offset="100%" stopColor="#fb923c"/>
                  </linearGradient>
                </defs>

                {/* Interactive dots representing days */}
                <circle cx="10" cy="120" r="4" className="fill-white stroke-sky-450 stroke-2" />
                <circle cx="70" cy="108" r="4" className="fill-white stroke-sky-450 stroke-2" />
                <circle cx="130" cy="90" r="4" className="fill-white stroke-pink-500 stroke-2" />
                <circle cx="250" cy="50" r="4" className="fill-white stroke-orange-450 stroke-2" />
                <circle cx="390" cy="30" r="5" className="fill-white stroke-pink-500 stroke-3 animate-ping" />
                <circle cx="390" cy="30" r="4.5" className="fill-pink-500 stroke-white stroke-1" />
              </svg>
            </div>
            
            {/* Days list label underneath */}
            <div className="flex justify-between text-[10px] text-slate-400 font-bold px-2 font-sans uppercase">
              <span>Пн</span>
              <span>Вт</span>
              <span>Ср</span>
              <span>Чт</span>
              <span>Пт</span>
              <span>Сб</span>
              <span>Вс (ИИ-Пик)</span>
            </div>
          </div>

          {/* Chart 2: Column views chart */}
          <div className="bg-white/85 rounded-3xl p-5 border border-white/50 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-pink-500" />
                <span>Просмотры недавних постов</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">ИИ Постинг</span>
            </div>

            {/* Custom SVG Bar Column Chart */}
            <div className="h-44 w-full relative flex items-end">
              <svg className="w-full h-full" viewBox="0 0 400 150">
                {/* Horizontal guide lines */}
                <line x1="20" y1="130" x2="380" y2="130" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="20" y1="90" x2="380" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="20" y1="50" x2="380" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="20" y1="10" x2="380" y2="10" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

                {/* Render cols with brand text widgets */}
                {[
                  { x: 30, h: 50, val: '380 v', cl: 'url(#barColorGlow)' },
                  { x: 80, h: 90, val: '840 v', cl: 'url(#barColorGlow)' },
                  { x: 130, h: 65, val: '510 v', cl: 'url(#barColorGlow)' },
                  { x: 180, h: 110, val: '1.2k v', cl: 'url(#barColorGlow)' },
                  { x: 230, h: 40, val: '290 v', cl: 'url(#barColorGlow)' },
                  { x: 280, h: 100, val: '950 v', cl: 'url(#barColorGlow)' },
                  { x: 330, h: 125, val: '1.6k v', cl: 'url(#barColorRainbow)' }
                ].map((bar, bidx) => (
                  <g key={bidx}>
                    {/* Background grey slot for depth representation */}
                    <rect x={bar.x} y="15" width="22" height="115" rx="5" className="fill-slate-50/70" />
                    {/* Active bar */}
                    <rect x={bar.x} y={130 - bar.h} width="22" height={bar.h} rx="5" fill={bar.cl} className="transition-all hover:brightness-105 duration-200 cursor-pointer" />
                    {/* Text values */}
                    <text x={bar.x + 11} y={130 - bar.h - 5} className="text-[7.5px] fill-slate-500 font-bold font-mono" textAnchor="middle">{bar.val}</text>
                  </g>
                ))}
                
                <defs>
                  <linearGradient id="barColorGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8"/>
                    <stop offset="100%" stopColor="#f472b6"/>
                  </linearGradient>
                  <linearGradient id="barColorRainbow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb923c"/>
                    <stop offset="50%" stopColor="#f472b6"/>
                    <stop offset="100%" stopColor="#38bdf8"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Labels beneath columns */}
            <div className="flex justify-between text-[8px] text-slate-400 font-black px-4 font-mono uppercase tracking-tight">
              <span>Пост 1</span>
              <span>Пост 2</span>
              <span>Пост 3</span>
              <span>Пост 4</span>
              <span>Пост 5</span>
              <span>Пост 6</span>
              <span className="text-pink-500">Последний 🚀</span>
            </div>
          </div>
        </div>

        {/* Live interaction control list */}
        <div className="p-6 bg-white/80 border border-white/50 rounded-3xl shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-orange-400" />
              <span>Панель автоматизации канала</span>
            </h3>
            <span className="text-[9px] bg-pink-100/80 text-pink-700 px-2 py-0.5 rounded-full font-black uppercase font-mono shadow-3xs">Smart ИИSMM</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Auto Posting System */}
            <div className="p-4 rounded-2xl bg-white border border-slate-100 flex flex-col justify-between space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-xs text-slate-800 block">Разрешить Автопостинг</span>
                  <span className="text-[10px] text-slate-400 font-medium">Отправлять материалы по расписанию ИИ</span>
                </div>
                <button 
                  onClick={() => setIsAutoPosting(!isAutoPosting)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${isAutoPosting ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isAutoPosting ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal font-medium">Если выключить — посты для этой сети будут оставаться в черновиках до ручного пуска.</p>
            </div>

            {/* AI Comment Guard */}
            <div className="p-4 rounded-2xl bg-white border border-slate-100 flex flex-col justify-between space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-xs text-slate-800 block">ИИ-Фильтр комментариев</span>
                  <span className="text-[10px] text-slate-400 font-medium">Чистка спама, оскорблений и фишинга бота</span>
                </div>
                <button 
                  onClick={() => setCommentsFilterEnabled(!commentsFilterEnabled)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${commentsFilterEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${commentsFilterEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal font-medium">Использует нейрофиксацию для блокировки ссылок на нелегальные криптобиржи и спам-ботов в обсуждениях.</p>
            </div>

            {/* Photo Watermarking */}
            <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-xs text-slate-800 block">Водяной знак на Медиа</span>
                  <span className="text-[10px] text-slate-400 font-medium">Предотвращение кражи вашего уникального контента</span>
                </div>
                <button 
                  onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${watermarkEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${watermarkEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              
              {watermarkEnabled && (
                <div className="space-y-2 animate-fade-in pt-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Собственный текст знака:</span>
                  <input 
                    type="text" 
                    value={watermarkText} 
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-slate-50/70 font-semibold font-mono"
                    placeholder="@my_channel_name"
                  />
                  <div className="p-3.5 bg-slate-100 rounded-lg border border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden h-14 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80')" }}>
                    <div className="absolute inset-0 bg-black/25"></div>
                    <span className="text-[9px] font-bold text-white/50 border border-white/20 select-none z-10 rotate-12 uppercase tracking-widest">{watermarkText || '@iismm'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Global Post Signatures */}
            <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-3 shadow-2xs">
              <div>
                <span className="font-extrabold text-xs text-slate-800 block">Постоянная подпись к постам</span>
                <span className="text-[10px] text-slate-400 font-medium">Будет автоматически крепиться к каждому выводу</span>
              </div>
              
              <textarea 
                rows={2}
                value={customSignature}
                onChange={(e) => setCustomSignature(e.target.value)}
                className="w-full p-2.5 text-xs text-slate-700 bg-slate-50/70 focus:outline-none rounded-xl border border-slate-200 font-semibold"
                placeholder="Шаблон вашей подписи..."
              />
              <p className="text-[9px] text-slate-400 italic">Например: Ссылка на профиль, рекламные условия, теги.</p>
            </div>

          </div>

          {/* Test Post queue tool */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left space-y-0.5">
              <span className="text-xs font-bold text-slate-700 block">Инструмент отладки API</span>
              <span className="text-[10px] text-slate-400 font-medium block">Отправьте моментальный пинг-пост для тестирования работы интеграции.</span>
            </div>
            
            <button
              onClick={handleSimulateTestPost}
              className="px-4 py-2 bg-gradient-to-r from-orange-400 via-pink-500 to-sky-450 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-transform active:scale-97 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin duration-3000" />
              <span>Сделать тестовый пост в {NETWORK_LABELS[matchedChannel.platform]?.name}</span>
            </button>
          </div>

          {postQueueAlert && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-slate-800 text-xs font-semibold leading-relaxed"
            >
              🦄 <strong className="text-orange-950 font-extrabold">УСПЕХ:</strong> Пост-отладка отправлен в очередь на публикацию! Проверьте мессенджер через 5-8 секунд. Логи подтверждения будут записаны в глобальную ленту.
            </motion.div>
          )}

        </div>
      </div>
    );
  }

  // View 2: Platform Connection Instruction & ADD Page
  if (isPlatformConnection) {
    const netDetails = NETWORK_LABELS[platform] || { name: platform, icon: '🔗', bg: 'bg-slate-100', text: 'text-slate-650' };
    
    // Select manual instructions based on selected role
    const getManualForRole = () => {
      if (newChannelRole === 'donor') {
        return {
          title: `📥 Парсинг и слежение за донором в ${netDetails.name}`,
          steps: [
            `Найдите корректный публичный юзернейм или скопируйте ссылку на целевой канал-донор в сети ${netDetails.name}.`,
            'Укажите ссылку/юзернейм в поле ввода формы справа (например, @donor_channel или t.me/donor).',
            'ИИSMM подключит фоновый краулер, который каждые 15 минут сканирует публикации донора.',
            'Вы сможете использовать полученные посты в ручном режиме, отправлять их в ИИ-рерайтер или настроить автозапуск публикаций.'
          ],
          warning: 'Слежение безопасно и анонимно. Владельцы исходных ресурсов не увидят присутствие ИИ SMM-агента.'
        };
      }
      return PLATFORM_MANUALS[platform] || { 
        title: `📡 Подключение вашей страницы в ${netDetails.name}`, 
        steps: ['Получите права администратора', 'Введите ссылку на канал', 'Внедрите бота-постера'],
        warning: 'Убедитесь, что бот ИИSMM наделен правами на публикацию.'
      };
    };

    const manual = getManualForRole();

    return (
      <div className="space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => handleNavigate('/channels')}
            className="px-3.5 py-2 inline-flex items-center gap-2 text-xs font-black text-slate-800 bg-white/70 hover:bg-white border border-slate-200/50 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer font-sans"
          >
            <ArrowLeft className="w-4 h-4 text-pink-500" />
            <span>Вернуться к каналам</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <span>Канал в сети:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-450 to-pink-500 text-white select-none">
              {netDetails.name}
            </span>
          </div>
        </div>

        {/* Global Role selector before grid */}
        <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left space-y-0.5">
            <span className="text-xs font-black text-slate-850 uppercase block">Укажите тип подключения SMM:</span>
            <span className="text-[10px] text-slate-500 font-bold block">
              {newChannelRole === 'own' 
                ? 'Вы подключаете площадку, на которой вы являетесь админом (для автоматической публикации постов)'
                : 'Вы подключаете чужой паблик-донор (для парсинга, копирования и ИИ-рерайтинга контента)'}
            </span>
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex shrink-0 w-full sm:w-auto border border-slate-200/40">
            <button
              type="button"
              onClick={() => setNewChannelRole('own')}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                newChannelRole === 'own'
                  ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-xs'
                  : 'text-slate-655 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              📡 Свой канал (Публикация)
            </button>
            <button
              type="button"
              onClick={() => setNewChannelRole('donor')}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                newChannelRole === 'donor'
                  ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-xs'
                  : 'text-slate-655 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              📥 Канал-Донор (Парсинг)
            </button>
          </div>
        </div>

        {/* Instructions grid content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left instructions block */}
          <div className="lg:col-span-7 bg-white/95 rounded-3xl p-6 border border-white/50 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b pb-3">
              <span className="text-xl">{netDetails.icon}</span>
              <h3 className="font-extrabold text-base text-slate-800 tracking-tight">{manual.title}</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              {newChannelRole === 'own' 
                ? `Пожалуйста, внимательно следуйте перечисленной инструкции, чтобы настроить автоматическую отправку постов в ваш личный канал ${netDetails.name} через ИИSMM.`
                : `Инструкция по настройке парсинга и анонимного слежения за донорским сообществом в сети ${netDetails.name}:`}
            </p>

            {/* Checklist */}
            <div className="space-y-3.5">
              {manual.steps.map((step, sidx) => (
                <div key={sidx} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c)] p-[1px] flex items-center justify-center text-[10px] text-white font-black shrink-0 mt-0.5">
                    <span className="w-full h-full rounded-full bg-white flex items-center justify-center text-rose-500 font-black">{sidx + 1}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{step}</p>
                </div>
              ))}
            </div>

            {manual.warning && (
              <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-100 text-[10px] text-slate-500 leading-normal font-semibold flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-450 shrink-0 select-none mt-0.5" />
                <span>{manual.warning}</span>
              </div>
            )}

            {/* Bottom general notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-400 font-medium">
              🔔 Все токены API и ссылки шифруются алгоритмом AES-256. ИИSMM бережно транслирует контент в соответствии с лимитами скорости сети {netDetails.name}.
            </div>
          </div>

          {/* Right addition form block */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            <div className="bg-white rounded-3xl p-6 border border-white/55 shadow-sm space-y-5">
              <div className="border-b pb-2 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-pink-500" />
                <h4 className="font-black text-xs uppercase text-slate-800 tracking-wider">
                  {newChannelRole === 'own' ? 'Подключить Точку Публикации' : 'Подключить Источник-Донор'}
                </h4>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {connectionStepLoading !== null && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3 shadow-2xs items-center text-center">
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-pink-500 animate-spin"></div>
                    <span className="text-xs font-black text-pink-500 font-mono">TG</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      {connectionStepLoading === 1 && '1/3: Связываемся со шлюзом...'}
                      {connectionStepLoading === 2 && '2/3: Проверка бота в канале...'}
                      {connectionStepLoading === 3 && '3/3: Рукопожатие и авторизация...'}
                    </p>
                    <p className="text-[10px] text-slate-400">Силы ИИ сверяют права администрирования по токену.</p>
                  </div>
                </div>
              )}

              {connectionSuccessAlert && (
                <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex flex-col gap-2 shadow-2xs items-center text-center animate-fade-in">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-xs font-black text-emerald-950">КАНАЛ ПОДКЛЮЧЕН!</p>
                    <p className="text-[10px] text-emerald-600 font-semibold font-mono mt-0.5">Успешная регистрация в ИИSMM Комбайне.</p>
                  </div>
                </div>
              )}

              {connectionStepLoading === null && !connectionSuccessAlert && (
                <form onSubmit={handleCreateChannel} className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Название паблика / канала</label>
                    <input 
                      id="input-new-channel-name"
                      type="text"
                      required
                      placeholder="Напр. SMM Тренды"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-pink-450 focus:outline-none bg-slate-50 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Юзернейм ссылки / ID канала</label>
                    <input 
                      id="input-new-channel-username"
                      type="text"
                      required
                      placeholder="Напр. t.me/smm_trends или @trends"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-pink-450 focus:outline-none bg-slate-50 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Тематика сообщества</label>
                    <select 
                      id="select-new-channel-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-pink-450 focus:outline-none bg-slate-50 font-semibold text-xs"
                    >
                      <option value="Бизнес/Маркетинг">Бизнес / Маркетинг</option>
                      <option value="Юмор/Развлечения">Юмор / Развлечения</option>
                      <option value="Технологии/ИИ">Технологии / ИИ</option>
                      <option value="Спорт/Здоровье">Спорт / Здоровье</option>
                      <option value="Криптовалюта">Криптовалюта</option>
                      <option value="Дизайн/Учеба">Дизайн / Учеба</option>
                      <option value="Новостной">Новостной</option>
                    </select>
                  </div>

                  {/* Enforced Webhooks for custom platforms */}
                  {(platform === 'dzen' || platform === 'setka') && (
                    <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-100 text-xs text-slate-600 space-y-2">
                      <p className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                        <HelpCircle className="w-4 h-4 text-pink-500" /> Подключение через Вебхук:
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold whitespace-pre-wrap leading-relaxed">
                        Установите в настройках консоли вебхук: 
                        <code className="bg-white/80 p-1 rounded font-mono text-pink-600 tracking-tight font-black ml-1">https://iismm.ru/webhook</code>
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      id="btn-submit-add-channel"
                      type="submit"
                      className="w-full py-2.5 text-xs font-black text-rose-950 bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] rounded-xl border border-white hover:brightness-105 duration-200 shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <span>Добавить в комбайн</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-orange-50/70 border border-orange-100 rounded-3xl p-4 text-[10px] text-slate-500 font-semibold space-y-2 text-left">
              <span className="font-extrabold text-orange-950 block text-[11px] uppercase tracking-wide">💡 Быстрый совет ИИSMM</span>
              <p className="leading-relaxed">
                Если вы хотите проверить корректность работы автоматических публикаций, после завершения добавления перейдите в Кабинет Канала и кликните по кнопке <strong className="text-pink-600">«Сделать тестовый пост»</strong>. Бот пришлет пинг-сообщение!
              </p>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // View 3: STANDARD Channels Dashboard index view
  return (
    <div className="space-y-6">
      {/* Header and Tariff summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Подключенные каналы</h2>
          <p className="text-sm text-slate-500 mt-1 mt-0.5">
            Управляйте источниками публикации. Подключено: <span className="font-semibold text-slate-700">{channels.length}</span> из {" "}
            <span className="font-semibold text-slate-700">{tariff !== 'free' ? 'безлимита' : `${freeLimit}`}</span> (Бесплатно)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tariff === 'free' ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <span className="px-3 py-1.5 text-xs font-semibold bg-orange-100 text-orange-600 rounded-lg text-center font-bold">
                Тариф: Free (Лимит 3 канала)
              </span>
              <button 
                id="btn-upgrade-to-premium"
                onClick={() => {
                  setSlotsToBuy(1);
                  setCheckoutStep('plan');
                  setShowCheckoutModal(true);
                }}
                className="px-4 py-2 text-xs font-black text-slate-900 bg-gradient-to-r from-orange-100 to-pink-100 border border-white hover:opacity-95 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer justify-center"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                Расширить лимиты
              </button>
            </div>
          ) : (
            <span className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-orange-55 to-pink-55/80 text-orange-900 border border-orange-200/50 rounded-lg flex items-center gap-1.5 shadow-xs font-black">
              <ShieldCheck className="w-4 h-4 text-pink-500" /> Тариф: PREMIUM (Безлимитный SMM)
            </span>
          )}
        </div>
      </div>

      {/* Visual separation: Own Channels vs Donor Sources */}
      
      {/* SECTION 1: Own Pages (Where we publish) */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>📡 СВОИ КАНАЛЫ (КУДА ПУБЛИКУЕМ)</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black font-mono">
                {channels.filter(c => !c.role || c.role === 'own').length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-bold">
              Каналы, группы и паблики, где установлен наш бот-публикатор <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600 font-mono">@IIrkiBot</code>
            </p>
          </div>
          
          <button
            onClick={() => {
              setNewChannelRole('own');
              handleNavigate('/channels/telegram');
            }}
            className="px-3 py-1.5 text-[10px] font-black uppercase bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-150 transition-colors flex items-center gap-1 cursor-pointer w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Подключить свой канал</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.filter(c => !c.role || c.role === 'own').map((channel) => {
            const info = NETWORK_LABELS[channel.platform] || { name: channel.platform, icon: '🔗', bg: 'bg-slate-100', text: 'text-slate-600' };
            return (
              <motion.div 
                layout
                key={channel.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleNavigate(getChannelPath(channel))}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${info.bg} ${info.text}`}>
                      <SocialIcon platform={channel.platform} size={11} />
                      <span>{info.name}</span>
                    </span>
                    
                    <span className="text-[9px] font-black text-slate-400 group-hover:text-emerald-600 duration-150 uppercase tracking-wider font-sans">
                      кабинет канала →
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-base mt-3 flex items-center gap-1.5 leading-tight">
                    {channel.name} 
                    {channel.isPremium && <Sparkles className="w-4 h-4 text-orange-400 fill-orange-400" />}
                  </h3>
                  <p className="text-xs font-mono text-slate-450 mt-0.5">{channel.username}</p>
                  
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs border-t border-dashed border-slate-100 pt-2 text-slate-500">
                    <div>
                      <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Подписчики</span>
                      <span className="font-black text-slate-800 font-mono text-xs">{channel.subscribers.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Категория</span>
                      <span className="font-semibold text-slate-700 truncate block text-xs">{channel.category}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold" onClick={(e) => e.stopPropagation()}>
                  {channel.isActive !== false ? (
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Бот активен</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-600">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Неактивен</span>
                    </span>
                  )}

                  <button
                    onClick={(e) => handleVerifyChannel(e, channel.id)}
                    disabled={verifyingChannelId === channel.id}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded-lg border border-slate-200 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Проверить наличие Telegram-бота в канале"
                  >
                    <RefreshCw className={`w-3 h-3 text-pink-500 ${verifyingChannelId === channel.id ? 'animate-spin' : ''}`} />
                    <span>Обновить</span>
                  </button>
                </div>
              </motion.div>
            );
          })}

          <button 
            onClick={() => {
              setNewChannelRole('own');
              handleNavigate('/channels/telegram');
            }}
            className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-300 bg-white/40 hover:bg-emerald-50/20 text-slate-500 hover:text-emerald-700 flex flex-col items-center justify-center text-center transition-all cursor-pointer h-full min-h-[150px]"
          >
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full mb-1.5">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-black text-[11px] uppercase tracking-wider">Добавить точку публикации</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: Donors (Where we pull content from) */}
      <div className="space-y-3.5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-450 animate-pulse"></span>
              <span>📥 КАНАЛЫ-ДОНОРЫ (ОТКУДА БЕРЕМ)</span>
              <span className="bg-orange-55 text-orange-950 px-2 py-0.5 rounded-full text-[10px] font-black font-mono">
                {channels.filter(c => c.role === 'donor').length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-bold">
              Чужие или сторонние паблики, которые мы мониторим для парсинга постов и ИИ-рерайта
            </p>
          </div>
          
          <button
            onClick={() => {
              setNewChannelRole('donor');
              handleNavigate('/channels/telegram');
            }}
            className="px-3 py-1.5 text-[10px] font-black uppercase bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg border border-orange-150 transition-colors flex items-center gap-1 cursor-pointer w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить канал-донор</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.filter(c => c.role === 'donor').map((channel) => {
            const info = NETWORK_LABELS[channel.platform] || { name: channel.platform, icon: '🔗', bg: 'bg-slate-100', text: 'text-slate-600' };
            return (
              <motion.div 
                layout
                key={channel.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleNavigate(getChannelPath(channel))}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 bg-amber-50 text-amber-700">
                      <span>📥 Донор ({info.name})</span>
                    </span>
                    
                    <span className="text-[9px] font-black text-slate-400 group-hover:text-orange-600 duration-150 uppercase tracking-wider font-sans">
                      настройки донора →
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-base mt-3 flex items-center gap-1.5 leading-tight">
                    {channel.name} 
                    <span className="text-[9.5px] uppercase font-black bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded">ИИ-Слежение</span>
                  </h3>
                  <p className="text-xs font-mono text-slate-450 mt-0.5">{channel.username}</p>
                  
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs border-t border-dashed border-slate-100 pt-2 text-slate-500">
                    <div>
                      <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Аудитория</span>
                      <span className="font-black text-slate-800 font-mono text-xs">{channel.subscribers.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Парсинг постов</span>
                      <span className="font-bold text-slate-700 text-xs">Автоматический</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-650 font-bold">
                  <span className="flex items-center gap-1.5 text-orange-600">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                    <span>Сканирование...</span>
                  </span>
                  <span className="text-slate-400 italic font-medium text-[9px]">Каждые 15 минут</span>
                </div>
              </motion.div>
            );
          })}

          <button 
            onClick={() => {
              setNewChannelRole('donor');
              handleNavigate('/channels/telegram');
            }}
            className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-orange-300 bg-white/40 hover:bg-orange-50/20 text-slate-500 hover:text-orange-700 flex flex-col items-center justify-center text-center transition-all cursor-pointer h-full min-h-[150px]"
          >
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-full mb-1.5">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-black text-[11px] uppercase tracking-wider">Добавить донор-паблик</span>
          </button>
        </div>
      </div>


      {/* Grid of new sources and interactive connection */}
      <div className="p-6 bg-white/95 rounded-3xl border border-white/90 shadow-xs space-y-4">
        <div className="pb-2 border-b">
          <h3 className="font-extrabold text-sm text-slate-800 uppercase flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-pink-500" />
            <span>Подключение нового источника публикации</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Выберите платформу, чтобы открыть персональное руководство и активировать ИИ-постинг.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {(Object.keys(NETWORK_LABELS) as SocialNetwork[]).map((net) => {
            const items = NETWORK_LABELS[net];
            return (
              <button
                id={`btn-select-platform-${net}`}
                key={net}
                type="button"
                onClick={() => {
                  handleNavigate(`/channels/${net}`);
                }}
                className="p-3 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer text-white bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] opacity-92 hover:opacity-100 hover:scale-104 shadow-sm active:scale-98"
              >
                <SocialIcon platform={net} size={18} className="mb-1.5 !text-white !fill-white brightness-0 invert" />
                <span className="text-[10px] font-black tracking-tight truncate w-full text-white">{items.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-orange-100 via-pink-100 to-orange-50 border-b border-slate-200/50 p-5 text-slate-900 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
                  <h3 className="font-extrabold text-lg tracking-tight font-black">Расширение лимитов ИИSMM</h3>
                </div>
                <button 
                  id="btn-close-checkout-modal"
                  onClick={() => setShowCheckoutModal(false)}
                  className="text-slate-500 hover:text-slate-850 font-black text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Modal body based on Checkout State */}
              <div className="p-5 space-y-4">
                {checkoutStep === 'plan' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Бесплатный тариф позволяет держать до 3 подключенных каналов. Вы можете снять ограничение, добавив слоты или оформив Premium-подписку.
                    </p>

                    <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50">
                      <h4 className="font-bold text-slate-800 text-sm mb-1.5">Вариант 1: Дополнительные слоты</h4>
                      <p className="text-xs text-slate-500 mb-3">Каждый дополнительный канал будет стоить всего 150 ₽ разово!</p>
                      
                      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-xs font-semibold text-slate-600">Количество слотов:</span>
                        <div className="flex items-center gap-1.5">
                          <button 
                            id="btn-decrement-slots"
                            type="button" 
                            onClick={() => setSlotsToBuy(Math.max(1, slotsToBuy - 1))}
                            className="w-7 h-7 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-605 disabled:opacity-40 cursor-pointer"
                            disabled={slotsToBuy <= 1}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-slate-800">{slotsToBuy}</span>
                          <button 
                            id="btn-increment-slots"
                            type="button" 
                            onClick={() => setSlotsToBuy(slotsToBuy + 1)}
                            className="w-7 h-7 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-605 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3.5 flex justify-between items-center text-xs text-slate-705 font-bold">
                        <span>Итого к оплате:</span>
                        <span className="text-base text-orange-600">{slotsToBuy * 150} ₽</span>
                      </div>
                    </div>

                    <button 
                      id="btn-checkout-proceed-slots"
                      onClick={executeBuySlot}
                      className="w-full py-2.5 text-sm font-extrabold text-white bg-gradient-to-r from-orange-400 via-pink-500 to-sky-450 hover:opacity-95 border border-white/20 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Купить {slotsToBuy} {slotsToBuy === 1 ? 'слот' : 'слота'} за {slotsToBuy * 150} ₽</span>
                    </button>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink mx-3 text-xs text-slate-400 font-semibold uppercase">или</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <div className="p-4 rounded-xl border border-white bg-orange-50/70 text-center space-y-2 shadow-2xs">
                      <div className="font-extrabold text-slate-800 text-sm">🔥 Безлимитный Premium План</div>
                      <p className="text-xs text-slate-600 font-medium">Без ограничений на количество каналов, доступ к ИИ-рерайту, автогенерации и автовыбору хэштегов!</p>
                      <div className="text-lg font-black text-slate-900 font-mono">490 ₽ / месяц</div>
                      <button 
                        id="btn-checkout-premium-option"
                        onClick={() => {
                          setSlotsToBuy(5); // Simulate substantial premium slots or unlock
                          executeBuySlot();
                        }}
                        className="py-1.5 px-4 text-xs font-black text-rose-950 bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] border border-white hover:brightness-105 duration-200 rounded-lg shadow-2xs w-full cursor-pointer"
                      >
                        Подключить Premium за 490 ₽
                      </button>
                    </div>
                  </div>
                )}

                {checkoutStep === 'pay' && (
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Введите реквизиты оплаты (Симуляция)</h4>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Номер банковской карты</label>
                        <input 
                          id="input-card-number"
                          type="text"
                          required
                          maxLength={19}
                          placeholder="4276 3800 0056 4801"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-pink-400 focus:outline-none font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Срок действия</label>
                          <input 
                            id="input-card-expiry"
                            type="text"
                            required
                            maxLength={5}
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-pink-400 focus:outline-none font-mono text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">CVV код</label>
                          <input 
                            id="input-card-cvv"
                            type="password"
                            required
                            maxLength={3}
                            placeholder="***"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-pink-400 focus:outline-none font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-105 rounded-lg text-xs text-slate-500 text-center leading-relaxed">
                      🔒 Все операции проходят через сертифицированный шлюз и защищены 3D-Secure.
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button 
                        id="btn-checkout-back"
                        type="button" 
                        onClick={() => setCheckoutStep('plan')}
                        className="py-2.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg cursor-pointer text-center"
                      >
                        Назад
                      </button>
                      <button 
                        id="btn-submit-payment"
                        type="submit" 
                        className="py-2.5 text-xs text-white bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] border border-white font-black rounded-lg cursor-pointer shadow-2xs uppercase tracking-wider"
                      >
                        Оплатить
                      </button>
                    </div>
                  </form>
                )}

                {checkoutStep === 'success' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="inline-flex p-3.5 bg-emerald-50 text-emerald-600 rounded-full mb-1 border border-emerald-100">
                      <Check className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-lg">Успешная транзакция!</h4>
                      <p className="text-sm text-slate-500 mt-1 font-semibold">Ограничения успешно обновлены. Ваши слоты на ИИSMM добавлены в профиль.</p>
                    </div>
                    <button 
                      id="btn-close-checkout-success"
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setCheckoutStep('plan');
                        setErrorMsg('');
                      }}
                      className="inline-flex px-5 py-2.5 bg-gradient-to-r from-orange-100 to-pink-100/90 hover:opacity-95 text-orange-950 border border-orange-200 rounded-xl text-xs font-black shadow-2xs cursor-pointer align-center justify-center"
                    >
                      Начать постинг
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
