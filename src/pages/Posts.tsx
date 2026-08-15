import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Layers, 
  ArrowLeft, 
  Clock, 
  Radio, 
  Sparkles, 
  Tag, 
  Code, 
  FileText, 
  LayoutGrid, 
  List as ListIcon, 
  Filter, 
  ArrowUpDown, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  Cpu,
  Share2
} from 'lucide-react';
import { DayRequest, Channel, PostTemplate, User } from '../types';
import PromptEditor from '../components/PromptEditor';
import { ScenariosPage } from '../components/ScenariosPage';
import FreeCrosspostingView from '../components/FreeCrosspostingView';

interface PostsProps {
  dayRequests: DayRequest[];
  channels: Channel[];
  templates?: PostTemplate[];
  currentUser?: User | null;
  onAddDayRequest: (req: Partial<DayRequest>) => Promise<any>;
  onUpdateDayRequest: (id: string, updated: Partial<DayRequest>) => Promise<void>;
  onDeleteDayRequest: (id: string) => Promise<void>;
  onSaveDayRequest: (request: Partial<DayRequest>) => Promise<void>;
  onPublishToTelegram: (
    title: string, 
    content: string, 
    dayRequestId: string, 
    formattingOptions?: any
  ) => Promise<void>;
  onSaveTemplate?: (template: { type: 'header' | 'postText' | 'signature' | 'full'; name: string; category?: string; content: string }) => Promise<void>;
  selectedPostId?: string | null;
  onSelectPostId?: (id: string | null) => void;
  telegramId?: number;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

const formatScheduleText = (schedule: any) => {
  if (!schedule || !schedule.enabled) return null;
  const freq = schedule.frequency || 'daily';
  if (freq === 'interval_minutes') return `Каждые ${schedule.intervalMinutes || 15} мин`;
  if (freq === 'interval_hours') return `Каждые ${schedule.intervalHours || 2} ч`;
  if (freq === 'daily') return `Ежедневно в ${schedule.time || '09:00'}`;
  if (freq === 'dayOfWeek') return `Еженедельно в ${schedule.time || '09:00'}`;
  if (freq === 'exact_date') return `Дата: ${schedule.exactDateTime ? schedule.exactDateTime.replace('T', ' ') : 'не задана'}`;
  return 'Автопост';
};

export default function Posts({
  dayRequests,
  channels,
  templates = [],
  currentUser,
  onAddDayRequest,
  onUpdateDayRequest,
  onDeleteDayRequest,
  onSaveDayRequest,
  onPublishToTelegram,
  onSaveTemplate,
  selectedPostId: externalSelectedPostId,
  onSelectPostId: externalOnSelectPostId,
  telegramId,
  currentPath,
  onNavigate
}: PostsProps) {
  // Local selected post ID for editing
  const [internalSelectedPostId, setInternalSelectedPostId] = useState<string | null>(null);

  const activePostId = externalSelectedPostId !== undefined ? externalSelectedPostId : internalSelectedPostId;

  // Sub-tab switcher state
  const getSubTabFromPath = (path?: string): 'posts' | 'scenarios' | 'crosspost' => {
    if (!path) return 'posts';
    const clean = path.replace('169262990', '');
    if (clean.startsWith('/scenarios')) return 'scenarios';
    if (clean.startsWith('/crosspost')) return 'crosspost';
    return 'posts';
  };

  const [localSubTab, setLocalSubTab] = useState<'posts' | 'scenarios' | 'crosspost'>('posts');
  const currentSubTab = currentPath ? getSubTabFromPath(currentPath) : localSubTab;

  const handleTabSwitch = (tab: 'posts' | 'scenarios' | 'crosspost') => {
    setLocalSubTab(tab);
    if (onNavigate) {
      if (tab === 'scenarios') onNavigate('/scenarios');
      else if (tab === 'crosspost') onNavigate('/crosspost');
      else onNavigate('/posts');
    } else {
      window.history.pushState(null, '', `/${tab}`);
    }
  };

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activePostId]);

  const setActivePostId = (id: string | null) => {
    if (externalOnSelectPostId) {
      externalOnSelectPostId(id);
    } else {
      setInternalSelectedPostId(id);
    }
    if (id) {
      window.history.pushState(null, '', `/posts/${id}`);
    } else {
      window.history.pushState(null, '', '/posts');
    }
  };

  // View Mode State: 'cards' or 'list'
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Creation animation & error states
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'v2' | 'rich'>('all');
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'auto' | 'manual'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'category'>('newest');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Extract unique topics/categories
  const uniqueTopics = Array.from(
    new Set(dayRequests.map(r => r.category).filter(Boolean))
  );

  // Filtered and Sorted posts
  const processedPosts = useMemo(() => {
    let result = dayRequests.filter(post => {
      const matchesSearch = !searchQuery || 
        (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.postText && post.postText.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.requestTemplate && post.requestTemplate.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTopic = !selectedTopic || post.category === selectedTopic;

      const matchesFormat = formatFilter === 'all' || 
        (formatFilter === 'rich' && post.messageFormat === 'rich') ||
        (formatFilter === 'v2' && (post.messageFormat === 'v2' || !post.messageFormat));

      const matchesSchedule = scheduleFilter === 'all' ||
        (scheduleFilter === 'auto' && post.triggerSchedule?.enabled) ||
        (scheduleFilter === 'manual' && !post.triggerSchedule?.enabled);

      return matchesSearch && matchesTopic && matchesFormat && matchesSchedule;
    });

    // Sort
    return result.sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.id || '').localeCompare(a.id || '');
      }
      if (sortBy === 'oldest') {
        return (a.id || '').localeCompare(b.id || '');
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      }
      return 0;
    });
  }, [dayRequests, searchQuery, selectedTopic, formatFilter, scheduleFilter, sortBy]);

  // Handler for "+ Создать новый пост" - DB First with status "создается"
  const handleCreateNewPost = async () => {
    setIsCreatingPost(true);
    setCreateError(null);
    try {
      const defaultChannel = channels[0]?.username || '@SAV_AI';
      const created = await onAddDayRequest({
        title: 'Новый пост без названия',
        category: selectedTopic || 'общее',
        channel: defaultChannel,
        channels: [defaultChannel],
        status: 'создается',
        requestTemplate: '',
        postText: '',
        signature: 'Присылайте полученные варианты в комментариях!',
        messageFormat: 'v2',
        uppercaseHeader: true,
        inlineButtons: [],
        triggerSchedule: {
          enabled: false,
          frequency: 'daily',
          time: '09:00'
        }
      });

      if (created && created.id) {
        setActivePostId(created.id);
      } else {
        throw new Error('База данных не вернула ID созданного поста');
      }
    } catch (e: any) {
      console.error('Failed to create new post:', e);
      setCreateError(e.message || 'Не удалось создать пост в базе данных. Попробуйте еще раз.');
    } finally {
      setIsCreatingPost(false);
    }
  };

  // Active Post for editing
  const activePost = dayRequests.find(p => p.id === activePostId);

  // Loading state when navigating directly to a post ID that is still fetching from DB
  if (activePostId && !activePost && !isCreatingPost) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-sky-100/80 via-pink-100/80 via-orange-100/80 via-pink-100/80 to-sky-100/80 backdrop-blur-md border border-pink-200/80 rounded-3xl p-4 md:p-5 shadow-2xs flex items-center justify-between">
          <button
            onClick={() => setActivePostId(null)}
            className="flex items-center space-x-2 bg-white/90 hover:bg-white border border-pink-200/80 text-slate-800 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={16} className="text-orange-500" />
            <span>Назад к списку постов</span>
          </button>
          <span className="text-[11px] font-mono font-bold text-slate-700 bg-white/80 px-3 py-1.5 rounded-xl border border-pink-200/80 shadow-2xs">
            ID: {activePostId}
          </span>
        </div>

        <div className="bg-gradient-to-r from-sky-100/80 via-pink-100/80 via-orange-100/80 via-pink-100/80 to-sky-100/80 border border-pink-200/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          <p className="text-xs font-bold text-slate-800">Загрузка поста #{activePostId} из базы данных...</p>
        </div>
      </div>
    );
  }

  // If a post is selected for editing, render the single post editor view!
  if (activePostId && activePost) {
    return (
      <div className="space-y-6">
        {/* Top bar with back button */}
        <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/90 rounded-3xl p-4 md:p-5 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActivePostId(null)}
              className="flex items-center space-x-2 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={16} />
              <span>Назад к списку постов</span>
            </button>
            <div className="hidden sm:block h-5 w-[1px] bg-pink-300/60" />
            <div className="hidden sm:block">
              <h3 className="text-sm font-extrabold text-slate-900 truncate max-w-md">{activePost.title}</h3>
              <p className="text-[11px] text-pink-600 font-mono font-bold">#{activePost.category || 'без темы'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-pink-700 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 px-3 py-1.5 rounded-xl border border-pink-300 shadow-2xs">
              {activePost.status || 'создается'}
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-800 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 px-3 py-1.5 rounded-xl border border-pink-300 shadow-2xs">
              ID: {activePost.id}
            </span>
          </div>
        </div>

        {/* PromptEditor Component */}
        <PromptEditor
          dayRequests={dayRequests}
          templates={templates}
          channels={channels}
          currentUser={currentUser}
          onSaveDayRequest={onSaveDayRequest}
          onDeleteDayRequest={async (id) => {
            await onDeleteDayRequest(id);
            setActivePostId(null);
          }}
          onPublishToTelegram={onPublishToTelegram}
          onSaveTemplate={onSaveTemplate}
          initialDayRequestId={activePostId}
          telegramId={telegramId}
        />
      </div>
    );
  }

  // LIST OF POSTS VIEW
  return (
    <div className="space-y-6 text-left">
      {/* Creation Loading Modal Overlay */}
      {isCreatingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs p-4">
          <div className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 border border-pink-200/90 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-sky-500 via-pink-500 via-orange-500 via-pink-500 to-sky-500 p-0.5 animate-spin">
              <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-pink-600 animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Создание поста в базе данных...</h3>
              <p className="text-xs text-slate-700 font-medium mt-1">
                Пост добавляется в базу данных SQLite со статусом «создается»
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Creation Error Banner */}
      {createError && (
        <div className="bg-gradient-to-r from-rose-100/90 via-pink-100/90 to-orange-100/90 border border-rose-300 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-xs font-black text-rose-900">Ошибка создания поста в базе данных</h4>
              <p className="text-xs text-rose-800">{createError}</p>
            </div>
          </div>
          <button onClick={() => setCreateError(null)} className="text-rose-700 hover:text-rose-900 font-bold text-xs p-1">
            ✕
          </button>
        </div>
      )}

      {/* Unified Header bar with switcher tabs */}
      <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-md border border-pink-200/80 rounded-3xl p-4 md:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Icon */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/90 border border-pink-200 shadow-2xs shrink-0">
            <Layers className="text-orange-500" size={22} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
              Управление автопостингом
            </h2>
          </div>
        </div>

        {/* Navigation Switcher Tabs inside Unified Header */}
        <div className="flex items-center bg-white/85 p-1 rounded-2xl border border-pink-200/80 shadow-2xs gap-1 self-stretch md:self-auto justify-between md:justify-start">
          <button
            onClick={() => handleTabSwitch('posts')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              currentSubTab === 'posts'
                ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-2xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FileText size={16} />
            <span>Посты</span>
          </button>

          <button
            onClick={() => handleTabSwitch('scenarios')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              currentSubTab === 'scenarios'
                ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-2xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Cpu size={16} />
            <span>СценарИИ</span>
          </button>

          <button
            onClick={() => handleTabSwitch('crosspost')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              currentSubTab === 'crosspost'
                ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-2xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Share2 size={16} />
            <span>Кросспостинг</span>
          </button>
        </div>

        {/* Primary Action Button (for Posts tab) */}
        {currentSubTab === 'posts' && (
          <button
            onClick={handleCreateNewPost}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-md cursor-pointer border border-white/30 shrink-0"
          >
            <Plus size={18} />
            <span>Создать новый пост</span>
          </button>
        )}
      </div>

      {/* RENDER SCENARIOS TAB */}
      {currentSubTab === 'scenarios' && (
        <ScenariosPage currentUser={currentUser} channels={channels} />
      )}

      {/* RENDER CROSSPOSTING TAB */}
      {currentSubTab === 'crosspost' && (
        <FreeCrosspostingView channels={channels} currentUser={currentUser} />
      )}

      {/* RENDER POSTS LIST TAB */}
      {currentSubTab === 'posts' && (
        <>
          {/* Filter, Search, Sort & View Mode Switcher Bar */}
          <div className="bg-gradient-to-r from-sky-100/80 via-pink-100/80 via-orange-100/80 via-pink-100/80 to-sky-100/80 backdrop-blur-md border border-pink-200/80 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        
        {/* Search Input */}
        <div className="flex flex-1 min-w-[240px] bg-white/90 border border-pink-200/80 rounded-2xl px-3.5 py-2 items-center space-x-2 focus-within:ring-2 focus-within:ring-pink-400 shadow-2xs">
          <Search size={16} className="text-orange-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или тексту поста..."
            className="w-full bg-transparent border-none text-xs text-slate-800 font-semibold focus:outline-none placeholder-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 font-bold text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Filter Toggle, Sort Dropdown & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Topic Select */}
          <div className="flex items-center bg-white/90 border border-pink-200/80 rounded-2xl px-3 py-1.5 shadow-2xs">
            <Tag size={14} className="text-pink-500 mr-1.5 shrink-0" />
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="">Все темы ({uniqueTopics.length})</option>
              {uniqueTopics.map(topic => (
                <option key={topic} value={topic}>#{topic}</option>
              ))}
            </select>
          </div>

          {/* Filter button */}
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border shadow-2xs ${
              formatFilter !== 'all' || scheduleFilter !== 'all' || isFilterPanelOpen
                ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white border-white/30'
                : 'bg-white/90 text-slate-700 border-pink-200/80 hover:bg-white'
            }`}
          >
            <Filter size={14} />
            <span>Фильтры</span>
            {(formatFilter !== 'all' || scheduleFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>

          {/* Sort dropdown */}
          <div className="flex items-center bg-white/90 border border-pink-200/80 rounded-2xl px-3 py-1.5 shadow-2xs">
            <ArrowUpDown size={14} className="text-sky-500 mr-1.5 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="title">По названию (А-Я)</option>
              <option value="category">По категориям</option>
            </select>
          </div>

          {/* View Mode Switcher: Cards vs List */}
          <div className="flex items-center p-1 bg-white/90 border border-pink-200/80 rounded-2xl shadow-2xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Режим карточек"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Карточки</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Режим списка"
            >
              <ListIcon size={14} />
              <span className="hidden sm:inline">Список</span>
            </button>
          </div>

        </div>
      </div>

      {/* Expanded Filter Options Panel */}
      {isFilterPanelOpen && (
        <div className="p-4 bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-md border border-pink-200/80 rounded-3xl space-y-3 shadow-xs">
          <div className="flex justify-between items-center border-b border-pink-200/80 pb-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Параметры фильтрации:</span>
            <button 
              onClick={() => {
                setFormatFilter('all');
                setScheduleFilter('all');
                setSelectedTopic('');
              }}
              className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer"
            >
              Сбросить все
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold">
            {/* Format filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-600 uppercase font-bold block">Формат сообщения:</label>
              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'v2', label: 'Markdown V2' },
                  { id: 'rich', label: 'Markdown Rich' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFormatFilter(f.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      formatFilter === f.id
                        ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white border-white/30 shadow-2xs'
                        : 'bg-white/90 text-slate-700 border-pink-200/80 hover:bg-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-600 uppercase font-bold block">Режим публикации:</label>
              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'auto', label: 'Автопостинг ⏰' },
                  { id: 'manual', label: 'Ручной запуск' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setScheduleFilter(s.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      scheduleFilter === s.id
                        ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white border-white/30 shadow-2xs'
                        : 'bg-white/90 text-slate-700 border-pink-200/80 hover:bg-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Posts Cards or Posts List Table */}
      {processedPosts.length === 0 ? (
        <div className="p-12 bg-gradient-to-r from-sky-100/70 via-pink-100/70 via-orange-100/70 via-pink-100/70 to-sky-100/70 backdrop-blur-md border border-pink-200/80 rounded-3xl text-center space-y-4 shadow-sm">
          <Layers className="mx-auto text-pink-400" size={36} />
          <div>
            <p className="text-sm text-slate-900 font-extrabold">Посты не найдены</p>
            <p className="text-xs text-slate-600 mt-1">Попробуйте изменить параметры поиска или создайте новый пост.</p>
          </div>
          <button
            onClick={handleCreateNewPost}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white px-5 py-2.5 rounded-2xl text-xs font-black cursor-pointer shadow-md"
          >
            <Plus size={16} />
            <span>Создать первый пост</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* GRID OF POST CARDS MODE */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {processedPosts.map((post) => {
            const postChannels = post.channels && post.channels.length > 0 
              ? post.channels 
              : [post.channel || '@SAV_AI'];

            return (
              <div 
                key={post.id}
                className="bg-gradient-to-r from-sky-100/80 via-pink-100/80 via-orange-100/80 via-pink-100/80 to-sky-100/80 backdrop-blur-md border border-pink-200/80 hover:border-pink-400 transition-all rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Category / Topic & Format / Schedule Header */}
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-mono font-extrabold text-sky-800 bg-white/90 border border-sky-200 px-2.5 py-0.5 rounded-xl shadow-2xs">
                        #{post.category || 'общий'}
                      </span>

                      {/* Post Format Type Badge */}
                      {post.messageFormat === 'rich' ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-lg">
                          <Sparkles size={10} className="text-purple-600" />
                          <span>Markdown Rich</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-lg">
                          <Code size={10} className="text-sky-600" />
                          <span>Markdown V2</span>
                        </span>
                      )}
                    </div>

                    {/* Schedule status badge */}
                    {post.triggerSchedule?.enabled ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg">
                        <Clock size={10} className="text-amber-600" />
                        <span>{formatScheduleText(post.triggerSchedule)}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded-lg border border-pink-200/60">
                        Ручной запуск
                      </span>
                    )}
                  </div>

                  {/* Title & Preview */}
                  <div>
                    <h3 className="text-xs font-black text-slate-900 group-hover:text-pink-600 transition-colors line-clamp-2">
                      {post.title || 'Пост без названия'}
                    </h3>
                    <p className="text-[11px] text-slate-700 font-mono mt-2 line-clamp-3 leading-relaxed bg-white/90 border border-pink-200/80 p-3 rounded-2xl shadow-2xs">
                      {post.postText || post.requestTemplate || 'Текст поста пуст...'}
                    </p>
                  </div>

                  {/* Connected Channels List */}
                  <div className="pt-2 border-t border-pink-200/60 space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block font-black">
                      Каналы публикации:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {postChannels.map((ch, idx) => (
                        <span 
                          key={idx}
                          className="text-[10px] font-mono bg-white/90 text-slate-800 border border-pink-200/80 px-2 py-0.5 rounded-lg flex items-center space-x-1 shadow-2xs"
                        >
                          <Radio size={10} className="text-orange-500" />
                          <span>{ch}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-pink-200/60 flex justify-between items-center space-x-2">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm(`Вы действительно хотите удалить пост "${post.title}"?`)) {
                        await onDeleteDayRequest(post.id);
                        if (activePostId === post.id) {
                          setActivePostId(null);
                        }
                      }
                    }}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Удалить пост"
                  >
                    <Trash2 size={16} />
                  </button>

                  <button
                    onClick={() => setActivePostId(post.id)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs border border-white/20"
                  >
                    <Edit3 size={14} />
                    <span>Редактировать пост</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST OF POSTS TABLE MODE */
        <div className="bg-gradient-to-r from-sky-100/80 via-pink-100/80 via-orange-100/80 via-pink-100/80 to-sky-100/80 backdrop-blur-md border border-pink-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/90 border-b border-pink-200/80 text-[10px] uppercase tracking-wider text-slate-700 font-black">
                  <th className="py-3 px-4">Название поста</th>
                  <th className="py-3 px-4">Тема</th>
                  <th className="py-3 px-4">Формат</th>
                  <th className="py-3 px-4">Каналы</th>
                  <th className="py-3 px-4">Автопостинг</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-200/60 text-xs font-semibold">
                {processedPosts.map((post) => {
                  const postChannels = post.channels && post.channels.length > 0 
                    ? post.channels 
                    : [post.channel || '@SAV_AI'];

                  return (
                    <tr 
                      key={post.id}
                      onClick={() => setActivePostId(post.id)}
                      className="hover:bg-white/90 transition-colors cursor-pointer group"
                    >
                      {/* Title & Preview */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-extrabold text-slate-900 group-hover:text-pink-600 transition-colors truncate">
                          {post.title || 'Пост без названия'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate max-w-xs mt-0.5">
                          {post.postText || post.requestTemplate || 'Без текста'}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-mono font-extrabold text-sky-800 bg-white/90 border border-sky-200 px-2 py-0.5 rounded-lg shadow-2xs">
                          #{post.category || 'общий'}
                        </span>
                      </td>

                      {/* Format */}
                      <td className="py-3.5 px-4">
                        {post.messageFormat === 'rich' ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-lg">
                            <Sparkles size={10} className="text-purple-600" />
                            <span>Rich</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-lg">
                            <Code size={10} className="text-sky-600" />
                            <span>V2</span>
                          </span>
                        )}
                      </td>

                      {/* Channels */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {postChannels.map((ch, idx) => (
                            <span 
                              key={idx}
                              className="text-[9px] font-mono bg-white/90 text-slate-800 border border-pink-200/80 px-1.5 py-0.5 rounded flex items-center space-x-0.5"
                            >
                              <Radio size={8} className="text-orange-500" />
                              <span>{ch}</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-4">
                        {post.triggerSchedule?.enabled ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg">
                            <Clock size={10} className="text-amber-600" />
                            <span>{formatScheduleText(post.triggerSchedule)}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white/80 px-2 py-0.5 rounded-lg border border-pink-200/60">
                            Ручной
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActivePostId(post.id)}
                            className="p-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-lg hover:opacity-90 shadow-2xs cursor-pointer"
                            title="Редактировать"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Удалить пост "${post.title}"?`)) {
                                await onDeleteDayRequest(post.id);
                                if (activePostId === post.id) {
                                  setActivePostId(null);
                                }
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
