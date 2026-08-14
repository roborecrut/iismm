import React, { useState } from 'react';
import { 
  Plus,
  Trash2, 
  RefreshCw, 
  Check, 
  X, 
  Radio, 
  CheckCircle2,
  Bot,
  Users, 
  Link as LinkIcon, 
  FileText,
  AlertCircle,
  Loader2,
  Save,
  Sparkles,
  Edit3,
  User,
  Trophy,
  Award,
  ShieldCheck,
  LayoutGrid,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Channel, UserAccount } from '../types';
import ProfileHeader from '../components/ProfileHeader';

interface ChannelsProps {
  channels: Channel[];
  currentUser?: UserAccount | any;
  onAddChannel: (channel: Omit<Channel, 'id'>) => Promise<void>;
  onUpdateChannel: (id: string, updated: Partial<Channel>) => Promise<void>;
  onDeleteChannel: (id: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  onLogout?: () => void;
  onAvatarFileUpload?: (e: React.ChangeEvent<React.HTMLInputElement>) => void;
}

export default function Channels({
  channels,
  currentUser,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onRefresh,
  onLogout,
  onAvatarFileUpload
}: ChannelsProps) {
  // Manual adding states
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isMobileTabModalOpen, setIsMobileTabModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [newSubscribers, setNewSubscribers] = useState<number>(0);
  const [newInviteLink, setNewInviteLink] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Bot check states
  const [checkUsername, setCheckUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkSuccess, setCheckSuccess] = useState<Channel | null>(null);
  const [botUsername, setBotUsername] = useState<string>('IIrkiBot');
  const [copiedBot, setCopiedBot] = useState(false);
  const handleCopyBot = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    navigator.clipboard?.writeText('@' + botUsername);
    setCopiedBot(true);
    setTimeout(() => setCopiedBot(false), 2000);
  };

  // Verification notice banner state
  const [verificationNotice, setVerificationNotice] = useState<{ id?: string; type: 'success' | 'error'; message: string } | null>(null);

  const handleTabClick = (tabId: string) => {
    if (tabId === 'channels') {
      window.history.pushState(null, '', '/channels');
      window.dispatchEvent(new Event('popstate'));
    } else {
      window.history.pushState(null, '', `/profile?tab=${tabId}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  React.useEffect(() => {
    fetch('/api/telegram/bot-info')
      .then(res => res.json())
      .then(data => {
        if (data && data.bot_username) {
          const clean = data.bot_username.replace('@', '');
          setBotUsername(clean);
        }
      })
      .catch(() => null);
  }, []);

  // Updating channel info state
  const [updatingChannelId, setUpdatingChannelId] = useState<string | null>(null);

  // Delete modal state
  const [deletingChannel, setDeletingChannel] = useState<{ id: string; name: string } | null>(null);

  // Inline editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingUsername, setEditingUsername] = useState('');
  const [editingIsActive, setEditingIsActive] = useState(true);
  const [editingSubscribers, setEditingSubscribers] = useState<number>(0);
  const [editingInvite, setEditingInvite] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

  // Handle bot checking on the channel via /api/channels/check
  const handleCheckBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckError(null);
    setCheckSuccess(null);

    const cleanInput = checkUsername.trim();
    if (!cleanInput) {
      setCheckError('Пожалуйста, введите юзернейм или ID канала');
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch('/api/channels/check', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '169262990'
        },
        body: JSON.stringify({ username: cleanInput, userId: currentUser?.id || '169262990' })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка проверки бота на канале');
      }

      setCheckSuccess(data.channel);
      setCheckUsername('');
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      setCheckError(err.message || 'Произошла непредвиденная ошибка при проверке канала');
    } finally {
      setIsChecking(false);
    }
  };

  // Refresh single channel data from Telegram API and verify bot presence
  const handleUpdateChannelData = async (ch: Channel) => {
    setUpdatingChannelId(ch.id);
    setVerificationNotice(null);
    try {
      const response = await fetch(`/api/channels/${ch.id}/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '16926299042'
        },
        body: JSON.stringify({ userId: currentUser?.id || '16926299042' })
      });
      const data = await response.json();
      
      if (data.isActive) {
        setVerificationNotice({
          id: ch.id,
          type: 'success',
          message: data.message || `✅ Бот найден на канале «${ch.name}» и имеет права администратора! Статус обновлен на "Активен".`
        });
        await onUpdateChannel(ch.id, { isActive: true });
      } else {
        setVerificationNotice({
          id: ch.id,
          type: 'error',
          message: data.error || `⚠️ Бот не найден на канале «${ch.name}» или не имеет прав администратора. Плашка переключена на "Неактивен".`
        });
        await onUpdateChannel(ch.id, { isActive: false });
      }

      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      setVerificationNotice({
        id: ch.id,
        type: 'error',
        message: err.message || `⚠️ Ошибка проверки канала «${ch.name}». Бот не найден на канале. Статус переключен на "Неактивен".`
      });
      await onUpdateChannel(ch.id, { isActive: false });
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setUpdatingChannelId(null);
    }
  };

  // Handle manual channel addition to DB
  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim()) {
      alert('Пожалуйста, заполните название и юзернейм канала');
      return;
    }
    
    let formattedUsername = newUsername.trim();
    if (!formattedUsername.startsWith('@') && !formattedUsername.startsWith('-100') && !/^\d+$/.test(formattedUsername)) {
      formattedUsername = '@' + formattedUsername;
    }

    await onAddChannel({
      userId: currentUser?.id || '169262990',
      name: newName.trim(),
      username: formattedUsername,
      isActive: newIsActive,
      subscribersCount: newSubscribers,
      inviteLink: newInviteLink.trim(),
      description: newDescription.trim()
    });

    setIsAddingNew(false);
    setNewName('');
    setNewUsername('');
    setNewIsActive(true);
    setNewSubscribers(0);
    setNewInviteLink('');
    setNewDescription('');

    if (onRefresh) {
      await onRefresh();
    }
  };

  const startEdit = (ch: Channel) => {
    setEditingId(ch.id);
    setEditingName(ch.name);
    setEditingUsername(ch.username);
    setEditingIsActive(ch.isActive);
    setEditingSubscribers(ch.subscribersCount || 0);
    setEditingInvite(ch.inviteLink || '');
    setEditingDescription(ch.description || '');
  };

  const saveEdit = async (id: string) => {
    if (!editingName.trim() || !editingUsername.trim()) {
      alert('Пожалуйста, заполните основные поля');
      return;
    }

    let formattedUsername = editingUsername.trim();
    if (!formattedUsername.startsWith('@') && !formattedUsername.startsWith('-100') && !/^\d+$/.test(formattedUsername)) {
      formattedUsername = '@' + formattedUsername;
    }

    await onUpdateChannel(id, {
      name: editingName.trim(),
      username: formattedUsername,
      isActive: editingIsActive,
      subscribersCount: editingSubscribers,
      inviteLink: editingInvite,
      description: editingDescription
    });
    
    setEditingId(null);
    if (onRefresh) {
      await onRefresh();
    }
  };

  const confirmExecuteDelete = async () => {
    if (!deletingChannel) return;
    const channelId = deletingChannel.id;
    setDeletingChannel(null);
    await onDeleteChannel(channelId);
    if (onRefresh) {
      await onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Profile Header Component */}
      {currentUser && (
        <ProfileHeader
          user={currentUser}
          onLogout={onLogout}
          onAvatarFileUpload={onAvatarFileUpload}
        />
      )}

      {/* Mobile Tab Navigation Selector (< sm) */}
      <div className="sm:hidden w-full relative">
        <button
          onClick={() => setIsMobileTabModalOpen(true)}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 to-sky-100/90 border border-pink-300 shadow-xs flex items-center justify-between text-left font-black text-xs text-slate-900 cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Раздел:</span>
            <span className="flex items-center gap-2 font-black text-slate-800 text-xs">
              <Radio className="w-4 h-4 text-pink-500" />
              <span>Каналы</span>
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
                    <LayoutGrid className="w-4 h-4 text-pink-500" />
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
                    ...(currentUser?.role === 'admin' || currentUser?.id === '169262990' || currentUser?.id === '16926299042' ? [{ id: 'admin', label: 'Админка 👑', icon: ShieldCheck, color: 'text-pink-500' }] : [])
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        handleTabClick(tab.id);
                        setIsMobileTabModalOpen(false);
                      }}
                      className={`w-full p-3 rounded-2xl text-xs font-black transition-all flex items-center justify-between cursor-pointer border ${
                        tab.id === 'channels'
                          ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white border-white/40 shadow-md'
                          : 'bg-white/80 hover:bg-white text-slate-700 border-pink-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <tab.icon className={`w-4 h-4 ${tab.id === 'channels' ? 'text-white' : tab.color}`} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.id === 'channels' && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Page Tabs Switcher (Profile, Channels, Tariffs, Partner, Teams, Admin) */}
      <div className="hidden sm:flex overflow-x-auto pb-1 gap-2.5 no-scrollbar border-b border-pink-200/60 pb-3">
        {[
          { id: 'profile', label: 'Профиль', icon: User, color: 'text-orange-500' },
          { id: 'channels', label: 'Каналы', icon: Radio, color: 'text-pink-500' },
          { id: 'tariffs', label: 'Тарифы', icon: Trophy, color: 'text-amber-500' },
          { id: 'referrals', label: 'Партнерка', icon: Award, color: 'text-sky-500' },
          { id: 'multiplayer', label: 'Команды', icon: Users, color: 'text-purple-500' },
          ...(currentUser?.role === 'admin' || currentUser?.id === '169262990' || currentUser?.id === '16926299042' ? [{ id: 'admin', label: 'Админка 👑', icon: ShieldCheck, color: 'text-pink-500' }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 cursor-pointer border ${
              tab.id === 'channels'
                ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md border-white/30 scale-[1.02]'
                : 'bg-white/90 hover:bg-white text-slate-700 border-pink-200/80 shadow-2xs'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${tab.id === 'channels' ? 'text-white' : tab.color}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Verification Notice Banner */}
      {verificationNotice && (
        <div className={`p-4 rounded-3xl border shadow-sm flex items-start gap-3 ${
          verificationNotice.type === 'success'
            ? 'bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 border-pink-300 text-slate-900'
            : 'bg-gradient-to-r from-orange-50 via-pink-50 to-sky-50 border-orange-300 text-slate-900'
        }`}>
          {verificationNotice.type === 'success' ? (
            <Sparkles className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs font-bold leading-relaxed">
            {verificationNotice.message}
          </div>
          <button 
            onClick={() => setVerificationNotice(null)}
            className="text-slate-400 hover:text-slate-700 p-1 font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* QUICK INTEGRATION COMPONENT (Bot Quick Link and Checker) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Card 1: Bot Setup Guide & Telegram Quick Add Link */}
        <div className="lg:col-span-5 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 p-2.5 rounded-2xl text-white shadow-xs">
                <Bot size={22} className="animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Шаг 1: Добавить бота в канал</h3>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-xs text-slate-600 font-bold">Официальный бот:</span>
                  <button
                    type="button"
                    onClick={handleCopyBot}
                    className="inline-flex items-center gap-1 bg-white/90 hover:bg-pink-50 text-pink-600 border border-pink-200 px-2 py-0.5 rounded-lg font-mono text-xs font-black transition-all cursor-pointer shadow-2xs"
                    title="Нажмите, чтобы скопировать"
                  >
                    <span>@{botUsername}</span>
                    {copiedBot ? <span className="text-[10px] text-emerald-600">✓</span> : <Copy className="w-3 h-3 text-pink-400" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Чтобы бот мог публиковать сгенерированные автопосты в ваш Telegram канал, добавьте его в качестве 
              <strong className="text-pink-600"> Администратора</strong> с разрешением на 
              <span className="text-slate-900 font-bold"> публикацию сообщений</span>.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 font-medium">
              <li className="flex items-start space-x-2">
                <span className="text-pink-600 font-bold font-mono">1.</span>
                <span>Нажмите кнопку быстрой привязки Telegram ниже.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-pink-600 font-bold font-mono">2.</span>
                <span>Выберите нужный канал в списке Telegram.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-pink-600 font-bold font-mono">3.</span>
                <span>Подтвердите назначение администратором.</span>
              </li>
            </ul>
          </div>

          <a
            href={`https://t.me/${botUsername}?startchannel`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black py-3 rounded-2xl text-xs transition-all duration-200 shadow-md active:scale-95 border border-white/20 hover:opacity-95"
          >
            <Bot size={16} />
            <span>Добавить бота в мой канал →</span>
          </a>
        </div>

        {/* Card 2: Automatic Bot Check Form */}
        <div className="lg:col-span-7 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2 border-b border-pink-200/60 pb-2.5">
              <CheckCircle2 className="text-pink-500" size={18} />
              <span>Шаг 2: Проверить права бота и привязать</span>
            </h3>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Введите юзернейм или ID вашего канала. Система вызовет Telegram Bot API для проверки прав бота{' '}
              <button
                type="button"
                onClick={handleCopyBot}
                className="inline-flex items-center gap-1 font-mono font-extrabold text-pink-600 hover:underline cursor-pointer bg-white/80 px-1.5 py-0.5 rounded border border-pink-200"
                title="Нажмите, чтобы скопировать"
              >
                <span>@{botUsername}</span>
                {copiedBot ? <span className="text-[10px] text-emerald-600">✓</span> : <Copy className="w-3 h-3 text-pink-400" />}
              </button>{' '}
              и добавит канал со всеми данными и аватаром в базу данных.
            </p>

            <form onSubmit={handleCheckBot} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Юзернейм или ID канала (например, @SAV_AI или @restreamsav)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-2.5 text-pink-500 text-xs font-mono font-bold">@</span>
                    <input
                      type="text"
                      required
                      value={checkUsername.startsWith('@') ? checkUsername.substring(1) : checkUsername}
                      onChange={(e) => setCheckUsername(e.target.value)}
                      placeholder="restreamsav"
                      className="w-full bg-white/90 border border-pink-200 rounded-2xl pl-8 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 placeholder-slate-400 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isChecking}
                    className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 disabled:opacity-50 text-white font-black px-4 py-2 rounded-2xl text-xs shadow-md transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer active:scale-95 border border-white/20"
                  >
                    {isChecking ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    <span>{isChecking ? 'Проверка...' : 'Проверить и добавить'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Error Message */}
            {checkError && (
              <div className="bg-pink-100/80 border border-pink-300 text-pink-900 rounded-2xl p-3.5 text-xs flex items-start space-x-2.5 leading-relaxed">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-pink-600" />
                <div className="space-y-1">
                  <p className="font-bold text-pink-900">Ошибка при привязке</p>
                  <p className="text-xs text-pink-800">{checkError}</p>
                </div>
              </div>
            )}

            {/* Success Import Widget */}
            {checkSuccess && (
              <div className="bg-white/90 border border-pink-300 rounded-2xl p-4 text-xs space-y-3 shadow-sm">
                <div className="flex items-center space-x-2.5 text-slate-900 font-bold">
                  <Sparkles size={16} className="text-pink-500" />
                  <span>Канал успешно импортирован в базу данных!</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 bg-pink-50/50 p-3 rounded-xl border border-pink-100 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-xs uppercase font-bold">Название</span>
                    <span className="text-slate-900 font-sans font-bold text-xs">{checkSuccess.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase font-bold">Telegram ID</span>
                    <span className="text-slate-700">{checkSuccess.telegramId || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase font-bold">Подписчики</span>
                    <span className="text-pink-600 font-bold">{checkSuccess.subscribersCount?.toLocaleString('ru-RU') || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase font-bold">Юзернейм</span>
                    <span className="text-slate-700">{checkSuccess.username}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Addition Form Collapse */}
      {isAddingNew && (
        <form onSubmit={handleCreateManual} className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-3xl p-6 space-y-4 shadow-sm max-w-2xl">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-pink-200/60 pb-2">
            Добавить канал вручную в базу данных
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 mb-1">Название канала</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="например: SAV AI Новости"
                className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 mb-1">Юзернейм канала (@channel)</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="например: @SAV_AI"
                className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 mb-1">Количество подписчиков</label>
              <input
                type="number"
                value={newSubscribers}
                onChange={(e) => setNewSubscribers(Number(e.target.value))}
                className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 mb-1">Пригласительная ссылка</label>
              <input
                type="url"
                value={newInviteLink}
                onChange={(e) => setNewInviteLink(e.target.value)}
                placeholder="https://t.me/invite/..."
                className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono font-bold text-slate-700 mb-1">Описание канала</label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Описание канала для рекламы или публикаций..."
                className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="md:col-span-2 flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="ch-new-active"
                checked={newIsActive}
                onChange={(e) => setNewIsActive(e.target.checked)}
                className="w-4 h-4 bg-slate-100 border border-slate-300 rounded focus:ring-pink-500 accent-pink-600"
              />
              <label htmlFor="ch-new-active" className="text-xs text-slate-800 font-bold cursor-pointer">
                Канал активен (разрешен для автопостинга)
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="bg-white/80 hover:bg-white border border-pink-200 text-slate-700 px-4 py-2 rounded-2xl text-xs font-bold cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white px-4 py-2 rounded-2xl text-xs font-black shadow-md flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all border border-white/20"
            >
              <Save size={14} />
              <span>Сохранить в базу данных</span>
            </button>
          </div>
        </form>
      )}

      {/* Channels List Grid */}
      <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 bg-white/60 border-b border-pink-200/60 flex items-center justify-between">
          <span className="text-xs font-mono font-black text-slate-800 uppercase tracking-wider">
            Всего записей в таблице channels: {channels.length}
          </span>
        </div>

        <div className="divide-y divide-pink-100/80">
          {channels.map((ch) => {
            const isEditing = editingId === ch.id;
            const isUpdating = updatingChannelId === ch.id;
            return (
              <div key={ch.id} className="p-6 hover:bg-white/50 transition-all">
                {isEditing ? (
                  // Edit Form Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-slate-700 font-bold mb-1">НАЗВАНИЕ КАНАЛА</label>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-slate-700 font-bold mb-1">ЮЗЕРНЕЙМ КАНАЛА</label>
                        <input
                          type="text"
                          value={editingUsername}
                          onChange={(e) => setEditingUsername(e.target.value)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-slate-700 font-bold mb-1">ПОДПИСЧИКИ</label>
                        <input
                          type="number"
                          value={editingSubscribers}
                          onChange={(e) => setEditingSubscribers(Number(e.target.value))}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-mono text-slate-700 font-bold mb-1">ПРИГЛАСИТЕЛЬНАЯ ССЫЛКА</label>
                        <input
                          type="url"
                          value={editingInvite}
                          onChange={(e) => setEditingInvite(e.target.value)}
                          placeholder="https://t.me/invite/..."
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-mono text-slate-700 font-bold mb-1">ОПИСАНИЕ КАНАЛА</label>
                        <textarea
                          rows={2}
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          placeholder="Информация о канале..."
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`ch-edit-active-${ch.id}`}
                          checked={editingIsActive}
                          onChange={(e) => setEditingIsActive(e.target.checked)}
                          className="w-4 h-4 bg-slate-100 border border-slate-300 rounded focus:ring-pink-500 accent-pink-600"
                        />
                        <label htmlFor={`ch-edit-active-${ch.id}`} className="text-xs text-slate-800 font-bold cursor-pointer">Бот активен на канале</label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center space-x-1 border border-pink-200 bg-white/80 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          <X size={12} />
                          <span>Отмена</span>
                        </button>
                        <button
                          onClick={() => saveEdit(ch.id)}
                          className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer shadow-xs border border-white/20"
                        >
                          <Check size={12} />
                          <span>Сохранить</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="space-y-3.5 flex-1">
                      {/* Title, Avatar Photo & Badge */}
                      <div className="flex items-center space-x-3">
                        {ch.photoUrl ? (
                          <img 
                            src={ch.photoUrl} 
                            alt={ch.name} 
                            className="w-11 h-11 rounded-full object-cover border-2 border-pink-400 shadow-sm shrink-0" 
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
                            {ch.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-black text-slate-900 text-base tracking-tight">{ch.name}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black border ${
                              ch.isActive 
                                ? 'bg-sky-100/90 text-sky-800 border-sky-300' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {ch.isActive ? 'Активен' : 'Отключен'}
                            </span>
                          </div>
                          <span className="text-xs text-pink-700 font-mono font-bold block">{ch.username}</span>
                        </div>
                      </div>

                      {/* Username, System Channel ID & Linked User ID */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="text-slate-800 bg-white/90 border border-pink-200 px-2.5 py-0.5 rounded-xl font-bold">
                          ID канала в БД: {ch.id}
                        </span>
                        <span className="text-sky-800 bg-white/90 border border-sky-200 px-2.5 py-0.5 rounded-xl font-bold">
                          ID пользователя в БД: {ch.userId || currentUser?.id || '169262990'}
                        </span>
                        {ch.telegramId && (
                          <span className="text-slate-700 bg-white/90 border border-pink-100 px-2 py-0.5 rounded-xl font-bold">
                            Tg ID: {ch.telegramId}
                          </span>
                        )}
                      </div>

                      {/* Stats and metadata display block */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl bg-white/80 border border-pink-200/80 p-4 rounded-2xl shadow-2xs">
                        {/* Subscribers Count */}
                        <div className="flex items-center space-x-2.5">
                          <div className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 p-1.5 rounded-xl text-white shadow-2xs">
                            <Users size={14} />
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 uppercase block font-mono font-bold">ПОДПИСЧИКИ</span>
                            <span className="text-xs font-extrabold text-slate-900">
                              {ch.subscribersCount ? ch.subscribersCount.toLocaleString('ru-RU') : '0'} подписчиков
                            </span>
                          </div>
                        </div>

                        {/* Invite Link */}
                        <div className="flex items-center space-x-2.5">
                          <div className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 p-1.5 rounded-xl text-white shadow-2xs">
                            <LinkIcon size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs text-slate-500 uppercase block font-mono font-bold">ССЫЛКА</span>
                            {ch.inviteLink ? (
                              <a 
                                href={ch.inviteLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-pink-600 hover:underline font-bold font-mono truncate block"
                              >
                                {ch.inviteLink}
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Не настроена</span>
                            )}
                          </div>
                        </div>

                        {/* Description field */}
                        <div className="sm:col-span-2 border-t border-pink-100/80 pt-3 flex items-start space-x-2.5">
                          <div className="bg-pink-100/80 p-1.5 rounded-xl text-pink-600 shrink-0 mt-0.5 border border-pink-200">
                            <FileText size={14} />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-xs text-slate-500 uppercase block font-mono font-bold">ОПИСАНИЕ КАНАЛА</span>
                            <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">
                              {ch.description || 'Описание канала не заполнено.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions block: UPDATE (refresh info) & DELETE */}
                    <div className="flex items-center space-x-2 lg:self-center justify-end border-t lg:border-t-0 border-pink-100 pt-4 lg:pt-0">
                      <button
                        onClick={() => startEdit(ch)}
                        className="p-2 border border-pink-200 bg-white/80 hover:bg-white text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Ручное редактирование параметров"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        onClick={() => handleUpdateChannelData(ch)}
                        disabled={isUpdating}
                        className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm border border-white/20 active:scale-95 disabled:opacity-50"
                        title="Обновить информацию по каналу через Telegram Bot API"
                      >
                        <RefreshCw size={13} className={isUpdating ? 'animate-spin' : ''} />
                        <span>{isUpdating ? 'Обновление...' : 'Обновить'}</span>
                      </button>
                      
                      <button
                        onClick={() => setDeletingChannel({ id: ch.id, name: ch.name })}
                        className="flex items-center space-x-1.5 bg-white/90 hover:bg-white text-pink-700 border border-pink-300 px-3.5 py-2 rounded-2xl text-xs font-extrabold cursor-pointer transition-all shadow-2xs active:scale-95"
                        title="Удалить канал из базы данных"
                      >
                        <Trash2 size={13} className="text-orange-500" />
                        <span>Удалить</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {channels.length === 0 && (
            <div className="p-12 text-center text-slate-700 text-xs font-bold">
              В базе данных пока нет подключенных Telegram каналов. Выполните автопроверку бота выше или добавьте канал вручную!
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODAL FOR DELETING A CHANNEL */}
      {deletingChannel && (
        <div className="fixed inset-0 bg-sky-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center space-x-3 text-pink-600">
              <div className="p-3 bg-white/90 rounded-2xl border border-pink-200">
                <Trash2 size={24} className="text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Подтверждение удаления канала</h3>
                <p className="text-xs text-slate-600">Канал: <span className="font-bold text-slate-800">{deletingChannel.name}</span></p>
              </div>
            </div>

            <p className="text-xs text-slate-800 leading-relaxed font-semibold bg-white/80 p-3.5 rounded-2xl border border-pink-200">
              Вы действительно хотите безвозвратно удалить канал <strong className="text-pink-700">"{deletingChannel.name}"</strong> из базы данных Telegram-каналов?
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-pink-200">
              <button
                type="button"
                onClick={() => setDeletingChannel(null)}
                className="bg-white/80 hover:bg-white text-slate-800 text-xs font-bold px-4 py-2 rounded-2xl border border-pink-200 transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmExecuteDelete}
                className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-black px-5 py-2 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer active:scale-95 border border-white/20"
              >
                <Trash2 size={13} />
                <span>Да, удалить канал</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
