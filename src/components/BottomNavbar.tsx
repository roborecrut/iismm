import React from 'react';
import { 
  User, FileText, FolderHeart, Users, MessageSquare, Cpu, CalendarDays, Image as ImageIcon
} from 'lucide-react';

interface BottomNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  tariff?: 'free' | 'pro' | 'vip';
}

export default function BottomNavbar({ currentPath, onNavigate }: BottomNavbarProps) {
  const cleanPath = currentPath.replace('169262990', '');
  const isSocialPath = cleanPath === '/social' || cleanPath.startsWith('/social/');

  const navItems = isSocialPath 
    ? [
        { label: 'Лента', path: '/social/feed', icon: <Users className="w-5 h-5 text-sky-500" /> },
        { label: 'Чат', path: '/social/messages', icon: <MessageSquare className="w-5 h-5 text-pink-500" /> },
        { label: 'Папки', path: '/social/saved', icon: <FolderHeart className="w-5 h-5 text-sky-500" /> },
        { label: 'Профиль', path: '/profile', icon: <User className="w-5 h-5 text-orange-500" /> }
      ]
    : [
        { label: 'Посты', path: '/posts', icon: <FileText className="w-5 h-5 text-indigo-500" /> },
        { label: 'СценарИИ', path: '/scenarios', icon: <Cpu className="w-5 h-5 text-cyan-500" /> },
        { label: 'Календарь', path: '/calendar', icon: <CalendarDays className="w-5 h-5 text-sky-500" /> },
        { label: 'Галерея', path: '/gallery', icon: <ImageIcon className="w-5 h-5 text-pink-500" /> },
        { label: 'Соцсеть', path: '/social', icon: <Users className="w-5 h-5 text-pink-500" /> },
        { label: 'Профиль', path: '/profile', icon: <User className="w-5 h-5 text-orange-500" /> }
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/50 backdrop-blur-md border-t border-white/60 shadow-xl pb-safe-bottom">
      <nav id="bottom-navbar" className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = isSocialPath
            ? (item.path === '/social/feed' && (cleanPath === '/social' || cleanPath === '/social/feed')) || cleanPath === item.path
            : cleanPath === item.path || cleanPath.startsWith(item.path + '/');
          return (
            <button
              id={`btn-bottom-nav-${item.path.substring(1).replace(/\//g, '-')}`}
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] text-center transition-all cursor-pointer ${
                isActive 
                  ? 'text-pink-600 font-extrabold' 
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-white/80 shadow-xs' : 'text-slate-500'}`}>
                {item.icon}
              </div>
              <span className="text-[11px] mt-0.5 font-bold font-sans tracking-tight truncate w-full text-center leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

