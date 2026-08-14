import React from 'react';
import { Camera, RefreshCw, Users } from 'lucide-react';
import { UserAccount } from '../types';

interface ProfileAvatarBlockProps {
  user: UserAccount;
  uploadingAvatar?: boolean;
  onAvatarFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNavigateToSocial?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProfileAvatarBlock({
  user,
  uploadingAvatar = false,
  onAvatarFileUpload,
  onNavigateToSocial,
  className = '',
  size = 'md'
}: ProfileAvatarBlockProps) {
  const isUserAdmin = user.role === 'admin' || user.id === '169262990' || user.telegramId === 169262990 || String(user.id) === '16926299042';
  const rawTariff = user.tariff ? String(user.tariff).toLowerCase() : (isUserAdmin ? 'kosmos' : 'start');
  
  let tariffName = 'Старт';
  let tariffIcon = '🌱';
  if (rawTariff.includes('kosmos') || rawTariff.includes('космос') || isUserAdmin) {
    tariffName = 'Космос';
    tariffIcon = '👑';
  } else if (rawTariff.includes('otryv') || rawTariff.includes('отрыв') || rawTariff.includes('vip')) {
    tariffName = 'Отрыв';
    tariffIcon = '🔥';
  } else if (rawTariff.includes('razgon') || rawTariff.includes('разгон') || rawTariff.includes('pro')) {
    tariffName = 'Разгон';
    tariffIcon = '⚡';
  }

  const handleSocialClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigateToSocial) {
      onNavigateToSocial();
    } else {
      const targetPath = `/social/${user.id || user.telegramId || '16926299042'}`;
      window.history.pushState(null, '', targetPath);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const imageSrc = user.userAvatar || (user as any).user_avatar || (user.avatarUrl && !user.avatarUrl.includes('unsplash.com') ? user.avatarUrl : ((user.telegramId || (user.id && !isNaN(Number(user.id)))) ? `/api/avatar/${user.telegramId || user.id}.png` : (user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80")));

  const sizeClasses = {
    sm: 'w-28 h-28',
    md: 'w-40 h-40 sm:w-48 sm:h-48',
    lg: 'w-52 h-52 sm:w-60 sm:h-60'
  }[size];

  return (
    <div className={`relative shrink-0 ${className}`}>
      <img 
        referrerPolicy="no-referrer"
        src={imageSrc} 
        alt={user.name || user.firstName || 'Аватар'} 
        onClick={handleSocialClick}
        className={`${sizeClasses} rounded-3xl object-cover border-4 border-orange-400 shadow-md cursor-pointer hover:opacity-95 transition-opacity`}
      />

      {/* Top-Left Edit Avatar Button */}
      {onAvatarFileUpload && (
        <label className="absolute top-2 left-2 z-30 p-2 bg-transparent text-white cursor-pointer flex items-center justify-center active:scale-95 border-none shadow-none hover:opacity-95" title="Изменить фото профиля">
          {uploadingAvatar ? (
            <RefreshCw className="w-4 h-4 text-white animate-spin drop-shadow-md" />
          ) : (
            <Camera className="w-4 h-4 text-white drop-shadow-md hover:scale-110 transition-transform" />
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            disabled={uploadingAvatar}
            onChange={onAvatarFileUpload} 
          />
        </label>
      )}

      {/* Bottom-Left Tariff Badge */}
      <button 
        onClick={() => {
          window.history.pushState(null, '', '/tarif');
          window.dispatchEvent(new Event('popstate'));
        }}
        className="absolute bottom-2 left-2 z-30 px-2 py-0.5 text-[11px] font-black text-white bg-transparent border-none flex items-center gap-1 drop-shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
        title={`Ваш текущий тариф: ${tariffName}. Нажмите для перехода к тарифам.`}
      >
        <span className="text-xs">{tariffIcon}</span>
        <span>{tariffName}</span>
      </button>

      {/* Pinned Premium Heart Icon */}
      <div className="absolute -top-3 -right-3 z-30 bg-transparent p-0 border-none shadow-none backdrop-blur-none cursor-pointer" title="Премиум сердечко — ИИSMM">
        <svg viewBox="0 0 24 24" className="w-9 h-9 sm:w-10 sm:h-10 animate-pulse" fill="url(#profile-avatar-heart-grad)">
          <defs>
            <linearGradient id="profile-avatar-heart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="25%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="75%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
    </div>
  );
}
