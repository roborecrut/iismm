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
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 flex items-center justify-center text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                База Данных Пользователей (SQLite)
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Полный реестр Telegram-пользователей с верификацией статусов
              </p>
            </div>
          </div>

          <button
            onClick={handleRunTgParser}
            disabled={parsing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {parsing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{parsing ? 'Проверка пакетами Telegram...' : '🔄 Переспарсить юзеров TG'}</span>
          </button>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Всего в базе</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{userStats.total}</div>
            </div>
            <Users className="w-6 h-6 text-sky-400" />
          </div>

          <div className="p-4 rounded-2xl bg-cyan-50/80 border border-cyan-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">Активные</div>
              <div className="text-2xl font-black text-cyan-900 mt-1">{userStats.active}</div>
            </div>
            <UserCheck className="w-6 h-6 text-cyan-500" />
          </div>

          <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">Заблокировали</div>
              <div className="text-2xl font-black text-orange-800 mt-1">{userStats.blocked}</div>
            </div>
            <UserX className="w-6 h-6 text-orange-500" />
          </div>

          <div className="p-4 rounded-2xl bg-pink-50/80 border border-pink-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-pink-600 uppercase tracking-wider">Администраторы</div>
              <div className="text-2xl font-black text-pink-800 mt-1">1</div>
            </div>
            <Shield className="w-6 h-6 text-pink-500" />
          </div>
        </div>

        {parseMessage && (
          <div className="mt-4 p-3 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{parseMessage}</span>
          </div>
        )}
      </div>

      {/* Main Table Inspector for users */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/80 shadow-md">
        <SqliteTableManager key={refreshKey} initialTable="users" />
      </div>
    </div>
  );
}
