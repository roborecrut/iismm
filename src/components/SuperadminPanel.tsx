import React, { useState, useEffect } from 'react';
import { 
  Users, RefreshCw, CheckCircle2, AlertOctagon, Shield, Database, Sparkles, UserCheck, UserX, Loader2
} from 'lucide-react';
import SqliteTableManager from './SqliteTableManager';
import { UserAccount } from '../types';

interface SuperadminPanelProps {
  currentUser: UserAccount;
  onUpdateCurrentUser: (updated: UserAccount) => void;
  allChannelsCount: number;
}

export default function SuperadminPanel({ 
  currentUser, 
  onUpdateCurrentUser,
  allChannelsCount
}: SuperadminPanelProps) {
  const [parsing, setParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({ total: 262, active: 199, blocked: 63, deleted: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchUserStats = async () => {
    try {
      const res = await fetch('/api/db/table/users');
      if (res.ok) {
        const data = await res.json();
        const rows = data.rows || [];
        const total = rows.length;
        const active = rows.filter((r: any) => r.status === 'Активный').length;
        const blocked = rows.filter((r: any) => r.status === 'Блок').length;
        const deleted = rows.filter((r: any) => r.status === 'Удален').length;
        setUserStats({ total, active, blocked, deleted });
      }
    } catch (e) {
      console.error('Failed to fetch user stats:', e);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [refreshKey]);

  const handleRunTgParser = async () => {
    setParsing(true);
    setParseMessage(null);
    try {
      const res = await fetch('/api/admin/parse-tg-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setParseMessage(data.message);
        setUserStats({
          total: data.total,
          active: data.active,
          blocked: data.blocked,
          deleted: data.deleted
        });
        setRefreshKey(prev => prev + 1);
      } else {
        setParseMessage(data.error || 'Ошибка при вызове парсера');
      }
    } catch (e: any) {
      setParseMessage('Ошибка сети при выполнении парсинга');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner: Stats & TG Re-parser Button */}
      <div className="bg-gradient-to-r from-sky-100/80 via-pink-100/80 via-orange-100/80 via-pink-100/80 to-sky-100/80 backdrop-blur-md p-6 rounded-3xl border border-pink-200/80 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 flex items-center justify-center text-white shadow-md shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                База данных пользователей (SQLite)
              </h2>
              <p className="text-sm font-medium text-slate-600">
                Полный реестр Telegram-пользователей с верификацией статусов
              </p>
            </div>
          </div>

          <button
            onClick={handleRunTgParser}
            disabled={parsing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {parsing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{parsing ? 'Проверка пакетами Telegram...' : 'Обновить пользователей Telegram'}</span>
          </button>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-pink-200/70 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-sm font-semibold text-sky-700">Всего в базе</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{userStats.total}</div>
            </div>
            <Users className="w-6 h-6 text-sky-500" />
          </div>

          <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-pink-200/70 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-sm font-semibold text-pink-700">Активные</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{userStats.active}</div>
            </div>
            <UserCheck className="w-6 h-6 text-pink-500" />
          </div>

          <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-pink-200/70 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-sm font-semibold text-orange-700">Заблокировали</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{userStats.blocked}</div>
            </div>
            <UserX className="w-6 h-6 text-orange-500" />
          </div>

          <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-pink-200/70 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-sm font-semibold text-pink-700">Администраторы</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">1</div>
            </div>
            <Shield className="w-6 h-6 text-pink-500" />
          </div>
        </div>

        {parseMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-white/80 text-slate-800 border border-pink-300 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
            <span>{parseMessage}</span>
          </div>
        )}
      </div>

      {/* Main Table Inspector for users */}
      <div className="bg-gradient-to-r from-sky-100/80 via-pink-100/80 via-orange-100/80 via-pink-100/80 to-sky-100/80 backdrop-blur-md p-6 rounded-3xl border border-pink-200/80 shadow-md">
        <SqliteTableManager key={refreshKey} initialTable="users" />
      </div>
    </div>
  );
}
