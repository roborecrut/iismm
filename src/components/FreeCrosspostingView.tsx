import React, { useState } from 'react';
import { 
  Share2, 
  Send, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  HelpCircle, 
  Layers, 
  Bot, 
  Radio, 
  Zap, 
  ArrowRight,
  RefreshCw,
  ChevronRight,
  Globe,
  Sliders,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Channel } from '../types';

interface FreeCrosspostingViewProps {
  channels?: Channel[];
  currentUser?: any;
}

export default function FreeCrosspostingView({ channels = [], currentUser }: FreeCrosspostingViewProps) {
  const [activeSection, setActiveSection] = useState<'all' | 'dzen' | 'setka'>('all');
  const [copiedBot, setCopiedBot] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>(channels[0]?.username || '');
  const [showFaq, setShowFaq] = useState(false);

  const handleCopy = (text: string, botId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBot(botId);
    setTimeout(() => setCopiedBot(null), 2500);
  };

  const getCleanUsername = (uname: string) => {
    return uname.replace('@', '').trim();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-md border border-pink-200/80 rounded-3xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/90 border border-pink-200/80 rounded-xl text-xs font-bold text-pink-600 shadow-2xs">
                Бесплатные интеграции
              </span>
              <span className="px-3 py-1 bg-white/90 border border-orange-200/80 rounded-xl text-xs font-bold text-orange-600 shadow-2xs">
                Официальные боты
              </span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-800">
              Официальный кросспостинг в Дзен и Сетку
            </h3>
            <p className="text-sm text-slate-700 font-medium leading-relaxed max-w-3xl">
              Платформы Дзен и Сетка предоставляют собственных бесплатных ботов для мгновенной синхронизации ваших Telegram-каналов. 
              Сервис ИИSMM не берет никакой комиссии за использование данных инструментов — здесь собрана подробная инструкция и быстрый доступ к подключению.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-3.5 py-2 rounded-2xl text-sm font-bold transition-all cursor-pointer border shadow-2xs ${
                activeSection === 'all'
                  ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white border-white/40'
                  : 'bg-white/90 text-slate-700 border-pink-200/80 hover:bg-white'
              }`}
            >
              Все направления (2)
            </button>
            <button
              onClick={() => setActiveSection('dzen')}
              className={`px-3.5 py-2 rounded-2xl text-sm font-bold transition-all cursor-pointer border shadow-2xs ${
                activeSection === 'dzen'
                  ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white border-white/40'
                  : 'bg-white/90 text-slate-700 border-pink-200/80 hover:bg-white'
              }`}
            >
              Телеграм → Дзен
            </button>
            <button
              onClick={() => setActiveSection('setka')}
              className={`px-3.5 py-2 rounded-2xl text-sm font-bold transition-all cursor-pointer border shadow-2xs ${
                activeSection === 'setka'
                  ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white border-white/40'
                  : 'bg-white/90 text-slate-700 border-pink-200/80 hover:bg-white'
              }`}
            >
              Телеграм → Сетка
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid with Two Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 1: TELEGRAM -> DZEN */}
        {(activeSection === 'all' || activeSection === 'dzen') && (
          <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-md border border-pink-200/80 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Header block */}
              <div className="flex items-start justify-between gap-3 border-b border-pink-200/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/90 border border-pink-200 flex items-center justify-center text-xl shadow-2xs shrink-0">
                    ☯️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        Телеграм → Дзен
                      </h4>
                      <span className="px-2 py-0.5 rounded-lg bg-white/80 border border-orange-200 text-[11px] font-bold text-orange-600">
                        0 ₽ / навсегда
                      </span>
                    </div>
                    <p className="text-xs text-pink-700 font-semibold mt-0.5">
                      Синхробот Дзена • @zen_sync_bot
                    </p>
                  </div>
                </div>

                <a
                  href="https://t.me/zen_sync_bot"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-bold transition-all shadow-2xs shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>В Telegram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Description */}
              <div className="bg-white/80 border border-pink-200/80 rounded-2xl p-4 space-y-2">
                <h5 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>Что такое «Синхробот Дзена»?</span>
                </h5>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Официальный бот от команды платформы Дзен. Он автоматически транслирует новые посты из вашего Telegram-канала прямо в блог на Дзене, превращая их в статьи или короткие посты с медиафайлами.
                </p>
              </div>

              {/* Key Features */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Возможности и особенности:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/70 border border-pink-100 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>Авто или ручной режим</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Публикуйте автоматически сразу или отправляйте боту избранные посты вручную.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 border border-pink-100 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>Обложка и заголовок</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Первое предложение становится заголовком (до 140 симв.), а фото — обложкой.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 border border-pink-100 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>Поддержка медиа до 20 МБ</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Картинки, видео и альбомы бережно переносятся в ваш канал Дзена.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 border border-pink-100 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>UTM-метки и аналитика</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Полная совместимость со встроенной статистикой Дзена.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step-by-step Setup Guide */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Пошаговая инструкция по подключению:
                </h5>
                <div className="space-y-2">
                  {[
                    { step: '1', title: 'Получите код в Дзене', desc: 'В студии Дзена перейдите в Настройки → Телеграм-бот (Кросспостинг) и скопируйте секретный код.' },
                    { step: '2', title: 'Запустите бота @zen_sync_bot', desc: 'Откройте чат с ботом в Telegram, нажмите «Старт» и отправьте скопированный код.' },
                    { step: '3', title: 'Инициируйте привязку', desc: 'Отправьте команду /sync боту в чате.' },
                    { step: '4', title: 'Сделайте бота админом канала', desc: 'Добавьте @zen_sync_bot в администраторы вашего публичного Telegram-канала.' },
                    { step: '5', title: 'Отправьте ссылку на канал', desc: 'Пришлите боту публичную ссылку на канал (например, https://t.me/your_channel) и выберите режим постинга.' }
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/80 border border-pink-100 text-xs">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                        {s.step}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{s.title}</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions / Quick Links */}
            <div className="pt-3 border-t border-pink-200/70 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://t.me/zen_sync_bot"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-bold transition-all shadow-2xs"
                >
                  <Bot className="w-4 h-4" />
                  <span>Запустить @zen_sync_bot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleCopy('@zen_sync_bot', 'zen')}
                  className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 border border-pink-200 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                >
                  {copiedBot === 'zen' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-orange-600">Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Скопировать юзернейм</span>
                    </>
                  )}
                </button>
              </div>

              <a
                href="https://t.me/zen_sync_bot?startchannel=true"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/70 hover:bg-white text-pink-700 border border-pink-200 text-[11px] font-bold transition-all"
              >
                <span>➕ Быстро добавить @zen_sync_bot в администраторы канала</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* SECTION 2: TELEGRAM -> SETKA */}
        {(activeSection === 'all' || activeSection === 'setka') && (
          <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-md border border-pink-200/80 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Header block */}
              <div className="flex items-start justify-between gap-3 border-b border-pink-200/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/90 border border-pink-200 flex items-center justify-center text-xl shadow-2xs shrink-0">
                    🕸️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        Телеграм → Сетка
                      </h4>
                      <span className="px-2 py-0.5 rounded-lg bg-white/80 border border-pink-200 text-[11px] font-bold text-pink-600">
                        0 ₽ / навсегда
                      </span>
                    </div>
                    <p className="text-xs text-pink-700 font-semibold mt-0.5">
                      Телепорт в Сетку • @teleport_by_setka_bot
                    </p>
                  </div>
                </div>

                <a
                  href="https://t.me/teleport_by_setka_bot"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-bold transition-all shadow-2xs shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>В Telegram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Description */}
              <div className="bg-white/80 border border-pink-200/80 rounded-2xl p-4 space-y-2">
                <h5 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span>Что такое «Телепорт в Сетку»?</span>
                </h5>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Официальный сервис автопостинга для профессиональной деловой социальной сети «Сетка» (Setka). Позволяет авторам Telegram транслировать экспертные мысли, кейсы и статьи на новую технологическую аудиторию.
                </p>
              </div>

              {/* Key Features */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Возможности и особенности:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/70 border border-pink-100 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                      <span>IT и бизнес-аудитория</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Привлечение профессионалов, разработчиков, дизайнеров и маркетологов.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 border border-pink-100 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                      <span>Синхронизация медиа</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Текстовые посты, форматирование, ссылки и иллюстрации сохраняются при переносе.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 border border-pink-100 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                      <span>Гибкие настройки</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Возможность кросспостить весь канал или только отдельные избранные заметки.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 border border-pink-100 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                      <span>Официальная безопасность</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Прямая авторизация через личный профиль Сетки без передачи паролей.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step-by-step Setup Guide */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Пошаговая инструкция по подключению:
                </h5>
                <div className="space-y-2">
                  {[
                    { step: '1', title: 'Авторизуйтесь в Сетке', desc: 'Убедитесь, что у вас есть активный аккаунт в приложении или веб-версии Сетки.' },
                    { step: '2', title: 'Откройте бота @teleport_by_setka_bot', desc: 'Запустите бота в Telegram нажатием кнопки «Старт» (/start).' },
                    { step: '3', title: 'Свяжите аккаунты', desc: 'Перейдите по ссылке авторизации от бота и подтвердите привязку Telegram-аккаунта к Сетке.' },
                    { step: '4', title: 'Сделайте бота админом', desc: 'Добавьте @teleport_by_setka_bot в администраторы Telegram-канала с правами публикации.' },
                    { step: '5', title: 'Завершите настройку', desc: 'Отправьте боту адрес вашего публичного канала и начните публикацию контента.' }
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/80 border border-pink-100 text-xs">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                        {s.step}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{s.title}</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions / Quick Links */}
            <div className="pt-3 border-t border-pink-200/70 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://t.me/teleport_by_setka_bot"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white text-xs font-bold transition-all shadow-2xs"
                >
                  <Bot className="w-4 h-4" />
                  <span>Запустить @teleport_by_setka_bot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleCopy('@teleport_by_setka_bot', 'setka')}
                  className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 border border-pink-200 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                >
                  {copiedBot === 'setka' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-pink-500" />
                      <span className="text-pink-600">Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Скопировать юзернейм</span>
                    </>
                  )}
                </button>
              </div>

              <a
                href="https://t.me/teleport_by_setka_bot?startchannel=true"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/70 hover:bg-white text-pink-700 border border-pink-200 text-[11px] font-bold transition-all"
              >
                <span>➕ Быстро добавить @teleport_by_setka_bot в администраторы канала</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

      </div>

      {/* Helpful Tips & Channels Selector */}
      <div className="bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-md border border-pink-200/80 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-200/70 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-orange-500" />
            <h4 className="text-sm font-bold text-slate-800">
              Ваши подключенные каналы ({channels.length})
            </h4>
          </div>
          <span className="text-xs text-slate-600 font-medium">
            Выберите канал для быстрой генерации ссылок на привязку
          </span>
        </div>

        {channels.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            {channels.map((ch) => (
              <div 
                key={ch.id} 
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/80 border border-pink-200 text-xs font-semibold text-slate-800 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="font-bold">{ch.name || ch.username}</span>
                <span className="text-pink-600 font-mono text-[11px]">{ch.username}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600">
            У вас пока нет добавленных каналов в базе данных. Добавьте ваш канал в разделе «Каналы», чтобы удобно управлять автопостингом.
          </p>
        )}

        <div className="p-3.5 rounded-2xl bg-white/70 border border-pink-100 text-xs text-slate-700 space-y-1.5">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Важно знать перед подключением:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed pl-1">
            <li>Ваш Telegram-канал должен быть публичным со ссылкой вида <code className="font-mono bg-white px-1 rounded">t.me/channel</code>.</li>
            <li>Репосты из чужих каналов официальными ботами не пересылаются для защиты от спама.</li>
            <li>Отредактированные задним числом посты в Telegram не перезаписываются на внешних платформах автоматически.</li>
            <li>Чтобы отключить синхронизацию в любой момент, достаточно удалить бота из списка администраторов канала.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
