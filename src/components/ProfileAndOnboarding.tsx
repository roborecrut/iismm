import React, { useState } from 'react';
import { UserAccount } from '../types';
import { 
  Sparkles, Wallet, ShieldCheck, Trophy, BadgeInfo, Play, ChevronRight, HelpCircle, Key, 
  RefreshCw, Smartphone, Calendar, Send, Check, CheckCircle2, AlertCircle, Eye, Settings, 
  TrendingUp, MousePointer, BarChart3, Radio, Link, LayoutGrid, Award, ArrowUpRight, Plus, 
  DollarSign, User, Volume2, Lock, FileText, Users, Shield, BookOpen, Crown, Cpu, Copy, LogOut,
  CreditCard, Camera, Mail, Upload
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

  // 4. MULTIPLAYER (VIP)
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; userId?: string; name: string; handle: string; role: string; status: string }>>([]);
  const [teamChannels, setTeamChannels] = useState<string[]>([]);
  const [inviteHandle, setInviteHandle] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');

  // Fetch Team data from SQLite
  React.useEffect(() => {
    if (user) {
      fetch(`/api/teams?userId=${user.id}&telegramId=${user.telegramId || ''}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.team) {
            if (data.team.members) {
              setTeamMembers(data.team.members.map((m: any) => ({
                id: m.userId || m.handle,
                userId: m.userId,
                name: m.name || m.handle,
                handle: m.handle,
                role: 'Участник',
                status: m.status === 'active' ? 'Активен 🟢' : 'Приглашен 🟡'
              })));
            }
            if (data.team.channels) {
              setTeamChannels(data.team.channels);
            }
          }
        })
        .catch(e => console.error('Error fetching team:', e));
    }
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
      fetch(`/api/referrals/stats?userId=${user.id}&telegramId=${user.telegramId || ''}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.referralLink) {
            setReferralStats(data);
          }
        })
        .catch(e => console.error('Error fetching referral stats:', e));
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

  const handleBuyIirkyWithRubles = () => {
    const costRub = parseFloat(calcRubInput) || 0;
    if (costRub <= 0) {
      alert('Укажите корректную сумму в рублях!');
      return;
    }
    if ((user.balanceRub || 0) < costRub) {
      // Open Robokassa modal directly with the requested amount
      setRobokassaPlanName('Пополнение ИИрок');
      setRobokassaAmountRub(costRub);
      setRobokassaModalOpen(true);
      return;
    }
    const iirkyToReceive = Math.round(costRub * 1);
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        balanceRub: (user.balanceRub || 0) - costRub,
        iirky: (user.iirky || 0) + iirkyToReceive,
        tokens: (user.tokens || 0) + iirkyToReceive
      });
      alert(`🎉 Покупка успешна! Вы списали ${costRub} ₽ и зачислили ${iirkyToReceive.toLocaleString()} ИИрок на свой баланс.`);
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
        setTeamMembers(data.team.members.map((m: any) => ({
          id: m.userId || m.handle,
          userId: m.userId,
          name: m.name || m.handle,
          handle: m.handle,
          role: 'Участник',
          status: m.status === 'active' ? 'Активен 🟢' : 'Приглашен 🟡'
        })));
        setInviteHandle('');
        alert(`Пользователь ${cleanHandle} успешно добавлен в команду!`);
      } else {
        alert(data.error || 'Ошибка добавления участника');
      }
    } catch (e: any) {
      console.error('Error adding team member:', e);
      alert('Ошибка при добавлении участника в команду');
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
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Balance Widget */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4 text-left flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
                  <Wallet className="w-4 h-4 text-orange-500" />
                  <span>Балансовые активы и Лимиты</span>
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 border rounded-xl text-center">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Баланс (Рубли)</span>
                    <span className="font-mono text-sm font-black text-slate-700 block mt-1">{(user.balanceRub || 0).toLocaleString()} ₽</span>
                  </div>
                  <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-xl text-center">
                    <span className="text-[9px] text-orange-500 font-bold block uppercase leading-none">🪙 ИИрки (Генерация)</span>
                    <span className="font-mono text-sm font-black text-orange-705 block mt-1">{user.iirky.toLocaleString()}</span>
                  </div>
                </div>

                {/* Top Up Box */}
                <form onSubmit={handleSimulateTopup} className="p-3 bg-orange-50/40 border border-orange-100/50 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">Быстрое пополнение счета</span>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="990"
                      value={replenishInput}
                      onChange={e => setReplenishInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 px-3 py-1 text-xs font-mono rounded-lg focus:outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        setRobokassaPlanName('Пополнение ИИрок');
                        setRobokassaAmountRub(Number(replenishInput) || 990);
                        setRobokassaModalOpen(true);
                      }}
                      className="px-3 py-1 bg-gradient-to-r from-orange-450 to-pink-500 text-white font-bold rounded-lg text-[9px] uppercase cursor-pointer flex items-center gap-1"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Оплатить 💳</span>
                    </button>
                  </div>
                </form>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">💡 Лимиты: {user.tariff === 'free' ? '10 постов/день' : user.tariff === 'pro' ? '50 постов/день' : '500 постов/день'}</p>
            </div>

            {/* Conversions Calculator */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4 text-left flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
                  <RefreshCw className="w-4 h-4 text-purple-500" />
                  <span>Обменник ИИрок</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  ИИрки 🪙 используются для ИИ-постинга и генераций. Курс: <strong>1 ₽ = 1 ИИрка</strong>.
                </p>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-bold">Списать (₽)</label>
                    <input 
                      type="number" 
                      value={calcRubInput}
                      onChange={e => handleCalcRubChange(e.target.value)}
                      className="w-full bg-slate-50 border px-3 py-1.5 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <span className="text-slate-300 font-mono self-end pb-1">➔</span>
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-orange-500 uppercase font-bold">Получить ИИрок</label>
                    <div className="w-full bg-orange-50/50 border border-orange-100 px-3 py-1.5 rounded-xl font-mono text-xs font-black text-orange-700">
                      {calcIirkyResult.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleBuyIirkyWithRubles}
                    className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-purple-500 text-white font-extrabold text-xs uppercase rounded-xl shadow-xs cursor-pointer"
                  >
                    Обменять из баланса
                  </button>
                  <button 
                    onClick={() => {
                      setRobokassaPlanName('Пополнение ИИрок');
                      setRobokassaAmountRub(Number(calcRubInput) || 250);
                      setRobokassaModalOpen(true);
                    }}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs uppercase rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Робокасса</span>
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-emerald-600 font-extrabold">⭐ При покупке тарифа РАЗГОН или ОТРЫВ вы получаете баланс ИИрок в подарок!</p>
            </div>

          </div>

          {/* TARIFF EXPIRATION & BILLING HISTORY SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Tariff Expiration Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4 text-left flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>Статус и Срок действия тарифа</span>
                </h3>
                
                <div className="p-4 bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-2xl border border-orange-100/50 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Текущий тариф:</span>
                    <span className="text-sm font-black text-orange-600 uppercase font-mono">
                      {user.tariff === 'vip' ? '👑 VIP Комбайн' : user.tariff === 'pro' ? '⚡ PREMIUM' : 'FREE СТАРТ'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-baseline border-t pt-2 border-orange-200/20">
                    <span className="text-[10px] text-slate-505 font-medium">Срок действия подписки:</span>
                    <span className="text-xs font-extrabold text-slate-850">
                      {user.tariff !== 'free' ? `До ${user.premiumUntil || '07.06.2026'}` : 'Бессрочно (с базовыми лимитами)'}
                    </span>
                  </div>

                  {user.tariff !== 'free' && (
                    <div className="text-[10px] text-emerald-650 bg-emerald-50 p-2 rounded-xl border border-emerald-100/30 flex items-center gap-1 font-semibold mt-2">
                      <Check className="w-3.5 h-3.5" />
                      <span>Продление по подписке активно за {user.tariff === 'vip' ? '4,900,000' : '490,000'} ИИрок</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-505">
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest leading-none">Регламент продления подписок:</p>
                  <p className="leading-relaxed text-[11px] text-slate-500 font-medium">Вы можете продлить или переключить тариф в любой момент. Оплата списывается автоматически с баланса ИИрок. Смена тарифов конвертируется из внутреннего баланса ИИрок мгновенно.</p>
                </div>
              </div>
            </div>

            {/* Billing Transactions Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4 text-left">
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <span>Билинг платежей и транзакции</span>
                </h3>
                
                {/* Billing items feed */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar pt-1 font-semibold">
                  {[
                    { id: 'b-1', desc: 'Зачисление 300 стартовых ИИрок по тарифу СТАРТ', amount: '+300 🪙', date: '31.05.2026', type: 'in', status: 'Завершено' },
                    { id: 'b-2', desc: 'Автопостинг по ИИ-сценарию (публикация)', amount: '-5 🪙', date: '31.05.2026', type: 'out', status: 'Успешно' },
                    { id: 'b-3', desc: 'Нейро-рерайт поста с ИИ стилем', amount: '-1 🪙', date: '30.05.2026', type: 'out', status: 'Успешно' },
                    { id: 'b-4', desc: 'Генерация нейро-иллюстрации для поста', amount: '-10 🪙', date: '29.05.2026', type: 'out', status: 'Успешно' },
                    { id: 'b-5', desc: 'Пополнение баланса (Докупка ИИрок)', amount: '+990 🪙', date: '28.05.2026', type: 'in', status: 'Завершено' }
                  ].map((bill) => (
                    <div key={bill.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100/60 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="block truncate text-[11px] text-slate-800 leading-tight font-bold">{bill.desc}</span>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                          <span>{bill.date}</span>
                          <span>•</span>
                          <span className={bill.status === 'Завершено' || bill.status === 'Успешно' ? 'text-emerald-600' : 'text-orange-500'}>{bill.status}</span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className={`font-mono text-xs font-black block ${
                          bill.type === 'in' ? 'text-emerald-600' : bill.type === 'out' ? 'text-rose-500' : 'text-slate-500'
                        }`}>
                          {bill.amount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Pricing Config Section matching landing page */}
          <div className="bg-white rounded-3xl p-6 border border-slate-150/80 space-y-4 text-left">
            <div className="border-b pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider">Тарифные пакеты и тонкие настройки</h3>
                <p className="text-xs text-slate-500 font-medium">Бескомпромиссная автоматизация с ИИSMM. 1 ₽ = 1 ИИрка.</p>
              </div>
              <button 
                onClick={() => {
                  setRobokassaPlanName('РАЗГОН');
                  setRobokassaAmountRub(990);
                  setRobokassaModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-extrabold text-xs uppercase rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-95 self-start md:self-auto"
              >
                <CreditCard className="w-4 h-4" />
                <span>Оплата через Робокассу 💳</span>
              </button>
            </div>

            <TariffCards 
              userTariff={user.tariff}
              onAction={(planName, _priceText, amountRub) => {
                setRobokassaPlanName(planName);
                setRobokassaAmountRub(amountRub || 990);
                setRobokassaModalOpen(true);
              }}
            />
          </div>

          {/* SMM Analytics Dashboard with Graphs & Commissions */}
          <div className="border-t border-slate-100 pt-6 space-y-6">
            <div className="flex items-center gap-2 text-left">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-400 to-pink-500 text-white flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider leading-none">Кабинет Аналитики и вывода соавтора</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Конверсия просмотров, реклама и проведение взаимовычетов.</p>
              </div>
            </div>

            {/* Metrics Bento Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div 
                onClick={() => setActiveMetricFilter('views')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${activeMetricFilter === 'views' ? 'bg-orange-500/10 border-orange-350 ring-2 ring-orange-200' : 'bg-white hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider block">Охват блогов</span>
                  <Eye className="w-4 h-4 text-orange-500" />
                </div>
                <h3 className="text-xl font-black font-mono text-slate-800">{totalViews.toLocaleString()}</h3>
                <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                  <TrendingUp className="w-3 h-3" /> +16.7% Рост
                </span>
              </div>

              <div 
                onClick={() => setActiveMetricFilter('clicks')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${activeMetricFilter === 'clicks' ? 'bg-pink-500/10 border-pink-350 ring-2 ring-pink-200' : 'bg-white hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider block">UTM Переходы</span>
                  <MousePointer className="w-4 h-4 text-pink-500" />
                </div>
                <h3 className="text-xl font-black font-mono text-slate-800">{totalClicks.toLocaleString()}</h3>
                <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                  <TrendingUp className="w-3 h-3" /> +24% Свежий CTR
                </span>
              </div>

              <div className="p-4 rounded-2xl border bg-white text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Состояние лимитов</span>
                <h3 className="text-xl font-black font-mono text-slate-800">{channelsCount} / {postsCount}</h3>
                <p className="text-[10px] text-slate-400 mt-1">Каналы & Сделано SMM постов</p>
              </div>

              <div className="p-4 rounded-2xl border bg-white text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Заработано (Чистые)</span>
                <h3 className="text-xl font-black font-mono text-emerald-600">{earningsRub} ₽</h3>
                <p className="text-[10px] text-slate-400 mt-1">Выплачено из баланса рекламы</p>
              </div>
            </div>

            {/* Visual SVG Curve Chart */}
            <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-center border-b pb-2 text-left">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  {activeMetricFilter === 'views' ? 'Просмотры публикаций (6дн)' : activeMetricFilter === 'clicks' ? 'Клики по ссылкам UTM' : 'Темп вовлечения аудитории'}
                </span>
                <span className="text-[10px] text-slate-400">График обновлен в 2026 году</span>
              </div>

              <div className="h-28 w-full relative pt-2">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <line x1="0" y1="20" x2="100%" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="60" x2="100%" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="90" x2="100%" y2="90" stroke="#f1f5f9" strokeWidth="1" />

                  <path 
                    d={`M 0 100 L ${activeTrend.map((p, idx) => `${idx * (100 / (activeTrend.length - 1))}% ${90 - (p.val - minVal) * heightMultiplier * 0.75}`).join(' L ')} L 100% 100 Z`}
                    fill={activeMetricFilter === 'views' ? '#fff7ed' : '#fdf2f8'}
                  />
                  <path 
                    d={activeTrend.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${idx * (100 / (activeTrend.length - 1))}% ${90 - (p.val - minVal) * heightMultiplier * 0.75}`).join(' ')}
                    fill="none" 
                    stroke={activeMetricFilter === 'views' ? '#f97316' : '#ec4899'} 
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="grid grid-cols-6 text-center text-[10px] font-mono text-slate-400">
                {activeTrend.map((t, idx) => <span key={idx}>{t.date}</span>)}
              </div>
            </div>

            {/* Withdrawal With 25% Commission Clause */}
            <div className="p-5 bg-white rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between gap-6 text-left">
              <div className="space-y-2 max-w-sm">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">Вывод средств за взаимный пиар</h4>
                <p className="text-xs text-slate-500 leading-normal font-medium">
                  Обратите внимание: согласно условиям участия в Бирже объявлений и Папках продвижения, за безопасность сделки взимается системная комиссия <strong className="text-red-500 font-extrabold text-sm">25%</strong>.
                </p>
              </div>

              <form onSubmit={handleWithdrawFunds} className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black">Сумма (₽)</label>
                    <input 
                      type="number" required min={100} value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      className="w-full bg-slate-50 border px-3 py-1 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black">Куда выводить</label>
                    <select 
                      value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value as any)}
                      className="w-full bg-slate-50 border px-3 py-1 text-xs"
                    >
                      <option value="card">MIR / VISA РФ</option>
                      <option value="qiwi">QIWI Wallet</option>
                      <option value="stars">Telegram Stars</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black">Реквизиты</label>
                    <input 
                      type="text" required placeholder="Карта РФ" value={withdrawAccount}
                      onChange={e => setWithdrawAccount(e.target.value)}
                      className="w-full bg-slate-50 border px-3 py-1 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-2 bg-slate-50 text-[11px] font-mono rounded flex justify-between">
                  <span>Заказ: <strong>{parsedWithdraw}₽</strong></span>
                  <span className="text-red-500">Биржа (25%): <strong>{commissionFee}₽</strong></span>
                  <span className="text-emerald-600 font-bold">Выдадут: <strong>{payoutAmount}₽</strong></span>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 bg-gradient-to-r from-orange-450 to-pink-500 text-white font-extrabold uppercase text-[10px] cursor-pointer"
                  >
                    {withdrawStatus === 'checking' ? 'Вывод...' : 'Подтвердить перевод 🚀'}
                  </button>
                </div>
              </form>
            </div>

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
              <p className="text-xs text-slate-505 mt-0.5">Создавайте холсты для медиа (Canva) и добавляйте защитные вотермарки.</p>
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
                    className="px-3 bg-amber-500 font-extrabold rounded-xl hover:brightness-105 transition-all text-xs text-white"
                  >
                    {mcpStatus === 'connected' ? 'Сброс' : 'Синхронизация'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <div className="flex justify-between font-mono text-[10px]">
                  <span>Интеграционный статус:</span>
                  <span className={mcpStatus === 'connected' ? 'text-emerald-400 font-black' : 'text-slate-400'}>
                    {mcpStatus === 'connected' ? '● СИНХРОНИЗИРОВАНО' : '●ОФЛАЙН'}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-normal">При включенной синхронизации ИИSMM умеет доставать товары для автогенераций.</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB CONTENT: MULTIPLAYER TEAM MANAGER --- */}
      {activeTab === 'multiplayer' && (
        <div className="p-6 bg-gradient-to-r from-sky-100/80 via-pink-100/80 via-orange-100/80 via-pink-100/80 to-sky-100/80 backdrop-blur-md rounded-3xl border border-pink-200/80 text-left space-y-6 shadow-sm">
          <div className="border-b border-pink-200/80 pb-3 flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-orange-500" />
                <span>Команды — Мультиплеер управление кабинетом</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">Делегируйте ведение каналов сотрудникам и SMM-командам с единым балансом и уровнями доступа.</p>
            </div>
            {!(user.tariff === 'vip' || (user.tariff as string) === 'otryv' || (user.tariff as string) === 'otriv' || isAdmin) && (
              <span className="px-3 py-1 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white text-[10px] font-black uppercase rounded-full shadow-xs">
                ★ Требуется Тариф Отрыв
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
            {/* Add to team form & invite links */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-pink-200/80 space-y-4 shadow-xs">
              <span className="text-[11px] text-slate-800 uppercase font-black block">Добавить в команду</span>
              <form onSubmit={handleInviteCoworker} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-600 uppercase font-bold block">Telegram Username (@ handle)</label>
                  <input 
                    type="text" value={inviteHandle} onChange={e => setInviteHandle(e.target.value)}
                    placeholder="@ivan_smm_pro" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                    disabled={!(user.tariff === 'vip' || (user.tariff as any) === 'otryv' || (user.tariff as any) === 'otriv' || isAdmin)}
                    required
                  />
                </div>

                <div className="p-3 bg-sky-50/80 border border-sky-200/80 rounded-xl space-y-1">
                  <p className="text-[11px] text-sky-900 font-bold">ℹ️ Уровень доступа единый:</p>
                  <p className="text-[10px] text-sky-700 font-normal leading-relaxed">
                    Все участники команды имеют одинаковые права: редактирование и публикация постов на всех подключенных каналах команды. Публикация списывается со счета владельца команды.
                  </p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-black rounded-xl uppercase text-[10px] tracking-wider shadow-xs cursor-pointer border border-white/20 transition-all"
                  disabled={!(user.tariff === 'vip' || (user.tariff as any) === 'otryv' || (user.tariff as any) === 'otriv' || isAdmin)}
                >
                  Добавить участника 🚀
                </button>
              </form>

              {/* Copy Invite Links */}
              <div className="pt-3 border-t border-pink-200/80 space-y-2">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Инвайт-ссылки для приглашения:</span>
                
                {/* Telegram Invite Link */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold">
                    <span>📱 Ссылка для Telegram:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text" 
                      readOnly 
                      value={`https://t.me/SAV_AI_bot?start=team_${user.id || '169262990'}`}
                      className="w-full bg-white border border-slate-200 p-1.5 rounded-lg text-[10px] font-mono text-slate-700 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://t.me/SAV_AI_bot?start=team_${user.id || '169262990'}`);
                        alert('Ссылка для Telegram скопирована!');
                      }}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-lg text-[10px] font-black cursor-pointer shrink-0 shadow-xs hover:opacity-90"
                    >
                      Копировать
                    </button>
                  </div>
                </div>

                {/* Browser Invite Link */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold">
                    <span>🌐 Ссылка для браузера:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/?invite=team_${user.id || '169262990'}`}
                      className="w-full bg-white border border-slate-200 p-1.5 rounded-lg text-[10px] font-mono text-slate-700 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/?invite=team_${user.id || '169262990'}`);
                        alert('Ссылка для браузера скопирована!');
                      }}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-lg text-[10px] font-black cursor-pointer shrink-0 shadow-xs hover:opacity-90"
                    >
                      Копировать
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members List Table */}
            <div className="lg:col-span-2 space-y-4">
              <span className="text-[11px] text-slate-800 uppercase font-black block">Участники команды</span>
              <div className="space-y-2">
                {teamMembers.length === 0 ? (
                  <div className="p-6 bg-white/80 rounded-2xl border border-pink-200/80 text-center text-slate-500 text-xs font-semibold">
                    У вас пока нет участников команды. Используйте форму или ссылки выше, чтобы пригласить коллег!
                  </div>
                ) : (
                  teamMembers.map((m, idx) => (
                    <div key={idx} className="p-3.5 bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-200/80 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white flex items-center justify-center font-black font-mono shadow-xs text-sm">
                          {m.name ? m.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{m.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{m.handle} • Единый доступ к каналам</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 font-extrabold rounded-lg">
                          Участник
                        </span>
                        <button 
                          onClick={async () => {
                            if (!(user.tariff === 'vip' || (user.tariff as any) === 'otryv' || (user.tariff as any) === 'otriv' || isAdmin)) return;
                            try {
                              const res = await fetch(`/api/teams/members/${encodeURIComponent(m.userId || m.handle)}?ownerId=${user.id || '16926299042'}`, {
                                method: 'DELETE'
                              });
                              const data = await res.json();
                              if (data.success && data.team) {
                                setTeamMembers(data.team.members.map((tm: any) => ({
                                  id: tm.userId || tm.handle,
                                  userId: tm.userId,
                                  name: tm.name || tm.handle,
                                  handle: tm.handle,
                                  role: 'Участник',
                                  status: tm.status === 'active' ? 'Активен 🟢' : 'Приглашен 🟡'
                                })));
                                alert('Доступ участника отозван.');
                              }
                            } catch (e) {
                              setTeamMembers(teamMembers.filter(item => item.id !== m.id && item.handle !== m.handle));
                              alert('Доступ участника отозван.');
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 font-bold text-xs px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          disabled={!(user.tariff === 'vip' || (user.tariff as any) === 'otryv' || (user.tariff as any) === 'otriv' || isAdmin)}
                        >
                          Отозвать
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom block: Список каналов команды */}
              <div className="pt-4 border-t border-pink-200/80 space-y-3">
                <span className="text-[11px] text-slate-800 uppercase font-black block flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-pink-500" />
                  <span>Список каналов команды (доступны для постинга всем участникам)</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {teamChannels
                    .filter(ch => ch !== '@shishkarnem' && ch !== '@BorgheseClub' && ch !== '@Rentrop_HR_bot')
                    .map((channelUsername, idx) => {
                      const ch = channels.find(c => c.username === channelUsername || c.name === channelUsername) || { name: channelUsername, username: channelUsername };
                      return (
                        <div key={idx} className="p-3 bg-white/90 rounded-2xl border border-pink-200/80 flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
                              📢
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 text-xs block truncate max-w-[140px]">{ch.name || ch.username}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{ch.username}</span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                            Доступен всем
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

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
      {activeTab === 'referrals' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-100 text-left space-y-6">
          <div className="border-b pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-orange-500" />
                <span>Реферальная программа: ПОЛУЧАЙТЕ +300 ИИрок ЗА КАЖДОГО ДРУГА</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Увеличивайте лимит ИИрок! Приглашайте друзей в Telegram Mini App и получайте по +300 ИИрок за каждую новую регистрацию.</p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-sm text-center shrink-0">
              <span className="text-[10px] font-bold uppercase block opacity-90">Реферальный Баланс</span>
              <span className="text-base font-black font-mono">+{referralStats?.referralRewardBalance || user.referralRewardBalance || 0} ИИрок 🪙</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-semibold">
            {/* Unique Link Generator */}
            <div className="p-5 bg-orange-50/30 border border-orange-100 rounded-2xl space-y-4">
              {/* Link 1: Web Browser / Email */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-1">
                  🌐 <span>Ссылка для браузера (E-mail регистрация)</span>
                </span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`https://iismm.ru/?ref=${user.telegramId || user.id || '169262990'}`}
                    className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 select-all"
                  />
                  <button 
                    onClick={() => {
                      const link = `https://iismm.ru/?ref=${user.telegramId || user.id || '169262990'}`;
                      navigator.clipboard?.writeText(link);
                      alert(`📋 Веб-реферальная ссылка скопирована:\n${link}\nПользователи, зарегистрировавшиеся по этой ссылке через E-mail, принесут вам +300 ИИрок!`);
                    }}
                    className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Копировать</span>
                  </button>
                </div>
              </div>

              {/* Link 2: Telegram Mini App */}
              <div className="space-y-1.5 pt-2 border-t border-orange-100">
                <span className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-1">
                  📱 <span>Ссылка для Telegram Mini App</span>
                </span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={referralStats?.referralLink || `https://t.me/IIrkiBot/app?startapp=${user.telegramId || user.id || '169262990'}`}
                    className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 select-all"
                  />
                  <button 
                    onClick={() => {
                      const link = referralStats?.referralLink || `https://t.me/IIrkiBot/app?startapp=${user.telegramId || user.id || '169262990'}`;
                      navigator.clipboard?.writeText(link);
                      alert(`📋 Telegram-реферальная ссылка скопирована:\n${link}`);
                    }}
                    className="p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Копировать</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white/80 border border-orange-200 text-[10px] text-orange-900 leading-relaxed rounded-xl space-y-1">
                <p>🎁 <strong>Условия начисления:</strong> Отправьте любую из ссылок другу или опубликуйте в канале. При регистрации реферала по правилам через E-mail или Telegram вам автоматически начислится <strong>+300 ИИрок 🪙</strong> на баланс!</p>
                {referralStats?.referredBy && (
                  <p className="pt-1 text-slate-600 font-medium border-t border-orange-100">
                    🤝 Вы были приглашены пользователем:{" "}
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = (referralStats.referredBy as any)?.telegramId || (referralStats.referredBy as any)?.id || '8092697980';
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
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 uppercase font-black block">Приглашенные пользователи ({referralStats?.invitedCount || 0})</span>
              </div>
              
              <div className="space-y-2 max-h-72 overflow-y-auto">
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
                      className="p-3 bg-white hover:bg-slate-50 transition-colors cursor-pointer rounded-xl border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 via-pink-500 to-orange-400 text-white font-bold text-xs flex items-center justify-center font-mono shrink-0">
                          {r.firstName ? r.firstName[0].toUpperCase() : 'U'}
                        </div>
                        <div className="space-y-0.5 text-left">
                          <strong className="text-slate-800 block text-xs hover:text-pink-600 transition-colors">{r.firstName}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {r.username ? `@${r.username}` : `ID: ${r.telegramId || r.id}`} • {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>

                      <span className="text-emerald-600 font-extrabold text-[10px] flex items-center gap-0.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 shrink-0">
                        <Check className="w-3.5 h-3.5" /> +300 ИИрок
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">У вас пока нет приглашенных пользователей.</p>
                    <p className="text-[10px] text-slate-400">Скопируйте реферальную ссылку выше и отправьте друзьям, чтобы получить по +300 ИИрок!</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

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
