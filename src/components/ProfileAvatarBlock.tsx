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
  const rawTariff = user.tariff ? String(user.tariff).toLowerCase() : 'start';
  
  let tariffName = 'Старт';
  let tariffIcon = '🌱';
  if (rawTariff.includes('kosmos') || rawTariff.includes('космос') || rawTariff.includes('индивидуальн')) {
    tariffName = 'Космос';
    tariffIcon = '👑';
  } else if (rawTariff.includes('otryv') || rawTariff.includes('отрыв') || rawTariff.includes('vip') || rawTariff.includes('взлет')) {
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
        <img 
          src="/file/15/heart.png" 
          alt="Премиум сердечко" 
          className="w-9 h-9 sm:w-10 sm:h-10 animate-pulse drop-shadow-md object-contain"
        />
      </div>
    </div>
  );
}
