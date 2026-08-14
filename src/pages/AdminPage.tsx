import React from 'react';
import SuperadminPanel from '../components/SuperadminPanel';
import SqliteTableManager from '../components/SqliteTableManager';
import GalleryView from '../components/GalleryView';
import FileUpload from '../components/FileUpload';
import { UserAccount } from '../types';
import { Users, FolderGit2, Upload, Clock } from 'lucide-react';

interface AdminPageProps {
  currentUser: UserAccount;
  onUpdateCurrentUser: (updated: UserAccount) => void;
  allChannelsCount: number;
  currentPath?: string;
  defaultTab?: 'users' | 'sqlite' | 'scenarios' | 'gallery';
}

export default function AdminPage({
  currentUser,
  onUpdateCurrentUser,
  allChannelsCount,
  currentPath: propPath
}: AdminPageProps) {
  const currentPath = propPath || (typeof window !== 'undefined' ? window.location.pathname : '/admin');

  // Helper for route push
  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  // Determine active main section
  let activeSection: 'users' | 'cron' | 'gallery' = 'users';

  if (currentPath.startsWith('/admin/cron') || currentPath.startsWith('/admin/sqlite/cron')) {
    activeSection = 'cron';
  } else if (currentPath.startsWith('/admin/gallery')) {
    activeSection = 'gallery';
  } else {
    activeSection = 'users';
  }

  return (
    <div className="space-y-6 text-left">
      {/* Top Admin Subpages Header Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md rounded-2xl border border-pink-200/80 shadow-xs">
        {/* 1. Пользователи & Статистика - /admin */}
        <button
          onClick={() => navigateTo('/admin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeSection === 'users'
              ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md scale-[1.02]'
              : 'text-slate-700 hover:bg-white/80 hover:text-slate-900 bg-white/60 border border-pink-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Пользователи & Статистика</span>
        </button>

        {/* 2. Триггеры & Крон - /admin/cron */}
        <button
          onClick={() => navigateTo('/admin/cron')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeSection === 'cron'
              ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md scale-[1.02]'
              : 'text-slate-700 hover:bg-white/80 hover:text-slate-900 bg-white/60 border border-pink-200/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Триггеры & Крон</span>
        </button>

        {/* 3. Галерея Всех Пользователей - /admin/gallery */}
        <button
          onClick={() => navigateTo('/admin/gallery')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeSection === 'gallery'
              ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md scale-[1.02]'
              : 'text-slate-700 hover:bg-white/80 hover:text-slate-900 bg-white/60 border border-pink-200/60'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Галерея & Файлы Пользователей</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="transition-all">
        {activeSection === 'users' && (
          <SuperadminPanel
            currentUser={currentUser}
            onUpdateCurrentUser={onUpdateCurrentUser}
            allChannelsCount={allChannelsCount}
          />
        )}

        {activeSection === 'cron' && (
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md p-6 rounded-3xl border border-pink-200/80 shadow-md">
            <SqliteTableManager initialTable="cron" />
          </div>
        )}

        {activeSection === 'gallery' && (
          <GalleryView currentUser={{ role: currentUser.role || 'admin', createdAt: currentUser.createdAt || new Date().toISOString(), ...currentUser }} channels={[]} isAdminView={true} />
        )}
      </div>
    </div>
  );
}
