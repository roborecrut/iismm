import React from 'react';
import ShinyLogo from './ShinyLogo';
import { 
  FileText, Users, ShieldCheck, User,
  Cpu, CalendarDays, Image as ImageIcon
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  tariff?: 'free' | 'pro' | 'vip';
  tokens?: number;
  iirky?: number;
  balanceRub?: number;
  userName?: string;
  telegramUsername?: string;
}

export default function Sidebar({ 
  currentPath, 
  onNavigate, 
  userName = '',
  telegramUsername = ''
}: SidebarProps) {
  const isAdmin = telegramUsername === '@shishkarnem' || userName.toLowerCase().includes('шишкар');

  // Active Core Navigation
  const navItems = [
    { label: 'Профиль', path: '/profile', icon: <User className="w-5 h-5 text-orange-500" /> },
    { label: 'Соцсеть', path: '/social', icon: <Users className="w-5 h-5 text-pink-500" /> },
    { label: 'Посты', path: '/posts', icon: <FileText className="w-5 h-5 text-indigo-500" /> },
    { label: 'Календарь', path: '/calendar', icon: <CalendarDays className="w-5 h-5 text-sky-500" /> },
  ];

  if (isAdmin) {
    navItems.push({ 
      label: 'Админ-Центр 👑', 
      path: '/admin', 
      icon: <ShieldCheck className="w-5 h-5 text-rose-500" /> 
    });
  }

  return (
    <div className="hidden md:flex flex-col w-64 shrink-0 bg-white/40 backdrop-blur-xl border-r border-white/60 h-screen sticky top-0 justify-between p-4 z-20 gap-2 overflow-y-auto no-scrollbar shadow-xs">
      
      <div className="space-y-4">
        {/* Geometric Balance brand header */}
        <div className="flex items-center justify-center px-1 pt-1 cursor-pointer" onClick={() => onNavigate('/profile')}>
          <ShinyLogo height={38} />
        </div>

        {/* Core Navigation */}
        <div className="pt-2">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const cleanP = currentPath.replace('169262990', '');
              const isPostsRelated = item.path === '/posts' && (cleanP.startsWith('/posts') || cleanP.startsWith('/scenarios') || cleanP.startsWith('/crosspost'));
              const isActive = isPostsRelated || cleanP.startsWith(item.path);
              return (
                <button
                  id={`btn-sidebar-nav-${item.path.substring(1)}`}
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer ${
                    isActive 
                      ? 'iirky-card-block text-orange-600 font-extrabold shadow-xs bg-white/80 border border-orange-200/80' 
                      : 'text-slate-700 hover:bg-white/60 hover:text-slate-900 transition-colors'
                  }`}
                >
                  <span className={isActive ? 'text-orange-500' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-bold">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

    </div>
  );
}

