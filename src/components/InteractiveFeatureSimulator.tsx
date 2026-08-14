import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Send, Calendar, FileText, Check, Image, Brain,
  Cpu, Users, GraduationCap, BookOpen, Layers
} from 'lucide-react';

export interface InteractiveFeatureSimulatorProps {
  type: 'markdown' | 'gallery' | 'grid' | 'rewrite' | 'memory' | 'scenarios' | 'assistants' | 'social' | 'academy' | 'blog' | 'multiposting' | string;
}

export const InteractiveFeatureSimulator: React.FC<InteractiveFeatureSimulatorProps> = ({ type }) => {
  const [step, setStep] = useState(0);

  // Auto cycle steps every 3.2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const renderSimulatorContent = () => {
    switch (type) {
      case 'markdown':
        return (
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-orange-600">
              <span>✍️ Markdown V2 & Rich Конструктор</span>
              <span className="font-mono bg-orange-100 text-orange-800 px-2 py-0.5 rounded">Шаг {step + 1}/3</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="md-0"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 bg-white/90 rounded-xl border border-slate-100 space-y-2"
                >
                  <div className="font-bold text-slate-800">1. Ввод с разметкой Markdown</div>
                  <p className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg leading-relaxed">
                    *Секретный Анонс:* ||Новая функция ИИSMM|| уже доступна!
                  </p>
                  <span className="text-[10px] text-orange-500 font-bold block">Форматирование текста на лету...</span>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="md-1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 bg-white/90 rounded-xl border border-orange-100 space-y-2"
                >
                  <div className="font-bold text-slate-800">2. Добавление Inline-кнопок</div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[10px] font-extrabold rounded-lg shadow-xs">
                      [🔗 Перейти в Telegram]
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border">
                      [🔥 Читать подробнее]
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block">Прикрепление URL-кнопок ко всем каналам</span>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="md-2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 bg-orange-50/40 rounded-xl border border-orange-200 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-pink-500" /> 3. Готовый пост Telegram
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-100 text-[11px] leading-relaxed">
                    <strong>Секретный Анонс:</strong> <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded cursor-pointer">Новая функция ИИSMM</span> уже доступна!
                  </div>
                  <span className="text-[9px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-black block w-fit">
                    ✈️ Отправка в 1 клик через Telegram API
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-sky-600">
              <span>🖼 Галерея & Облачный Хостинг</span>
              <span className="font-mono bg-sky-100 text-sky-800 px-2 py-0.5 rounded">Шаг {step + 1}/3</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="gal-0"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white/90 rounded-xl border border-slate-100 space-y-2 text-center py-4"
                >
                  <Image className="w-6 h-6 text-sky-500 mx-auto animate-bounce" />
                  <div className="font-bold text-slate-800">1. Загрузка фото, GIF или видео</div>
                  <p className="text-[10px] text-slate-500">
                    Перетащите медиафайлы или нажмите "Загрузить"
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="gal-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 space-y-2"
                >
                  <div className="font-bold text-slate-800">2. Бесплатный Облачный Хостинг</div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div className="h-12 bg-sky-200/60 rounded-lg flex items-center justify-center text-[9px] font-bold text-sky-800">HD Photo</div>
                    <div className="h-12 bg-pink-200/60 rounded-lg flex items-center justify-center text-[9px] font-bold text-pink-800">GIF Anim</div>
                    <div className="h-12 bg-orange-200/60 rounded-lg flex items-center justify-center text-[9px] font-bold text-orange-800">4K Video</div>
                  </div>
                  <span className="text-[10px] text-sky-600 font-bold block text-center">Без сжатия качества и с быстрым CDN</span>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="gal-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white rounded-xl border border-sky-200 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Check className="w-4 h-4 text-pink-500" /> 3. Сохранено в Галерее
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Медиафайл мгновенно прикреплен к вашей публикации
                  </p>
                  <span className="text-[9px] bg-pink-50 text-pink-700 border border-pink-100 px-2 py-0.5 rounded font-black block w-fit">
                    Защищенное хранилище ИИSMM
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'grid':
        return (
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-indigo-600">
              <span>📅 Отложенные посты & Календарь</span>
              <span className="font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Шаг {step + 1}/3</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="gr-0"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 bg-white/90 rounded-xl border border-slate-100 space-y-2"
                >
                  <div className="font-bold text-slate-800">1. Выбор времени публикации</div>
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg text-slate-700 font-mono text-[11px]">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>Пятница, 18:30 (Prime-Time)</span>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="gr-1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2"
                >
                  <div className="font-bold text-slate-800">2. Сетка планировщика за месяц</div>
                  <div className="grid grid-cols-4 gap-1 font-mono text-[9px] text-center">
                    <div className="p-1 bg-sky-100 text-sky-800 rounded font-bold">ПН 10:00</div>
                    <div className="p-1 bg-sky-100 text-sky-800 rounded font-bold">СР 14:00</div>
                    <div className="p-1 bg-indigo-200 text-indigo-900 rounded font-bold animate-pulse">ПТ 18:30</div>
                    <div className="p-1 bg-slate-100 text-slate-400 rounded">ВС --:--</div>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold block text-center">Визуальное управление слотами</span>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="gr-2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Check className="w-4 h-4 text-pink-500" /> 3. Авто-публикация запланирована
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Бот отправит пост в Telegram ровно в 18:30 без вашего участия
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'rewrite':
        return (
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-pink-600">
              <span>🎭 ИИ-Генерация & Рерайт</span>
              <span className="font-mono bg-pink-50 text-pink-700 px-2 py-0.5 rounded">Шаг {step + 1}/3</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="rew-0"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white/90 rounded-xl border border-slate-100 space-y-1.5"
                >
                  <span className="text-[10px] font-bold text-slate-400 block">НАЧАЛЬНЫЙ ТЕКСТ ДЛЯ РЕРАЙТА:</span>
                  <p className="bg-slate-50 p-2 rounded-lg text-slate-600 italic">
                    "Мы запустили платформу. Она помогает вести Telegram-каналы по расписанию."
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="rew-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-gradient-to-tr from-pink-50/30 to-orange-50/30 rounded-xl border border-pink-100 space-y-2 text-center py-4"
                >
                  <Sparkles className="w-5 h-5 text-pink-500 mx-auto animate-spin" />
                  <div className="font-bold text-slate-800">ИИSMM переписывает под ИИ стиль...</div>
                  <div className="text-[10px] text-slate-400 font-mono">Добавление вирусных крючков и AIDA...</div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="rew-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-pink-50/20 rounded-xl border border-pink-200 space-y-2"
                >
                  <span className="text-[10px] font-black text-pink-600 block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> ИИ-РЕРАЙТ ГОТОВ:
                  </span>
                  <p className="bg-white p-2.5 rounded-lg text-slate-800 font-semibold border border-pink-100 leading-normal">
                    "🚀 РЕВОЛЮЦИЯ В SMM! Наш комбайн ИИSMM берет на себя автопостинг и генерацию контента. Экономьте до 20 часов в неделю! 🔥"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'memory':
        return (
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-purple-600">
              <span>🧠 Память прошлых постов & Темы</span>
              <span className="font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Шаг {step + 1}/3</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="mem-0"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white/90 rounded-xl border border-slate-100 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <span>Анализ истории канала</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    ИИ изучил последние 50 постов и запомнил главные темы и реакции читателей.
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="mem-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2 text-center py-3"
                >
                  <div className="font-bold text-slate-800">Исключение самоповторов</div>
                  <span className="text-[10px] text-purple-600 font-mono block">
                    Защита от дублей: Тема "Как настроить бота" уже выходила 3 дня назад 🛑
                  </span>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="mem-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white rounded-xl border border-purple-200 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-purple-500" /> Свежая идея с учетом контекста:
                  </div>
                  <p className="p-2 bg-purple-50 text-purple-950 font-bold rounded-lg text-[10px]">
                    "Продолжение вчерашней темы: 5 ошибок при настройке автоматических ИИ-сценариев"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'scenarios':
        return (
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-cyan-600">
              <span>⚙️ ИИ Авто-Сценарии</span>
              <span className="font-mono bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">Шаг {step + 1}/3</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="sc-0"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 bg-white/90 rounded-xl border border-slate-100 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-500" />
                    <span>1. Настройка параметров и расписания</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                    Канал: Telegram • Расписание: ПН, СР, ПТ в 10:00 • Тема: Нейросети & SMM • ИИ стиль: Экспертный
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="sc-1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-100 space-y-2 text-center py-3"
                >
                  <div className="font-bold text-slate-800">2. Авто-Генерация с Markdown V2 и обложкой</div>
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                    ИИ генерирует текст с форматированием, скрытыми спойлерами и подбирает картинку из Галереи
                  </p>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.5 }}
                      className="h-full bg-gradient-to-r from-cyan-400 to-sky-500"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="sc-2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 bg-white rounded-xl border border-cyan-200 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Check className="w-4 h-4 text-pink-500" /> 3. Авто-постановка в Календарь Telegram
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                    Пост запланирован на ПН в 10:00! Бот опубликует его точно в срок с кнопками и медиа без вашего присутствия.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'assistants':
        return (
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-amber-600">
              <span>🤖 20+ Умных ИИ-Ассистентов</span>
              <span className="font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Шаг {step + 1}/3</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="as-0"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white/90 rounded-xl border border-slate-100 space-y-2"
                >
                  <div className="font-bold text-slate-800">1. Выбор специализированного ИИ-Агента</div>
                  <div className="flex gap-1.5">
                    <span className="px-2 py-1 bg-amber-100 text-amber-900 font-extrabold rounded text-[10px]">🔥 Копирайтер AIDA</span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 font-bold rounded text-[10px]">📈 SMM Стратег</span>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="as-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2"
                >
                  <div className="font-bold text-slate-800">2. Диалог с Ассистентом</div>
                  <p className="p-2 bg-white rounded-lg text-[10px] text-slate-700 font-mono">
                    Вы: "Составь продающий оффер для Telegram-канала..."
                  </p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="as-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white rounded-xl border border-amber-200 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Ответ Эксперта
                  </div>
                  <p className="p-2 bg-amber-50 text-amber-950 font-semibold rounded-lg text-[10px]">
                    "Внимание: Готовое решение по формуле AIDA уже сформировано и добавлено в редактор!"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-rose-600">
              <span>🌐 Социальная сеть ИИSMM</span>
              <span className="font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded">Шаг {step + 1}/3</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="soc-0"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white/90 rounded-xl border border-slate-100 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-rose-500" />
                    <span>Публикация в сообщество</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Делитесь кейсами, постами и получайте лайки от SMM-сообщества
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="soc-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2 text-center py-3"
                >
                  <div className="font-bold text-slate-800">ИИ-Модерация 24/7</div>
                  <span className="text-[10px] text-rose-600 font-bold block">
                    Фильтрация спама, мата и нежелательных ссылок
                  </span>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="soc-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white rounded-xl border border-rose-200 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Check className="w-4 h-4 text-pink-500" /> Пост в Топе Ленты!
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Зачислено +10,000 ИИрок за активный вклад в соцсеть
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'academy':
        return (
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-sky-600">
              <span>🎓 ИИ-Академия SMM</span>
              <span className="font-mono bg-sky-100 text-sky-800 px-2 py-0.5 rounded">Шаг {step + 1}/3</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="ac-0"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white/90 rounded-xl border border-slate-100 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-sky-500" />
                    <span>Пошаговые интерактивные уроки</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Урок: "ИИ-Сценарии автопостинга и интеграция Telegram API"
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="ac-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 space-y-2"
                >
                  <div className="font-bold text-slate-800">Вопрос от ИИ-Тьютора</div>
                  <p className="text-[10px] text-slate-600 italic p-1.5 bg-white rounded border">
                    "Какая команда дает боту права на публикацию в Telegram?"
                  </p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="ac-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white rounded-xl border border-sky-200 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Check className="w-4 h-4 text-pink-500" /> Зачет сдан!
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Получен Сертифицированный Сертификат SMM Специалиста
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'blog':
      default:
        return (
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-sky-600">
              <span>📰 Умный Блог с ИИ</span>
              <span className="font-mono bg-sky-100 text-sky-800 px-2 py-0.5 rounded">Шаг {step + 1}/3</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="bl-0"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white/90 rounded-xl border border-slate-100 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-sky-500" />
                    <span>Свежие гайды и кейсы SMM</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Статья: "Как увеличить охваты Telegram-канала в 2.5 раза через ИИ"
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="bl-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 space-y-2 text-center py-3"
                >
                  <div className="font-bold text-slate-800">ИИ-Персонализация Ленты</div>
                  <span className="text-[10px] text-sky-700 font-bold block">
                    Подбор рекомендаций под тематику вашего канала
                  </span>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="bl-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 bg-white rounded-xl border border-sky-200 space-y-2"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-pink-500" /> Рекомендация применена!
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Готовый шаблон поста импортирован напрямую в Редактор
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-white/90 via-white/70 to-slate-50/80 backdrop-blur-xl border border-white/80 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden">
      {renderSimulatorContent()}
    </div>
  );
};
