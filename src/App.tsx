import React, { useState, useEffect } from 'react';
import { 
  SocialChannel, CampaignPost, PromoBundle, AdListing, BulletinAd, UserAccount, SocialNetwork, AdOrder,
  DayRequest, PostTemplate, Settings, Stats, Publication, Prompt
} from './types';
import Sidebar from './components/Sidebar';
import BottomNavbar from './components/BottomNavbar';
import PostsPage from './pages/PostsPage';
import SocialPage from './pages/SocialPage';
import MarketPage from './pages/MarketPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import LandingPage from './pages/LandingPage';
import OfertaPage from './pages/OfertaPage';
import PublicTarifPayPage from './pages/PublicTarifPayPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailPage from './pages/PaymentFailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import Posts from './pages/Posts';
import Channels from './pages/Channels';
import AppleCalendarView from './pages/AppleCalendarView';
import GalleryView from './components/GalleryView';
import ScenariosPage from './components/ScenariosPage';

import LiquidGlassBackground from './components/LiquidGlassBackground';
import { useFileUpload } from './hooks/useFileUpload';
import { Sparkles, Play, ShieldCheck, Mail, MessageSquare, AlertTriangle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          start_param?: string;
          user?: {
            id: number;
            username?: string;
            first_name: string;
            last_name?: string;
            photo_url?: string;
          };
        };
        paymentStars?: number;
        ready: () => void;
        close: () => void;
        expand: () => void;
      };
    };
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('iismm_session_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('[Logout] Error clearing cache:', e);
    }
    setIsLoggedIn(false);
    changeRoute('/');
    alert('🚪 Вы успешно вышли из личного кабинета. Весь кэш сессии очищен!');
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Navigation Routing State (Browser Native Router)
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;

      const rawAppPaths = [
        '/dashboard', '/posts', '/channels', '/calendar', '/gallery', '/history', '/templates', '/scenarios', '/crosspost', '/settings',
        '/social', '/market', '/bundles', '/profile', '/tarif', '/tarif/pay', '/partner', '/teams', '/brand', '/api-keys', '/roundtable', '/enterprise', '/admin', '/system-admin', '/reset-password',
        '/payment/success', '/payment/fail', '/payment/robokassa/success', '/payment/robokassa/fail'
      ];

      const landingPaths = ['/', '/main', '/blog', '/ai', '/market-exchange', '/chat', '/prices', '/projects', '/academy', '/oferta', '/tarif/pay', '/reset-password', '/payment/success', '/payment/fail', '/payment/robokassa/success', '/payment/robokassa/fail'];

      const isAppPath = rawAppPaths.some(p => path === p || path.startsWith(p + '/') || (p === '/social' && path.startsWith('/social')));
      const isLandingPath = landingPaths.some(p => path === p || path.startsWith(p + '/'));

      if (path === '/' || path === '' || path === '/main') {
        setCurrentPath(path === '/main' ? '/main' : '/');
      } else if (isAppPath || isLandingPath) {
        setCurrentPath(path);
      } else {
        // Fallback for custom or unmatched paths
        window.history.replaceState(null, '', '/');
        setCurrentPath('/');
      }
    };

    // Listen to popstate for browser back/forward buttons
    window.addEventListener('popstate', handleLocationChange);
    
    // Initial sync
    handleLocationChange();

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [isLoggedIn]);

  const changeRoute = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  // 2. Core User Account State (starts on Tariff PRO for Admin Timoshenko Denis)
  const [user, setUser] = useState<UserAccount>({
    id: '16926299042',
    telegramId: 169262990,
    name: 'Тимошенко Денис',
    firstName: 'Денис',
    lastName: 'Тимошенко',
    telegramUsername: '@shishkarnem',
    email: 'shishkarnem@gmail.com',
    tariff: 'pro',
    tokens: 10000,
    iirky: 10000,
    telegramStars: 9999,
    avatarUrl: '/api/avatar/169262990.png',
    balanceRub: 100000,
    earningsRub: 500000,
    premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')
  });

  // TMA Automatic Registration Detector Hook of Telegram API
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      try {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        const initData = tg.initData;
        const tgUser = tg.initDataUnsafe?.user;
        const startParam = tg.initDataUnsafe?.start_param || new URLSearchParams(window.location.search).get('startapp') || new URLSearchParams(window.location.search).get('ref');
        
        if (initData) {
          fetch('/api/auth/telegram-twa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData, startParam })
          })
          .then(r => r.json())
          .then(data => {
            if (data.success && data.user) {
              const u = data.user;
              setUser({
                id: String(u.id),
                telegramId: u.telegramId,
                name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.telegramUsername || `User_${u.id}`,
                firstName: u.firstName || '',
                lastName: u.lastName || '',
                telegramUsername: u.telegramUsername ? (u.telegramUsername.startsWith('@') ? u.telegramUsername : `@${u.telegramUsername}`) : `@id${u.id}`,
                tariff: u.role === 'admin' ? 'vip' : 'pro',
                tokens: u.tokens || 100000,
                iirky: u.iirky || u.balance || 1000,
                telegramStars: 450,
                avatarUrl: u.photoUrl || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&auto=format&fit=crop&q=80',
                balanceRub: u.balanceRub || 0,
                earningsRub: u.earningsRub || 0,
                referralRewardBalance: u.referralRewardBalance || 0,
                premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')
              });
              setIsLoggedIn(true);
              console.log("[TWA Auth Success]", u);
            }
          })
          .catch(e => console.error("TWA backend auth error:", e));
        } else if (tgUser) {
          const namesStr = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Пользователь Telegram';
          setUser(prev => ({
            ...prev,
            id: String(tgUser.id),
            telegramId: tgUser.id,
            name: namesStr,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name || '',
            telegramUsername: tgUser.username ? `@${tgUser.username}` : `@id${tgUser.id}`,
            avatarUrl: tgUser.photo_url || prev.avatarUrl
          }));
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("TWA detection error:", err);
      }
    }
  }, []);

  // Fetch and sync Telegram photoUrl from database/Telegram API
  useEffect(() => {
    if (user.id || user.telegramId) {
      const query = new URLSearchParams();
      if (user.id) query.set('id', user.id);
      if (user.telegramId) query.set('telegramId', String(user.telegramId));

      fetch(`/api/users/me?${query.toString()}`, {
        headers: { 'x-user-id': user.id || '16926299042' }
      })
        .then(r => r.json())
        .then(data => {
          if (data && data.user) {
            const u = data.user;
            setUser(prev => ({
              ...prev,
              id: u.id || prev.id,
              telegramId: u.telegramId || prev.telegramId,
              avatarUrl: u.photoUrl || u.avatarUrl || prev.avatarUrl,
              name: u.name || prev.name,
              firstName: u.firstName || prev.firstName,
              lastName: u.lastName || prev.lastName,
              telegramUsername: u.telegramUsername ? (u.telegramUsername.startsWith('@') ? u.telegramUsername : `@${u.telegramUsername}`) : prev.telegramUsername
            }));
          }
        })
        .catch(err => console.error("Error syncing user me photo:", err));
    }
  }, [user.id, user.telegramId]);

  // Quick 1-click registration simulation for standard browsers
  const handleTelegramOneClickRegister = (customData?: Partial<UserAccount>) => {
    setUser({
      id: customData?.id || 'tg-' + Math.floor(Math.random() * 900000000 + 100000000),
      name: customData?.name || 'Михаил Регистратов',
      firstName: customData?.firstName || 'Михаил',
      lastName: customData?.lastName || 'Регистратов',
      telegramUsername: customData?.telegramUsername || '@mikhail_quick',
      tariff: 'start',
      tokens: 300,
      iirky: 300, // crediting 300 ИИрок automatically
      telegramStars: customData?.telegramStars || 450,
      avatarUrl: customData?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      balanceRub: 300,
      earningsRub: 0,
      premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')
    });
    setIsLoggedIn(true); // Sign in user instantly
    alert('⚡ Успешная авторизация в 1-клик через Telegram! Вам начислено 300 ИИрок по тарифу СТАРТ и безлимитный автопостинг.');
  };

  const { upload } = useFileUpload();
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await upload(file);
      if (url) {
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userAvatar: url, photoUrl: url, avatarUrl: url })
        }).catch(() => null);

        setUser(prev => ({
          ...prev,
          userAvatar: url,
          photoUrl: url,
          avatarUrl: url
        }));
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
    }
  };

  // --- TGSMM2 CORE ENTITY STATES ---
  const [dayRequests, setDayRequests] = useState<DayRequest[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [settings, setSettings] = useState<Settings>({
    botToken: '',
    protalkApiKey: '',
    systemRole: 'Прохор',
    cronSchedule: '*/15 * * * *',
    theme: 'dark'
  });
  const [stats, setStats] = useState<Stats>({
    totalPrompts: 0,
    publishedThisMonth: 0,
    activeChannelsCount: 0,
    recentPublications: []
  });
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activePromptForEdit, setActivePromptForEdit] = useState<{ dayOfWeek: string; title: string; content: string } | null>(null);

  // Sync selectedPostId with URL path e.g. /posts/req_s93cib7q
  useEffect(() => {
    if (currentPath.startsWith('/posts/')) {
      const sub = currentPath.replace('/posts/', '');
      const subtabs = ['channels', 'crosspost', 'redactor', 'autogenerator', 'rewright'];
      if (sub && !subtabs.includes(sub)) {
        setSelectedPostId(sub);
      } else {
        setSelectedPostId(null);
      }
    } else if (currentPath === '/posts') {
      setSelectedPostId(null);
    }
  }, [currentPath]);

  // Load all data from API
  const loadAllData = async () => {
    try {
      const activeUserId = user.id || '';
      const queryParam = activeUserId ? `?userId=${encodeURIComponent(activeUserId)}` : '';
      const reqHeaders: Record<string, string> = activeUserId ? { 'x-user-id': activeUserId } : {};

      const [drRes, pubRes, setRes, statRes, chRes, tplRes] = await Promise.all([
        fetch(`/api/day-requests${queryParam}`, { headers: reqHeaders }),
        fetch(`/api/publications${queryParam}`, { headers: reqHeaders }),
        fetch('/api/settings'),
        fetch('/api/stats'),
        fetch(`/api/channels${queryParam}`, { headers: reqHeaders }),
        fetch('/api/templates')
      ]);

      if (drRes.ok) setDayRequests(await drRes.json());
      if (pubRes.ok) setPublications(await pubRes.json());
      if (setRes.ok) setSettings(await setRes.json());
      if (statRes.ok) setStats(await statRes.json());
      if (chRes.ok) {
        const chData = await chRes.json();
        if (Array.isArray(chData)) {
          setChannels(chData);
        }
      }
      if (tplRes.ok) setTemplates(await tplRes.json());
    } catch (e) {
      console.error("Error loading data:", e);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user.id]);

  // Handlers for TGSMM2 CRUD
  const handleAddDayRequest = async (req: Partial<DayRequest>) => {
    try {
      const res = await fetch('/api/day-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...req, status: req.status || 'создается', userId: user.id })
      });
      if (res.ok) {
        const created = await res.json();
        await loadAllData();
        return created;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Ошибка при сохранении поста в базу данных');
      }
    } catch (e: any) {
      console.error('Error adding day request to DB:', e);
      throw e;
    }
  };

  const handleUpdateDayRequest = async (id: string, updated: Partial<DayRequest>) => {
    try {
      const res = await fetch(`/api/day-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) await loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDayRequest = async (id: string) => {
    try {
      const res = await fetch(`/api/day-requests/${id}`, { method: 'DELETE' });
      if (res.ok) await loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveDayRequest = async (req: Partial<DayRequest>) => {
    if (req.id) {
      await handleUpdateDayRequest(req.id, req);
    } else {
      await handleAddDayRequest(req);
    }
  };

  const handlePublishToTelegram = async (title: string, content: string, dayRequestId: string, formattingOptions?: any) => {
    const res = await fetch('/api/publications/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        dayRequestId,
        userId: user.id,
        ...formattingOptions
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка публикации');
    await loadAllData();
  };

  const handleSaveTemplate = async (template: { type: 'header' | 'postText' | 'signature' | 'full'; name: string; category?: string; content: string }) => {
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      await loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddChannelNew = async (ch: any) => {
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id || '169262990'
        },
        body: JSON.stringify({
          name: ch.name,
          username: ch.username,
          isActive: ch.isActive !== false,
          subscribersCount: ch.subscribersCount || 0,
          inviteLink: ch.inviteLink || '',
          description: ch.description || '',
          userId: user.id || '169262990'
        })
      });
      if (res.ok) {
        await loadAllData();
      }
    } catch (e) {
      console.error('Error adding channel to DB:', e);
    }
  };

  const handleUpdateChannelNew = async (id: string, updated: Partial<SocialChannel>) => {
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) await loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChannelNew = async (id: string) => {
    try {
      const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setChannels(prev => prev.filter(c => c.id !== id));
        await loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (updatedSettings: Settings) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSettings)
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
    }
  };

  const handleDeletePublication = async (id: string) => {
    try {
      await fetch(`/api/publications/${id}`, { method: 'DELETE' });
      await loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/export/csv', '_blank');
  };

  // 3. Social connected channels (loaded from DB /api/channels)
  const [channels, setChannels] = useState<SocialChannel[]>([]);

  // 4. Prepopulated SMM Campaigns/Posts list
  const [posts, setPosts] = useState<CampaignPost[]>([]);

  // 5. Prepopulated Ad marketplace directory listings for booking orders
  const [adListings, setAdListings] = useState<AdListing[]>([
    {
      id: 'ad-lst-1',
      channelId: 'ch-ext-1',
      channelName: 'AI для Бизнеса 🤖',
      platform: 'telegram',
      priceRub: 450,
      subscribersCount: 16500,
      avgViews: 4100,
      category: 'Бизнес/Маркетинг',
      contactUsername: '@ai_business_admin',
      description: 'Авторский канал про нейросети и автоматизацию процессов. Отличная платежеспособная аудитория.'
    },
    {
      id: 'ad-lst-2',
      channelId: 'ch-ext-2',
      channelName: 'Дизайнеры Будущего 🎨',
      platform: 'vk',
      priceRub: 300,
      subscribersCount: 19800,
      avgViews: 1200,
      category: 'Дизайн/Учеба',
      contactUsername: '@design_future',
      description: 'Паблик с уроками, ассетами и вакансиями для UI/UX и генеративных художников.'
    },
    {
      id: 'ad-lst-3',
      channelId: 'ch-ext-3',
      channelName: 'Крипто-Лихорадка 💎',
      platform: 'x',
      priceRub: 900,
      subscribersCount: 38200,
      avgViews: 9500,
      category: 'Криптовалюта',
      contactUsername: '@crypto_fever',
      description: 'Свежие крипто-сигналы, дропы и обзоры блокчейн-проектов.'
    }
  ]);

  // 6. Global Bulletin screen sponsored ads
  const [bulletinAds, setBulletinAds] = useState<BulletinAd[]>([
    {
      id: 'bull-1',
      title: 'Устали от спама в комментариях Telegram?',
      content: 'Добавьте нашего бота @IIrkiBot в комментарии вашего канала! Он автоматически чистит спам со ссылками, борется с ИИ-комментаторами и организует мгновенные репосты.',
      linkUrl: 'https://t.me/IIrkiBot',
      postedBy: '@IIrkiBot_support',
      createdAt: '2026-05-23T10:15:00.000Z',
      clicks: 220
    },
    {
      id: 'bull-2',
      title: 'Ищем организаторов папок по Маркетингу',
      content: 'Хотите собирать по 500-1000 ₽ с участников? Создайте взаимный рекламный сбор бесплатно! Комиссия ИИSMM всего 15%, остальные сборы ваши.',
      linkUrl: 'https://t.me/shishkarnem',
      postedBy: '@shishkarnem',
      createdAt: '2026-05-23T09:30:00.000Z',
      clicks: 145
    }
  ]);

  // Advertiser Orders for the user to respond to and earn money!
  const [advertiserOrders, setAdvertiserOrders] = useState<AdOrder[]>([
    {
      id: 'ord-1',
      title: 'Реклама ИИ-Академии Маркетинга',
      payoutRub: 350,
      platform: 'telegram',
      requirements: 'Держать в топе 2 часа. Без удаления.',
      postContent: '🚀 СТАНЬ ИИ-КОПИРАЙТЕРОМ ЗА 2 НЕДЕЛИ!\nЗапишись в нашу Академию и научись генерировать контент в 10 раз быстрее.'
    },
    {
      id: 'ord-2',
      title: 'Продвижение экосистемы @IIrkiBot',
      payoutRub: 550,
      platform: 'telegram',
      requirements: 'Опубликовать на 24 часа.',
      postContent: '🤖 Подключи @IIrkiBot прямо сейчас! Авточистка лохотронов, спама, рекламы ставок в комментариях вашего канала. Работает бесплатно.'
    },
    {
      id: 'ord-3',
      title: 'Реклама курсов UI/UX дизайна',
      payoutRub: 400,
      platform: 'vk',
      requirements: 'Размещение в ленту.',
      postContent: '🎨 Хочешь создавать интерфейсы в стиле Apple Liquid Glass? Приходи на наш бесплатный интенсив!'
    }
  ]);

  const handleAddAdListing = (listing: Omit<AdListing, 'id'>) => {
    const newListing: AdListing = {
      ...listing,
      id: `ad-lst-${Date.now()}`
    };
    setAdListings(prev => [newListing, ...prev]);
  };

  const handleEarnMoney = (amount: number, orderTitle: string, channelName: string) => {
    setUser(prev => ({
      ...prev,
      balanceRub: prev.balanceRub + amount,
      earningsRub: (prev.earningsRub || 0) + amount
    }));
    
    // Create actual simulated published post
    const newPost: CampaignPost = {
      id: `post-ord-${Date.now()}`,
      title: `Реклама: ${orderTitle}`,
      content: `Интеграция выполнена на канале ${channelName}. Вы заработали ${amount} ₽.`,
      platforms: ['telegram'],
      status: 'published',
      clicks: Math.floor(Math.random() * 45) + 10,
      views: Math.floor(Math.random() * 500) + 150,
      isAiGenerated: false
    };
    setPosts(prev => [newPost, ...prev]);
  };

  // 7. Mutual promotion folders сборы в папки
  const [bundles, setBundles] = useState<PromoBundle[]>([
    {
      id: 'bnd-1',
      title: 'Маркетинг и ИИ (Майский сбор)',
      organizerUsername: '@shishkarnem',
      rules: 'Держать в топе 3 часа после размещения. Не удалять публикацию папки в течении 2 суток.',
      entryFeeRub: 250,
      channelsCount: 6,
      maxChannels: 12,
      status: 'collecting',
      joinedChannels: ['ch-1', 'ch-2'],
      isFreeForOrganizer: true
    },
    {
      id: 'bnd-2',
      title: 'Юмор и Лайфстайл (Быстрый рост)',
      organizerUsername: '@joke_organizer',
      rules: 'Взнос обязателен для всех блогов менее 15к. Бот сверяет охваты и блокирует неплательщиков.',
      entryFeeRub: 150,
      channelsCount: 3,
      maxChannels: 10,
      status: 'collecting',
      joinedChannels: [],
      isFreeForOrganizer: false
    }
  ]);

  // --- MUTATORS & BUSINESS EVENT HANDLERS ---

  // Connect Channel: limits strict checking (limit is 3 channels on Free plan)
  const handleAddChannel = (newChan: Omit<SocialChannel, 'id' | 'subscribers' | 'isPremium' | 'status'>) => {
    const limit = 3;
    if (channels.length >= limit && user.tariff === 'free') {
      return 'Слишком много каналов на бесплатном плане! Добавьте новые слоты или оформите Premium для безлимита.';
    }

    const created: SocialChannel = {
      ...newChan,
      id: `ch-${Date.now()}`,
      subscribers: Math.floor(Math.random() * 8000) + 1200,
      isPremium: user.tariff !== 'free',
      status: 'connected'
    };

    setChannels([...channels, created]);
    return true;
  };

  const handleRemoveChannel = (id: string) => {
    setChannels(channels.filter(c => c.id !== id));
  };

  // Dedact tokens on AI interactions
  const handleDeductTokens = (amount: number) => {
    setUser(prev => ({
      ...prev,
      tokens: Math.max(0, prev.tokens - amount)
    }));
  };

  // Add new campaign SMM posts (cross-publishing and scheduling)
  const handlePublishPost = (newPost: Omit<CampaignPost, 'id' | 'clicks' | 'views'>) => {
    const created: CampaignPost = {
      ...newPost,
      id: `post-${Date.now()}`,
      clicks: 0,
      views: newPost.status === 'published' ? Math.floor(Math.random() * 800) + 100 : 0
    };

    setPosts([created, ...posts]);

    // Live counter statistics simulation parameters
    if (newPost.status === 'published') {
      alert(`УСПЕХ: Пост успешно опубликован в ${newPost.platforms.map(p => p.toUpperCase()).join(', ')} через шлюз ИИSMM!`);
    } else {
      alert(`УСПЕХ: Отложенный пост запланирован в календарь на указанное время!`);
    }
  };

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdatePost = (updatedPost: CampaignPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  // Buying channels premium slots limits
  const handleBuySlotSelection = (slotsCount: number) => {
    // 150 rubles per slot
    const cost = slotsCount * 150;
    setUser(prev => ({
      ...prev,
      balanceRub: Math.max(0, prev.balanceRub - cost),
      tariff: slotsCount >= 3 ? 'pro' : prev.tariff // Unlock pro if they buy bulk slots
    }));
  };

  // Add tokens package
  const handleReplenishTokens = (amount: number, costRub: number) => {
    setUser(prev => ({
      ...prev,
      tokens: prev.tokens + amount,
      balanceRub: Math.max(0, prev.balanceRub - costRub)
    }));
  };

  // Recharge bank advertising funds wallet
  const handleReplenishBalance = (amount: number) => {
    setUser(prev => ({
      ...prev,
      balanceRub: prev.balanceRub + amount
    }));
  };

  // AD integration escrow deposit transaction SMM
  const handleBuyAdSlot = (costRub: number) => {
    setUser(prev => ({
      ...prev,
      balanceRub: Math.max(0, prev.balanceRub - costRub)
    }));
  };

  // Triggering PRO / VIP Account Tariff upgrade
  const handleUpgradeTariff = (plan: 'free' | 'pro' | 'vip' = 'pro', useIirky: boolean = false) => {
    if (plan === 'free') {
      setUser(prev => ({ ...prev, tariff: 'free' }));
      alert('Вы переключили тариф на Free.');
      return;
    }

    const costRur = plan === 'pro' ? 490 : 990;
    const costIirky = plan === 'pro' ? 250 : 500;
    const label = plan.toUpperCase();

    if (useIirky) {
      if ((user.iirky || 0) < costIirky) {
        alert(`Недостаточно ИИрок! Для активации ${label} требуется ${costIirky} ИИрок. Ваш баланс: ${(user.iirky || 0).toLocaleString()} ИИрок.`);
        return;
      }
      setUser(prev => ({
        ...prev,
        iirky: (prev.iirky || 0) - costIirky,
        tariff: plan,
        premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')
      }));
      alert(`Поздравляем! Вы активировали подписку ${label} на 30 дней за ${costIirky} ИИрок!`);
    } else {
      if (user.balanceRub < costRur) {
        if (confirm(`Ваш текущий баланс (${user.balanceRub} ₽) недостаточен. Пополнить баланс на ${costRur} ₽ для активации подписки ${label}?`)) {
          setUser(prev => ({
            ...prev,
            balanceRub: prev.balanceRub,
            tariff: plan,
            premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')
          }));
          alert(`Поздравляем! Ваш SMM комбайн успешно повышен до уровня ${label}!`);
        }
      } else {
        setUser(prev => ({
          ...prev,
          balanceRub: prev.balanceRub - costRur,
          tariff: plan,
          premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')
        }));
        alert(`Поздравляем! Ваш SMM комбайн успешно повышен до уровня ${label}!`);
      }
    }
  };

  // Join Promo bundles Mutual portfolios logic #8
  const handleJoinBundle = (bundleId: string, channelId: string) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    // Deduct fee and payout split simulation
    if (bundle.entryFeeRub > 0) {
      setUser(prev => ({
        ...prev,
        balanceRub: Math.max(0, prev.balanceRub - bundle.entryFeeRub)
      }));
    }

    setBundles(bundles.map(b => {
      if (b.id === bundleId) {
        return {
          ...b,
          channelsCount: b.channelsCount + 1,
          joinedChannels: [...b.joinedChannels, channelId]
        };
      }
      return b;
    }));
  };

  // Add new folder mutual directory promo (free for organizers)
  const handleAddBundle = (newBund: Omit<PromoBundle, 'id' | 'channelsCount' | 'joinedChannels'>) => {
    const created: PromoBundle = {
      ...newBund,
      id: `bnd-${Date.now()}`,
      channelsCount: 1,
      joinedChannels: ['ch-creator']
    };
    setBundles([created, ...bundles]);
    alert('Кампания продвижения успешно создана! Члены папки будут пополнять ваши счета.');
  };

  // Bulletin add offer post
  const handlePostBulletinAd = (newAd: Omit<BulletinAd, 'id' | 'createdAt' | 'clicks'>) => {
    const created: BulletinAd = {
      ...newAd,
      id: `bull-${Date.now()}`,
      createdAt: new Date().toISOString(),
      clicks: 0
    };
    setBulletinAds([created, ...bulletinAds]);
  };

  // Bulletin click counter tracker simulation
  const handleAdClick = (adId: string) => {
    setBulletinAds(bulletinAds.map(ad => {
      if (ad.id === adId) {
        return { ...ad, clicks: ad.clicks + 1 };
      }
      return ad;
    }));
  };

  // Core metrics accumulator
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 12500);
  const totalClicks = posts.reduce((sum, p) => sum + (p.clicks || 0), 980);

  // Standalone public routes (available without login or inside app)
  if (currentPath === '/oferta' || currentPath.startsWith('/oferta')) {
    return <OfertaPage onNavigate={changeRoute} />;
  }

  if (currentPath === '/tarif/pay' || currentPath.startsWith('/tarif/pay')) {
    return <PublicTarifPayPage onNavigate={changeRoute} currentUser={user} />;
  }

  if (currentPath.startsWith('/payment/success') || currentPath.startsWith('/payment/robokassa/success')) {
    return <PaymentSuccessPage onNavigate={changeRoute} />;
  }

  if (currentPath.startsWith('/payment/fail') || currentPath.startsWith('/payment/robokassa/fail')) {
    return <PaymentFailPage onNavigate={changeRoute} />;
  }

  const landingPaths = ['/', '/main', '/blog', '/ai', '/market-exchange', '/chat', '/prices', '/projects', '/academy'];

  const isLandingRoute = landingPaths.includes(currentPath) || currentPath.startsWith('/blog/') || currentPath.startsWith('/blog');

  if (isLandingRoute) {
    return (
      <LandingPage 
        onLogin={() => {
          try {
            sessionStorage.setItem('iismm_session_auth', 'true');
          } catch (e) {}
          setIsLoggedIn(true);
          changeRoute('/profile');
        }} 
        user={user} 
        onUpdateUser={setUser} 
        currentPath={currentPath}
        onNavigate={changeRoute}
        isLoggedIn={isLoggedIn}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row pb-16 md:pb-0 font-sans relative overflow-hidden">
      <LiquidGlassBackground />
      
      {/* 1. Desktop Sidebar Column */}
      <Sidebar 
        currentPath={currentPath}
        onNavigate={changeRoute}
        tariff={user.tariff}
        tokens={user.tokens}
        balanceRub={user.balanceRub}
        userName={user.name}
        telegramUsername={user.telegramUsername}
        iirky={user.iirky}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto no-scrollbar pt-4 px-1 md:p-6 lg:p-8 space-y-5 relative z-10">
        
        {/* Mobile Header Banner - Custom for Social Network, standard otherwise */}
        {currentPath === '/social' || currentPath.startsWith('/social/') ? (
          <div className="relative z-10 flex items-center justify-between p-2.5 px-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 shadow-xs md:hidden shrink-0">
            <button 
              onClick={() => changeRoute('/profile')}
              className="focus:outline-none focus:ring-2 focus:ring-pink-300 rounded-full transition-transform active:scale-95 cursor-pointer z-10"
            >
              <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100" 
                alt="ИИSMM" 
                className="w-10 h-10 rounded-full object-cover border-2 border-pink-400 p-0.5 shadow-xs bg-white"
              />
            </button>
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer z-0"
              onClick={() => changeRoute('/dashboard')}
            >
              <img 
                src="/file/9/iismmlogo.png" 
                alt="ИИSMM Logo" 
                className="h-7 w-auto object-contain max-w-[120px]"
              />
            </div>
            <div className="z-10" />
          </div>
        ) : (
          <div className="flex items-center justify-between p-2.5 px-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 shadow-xs md:hidden shrink-0 relative">
            {/* LEFT: Burger Menu */}
            <div className="flex items-center gap-2 z-10">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="bg-white/90 hover:bg-white text-slate-700 p-1 px-3 rounded-full text-[11px] font-black tracking-wide flex items-center gap-1.5 cursor-pointer border border-pink-200 shadow-xs active:scale-95 transition-all"
              >
                <span className="text-[13px] text-pink-500 font-bold">{mobileMenuOpen ? '✕' : '☰'}</span>
                <span className="font-sans font-black tracking-wider text-[10px] text-slate-700">Меню</span>
              </button>
            </div>

            {/* CENTER: Logo Image */}
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer z-0"
              onClick={() => changeRoute('/dashboard')}
              title="ИИSMM"
            >
              <img 
                src="/file/9/iismmlogo.png" 
                alt="ИИSMM Logo" 
                className="h-7 w-auto object-contain max-w-[120px]"
              />
            </div>

            {/* RIGHT: User Tariff Badge */}
            <div className="flex items-center gap-1.5 z-10">
              {(() => {
                const raw = (user.tariff || '').toLowerCase();
                if (raw.includes('космос') || raw.includes('kosmos') || raw.includes('индивидуальн')) {
                  return (
                    <button onClick={() => changeRoute('/tarif')} className="px-2.5 py-1 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white text-[9px] font-black rounded-xl shadow-xs flex items-center gap-1 cursor-pointer hover:opacity-95">
                      <span>👑</span>
                      <span>КОСМОС</span>
                    </button>
                  );
                }
                if (raw.includes('отрыв') || raw.includes('otryv') || raw.includes('vip') || raw.includes('взлет')) {
                  return (
                    <button onClick={() => changeRoute('/tarif')} className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black rounded-xl shadow-xs flex items-center gap-1 cursor-pointer hover:opacity-95">
                      <span>🔥</span>
                      <span>ОТРЫВ</span>
                    </button>
                  );
                }
                if (raw.includes('разгон') || raw.includes('razgon') || raw.includes('pro')) {
                  return (
                    <button onClick={() => changeRoute('/tarif')} className="px-2.5 py-1 bg-gradient-to-r from-sky-400 to-indigo-500 text-white text-[9px] font-black rounded-xl shadow-xs flex items-center gap-1 cursor-pointer hover:opacity-95">
                      <span>⚡</span>
                      <span>РАЗГОН</span>
                    </button>
                  );
                }
                return (
                  <button onClick={() => changeRoute('/tarif')} className="px-2.5 py-1 bg-slate-200 text-slate-700 text-[9px] font-black rounded-xl flex items-center gap-1 cursor-pointer hover:bg-slate-300">
                    <span>🌱</span>
                    <span>СТАРТ</span>
                  </button>
                );
              })()}
            </div>
          </div>
        )}

        {/* Floating Slide-Down Burger Menu Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden md:hidden z-30 rounded-2xl bg-white/90 backdrop-blur-lg border border-pink-200 p-3.5 shadow-xl space-y-2.5 relative"
            >
              <div className="text-xs font-black uppercase text-pink-600 tracking-wider text-center border-b border-pink-100 pb-1.5 mb-2">
                Навигация ИИSMM
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '👤 Профиль', path: '/profile', color: 'hover:bg-orange-50 text-slate-800' },
                  { label: '✍️ Посты', path: '/posts', color: 'hover:bg-pink-50 text-slate-800' },
                  { label: '📢 Каналы', path: '/channels', color: 'hover:bg-sky-50 text-slate-800' },
                  { label: '🔮 Соцсеть', path: '/social', color: 'hover:bg-pink-50 text-pink-600 font-extrabold' },
                  { label: '📅 Календарь', path: '/calendar', color: 'hover:bg-orange-50 text-slate-800' },
                  ...(user.telegramUsername === '@shishkarnem' || user.name.toLowerCase().includes('шишкар') ? [
                    { label: '👑 Админка', path: '/admin', color: 'hover:bg-amber-50 text-amber-700 font-black' }
                  ] : [])
                ].map((item) => {
                  const cleanP = currentPath.replace('169262990', '');
                  const isPostsRelated = item.path === '/posts' && (cleanP.startsWith('/posts') || cleanP.startsWith('/scenarios') || cleanP.startsWith('/crosspost'));
                  const isActive = isPostsRelated || cleanP.startsWith(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        changeRoute(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className={`p-2 py-2.5 rounded-xl text-center font-bold text-sm cursor-pointer border transition-all ${
                        isActive 
                          ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white border-white shadow-xs scale-[1.02]' 
                          : `bg-white/80 border-pink-100 text-slate-800 ${item.color}`
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Route View Switching */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18 }}
            >
              {(currentPath === '/' || currentPath === '' || currentPath.startsWith('/dashboard') || currentPath.startsWith('/main') || currentPath.startsWith('/posts') || currentPath.startsWith('/scenarios') || currentPath.startsWith('/crosspost')) && (
                <Posts 
                  dayRequests={dayRequests}
                  channels={channels}
                  templates={templates}
                  currentUser={user}
                  onAddDayRequest={handleAddDayRequest}
                  onUpdateDayRequest={handleUpdateDayRequest}
                  onDeleteDayRequest={handleDeleteDayRequest}
                  onSaveDayRequest={handleSaveDayRequest}
                  onPublishToTelegram={handlePublishToTelegram}
                  onSaveTemplate={handleSaveTemplate}
                  selectedPostId={selectedPostId}
                  onSelectPostId={setSelectedPostId}
                  telegramId={user.telegramId}
                  currentPath={currentPath}
                  onNavigate={changeRoute}
                />
              )}

              {currentPath.startsWith('/channels') && (
                <Channels 
                  channels={channels}
                  currentUser={user}
                  onAddChannel={handleAddChannelNew}
                  onUpdateChannel={handleUpdateChannelNew}
                  onDeleteChannel={handleDeleteChannelNew}
                  onRefresh={loadAllData}
                  onLogout={() => setIsLoggedIn(false)}
                />
              )}

              {(currentPath.startsWith('/calendar') || currentPath.startsWith('/history')) && (
                <AppleCalendarView 
                  dayRequests={dayRequests}
                  publications={publications}
                  channels={channels}
                  currentUser={user}
                  handleExportCSV={handleExportCSV}
                  setActiveTab={(tab) => changeRoute('/' + tab)}
                  onSelectPostForEdit={(postId) => {
                    setSelectedPostId(postId);
                    changeRoute('/posts');
                  }}
                  onDeletePublication={handleDeletePublication}
                  initialViewMode={currentPath.startsWith('/history') ? 'history' : 'calendar'}
                />
              )}

              {currentPath.startsWith('/gallery') && (
                <GalleryView
                  currentUser={user}
                  channels={channels}
                  setActiveTab={(tab) => changeRoute('/' + tab)}
                  onSelectPostForEdit={(postId) => {
                    setSelectedPostId(postId);
                    changeRoute('/posts');
                  }}
                />
              )}

              {currentPath.startsWith('/social') && (
                <SocialPage 
                  user={user}
                  onUpdateUser={setUser}
                  currentPath={currentPath}
                  onLogout={() => setIsLoggedIn(false)}
                  onAvatarFileUpload={handleAvatarFileUpload}
                />
              )}

              {currentPath.startsWith('/market') && (
                <MarketPage 
                  adListings={adListings}
                  bulletinAds={bulletinAds}
                  userTariff={user.tariff}
                  userBalance={user.balanceRub}
                  onPostBulletinAd={handlePostBulletinAd}
                  onBuyAdSlot={handleBuyAdSlot}
                  onAddFunds={handleReplenishBalance}
                  onAdClick={handleAdClick}
                  connectedChannels={channels}
                  onAddAdListing={handleAddAdListing}
                  onEarnMoney={handleEarnMoney}
                  advertiserOrders={advertiserOrders}
                />
              )}

              {(currentPath.startsWith('/profile') || currentPath.startsWith('/tarif') || currentPath.startsWith('/partner') || currentPath.startsWith('/teams') || currentPath.startsWith('/brand') || currentPath.startsWith('/api-keys') || currentPath.startsWith('/roundtable') || currentPath.startsWith('/enterprise')) && (
                <ProfilePage 
                  user={user}
                  onUpgradeTariff={handleUpgradeTariff}
                  onReplenishTokens={handleReplenishTokens}
                  onReplenishBalance={handleReplenishBalance}
                  onUpdateUser={setUser}
                  onTelegramRegister={handleTelegramOneClickRegister}
                  onLogout={handleLogout}
                  channels={channels}
                  channelsCount={channels.length}
                  postsCount={posts.length}
                  createdPostsCount={dayRequests.length || posts.length || 0}
                  scheduledPostsCount={dayRequests.filter(r => r.status === 'scheduled' || r.status === 'pending').length}
                  publishedPostsCount={publications.length > 0 ? publications.length : dayRequests.filter(r => r.status === 'posted' || r.status === 'published' || r.status === 'done').length}
                  totalViews={totalViews}
                  totalClicks={totalClicks}
                  earningsRub={user.earningsRub}
                  currentPath={currentPath}
                />
              )}

              {currentPath.startsWith('/admin') && (
                <AdminPage 
                  currentUser={user}
                  onUpdateCurrentUser={setUser}
                  allChannelsCount={channels.length}
                />
              )}

              {currentPath.startsWith('/oferta') && (
                <OfertaPage onNavigate={changeRoute} />
              )}

              {currentPath.startsWith('/reset-password') && (
                <ResetPasswordPage 
                  onSuccessLogin={(loggedUser) => {
                    setUser(loggedUser);
                    setIsLoggedIn(true);
                  }}
                  onNavigate={changeRoute}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* 3. Mobile Navigation Dock */}
      <BottomNavbar 
        currentPath={currentPath}
        onNavigate={changeRoute}
        tariff={user.tariff}
      />

    </div>
  );
}
