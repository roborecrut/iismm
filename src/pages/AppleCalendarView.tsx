import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Download, 
  History as HistoryIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  CalendarDays,
  FileText,
  Filter,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { DayRequest, Publication, Channel, User } from '../types';
import GalleryView from '../components/GalleryView';

interface AppleCalendarViewProps {
  dayRequests: DayRequest[];
  publications: Publication[];
  channels: Channel[];
  currentUser?: User | null;
  handleExportCSV: () => void;
  setActiveTab?: (tab: string) => void;
  onSelectPostForEdit?: (postId: string) => void;
  onDeletePublication?: (id: string) => Promise<void>;
  initialViewMode?: 'calendar' | 'history';
}

export default function AppleCalendarView({
  dayRequests,
  publications,
  channels,
  currentUser = null,
  handleExportCSV,
  setActiveTab,
  onSelectPostForEdit,
  onDeletePublication,
  initialViewMode = 'calendar'
}: AppleCalendarViewProps) {
  // Calendar View Mode: 'calendar' (Apple Grid) or 'history' (Log Table)
  const [viewMode, setViewMode] = useState<'calendar' | 'history'>(initialViewMode);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  // Helper for route push
  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  // Month & Year state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  // Preview Modal state
  const [previewPublication, setPreviewPublication] = useState<Publication | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // History Log Filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyChannelFilter, setHistoryChannelFilter] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNamesRu = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const daysOfWeekRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Convert Sunday-first day index to Monday-first (0 = Monday, 6 = Sunday)
  let startingDayIndex = firstDayOfMonth.getDay() - 1;
  if (startingDayIndex === -1) startingDayIndex = 6;

  const todayDate = new Date();
  const isCurrentMonthToday = todayDate.getFullYear() === year && todayDate.getMonth() === month;

  // Filter history logs for History tab
  const safePublications = Array.isArray(publications) ? publications : [];
  const safeDayRequests = Array.isArray(dayRequests) ? dayRequests : [];
  const safeChannels = Array.isArray(channels) ? channels : [];

  const filteredPublications = safePublications.filter(pub => {
    if (!pub) return false;
    const title = pub.promptTitle || '';
    const text = pub.text || '';
    const msgId = pub.messageId || '';
    const matchesSearch = !historySearch || 
      title.toLowerCase().includes(historySearch.toLowerCase()) ||
      text.toLowerCase().includes(historySearch.toLowerCase()) ||
      msgId.includes(historySearch);

    const matchesChannel = !historyChannelFilter || pub.channel === historyChannelFilter;
    const matchesStatus = historyStatusFilter === 'all' || 
      (historyStatusFilter === 'success' && pub.status) ||
      (historyStatusFilter === 'failed' && !pub.status);

    return matchesSearch && matchesChannel && matchesStatus;
  });

  // Get publications for a specific day in the selected month
  const getPublicationsForDay = (dayNum: number) => {
    return safePublications.filter(p => {
      if (!p || !p.publishedAt) return false;
      const pDate = new Date(p.publishedAt);
      if (isNaN(pDate.getTime())) return false;
      return pDate.getFullYear() === year && pDate.getMonth() === month && pDate.getDate() === dayNum;
    });
  };

  // Scheduled posts representation (spread evenly or according to triggerSchedule)
  const getScheduledForDay = (dayNum: number) => {
    return safeDayRequests.filter(req => req?.triggerSchedule?.enabled);
  };

  const selectedDayPubs = selectedDay ? getPublicationsForDay(selectedDay) : [];
  const selectedDayScheduled = selectedDay ? getScheduledForDay(selectedDay) : [];

  return (
    <div className="space-y-6 text-left">
      {/* Top Bar with Integrated Tabs */}
      <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-2xl p-4 md:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600 flex items-center space-x-2">
            <CalendarDays className="text-pink-500" size={22} />
            <span>{viewMode === 'calendar' ? 'Календарь' : 'История'}</span>
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Публикации, контент-план и хронология активности
          </p>
        </div>

        {/* View Mode Switcher in exact requested order: /calendar, /gallery, /history */}
        <div className="flex items-center bg-white/80 p-1.5 rounded-xl border border-pink-200/80 flex-wrap gap-1.5 shadow-2xs">
          <button
            onClick={() => {
              setViewMode('calendar');
              navigateTo('/calendar');
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-pink-50'
            }`}
          >
            <CalendarDays size={15} />
            <span>Календарь</span>
          </button>

          <button
            onClick={() => navigateTo('/gallery')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-slate-700 hover:text-slate-900 hover:bg-pink-50`}
          >
            <ImageIcon size={15} />
            <span>Галерея</span>
          </button>

          <button
            onClick={() => {
              setViewMode('history');
              navigateTo('/history');
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'history'
                ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-pink-50'
            }`}
          >
            <HistoryIcon size={15} />
            <span>История ({safePublications.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: APPLE CALENDAR GRID */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Apple Month Grid */}
          <div className="lg:col-span-8 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Month Navigation Bar */}
            <div className="flex items-center justify-between border-b border-pink-200/80 pb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-black text-slate-900 tracking-wide">
                  {monthNamesRu[month]} <span className="text-pink-600">{year}</span>
                </h3>
                <button
                  onClick={goToToday}
                  className="text-xs bg-white/90 hover:bg-white text-pink-600 font-extrabold px-3 py-1 rounded-xl border border-pink-200 transition-all cursor-pointer shadow-2xs"
                >
                  Сегодня
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={prevMonth}
                  className="p-2 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl border border-pink-200 transition-colors shadow-2xs cursor-pointer"
                  title="Предыдущий месяц"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl border border-pink-200 transition-colors shadow-2xs cursor-pointer"
                  title="Следующий месяц"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {daysOfWeekRu.map((dayName, i) => (
                <div 
                  key={dayName} 
                  className={`text-xs font-mono font-black py-1 ${
                    i >= 5 ? 'text-pink-600' : 'text-slate-600'
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Monthly Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty leading cells */}
              {Array.from({ length: startingDayIndex }).map((_, index) => (
                <div key={`empty-${index}`} className="h-20 sm:h-24 bg-white/30 border border-pink-100/50 rounded-xl opacity-40" />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: totalDays }).map((_, index) => {
                const dayNum = index + 1;
                const isToday = isCurrentMonthToday && todayDate.getDate() === dayNum;
                const isSelected = selectedDay === dayNum;
                const dayPubs = getPublicationsForDay(dayNum);
                const hasScheduled = dayRequests.some(r => r.triggerSchedule?.enabled);

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`h-20 sm:h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white border-white shadow-md ring-2 ring-pink-400/50'
                        : isToday
                        ? 'bg-white/95 border-2 border-pink-400 shadow-2xs'
                        : 'bg-white/80 border-pink-200/80 hover:border-pink-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-xs font-mono font-black px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-white/30 text-white'
                          : isToday
                          ? 'bg-pink-500 text-white'
                          : 'text-slate-800'
                      }`}>
                        {dayNum}
                      </span>

                      {dayPubs.length > 0 && (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/30 text-white' : 'bg-pink-100 text-pink-700 border border-pink-200'
                        }`}>
                          {dayPubs.length}
                        </span>
                      )}
                    </div>

                    {/* Indicators and post tags inside cell */}
                    <div className="space-y-1 overflow-hidden w-full">
                      {dayPubs.slice(0, 2).map((p) => (
                        <div key={p.id} className={`text-[9px] font-bold px-1 py-0.5 rounded truncate ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-pink-100/80 text-pink-900 border border-pink-200'
                        }`}>
                          {p.promptTitle}
                        </div>
                      ))}
                      {dayPubs.length > 2 && (
                        <div className={`text-[8px] font-mono pl-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          +{dayPubs.length - 2} еще
                        </div>
                      )}
                      {dayPubs.length === 0 && hasScheduled && (
                        <div className={`text-[9px] font-mono truncate flex items-center space-x-1 ${isSelected ? 'text-white/80' : 'text-sky-600 font-bold'}`}>
                          <Clock size={10} />
                          <span>Автопост</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details Inspector Panel */}
          <div className="lg:col-span-4 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-pink-200/80 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Публикации за {selectedDay || '—'} {monthNamesRu[month]} {year} г.
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">Детализация активности выбранного дня</p>
                </div>
                <span className="text-xs font-mono font-extrabold bg-white/90 text-pink-600 border border-pink-200 px-2.5 py-1 rounded-lg">
                  {selectedDayPubs.length} шт.
                </span>
              </div>

              {/* Publication list on selected day */}
              {selectedDayPubs.length === 0 ? (
                <div className="p-8 border border-dashed border-pink-300 rounded-xl text-center space-y-2 bg-white/40">
                  <CalendarDays className="mx-auto text-pink-400" size={28} />
                  <p className="text-xs text-slate-700 font-bold">В этот день не было завершенных публикаций.</p>
                  <p className="text-[10px] text-slate-500 font-medium">Автопосты запустятся по настроенному графику.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {selectedDayPubs.map((pub) => (
                    <div 
                      key={pub.id} 
                      onClick={() => setPreviewPublication(pub)}
                      className="p-3.5 bg-white/90 border border-pink-200/80 hover:border-pink-400 rounded-xl space-y-2 transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="text-xs font-black text-slate-900 group-hover:text-pink-600 transition-colors line-clamp-1">{pub.promptTitle}</h5>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-extrabold shrink-0 ${
                          pub.status ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}>
                          {pub.status ? 'Успешно' : 'Ошибка'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-700 line-clamp-2 font-sans font-medium">{pub.text}</p>

                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1 border-t border-pink-100">
                        <span>{new Date(pub.publishedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-pink-600 font-bold group-hover:underline">{pub.channel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-pink-200/80">
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center space-x-2 bg-white/90 hover:bg-white border border-pink-200 text-slate-800 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
              >
                <Download size={14} className="text-pink-500" />
                <span>Скачать выгрузку публикаций (.CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FULL HISTORY & LOGS TABLE */}
      {viewMode === 'history' && (
        <div className="space-y-6">
          {/* Search, Filter & Controls */}
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-1 w-full max-w-md bg-white/90 border border-pink-200 rounded-xl px-3 py-2 items-center space-x-2 focus-within:ring-2 focus-within:ring-pink-400">
              <Search size={16} className="text-pink-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Поиск по заголовку, тексту или ID сообщения..."
                className="w-full bg-transparent border-none text-xs text-slate-800 focus:outline-none placeholder-slate-400 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center space-x-3">
              {/* Filter by Channel */}
              <select
                value={historyChannelFilter}
                onChange={(e) => setHistoryChannelFilter(e.target.value)}
                className="bg-white/90 border border-pink-200 text-xs text-slate-800 font-medium rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="">Все каналы</option>
                {channels.map(c => (
                  <option key={c.id} value={c.username}>{c.name} ({c.username})</option>
                ))}
              </select>

              {/* Filter by Status */}
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                className="bg-white/90 border border-pink-200 text-xs text-slate-800 font-medium rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="all">Все статусы</option>
                <option value="success">Успешные</option>
                <option value="failed">С ошибкой</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 border border-pink-200 bg-white/90 hover:bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
              >
                <Download size={14} className="text-pink-500" />
                <span>Экспорт CSV</span>
              </button>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/80 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider border-b border-pink-200/80">
                  <tr>
                    <th className="p-4">Дата / Время</th>
                    <th className="p-4">Заголовок Поста</th>
                    <th className="p-4">Канал</th>
                    <th className="p-4">Message ID</th>
                    <th className="p-4">Результат</th>
                    <th className="p-4 text-center">Статус</th>
                    <th className="p-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-200/60">
                  {filteredPublications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-600 text-sm font-bold">
                        Публикации не найдены.
                      </td>
                    </tr>
                  ) : (
                    filteredPublications.map((pub) => (
                      <tr 
                        key={pub.id} 
                        onClick={() => setPreviewPublication(pub)}
                        className="hover:bg-white/90 text-slate-800 transition-colors cursor-pointer"
                      >
                        <td className="p-4 font-mono text-xs whitespace-nowrap font-semibold">
                          {new Date(pub.publishedAt).toLocaleDateString('ru-RU')} в {new Date(pub.publishedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4">
                          <p className="font-black text-slate-900 text-sm hover:text-pink-600 transition-colors">{pub.promptTitle}</p>
                          <p className="text-[11px] text-slate-600 font-sans mt-0.5 line-clamp-1 truncate max-w-md font-medium">{pub.text}</p>
                        </td>
                        <td className="p-4 font-mono text-xs text-sky-600 font-bold whitespace-nowrap">{pub.channel}</td>
                        <td className="p-4 font-mono text-xs whitespace-nowrap font-semibold">{pub.messageId || '—'}</td>
                        <td className="p-4 text-xs text-slate-600 italic max-w-xs truncate" title={pub.response}>
                          {pub.response || 'Опубликовано'}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            pub.status ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}>
                            {pub.status ? 'Успешно' : 'Ошибка'}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {onDeletePublication && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Вы уверены, что хотите удалить эту запись о публикации из базы данных?')) {
                                  await onDeletePublication(pub.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Удалить из истории"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FULL POST PREVIEW MODAL */}
      {previewPublication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-100/50 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative overflow-hidden text-left">
            <div className="flex justify-between items-start border-b border-pink-200/80 pb-4">
              <div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold mb-1.5 ${
                  previewPublication.status 
                    ? 'bg-sky-100 text-sky-700 border border-sky-200' 
                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                }`}>
                  {previewPublication.status ? 'Успешно опубликовано' : 'Ошибка отправки'}
                </span>
                <h3 className="text-lg font-black text-slate-900">{previewPublication.promptTitle}</h3>
                <p className="text-xs text-slate-600 font-mono mt-0.5 font-bold">
                  Канал: <span className="text-pink-600 font-bold">{previewPublication.channel}</span> • Дата: {new Date(previewPublication.publishedAt).toLocaleString('ru-RU')}
                </p>
              </div>
              <button
                onClick={() => setPreviewPublication(null)}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white/80 rounded-xl border border-pink-200 transition-colors cursor-pointer"
              >
                <FileText size={18} />
              </button>
            </div>

            {/* Telegram-style Post Card Preview */}
            <div className="bg-white/90 border border-pink-200/80 rounded-xl p-5 space-y-3 font-sans text-sm text-slate-800 leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre-wrap select-text font-medium">
              {previewPublication.text}
            </div>

            {previewPublication.response && (
              <div className="bg-white/90 p-3 rounded-lg border border-pink-200/80 font-mono text-xs text-slate-700">
                <span className="text-slate-900 font-bold">Ответ сервера: </span>
                {previewPublication.response}
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-pink-200/80">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewPublication.text);
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                }}
                className="px-4 py-2 bg-white/80 hover:bg-white text-slate-800 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer border border-pink-200"
              >
                <span>{copiedText ? '✓ Текст скопирован!' : 'Скопировать текст'}</span>
              </button>

              <div className="flex space-x-2">
                {onDeletePublication && (
                  <button
                    onClick={() => {
                      if (confirm('Удалить эту публикацию из базы данных?')) {
                        onDeletePublication(previewPublication.id);
                        setPreviewPublication(null);
                      }
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                    title="Удалить публикацию"
                  >
                    <Trash2 size={14} />
                    <span>Удалить</span>
                  </button>
                )}
                {onSelectPostForEdit && (
                  <button
                    onClick={() => {
                      onSelectPostForEdit(previewPublication.id);
                      setPreviewPublication(null);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs hover:opacity-95"
                  >
                    Открыть в редакторе
                  </button>
                )}
                <button
                  onClick={() => setPreviewPublication(null)}
                  className="px-4 py-2 bg-white/80 hover:bg-white border border-pink-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
