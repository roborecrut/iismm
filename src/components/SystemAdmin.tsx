import React, { useState, useEffect } from 'react';
import SqliteTableManager from './SqliteTableManager';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Edit3,
  MessageSquare,
  Check, 
  X, 
  RefreshCw, 
  Database, 
  Activity, 
  Cpu, 
  Users, 
  Eye, 
  EyeOff, 
  Clock, 
  Search,
  Key,
  Flame,
  FileSpreadsheet,
  Settings as SettingsIcon,
  Play,
  HelpCircle,
  Coins,
  ShieldCheck,
  FileText,
  Send
} from 'lucide-react';
import { User, Settings } from '../types';

interface SystemAdminProps {
  currentUserEmail: string;
  triggerToast: (type: 'success' | 'error', message: string) => void;
  onDeleteDayRequest?: (id: string) => Promise<void>;
  onEditPost?: (id: string) => void;
}

export default function SystemAdmin({ currentUserEmail = 'shishkarnem@gmail.com', triggerToast = (type, msg) => console.log(type, msg), onDeleteDayRequest, onEditPost }: Partial<SystemAdminProps>) {
  const [systemPasswordInput, setSystemPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('system_admin_unlocked') === 'true';
    }
    return false;
  });
  const [passwordError, setPasswordError] = useState('');

  const handleUnlockSystemAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (systemPasswordInput.trim() === 'wkL35eTm') {
      setIsUnlocked(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('system_admin_unlocked', 'true');
      }
      setPasswordError('');
    } else {
      setPasswordError('Неверный системный пароль доступа!');
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'triggers'>('sql');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Posts State
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSearchTerm, setPostSearchTerm] = useState('');

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await fetch('/api/day-requests');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'posts') {
      fetchPosts();
    }
  }, [activeSubTab]);

  const handleDeletePost = async (id: string, title: string) => {
    if (!confirm(`Вы действительно хотите безвозвратно удалить пост "${title}" из базы данных?`)) return;
    try {
      const cleanId = String(id || '').trim();
      if (onDeleteDayRequest) {
        await onDeleteDayRequest(cleanId);
      } else {
        const res = await fetch(`/api/day-requests/${cleanId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Ошибка при удалении');
      }
      setPosts(prev => prev.filter(p => String(p.id || '').trim() !== cleanId));
      triggerToast('success', `Пост "${title}" удален из базы данных.`);
      fetchPosts();
    } catch (e) {
      triggerToast('error', 'Ошибка сети при удалении поста.');
    }
  };

  const handleSetupWebhook = async () => {
    try {
      const res = await fetch('/api/telegram/setup-webhook', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        triggerToast('success', `Webhook успешно привязан! URL: ${data.webhookUrl}`);
      } else {
        triggerToast('error', `Ошибка привязки Webhook: ${data.telegramResponse?.description || 'неизвестная ошибка'}`);
      }
    } catch (e) {
      triggerToast('error', 'Ошибка сети при настройке Webhook.');
    }
  };

  const handlePublishNow = async (post: any) => {
    try {
      const targetChannels = (post.channels && post.channels.length > 0) ? post.channels : [post.channel || '@SAV_AI'];
      let lastErr = '';
      let success = true;
      let fallbackNoticeMsg = '';

      for (const ch of targetChannels) {
        const res = await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: ch,
            title: post.title || 'Пост из БД',
            rawText: post.postText || post.requestTemplate || post.content || post.title || '',
            format: post.messageFormat || 'rich',
            signature: post.signature,
            attachmentType: post.attachmentType,
            attachmentUrl: post.attachmentUrl,
            attachmentUrls: post.attachmentUrls,
            inlineButtons: post.inlineButtons,
            telegramId: 169262990
          })
        });
        const data = await res.json();
        if (!data.success) {
          success = false;
          lastErr = data.error || 'Ошибка отправки';
        } else if (data.fallbackNotice) {
          fallbackNoticeMsg = data.fallbackNotice;
        }
      }

      if (success) {
        triggerToast('success', fallbackNoticeMsg || `Пост "${post.title}" успешно опубликован в Telegram!`);
        await fetch(`/api/day-requests/${post.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'sent' })
        });
        fetchPosts();
      } else {
        triggerToast('error', `Ошибка отправки: ${lastErr}`);
      }
    } catch (e) {
      triggerToast('error', 'Ошибка сети при публикации.');
    }
  };

  const handleTestSendDM = async (post: any) => {
    try {
      const res = await fetch('/api/telegram/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title || 'Пост из БД',
          text: post.postText || post.requestTemplate || post.content || post.title || '',
          format: post.messageFormat || 'rich',
          signature: post.signature,
          attachmentType: post.attachmentType,
          attachmentUrl: post.attachmentUrl,
          attachmentUrls: post.attachmentUrls,
          inlineButtons: post.inlineButtons,
          telegramId: 169262990
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('success', `Пост "${post.title || 'без названия'}" успешно отправлен в ваш ЛС Telegram (ID: 169262990)!`);
      } else {
        triggerToast('error', `Ошибка отправки в ЛС: ${data.error}`);
      }
    } catch (e) {
      triggerToast('error', 'Ошибка сети при тестовой отправке в ЛС.');
    }
  };
  
  // Settings State (loaded dynamically)
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // User Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [newTelegramId, setNewTelegramId] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newBalance, setNewBalance] = useState('500');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('editor');
  const [editTelegramId, setEditTelegramId] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editBalance, setEditBalance] = useState('500');

  // SQL Inspector States
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Load active triggers & cron tasks info
  const triggers = [
    {
      name: 'on_publication_insert_log_activity',
      table: 'publications',
      timing: 'AFTER INSERT',
      action: 'INSERT INTO publicationLogs (id, publicationId, action, timestamp, details) VALUES (...)',
      status: 'Активен (Встроен в DB)',
      description: 'Автоматически логирует успешные и неудачные публикации в Telegram-канал'
    },
    {
      name: 'auto_hash_user_passwords',
      table: 'users',
      timing: 'BEFORE INSERT OR UPDATE',
      action: 'SET NEW.passwordHash = HEX(SHA2(NEW.password, 256))',
      status: 'Активен (Встроен в API/DB)',
      description: 'Обеспечивает хэширование паролей пользователей методом SHA-256'
    },
    {
      name: 'cascade_delete_prompt_history',
      table: 'prompts',
      timing: 'BEFORE DELETE',
      action: 'UPDATE publications SET promptId = NULL WHERE promptId = OLD.id',
      status: 'Активен (Связи сущностей)',
      description: 'Каскадно очищает внешние ключи публикаций при удалении родительского промпта'
    },
    {
      name: 'billing_on_post_published',
      table: 'publications',
      timing: 'AFTER SUCCESSFUL SEND',
      action: 'UPDATE users SET balance = balance - 20 WHERE id = publisher_id',
      status: 'Активен (Тарифная сетка)',
      description: 'Автоматически списывает 20 ИИрок (рублей) со счета пользователя за каждый опубликованный пост'
    }
  ];

  const cronTasks = [
    {
      name: 'daily_sav_ai_autoposter',
      schedule: 'Каждый день в 07:00 (Настраиваемо)',
      lastRun: new Date().toLocaleDateString('ru-RU') + ' в 07:00',
      nextRun: 'Завтра в 07:00',
      status: 'Ожидание/Активен',
      target: 'Публикация промптов SAV_AI'
    },
    {
      name: 'recalculate_engagement_rates',
      schedule: 'Каждый час (*:00)',
      lastRun: '15 минут назад',
      nextRun: 'Через 45 минут',
      status: 'Активен',
      target: 'Пересчет индекса ER в Telegram канале'
    },
    {
      name: 'database_integrity_backup',
      schedule: 'Каждое воскресенье в 03:00',
      lastRun: 'Прошлое воскресенье в 03:00',
      nextRun: 'В следующее воскресенье в 03:00',
      status: 'Спит',
      target: 'Резервное копирование базы данных'
    }
  ];

  // Fetch initial configuration on mount
  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        triggerToast('error', 'Не удалось загрузить пользователей системы.');
      }
    } catch (e) {
      triggerToast('error', 'Ошибка сети при загрузке пользователей.');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        triggerToast('error', 'Не удалось загрузить настройки системы.');
      }
    } catch (e) {
      triggerToast('error', 'Ошибка сети при получении настроек.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        triggerToast('success', 'Настройки системы успешно применены и сохранены!');
      } else {
        triggerToast('error', 'Ошибка сохранения настроек.');
      }
    } catch (e) {
      triggerToast('error', 'Ошибка сети при сохранении настроек.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail && !newTelegramId) {
      triggerToast('error', 'Укажите хотя бы Email или Telegram ID.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail || undefined,
          password: newPassword || undefined,
          role: newRole,
          telegramId: newTelegramId ? parseInt(newTelegramId, 10) : undefined,
          firstName: newFirstName || undefined,
          lastName: newLastName || undefined,
          username: newUsername || undefined,
          photoUrl: newPhotoUrl || undefined,
          balance: newBalance ? parseInt(newBalance, 10) : 500
        })
      });

      if (res.ok) {
        triggerToast('success', 'Новый профиль успешно зарегистрирован!');
        setShowAddForm(false);
        // Clear inputs
        setNewEmail('');
        setNewPassword('');
        setNewRole('editor');
        setNewTelegramId('');
        setNewFirstName('');
        setNewLastName('');
        setNewUsername('');
        setNewPhotoUrl('');
        setNewBalance('500');
        fetchUsers();
      } else {
        const err = await res.json();
        triggerToast('error', err.error || 'Ошибка добавления пользователя');
      }
    } catch (err) {
      triggerToast('error', 'Сеть недоступна при создании пользователя.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editEmail || undefined,
          password: editPassword || undefined,
          role: editRole,
          telegramId: editTelegramId ? parseInt(editTelegramId, 10) : undefined,
          firstName: editFirstName || undefined,
          lastName: editLastName || undefined,
          username: editUsername || undefined,
          photoUrl: editPhotoUrl || undefined,
          balance: editBalance ? parseInt(editBalance, 10) : 500
        })
      });

      if (res.ok) {
        triggerToast('success', 'Поля пользователя обновлены в БД!');
        setEditingUser(null);
        fetchUsers();
      } else {
        const err = await res.json();
        triggerToast('error', err.error || 'Ошибка при обновлении.');
      }
    } catch (e) {
      triggerToast('error', 'Ошибка сети.');
    }
  };

  const handleDeleteUser = async (id: string, displayName: string) => {
    if (!confirm(`Вы действительно хотите безвозвратно удалить пользователя "${displayName}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('success', `Пользователь ${displayName} удален.`);
        fetchUsers();
      } else {
        triggerToast('error', 'Не удалось удалить пользователя.');
      }
    } catch (e) {
      triggerToast('error', 'Ошибка сети.');
    }
  };

  const executeSqlQuery = async (queryToRun?: string) => {
    const finalQuery = queryToRun || sqlQuery;
    if (!finalQuery.trim()) return;
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: finalQuery })
      });
      const data = await res.json();
      if (res.ok) {
        setQueryResult(data);
        triggerToast('success', 'Запрос к СУБД успешно выполнен!');
      } else {
        setQueryError(data.error || 'Ошибка в SQL синтаксисе или обработке.');
      }
    } catch (err: any) {
      setQueryError('Сетевая ошибка: ' + err.message);
    } finally {
      setQueryLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const term = userSearchTerm.toLowerCase();
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const tgId = String(u.telegramId || '');
    return name.includes(term) || email.includes(term) || username.includes(term) || tgId.includes(term);
  });

  if (!isUnlocked) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 via-pink-500 to-orange-400 flex items-center justify-center mx-auto text-white shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Вход в Системное Администрирование</h2>
            <p className="text-xs text-slate-500 font-medium">Для доступа к системным функциям введите главный пароль</p>
          </div>
          <form onSubmit={handleUnlockSystemAdmin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Пароль Доступа</label>
              <input
                type="password"
                value={systemPasswordInput}
                onChange={e => setSystemPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
              />
            </div>
            {passwordError && (
              <p className="text-xs text-red-500 font-semibold text-center">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 px-6 text-white text-xs font-bold uppercase rounded-xl shadow-lg hover:opacity-95 active:scale-98 transition-all cursor-pointer"
              style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
            >
              Войти в Панель
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Admin Panel Header tabs */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-1 shadow-xs">
        <button
          onClick={() => setActiveSubTab('sql')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'sql' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database size={14} />
          <span>СУБД Инспектор (SQL)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('triggers')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'triggers' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity size={14} />
          <span>Триггеры & Крон</span>
        </button>

        <button
          onClick={() => setActiveSubTab('posts')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'posts' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText size={14} />
          <span>База Постов</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'settings' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SettingsIcon size={14} />
          <span>Интеграции & ИИ</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'users' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users size={14} />
          <span>Пользователи</span>
        </button>
      </div>

      {/* SUB-TAB: SQL DB INSPECTOR */}
      {activeSubTab === 'sql' && (
        <SqliteTableManager triggerToast={triggerToast} />
      )}

      {/* SUB-TAB: SYSTEM CONFIGURATION (SETTINGS) */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-2.5">
                <SettingsIcon className="text-blue-600" size={22} />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Интеграционные и ИИ Настройки</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Управляйте учетными данными Telegram, токеном ИИSMM API и автопостингом</p>
                </div>
              </div>
            </div>

            {settingsLoading ? (
              <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
                <RefreshCw className="animate-spin text-blue-600" size={16} />
                <span>Загрузка конфигурации...</span>
              </div>
            ) : settings ? (
              <div className="space-y-5">
                {/* ИИSMM API */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
                  <h4 className="text-xs font-mono font-bold text-blue-700 uppercase tracking-wider flex items-center space-x-2">
                    <Cpu size={14} />
                    <span>Интеграция ИИSMM API</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">ID бота ИИSMM (bot_id)</label>
                      <input
                        type="text"
                        value={settings.protalkBotId}
                        onChange={(e) => setSettings({ ...settings, protalkBotId: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="66275"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">Токен API ИИSMM (bot_token)</label>
                      <input
                        type="password"
                        value={settings.protalkBotToken}
                        onChange={(e) => setSettings({ ...settings, protalkBotToken: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE"
                      />
                    </div>
                  </div>
                </div>

                {/* Telegram */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
                  <h4 className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider flex items-center space-x-2">
                    <Key size={14} />
                    <span>Telegram API Bot</span>
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">Токен Telegram бота</label>
                      <input
                        type="password"
                        value={settings.telegramBotToken}
                        onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Токен бота в Telegram"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">Канал назначения по умолчанию</label>
                        <input
                          type="text"
                          value={settings.channelId}
                          onChange={(e) => setSettings({ ...settings, channelId: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none"
                          placeholder="@SAV_AI"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">Бот тех-поддержки</label>
                        <input
                          type="text"
                          value={settings.backupChannelId}
                          onChange={(e) => setSettings({ ...settings, backupChannelId: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none"
                          placeholder="@SAVPartnerBot"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scheduler */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
                  <h4 className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-2">
                    <Clock size={14} />
                    <span>Планировщик постов (SAV Autoposter)</span>
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <label className="flex items-center space-x-3 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={settings.autoPostSchedule}
                        onChange={(e) => setSettings({ ...settings, autoPostSchedule: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300 accent-blue-600"
                      />
                      <span className="font-semibold">Включить автоматическую отправку постов</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-slate-500">Время ежедневной рассылки:</span>
                      <input
                        type="text"
                        value={settings.autoPostTime}
                        onChange={(e) => setSettings({ ...settings, autoPostTime: e.target.value })}
                        className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 w-20 text-center font-mono focus:outline-none"
                        placeholder="07:00"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-xs transition-all flex items-center space-x-2 shadow-xs cursor-pointer active:scale-95"
                  >
                    {isSavingSettings ? <RefreshCw className="animate-spin" size={13} /> : <Check size={13} />}
                    <span>Сохранить настройки</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-rose-600 text-xs">Не удалось загрузить настройки с сервера.</div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: USERS & BALANCE MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div className="flex items-center space-x-2.5">
                <Users className="text-indigo-600" size={22} />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Управление пользователями и тарифами</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Управляйте ролями, личными кабинетами пользователей и пополняйте балансы ИИрок</p>
                </div>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all duration-150 active:scale-95 shrink-0 cursor-pointer"
              >
                {showAddForm ? <X size={14} /> : <UserPlus size={14} />}
                <span>{showAddForm ? 'Скрыть форму' : 'Добавить пользователя'}</span>
              </button>
            </div>

            {/* Form to Add New User */}
            {showAddForm && (
              <form onSubmit={handleCreateUser} className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center space-x-2">
                  <UserPlus size={14} className="text-blue-600" />
                  <span>Регистрация нового профиля в СУБД</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5">Email (Логин)</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5">Пароль</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5">Роль доступа</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 cursor-pointer"
                    >
                      <option value="editor">Редактор (editor)</option>
                      <option value="admin">Администратор (admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5">Telegram ID</label>
                    <input
                      type="number"
                      value={newTelegramId}
                      onChange={(e) => setNewTelegramId(e.target.value)}
                      placeholder="169262990"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5">Имя</label>
                    <input
                      type="text"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="Александр"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5">Фамилия</label>
                    <input
                      type="text"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="Власов"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5">Юзернейм @</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="alex_sav"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5">Стартовый баланс ИИрок</label>
                    <input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5">Фото профиля URL</label>
                    <input
                      type="url"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2 rounded-lg active:scale-95 transition-all shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'Создание...' : 'Зарегистрировать в базу'}
                  </button>
                </div>
              </form>
            )}

            {/* Filter Input */}
            <div className="flex bg-white border border-slate-200 rounded-lg px-3 py-2 items-center space-x-2 focus-within:ring-1 focus-within:ring-blue-500 max-w-sm">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Поиск по имени, email или TG ID..."
                className="w-full bg-transparent border-none text-xs text-slate-800 focus:outline-none placeholder-slate-400"
              />
            </div>

            {/* User List Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
              {usersLoading ? (
                <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
                  <RefreshCw className="animate-spin text-blue-600" size={16} />
                  <span>Поиск в БД...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs italic">Пользователи не найдены</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Пользователь (Профиль)</th>
                      <th className="p-4">Telegram Идентификация</th>
                      <th className="p-4">Баланс (ИИрки)</th>
                      <th className="p-4">Роль</th>
                      <th className="p-4">Email / Логин</th>
                      <th className="p-4">Создан</th>
                      <th className="p-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => {
                      const isEditing = editingUser?.id === user.id;
                      const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Пользователь';
                      const isCurrentUser = user.email === currentUserEmail;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/80 text-slate-700">
                          {/* Avatar & Full Name */}
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={user.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                                alt="avatar"
                                className="w-8 h-8 rounded-full border border-slate-200 object-cover bg-slate-100 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                {isEditing ? (
                                  <div className="grid grid-cols-2 gap-1.5 max-w-[180px]">
                                    <input
                                      type="text"
                                      value={editFirstName}
                                      onChange={(e) => setEditFirstName(e.target.value)}
                                      placeholder="Имя"
                                      className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                                    />
                                    <input
                                      type="text"
                                      value={editLastName}
                                      onChange={(e) => setEditLastName(e.target.value)}
                                      placeholder="Фамилия"
                                      className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                                    />
                                  </div>
                                ) : (
                                  <span className="font-semibold text-slate-900 text-xs block">{displayName}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Telegram Details */}
                          <td className="p-4">
                            {isEditing ? (
                              <div className="space-y-1.5 max-w-[150px]">
                                <input
                                  type="number"
                                  value={editTelegramId}
                                  onChange={(e) => setEditTelegramId(e.target.value)}
                                  placeholder="TG ID"
                                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 block w-full font-mono"
                                />
                                <input
                                  type="text"
                                  value={editUsername}
                                  onChange={(e) => setEditUsername(e.target.value)}
                                  placeholder="Username"
                                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 block w-full font-mono"
                                />
                              </div>
                            ) : (
                              <div className="font-mono text-[11px] space-y-0.5 text-slate-500">
                                {user.telegramId ? (
                                  <>
                                    <div className="font-bold text-slate-700">ID: {user.telegramId}</div>
                                    {user.username && <div className="text-blue-600">@{user.username}</div>}
                                  </>
                                ) : (
                                  <span className="text-slate-400 italic">Не привязан</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* USER BALANCE IN COINS */}
                          <td className="p-4">
                            {isEditing ? (
                              <div className="flex items-center space-x-1.5 max-w-[90px]">
                                <input
                                  type="number"
                                  value={editBalance}
                                  onChange={(e) => setEditBalance(e.target.value)}
                                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-slate-800 w-full"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1.5 font-mono">
                                <Coins size={14} className="text-amber-500 shrink-0" />
                                <span className="font-bold text-amber-600">{user.balance ?? 500}</span>
                                <span className="text-[9px] text-slate-400">ИИрок</span>
                              </div>
                            )}
                          </td>

                          {/* User Access Role */}
                          <td className="p-4">
                            {isEditing ? (
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                className="bg-white border border-slate-200 rounded p-1 text-xs text-slate-800 cursor-pointer"
                              >
                                <option value="editor">editor</option>
                                <option value="admin">admin</option>
                              </select>
                            ) : (
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                user.role === 'admin' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {user.role}
                              </span>
                            )}
                          </td>

                          {/* Email Login Credentials */}
                          <td className="p-4 max-w-[150px] truncate">
                            {isEditing ? (
                              <div className="space-y-1 max-w-[150px]">
                                <input
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  placeholder="Email"
                                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 block w-full"
                                />
                                <input
                                  type="password"
                                  value={editPassword}
                                  onChange={(e) => setEditPassword(e.target.value)}
                                  placeholder="Сбросить пароль"
                                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 block w-full"
                                />
                              </div>
                            ) : (
                              <div className="font-mono text-[10px] space-y-0.5 text-slate-500">
                                {user.email && <div className="text-slate-800 font-sans">{user.email}</div>}
                                {user.passwordHash && <div className="truncate text-slate-400">HASH: {user.passwordHash.substring(0, 10)}...</div>}
                                {!user.email && !user.passwordHash && <div className="text-slate-400 italic">Связанный ботом</div>}
                              </div>
                            )}
                          </td>

                          {/* Created At Date */}
                          <td className="p-4 text-slate-500 font-mono text-[10px]">
                            {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                          </td>

                          {/* Operation Actions */}
                          <td className="p-4 text-right">
                            <div className="flex justify-end space-x-1.5">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateUser(user.id)}
                                    className="text-emerald-600 hover:text-emerald-700 p-1.5 bg-emerald-50 border border-emerald-200 rounded"
                                    title="Сохранить"
                                  >
                                    <Check size={13} />
                                  </button>
                                  <button
                                    onClick={() => setEditingUser(null)}
                                    className="text-slate-600 hover:text-slate-900 p-1.5 bg-slate-100 border border-slate-200 rounded"
                                    title="Отмена"
                                  >
                                    <X size={13} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingUser(user);
                                      setEditEmail(user.email || '');
                                      setEditRole(user.role);
                                      setEditPassword('');
                                      setEditTelegramId(user.telegramId ? String(user.telegramId) : '');
                                      setEditFirstName(user.firstName || '');
                                      setEditLastName(user.lastName || '');
                                      setEditUsername(user.username || '');
                                      setEditPhotoUrl(user.photoUrl || '');
                                      setEditBalance(String(user.balance ?? 500));
                                    }}
                                    className="text-slate-600 hover:text-slate-900 p-1.5 hover:bg-slate-100 rounded transition-colors"
                                    title="Редактировать поля"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id, displayName)}
                                    className="text-rose-600 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-colors"
                                    disabled={isCurrentUser}
                                    title={isCurrentUser ? "Вы не можете удалить себя" : "Удалить пользователя"}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: TRIGGERS & CRON TASKS MONITOR */}
      {activeSubTab === 'triggers' && (
        <div className="space-y-6">
          {/* SYSTEM TRIGGERS */}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-slate-200 pb-4">
              <Activity className="text-indigo-600" size={20} />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Мониторинг триггеров СУБД</h3>
                <p className="text-xs text-slate-500">Автоматизированные каскадные обработчики и правила наложения ограничений в базе данных</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {triggers.map((trigger, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {trigger.timing}
                      </span>
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {trigger.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 font-mono truncate">{trigger.name}</h4>
                    <p className="text-[10px] text-slate-600 leading-relaxed">{trigger.description}</p>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200 font-mono text-[9px] text-slate-600 overflow-x-auto truncate">
                    {trigger.action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CRON TASKS */}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-slate-200 pb-4">
              <Clock className="text-emerald-600" size={20} />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Расписание фоновых задач (Node.js Cron)</h3>
                <p className="text-xs text-slate-500">Модуль автоматизации периодических триггеров, отправки постов и пересчета статистики</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Имя Cron-Задачи</th>
                    <th className="p-4">Спецификация времени</th>
                    <th className="p-4">Последний запуск</th>
                    <th className="p-4">Следующий запуск</th>
                    <th className="p-4">Функционал задачи</th>
                    <th className="p-4 text-right">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {cronTasks.map((task, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="p-4 font-mono font-semibold text-slate-900">{task.name}</td>
                      <td className="p-4 font-mono text-xs text-blue-600">{task.schedule}</td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">{task.lastRun}</td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">{task.nextRun}</td>
                      <td className="p-4 text-slate-600">{task.target}</td>
                      <td className="p-4 text-right">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: POSTS DATABASE TABLE */}
      {activeSubTab === 'posts' && (
        <div className="space-y-6">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <FileText className="text-purple-600" size={24} />
                <div>
                  <h3 className="text-base font-bold text-slate-900">База Данных Постов Публикаций</h3>
                  <p className="text-xs text-slate-500">Просмотр всех созданных постов, управление расписаниями, статус и экстренная публикация</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={postSearchTerm}
                    onChange={(e) => setPostSearchTerm(e.target.value)}
                    placeholder="Поиск по названию или тексту..."
                    className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 w-64"
                  />
                </div>

                <button
                  onClick={fetchPosts}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200"
                >
                  <RefreshCw size={14} className={postsLoading ? 'animate-spin' : ''} />
                  <span>Обновить</span>
                </button>
              </div>
            </div>

            {postsLoading ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                Загрузка таблицы постов из БД...
              </div>
            ) : posts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                В базе данных нет постов. Создайте первый пост в Редакторе!
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-4">ID & Название</th>
                      <th className="p-4">Канал(ы)</th>
                      <th className="p-4">Формат</th>
                      <th className="p-4">Статус</th>
                      <th className="p-4">Расписание</th>
                      <th className="p-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {posts
                      .filter(p => {
                        const term = postSearchTerm.toLowerCase();
                        return (p.title || '').toLowerCase().includes(term) || (p.postText || '').toLowerCase().includes(term);
                      })
                      .map((post) => {
                        const sched = post.triggerSchedule;
                        const isScheduled = sched && sched.enabled;
                        const channelsStr = (post.channels && post.channels.length > 0) ? post.channels.join(', ') : (post.channel || '@SAV_AI');

                        return (
                          <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-900 text-xs">{post.title || 'Без названия'}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {post.id}</div>
                              <div className="text-[11px] text-slate-500 truncate max-w-xs mt-1">
                                {(post.postText || post.requestTemplate || '').slice(0, 70)}...
                              </div>
                            </td>

                            <td className="p-4 font-mono text-blue-600 text-[11px]">
                              {channelsStr}
                            </td>

                            <td className="p-4 font-mono text-[11px]">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                post.messageFormat === 'rich' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                              }`}>
                                {post.messageFormat === 'rich' ? 'Rich' : 'V2'}
                              </span>
                            </td>

                            <td className="p-4 font-mono text-[11px]">
                              {post.status === 'sent' && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                  <span>✓ Опубликован</span>
                                </span>
                              )}
                              {post.status === 'failed' && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                  <span>⚠ Ошибка</span>
                                </span>
                              )}
                              {post.status !== 'sent' && post.status !== 'failed' && isScheduled && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                                  <span>⏱ Запланирован</span>
                                </span>
                              )}
                              {post.status !== 'sent' && post.status !== 'failed' && !isScheduled && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                                  <span>Черновик</span>
                                </span>
                              )}
                            </td>

                            <td className="p-4 font-mono text-[11px] text-slate-500">
                              {isScheduled ? (
                                <div>
                                  {sched.scheduledAt ? (
                                    <div className="text-amber-700 font-bold">
                                      {new Date(sched.scheduledAt).toLocaleString('ru-RU')}
                                    </div>
                                  ) : (
                                    <div className="text-slate-700">
                                      {sched.frequency || 'Ежедневно'} в {sched.time || '09:00'}
                                    </div>
                                  )}
                                  {sched.attemptCount > 0 && (
                                    <div className="text-[10px] text-slate-400">Попыток: {sched.attemptCount}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              {onEditPost && (
                                <button
                                  onClick={() => onEditPost(post.id)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg font-semibold text-[11px] cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                                  title="Открыть и отредактировать этот пост в редакторе"
                                >
                                  <Edit3 size={12} className="text-amber-600" />
                                  <span>Редактировать</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleTestSendDM(post)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg font-semibold text-[11px] cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                                title="Тестово отправить этот пост напрямую в ваш ЛС Telegram (ID: 169262990)"
                              >
                                <MessageSquare size={12} className="text-emerald-600" />
                                <span>Тест ЛС</span>
                              </button>

                              <button
                                onClick={() => handlePublishNow(post)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                                title="Опубликовать в каналы Telegram"
                              >
                                <Send size={12} />
                                <span>Отправить</span>
                              </button>

                              <button
                                onClick={() => handleDeletePost(post.id, post.title || post.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg cursor-pointer inline-flex items-center justify-center"
                                title="Безвозвратно удалить из БД"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
