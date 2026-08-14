import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Play, Pause, Send, Sparkles, 
  Calendar, FileText, Image, Brain, Cpu, Users, GraduationCap, BookOpen, Check
} from 'lucide-react';
import { InteractiveFeatureSimulator } from './InteractiveFeatureSimulator';

interface FeatureItem {
  id: number;
  type: 'markdown' | 'gallery' | 'grid' | 'rewrite' | 'memory' | 'scenarios' | 'assistants' | 'social' | 'academy' | 'blog';
  title: string;
  shortTitle: string;
  badge: string;
  badgeTheme: string;
  badgeColor: string;
  desc: string;
  bullets: string[];
  gradient: string;
  shadowGlow: string;
}

export default function FeaturesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const features: FeatureItem[] = [
    {
      id: 1,
      type: 'markdown',
      title: '1. Конструктор постов Markdown V2 & Rich для Telegram',
      shortTitle: 'Markdown V2 & Rich',
      badge: 'Бесплатно',
      badgeTheme: 'border-orange-200/50 text-orange-950 bg-orange-100/50',
      badgeColor: 'text-orange-500',
      desc: 'Создавайте идеально оформленные посты для Telegram с поддержкой спойлеров, жирного и курсивного шрифта, ссылок, заголовочных стилей и интерактивных кнопок бесплатно на удобном визуальном конструкторе.',
      bullets: [
        'Поддержка Markdown V2 & Rich разметки',
        'Интерактивные Inline-кнопки под постом',
        'Скрытые спойлеры и форматирование',
        '100% бесплатно на визуальном конструкторе'
      ],
      gradient: 'from-orange-500/10 via-pink-500/5 to-transparent',
      shadowGlow: 'hover:shadow-[0_20px_50px_rgba(251,146,60,0.12)]'
    },
    {
      id: 2,
      type: 'gallery',
      title: '2. Загрузка любых медиафайлов & Бесплатный хостинг в галерее',
      shortTitle: 'Галерея & Хостинг',
      badge: 'Медиа',
      badgeTheme: 'border-sky-200/50 text-sky-800 bg-sky-100/50',
      badgeColor: 'text-sky-500',
      desc: 'Прикрепите к посту любые изображения, GIF-анимации, короткие видеоролики или аудиофайлы. Мы предоставляем быстрый бесплатный облачный хостинг медиагалереи с сохранением качества.',
      bullets: [
        'Загрузка любых фото, видео и GIF',
        'Бесплатное облачное хранилище медиа',
        'Сохранение исходного качества',
        'Мгновенная привязка к публикациям'
      ],
      gradient: 'from-sky-500/10 via-pink-500/5 to-transparent',
      shadowGlow: 'hover:shadow-[0_20px_50px_rgba(56,189,248,0.12)]'
    },
    {
      id: 3,
      type: 'grid',
      title: '3. Отложенные посты по расписанию с удобным календарем',
      shortTitle: 'Умный Календарь',
      badge: 'Планировщик',
      badgeTheme: 'border-indigo-200/50 text-indigo-800 bg-indigo-100/50',
      badgeColor: 'text-indigo-500',
      desc: 'Формируйте контент-план на неделю или месяц вперед. Наглядный интерактивный календарь подсвечивает слоты выхода постов и отправляет их в Telegram точно в назначенную минуту.',
      bullets: [
        'Наглядная сетка постов за месяц',
        'Точная публикация минута в минуту',
        'Удобное перетаскивание и правки',
        'Автоматический режим выходов 24/7'
      ],
      gradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
      shadowGlow: 'hover:shadow-[0_20px_50px_rgba(99,102,241,0.12)]'
    },
    {
      id: 4,
      type: 'rewrite',
      title: '4. Генерация постов через ИИ & Рерайт под нужный стиль',
      shortTitle: 'ИИ-Генерация & Рерайт',
      badge: 'Нейросеть',
      badgeTheme: 'border-pink-200/50 text-pink-700 bg-pink-100/50',
      badgeColor: 'text-pink-500',
      desc: 'Пишите вовлекающие посты с нуля или мгновенно адаптируйте исходные материалы под фирменный стиль (ИИ стиль) вашего канала за пару секунд с помощью мощного нейро-копирайтера.',
      bullets: [
        'Генерация оригинальных постов с нуля',
        'Стилистический рерайт под ИИ стиль',
        'Умный подбор вирусных заголовков',
        'Повышение охватов и кликабельности'
      ],
      gradient: 'from-pink-500/10 via-orange-500/5 to-transparent',
      shadowGlow: 'hover:shadow-[0_20px_50px_rgba(244,63,94,0.12)]'
    },
    {
      id: 5,
      type: 'memory',
      title: '5. Память прошлых постов & Создание новых тем с учетом памяти',
      shortTitle: 'Память & Темы',
      badge: 'Контекст ИИ',
      badgeTheme: 'border-purple-200/50 text-purple-800 bg-purple-100/50',
      badgeColor: 'text-purple-500',
      desc: 'Наша нейросеть помнит предыдущие публикации канала, что исключает дублирование и позволяет автоматически предлагать свежие логические темы, продолжающие историю вашего бренда.',
      bullets: [
        'Глубокий анализ истории публикаций',
        'Исключение повторов и клише',
        'Генерация серийных тем и рубрик',
        'Сохранение единой концепции канала'
      ],
      gradient: 'from-purple-500/10 via-pink-500/5 to-transparent',
      shadowGlow: 'hover:shadow-[0_20px_50px_rgba(168,85,247,0.12)]'
    },
    {
      id: 6,
      type: 'scenarios',
      title: '6. Настраиваемые ИИ-сценарии для отложенных постов на автомате',
      shortTitle: 'ИИ Авто-Сценарии',
      badge: 'Автопилот',
      badgeTheme: 'border-cyan-200/50 text-cyan-800 bg-cyan-100/50',
      badgeColor: 'text-cyan-500',
      desc: 'Конфигурируйте гибкие цепочки: выбор темы ➔ написание текста ➔ подбор обложки ➔ постановка в отложенный календарь без вашего постоянного присутствия.',
      bullets: [
        'Конструктор регулярных генераций',
        'Авто-выбор тем по расписанию',
        'Генерация текста и обложек',
        'Автономное ведение ленты 24/7'
      ],
      gradient: 'from-cyan-500/10 via-sky-500/5 to-transparent',
      shadowGlow: 'hover:shadow-[0_20px_50px_rgba(6,182,212,0.12)]'
    },
    {
      id: 7,
      type: 'assistants',
      title: '7. Умные ИИ-ассистенты для помощи в написании постов',
      shortTitle: 'Умные ИИ-Ассистенты',
      badge: '20+ Агентов',
      badgeTheme: 'border-amber-200/50 text-amber-800 bg-amber-100/50',
      badgeColor: 'text-amber-500',
      desc: 'В вашем распоряжении более 20 узкоспециализированных ИИ-ассистентов: Копирайтер AIDA, Редактор офферов, Генератор идей, Специалист по заголовкам и Корректор грамматики.',
      bullets: [
        '20+ профильных узких нейро-агентов',
        'Поддержка популярных формул SMM',
        'Удобный интерактивный диалог',
        'Готовые проверенные промпты'
      ],
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      shadowGlow: 'hover:shadow-[0_20px_50px_rgba(245,158,11,0.12)]'
    },
    {
      id: 8,
      type: 'social',
      title: '8. Социальная сеть ИИSMM с модерацией чатов и постов',
      shortTitle: 'Социальная Сеть',
      badge: 'Сообщество',
      badgeTheme: 'border-rose-200/50 text-rose-800 bg-rose-100/50',
      badgeColor: 'text-rose-500',
      desc: 'Общайтесь с коллегами, публикуйте материалы в общую ленту, обменивайтесь опытом. Автоматическая модерация чатов и постов защищает сообщество от спама и негатива.',
      bullets: [
        'Общая лента публикаций SMM-специалистов',
        'Автоматическая ИИ-модерация чатов',
        'Начисление внутренней валюты (ИИрок)',
        'Полезное профессиональное комьюнити'
      ],
      gradient: 'from-rose-500/10 via-pink-500/5 to-transparent',
      shadowGlow: 'hover:shadow-[0_20px_50px_rgba(244,63,94,0.12)]'
    },
    {
      id: 9,
      type: 'academy',
      title: '9. ИИ-Академия, где нейросеть поможет изучить процессы настройки',
      shortTitle: 'ИИ-Академия SMM',
      badge: 'Обучение',
      badgeTheme: 'border-sky-200/50 text-sky-800 bg-sky-100/50',
      badgeColor: 'text-sky-500',
      desc: 'Проходите пошаговые уроки по автопостингу, работе с Telegram API и копирайтингу. Интерактивный ИИ-Тьютор ответит на любой вопрос и проверит знания на тестах.',
      bullets: [
        'Пошаговые видео-уроки и гайды',
        'Персональный ИИ-Тьютор для консультаций',
        'Квизы с наградами в ИИрках',
        'Выдача сертифицированных дипломов'
      ],
      gradient: 'from-sky-500/10 via-pink-500/5 to-transparent',
      shadowGlow: 'hover:shadow-[0_20px_50px_rgba(56,189,248,0.12)]'
    },
    {
      id: 10,
      type: 'blog',
      title: '10. Умный Блог с ИИ-рекомендациями',
      shortTitle: 'Умный Блог',
      badge: 'Знания',
      badgeTheme: 'border-pink-200/50 text-pink-800 bg-pink-100/50',
      badgeColor: 'text-pink-500',
      desc: 'Читайте свежие аналитические статьи, тренды и кейсы по развитию Telegram-каналов. Нейросеть рекомендует материалы и готовые шаблоны именно под тему вашего проекта.',
      bullets: [
        'Актуальные статьи и разборы кейсов',
        'Персональные рекомендации нейросети',
        'Готовые шаблоны и чек-листы',
        'Еженедельные обновления материала'
      ],
      gradient: 'from-pink-500/10 via-orange-500/5 to-transparent',
      shadowGlow: 'hover:shadow-[0_20px_50px_rgba(236,72,153,0.12)]'
    }
  ];

  // Auto-play control loop with dynamic progress bar
  useEffect(() => {
    let intervalId: number;
    const AUTO_PLAY_DURATION = 14000; // 14 seconds per slide
    const PROGRESS_STEP_MS = 40;

    if (isPlaying) {
      const startTime = Date.now();
      intervalId = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min((elapsed / AUTO_PLAY_DURATION) * 100, 100);
        setProgress(pct);
        
        if (pct >= 100) {
          setSlideDirection('right');
          setActiveIndex((prev) => (prev + 1) % features.length);
          setProgress(0);
        }
      }, PROGRESS_STEP_MS);
    } else {
      setProgress(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, activeIndex, features.length]);

  const handleNext = () => {
    setSlideDirection('right');
    setActiveIndex((prev) => (prev + 1) % features.length);
  };

  const handlePrev = () => {
    setSlideDirection('left');
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const currentFeature = features[activeIndex];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-6">
      
      {/* Dynamic Progress indicator bar across all 10 features */}
      <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden relative shadow-inner">
        <motion.div 
          className="h-full bg-gradient-to-r from-orange-400 via-pink-500 to-sky-450"
          style={{ width: `${((activeIndex + 1) / features.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Top Controls: 10 Navigation Pills in 2 rows of 5 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pb-2">
        {features.map((feat, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={feat.id}
              onClick={() => {
                setSlideDirection(idx > activeIndex ? 'right' : 'left');
                setActiveIndex(idx);
              }}
              className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border text-center ${
                isActive 
                  ? 'bg-gradient-to-r from-orange-400 via-pink-500 to-sky-450 text-white border-white/40 shadow-md scale-102' 
                  : 'bg-white/60 hover:bg-white text-slate-600 border-slate-200/60'
              }`}
            >
              {feat.shortTitle}
            </button>
          );
        })}
      </div>

      {/* Main Slide Card Container */}
      <div className="relative overflow-hidden apple-liquid-glass rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFeature.id}
            initial={{ opacity: 0, x: slideDirection === 'right' ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDirection === 'right' ? -50 : 50 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
          >
            {/* Left Description Column */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${currentFeature.badgeTheme}`}>
                  {currentFeature.badge}
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  Возможность {activeIndex + 1} из 10
                </span>
              </div>

              <h3 
                className="text-xl sm:text-2xl font-black leading-snug text-transparent bg-clip-text"
                style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {currentFeature.title}
              </h3>

              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                {currentFeature.desc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {currentFeature.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-2 bg-white/70 p-2 rounded-xl border border-slate-100 text-xs font-bold text-slate-700">
                    <Check className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Interactive Simulator Column */}
            <div className="lg:col-span-5 w-full">
              <InteractiveFeatureSimulator type={currentFeature.type} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Carousel Controls: Prev / Play-Pause / Next */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 mt-6">
          <button
            onClick={handlePrev}
            className="px-4 py-2.5 bg-multicolor-gradient text-white rounded-2xl shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
            <ChevronLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-5 py-2.5 bg-multicolor-gradient text-white text-xs font-black rounded-2xl shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 uppercase tracking-wider relative overflow-hidden group"
          >
            {/* Animated orange fill overlay during autoplay progress */}
            {isPlaying && (
              <div 
                className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-90 transition-all duration-75 ease-linear pointer-events-none"
                style={{ width: `${progress}%` }}
              />
            )}
            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
            <span className="relative z-10 flex items-center gap-2">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Пауза' : 'Запустить автотур'}</span>
            </span>
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2.5 bg-multicolor-gradient text-white rounded-2xl shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
            <span>Вперед</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
