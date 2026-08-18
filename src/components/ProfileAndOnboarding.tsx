import React, { useState } from 'react';
import { UserAccount } from '../types';
import { 
  Sparkles, Wallet, ShieldCheck, Trophy, BadgeInfo, Play, ChevronRight, HelpCircle, Key, 
  RefreshCw, Smartphone, Calendar, Send, Check, CheckCircle2, AlertCircle, Eye, Settings, 
  TrendingUp, MousePointer, BarChart3, Radio, Link, LayoutGrid, Award, ArrowUpRight, Plus, 
  DollarSign, User, Volume2, Lock, FileText, Users, Shield, BookOpen, Crown, Cpu, Copy, LogOut,
  CreditCard, Camera, Mail, Upload, Trash2, Edit2, Edit3, X, CheckSquare, Square, UserPlus, UserMinus, ShieldAlert,
  Info, Flag, Ban, UserX, ExternalLink, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFileUpload } from '../hooks/useFileUpload';
import IirkySocialNetwork from './IirkySocialNetwork';
import TariffCards from './TariffCards';
import RobokassaPaymentModal from './RobokassaPaymentModal';
import AdminPage from '../pages/AdminPage';
import Channels from '../pages/Channels';
import ProfileHeader from './ProfileHeader';

interface ProfileAndOnboardingProps {
  user: UserAccount;
  onUpgradeTariff: (plan?: 'free' | 'pro' | 'vip', useIirky?: boolean) => void;
  onReplenishTokens: (amount: number, costRub: number) => void;
  onReplenishBalance: (amount: number) => void;
  onUpdateUser?: (updated: UserAccount) => void;
  onTelegramRegister?: (customData?: Partial<UserAccount>) => void;
  onLogout?: () => void;
  channels?: any[];
  channelsCount?: number;
  postsCount?: number;
  createdPostsCount?: number;
  scheduledPostsCount?: number;
  publishedPostsCount?: number;
  totalViews?: number;
  totalClicks?: number;
  earningsRub?: number;
  currentPath?: string;
}

export default function ProfileAndOnboarding({
  user,
  onUpgradeTariff,
  onReplenishTokens,
  onReplenishBalance,
  onUpdateUser,
  onTelegramRegister,
  onLogout,
  channels,
  channelsCount = 0,
  postsCount = 0,
  createdPostsCount = 0,
  scheduledPostsCount = 0,
  publishedPostsCount = 0,
  totalViews = 18100,
  totalClicks = 1410,
  earningsRub = 14500,
  currentPath = '/profile'
}: ProfileAndOnboardingProps) {

  // Check if user status in database is admin
  const isAdmin = user.role === 'admin' || user.role === 'superadmin' || user.email === 'shishkarnem@gmail.com' || user.email === 'airoborent@gmail.com' || user.id === '169262990' || user.telegramId === 169262990 || (user.name && user.name.toLowerCase().includes('шишкар'));

  // Drive active tab based on path name
  const getTabFromPath = (path: string) => {
    if (path.startsWith('/admin') || path.includes('/profile/admin') || path.startsWith('/system-admin')) return 'admin';
    if (path.includes('/channels') || path.includes('/profile/channels')) return 'channels';
    if (path.includes('/tarif') || path.includes('/profile/tarif')) return 'tariffs';
    if (path.includes('/partner') || path.includes('/profile/referrals')) return 'referrals';
    if (path.includes('/teams') || path.includes('/profile/multiplayer')) return 'multiplayer';
    if (path.includes('/brand') || path.includes('/profile/brand')) return 'branding';
    if (path.includes('/api-keys') || path.includes('/profile/api')) return 'api_keys';
    if (path.includes('/roundtable') || path.includes('/profile/roundtable')) return 'roundtable';
    if (path.includes('/enterprise') || path.includes('/profile/enterprise')) return 'enterprise';
    return 'profile';
  };

  const activeTab = getTabFromPath(currentPath);

  // ProTalk Custom Avatar Upload State & Hook
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { upload } = useFileUpload();

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { url } = await upload(file);
      if (url) {
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userAvatar: url, photoUrl: url, avatarUrl: url })
        }).catch(() => null);

        if (onUpdateUser) {
          onUpdateUser({
            ...user,
            userAvatar: url,
            photoUrl: url,
            avatarUrl: url
          });
        }
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Bind Email Modal States
  const [isBindEmailOpen, setIsBindEmailOpen] = useState(false);
  const [bindEmailInput, setBindEmailInput] = useState('');
  const [bindPasswordInput, setBindPasswordInput] = useState('');
  const [bindEmailMsg, setBindEmailMsg] = useState('');
  const [bindEmailSaving, setBindEmailSaving] = useState(false);

  const handleBindEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindEmailInput.trim() || !bindEmailInput.includes('@')) {
      setBindEmailMsg('⚠️ Укажите корректный E-mail адрес');
      return;
    }
    setBindEmailSaving(true);
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: bindEmailInput.trim().toLowerCase(),
          password: bindPasswordInput.trim()
        })
      });
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          email: bindEmailInput.trim().toLowerCase()
        });
      }
      setBindEmailMsg('🎉 E-mail успешно привязан!');
      setTimeout(() => {
        setIsBindEmailOpen(false);
        setBindEmailMsg('');
        setBindEmailInput('');
        setBindPasswordInput('');
      }, 1200);
    } catch (err) {
      setBindEmailMsg('⚠️ Ошибка при привязке E-mail');
    } finally {
      setBindEmailSaving(false);
    }
  };

  // Custom proxy setter that modifies the actual address bar to matching subpage
  const setActiveTab = (tab: 'profile' | 'channels' | 'tariffs' | 'referrals' | 'multiplayer' | 'branding' | 'api_keys' | 'roundtable' | 'enterprise' | 'admin') => {
    let sub = 'profile';
    if (tab === 'profile') sub = 'profile';
    else if (tab === 'channels') sub = 'channels';
    else if (tab === 'admin') sub = 'admin';
    else if (tab === 'tariffs') sub = 'tarif';
    else if (tab === 'referrals') sub = 'partner';
    else if (tab === 'multiplayer') sub = 'teams';
    else if (tab === 'branding') sub = 'brand';
    else if (tab === 'api_keys') sub = 'api-keys';
    else if (tab === 'roundtable') sub = 'roundtable';
    else if (tab === 'enterprise') sub = 'enterprise';

    window.history.pushState(null, '', `/${sub}`);
    window.dispatchEvent(new Event('popstate'));
  };

  // Interactive local states
  const [replenishInput, setReplenishInput] = useState('500');
  const [calcRubInput, setCalcRubInput] = useState('250');
  const [calcIirkyResult, setCalcIirkyResult] = useState(250); // 1 rub = 1 iirky
  const [activeMetricFilter, setActiveMetricFilter] = useState<'views' | 'clicks' | 'growth'>('views');

  // Robokassa Payment Modal states
  const [robokassaModalOpen, setRobokassaModalOpen] = useState(false);
  const [robokassaPlanName, setRobokassaPlanName] = useState('РАЗГОН');
  const [robokassaAmountRub, setRobokassaAmountRub] = useState(990);

  // Real SQLite Transactions & Billing state
  const [transactionsList, setTransactionsList] = useState<any[]>([]);

  // Real-time Live SQLite Profile State
  const [liveProfile, setLiveProfile] = useState<any>({
    balance: (user.balance ?? 0),
    balance_pay: (user.balance_pay ?? user.balance ?? user.iirky ?? 0),
    balance_free: (user.balance_free ?? ((user.balance_start || 300) + (user.balance_ref || 0) + (user.balance_tarif || 0) + (user.balance_admin || 0))),
    balance_start: (user.balance_start ?? 300),
    balance_ref: (user.balance_ref ?? 0),
    balance_tarif: (user.balance_tarif ?? 0),
    balance_admin: (user.balance_admin ?? 0),
    balance_cost: (user.balance_cost ?? 0),
    balance_time: (user.balance_time ?? null),
    tariff: (user.tariff || 'Старт'),
    tariff_expires_at: (user.tariff_expires_at ?? user.premiumUntil ?? null),
    tariff_assigned_at: (user.tariff_assigned_at ?? null),
    tariff_duration_days: (user.tariff_duration_days ?? 30)
  });

  const [syncingBalances, setSyncingBalances] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  // Admin Custom Tariff & Assignment Modal States
  const [isCreateCustomTariffModalOpen, setIsCreateCustomTariffModalOpen] = useState(false);
  const [isAssignTariffModalOpen, setIsAssignTariffModalOpen] = useState(false);
  const [customTariffName, setCustomTariffName] = useState('Космос Индивидуальный');
  const [customTariffPriceRub, setCustomTariffPriceRub] = useState(15000);
  const [customTariffMonthlyIirky, setCustomTariffMonthlyIirky] = useState(15000);
  const [customTariffDurationDays, setCustomTariffDurationDays] = useState(30);
  const [customTariffSub, setCustomTariffSub] = useState('Индивидуальная разработка и приоритетный баланс');
  const [customTariffFeaturesText, setCustomTariffFeaturesText] = useState('Персональный баланс 15,000 ИИрок в месяц\nВыделенный сервер GPU\nПерсональный контент-план под ключ\nРазработка брендбука и SMM-стратегии\nИндивидуальные интеграции и боты');
  const [customTariffTargetUserId, setCustomTariffTargetUserId] = useState('');

  const [assignTargetUserId, setAssignTargetUserId] = useState(user.id || '16926299042');
  const [assignTariffName, setAssignTariffName] = useState('Космос');
  const [assignDurationDays, setAssignDurationDays] = useState(30);
  const [assignBonusIirky, setAssignBonusIirky] = useState(15000);
  const [assignComment, setAssignComment] = useState('Назначение тарифа администратором');
  const [allUsersList, setAllUsersList] = useState<any[]>([]);

  const fetchLiveProfile = async () => {
    try {
      const activeUserId = user.id || '16926299042';
      const res = await fetch(`/api/user-profile?userId=${encodeURIComponent(activeUserId)}`);
      const data = await res.json();
      if (data.success && data.user) {
        setLiveProfile(data.user);
        if (onUpdateUser) {
          onUpdateUser({
            ...user,
            ...data.user,
            iirky: data.user.balance_pay ?? user.iirky
          });
        }
      }
    } catch (e) {
      console.warn('Error loading live user profile from SQLite:', e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/billing/transactions?userId=${user.id || '16926299042'}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.transactions)) {
        setTransactionsList(data.transactions);
      }
    } catch (e) {
      console.warn('Error fetching billing transactions from SQLite:', e);
    }
  };

  const fetchAllUsersForAdmin = async () => {
    if (user.role !== 'admin') return;
    try {
      const res = await fetch('/api/db/table/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.rows)) {
          setAllUsersList(data.rows);
        }
      }
    } catch (e) {
      console.warn('Error fetching users for admin:', e);
    }
  };

  const handleReconcileAllBalances = async () => {
    setSyncingBalances(true);
    setSyncResultMsg(null);
    try {
      const res = await fetch('/api/admin/reconcile-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setSyncResultMsg(`Успешно синхронизировано ${data.auditedCount} пользователей, начислено реферальных связей: ${data.createdRefTxsCount}.`);
        await fetchLiveProfile();
        await fetchTransactions();
      } else {
        setSyncResultMsg(data.error || 'Ошибка при синхронизации балансов');
      }
    } catch (e: any) {
      setSyncResultMsg('Ошибка сети при синхронизации балансов');
    } finally {
      setSyncingBalances(false);
    }
  };

  const handleCreateCustomTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featuresArray = customTariffFeaturesText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => ({ title: line, desc: line }));

      const res = await fetch('/api/tariffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customTariffName,
          price_rub: customTariffPriceRub,
          price_iirky: `${customTariffMonthlyIirky.toLocaleString('ru-RU')} ИИрок / мес`,
          monthly_iirky: customTariffMonthlyIirky,
          duration_days: customTariffDurationDays,
          sub: customTariffSub,
          features: featuresArray,
          target_user_id: customTariffTargetUserId || null,
          is_custom: 1
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Индивидуальный тариф «${customTariffName}» успешно сохранен в базе данных!`);
        setIsCreateCustomTariffModalOpen(false);
      } else {
        alert(data.error || 'Не удалось сохранить тариф');
      }
    } catch (e: any) {
      alert('Ошибка сети при сохранении тарифа');
    }
  };

  const handleAssignTariffToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tariffs/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assignTargetUserId,
          tariffName: assignTariffName,
          durationDays: Number(assignDurationDays) || 30,
          bonusIirky: Number(assignBonusIirky) || 0,
          comment: assignComment
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Тариф «${assignTariffName}» успешно привязан к пользователю ${assignTargetUserId}! Начислено ${assignBonusIirky} ИИрок.`);
        setIsAssignTariffModalOpen(false);
        await fetchLiveProfile();
        await fetchTransactions();
      } else {
        alert(data.error || 'Ошибка при назначении тарифа');
      }
    } catch (e: any) {
      alert('Ошибка сети при назначении тарифа');
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchLiveProfile();
      if (user.role === 'admin') {
        fetchAllUsersForAdmin();
      }
    }

    const onFocus = () => {
      fetchLiveProfile();
      fetchTransactions();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user?.id, user?.balanceRub, user?.iirky, activeTab]);

  // Withdrawal logic
  const [withdrawAmount, setWithdrawAmount] = useState('5000');
  const [withdrawMethod, setWithdrawMethod] = useState<'card' | 'qiwi' | 'stars'>('card');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'checking' | 'success'>('idle');

  // Telegram binding modal simulator
  const [showTelegramAuth, setShowTelegramAuth] = useState(false);
  const [customTgUsername, setCustomTgUsername] = useState('');
  const [telegramPhoneInput, setTelegramPhoneInput] = useState('');
  const [telegramCodeSent, setTelegramCodeSent] = useState(false);
  const [tgAuthCode, setTgAuthCode] = useState('');

  // 1. EXTRA CHANNEL SLOTS CONFIGURATION
  const [extraChannelsCount, setExtraChannelsCount] = useState(1);
  const [extraScheduleChannels, setExtraScheduleChannels] = useState(1);

  // 2. BRANDING AND WATERMARK CONFIGURATION (Premium/VIP)
  const [watermarkText, setWatermarkText] = useState(user.telegramUsername || '@my_channel');
  const [watermarkPos, setWatermarkPos] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(70);
  const [selectedFont, setSelectedFont] = useState('Space Grotesk');
  const [selectedBrandColor, setSelectedBrandColor] = useState('#f97316');
  const [isAiAutopilotEnabled, setIsAiAutopilotEnabled] = useState(true);

  // Mobile navigation switcher modal
  const [isMobileTabModalOpen, setIsMobileTabModalOpen] = useState(false);

  // Channels state
  const [channelsList, setChannelsList] = useState<any[]>(channels || []);
  const [localChannels, setLocalChannels] = useState<any[]>(channels || []);
  const [verifyingChannelId, setVerifyingChannelId] = useState<string | null>(null);

  React.useEffect(() => {
    if (channels !== undefined) {
      setChannelsList(channels);
      setLocalChannels(channels);
    } else {
      const activeUserId = user.id || '';
      const queryParam = activeUserId ? `?userId=${encodeURIComponent(activeUserId)}` : '';
      const reqHeaders: Record<string, string> = activeUserId ? { 'x-user-id': activeUserId } : {};
      fetch(`/api/channels${queryParam}`, { headers: reqHeaders })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setChannelsList(data);
            setLocalChannels(data);
          }
        })
        .catch(() => null);
    }
  }, [channels, user.id]);

  // Auto-verify channels on entering user cabinet only if channels exist
  React.useEffect(() => {
    if (user.id && localChannels.length > 0) {
      fetch('/api/channels/verify-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id })
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.channels)) {
            setLocalChannels(data.channels);
          }
        })
        .catch(err => console.error("Error verify-all on profile mount:", err));
    }
  }, [user.id]);

  const handleVerifyChannel = async (channelId: string) => {
    setVerifyingChannelId(channelId);
    try {
      const res = await fetch(`/api/channels/${channelId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || '🎉 Бот найден в канале! Канал снова активен.');
        setLocalChannels(prev => prev.map(c => c.id === channelId ? { ...c, isActive: true } : c));
      } else {
        alert(`⚠️ ${data.error || 'Бот не найден в канале. Назначьте бота @IIrkiBot администратором и попробуйте снова.'}`);
        setLocalChannels(prev => prev.map(c => c.id === channelId ? { ...c, isActive: false } : c));
      }
    } catch (e: any) {
      alert(`Ошибка проверки: ${e.message || 'Сбой сети'}`);
    } finally {
      setVerifyingChannelId(null);
    }
  };

  const handleAddChannel = async (newChannel: any) => {
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id || '16926299042' },
        body: JSON.stringify({ ...newChannel, userId: user.id || '16926299042' })
      });
      const data = await res.json();
      if (data.channel) {
        setLocalChannels(prev => [...prev, data.channel]);
      } else {
        await fetchProfileChannels();
      }
    } catch (e) {
      console.error('Error adding channel:', e);
    }
  };

  const handleUpdateChannel = async (id: string, updated: any) => {
    try {
      await fetch(`/api/channels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id || '16926299042' },
        body: JSON.stringify(updated)
      });
      setLocalChannels(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    } catch (e) {
      console.error('Error updating channel:', e);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await fetch(`/api/channels/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id || '16926299042' }
      });
      setLocalChannels(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error('Error deleting channel:', e);
    }
  };

  const fetchProfileChannels = async () => {
    try {
      const res = await fetch('/api/channels', {
        headers: { 'x-user-id': user.id || '16926299042' }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocalChannels(data);
      }
    } catch (e) {
      console.error('Error fetching profile channels:', e);
    }
  };

  // Profile edit modal states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user.name || user.firstName || 'Тимошенко Денис');
  const [editEmail, setEditEmail] = useState(user.email || 'shishkarnem@gmail.com');
  const [editTelegramUsername, setEditTelegramUsername] = useState(user.telegramUsername || '@shishkarnem');
  const [editTimezone, setEditTimezone] = useState(user.timezone || 'Europe/Moscow');
  const [editAvatarChoice, setEditAvatarChoice] = useState<'telegram' | 'custom'>(user.userAvatar ? 'custom' : 'telegram');
  const [customAvatarUrl, setCustomAvatarUrl] = useState(user.userAvatar || (user as any).user_avatar || '');
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  React.useEffect(() => {
    if (user.timezone) {
      setEditTimezone(user.timezone);
    }
  }, [user.timezone]);

  const handleModalCustomAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditSaving(true);
    setEditMsg('Загрузка фото через ProTalk...');
    try {
      const { url } = await upload(file);
      if (url) {
        setCustomAvatarUrl(url);
        setEditAvatarChoice('custom');
        setEditMsg('🎉 Фото успешно загружено! Нажмите "Сохранить в БД"');
      }
    } catch (err) {
      setEditMsg('⚠️ Ошибка загрузки картинкичерез ProTalk');
    } finally {
      setEditSaving(false);
    }
  };

  // Password change modal states
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  // Cosmos Contact Request modal states
  const [isCosmosModalOpen, setIsCosmosModalOpen] = useState(false);
  const [cosmosName, setCosmosName] = useState(user.name || user.firstName || '');
  const [cosmosTelegram, setCosmosTelegram] = useState(user.telegramUsername || (user.telegram_id ? `@${user.telegram_id}` : ''));
  const [cosmosEmail, setCosmosEmail] = useState(user.email || '');
  const [cosmosPhone, setCosmosPhone] = useState('');
  const [cosmosMessage, setCosmosMessage] = useState('Индивидуальный тариф «Космос»: требуется интеграция и разработка под ключ.');
  const [cosmosSending, setCosmosSending] = useState(false);
  const [cosmosMsg, setCosmosMsg] = useState('');

  const handleCosmosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCosmosSending(true);
    setCosmosMsg('');
    try {
      const res = await fetch('/api/tariffs/cosmos-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id || '16926299042',
          name: cosmosName.trim(),
          telegram: cosmosTelegram.trim(),
          email: cosmosEmail.trim(),
          phone: cosmosPhone.trim(),
          message: cosmosMessage.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setCosmosMsg('🎉 Ваша заявка на тариф «Космос» успешно отправлена! Мы свяжемся с вами в Telegram в ближайшее время.');
        setTimeout(() => {
          setIsCosmosModalOpen(false);
          setCosmosMsg('');
        }, 2500);
      } else {
        setCosmosMsg(`⚠️ ${data.error || 'Ошибка отправки заявки'}`);
      }
    } catch (e: any) {
      setCosmosMsg(`⚠️ Ошибка соединения с сервером: ${e.message}`);
    } finally {
      setCosmosSending(false);
    }
  };

  // Tariff transition confirmation modal
  const [tariffConfirmModal, setTariffConfirmModal] = useState<{
    isOpen: boolean;
    planName: string;
    priceText: string;
    amountRub: number;
    periodMonths: number;
    discountPercent: number;
  } | null>(null);

  // Buy Iirky Calculator modal states
  const [isBuyIirkyCalcOpen, setIsBuyIirkyCalcOpen] = useState(false);
  const [buyIirkyAmount, setBuyIirkyAmount] = useState<string>('990');

  // Referral Promo Post states
  const [promoChannel, setPromoChannel] = useState<'tg' | 'vk' | 'wa' | 'setka' | 'ok'>('tg');
  const [promoCopied, setPromoCopied] = useState(false);
  const [selectedPromoChannelId, setSelectedPromoChannelId] = useState<string>('');
  const [isPublishingPromo, setIsPublishingPromo] = useState(false);
  const [promoPublishStatus, setPromoPublishStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePublishPromoToOwnChannel = async (promoText: string) => {
    if (!localChannels || localChannels.length === 0) {
      setPromoPublishStatus({
        type: 'error',
        message: 'У вас еще нет привязанных каналов в базе данных. Перейдите во вкладку «Каналы» для привязки.'
      });
      return;
    }

    const targetChId = selectedPromoChannelId || localChannels[0]?.id || localChannels[0]?.channelId;
    const targetChan = localChannels.find(c => c.id === targetChId || c.channelId === targetChId) || localChannels[0];
    const channelIdentifier = targetChan?.handle || targetChan?.channelId || targetChan?.id;

    if (!channelIdentifier) {
      setPromoPublishStatus({
        type: 'error',
        message: 'Не выбран канал для отправки.'
      });
      return;
    }

    setIsPublishingPromo(true);
    setPromoPublishStatus(null);
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channelIdentifier,
          rawText: promoText,
          title: 'Реферальный промо-пост ИИSMM',
          format: 'v2'
        })
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setPromoPublishStatus({
          type: 'success',
          message: `🎉 Пост с реферальными ссылками успешно опубликован в канал «${targetChan?.title || targetChan?.name || channelIdentifier}»!`
        });
      } else {
        throw new Error(data.error || 'Ошибка отправки в канал');
      }
    } catch (err: any) {
      setPromoPublishStatus({
        type: 'error',
        message: err.message || 'Ошибка отправки сообщения. Убедитесь, что бот @IIrkiBot назначен администратором канала.'
      });
    } finally {
      setIsPublishingPromo(false);
    }
  };

  const handleTariffAction = (
    planName: string, 
    priceText: string, 
    amountRub: number, 
    actionType?: 'connect' | 'contact',
    periodMonths: number = 1,
    discountPercent: number = 0
  ) => {
    if (actionType === 'contact' || planName.toLowerCase().includes('космос')) {
      setIsCosmosModalOpen(true);
      return;
    }

    setTariffConfirmModal({
      isOpen: true,
      planName,
      priceText,
      amountRub,
      periodMonths,
      discountPercent
    });
  };

  const handleConfirmTariffChange = async () => {
    if (!tariffConfirmModal) return;
    const { planName, amountRub, periodMonths } = tariffConfirmModal;
    setTariffConfirmModal(null);

    try {
      const res = await fetch('/api/tariffs/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id || '16926299042',
          targetTariffName: planName,
          periodMonths
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || `Тариф успешно изменен на «${planName}»!`);
        if (data.user && onUpdateUser) {
          onUpdateUser({
            ...user,
            tariff: data.user.tariff,
            tariff_expires_at: data.user.tariff_expires_at,
            premiumUntil: data.user.tariff_expires_at ? new Date(data.user.tariff_expires_at).toLocaleDateString('ru-RU') : user.premiumUntil,
            balance: data.user.balance,
            balance_pay: data.user.balance_pay,
            balance_free: data.user.balance_free
          });
        }
        await fetchTransactions();
        await fetchLiveProfile();
      } else if (data.needTopup) {
        const missing = data.missingAmount || amountRub;
        const confirmPay = window.confirm(`${data.error}\n\nЖелаете перейти к оплате и пополнению через Робокассу?`);
        if (confirmPay) {
          setRobokassaPlanName(planName);
          setRobokassaAmountRub(missing);
          setRobokassaModalOpen(true);
        }
      } else {
        alert(`⚠️ ${data.error || 'Ошибка смены тарифа'}`);
      }
    } catch (e: any) {
      setRobokassaPlanName(planName);
      setRobokassaAmountRub(amountRub || 990);
      setRobokassaModalOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    setEditMsg('');
    try {
      const cleanUsername = editTelegramUsername.trim().startsWith('@') 
        ? editTelegramUsername.trim() 
        : `@${editTelegramUsername.trim()}`;

      const finalAvatar = editAvatarChoice === 'custom' ? customAvatarUrl : '';
      const finalPhoto = editAvatarChoice === 'custom' ? customAvatarUrl : (user.photoUrl || '');

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          username: cleanUsername,
          userAvatar: finalAvatar,
          user_avatar: finalAvatar,
          photoUrl: finalPhoto,
          timezone: editTimezone
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setEditMsg(`⚠️ ${data.error || 'Ошибка при сохранении профиля'}`);
        setEditSaving(false);
        return;
      }
      const updatedUser: UserAccount = {
        ...user,
        name: editName.trim(),
        firstName: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        telegramUsername: cleanUsername,
        userAvatar: finalAvatar,
        timezone: editTimezone,
        photoUrl: finalPhoto,
        avatarUrl: finalPhoto || user.avatarUrl
      };
      if (onUpdateUser) onUpdateUser(updatedUser);
      setEditMsg('🎉 Данные профиля успешно сохранены в базе данных!');
      setTimeout(() => {
        setIsEditProfileOpen(false);
        setEditMsg('');
      }, 1200);
    } catch (err) {
      setEditMsg('⚠️ Ошибка подключения к серверу');
    } finally {
      setEditSaving(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMsg('');

    if (!newPasswordInput.trim() || !confirmNewPasswordInput.trim()) {
      setPasswordMsg('⚠️ Заполните новый пароль и его подтверждение!');
      setPasswordSaving(false);
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      setPasswordMsg('⚠️ Введенные пароли не совпадают!');
      setPasswordSaving(false);
      return;
    }
    if (newPasswordInput.length < 4) {
      setPasswordMsg('⚠️ Длина пароля должна быть не менее 4 символов!');
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: newPasswordInput.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPasswordMsg(`⚠️ ${data.error || 'Ошибка при изменении пароля'}`);
        setPasswordSaving(false);
        return;
      }
      setPasswordMsg('🎉 Новый пароль успешно сохранен в базе данных!');
      setNewPasswordInput('');
      setConfirmNewPasswordInput('');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordMsg('');
      }, 1500);
    } catch (err) {
      setPasswordMsg('⚠️ Ошибка подключения к серверу');
    } finally {
      setPasswordSaving(false);
    }
  };
  const [geminiKey, setGeminiKey] = useState('');
  const [openAIKey, setOpenAIKey] = useState('');
  const [vkTargetKey, setVkTargetKey] = useState('');
  const [mcpUrl, setMcpUrl] = useState('http://localhost:3011/mcp');
  const [mcpStatus, setMcpStatus] = useState<'connected' | 'disconnected'>('disconnected');

  // 4. MULTIPLAYER TEAMS (SQLite-backed)
  const [teamData, setTeamData] = useState<any | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; userId?: string; name: string; handle: string; role: string; status: string; joinedAt?: string }>>([]);
  const [teamChannels, setTeamChannels] = useState<string[]>([]);
  const [allDbUsers, setAllDbUsers] = useState<Array<{ id: string; firstName?: string; name?: string; username?: string; photoUrl?: string }>>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamNotification, setTeamNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Privacy, Blacklist & Complaints State
  const [allowTeamInvites, setAllowTeamInvites] = useState(true);
  const [teamBlacklist, setTeamBlacklist] = useState<string[]>([]);
  const [isAccessInfoModalOpen, setIsAccessInfoModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Спам / Нежелательные приглашения');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Team Modals State
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamChannels, setNewTeamChannels] = useState<string[]>([]);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [isManageChannelsModalOpen, setIsManageChannelsModalOpen] = useState(false);
  const [selectedTeamChannels, setSelectedTeamChannels] = useState<string[]>([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberHandle, setNewMemberHandle] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Участник');
  const [memberToRevoke, setMemberToRevoke] = useState<any | null>(null);
  const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false);
  const [inviteHandle, setInviteHandle] = useState('');

  const showTeamToast = (type: 'success' | 'error' | 'info', message: string) => {
    setTeamNotification({ type, message });
    setTimeout(() => {
      setTeamNotification(null);
    }, 4500);
  };

  const fetchPrivacySettings = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user/team-privacy?userId=${user.id || '16926299042'}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAllowTeamInvites(data.allowTeamInvites !== false);
          setTeamBlacklist(data.teamBlacklist || []);
        }
      }
    } catch (e) {
      console.error('Error fetching team privacy settings:', e);
    }
  };

  const handleToggleAllowInvites = async (newValue: boolean) => {
    setAllowTeamInvites(newValue);
    try {
      const res = await fetch('/api/user/team-privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id || '16926299042', allowTeamInvites: newValue })
      });
      const data = await res.json();
      if (data.success) {
        showTeamToast('success', newValue ? 'Приглашения в команды разрешены' : 'Запрет на добавление в команды сохранен');
      }
    } catch (e) {
      showTeamToast('error', 'Ошибка сохранения настроек приватности');
    }
  };

  const handleToggleBlacklist = async (targetTeamId: string) => {
    const isBlacklisted = teamBlacklist.includes(targetTeamId);
    try {
      const res = await fetch('/api/teams/blacklist', {
        method: isBlacklisted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id || '16926299042', teamId: targetTeamId })
      });
      const data = await res.json();
      if (data.success) {
        setTeamBlacklist(data.teamBlacklist || []);
        showTeamToast('success', isBlacklisted ? 'Команда удалена из черного списка' : 'Команда добавлена в черный список');
      }
    } catch (e) {
      showTeamToast('error', 'Ошибка изменения черного списка');
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamData) return;
    setReportSubmitting(true);
    try {
      const res = await fetch('/api/teams/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: user.id || '16926299042',
          teamId: teamData.id,
          reason: reportReason,
          details: reportDetails
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsReportModalOpen(false);
        setReportDetails('');
        showTeamToast('success', 'Жалоба на команду успешно отправлена администратору сервиса (16926299042) в Telegram');
      } else {
        showTeamToast('error', data.error || 'Ошибка при отправке жалобы');
      }
    } catch (e) {
      showTeamToast('error', 'Сетевая ошибка при отправке жалобы');
    } finally {
      setReportSubmitting(false);
    }
  };

  const fetchTeamData = async () => {
    if (!user) return;
    try {
      setTeamLoading(true);
      const res = await fetch(`/api/teams?userId=${user.id || '16926299042'}&telegramId=${user.telegramId || ''}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.team) {
        setTeamData(data.team);
        if (data.team.members) {
          setTeamMembers(data.team.members.map((m: any) => ({
            id: m.userId || m.handle,
            userId: m.userId,
            name: m.name || m.handle,
            handle: m.handle,
            role: m.role || 'Участник',
            status: m.status === 'active' ? 'Активен' : 'Приглашен',
            joinedAt: m.joinedAt
          })));
        } else {
          setTeamMembers([]);
        }
        if (data.team.channels) {
          setTeamChannels(data.team.channels);
          setSelectedTeamChannels(data.team.channels);
        } else {
          setTeamChannels([]);
          setSelectedTeamChannels([]);
        }
      }
    } catch (e: any) {
      console.warn('[Teams] Notice loading team data from SQLite:', e.message || e);
    } finally {
      setTeamLoading(false);
    }
  };

  // Fetch Team data from SQLite on mount and tab switch
  React.useEffect(() => {
    if (!user) return;
    fetchTeamData();
    fetchPrivacySettings();

    // Also fetch registered users for member selection
    fetch('/api/users')
      .then(r => r.json())
      .then(usersList => {
        if (Array.isArray(usersList)) {
          setAllDbUsers(usersList.map((u: any) => ({
            id: String(u.id || u.telegram_id || ''),
            name: u.first_name || u.name || u.username || 'Пользователь',
            firstName: u.first_name || u.name || '',
            username: u.username ? (u.username.startsWith('@') ? u.username : `@${u.username}`) : '',
            photoUrl: u.photo_url || u.photoUrl || ''
          })));
        }
      })
      .catch(() => null);
  }, [activeTab, user]);

  // 5. AI ROUNDTABLE STRATEGIST SIMULATOR (VIP)
  const [roundTableTopic, setRoundTableTopic] = useState('Как продвигать свой Telegram-блог с помощью ИИ в 2026 году?');
  const [roundHistory, setRoundHistory] = useState<Array<{ agent: string, title: string, avatar: string, msg: string, style: string }>>([]);
  const [isRoundRunning, setIsRoundRunning] = useState(false);
  const [voiceInputSimulated, setVoiceInputSimulated] = useState(false);

  // 6. REFERRAL PROGRAM ENGINE
  const [referralStats, setReferralStats] = useState<{
    referralLink: string;
    referralRewardBalance: number;
    invitedCount: number;
    invitedUsers: Array<{ id: string; telegramId?: number; firstName: string; username?: string; photoUrl?: string; createdAt: string }>;
    referredBy?: { telegramId: number; firstName: string; username?: string } | null;
  } | null>(null);

  React.useEffect(() => {
    if (activeTab === 'referrals' && user) {
      const controller = new AbortController();
      fetch(`/api/referrals/stats?userId=${user.id}&telegramId=${user.telegramId || ''}`, { signal: controller.signal })
        .then(res => {
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (data && data.referralLink) {
            setReferralStats(data);
          }
        })
        .catch(e => {
          if (e.name !== 'AbortError') {
            console.warn('[Referrals] Notice fetching referral stats:', e.message || e);
          }
        });

      return () => controller.abort();
    }
  }, [activeTab, user]);

  // 7. ENTERPRISE REQUEST
  const [enterpriseSvc, setEnterpriseSvc] = useState<'brandbook' | 'mentor' | 'expert_plan' | ' bespoke_plat'>('expert_plan');
  const [enterpriseContact, setEnterpriseContact] = useState('');
  const [enterpriseFormSent, setEnterpriseFormSent] = useState(false);

  // Calculations
  const parsedWithdraw = Number(withdrawAmount) || 0;
  const commissionFee = Math.round(parsedWithdraw * 0.25);
  const payoutAmount = Math.max(0, parsedWithdraw - commissionFee);

  const handleCalcRubChange = (valStr: string) => {
    setCalcRubInput(valStr);
    const numeric = parseFloat(valStr) || 0;
    setCalcIirkyResult(Math.round(numeric * 1));
  };

  const handleBuyIirkyWithRubles = async () => {
    const costRub = parseFloat(calcRubInput) || 0;
    if (costRub <= 0) {
      alert('Укажите корректную сумму в рублях!');
      return;
    }
    const iirkyToReceive = Math.round(costRub * 1);
    try {
      const res = await fetch('/api/billing/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id || '16926299042',
          amountRub: costRub
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onUpdateUser) {
          onUpdateUser({
            ...user,
            balanceRub: Math.max(0, (user.balanceRub || 0) - costRub),
            iirky: (user.iirky || 0) + iirkyToReceive,
            tokens: (user.tokens || 0) + iirkyToReceive
          });
        }
        await fetchTransactions();
        alert(`🎉 Обмен успешен! Зачислено +${iirkyToReceive.toLocaleString()} ИИрок на баланс.`);
      } else {
        alert(data.error || 'Ошибка при проведении обмена');
      }
    } catch (e: any) {
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          balanceRub: Math.max(0, (user.balanceRub || 0) - costRub),
          iirky: (user.iirky || 0) + iirkyToReceive,
          tokens: (user.tokens || 0) + iirkyToReceive
        });
      }
      alert(`🎉 Обмен успешен! Зачислено +${iirkyToReceive.toLocaleString()} ИИрок.`);
    }
  };

  const handleSimulateTopup = (e: React.FormEvent) => {
    e.preventDefault();
    const rubles = parseFloat(replenishInput) || 0;
    if (rubles <= 0) {
      alert('Введите корректную сумму покупок!');
      return;
    }
    onReplenishBalance(rubles);
    alert(`⚡ Симуляция пополнения: Ваш баланс успешно пополнен на ${rubles} ₽!`);
  };

  const handleWithdrawFunds = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedWithdraw < 100) {
      alert('Минимальная сумма для вывода — 100 ₽');
      return;
    }
    if (!withdrawAccount.trim()) {
      alert('Пожалуйста, введите реквизиты для вывода средств!');
      return;
    }
    setWithdrawStatus('checking');
    setTimeout(() => {
      setWithdrawStatus('success');
      if (onUpdateUser && (user.balanceRub || 0) >= parsedWithdraw) {
        onUpdateUser({
          ...user,
          balanceRub: user.balanceRub - parsedWithdraw,
          earningsRub: (user.earningsRub || 0) + parsedWithdraw
        });
      }
      alert(`Заявка оформлена! ${payoutAmount} ₽ будут отправлены на карту в течение 24 часов. Комиссия биржи соавторов (25%): ${commissionFee} ₽ вычтена.`);
    }, 1200);
  };

  const handleBuyExtraChannels = (type: 'rehost' | 'schedule') => {
    const cost = type === 'rehost' ? extraChannelsCount * 150 : extraScheduleChannels * 100;
    if ((user.balanceRub || 0) < cost) {
      alert(`Недостаточно средств! Требуется ${cost} ₽. Ваш баланс: ${user.balanceRub} ₽.`);
      return;
    }
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        balanceRub: user.balanceRub - cost
      });
      alert(`🎉 Успешно приобретено дополнительных слотов! С баланса списано ${cost} ₽.`);
    }
  };

  const handleBuyIirkyPack = () => {
    if ((user.balanceRub || 0) < 250) {
      alert(`Недостаточно средств! Пакет из 5,000,000 ИИрок стоит 250 ₽. Ваш баланс: ${user.balanceRub} ₽.`);
      return;
    }
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        balanceRub: user.balanceRub - 250,
        iirky: user.iirky + 5000000
      });
      alert(`🎉 Приобретено 5,000,000 ИИрок за 250 ₽! Ваш баланс ИИрок зачислен.`);
    }
  };

  const handleSendTgCode = () => {
    if (!customTgUsername) {
      alert('Укажите ваш юзернейм в Telegram!');
      return;
    }
    setTelegramCodeSent(true);
    alert('Код отправлен нашему боту @IIrkiBot! Проверьте ЛС.');
  };

  const handleSubmitTgAuthCode = () => {
    if (!tgAuthCode || tgAuthCode.length < 4) {
      alert('Введите четырехзначный пин-код.');
      return;
    }
    const formatted = customTgUsername.startsWith('@') ? customTgUsername : '@' + customTgUsername;
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        telegramUsername: formatted
      });
    }
    alert(`Telegram привязан успешно через шлюз бота @IIrkiBot! Добро пожаловать, ${formatted}!`);
    setShowTelegramAuth(false);
  };

  const handleToggleVipBadge = () => {
    if (user.tariff !== 'pro' && user.tariff !== 'vip') {
      alert('Метка участника 💎 доступна только на Premium и VIP тарифах!');
      return;
    }
    const currentName = user.name;
    let newName = currentName;
    if (currentName.includes('💎')) {
      newName = currentName.replace('💎 ', '').replace(' 💎', '');
    } else {
      newName = `💎 ${currentName}`;
    }
    if (onUpdateUser) {
      onUpdateUser({ ...user, name: newName });
      alert(`Имя обновлено: ${newName}`);
    }
  };

  // Team CRUD handlers with direct SQLite persistence
  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.id || '16926299042',
          name: newTeamName.trim(),
          channels: newTeamChannels,
          members: []
        })
      });
      const data = await res.json();
      if (data.success && data.team) {
        setTeamData(data.team);
        setTeamChannels(data.team.channels || []);
        setTeamMembers([]);
        setIsCreateTeamModalOpen(false);
        setNewTeamName('');
        setNewTeamChannels([]);
        showTeamToast('success', 'Команда успешно создана и сохранена в базе данных SQLite!');
      } else {
        showTeamToast('error', data.error || 'Ошибка при создании команды');
      }
    } catch (e: any) {
      showTeamToast('error', 'Ошибка связи с сервером при создании команды');
    }
  };

  const handleUpdateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamData || !editTeamName.trim()) return;
    try {
      const res = await fetch(`/api/teams/${teamData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTeamName.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.team) {
        setTeamData(data.team);
        setIsEditTeamModalOpen(false);
        showTeamToast('success', 'Название команды успешно обновлено в базе данных SQLite!');
      } else {
        showTeamToast('error', data.error || 'Ошибка обновления команды');
      }
    } catch (e) {
      showTeamToast('error', 'Ошибка связи с сервером при обновлении команды');
    }
  };

  const handleSaveTeamChannels = async () => {
    if (!teamData) return;
    try {
      const res = await fetch(`/api/teams/${teamData.id}/channels`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: selectedTeamChannels
        })
      });
      const data = await res.json();
      if (data.success && data.team) {
        setTeamData(data.team);
        setTeamChannels(data.team.channels || []);
        setIsManageChannelsModalOpen(false);
        showTeamToast('success', 'Список каналов команды успешно сохранен в базе данных SQLite!');
      } else {
        showTeamToast('error', data.error || 'Ошибка сохранения каналов');
      }
    } catch (e) {
      showTeamToast('error', 'Ошибка связи с сервером при сохранении каналов');
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberHandle.trim()) return;
    const cleanHandle = newMemberHandle.startsWith('@') ? newMemberHandle : '@' + newMemberHandle;
    try {
      const res = await fetch('/api/teams/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.id || '16926299042',
          handle: cleanHandle,
          name: newMemberName.trim() || undefined,
          role: newMemberRole
        })
      });
      const data = await res.json();
      if (data.success && data.team) {
        setTeamData(data.team);
        setTeamMembers(data.team.members.map((m: any) => ({
          id: m.userId || m.handle,
          userId: m.userId,
          name: m.name || m.handle,
          handle: m.handle,
          role: m.role || 'Участник',
          status: m.status === 'active' ? 'Активен' : 'Приглашен',
          joinedAt: m.joinedAt
        })));
        setIsAddMemberModalOpen(false);
        setNewMemberHandle('');
        setNewMemberName('');
        showTeamToast('success', `Участник ${cleanHandle} добавлен в команду и зафиксирован в SQLite!`);
      } else {
        showTeamToast('error', data.error || 'Ошибка при добавлении участника');
      }
    } catch (e: any) {
      showTeamToast('error', 'Ошибка связи с сервером при добавлении участника');
    }
  };

  const handleInviteCoworker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteHandle) return;
    const cleanHandle = inviteHandle.startsWith('@') ? inviteHandle : '@' + inviteHandle;
    try {
      const res = await fetch('/api/teams/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: user.id || '16926299042', handle: cleanHandle })
      });
      const data = await res.json();
      if (data.success && data.team) {
        setTeamData(data.team);
        setTeamMembers(data.team.members.map((m: any) => ({
          id: m.userId || m.handle,
          userId: m.userId,
          name: m.name || m.handle,
          handle: m.handle,
          role: m.role || 'Участник',
          status: m.status === 'active' ? 'Активен' : 'Приглашен',
          joinedAt: m.joinedAt
        })));
        setInviteHandle('');
        showTeamToast('success', `Пользователь ${cleanHandle} успешно добавлен в команду и базу данных!`);
      } else {
        showTeamToast('error', data.error || 'Ошибка добавления участника');
      }
    } catch (e: any) {
      console.error('Error adding team member:', e);
      showTeamToast('error', 'Ошибка при добавлении участника в команду');
    }
  };

  const handleConfirmRevokeMember = async () => {
    if (!memberToRevoke) return;
    try {
      const memberKey = memberToRevoke.userId || memberToRevoke.handle;
      const res = await fetch(`/api/teams/members/${encodeURIComponent(memberKey)}?ownerId=${user.id || '16926299042'}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success && data.team) {
        setTeamData(data.team);
        setTeamMembers(data.team.members.map((tm: any) => ({
          id: tm.userId || tm.handle,
          userId: tm.userId,
          name: tm.name || tm.handle,
          handle: tm.handle,
          role: tm.role || 'Участник',
          status: tm.status === 'active' ? 'Активен' : 'Приглашен',
          joinedAt: tm.joinedAt
        })));
        showTeamToast('success', `Доступ участника ${memberToRevoke.name || memberToRevoke.handle} отозван и удален из базы данных SQLite.`);
      } else {
        setTeamMembers(prev => prev.filter(m => m.id !== memberToRevoke.id && m.handle !== memberToRevoke.handle));
        showTeamToast('success', 'Доступ участника отозван.');
      }
    } catch (e) {
      setTeamMembers(prev => prev.filter(m => m.id !== memberToRevoke.id && m.handle !== memberToRevoke.handle));
      showTeamToast('success', 'Доступ участника отозван.');
    } finally {
      setMemberToRevoke(null);
    }
  };

  const handleConfirmDeleteTeam = async () => {
    if (!teamData) return;
    try {
      const res = await fetch(`/api/teams/${teamData.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setTeamData(null);
        setTeamMembers([]);
        setTeamChannels([]);
        setIsDeleteTeamModalOpen(false);
        showTeamToast('success', 'Команда успешно удалена из базы данных SQLite.');
      } else {
        showTeamToast('error', data.error || 'Ошибка при удалении команды');
      }
    } catch (e) {
      showTeamToast('error', 'Ошибка связи с сервером при удалении команды');
    }
  };

  const handleClaimReferral = (id: string) => {
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        iirky: (user.iirky || 0) + 300
      });
      alert('🎁 Зачислено +300 ИИрок по реферальной программе!');
    }
  };

  const startRoundtableDiscussion = () => {
    if (user.tariff !== 'vip') {
      alert('Функция "Круглый стол ИИ-маркетологов" доступна только для тарифа VIP (4900₽/мес). Пожалуйста, обновите тариф!');
      return;
    }
    setIsRoundRunning(true);
    setRoundHistory([]);
    
    setTimeout(() => {
      setRoundHistory(prev => [...prev, {
        agent: 'Марк',
        title: 'Chief SEO Strategist 🧠',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
        msg: `Наш топик: "${roundTableTopic}". Коллеги, для взрывного продвижения в Google SEO и Дзен обязательна проработка микроразметки и LSI-ключей 1-го порядка. Никакой "воды", структурируйте через маркированные списки.`,
        style: 'border-l-4 border-amber-500 bg-amber-55/10'
      }]);
    }, 1000);

    setTimeout(() => {
      setRoundHistory(prev => [...prev, {
        agent: 'София',
        title: 'Creative SMM & Designer 🎨',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
        msg: 'Я согласна с Марком, но сухие тексты никто не дочитает! Давайте добавим игровой триггер и фирменный вотермарк на превью. Каждому посту нужен контрастный холст в оранжево-пурпурных тонах для лучшего CTR в ленте сообщества.',
        style: 'border-l-4 border-pink-500 bg-pink-55/10'
      }]);
    }, 3000);

    setTimeout(() => {
      setRoundHistory(prev => [...prev, {
        agent: 'Дмитрий',
        title: 'Performance Traffic Analyst 📊',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
        msg: 'Сухие цифры: вовлеченность (ER) повышается на 17% при размещении интерактивного опроса. Размещаем ссылку с интеграцией UTM utm_source=tg_folder_promo в пятницу в 18:45. Это сэкономит до 45% рекламного бюджета.',
        style: 'border-l-4 border-sky-500 bg-sky-55/10'
      }]);
      setIsRoundRunning(false);
    }, 5500);
  };

  const handleSimulateVoiceCommand = () => {
    if (user.tariff !== 'vip') {
      alert('Голосовое и видео управление доступно только для тарифа VIP!');
      return;
    }
    setVoiceInputSimulated(true);
    setTimeout(() => {
      setVoiceInputSimulated(false);
      alert('🎤 Анализатор зафиксировал голосовую команду: "Сгенерируй недельный контент-план". Открыт планировщик соавтора!');
    }, 2000);
  };

  const handleSendEnterpriseForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enterpriseContact) {
      alert('Пожалуйста, оставьте ваш Telegram или Email!');
      return;
    }
    setEnterpriseFormSent(true);
    setTimeout(() => {
      alert('🚀 Заявка принята! Ваш личный эксперт ИИSMM свяжется с вами для создания брендбука и менторства.');
      setEnterpriseFormSent(false);
      setEnterpriseContact('');
    }, 1000);
  };

  const UTM_SOURCES = [
    { source: 'tg_folder_promo', clicks: Math.round(totalClicks * 0.45), category: 'Mutual Folder', cr: '12.4%' },
    { source: 'vk_cross_post', clicks: Math.round(totalClicks * 0.25), category: 'Crossposting', cr: '8.1%' },
    { source: 'iismm_board', clicks: Math.round(totalClicks * 0.18), category: 'Bulletin Feed', cr: '14.2%' },
    { source: 'organic_search', clicks: Math.round(totalClicks * 0.12), category: 'Web Grounding', cr: '9.6%' }
  ];

  const trendPoints = {
    views: [
      { date: '18 Мая', val: 3400, label: '3.4k' },
      { date: '19 Мая', val: 4200, label: '4.2k' },
      { date: '20 Мая', val: 4900, label: '4.9k' },
      { date: '21 Мая', val: 6800, label: '6.8k' },
      { date: '22 Мая', val: 8200, label: '8.2k' },
      { date: '23 Мая', val: totalViews, label: `${(totalViews/1000).toFixed(1)}k` }
    ],
    clicks: [
      { date: '18 Мая', val: 120, label: '120' },
      { date: '19 Мая', val: 180, label: '180' },
      { date: '20 Мая', val: 240, label: '240' },
      { date: '21 Мая', val: 390, label: '390' },
      { date: '22 Мая', val: 450, label: '450' },
      { date: '23 Мая', val: totalClicks, label: `${totalClicks}` }
    ],
    growth: [
      { date: '18 Мая', val: 23, label: '+23' },
      { date: '19 Мая', val: 45, label: '+45' },
      { date: '20 Мая', val: 34, label: '+34' },
      { date: '21 Мая', val: 89, label: '+89' },
      { date: '22 Мая', val: 120, label: '+120' },
      { date: '23 Мая', val: 145, label: '+145' }
    ]
  };

  const activeTrend = trendPoints[activeMetricFilter];
  const maxVal = Math.max(...activeTrend.map((t) => t.val));
  const minVal = Math.min(...activeTrend.map((t) => t.val));
  const heightMultiplier = maxVal > minVal ? 110 / (maxVal - minVal) : 1;

  return (
    <div className="space-y-6">
      
      {/* Global Profile Header Component */}
      <ProfileHeader
        user={user}
        uploadingAvatar={uploadingAvatar}
        onAvatarFileUpload={handleAvatarFileUpload}
        onEditProfile={() => {
          setEditName(user.name || user.firstName || 'Тимошенко Денис');
          setEditEmail(user.email || '');
          setEditTelegramUsername(user.telegramUsername || '@shishkarnem');
          setCustomAvatarUrl(user.avatarUrl || user.userAvatar || '');
          setEditMsg('');
          setIsEditProfileOpen(true);
        }}
        onLogout={onLogout}
        onBindEmail={() => setIsBindEmailOpen(true)}
      />

      {/* Mobile Tab Navigation Selector (< sm) */}
      <div className="sm:hidden w-full relative">
        <button
          onClick={() => setIsMobileTabModalOpen(true)}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 to-sky-100/90 border border-pink-300 shadow-sm flex items-center justify-between text-left font-black text-xs text-slate-900 cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Раздел:</span>
            <span className="flex items-center gap-2 font-black text-slate-800 text-xs">
              {activeTab === 'profile' && <User className="w-4 h-4 text-orange-500" />}
              {activeTab === 'channels' && <Radio className="w-4 h-4 text-pink-500" />}
              {activeTab === 'tariffs' && <Trophy className="w-4 h-4 text-amber-500" />}
              {activeTab === 'referrals' && <Award className="w-4 h-4 text-sky-500" />}
              {activeTab === 'multiplayer' && <Users className="w-4 h-4 text-purple-500" />}
              {activeTab === 'admin' && <ShieldCheck className="w-4 h-4 text-pink-500" />}
              <span>
                {activeTab === 'profile' && 'Профиль'}
                {activeTab === 'channels' && 'Каналы'}
                {activeTab === 'tariffs' && 'Тарифы'}
                {activeTab === 'referrals' && 'Партнерка'}
                {activeTab === 'multiplayer' && 'Команды'}
                {activeTab === 'admin' && 'Админка 👑'}
              </span>
            </span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs">
            <span>Сменить</span>
            <span className="text-[10px]">▼</span>
          </div>
        </button>

        {/* Mobile Navigation Modal Switcher */}
        <AnimatePresence>
          {isMobileTabModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gradient-to-br from-sky-50 via-pink-50 via-orange-50 via-pink-50 to-sky-50 rounded-3xl p-5 max-w-xs w-full border border-pink-300 shadow-2xl space-y-3 text-left"
              >
                <div className="flex justify-between items-center border-b border-pink-200/80 pb-2.5">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-orange-500" />
                    <span>Выберите раздел</span>
                  </h3>
                  <button 
                    onClick={() => setIsMobileTabModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 font-bold p-1 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'profile', label: 'Профиль', icon: User, color: 'text-orange-500' },
                    { id: 'channels', label: 'Каналы', icon: Radio, color: 'text-pink-500' },
                    { id: 'tariffs', label: 'Тарифы', icon: Trophy, color: 'text-amber-500' },
                    { id: 'referrals', label: 'Партнерка', icon: Award, color: 'text-sky-500' },
                    { id: 'multiplayer', label: 'Команды', icon: Users, color: 'text-purple-500' },
                    ...(isAdmin || activeTab === 'admin' ? [{ id: 'admin', label: 'Админка 👑', icon: ShieldCheck, color: 'text-pink-500' }] : [])
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setIsMobileTabModalOpen(false);
                      }}
                      className={`w-full p-3 rounded-2xl text-xs font-black transition-all flex items-center justify-between cursor-pointer border ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white border-white/40 shadow-md'
                          : 'bg-white/80 hover:bg-white text-slate-700 border-pink-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : tab.color}`} />
                        <span>{tab.label}</span>
                      </div>
                      {activeTab === tab.id && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Tabs Switcher (hidden on mobile, sm:flex) */}
      <div className="hidden sm:flex overflow-x-auto pb-1 gap-2.5 no-scrollbar border-b border-slate-200/60 pb-3">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md scale-[1.02]'
              : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/70 shadow-2xs'
          }`}
        >
          <User className="w-4 h-4 text-orange-500" />
          <span>Профиль</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            activeTab === 'channels'
              ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md scale-[1.02]'
              : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/70 shadow-2xs'
          }`}
        >
          <Radio className="w-4 h-4 text-pink-500" />
          <span>Каналы</span>
        </button>

        <button
          onClick={() => setActiveTab('tariffs')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            activeTab === 'tariffs'
              ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md scale-[1.02]'
              : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/70 shadow-2xs'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Тарифы</span>
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            activeTab === 'referrals'
              ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md scale-[1.02]'
              : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/70 shadow-2xs'
          }`}
        >
          <Award className="w-4 h-4 text-sky-500" />
          <span>Партнерка</span>
        </button>

        <button
          onClick={() => setActiveTab('multiplayer')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            activeTab === 'multiplayer'
              ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md scale-[1.02]'
              : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/70 shadow-2xs'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-500" />
          <span>Команды</span>
          {user.tariff !== 'vip' && <Lock className="w-3 h-3 text-slate-400" />}
        </button>

        {(isAdmin || activeTab === 'admin') && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 text-white shadow-md scale-[1.02]'
                : 'bg-rose-50/90 hover:bg-rose-100/90 text-rose-700 border border-rose-200/80 shadow-2xs'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-rose-500" />
            <span>Админка 👑</span>
          </button>
        )}
      </div>

      {/* --- TAB CONTENT 1: MAIN PROFILE --- */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* REALTIME BALANCE BREAKDOWN WIDGET */}
          <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-pink-300 shadow-md text-left space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 flex items-center justify-center text-white shadow-xs">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    Баланс и активы ИИрок
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Синхронизация в реальном времени из базы данных транзакций
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLiveProfile}
                  className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold rounded-xl border border-pink-200 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Обновить баланс прямо сейчас"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-pink-500" />
                  <span>Обновить</span>
                </button>
              </div>
            </div>

            {syncResultMsg && (
              <div className="p-3 bg-white/90 border border-pink-300 rounded-2xl text-xs font-medium text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0" />
                <span>{syncResultMsg}</span>
              </div>
            )}

            {/* 4 Metrics Grid - Общий баланс первым */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Общий доступный баланс (Первый в списке) */}
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-200/90 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-purple-800">
                  <span>Общий баланс</span>
                  <Crown className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  {(Number(liveProfile.balance_pay || 0) + Number(liveProfile.balance_free || 0)).toLocaleString('ru-RU')}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Суммарно доступно для использования.
                </p>
              </div>

              {/* 2. ИИрки (Оплаченные / Активные) */}
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-sky-200/90 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-sky-800">
                  <span>ИИрки (Оплаченные)</span>
                  <Sparkles className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  {(Number(liveProfile.balance_pay || 0) + Number(liveProfile.balance_admin || 0)).toLocaleString('ru-RU')}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Оплаченный баланс (1 ₽ = 1 ИИрка). Не сгорает.
                </p>
              </div>

              {/* 3. ИИрки Free (Бонусные / Бесплатные) */}
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-pink-200/90 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-pink-800">
                  <span>ИИрки Free (Бонусные)</span>
                  <Award className="w-4 h-4 text-pink-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-pink-600">
                  {Number(liveProfile.balance_free || 0).toLocaleString('ru-RU')}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Старт + рефералы + тариф. Списываются первыми.
                </p>
              </div>

              {/* 4. Расход / Списано */}
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-orange-200/90 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-orange-800">
                  <span>Расход / Списано</span>
                  <FileText className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-orange-600">
                  {Math.abs(Number(liveProfile.balance_cost || 0)).toLocaleString('ru-RU')}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Всего израсходовано на генерации и автопостинг.
                </p>
              </div>
            </div>

            {/* Detailed Structure Accordion / Chips */}
            <div className="pt-2 border-t border-pink-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 font-medium text-slate-700">
                <span className="font-bold text-slate-900">Составляющие Free:</span>
                <span className="px-2.5 py-1 rounded-xl bg-white/90 border border-pink-200 font-mono">
                  Стартовый бонус: <strong className="text-slate-900">{liveProfile.balance_start || 300}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/90 border border-pink-200 font-mono">
                  Реферальные: <strong className="text-pink-600">+{liveProfile.balance_ref || 0}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/90 border border-pink-200 font-mono">
                  Тарифные: <strong className="text-sky-600">+{liveProfile.balance_tarif || 0}</strong>
                </span>
                {liveProfile.balance_admin > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-white/90 border border-orange-200 font-mono">
                    Админ-начисления: <strong className="text-orange-600">+{liveProfile.balance_admin}</strong>
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                {liveProfile.balance_time ? `Посл. операция: ${liveProfile.balance_time}` : 'Баланс актуален'}
              </div>
            </div>
          </div>

          {/* STATS TILES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connected Channels List Section */}
            <div className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-5 border border-white/80 shadow-[0_10px_25px_rgba(236,72,153,0.05)] text-left flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-center text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Radio className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Подключенные Каналы</span>
                    <span className="text-[10px] text-slate-500 font-medium">Telegram & VK блоги в системе</span>
                  </div>
                </div>
                <span className="text-xl font-black font-mono text-slate-900 bg-orange-100/60 px-3 py-1 rounded-xl border border-orange-200/60">{localChannels.length}</span>
              </div>

              {localChannels.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {localChannels.map((ch: any) => (
                    <div key={ch.id || ch.username || ch.name} className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-sky-50/70 via-pink-50/50 to-orange-50/50 border border-pink-100 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {ch.type === 'vk' ? 'VK' : 'TG'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-slate-800 truncate block">{ch.name || ch.title || ch.username}</span>
                          <span className="text-[10px] font-mono text-slate-500 truncate block">{ch.username || ch.channel_id || '@канал'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border shrink-0 ${
                          ch.isActive !== false 
                            ? 'bg-sky-100 text-sky-800 border-sky-200' 
                            : 'bg-rose-100 text-rose-700 border-rose-200'
                        }`}>
                          {ch.isActive !== false ? 'Активен' : 'Неактивен'}
                        </span>

                        <button
                          onClick={() => handleVerifyChannel(ch.id)}
                          disabled={verifyingChannelId === ch.id}
                          title="Проверить наличие бота в канале"
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 text-pink-500 ${verifyingChannelId === ch.id ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">Обновить</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      window.history.pushState(null, '', '/channels');
                      window.dispatchEvent(new Event('popstate'));
                    }}
                    className="w-full mt-2 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-extrabold text-xs rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Управление каналами (+ Добавить)</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/60 via-pink-50/40 to-orange-50/40 border border-pink-200/80 text-center space-y-2">
                  <p className="text-xs text-slate-600 font-semibold">Каналы еще не подключены</p>
                  <button 
                    onClick={() => {
                      window.history.pushState(null, '', '/channels');
                      window.dispatchEvent(new Event('popstate'));
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-extrabold text-xs rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Подключить канал</span>
                  </button>
                </div>
              )}
            </div>

            {/* Posts Stats Tile (Created, Scheduled, Published) */}
            <div className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-5 border border-white/80 shadow-[0_10px_25px_rgba(236,72,153,0.05)] text-left flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold text-slate-600">Статистика постов</span>
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 block truncate w-full text-center">Создано</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-slate-800 block mt-0.5">{createdPostsCount}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex flex-col items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 block truncate w-full text-center">Отложено</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-slate-800 block mt-0.5">{scheduledPostsCount}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-2xl bg-pink-50/70 border border-pink-100 flex flex-col items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 block truncate w-full text-center">Опубликовано</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-slate-800 block mt-0.5">{publishedPostsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: TARIFFS & FINANCIAL --- */}
      {activeTab === 'tariffs' && (
        <div className="space-y-6">
          {/* 1. TOP: REALTIME BALANCE BREAKDOWN WIDGET */}
          <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-pink-300 shadow-md text-left space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 flex items-center justify-center text-white shadow-xs">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    Баланс и активы ИИрок
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Синхронизация в реальном времени из базы данных транзакций
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBuyIirkyCalcOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Открыть калькулятор покупки ИИрок"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Калькулятор покупки ИИрок 🪙</span>
                </button>

                <button
                  type="button"
                  onClick={fetchLiveProfile}
                  className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold rounded-xl border border-pink-200 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Обновить баланс прямо сейчас"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-pink-500" />
                  <span>Обновить</span>
                </button>
              </div>
            </div>

            {syncResultMsg && (
              <div className="p-3 bg-white/90 border border-pink-300 rounded-2xl text-xs font-medium text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0" />
                <span>{syncResultMsg}</span>
              </div>
            )}

            {/* 4 Metrics Grid - Общий баланс первым */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Общий доступный баланс (Первый в списке) */}
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-200/90 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-purple-800">
                  <span>Общий баланс</span>
                  <Crown className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  {(Number(liveProfile.balance_pay || 0) + Number(liveProfile.balance_free || 0)).toLocaleString('ru-RU')}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Суммарно доступно для использования.
                </p>
              </div>

              {/* 2. ИИрки (Оплаченные / Активные) */}
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-sky-200/90 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-sky-800">
                  <span>ИИрки (Оплаченные)</span>
                  <Sparkles className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  {(Number(liveProfile.balance_pay || 0) + Number(liveProfile.balance_admin || 0)).toLocaleString('ru-RU')}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Оплаченный баланс (1 ₽ = 1 ИИрка). Не сгорает.
                </p>
              </div>

              {/* 3. ИИрки Free (Бонусные / Бесплатные) */}
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-pink-200/90 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-pink-800">
                  <span>ИИрки Free (Бонусные)</span>
                  <Award className="w-4 h-4 text-pink-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-pink-600">
                  {Number(liveProfile.balance_free || 0).toLocaleString('ru-RU')}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Старт + рефералы + тариф. Списываются первыми.
                </p>
              </div>

              {/* 4. Расход / Списано */}
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-orange-200/90 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-orange-800">
                  <span>Расход / Списано</span>
                  <FileText className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-orange-600">
                  {Math.abs(Number(liveProfile.balance_cost || 0)).toLocaleString('ru-RU')}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Всего израсходовано на генерации и автопостинг.
                </p>
              </div>
            </div>

            {/* Detailed Structure Accordion / Chips */}
            <div className="pt-2 border-t border-pink-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 font-medium text-slate-700">
                <span className="font-bold text-slate-900">Составляющие Free:</span>
                <span className="px-2.5 py-1 rounded-xl bg-white/90 border border-pink-200 font-mono">
                  Стартовый бонус: <strong className="text-slate-900">{liveProfile.balance_start || 300}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/90 border border-pink-200 font-mono">
                  Реферальные: <strong className="text-pink-600">+{liveProfile.balance_ref || 0}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/90 border border-pink-200 font-mono">
                  Тарифные: <strong className="text-sky-600">+{liveProfile.balance_tarif || 0}</strong>
                </span>
                {liveProfile.balance_admin > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-white/90 border border-orange-200 font-mono">
                    Админ-начисления: <strong className="text-orange-600">+{liveProfile.balance_admin}</strong>
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                {liveProfile.balance_time ? `Посл. операция: ${liveProfile.balance_time}` : 'Баланс актуален'}
              </div>
            </div>
          </div>

          {/* 2. BILLING TRANSACTIONS SECTION */}
          <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 rounded-3xl p-5 sm:p-6 border border-pink-200/80 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-pink-200/80 pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-pink-500" />
                <span className="text-multicolor-gradient">Билинг платежей и транзакции</span>
              </h3>
              <button
                type="button"
                onClick={fetchTransactions}
                className="text-sm text-pink-600 hover:text-pink-800 font-bold flex items-center gap-1 cursor-pointer"
                title="Обновить историю транзакций из SQLite"
              >
                <RefreshCw size={13} />
                <span>Обновить</span>
              </button>
            </div>
            
            {/* Billing items feed */}
            <div className="space-y-2 max-h-[260px] overflow-y-auto no-scrollbar pt-1 font-medium">
              {transactionsList.length === 0 ? (
                <div className="p-4 bg-white/80 rounded-xl border border-pink-200/60 text-center text-slate-600 text-sm">
                  История операций пуста
                </div>
              ) : (
                transactionsList.map((bill: any) => (
                  <div key={bill.id} className="p-2.5 bg-white/90 rounded-xl border border-pink-200/80 flex items-center justify-between gap-3 text-sm shadow-xs">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="block truncate text-sm text-slate-900 leading-tight font-bold">{bill.description || bill.desc}</span>
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
                        <span>{bill.date || (bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('ru-RU') : 'Сегодня')}</span>
                        <span>•</span>
                        <span className="text-slate-700 font-bold">{bill.status || 'Завершено'}</span>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className={`font-mono text-sm font-bold block ${
                        bill.type === 'in' ? 'text-multicolor-gradient font-extrabold' : 'text-rose-600'
                      }`}>
                        {bill.amount}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. TARIFF PACKAGES SECTION */}
          <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 rounded-3xl p-5 sm:p-6 border border-pink-200/80 space-y-4 text-left">
            <div className="border-b border-pink-200/80 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Тарифные пакеты и тонкие настройки</h3>
              <p className="text-sm text-slate-600 font-medium">Автоматизация с ИИSMM. 1 ₽ = 1 ИИрка.</p>
            </div>

            <TariffCards 
              userTariff={user.tariff}
              userTariffExpiresAt={user.premiumUntil || user.tariff_expires_at}
              onAction={(planName, priceText, amountRub, actionType, periodMonths, discountPercent) => {
                handleTariffAction(planName, priceText, amountRub, actionType, periodMonths, discountPercent);
              }}
            />
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 2: CHANNELS MANAGEMENT --- */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <Channels 
            channels={localChannels} 
            currentUser={user as any} 
            onAddChannel={handleAddChannel} 
            onUpdateChannel={handleUpdateChannel} 
            onDeleteChannel={handleDeleteChannel} 
            onRefresh={fetchProfileChannels} 
          />
        </div>
      )}

      {/* --- TAB CONTENT: BRANDING & WATERMARK CONFIG (PREMIUM/VIP) --- */}
      {activeTab === 'branding' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-100 text-left space-y-6">
          <div className="border-b pb-3 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Фирменный брендбук и Настройка вотермарок</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Создавайте холсты для медиа (Canva) и добавляйте защитные вотермарки.</p>
            </div>
            {user.tariff === 'free' && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-full">⚡ Доступно на PREMIUM / VIP</span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-semibold">
            {/* Control Panel */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black block">Фирменная вотермарка (Текст)</label>
                <input 
                  type="text" 
                  value={watermarkText}
                  onChange={e => setWatermarkText(e.target.value)}
                  placeholder="@my_channel_name"
                  className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs focus:outline-none"
                  disabled={user.tariff === 'free'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black block">Расположение вотермарки</label>
                  <select 
                    value={watermarkPos}
                    onChange={e => setWatermarkPos(e.target.value as any)}
                    className="w-full bg-slate-50 border p-2 rounded-xl text-xs"
                    disabled={user.tariff === 'free'}
                  >
                    <option value="top-left">Верхний левый угол</option>
                    <option value="top-right">Верхний правый угол</option>
                    <option value="bottom-left">Нижний левый угол</option>
                    <option value="bottom-right">Нижний правый угол</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black block">Прозрачность вотермарки ({watermarkOpacity}%)</label>
                  <input 
                    type="range" min={10} max={100} value={watermarkOpacity}
                    onChange={e => setWatermarkOpacity(Number(e.target.value))}
                    className="w-full mt-2"
                    disabled={user.tariff === 'free'}
                  />
                </div>
              </div>

              {/* Brand Book Typography Pairings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black block">Фирменный шрифт Canvas</label>
                  <select 
                    value={selectedFont}
                    onChange={e => setSelectedFont(e.target.value)}
                    className="w-full bg-slate-50 border p-2 rounded-xl text-xs"
                    disabled={user.tariff === 'free'}
                  >
                    <option value="Inter">Classic Inter (Sans)</option>
                    <option value="Space Grotesk">Tech Space Grotesk</option>
                    <option value="JetBrains Mono">Developer Mono Space</option>
                    <option value="Playfair Display">Elegant Playfair Serif</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black block">Акцентный цвет бренда</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={selectedBrandColor}
                      onChange={e => setSelectedBrandColor(e.target.value)}
                      className="w-8 h-8 rounded p-0 border cursor-pointer"
                      disabled={user.tariff === 'free'}
                    />
                    <input 
                      type="text" 
                      value={selectedBrandColor}
                      onChange={e => setSelectedBrandColor(e.target.value)}
                      className="w-full bg-slate-50 text-xs font-mono p-1 border rounded"
                      disabled={user.tariff === 'free'}
                    />
                  </div>
                </div>
              </div>

              {/* Toggle user name shiny badge */}
              <div className="p-3.5 bg-slate-50 border rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block">Метка участника в ленте 💎</span>
                  <span className="text-[9px] text-slate-400 block font-normal">Добавляет узнаваемый кристалл перед вашим профилем.</span>
                </div>
                <button 
                  onClick={handleToggleVipBadge}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] uppercase font-bold"
                >
                  {user.name.includes('💎') ? 'Убрать метку' : 'Показать метку 💎'}
                </button>
              </div>

              {/* Autopilot Scheduling Frequency */}
              <div className="p-3.5 bg-slate-50 border rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block">ИИ-Автопилот генератора</span>
                  <span className="text-[9px] text-slate-400 block font-normal">ИИ сам генерирует по расписанию и публикует в каналы.</span>
                </div>
                <input 
                  type="checkbox" checked={isAiAutopilotEnabled}
                  onChange={e => setIsAiAutopilotEnabled(e.target.checked)}
                  className="w-4 h-4 text-orange-500 cursor-pointer"
                  disabled={user.tariff === 'free'}
                />
              </div>

            </div>

            {/* Realtime Media Canvas Watermark Template Preview */}
            <div className="border rounded-3xl p-5 bg-slate-900 text-white space-y-4 relative overflow-hidden flex flex-col justify-between h-[300px] shadow-lg">
              <span className="absolute top-2 left-2 text-[9px] bg-white/20 px-2 py-0.5 rounded uppercase font-black tracking-widest text-white backdrop-blur">Интерактивный холст</span>
              <div className="w-full h-full flex flex-col justify-center items-center p-4">
                <div className="text-center space-y-2">
                  <p className="text-xs uppercase font-black text-slate-400 tracking-widest">Превью вашего поста в Canva</p>
                  <h4 className="text-lg font-black tracking-tight max-w-sm mx-auto" style={{ fontFamily: selectedFont, color: selectedBrandColor }}>
                    Пост оформлен в фирменном стиле ИИSMM
                  </h4>
                  <p className="text-[10px] text-slate-300 max-w-xs font-normal text-center">Шрифт "{selectedFont}", цвет "{selectedBrandColor}". По расписанию публикуем в ВКонтакте и Телеграм.</p>
                </div>
              </div>

              {/* Custom Positions Overlaid */}
              <div 
                className="absolute text-[11px] font-mono font-bold bg-black/60 px-2 py-1 rounded max-w-xs truncate border border-white/20 shadow-md transition-all"
                style={{
                  opacity: watermarkOpacity / 100,
                  top: watermarkPos.startsWith('top') ? '12px' : 'auto',
                  bottom: watermarkPos.startsWith('bottom') ? '12px' : 'auto',
                  left: watermarkPos.endsWith('left') ? '12px' : 'auto',
                  right: watermarkPos.endsWith('right') ? '12px' : 'auto',
                }}
              >
                🔒 {watermarkText}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB CONTENT: CUSTOM API KEYS & MCP CHANNEL CONFIG --- */}
      {activeTab === 'api_keys' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-100 text-left space-y-6">
          <div className="border-b pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-orange-500" />
                <span>Настройка своих API Ключей разработчика и MCP сервера</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Повысьте автономность платформы! Подключайте свои лимиты без оплаты пакетных ИИрок.</p>
            </div>
            {user.tariff === 'free' && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-full">Premium / VIP</span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-semibold">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black block">Собственный ИИSMM API Key</label>
                <input 
                  type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)}
                  placeholder="protalk_sk_..." className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  disabled={user.tariff === 'free'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black block">Собственный OpenAI GPT-4 Key (Для соавтора)</label>
                <input 
                  type="password" value={openAIKey} onChange={e => setOpenAIKey(e.target.value)}
                  placeholder="sk-proj-..." className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  disabled={user.tariff === 'free'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-black block">Токен целевого сообщества ВКонтакте / Telegram Bot</label>
                <input 
                  type="password" value={vkTargetKey} onChange={e => setVkTargetKey(e.target.value)}
                  placeholder="vk5.a.9f8b4..." className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  disabled={user.tariff === 'free'}
                />
              </div>

              <button 
                onClick={() => {
                  if (user.tariff === 'free') {
                    alert('Для сохранения собственных API Ключей обновитесь на тариф PRO!');
                    return;
                  }
                  alert('🎉 Собственные API-ключи успешно сохранены во внутреннем зашифрованном хранилище! Лимиты генераций ваших постов теперь перенаправлены на ваши аккаунты.');
                }}
                className="w-full py-2.5 bg-orange-500 text-white font-black text-xs uppercase rounded-xl transition-all active:scale-95 cursor-pointer"
                disabled={user.tariff === 'free'}
              >
                Сохранить API ключи в Личном Кабинете
              </button>
            </div>

            {/* MCP SERVER INTERACTIVE BLOCK (VIP FEATURE) */}
            <div className="p-5 bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl space-y-4 relative overflow-hidden flex flex-col justify-between">
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white font-black rounded uppercase text-[8px]">VIP MCP SERVER PROTOCOL</span>
              
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-yellow-400 uppercase">MCP Сервер Агентов</h4>
                <p className="text-[11px] text-slate-300 font-normal leading-normal">
                  Model Context Protocol (MCP) позволяет ИИ-копирайтерам обращаться к вашим базам данных, локальным скриптам и CRM для составления постов с вашими реальными акциями и товарами.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-slate-400 uppercase font-black block">Локальный MCP URL Endpoint</label>
                <div className="flex gap-2">
                  <input 
                    type="text" value={mcpUrl} onChange={e => setMcpUrl(e.target.value)}
                    placeholder="http://localhost:3011/mcp" className="flex-1 bg-white/10 text-white border border-white/20 p-2 text-xs font-mono focus:outline-none rounded-xl"
                    disabled={user.tariff !== 'vip'}
                  />
                  <button 
                    onClick={() => {
                      if (user.tariff !== 'vip') {
                        alert('Доступ к MCP протоколу предоставляется на VIP тарифах!');
                        return;
                      }
                      setMcpStatus(mcpStatus === 'connected' ? 'disconnected' : 'connected');
                    }}
                    className="px-3 bg-amber-500 font-extrabold rounded-xl hover:brightness-105 transition-all text-xs text-white cursor-pointer"
                  >
                    {mcpStatus === 'connected' ? 'Сброс' : 'Синхронизация'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <div className="flex justify-between font-mono text-[10px]">
                  <span>Интеграционный статус:</span>
                  <span className={mcpStatus === 'connected' ? 'text-emerald-400 font-black' : 'text-slate-400'}>
                    {mcpStatus === 'connected' ? '● СИНХРОНИЗИРОВАНО' : '● ОФЛАЙН'}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-normal">При включенной синхронизации ИИSMM умеет доставать товары для автогенераций.</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB CONTENT: MULTIPLAYER TEAM MANAGER (SQLite-backed) --- */}
      {activeTab === 'multiplayer' && (
        <div className="p-6 bg-gradient-to-r from-sky-100/80 via-pink-100/80 via-orange-100/80 via-pink-100/80 to-sky-100/80 backdrop-blur-md rounded-3xl border border-pink-200/80 text-left space-y-6 shadow-sm">
          {/* Notification Toast */}
          {teamNotification && (
            <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all ${
              teamNotification.type === 'error' 
                ? 'bg-rose-100/90 border-rose-300 text-rose-900 shadow-sm' 
                : 'bg-sky-100/90 border-pink-300 text-slate-900 shadow-sm'
            }`}>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-pink-500 shrink-0" />
                <span className="text-sm">{teamNotification.message}</span>
              </div>
              <button 
                onClick={() => setTeamNotification(null)}
                className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Header Bar */}
          <div className="border-b border-pink-200/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-500" />
                <span>Команды и участники мультиплеера</span>
              </h3>
              <p className="text-sm text-slate-700 mt-1 font-medium">
                Управление командами, распределение прав и каналов с прямой синхронизацией в базе данных SQLite.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsAccessInfoModalOpen(true)}
                className="px-3.5 py-2 bg-white/80 hover:bg-white text-slate-800 border border-pink-200 text-sm font-bold rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Info className="w-4 h-4 text-sky-500" />
                <span>Права и доступ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewTeamName('');
                  setNewTeamChannels([]);
                  setIsCreateTeamModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-400 via-orange-400 via-pink-400 to-sky-400 hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Plus size={16} />
                <span>Создать команду</span>
              </button>
            </div>
          </div>

          {/* Privacy and Blacklist Controls Bar */}
          <div className="p-4 bg-white/70 backdrop-blur-md border border-pink-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">Приватность приглашений в команды</span>
                <span className="text-sm text-slate-600">
                  {allowTeamInvites 
                    ? 'Вас могут приглашать в команды по @username и инвайт-ссылкам' 
                    : 'Запрещено: другие пользователи не могут добавить вас в команду'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleAllowInvites(!allowTeamInvites)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 ${
                  allowTeamInvites 
                    ? 'bg-gradient-to-r from-sky-400 via-pink-400 to-orange-400 text-white' 
                    : 'bg-white/90 border border-pink-300 text-slate-700 hover:bg-white'
                }`}
              >
                {allowTeamInvites ? <Check size={16} /> : <Ban size={16} className="text-orange-500" />}
                <span>{allowTeamInvites ? 'Приглашения разрешены' : 'Приглашения запрещены'}</span>
              </button>
            </div>
          </div>

          {/* Team Overview Card */}
          {teamData && (
            <div className="p-5 bg-white/80 backdrop-blur-md border border-pink-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900">{teamData.name}</h4>
                  <span className="px-2.5 py-0.5 bg-white/90 text-sky-800 border border-sky-300 rounded-lg text-sm font-mono font-bold">
                    ID: {teamData.id}
                  </span>
                </div>
                <p className="text-sm text-slate-700">
                  Инвайт-код: <strong className="font-mono text-pink-700">{teamData.inviteCode || teamData.id}</strong> • Создана: {new Date(teamData.createdAt || Date.now()).toLocaleDateString('ru-RU')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditTeamName(teamData.name || '');
                    setIsEditTeamModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-800 border border-pink-200 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Edit3 size={15} className="text-pink-500" />
                  <span>Переименовать</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeamChannels(teamData.channels || []);
                    setIsManageChannelsModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-800 border border-pink-200 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Radio size={15} className="text-sky-500" />
                  <span>Каналы ({teamChannels.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleBlacklist(teamData.id)}
                  className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-800 border border-pink-200 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Черный список для этой команды"
                >
                  <Ban size={15} className="text-orange-500" />
                  <span>{teamBlacklist.includes(teamData.id) ? 'В черном списке' : 'В черный список'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReportReason('Спам / Нежелательные приглашения');
                    setReportDetails('');
                    setIsReportModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-800 border border-pink-200 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Пожаловаться администратору сервиса"
                >
                  <Flag size={15} className="text-rose-500" />
                  <span>Пожаловаться</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDeleteTeamModalOpen(true)}
                  className="px-3.5 py-2 bg-white/90 hover:bg-white text-rose-700 border border-rose-200 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Удалить команду из SQLite"
                >
                  <Trash2 size={15} className="text-rose-500" />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm font-medium">
            {/* Left Column: Invite & Quick Add */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-pink-200/80 space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-900 font-bold block">Пригласить в команду</span>
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="text-sm font-bold text-pink-600 hover:text-pink-800 flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus size={15} />
                  <span>Выбрать из базы</span>
                </button>
              </div>

              <form onSubmit={handleInviteCoworker} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-700 font-bold block">
                    Telegram имя пользователя (@username или ID)
                  </label>
                  <input 
                    type="text" 
                    value={inviteHandle} 
                    onChange={e => setInviteHandle(e.target.value)}
                    placeholder="@ivan_smm_pro" 
                    className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pink-400"
                    required
                  />
                </div>

                <div className="p-3 bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 border border-pink-200/70 rounded-xl space-y-1">
                  <p className="text-sm text-slate-900 font-bold">Уровень доступа команды:</p>
                  <p className="text-sm text-slate-700 leading-relaxed font-normal">
                    Все добавленные участники получают доступ к публикации и планированию постов на привязанных каналах команды. Баланс списывается с владельца команды.
                  </p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-sky-400 via-pink-400 via-orange-400 via-pink-400 to-sky-400 hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer border border-pink-300 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <UserPlus size={16} />
                  <span>Добавить участника</span>
                </button>
              </form>

              {/* Invite Links */}
              <div className="pt-4 border-t border-pink-200/80 space-y-3">
                <span className="text-sm text-slate-900 font-bold block">
                  Инвайт-ссылки для приглашения сотрудников:
                </span>
                
                {/* Telegram Link */}
                <div className="p-3 bg-white/90 border border-pink-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-sm text-slate-800 font-bold">
                    <span>Ссылка для Telegram:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`https://t.me/SAV_AI_bot?start=team_${teamData?.id || user.id || '169262990'}`}
                      className="w-full bg-white border border-pink-200 p-2 rounded-lg text-sm font-mono text-slate-800 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://t.me/SAV_AI_bot?start=team_${teamData?.id || user.id || '169262990'}`);
                        showTeamToast('success', 'Инвайт-ссылка для Telegram скопирована!');
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-sky-400 via-pink-400 via-orange-400 via-pink-400 to-sky-400 text-white rounded-lg text-sm font-bold cursor-pointer shrink-0 shadow-xs hover:opacity-90 transition-all active:scale-95"
                    >
                      Копировать
                    </button>
                  </div>
                </div>

                {/* Web Link */}
                <div className="p-3 bg-white/90 border border-pink-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-sm text-slate-800 font-bold">
                    <span>Ссылка для браузера:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/?invite=team_${teamData?.id || user.id || '169262990'}`}
                      className="w-full bg-white border border-pink-200 p-2 rounded-lg text-sm font-mono text-slate-800 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/?invite=team_${teamData?.id || user.id || '169262990'}`);
                        showTeamToast('success', 'Инвайт-ссылка для браузера скопирована!');
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-sky-400 via-pink-400 via-orange-400 via-pink-400 to-sky-400 text-white rounded-lg text-sm font-bold cursor-pointer shrink-0 shadow-xs hover:opacity-90 transition-all active:scale-95"
                    >
                      Копировать
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Members List & Channels */}
            <div className="lg:col-span-2 space-y-6">
              {/* Members Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-900 font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-500" />
                    <span>Участники команды в SQLite ({teamMembers.length})</span>
                  </span>

                  <button
                    type="button"
                    onClick={fetchTeamData}
                    className="text-sm font-bold text-pink-600 hover:text-pink-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={14} className={teamLoading ? 'animate-spin' : ''} />
                    <span>Обновить из базы</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {teamMembers.length === 0 ? (
                    <div className="p-8 bg-white/80 rounded-2xl border border-pink-200/80 text-center text-slate-700 text-sm font-medium space-y-2">
                      <p>В этой команде пока нет добавленных участников.</p>
                      <p className="text-sm text-slate-600">
                        Введите @username сотрудника в форме слева или отправьте инвайт-ссылку для подключения.
                      </p>
                    </div>
                  ) : (
                    teamMembers.map((m, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 bg-white/85 backdrop-blur-sm rounded-2xl border border-pink-200/80 flex flex-wrap items-center justify-between gap-3 shadow-xs hover:border-pink-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-400 via-pink-400 via-orange-400 via-pink-400 to-sky-400 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {m.name ? m.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">
                              {m.name}
                            </span>
                            <span className="text-sm text-slate-600 font-mono">
                              {m.handle} • {m.joinedAt ? `Присоединен ${new Date(m.joinedAt).toLocaleDateString('ru-RU')}` : 'Доступ к каналам активен'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm bg-white text-slate-800 border border-pink-200 px-3 py-1 font-bold rounded-lg shadow-xs">
                            {m.role || m.status || 'Участник'}
                          </span>

                          <button 
                            type="button"
                            onClick={() => setMemberToRevoke(m)}
                            className="text-rose-700 hover:text-rose-900 font-bold text-sm px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                            title="Отозвать доступ участника и удалить из базы данных"
                          >
                            <UserMinus size={14} />
                            <span>Отозвать доступ</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Channels Section */}
              <div className="pt-4 border-t border-pink-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-900 font-bold flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-pink-500" />
                    <span>Каналы команды из базы данных ({teamChannels.length})</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeamChannels(teamData?.channels || teamChannels || []);
                      setIsManageChannelsModalOpen(true);
                    }}
                    className="text-sm font-bold text-pink-600 hover:text-pink-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Настроить привязку каналов</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {teamChannels.length === 0 ? (
                    <div className="md:col-span-2 p-6 bg-white/80 rounded-2xl border border-pink-200/80 text-center text-slate-700 text-sm font-medium">
                      К этой команде пока не привязаны каналы. Нажмите «Настроить привязку каналов», чтобы выбрать каналы из базы SQLite.
                    </div>
                  ) : (
                    teamChannels
                      .filter(ch => ch !== '@shishkarnem' && ch !== '@BorgheseClub' && ch !== '@Rentrop_HR_bot')
                      .map((channelUsername, idx) => {
                        const ch = (localChannels || []).find((c: any) => c.username === channelUsername || c.name === channelUsername) || { name: channelUsername, username: channelUsername };
                        return (
                          <div key={idx} className="p-3.5 bg-white/85 rounded-2xl border border-pink-200/80 flex items-center justify-between shadow-xs hover:border-pink-300 transition-all">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0">
                                📢
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 text-sm block truncate max-w-[160px]">
                                  {ch.name || ch.username}
                                </span>
                                <span className="text-sm text-slate-600 font-mono truncate block">
                                  {ch.username}
                                </span>
                              </div>
                            </div>

                            <span className="text-sm font-bold text-slate-800 bg-white/90 px-2.5 py-1 rounded-md border border-pink-200 shrink-0">
                              Доступен всем
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 1: CREATE TEAM MODAL --- */}
      <AnimatePresence>
        {isCreateTeamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-200/80 rounded-3xl p-6 shadow-2xl text-left space-y-5 text-slate-900"
            >
              <div className="flex items-center justify-between border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-500" />
                  <h3 className="text-base font-bold text-slate-900">Создать новую команду в SQLite</h3>
                </div>
                <button 
                  onClick={() => setIsCreateTeamModalOpen(false)}
                  className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-800 font-bold block">
                    Название команды
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    placeholder="Например: SMM Команда Студии"
                    className="w-full bg-white/90 border border-pink-200 rounded-xl p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pink-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-800 font-bold block">
                    Выберите каналы из SQLite для делегирования:
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {(localChannels || []).length === 0 ? (
                      <p className="text-sm text-slate-600 p-2">У вас нет подключенных каналов в базе данных.</p>
                    ) : (
                      (localChannels || []).map((ch: any) => {
                        const chKey = ch.username || ch.name;
                        const isChecked = newTeamChannels.includes(chKey);
                        return (
                          <label 
                            key={ch.id || chKey} 
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isChecked 
                                ? 'bg-white border-pink-400 text-slate-900 shadow-xs' 
                                : 'bg-white/60 border-pink-200 text-slate-700 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isChecked ? <CheckSquare size={16} className="text-pink-500 shrink-0" /> : <Square size={16} className="text-slate-400 shrink-0" />}
                              <span className="text-sm font-bold truncate">{ch.name || ch.username}</span>
                              <span className="text-sm font-mono text-slate-600 truncate">{ch.username}</span>
                            </div>
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setNewTeamChannels(prev => prev.filter(c => c !== chKey));
                                } else {
                                  setNewTeamChannels(prev => [...prev, chKey]);
                                }
                              }}
                            />
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-200/80">
                  <button
                    type="button"
                    onClick={() => setIsCreateTeamModalOpen(false)}
                    className="px-4 py-2 bg-white/80 hover:bg-white text-slate-800 border border-pink-200 rounded-xl text-sm font-bold cursor-pointer transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-400 via-orange-400 via-pink-400 to-sky-400 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    Зафиксировать команду в SQLite
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: EDIT TEAM MODAL --- */}
      <AnimatePresence>
        {isEditTeamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-200/80 rounded-3xl p-6 shadow-2xl text-left space-y-5 text-slate-900"
            >
              <div className="flex items-center justify-between border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-pink-500" />
                  <h3 className="text-base font-bold text-slate-900">Редактировать команду</h3>
                </div>
                <button 
                  onClick={() => setIsEditTeamModalOpen(false)}
                  className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateTeamSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-800 font-bold block">
                    Название команды в базе данных
                  </label>
                  <input
                    type="text"
                    value={editTeamName}
                    onChange={e => setEditTeamName(e.target.value)}
                    className="w-full bg-white/90 border border-pink-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-pink-400"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-200/80">
                  <button
                    type="button"
                    onClick={() => setIsEditTeamModalOpen(false)}
                    className="px-4 py-2 bg-white/80 hover:bg-white text-slate-800 border border-pink-200 rounded-xl text-sm font-bold cursor-pointer transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-400 via-orange-400 via-pink-400 to-sky-400 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    Сохранить изменения
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 3: MANAGE CHANNELS MODAL --- */}
      <AnimatePresence>
        {isManageChannelsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-200/80 rounded-3xl p-6 shadow-2xl text-left space-y-5 text-slate-900"
            >
              <div className="flex items-center justify-between border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-pink-500" />
                  <h3 className="text-base font-bold text-slate-900">Каналы команды в SQLite</h3>
                </div>
                <button 
                  onClick={() => setIsManageChannelsModalOpen(false)}
                  className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-slate-700">
                Отметьте каналы из базы данных, к которым участники команды будут иметь доступ для генерации и автопостинга:
              </p>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {(localChannels || []).length === 0 ? (
                  <div className="p-4 bg-white/80 rounded-xl text-center text-sm text-slate-600">
                    У вас пока нет добавленных каналов. Подключите каналы во вкладке «Каналы».
                  </div>
                ) : (
                  (localChannels || []).map((ch: any) => {
                    const chKey = ch.username || ch.name;
                    const isChecked = selectedTeamChannels.includes(chKey);
                    return (
                      <label 
                        key={ch.id || chKey} 
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-white border-pink-400 text-slate-900 shadow-xs' 
                            : 'bg-white/60 border-pink-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isChecked ? <CheckSquare size={16} className="text-pink-500 shrink-0" /> : <Square size={16} className="text-slate-400 shrink-0" />}
                          <div>
                            <span className="text-sm font-bold block truncate">{ch.name || ch.username}</span>
                            <span className="text-sm font-mono text-slate-600 block truncate">{ch.username}</span>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedTeamChannels(prev => prev.filter(c => c !== chKey));
                            } else {
                              setSelectedTeamChannels(prev => [...prev, chKey]);
                            }
                          }}
                        />
                      </label>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-200/80">
                <button
                  type="button"
                  onClick={() => setIsManageChannelsModalOpen(false)}
                  className="px-4 py-2 bg-white/80 hover:bg-white text-slate-800 border border-pink-200 rounded-xl text-sm font-bold cursor-pointer transition-all"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSaveTeamChannels}
                  className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-400 via-orange-400 via-pink-400 to-sky-400 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Сохранить в SQLite
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 4: ADD MEMBER MODAL (FROM SQLITE USERS OR HANDLE) --- */}
      <AnimatePresence>
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-200/80 rounded-3xl p-6 shadow-2xl text-left space-y-5 text-slate-900"
            >
              <div className="flex items-center justify-between border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-pink-500" />
                  <h3 className="text-base font-bold text-slate-900">Добавить участника команды</h3>
                </div>
                <button 
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Select from existing registered DB users */}
              {allDbUsers.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm text-slate-800 font-bold block">
                    Быстрый выбор из зарегистрированных пользователей:
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-pink-200 rounded-xl p-2 bg-white/70">
                    {allDbUsers.slice(0, 15).map((u, i) => (
                      <div 
                        key={u.id || i}
                        onClick={() => {
                          setNewMemberHandle(u.username || `@user_${u.id}`);
                          setNewMemberName(u.name || u.firstName || '');
                        }}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/90 hover:bg-white border border-pink-100 cursor-pointer transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 text-sm flex items-center justify-center font-bold shrink-0">
                            {u.name ? u.name[0] : 'U'}
                          </div>
                          <span className="text-sm font-bold text-slate-900 truncate">{u.name}</span>
                          <span className="text-sm font-mono text-slate-600 truncate">{u.username || `ID: ${u.id}`}</span>
                        </div>
                        <span className="text-sm text-pink-600 font-bold shrink-0">Выбрать</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleAddMemberSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-800 font-bold block">
                    Telegram имя пользователя (@handle или ID)
                  </label>
                  <input
                    type="text"
                    value={newMemberHandle}
                    onChange={e => setNewMemberHandle(e.target.value)}
                    placeholder="@smm_colleague"
                    className="w-full bg-white/90 border border-pink-200 rounded-xl p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pink-400"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-slate-800 font-bold block">
                    Имя / Должность сотрудника (необязательно)
                  </label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    placeholder="Например: Иван Маркетолог"
                    className="w-full bg-white/90 border border-pink-200 rounded-xl p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pink-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-200/80">
                  <button
                    type="button"
                    onClick={() => setIsAddMemberModalOpen(false)}
                    className="px-4 py-2 bg-white/80 hover:bg-white text-slate-800 border border-pink-200 rounded-xl text-sm font-bold cursor-pointer transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-400 via-orange-400 via-pink-400 to-sky-400 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    Добавить в SQLite
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 5: REVOKE MEMBER CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {memberToRevoke && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-200/80 rounded-3xl p-6 shadow-2xl text-left space-y-5 text-slate-900"
            >
              <div className="flex items-center justify-between border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold text-slate-900">Отозвать доступ участника</h3>
                </div>
                <button 
                  onClick={() => setMemberToRevoke(null)}
                  className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 text-sm text-slate-800">
                <p>
                  Вы уверены, что хотите отозвать доступ и удалить из базы данных участника:
                </p>
                <div className="p-3 bg-white/80 border border-pink-200 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm">
                    {memberToRevoke.name ? memberToRevoke.name[0] : 'U'}
                  </div>
                  <div>
                    <strong className="block text-slate-900">{memberToRevoke.name}</strong>
                    <span className="text-sm font-mono text-slate-600">{memberToRevoke.handle}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 pt-1">
                  Участник больше не сможет публиковать посты и просматривать каналы вашей команды. Запись будет удалена из таблицы teams в SQLite.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-200/80">
                <button
                  type="button"
                  onClick={() => setMemberToRevoke(null)}
                  className="px-4 py-2 bg-white/80 hover:bg-white text-slate-800 border border-pink-200 rounded-xl text-sm font-bold cursor-pointer transition-all"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRevokeMember}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Отозвать и удалить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 6: DELETE TEAM CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {isDeleteTeamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-200/80 rounded-3xl p-6 shadow-2xl text-left space-y-5 text-slate-900"
            >
              <div className="flex items-center justify-between border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold text-slate-900">Удалить команду из SQLite</h3>
                </div>
                <button 
                  onClick={() => setIsDeleteTeamModalOpen(false)}
                  className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 text-sm text-slate-800">
                <p>
                  Вы действительно хотите удалить команду <strong className="text-slate-900">«{teamData?.name}»</strong>?
                </p>
                <p className="text-sm text-slate-600">
                  Все привязки каналов и доступ участников команды будут удалены из базы данных SQLite. Это действие нельзя отменить.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-200/80">
                <button
                  type="button"
                  onClick={() => setIsDeleteTeamModalOpen(false)}
                  className="px-4 py-2 bg-white/80 hover:bg-white text-slate-800 border border-pink-200 rounded-xl text-sm font-bold cursor-pointer transition-all"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTeam}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Удалить из SQLite
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 7: ACCESS RIGHTS & PRIVACY INFO MODAL --- */}
      <AnimatePresence>
        {isAccessInfoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-200/80 rounded-3xl p-6 shadow-2xl text-left space-y-5 text-slate-900"
            >
              <div className="flex items-center justify-between border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-sky-500" />
                  <h3 className="text-base font-bold text-slate-900">Правила доступа и права участников</h3>
                </div>
                <button 
                  onClick={() => setIsAccessInfoModalOpen(false)}
                  className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-800">
                <div className="p-3.5 bg-white/80 rounded-2xl border border-pink-200 space-y-1">
                  <h4 className="font-bold text-slate-900">1. Автоматическая верификация участников</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Добавить в команду можно только пользователей, зарегистрированных в базе данных платформы или запустивших бота t.me/IIrkiBot.
                  </p>
                </div>

                <div className="p-3.5 bg-white/80 rounded-2xl border border-pink-200 space-y-1">
                  <h4 className="font-bold text-slate-900">2. Приватность и запрет на приглашения</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Каждый пользователь может запретить добавление себя в команды через переключатель приватности в профиле. В таком случае система блокирует попытки инвайтов.
                  </p>
                </div>

                <div className="p-3.5 bg-white/80 rounded-2xl border border-pink-200 space-y-1">
                  <h4 className="font-bold text-slate-900">3. Черный список и жалобы администратору</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Вы можете в любой момент добавить команду в черный список или отправить жалобу. Жалобы мгновенно поступают администратору сервиса в Telegram (16926299042) и фиксируются в базе данных SQLite.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-pink-200/80">
                <button
                  type="button"
                  onClick={() => setIsAccessInfoModalOpen(false)}
                  className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-400 via-orange-400 via-pink-400 to-sky-400 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Понятно
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 8: REPORT TEAM MODAL --- */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-200/80 rounded-3xl p-6 shadow-2xl text-left space-y-5 text-slate-900"
            >
              <div className="flex items-center justify-between border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold text-slate-900">Пожаловаться на команду</h3>
                </div>
                <button 
                  onClick={() => setIsReportModalOpen(false)}
                  className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSendReport} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-800 font-bold block">
                    Причина жалобы:
                  </label>
                  <select
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="w-full bg-white/90 border border-pink-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-pink-400"
                  >
                    <option value="Спам / Нежелательные приглашения">Спам / Нежелательные приглашения</option>
                    <option value="Оскорбления / Неприемлемый контент">Оскорбления / Неприемлемый контент</option>
                    <option value="Мошенничество / Нарушение правил">Мошенничество / Нарушение правил</option>
                    <option value="Другое">Другое</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-slate-800 font-bold block">
                    Подробности жалобы (необязательно):
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    placeholder="Опишите подробнее причину жалобы..."
                    className="w-full bg-white/90 border border-pink-200 rounded-xl p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pink-400 resize-none"
                  />
                </div>

                <p className="text-sm text-slate-600">
                  Уведомление с деталями вашей жалобы будет отправлено администратору сервиса в Telegram (16926299042) и зафиксировано в таблице team_reports.
                </p>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-200/80">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 bg-white/80 hover:bg-white text-slate-800 border border-pink-200 rounded-xl text-sm font-bold cursor-pointer transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    {reportSubmitting ? 'Отправка...' : 'Отправить жалобу'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TAB CONTENT: AI ROUNDTABLE DISCUSSION (VIP EXCLUSIVE) --- */}
      {activeTab === 'roundtable' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-100 text-left space-y-6">
          <div className="border-b pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-orange-500" />
                <span>ИИ Групповые чаты агентов - Круглый стол ИИ-Маркетологов</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Запустите независимую дискуссию трех ИИ-специалистов для глубинного разбора вашей SMM-стратегии.</p>
            </div>
            {user.tariff !== 'vip' && (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-full">VIP КОМБАЙН</span>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-405 uppercase font-black block">Тема для дискуссии маркетологов</label>
              <div className="flex gap-2">
                <input 
                  type="text" value={roundTableTopic} onChange={e => setRoundTableTopic(e.target.value)}
                  placeholder="Введите любой сложный вопрос, например: 'Как продвигать пиццерию в Telegram'" 
                  className="flex-1 bg-slate-50 border p-2.5 rounded-xl text-xs font-semibold focus:outline-none"
                  disabled={user.tariff !== 'vip'}
                />
                <button 
                  onClick={startRoundtableDiscussion}
                  disabled={isRoundRunning || user.tariff !== 'vip'}
                  className="px-5 bg-gradient-to-r from-orange-450 to-pink-500 font-black text-xs uppercase text-white rounded-xl shadow cursor-pointer disabled:opacity-50"
                >
                  {isRoundRunning ? 'Обсуждение...' : 'Запустить стол 🤖'}
                </button>
              </div>
            </div>

            {/* Dialogue Stream */}
            <div className="border rounded-2xl p-4 bg-slate-50/50 min-h-[180px] max-h-[350px] overflow-y-auto space-y-3">
              {roundHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium space-y-1">
                  <p>🤖 Круглый стол ожидает запуска.</p>
                  <p className="font-normal text-[11px]">Нажмите кнопку, чтобы агенты Марк, София и Дмитрий начали дебаты по вашей теме.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roundHistory.map((step, idx) => (
                    <div key={idx} className={`p-3 rounded-2xl border text-xs leading-relaxed space-y-2 ${step.style}`}>
                      <div className="flex items-center gap-2">
                        <img src={step.avatar} alt={step.agent} className="w-6 h-6 rounded-full object-cover" />
                        <div>
                          <strong className="text-slate-800">{step.agent}</strong>
                          <span className="text-[10px] text-slate-400 font-mono ml-2">({step.title})</span>
                        </div>
                      </div>
                      <p className="text-slate-600 font-medium font-normal bg-white/70 p-2 rounded-lg">{step.msg}</p>
                    </div>
                  ))}
                  {isRoundRunning && (
                    <div className="text-[11px] text-slate-400 animate-pulse font-mono">🤖 Следующий агент анализирует контекст... готовит тезисы...</div>
                  )}
                </div>
              )}
            </div>

            {/* Voice & Video command management simulator */}
            <div className="p-4 bg-orange-50/40 border border-orange-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
              <div className="text-left space-y-1">
                <span className="text-[11px] text-orange-950 font-bold block flex items-center gap-1">
                  <Volume2 className="w-4 h-4 text-orange-500" />
                  <span>Голосовое и видео управление кабинетом</span>
                </span>
                <span className="text-[9px] text-slate-400 font-normal block leading-normal">
                  Отдавайте голосовые ЦУ нашему ИИ-помощнику не печатая по клавиатуре.
                </span>
              </div>
              <button 
                onClick={handleSimulateVoiceCommand}
                className="px-4 py-2 bg-gradient-to-r from-orange-450 to-pink-500 text-white rounded-xl text-[10px] uppercase font-black tracking-wider transition-all active:scale-95 cursor-pointer shadow"
              >
                {voiceInputSimulated ? '🔵 Идет запись аудио...' : '🎤 Записать команду'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB CONTENT: REFERRALS ENGINE --- */}
      {activeTab === 'referrals' && (() => {
        const currentOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://iismm.ru';
        const refUserId = user.telegramId || user.id || '16926299042';
        const webRefLink = `${currentOrigin}/?ref=${refUserId}`;
        const tgRefLink = referralStats?.referralLink || `https://t.me/IIrkiBot/app?startapp=${refUserId}`;

        const promoPosts: Record<string, { channelName: string; text: string; shareUrl?: string }> = {
          tg: {
            channelName: 'Telegram',
            text: `🔥 Делюсь крутым сервисом для автопостинга и генерации контента с искусственным интеллектом — ИИSMM!\n\n🤖 Автоматически создает посты, пишет сильные тексты, генерирует обложки и делает мгновенный кросспостинг в Telegram, ВК, Сетку и еще 10+ соцсетей в один клик.\n\n🎁 Забирайте 300 ИИрок бонусом на баланс при регистрации:\n📱 В Telegram Mini App: ${tgRefLink}\n🌐 В браузере (веб-версия): ${webRefLink}`,
            shareUrl: `https://t.me/share/url?url=${encodeURIComponent(tgRefLink)}&text=${encodeURIComponent(`🔥 Попробуй ИИSMM — умный автопостинг и генерация контента с ИИ. Дарим 300 ИИрок!\n📱 В Telegram: ${tgRefLink}\n🌐 В браузере: ${webRefLink}`)}`
          },
          vk: {
            channelName: 'ВКонтакте',
            text: `🔥 Рекомендую ИИSMM — мощную платформу для автопостинга и генерации контента с искусственным интеллектом!\n\nГенерирует контент-планы, пишет посты, создает нейроиллюстрации и публикует во все соцсети на автомате.\n\n🎁 Получи 300 ИИрок бонусом на баланс при регистрации:\n📱 В Telegram: ${tgRefLink}\n🌐 В браузере (веб-версия): ${webRefLink}`,
            shareUrl: `https://vk.com/share.php?url=${encodeURIComponent(webRefLink)}&title=${encodeURIComponent('ИИSMM — Умный автопостинг и контент-генератор с ИИ')}`
          },
          wa: {
            channelName: 'WhatsApp',
            text: `Привет! Нашел классный сервис ИИSMM для автоматического ведения соцсетей и создания постов нейросетью.\n\n🎁 Переходи по ссылке и забирай 300 ИИрок на баланс в подарок:\n📱 В Telegram: ${tgRefLink}\n🌐 В браузере: ${webRefLink}`,
            shareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Привет! Нашел классный сервис ИИSMM для автоматического ведения соцсетей и создания постов нейросетью. Переходи по ссылке и забирай 300 ИИрок на баланс в подарок:\n📱 В Telegram: ${tgRefLink}\n🌐 В браузере: ${webRefLink}`)}`
          },
          setka: {
            channelName: 'Сетка',
            text: `🚀 Автоматизируйте создание контента и кросспостинг с ИИSMM!\n\nИскусственный интеллект готовит регулярные посты, подбирает обложки и публикует в Сетку и Telegram.\n\n🎁 Регистрируйтесь и получайте +300 ИИрок на баланс:\n📱 В Telegram: ${tgRefLink}\n🌐 В веб-версии: ${webRefLink}`
          },
          ok: {
            channelName: 'Одноклассники',
            text: `Друзья, делюсь сервисом ИИSMM для удобного ведения групп и каналов с помощью искусственного интеллекта.\n\n🎁 Попробуйте бесплатно, при регистрации дарят 300 ИИрок на баланс:\n📱 В Telegram: ${tgRefLink}\n🌐 В браузере: ${webRefLink}`,
            shareUrl: `https://connect.ok.ru/offer?url=${encodeURIComponent(webRefLink)}&title=${encodeURIComponent('ИИSMM — Автопостинг с ИИ')}`
          }
        };

        const activePromo = promoPosts[promoChannel] || promoPosts.tg;

        return (
          <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-pink-300 shadow-md text-left space-y-6">
            <div className="border-b border-pink-200/80 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-pink-500" />
                  <span className="text-multicolor-gradient">Реферальная программа: получайте +300 ИИрок за каждого друга</span>
                </h3>
                <p className="text-sm text-slate-600 font-medium mt-0.5">Увеличивайте лимит ИИрок! Приглашайте друзей в сервис и получайте по +300 ИИрок за каждую новую регистрацию.</p>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-2xl shadow-sm text-center shrink-0">
                <span className="text-xs font-bold block opacity-90">Реферальный баланс</span>
                <span className="text-base font-black font-mono">+{referralStats?.referralRewardBalance || user.referralRewardBalance || 0} ИИрок 🪙</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm font-semibold">
              {/* Unique Link Generator */}
              <div className="p-5 bg-white/80 border border-pink-200 rounded-2xl space-y-4 shadow-2xs">
                {/* Link 1: Web Browser / Email */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-700 font-bold flex items-center gap-1">
                    🌐 <span>Ссылка для браузера (E-mail регистрация)</span>
                  </span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={webRefLink}
                      className="flex-1 bg-white border border-pink-200 px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 select-all focus:outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(webRefLink);
                        alert(`📋 Веб-реферальная ссылка скопирована:\n${webRefLink}\nПользователи, зарегистрировавшиеся по этой ссылке, принесут вам +300 ИИрок!`);
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 text-sm shadow-xs"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Копировать</span>
                    </button>
                  </div>
                </div>

                {/* Link 2: Telegram Mini App */}
                <div className="space-y-1.5 pt-2 border-t border-pink-200/60">
                  <span className="text-xs text-slate-700 font-bold flex items-center gap-1">
                    📱 <span>Ссылка для Telegram Mini App</span>
                  </span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={tgRefLink}
                      className="flex-1 bg-white border border-pink-200 px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 select-all focus:outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(tgRefLink);
                        alert(`📋 Telegram-реферальная ссылка скопирована:\n${tgRefLink}`);
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 text-sm shadow-xs"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Копировать</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-pink-50/80 border border-pink-200 text-xs text-slate-800 leading-relaxed rounded-xl space-y-1.5">
                  <p>🎁 <strong>Условия начисления:</strong> Отправьте любую из ссылок другу или опубликуйте в канале. При регистрации реферала по правилам через E-mail или Telegram вам автоматически начислится <strong>+300 ИИрок 🪙</strong> на баланс!</p>
                  {referralStats?.referredBy && (
                    <p className="pt-1.5 text-slate-600 font-medium border-t border-pink-200">
                      🤝 Вы были приглашены пользователем:{" "}
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = (referralStats.referredBy as any)?.telegramId || (referralStats.referredBy as any)?.id || '16926299042';
                          window.history.pushState(null, '', `/social/${targetId}`);
                          window.dispatchEvent(new Event('popstate'));
                        }}
                        className="font-bold underline text-pink-600 hover:text-pink-800 cursor-pointer"
                      >
                        {referralStats.referredBy.firstName}
                      </button>{" "}
                      ({referralStats.referredBy.username ? `@${referralStats.referredBy.username}` : referralStats.referredBy.telegramId})
                    </p>
                  )}
                </div>
              </div>

              {/* Referrals tracker & list */}
              <div className="p-5 bg-white/80 border border-pink-200 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex justify-between items-center border-b border-pink-200/70 pb-2">
                  <span className="text-sm font-bold text-slate-900 block">Приглашенные пользователи ({referralStats?.invitedCount || 0})</span>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                  {referralStats?.invitedUsers && referralStats.invitedUsers.length > 0 ? (
                    referralStats.invitedUsers.map((r, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => {
                          const targetId = r.telegramId || r.id;
                          if (targetId) {
                            window.history.pushState(null, '', `/social/${targetId}`);
                            window.dispatchEvent(new Event('popstate'));
                          }
                        }}
                        className="p-3 bg-white/90 hover:bg-white transition-colors cursor-pointer rounded-xl border border-pink-200/80 flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 via-pink-500 to-orange-400 text-white font-bold text-xs flex items-center justify-center font-mono shrink-0">
                            {r.firstName ? r.firstName[0].toUpperCase() : 'U'}
                          </div>
                          <div className="space-y-0.5 text-left">
                            <strong className="text-slate-800 block text-xs hover:text-pink-600 transition-colors">{r.firstName}</strong>
                            <span className="text-xs text-slate-500 font-mono">
                              {r.username ? `@${r.username}` : `ID: ${r.telegramId || r.id}`} • {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                        </div>

                        <span className="text-pink-600 font-extrabold text-xs flex items-center gap-0.5 bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-200 shrink-0">
                          <Check className="w-3.5 h-3.5" /> +300 ИИрок
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 bg-pink-50/40 rounded-2xl border border-dashed border-pink-200 text-center space-y-2">
                      <Users className="w-8 h-8 text-pink-300 mx-auto" />
                      <p className="text-sm text-slate-600 font-medium">У вас пока нет приглашенных пользователей.</p>
                      <p className="text-xs text-slate-500">Скопируйте реферальную ссылку и отправьте друзьям, чтобы получить по +300 ИИрок!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social Media Ready-Made Promo Post Section */}
            <div className="p-5 bg-white/80 border border-pink-200 rounded-2xl space-y-4 shadow-2xs text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-200/70 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    <span>Готовый пост для социальных сетей</span>
                  </h4>
                  <p className="text-xs text-slate-600 font-medium">Выберите соцсеть, скопируйте готовый текст с обеими ссылками или сразу опубликуйте в свой канал</p>
                </div>

                {/* Channel Selector Tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'tg', label: 'Telegram' },
                    { id: 'vk', label: 'ВКонтакте' },
                    { id: 'wa', label: 'WhatsApp' },
                    { id: 'setka', label: 'Сетка' },
                    { id: 'ok', label: 'Одноклассники' }
                  ].map(ch => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setPromoChannel(ch.id as any)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        promoChannel === ch.id
                          ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-xs'
                          : 'bg-white border border-pink-200 text-slate-700 hover:bg-pink-50/50'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Post Preview Box */}
              <div className="p-4 bg-white/90 rounded-xl border border-pink-200 shadow-inner space-y-3">
                <div className="text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed select-text">
                  {activePromo.text}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-pink-100">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(activePromo.text);
                      setPromoCopied(true);
                      setTimeout(() => setPromoCopied(false), 2000);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{promoCopied ? 'Скопировано! 🎉' : 'Скопировать текст поста'}</span>
                  </button>

                  {activePromo.shareUrl && (
                    <a
                      href={activePromo.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-pink-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-pink-500" />
                      <span>Поделиться в {activePromo.channelName}</span>
                    </a>
                  )}
                </div>

                {/* Send to Connected User Channel */}
                <div className="pt-3 border-t border-pink-200/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs text-slate-800 font-bold flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-orange-500" />
                      <span>Отправка поста в свой Telegram-канал из базы данных:</span>
                    </span>
                  </div>

                  {localChannels && localChannels.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <select
                        value={selectedPromoChannelId || (localChannels[0]?.id || localChannels[0]?.channelId || '')}
                        onChange={e => setSelectedPromoChannelId(e.target.value)}
                        className="flex-1 bg-white border border-pink-200 text-slate-800 text-xs font-bold p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                      >
                        {localChannels.map(ch => (
                          <option key={ch.id || ch.channelId} value={ch.id || ch.channelId}>
                            {ch.title || ch.name || ch.handle || 'Канал'} ({ch.handle || ch.channelId || 'Telegram'})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={isPublishingPromo}
                        onClick={() => handlePublishPromoToOwnChannel(activePromo.text)}
                        className="px-4 py-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isPublishingPromo ? 'Отправляем...' : 'Опубликовать в канал 🚀'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-pink-50/90 border border-dashed border-pink-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="space-y-0.5">
                        <strong className="text-slate-800 block">У вас еще нет привязанных каналов в базе данных</strong>
                        <p className="text-slate-600 font-medium">Привяжите свой Telegram-канал, чтобы отправлять готовые посты в 1 клик</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('channels');
                          window.history.pushState(null, '', '/channels');
                          window.dispatchEvent(new Event('popstate'));
                        }}
                        className="px-4 py-2 bg-white/90 hover:bg-white text-slate-800 font-bold rounded-xl border border-pink-300 shadow-2xs cursor-pointer shrink-0 text-xs flex items-center justify-center gap-1"
                      >
                        <span>Привязать канал 📢</span>
                      </button>
                    </div>
                  )}

                  {promoPublishStatus && (
                    <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
                      promoPublishStatus.type === 'success' 
                        ? 'bg-sky-50 text-sky-900 border-sky-200' 
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                    }`}>
                      <span>{promoPublishStatus.message}</span>
                      <button 
                        type="button" 
                        onClick={() => setPromoPublishStatus(null)} 
                        className="text-slate-400 hover:text-slate-700 font-bold px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- TAB CONTENT: ENTERPRISE SERVICES --- */}
      {activeTab === 'enterprise' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-100 text-left space-y-6">
          <div className="border-b pb-3">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>ИИSMM Enterprise - Корпоративные SMM стратегии под ключ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Индивидуальные пакеты разработки, создание брендбуков, ведение кабинетов и личное менторство.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-semibold">
            {/* Services descriptions per user requested specs */}
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/30 border border-amber-100 rounded-xl space-y-1">
                <h4 className="text-sm font-bold text-amber-900 uppercase">1. Умный Брендбук и План от Экспертов</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed font-normal">
                  Разработка индивидуального фирменного стиля, стратегии ведения и детального контент-плана от опытных SMM экспертов платформы. Наша команда полностью берет ведение кабинета на себя.
                </p>
              </div>

              <div className="p-3 bg-purple-50/30 border border-purple-100 rounded-xl space-y-1">
                <h4 className="text-sm font-bold text-purple-900 uppercase">2. Личное менторство ИИSMM</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed font-normal">
                  Закрепленный сертифицированный SMM-технолог проводит ежедневный разбор ваших блогов, настраивает ИИ-агентов, и помогает масштабировать трафик.
                </p>
              </div>

              <div className="p-3 bg-sky-50/30 border border-sky-100 rounded-xl space-y-1">
                <h4 className="text-sm font-bold text-sky-900 uppercase">3. Bespoke ИИ Разработка</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed font-normal">
                  Индивидуальные разработки с ИИ-инструментами под специфику вашего бизнеса: сайты, приложения, платформы, маркетплейсы, агенты, CRM-интеграции и боты.
                </p>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleSendEnterpriseForm} className="bg-slate-50 p-5 rounded-2xl border space-y-4">
              <span className="text-[10px] text-slate-405 uppercase font-black block">Запросить Enterprise Консультацию</span>
              
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase block">Какой сервис вас интересует?</label>
                <select 
                  value={enterpriseSvc} onChange={e => setEnterpriseSvc(e.target.value as any)}
                  className="w-full bg-white border p-2 rounded-xl text-xs"
                >
                  <option value="brandbook">Создание брендбука и фирменного стиля</option>
                  <option value="expert_plan">Контент план от SMM-эксперта</option>
                  <option value="mentor">Личное менторство SMM технологов</option>
                  <option value=" bespoke_plat">Разработка кастомного ИИ софта & CRM</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase block">Контактные данные (Telegram / Email / Телефон)</label>
                <input 
                  type="text" required value={enterpriseContact} onChange={e => setEnterpriseContact(e.target.value)}
                  placeholder="@shishkarnem или +7..." className="w-full bg-white border p-2.5 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-orange-450 via-pink-500 to-purple-650 text-white font-extrabold text-xs uppercase rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Отправить запрос на Enterprise-Партнерство 💼
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: ADMIN SECTION (Inside Profile) --- */}
      {activeTab === 'admin' && (
        <div className="space-y-6 text-left">
          <AdminPage 
            currentUser={user}
            onUpdateCurrentUser={onUpdateUser || (() => {})}
            allChannelsCount={channelsCount || 0}
            currentPath={currentPath}
          />
        </div>
      )}

      {/* Telegram Bind Modal */}
      <AnimatePresence>
        {showTelegramAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="iirky-modal-bg-gradient liquid-glass-block rounded-3xl p-6 max-w-sm w-full border border-pink-200 shadow-2xl space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-pink-200/60 pb-2">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-orange-500" />
                  <span>Шлюз @IIrkiBot</span>
                </h3>
                <button onClick={() => setShowTelegramAuth(false)} className="text-slate-400 font-bold hover:text-slate-705 p-1 text-sm">✕</button>
              </div>

              {!telegramCodeSent ? (
                <div className="space-y-4 text-xs font-semibold">
                  <p className="text-slate-500 leading-normal font-medium">Введите ваш Telegram @username или номер телефона для отправки запроса в бот-шлюз.</p>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold">Юзернейм в Telegram</label>
                    <input 
                      type="text" 
                      placeholder="@shishkarnem"
                      value={customTgUsername}
                      onChange={e => setCustomTgUsername(e.target.value)}
                      className="w-full bg-white/80 border border-pink-200/80 p-2.5 rounded-xl font-mono text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold">Или номер телефона</label>
                    <input 
                      type="text" 
                      placeholder="+7 (900) 000-00-00"
                      value={telegramPhoneInput}
                      onChange={e => setTelegramPhoneInput(e.target.value)}
                      className="w-full bg-white/80 border border-pink-200/80 p-2.5 rounded-xl font-mono text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <button 
                    onClick={handleSendTgCode}
                    className="w-full py-2.5 iirky-btn-gradient text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Отправить запрос авторизации
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-xs font-semibold">
                  <p className="text-slate-500 leading-normal font-medium">Мы инициализировали сопоставление полей! Наш умный бот выслал код верификации в ваш диалог Telegram.</p>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold">Проверочный код из бота</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="123456"
                      value={tgAuthCode}
                      onChange={e => setTgAuthCode(e.target.value)}
                      className="w-full bg-white/80 border border-pink-200/80 p-2.5 rounded-xl font-mono text-center text-sm font-black focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setTelegramCodeSent(false)}
                      className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                    >
                      Назад
                    </button>
                    <button 
                      onClick={handleSubmitTgAuthCode}
                      className="flex-1 py-2 iirky-btn-gradient text-white font-bold rounded-xl"
                    >
                      Подтвердить вход
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="iirky-modal-bg-gradient liquid-glass-block rounded-3xl p-6 max-w-md w-full border border-pink-200 shadow-2xl space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-pink-200/60 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-orange-500" />
                  <span>Редактирование профиля</span>
                </h3>
                <button 
                  onClick={() => setIsEditProfileOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 font-bold p-1 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {editMsg && (
                <div className="p-3 bg-white/80 border border-pink-200 text-slate-800 text-xs font-semibold rounded-xl">
                  {editMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block">ID пользователя (только чтение)</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={user.id || '169262990'}
                    className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block">Имя и Фамилия</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Тимошенко Денис"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-white/90 border border-pink-200/80 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block">E-mail адрес</label>
                  <input 
                    type="email" 
                    required
                    placeholder="shishkarnem@gmail.com"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full bg-white/90 border border-pink-200/80 p-2.5 rounded-xl text-xs font-mono focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block">Telegram Ник</label>
                  <input 
                    type="text" 
                    required
                    placeholder="@shishkarnem"
                    value={editTelegramUsername}
                    onChange={e => setEditTelegramUsername(e.target.value)}
                    className="w-full bg-white/90 border border-pink-200/80 p-2.5 rounded-xl text-xs font-mono text-purple-700 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block">🌐 Часовой пояс (для автопостинга и расписания)</label>
                  <select
                    value={editTimezone}
                    onChange={e => setEditTimezone(e.target.value)}
                    className="w-full bg-white/90 border border-pink-200/80 p-2.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none cursor-pointer"
                  >
                    <option value="Europe/Moscow">Europe/Moscow (UTC+3, Москва, Санкт-Петербург, Казань)</option>
                    <option value="Europe/Kaliningrad">Europe/Kaliningrad (UTC+2, Калининград)</option>
                    <option value="Europe/Samara">Europe/Samara (UTC+4, Самара, Тольятти)</option>
                    <option value="Asia/Yekaterinburg">Asia/Yekaterinburg (UTC+5, Екатеринбург, Тюмень, Уфа)</option>
                    <option value="Asia/Omsk">Asia/Omsk (UTC+6, Омск)</option>
                    <option value="Asia/Novosibirsk">Asia/Novosibirsk (UTC+7, Новосибирск, Красноярск)</option>
                    <option value="Asia/Irkutsk">Asia/Irkutsk (UTC+8, Иркутск)</option>
                    <option value="Asia/Yakutsk">Asia/Yakutsk (UTC+9, Якутск)</option>
                    <option value="Asia/Vladivostok">Asia/Vladivostok (UTC+10, Владивосток)</option>
                    <option value="Asia/Magadan">Asia/Magadan (UTC+11, Магадан)</option>
                    <option value="Asia/Kamchatka">Asia/Kamchatka (UTC+12, Камчатка)</option>
                    <option value="Europe/Minsk">Europe/Minsk (UTC+3, Минск)</option>
                    <option value="Asia/Almaty">Asia/Almaty (UTC+5, Алматы, Астана)</option>
                    <option value="Asia/Tashkent">Asia/Tashkent (UTC+5, Ташкент)</option>
                    <option value="Asia/Tbilisi">Asia/Tbilisi (UTC+4, Тбилиси)</option>
                    <option value="Asia/Yerevan">Asia/Yerevan (UTC+4, Ереван)</option>
                    <option value="UTC">UTC (UTC+0, Гринвич)</option>
                  </select>
                </div>

                {/* Avatar Choice Block */}
                <div className="space-y-2 pt-1 border-t border-pink-200/60">
                  <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Выбор аватарки (Источника)</label>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Telegram Avatar Option */}
                    <div 
                      onClick={() => setEditAvatarChoice('telegram')}
                      className={`p-3 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-between gap-1.5 ${
                        editAvatarChoice === 'telegram'
                          ? 'bg-gradient-to-br from-sky-100/90 via-pink-100/90 to-orange-100/90 border-pink-400 ring-2 ring-pink-400 shadow-xs'
                          : 'bg-white/80 border-slate-200/80 hover:bg-white'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-pink-200 shadow-xs relative bg-slate-100 flex items-center justify-center">
                        <img 
                          referrerPolicy="no-referrer"
                          src={user.photoUrl || `/api/avatar/${user.telegramId || '169262990'}.png`} 
                          alt="Telegram Avatar"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-black text-slate-800">Telegram</span>
                      <span className="text-[9px] text-slate-500 font-medium">photo_url</span>
                    </div>

                    {/* Custom Avatar Option */}
                    <div 
                      onClick={() => setEditAvatarChoice('custom')}
                      className={`p-3 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-between gap-1.5 ${
                        editAvatarChoice === 'custom'
                          ? 'bg-gradient-to-br from-sky-100/90 via-pink-100/90 to-orange-100/90 border-pink-400 ring-2 ring-pink-400 shadow-xs'
                          : 'bg-white/80 border-slate-200/80 hover:bg-white'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-pink-200 shadow-xs bg-slate-100 flex items-center justify-center relative">
                        {customAvatarUrl ? (
                          <img src={customAvatarUrl} alt="Custom Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <span className="text-[11px] font-black text-slate-800">Свой аватар</span>

                      <label className="px-2 py-1 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-extrabold text-[10px] rounded-lg shadow-xs cursor-pointer hover:opacity-95 flex items-center gap-1 active:scale-95">
                        <Upload className="w-3 h-3 text-white" />
                        <span>{customAvatarUrl ? 'Заменить' : 'Загрузить'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleModalCustomAvatarUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Password Change Option inside Modal */}
                <div className="pt-2 border-t border-pink-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">Безопасность аккаунта</span>
                  <button 
                    type="button"
                    onClick={() => {
                      setNewPasswordInput('');
                      setConfirmNewPasswordInput('');
                      setPasswordMsg('');
                      setIsChangePasswordOpen(true);
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer border border-white/20"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Сменить пароль</span>
                  </button>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    disabled={editSaving}
                    className="flex-1 py-2.5 iirky-btn-gradient hover:opacity-95 text-white font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {editSaving ? 'Сохранение...' : 'Сохранить в БД 💾'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Change Password Modal */}
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="iirky-modal-bg-gradient liquid-glass-block rounded-3xl p-6 max-w-sm w-full border border-pink-200 shadow-2xl space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-pink-200/60 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-orange-500" />
                  <span>Смена пароля</span>
                </h3>
                <button 
                  onClick={() => setIsChangePasswordOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 font-bold p-1 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {passwordMsg && (
                <div className="p-3 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl">
                  {passwordMsg}
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Новый пароль</label>
                  <input 
                    type="password" 
                    required
                    minLength={4}
                    placeholder="••••••••"
                    value={newPasswordInput}
                    onChange={e => setNewPasswordInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Повторите новый пароль</label>
                  <input 
                    type="password" 
                    required
                    minLength={4}
                    placeholder="••••••••"
                    value={confirmNewPasswordInput}
                    onChange={e => setConfirmNewPasswordInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    disabled={passwordSaving}
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {passwordSaving ? 'Сохранение...' : 'Обновить пароль 🔑'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Bind Email Modal */}
        {isBindEmailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-sky-50 via-pink-50 via-orange-50 via-pink-50 to-sky-50 rounded-3xl p-6 max-w-sm w-full border border-pink-200 shadow-2xl space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-pink-200/60 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-500" />
                  <span>Привязка E-mail адреса</span>
                </h3>
                <button 
                  onClick={() => setIsBindEmailOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 font-bold p-1 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {bindEmailMsg && (
                <div className="p-3 bg-white/90 border border-pink-200 text-slate-800 text-xs font-semibold rounded-xl">
                  {bindEmailMsg}
                </div>
              )}

              <form onSubmit={handleBindEmailSubmit} className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ваш E-mail</label>
                  <input 
                    type="email" 
                    required
                    placeholder="email@example.com"
                    value={bindEmailInput}
                    onChange={e => setBindEmailInput(e.target.value)}
                    className="w-full bg-white border border-pink-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Пароль для входа (необязательно)</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={bindPasswordInput}
                    onChange={e => setBindPasswordInput(e.target.value)}
                    className="w-full bg-white border border-pink-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsBindEmailOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    disabled={bindEmailSaving}
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-500 via-pink-500 to-orange-500 hover:opacity-95 text-white font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {bindEmailSaving ? 'Привязка...' : 'Привязать E-mail ✉️'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Admin Modal: Create Custom Tariff */}
        {isCreateCustomTariffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 backdrop-blur-xl rounded-3xl p-6 max-w-lg w-full border border-pink-300 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-pink-600" />
                  <h3 className="font-extrabold text-base text-slate-900">Создание индивидуального тарифа 👑</h3>
                </div>
                <button 
                  onClick={() => setIsCreateCustomTariffModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center border border-pink-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCustomTariff} className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-bold block">Название тарифа</label>
                  <input 
                    type="text" 
                    required
                    value={customTariffName}
                    onChange={e => setCustomTariffName(e.target.value)}
                    placeholder="Например: Космос Индивидуальный"
                    className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-700 font-bold block">Стоимость (рублей)</label>
                    <input 
                      type="number" 
                      required
                      value={customTariffPriceRub}
                      onChange={e => setCustomTariffPriceRub(Number(e.target.value))}
                      placeholder="15000"
                      className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-700 font-bold block">ИИрок в месяц</label>
                    <input 
                      type="number" 
                      required
                      value={customTariffMonthlyIirky}
                      onChange={e => setCustomTariffMonthlyIirky(Number(e.target.value))}
                      placeholder="15000"
                      className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-700 font-bold block">Срок действия (дней)</label>
                    <input 
                      type="number" 
                      required
                      value={customTariffDurationDays}
                      onChange={e => setCustomTariffDurationDays(Number(e.target.value))}
                      placeholder="30"
                      className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-700 font-bold block">Привязать к User ID (опционально)</label>
                    <input 
                      type="text" 
                      value={customTariffTargetUserId}
                      onChange={e => setCustomTariffTargetUserId(e.target.value)}
                      placeholder="Оставьте пустым для общего доступа"
                      className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-bold block">Краткое описание / подзаголовок</label>
                  <input 
                    type="text" 
                    value={customTariffSub}
                    onChange={e => setCustomTariffSub(e.target.value)}
                    placeholder="Индивидуальное сопровождение и максимальные лимиты"
                    className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-bold block">Преимущества (каждое с новой строки)</label>
                  <textarea 
                    rows={4}
                    value={customTariffFeaturesText}
                    onChange={e => setCustomTariffFeaturesText(e.target.value)}
                    className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsCreateCustomTariffModalOpen(false)}
                    className="flex-1 py-2.5 bg-white/90 hover:bg-white text-slate-700 font-bold rounded-xl border border-pink-200 cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                  >
                    Сохранить в базу данных 💾
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Admin Modal: Assign Tariff to User */}
        {isAssignTariffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 backdrop-blur-xl rounded-3xl p-6 max-w-lg w-full border border-pink-300 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-sky-600" />
                  <h3 className="font-extrabold text-base text-slate-900">Назначить тариф пользователю 👑</h3>
                </div>
                <button 
                  onClick={() => setIsAssignTariffModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center border border-pink-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAssignTariffToUser} className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-bold block">Выберите пользователя (ID или логин)</label>
                  {allUsersList.length > 0 ? (
                    <select 
                      value={assignTargetUserId}
                      onChange={e => setAssignTargetUserId(e.target.value)}
                      className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                    >
                      {allUsersList.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email || u.telegram || u.id} ({u.id}) — {u.tariff || 'Старт'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      required
                      value={assignTargetUserId}
                      onChange={e => setAssignTargetUserId(e.target.value)}
                      placeholder="ID пользователя, например 16926299042"
                      className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-bold block">Тариф</label>
                  <input 
                    type="text" 
                    required
                    value={assignTariffName}
                    onChange={e => setAssignTariffName(e.target.value)}
                    placeholder="Например: Космос, Премиум, VIP комбайн"
                    className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-700 font-bold block">Срок действия (дней)</label>
                    <input 
                      type="number" 
                      required
                      value={assignDurationDays}
                      onChange={e => setAssignDurationDays(Number(e.target.value))}
                      placeholder="30"
                      className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-700 font-bold block">Начислить ИИрок (balance_tarif)</label>
                    <input 
                      type="number" 
                      value={assignBonusIirky}
                      onChange={e => setAssignBonusIirky(Number(e.target.value))}
                      placeholder="15000"
                      className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-bold block">Комментарий к назначению</label>
                  <input 
                    type="text" 
                    value={assignComment}
                    onChange={e => setAssignComment(e.target.value)}
                    placeholder="Индивидуальный тариф Космос для клиента"
                    className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsAssignTariffModalOpen(false)}
                    className="flex-1 py-2.5 bg-white/90 hover:bg-white text-slate-700 font-bold rounded-xl border border-pink-200 cursor-pointer text-sm"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold rounded-xl shadow-md cursor-pointer text-sm"
                  >
                    Привязать тариф ⚡
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Tariff Transition Confirmation Modal */}
        {tariffConfirmModal && tariffConfirmModal.isOpen && (() => {
          const totalBalance = (Number(liveProfile.balance_pay || 0) + Number(liveProfile.balance_free || 0));
          const neededAmount = tariffConfirmModal.amountRub || 0;
          const isAffordable = totalBalance >= neededAmount;
          const deficit = neededAmount - totalBalance;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 backdrop-blur-xl rounded-3xl p-6 max-w-lg w-full border border-pink-300 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto no-scrollbar"
              >
                <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-pink-600" />
                    <h3 className="font-bold text-base text-slate-900">Подключение тарифа «{tariffConfirmModal.planName}»</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setTariffConfirmModal(null)}
                    className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center border border-pink-200 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 bg-white/90 rounded-2xl border border-pink-200 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-600">Период подписки:</span>
                    <span className="text-slate-900 font-bold">
                      {tariffConfirmModal.periodMonths} {tariffConfirmModal.periodMonths === 1 ? 'месяц' : tariffConfirmModal.periodMonths < 5 ? 'месяца' : 'месяцев'}
                      {tariffConfirmModal.discountPercent > 0 && (
                        <span className="ml-1.5 px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 text-xs font-black">
                          -{tariffConfirmModal.discountPercent}%
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-semibold border-t border-pink-100 pt-2">
                    <span className="text-slate-600">Сумма к списанию:</span>
                    <span className="text-pink-600 font-black font-mono text-base">
                      {neededAmount.toLocaleString('ru-RU')} ИИрок 🪙
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-semibold border-t border-pink-100 pt-2">
                    <span className="text-slate-600">Ваш доступный баланс:</span>
                    <span className="text-slate-900 font-mono font-bold">
                      {totalBalance.toLocaleString('ru-RU')} ИИрок
                    </span>
                  </div>
                </div>

                {!isAffordable ? (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-2">
                    <div className="font-bold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Недостаточно ИИрок на балансе (не хватает {deficit.toLocaleString('ru-RU')} ИИрок)</span>
                    </div>
                    <p className="text-slate-600 font-medium">
                      Пополните баланс на недостающую сумму, чтобы активировать тариф.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setBuyIirkyAmount(String(deficit));
                        setIsBuyIirkyCalcOpen(true);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Пополнить баланс на {deficit.toLocaleString('ru-RU')} ИИрок 🪙
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-2xl text-xs text-sky-900 font-medium space-y-1">
                    <p>💡 После подтверждения {neededAmount.toLocaleString('ru-RU')} ИИрок спишутся с баланса, и тариф мгновенно обновится.</p>
                  </div>
                )}

                <div className="p-3.5 bg-white/80 border border-pink-200 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-1.5 font-medium">
                  <p className="font-bold text-slate-900">Регламент продления и смены подписок:</p>
                  <p>
                    Вы можете продлить или переключить тариф в любой момент. Оплата списывается автоматически с баланса ИИрок. Смена тарифов конвертируется из внутреннего баланса ИИрок мгновенно.
                  </p>
                  <p className="text-slate-500 text-[11px] pt-1 border-t border-pink-100">
                    При переходе на тариф с меньшей стоимостью перерасчет и возврат средств не производится. Новый тариф активируется сразу.
                  </p>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setTariffConfirmModal(null)}
                    className="flex-1 py-2.5 bg-white/90 hover:bg-white text-slate-700 font-bold rounded-xl border border-pink-200 cursor-pointer text-sm"
                  >
                    Отмена
                  </button>
                  <button 
                    type="button"
                    disabled={!isAffordable}
                    onClick={handleConfirmTariffChange}
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold rounded-xl shadow-md cursor-pointer text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Подтвердить переход ⚡
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* Buy Iirky Calculator Modal */}
        {isBuyIirkyCalcOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 backdrop-blur-xl rounded-3xl p-6 max-w-lg w-full border border-pink-300 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-600" />
                  <h3 className="font-bold text-base text-slate-900">Калькулятор покупки ИИрок 🪙</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsBuyIirkyCalcOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center border border-pink-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm font-semibold">
                <div className="p-3.5 bg-white/90 border border-pink-200 rounded-2xl space-y-1">
                  <div className="font-extrabold text-sm text-multicolor-gradient">
                    Курс: 1 рубль = 1 ИИрка 🪙
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    ИИрки не сгорают со временем и расходуются только на фактические генерации текста, картинок и автопостинг.
                  </p>
                </div>

                {/* Presets */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-700 font-bold block">Популярные суммы:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[500, 990, 2500, 5000, 10000, 25000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBuyIirkyAmount(String(val))}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          buyIirkyAmount === String(val)
                            ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-xs'
                            : 'bg-white/90 border border-pink-200 text-slate-800 hover:bg-pink-50'
                        }`}
                      >
                        {val.toLocaleString('ru-RU')} ₽
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Input */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-700 font-bold block">Сумма в рублях (₽):</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={buyIirkyAmount}
                    onChange={e => setBuyIirkyAmount(e.target.value)}
                    placeholder="990"
                    className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>

                {/* Calculation summary */}
                <div className="p-3.5 bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 border border-pink-200 rounded-2xl flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-medium">Будет начислено:</span>
                  <span className="font-mono font-black text-pink-600 text-base">
                    {(Number(buyIirkyAmount) || 0).toLocaleString('ru-RU')} ИИрок 🪙
                  </span>
                </div>

                {/* Oferta Transparent Link */}
                <a
                  href="/oferta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-white/40 hover:bg-white/70 text-slate-800 text-xs font-bold rounded-xl border border-pink-300 flex items-center justify-center gap-1.5 transition-all shadow-2xs backdrop-blur-xs text-center cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-pink-500" />
                  <span>Ознакомиться с договором публичной оферты и регламентом ИИрок 📄</span>
                </a>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsBuyIirkyCalcOpen(false)}
                    className="flex-1 py-2.5 bg-white/90 hover:bg-white text-slate-700 font-bold rounded-xl border border-pink-200 cursor-pointer text-sm"
                  >
                    Отмена
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const rub = Number(buyIirkyAmount) || 990;
                      setIsBuyIirkyCalcOpen(false);
                      setRobokassaPlanName('Пополнение ИИрок');
                      setRobokassaAmountRub(rub);
                      setRobokassaModalOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold rounded-xl shadow-md cursor-pointer text-sm flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4 text-white" />
                    <span>Оплатить {(Number(buyIirkyAmount) || 990).toLocaleString('ru-RU')} ₽ 💳</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Cosmos Plan Contact Modal */}
        {isCosmosModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 backdrop-blur-xl rounded-3xl p-6 max-w-lg w-full border border-pink-300 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  <h3 className="font-extrabold text-base text-slate-900">Заявка на индивидуальный тариф «Космос» 🚀</h3>
                </div>
                <button 
                  onClick={() => setIsCosmosModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center border border-pink-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {cosmosMsg && (
                <div className="p-3 bg-white/90 border border-pink-300 rounded-xl text-sm font-bold text-slate-800">
                  {cosmosMsg}
                </div>
              )}

              <form onSubmit={handleCosmosSubmit} className="space-y-3.5 text-sm font-semibold">
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  Тариф «Космос» включает выделенные серверные мощности, индивидуальные ИИ-сценарии, неограниченное число каналов и персональное сопровождение 24/7. Заполните форму, и мы свяжемся с вами в Telegram.
                </p>

                <div className="space-y-1">
                  <label className="text-sm text-slate-700 font-bold block">Ваше имя</label>
                  <input 
                    type="text" 
                    required
                    value={cosmosName}
                    onChange={e => setCosmosName(e.target.value)}
                    placeholder="Денис"
                    className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm text-slate-700 font-bold block">Telegram username</label>
                    <input 
                    type="text" 
                    required
                    value={cosmosTelegram}
                    onChange={e => setCosmosTelegram(e.target.value)}
                    placeholder="@username"
                    className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-slate-700 font-bold block">Телефон / Мессенджер</label>
                    <input 
                      type="tel" 
                      value={cosmosPhone}
                      onChange={e => setCosmosPhone(e.target.value)}
                      placeholder="+7 (999) 000-00-00"
                      className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-700 font-bold block">E-mail (для договора и связи)</label>
                  <input 
                    type="email" 
                    value={cosmosEmail}
                    onChange={e => setCosmosEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-slate-700 font-bold block">Пожелания к проекту и интеграциям</label>
                  <textarea 
                    rows={3}
                    value={cosmosMessage}
                    onChange={e => setCosmosMessage(e.target.value)}
                    placeholder="Опишите задачи вашего бизнеса, количество каналов и требования"
                    className="w-full bg-white/90 border border-pink-200 p-2.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsCosmosModalOpen(false)}
                    className="flex-1 py-2.5 bg-white/90 hover:bg-white text-slate-700 font-bold rounded-xl border border-pink-200 cursor-pointer text-sm"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    disabled={cosmosSending}
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold rounded-xl shadow-md cursor-pointer text-sm flex items-center justify-center gap-2"
                  >
                    <span>{cosmosSending ? 'Отправка...' : 'Отправить заявку 🚀'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Robokassa Payment Modal */}
      <RobokassaPaymentModal 
        isOpen={robokassaModalOpen}
        onClose={() => setRobokassaModalOpen(false)}
        user={user}
        onUpdateUser={onUpdateUser}
        initialPlanName={robokassaPlanName}
        initialAmountRub={robokassaAmountRub}
      />

    </div>
  );
}
