import React from 'react';
import { Settings, LogOut, Smartphone, Mail, ShieldCheck, Sparkles, Users, MessageSquare } from 'lucide-react';
import { UserAccount } from '../types';
import ProfileAvatarBlock from './ProfileAvatarBlock';

interface ProfileHeaderProps {
  user: UserAccount;
  uploadingAvatar?: boolean;
  onAvatarFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditProfile?: () => void;
  onLogout?: () => void;
  onBindEmail?: () => void;
  onNavigateToSocial?: () => void;
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
  className = '',
  isSocialPage = false,
  isOwnProfile = true
}: ProfileHeaderProps) {
  const dbId = user.id || '16926299042';
  const tgId = user.telegramId && user.telegramId > 0 ? user.telegramId : (dbId === '16926299042' || dbId === '169262990' ? '169262990' : 'Не привязан');

  const tgUsernameRaw = user.telegramUsername || `@${user.username || 'shishkarnem'}`;
  const cleanTgUsername = tgUsernameRaw.replace(/^@/, '').trim();
  const tgLink = cleanTgUsername ? `https://t.me/${cleanTgUsername}` : (tgId && tgId !== 'Не привязан' ? `https://t.me/user?id=${tgId}` : 'https://t.me/shishkarnem');

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
    <div className={`bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-pink-200/80 shadow-md flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 ${className}`}>
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
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
              {user.name || user.firstName || 'Тимошенко Денис'}
            </h1>
            {user.role === 'admin' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-xs">
                <ShieldCheck className="w-3 h-3 mr-0.5 text-white" />
                Админ
              </span>
            )}
          </div>
          
          <div className="text-xs text-slate-700 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 pt-0.5">
            <a 
              href={tgLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-pink-600 font-extrabold hover:underline hover:text-pink-700 transition-colors cursor-pointer flex items-center gap-1"
              title="Открыть Telegram профиль"
            >
              {user.telegramUsername || `@${user.username || 'shishkarnem'}`}
            </a>
            <span className="text-slate-300">•</span>
            <span className="bg-white/90 border border-pink-200 px-2 py-0.5 rounded-lg font-mono text-[11px]">
              ID: <code className="text-slate-900 font-extrabold">{dbId}</code>
            </span>
            <span className="text-slate-300">•</span>
            <a 
              href={tgLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/90 hover:bg-pink-50 border border-sky-200 hover:border-sky-400 px-2 py-0.5 rounded-lg font-mono text-[11px] transition-all cursor-pointer"
              title="Открыть в Telegram"
            >
              telegram_id: <code className="text-slate-900 font-extrabold">{tgId}</code>
            </a>
          </div>

          <p className="text-[11px] text-slate-600 font-medium pt-0.5">
            Дата регистрации: <strong className="text-slate-800">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('ru-RU')}</strong>
          </p>

          {/* Buttons under Registration Date */}
          {isSocialPage ? (
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              {isOwnProfile && (
                <button 
                  onClick={handleNavigateFeed}
                  className="px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md border border-white/20 cursor-pointer hover:opacity-95 active:scale-95 transition-all"
                  title="Перейти к ленте новостей"
                >
                  <Users className="w-4 h-4 text-white" />
                  <span>Лента Новостей</span>
                </button>
              )}

              <button 
                onClick={handleNavigateChat}
                className="px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md border border-white/20 cursor-pointer hover:opacity-95 active:scale-95 transition-all"
                title="Перейти в чат"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>Чат</span>
              </button>
            </div>
          ) : (
            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button 
                onClick={handleNavigateTariff}
                className="px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md border border-white/20 cursor-pointer hover:opacity-95 active:scale-95 transition-all"
                title="Перейти к тарифам и пополнению баланса"
              >
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                <span>Баланс: <strong className="font-mono text-sm tracking-wide">{(user.iirky ?? user.balance ?? user.tokens ?? 1000).toLocaleString('ru-RU')}</strong> ИИрок</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Control Buttons (Only on non-social pages) */}
      {!isSocialPage && (
        <div className="flex flex-col items-stretch gap-2 shrink-0 w-full sm:w-48">
          {onEditProfile && (
            <button 
              onClick={onEditProfile}
              className="w-full px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-md border border-white/20 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-white" />
              <span>Редактировать</span>
            </button>
          )}

          {onLogout && (
            <button 
              id="btn-profile-logout"
              onClick={onLogout}
              className="w-full px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-extrabold text-xs rounded-xl shadow-md border border-white/20 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer hover:opacity-95"
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
              className="w-full px-4 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-extrabold text-[11px] rounded-xl shadow-xs border border-white/20 transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Привязать Telegram</span>
            </a>
          )}

          {(!user.email || user.email.trim() === '') && onBindEmail && (
            <button 
              onClick={onBindEmail}
              className="w-full px-4 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-extrabold text-[11px] rounded-xl shadow-xs border border-white/20 transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
            >
              <Mail className="w-3.5 h-3.5 text-white" />
              <span>Привязать E-mail</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
