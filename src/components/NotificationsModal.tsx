import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, CheckCheck, X, Sparkles, CreditCard, Radio, AlertCircle, ExternalLink } from 'lucide-react';
import { NotificationRecord } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  userId,
  onUnreadCountChange
}: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(userId || '16926299042')}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        if (onUnreadCountChange) {
          onUnreadCountChange(data.unreadCount || 0);
        }
      }
    } catch (e) {
      console.warn('Ошибка загрузки уведомлений:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      const unread = notifications.filter(n => n.id !== id && !n.is_read).length;
      if (onUnreadCountChange) onUnreadCountChange(unread);
    } catch (e) {
      console.warn('Ошибка отметки уведомления:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (e) {
      console.warn('Ошибка отметки всех уведомлений:', e);
    }
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'balance':
      case 'transaction':
        return <CreditCard className="w-5 h-5 text-pink-500 shrink-0" />;
      case 'publish':
        return <Radio className="w-5 h-5 text-sky-500 shrink-0" />;
      case 'social':
        return <Sparkles className="w-5 h-5 text-orange-500 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-pink-500 shrink-0" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-900/20 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 border border-pink-300 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-pink-200/80 flex items-center justify-between gap-3 bg-white/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Центр уведомлений</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-pink-500 text-white shadow-xs">
                      +{unreadCount}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-slate-700 font-medium">История событий, начислений и статусов</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-full bg-white/80 hover:bg-white border border-pink-200 transition-all cursor-pointer shadow-xs min-w-[38px] min-h-[38px] flex items-center justify-center"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls & Filter */}
          <div className="px-4 sm:px-5 py-3 border-b border-pink-200/60 bg-white/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:bg-white border border-pink-200'
                }`}
              >
                Все ({notifications.length})
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeFilter === 'unread'
                    ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:bg-white border border-pink-200'
                }`}
              >
                Непрочитанные ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 rounded-xl text-sm font-bold bg-white/90 hover:bg-white text-pink-700 border border-pink-300 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-pink-500" />
                <span>Прочитать все</span>
              </button>
            )}
          </div>

          {/* Notifications Scrollable List */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
            {loading ? (
              <div className="py-12 text-center text-sm font-bold text-slate-700">
                Загрузка уведомлений...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white/80 border border-pink-200 mx-auto flex items-center justify-center text-pink-400 shadow-xs">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">Нет уведомлений</p>
                <p className="text-sm text-slate-600 font-medium">Новые сообщения и начисления появятся здесь</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2 text-left ${
                    item.is_read
                      ? 'bg-white/70 border-pink-200/70 opacity-90'
                      : 'bg-white/95 border-pink-300 shadow-md ring-1 ring-pink-300/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-pink-50 border border-pink-200 shrink-0">
                        {getIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {item.title}
                          </h4>
                          {!item.is_read && (
                            <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-sm text-slate-500 font-mono">
                          {new Date(item.created_at).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {!item.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        className="px-2.5 py-1 rounded-xl text-sm font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                        title="Отметить прочитанным"
                      >
                        <Check className="w-3.5 h-3.5 text-pink-500" />
                        <span>Прочитано</span>
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-wrap pl-11">
                    {item.message}
                  </p>

                  {item.link && (
                    <div className="pl-11 pt-1">
                      <a
                        href={item.link}
                        onClick={() => onClose()}
                        className="inline-flex items-center gap-1 text-sm font-bold text-pink-600 hover:text-pink-700 hover:underline"
                      >
                        <span>Перейти к разделу</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-pink-200/80 bg-white/40 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-2xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-bold text-sm shadow-md hover:opacity-95 transition-all cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
