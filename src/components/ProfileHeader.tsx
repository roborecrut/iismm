import React, { useState, useEffect } from 'react';
import { Settings, LogOut, Smartphone, Mail, ShieldCheck, Sparkles, Users, MessageSquare, Bell, Wallet } from 'lucide-react';
import { UserAccount } from '../types';
import ProfileAvatarBlock from './ProfileAvatarBlock';
import NotificationsModal from './NotificationsModal';

interface ProfileHeaderProps {
  user: UserAccount;
  uploadingAvatar?: boolean;
  onAvatarFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditProfile?: () => void;
  onLogout?: () => void;
  onBindEmail?: () => void;
  onNavigateToSocial?: () => void;
  onNavigate?: (path: string) => void;
  className?: string;
  isSocialPage?: boolean;
  isOwnProfile?: boolean;
}

export default function ProfileHeader({
  user,
  uploadingAvatar = false,
  onAvatarFileUpload,
  onEditProfile,
  onLogout,
  onBindEmail,
  onNavigateToSocial,
  onNavigate,
  className = '',
  isSocialPage = false,
  isOwnProfile = true
}: ProfileHeaderProps) {
  const dbId = user.id || '16926299042';
  const tgId = user.telegramId && user.telegramId > 0 ? user.telegramId : (dbId === '16926299042' || dbId === '169262990' ? '169262990' : 'Не привязан');

  const tgUsernameRaw = user.telegramUsername || `@${user.username || 'shishkarnem'}`;
  const cleanTgUsername = tgUsernameRaw.replace(/^@/, '').trim();
  const tgLink = cleanTgUsername ? `https://t.me/${cleanTgUsername}` : (tgId && tgId !== 'Не привязан' ? `https://t.me/user?id=${tgId}` : 'https://t.me/shishkarnem');

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveUser, setLiveUser] = useState<Partial<UserAccount>>(user);

  // Sync with prop changes
  useEffect(() => {
    setLiveUser(prev => ({ ...prev, ...user }));
  }, [user]);

  // Real-time direct SQLite profile & balance fetch
  const fetchLiveProfile = () => {
    fetch(`/api/user-profile?userId=${encodeURIComponent(dbId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setLiveUser(prev => ({ ...prev, ...data.user }));
        }
      })
      .catch(() => null);
  };

  useEffect(() => {
    fetchLiveProfile();

    fetch(`/api/notifications?userId=${encodeURIComponent(dbId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => null);

    const onFocus = () => {
      fetchLiveProfile();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [dbId]);

  // Calculate distinct balances per requirements: "ИИрки" = balance, "ИИрки Free" = balance_free
  const totalBalance = liveUser.balance !== undefined 
    ? Number(liveUser.balance) 
    : (Number(liveUser.balance_pay ?? user.balance_pay ?? 0) + Number(liveUser.balance_free ?? 300));

  const freeBalance = liveUser.balance_free !== undefined
    ? Number(liveUser.balance_free)
    : (Number(liveUser.balance_start ?? user.balance_start ?? 300) + 
       Number(liveUser.balance_ref ?? user.balance_ref ?? 0) + 
       Number(liveUser.balance_tarif ?? user.balance_tarif ?? 0) + 
       Number(liveUser.balance_admin ?? user.balance_admin ?? 0));

  const handleNavigateSocial = () => {
    if (onNavigateToSocial) {
      onNavigateToSocial();
    } else {
      const targetPath = `/social/${dbId}`;
      window.history.pushState(null, '', targetPath);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleNavigateTariff = () => {
    window.history.pushState(null, '', '/tarif');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleNavigateFeed = () => {
    window.history.pushState(null, '', '/social/feed');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleNavigateChat = () => {
    window.history.pushState(null, '', '/social/messages');
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <>
      <div className={`bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-pink-300 shadow-md flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 ${className}`}>
        {/* Left Column: Avatar & User Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full sm:w-auto">
          <ProfileAvatarBlock
            user={user}
            uploadingAvatar={uploadingAvatar}
            onAvatarFileUpload={onAvatarFileUpload}
            onNavigateToSocial={handleNavigateSocial}
            size="md"
          />

          <div className="space-y-2.5 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
                {user.name || user.firstName || 'Тимошенко Денис'}
              </h1>
              {user.role === 'admin' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-sm font-bold bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-white" />
                  Админ
                </span>
              )}

              {/* Notification Bell in Header */}
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="p-2 rounded-2xl bg-white/80 hover:bg-white text-slate-700 hover:text-pink-600 border border-pink-200 transition-all relative cursor-pointer shadow-xs ml-1"
                title="Уведомления и события"
              >
                <Bell className="w-4 h-4 text-pink-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold text-xs px-1.5 py-0.5 rounded-full shadow-xs ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            
            <div className="text-sm text-slate-700 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 pt-0.5">
              <a 
                href={tgLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-pink-600 font-bold hover:underline hover:text-pink-700 transition-colors cursor-pointer flex items-center gap-1"
                title="Открыть Telegram профиль"
              >
                {user.telegramUsername || `@${user.username || 'shishkarnem'}`}
              </a>
              <span className="text-slate-400">•</span>
              <span className="bg-white/90 border border-pink-200 px-2.5 py-0.5 rounded-lg font-mono text-sm">
                ID: <code className="text-slate-900 font-bold">{dbId}</code>
              </span>
              <span className="text-slate-400">•</span>
              <a 
                href={tgLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/90 hover:bg-pink-50 border border-sky-200 hover:border-sky-400 px-2.5 py-0.5 rounded-lg font-mono text-sm transition-all cursor-pointer"
                title="Открыть в Telegram"
              >
                telegram_id: <code className="text-slate-900 font-bold">{tgId}</code>
              </a>
            </div>

            <p className="text-sm text-slate-600 font-medium pt-0.5">
              Дата регистрации: <strong className="text-slate-800">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('ru-RU')}</strong>
            </p>

            {/* Balances Display */}
            {!isSocialPage && (
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <button 
                  onClick={handleNavigateTariff}
                  className="px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md border border-white/30 cursor-pointer hover:opacity-95 active:scale-95 transition-all"
                  title="Перейти к тарифам и пополнению"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>ИИрки: <strong className="font-mono text-sm font-bold">{totalBalance.toLocaleString('ru-RU')}</strong></span>
                </button>

                <button 
                  onClick={handleNavigateTariff}
                  className="px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 bg-white/90 hover:bg-white text-slate-800 border border-pink-300 shadow-xs cursor-pointer active:scale-95 transition-all"
                  title="Бесплатные бонусные и стартовые ИИрки"
                >
                  <Wallet className="w-4 h-4 text-pink-500" />
                  <span>ИИрки Free: <strong className="font-mono text-sm font-bold text-pink-600">{freeBalance.toLocaleString('ru-RU')}</strong></span>
                </button>
              </div>
            )}

            {/* Social Page Navigation Buttons */}
            {isSocialPage && (
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                {isOwnProfile && (
                  <button 
                    onClick={handleNavigateFeed}
                    className="px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md border border-white/20 cursor-pointer hover:opacity-95 active:scale-95 transition-all"
                    title="Перейти к ленте новостей"
                  >
                    <Users className="w-4 h-4 text-white" />
                    <span>Лента новостей</span>
                  </button>
                )}

                <button 
                  onClick={handleNavigateChat}
                  className="px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md border border-white/20 cursor-pointer hover:opacity-95 active:scale-95 transition-all"
                  title="Перейти в чат"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>Чат</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Control Buttons */}
        {!isSocialPage && (
          <div className="flex flex-col items-stretch gap-2 shrink-0 w-full sm:w-48">
            {onEditProfile && (
              <button 
                onClick={onEditProfile}
                className="w-full px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-md border border-white/20 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-white" />
                <span>Редактировать</span>
              </button>
            )}

            {onLogout && (
              <button 
                id="btn-profile-logout"
                onClick={onLogout}
                className="w-full px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-bold text-sm rounded-xl shadow-md border border-white/20 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer hover:opacity-95"
                title="Выйти из аккаунта и очистить кэш"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span>Выйти</span>
              </button>
            )}

            {!(user.telegramId && user.telegramId > 0) && (
              <a 
                id="btn-trigger-onboarding-tg"
                href="https://t.me/IIrkiBot/app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-bold text-sm rounded-xl shadow-xs border border-white/20 transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Привязать Telegram</span>
              </a>
            )}

            {(!user.email || user.email.trim() === '') && onBindEmail && (
              <button 
                onClick={onBindEmail}
                className="w-full px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-bold text-sm rounded-xl shadow-xs border border-white/20 transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
              >
                <Mail className="w-4 h-4 text-white" />
                <span>Привязать E-mail</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notifications Center Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        userId={dbId}
        onUnreadCountChange={setUnreadCount}
        onNavigate={onNavigate}
      />
    </>
  );
}
