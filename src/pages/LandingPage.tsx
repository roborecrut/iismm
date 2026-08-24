import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Play, Pause, ShieldCheck, Mail, MessageSquare, AlertTriangle, Lightbulb, 
  Smartphone, BookOpen, GraduationCap, Brush, Repeat, Trophy, ExternalLink, 
  ChevronRight, ChevronLeft, Calendar, Layers, Image as ImageIcon, Check, Heart, Users, BarChart3, Radio, FileText, Send, HelpCircle, ArrowRight, RefreshCw, Star, ShoppingBag, Info, X, Menu
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useVelocity, useSpring } from 'motion/react';
import { UserAccount } from '../types';
import ShinyLogo from '../components/ShinyLogo';
import LiquidGlassBackground from '../components/LiquidGlassBackground';
import { InteractiveFeatureSimulator } from '../components/InteractiveFeatureSimulator';
import { PlatformNetworkCloud } from '../components/PlatformNetworkCloud';
import { BetweenFeaturesDecoration } from '../components/BetweenFeaturesDecoration';
import IntroLiveSimWidget from '../components/IntroLiveSimWidget';
import FeaturesCarousel from '../components/FeaturesCarousel';
import OfertaPage from './OfertaPage';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import AIEnginesMarketplace from '../components/AIEnginesMarketplace';
import TariffCards from '../components/TariffCards';

const STOCK_AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150", // Alexander
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150", // Maria
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150", // Semen
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150", // Anna
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150"  // Dmitry
];

const roleForIdx = (idx: number) => {
  const roles = [
    "Основатель SMM Sages",
    "Инфлюенсер & Блогер",
    "TG Креатор @semen_smm",
    "Продюсер Академии ИИ",
    "Fullstack Разработчик"
  ];
  return roles[idx % roles.length];
};

// Sub-component for typing/typewriting animation inside reviews
function TypewrittenQuote({ text, isActive }: { text: string; isActive: boolean }) {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    if (!isActive) {
      setDisplayed(text);
      return;
    }
    
    setDisplayed("");
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, 12); // Fast typing feels high-fidelity
    
    return () => clearInterval(interval);
  }, [text, isActive]);

  return <span>{displayed}</span>;
}

// Sub-component for sequential filling stars rating on active turn
function ActionStars({ rating, isActive }: { rating: number; isActive: boolean }) {
  const [filledCount, setFilledCount] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setFilledCount(rating);
      return;
    }

    setFilledCount(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setFilledCount(current);
      if (current >= rating) {
        clearInterval(interval);
      }
    }, 120); // fill star by star sequentially

    return () => clearInterval(interval);
  }, [rating, isActive]);

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, rIdx) => {
        const isFilled = rIdx < filledCount;
        return (
          <motion.div
            key={rIdx}
            animate={isFilled && isActive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Star 
              className={`w-3.5 h-3.5 shrink-0 transition-colors duration-300 ${
                isFilled 
                  ? 'text-orange-400 fill-orange-400' 
                  : 'text-slate-200 fill-slate-100'
              }`} 
            />
          </motion.div>
        );
      })}
    </div>
  );
}

// 3D Carousel component for reviews with responsive orbit radius and autoplay progress controls
function Reviews3DCarousel({
  reviews,
  onAddReviewClick
}: {
  reviews: any[];
  onAddReviewClick: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const [radius, setRadius] = useState(420);
  const [isMobile, setIsMobile] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 480);
      if (w < 485) {
        setRadius(180);
      } else if (w < 768) {
        setRadius(260);
      } else if (w < 1024) {
        setRadius(340);
      } else {
        setRadius(420);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let intervalId: number;
    const AUTO_PLAY_DURATION = 10000; // 10 seconds per review slider
    const PROGRESS_STEP_MS = 40; // update progress every 40ms

    if (isPlaying && reviews.length > 1) {
      const startTime = Date.now();
      intervalId = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min((elapsed / AUTO_PLAY_DURATION) * 100, 100);
        setProgress(pct);
        
        if (pct >= 100) {
          setActiveIndex((prev) => (prev + 1) % reviews.length);
          setProgress(0);
        }
      }, PROGRESS_STEP_MS);
    } else {
      setProgress(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, activeIndex, reviews.length]);

  const handleNext = () => {
    if (reviews.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    if (reviews.length === 0) return;
    setActiveIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const swipeStartX = useRef<number | null>(null);
  const swipeEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeEndX.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    swipeEndX.current = e.touches[0].clientX;
    if (swipeStartX.current !== null) {
      setDragOffset(e.touches[0].clientX - swipeStartX.current);
    }
  };

  const handleTouchEnd = () => {
    if (swipeStartX.current === null || swipeEndX.current === null) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    const diff = swipeStartX.current - swipeEndX.current;
    const minDistance = 50; // in pixels
    if (diff > minDistance) {
      handleNext();
    } else if (diff < -minDistance) {
      handlePrev();
    }
    swipeStartX.current = null;
    swipeEndX.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    swipeStartX.current = e.clientX;
    swipeEndX.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (swipeStartX.current !== null) {
      swipeEndX.current = e.clientX;
      setDragOffset(e.clientX - swipeStartX.current);
    }
  };

  const handleMouseUp = () => {
    if (swipeStartX.current === null || swipeEndX.current === null) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    const diff = swipeStartX.current - swipeEndX.current;
    const minDistance = 50; // in pixels
    if (diff > minDistance) {
      handleNext();
    } else if (diff < -minDistance) {
      handlePrev();
    }
    swipeStartX.current = null;
    swipeEndX.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  const angleStep = 360 / Math.max(reviews.length, 1);

  return (
    <div 
      className="relative w-full py-8 select-none overflow-visible flex flex-col items-center group/global3d cursor-grab active:cursor-grabbing"
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Floating Left Navigation button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        className="absolute -left-1 xs:left-0 sm:left-[3%] lg:left-[8%] xl:left-[12%] top-[140px] z-40 w-11 h-11 rounded-full bg-white/95 border border-slate-200 text-slate-700 hover:text-pink-650 hover:scale-110 active:scale-95 transition-all shadow-md flex items-center justify-center cursor-pointer select-none"
        aria-label="Назад"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Floating Right Navigation button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="absolute -right-1 xs:right-0 sm:right-[3%] lg:right-[8%] xl:right-[12%] top-[140px] z-40 w-11 h-11 rounded-full bg-white/95 border border-slate-200 text-slate-700 hover:text-pink-650 hover:scale-110 active:scale-95 transition-all shadow-md flex items-center justify-center cursor-pointer select-none"
        aria-label="Вперед"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* 3D stage viewport wrapper */}
      <div 
        className="relative overflow-visible flex items-center justify-center w-[270px] sm:w-[325px] h-[310px]" 
        style={{ perspective: '1600px' }}
      >
        <div 
          className="absolute inset-0 transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: `translateZ(-${radius}px) rotateY(${-activeIndex * angleStep}deg)`,
            width: '100%',
            height: '100%',
          }}
        >
          {reviews.map((rev, idx) => {
            const isActive = idx === activeIndex;
            const angle = idx * angleStep;
            const diff = Math.min(
              Math.abs(idx - activeIndex),
              reviews.length - Math.abs(idx - activeIndex)
            );

            let cardOpacity = 0;
            let scaleVal = 0.82;
            let pointerEventsStyle: 'auto' | 'none' = 'none';

            if (diff === 0) {
              cardOpacity = 1;
              scaleVal = 1.0;
              pointerEventsStyle = 'auto';
            } else if (diff === 1 || reviews.length === 2) {
              cardOpacity = isMobile ? 0.15 : 0.40;
              scaleVal = isMobile ? 0.65 : 0.85;
              pointerEventsStyle = 'auto';
            } else if (diff === 2) {
              cardOpacity = 0.05;
              scaleVal = 0.72;
            }

            const dragX = isActive ? dragOffset * 0.5 : 0;
            const dragRotate = isActive ? dragOffset * 0.02 : 0;
            const transitionStyle = (isActive && isDragging)
              ? 'opacity 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease'
              : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease';

            const handleCardClick = (e: React.MouseEvent) => {
              if (isActive) {
                // Do nothing
              } else if (diff === 1 || reviews.length === 2) {
                e.stopPropagation();
                setActiveIndex(idx);
              }
            };

            return (
              <div
                key={idx}
                onClick={handleCardClick}
                className="absolute inset-0 w-full h-[2700px] bg-transparent overflow-visible cursor-pointer select-none"
                style={{
                  transform: `rotateY(${angle}deg) translateZ(${isActive ? radius : radius - 140}px) scale(${scaleVal}) translateX(${dragX}px) rotate(${dragRotate}deg)`,
                  backfaceVisibility: 'hidden',
                  opacity: cardOpacity,
                  visibility: diff > 1 ? 'hidden' : 'visible',
                  pointerEvents: pointerEventsStyle,
                  zIndex: isActive ? 41 : (diff === 1 ? 21 : 11),
                  transition: transitionStyle,
                  height: '270px'
                }}
              >
                {/* blockquote for snip1157 design with top-aligned rating stars and text */}
                <blockquote className="block rounded-2xl relative bg-[#fafafa] p-6 pt-5 pb-5 text-[10.5px] font-medium leading-[1.6em] italic text-[#333] h-[178px] border border-slate-200/50 shadow-xs flex flex-col justify-start overflow-hidden">
                  {/* Left big quote mark */}
                  <span className="absolute left-3 top-2 text-[42px] leading-none opacity-20 text-[#333] font-serif select-none" style={{ fontFamily: 'Georgia, serif' }}>“</span>
                  
                  {/* Rating Stars and Play/Pause control for autoplay progress sync */}
                  <div className="flex justify-between items-center mb-1.5 w-full select-none relative z-10 shrink-0">
                    <ActionStars rating={rev.rating || 5} isActive={isActive} />
                    
                    {isActive ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPlaying(!isPlaying);
                        }}
                        className="relative overflow-hidden px-2.5 py-1 bg-gradient-to-r from-sky-400 to-pink-500 border border-white/20 rounded-full text-[8px] font-black uppercase tracking-wider text-white shadow-sm cursor-pointer hover:scale-102 active:scale-98 transition-all pointer-events-auto select-none"
                      >
                        {isPlaying && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-amber-500 pointer-events-none"
                            style={{ 
                              width: `${progress}%`,
                              transition: 'width 40ms linear'
                            }}
                          />
                        )}
                        
                        <span className="relative z-10 flex items-center gap-1">
                          {isPlaying ? (
                            <>
                              <Pause className="w-1.5 h-1.5 text-white fill-white shrink-0" />
                              <span>Пауза</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-1.5 h-1.5 text-white fill-white shrink-0 animate-pulse" />
                              <span>Пуск</span>
                            </>
                          )}
                        </span>
                      </button>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-slate-200/50 text-slate-500 rounded text-[7.5px] font-black uppercase tracking-wider font-mono">
                        Отзыв
                      </span>
                    )}
                  </div>

                  {/* Character by character sequence typing effect */}
                  <div className="text-[#555] font-semibold text-[10px] sm:text-[10.5px] leading-relaxed italic pr-1 mt-1 flex-grow overflow-y-auto max-h-[115px] scrollbar-thin relative z-10">
                    <TypewrittenQuote text={rev.text} isActive={isActive} />
                  </div>

                  {/* Right big quote mark */}
                  <span className="absolute right-3 bottom-1.5 text-[42px] leading-none opacity-20 text-[#333] font-serif select-none" style={{ fontFamily: 'Georgia, serif' }}>”</span>
                </blockquote>

                {/* Downward triangle arrow matching the blockquote background with safe pixel overlap */}
                <div className="absolute left-[35px] top-[177px] w-0 h-0 border-l-0 border-r-[25px] border-r-transparent border-t-[25px] border-t-[#fafafa] pointer-events-none z-10 shadow-xxs" />

                {/* Author name and SMM-domain role */}
                <div className="absolute bottom-[8px] left-[20px] right-[20px] flex flex-col justify-center leading-snug pointer-events-none text-left">
                  <h5 className="font-extrabold text-[#333] text-[11.5px] tracking-normal break-words whitespace-normal leading-tight mb-0.5 normal-case">
                    {rev.name}
                  </h5>
                  <span className="text-[10px] text-slate-500 font-medium break-words whitespace-normal leading-tight normal-case">
                    {roleForIdx(idx)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide Dot Indicators */}
      <div className="flex justify-center items-center gap-2 mt-[25px] pb-2">
        {reviews.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === activeIndex 
                ? 'w-6 bg-gradient-to-r from-orange-400 to-pink-500 shadow-xs' 
                : 'w-2 bg-slate-200 hover:bg-slate-300'
            }`}
            aria-label={`Перейти к отзыву ${idx + 1}`}
          />
        ))}
      </div>

      {/* Button with multicolor gradient to open review form */}
      <button 
        onClick={onAddReviewClick}
        className="mt-6 px-6 py-2.5 bg-multicolor-gradient hover:opacity-95 text-white text-[10.5px] uppercase font-black tracking-wider rounded-xl shadow-md border border-white/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
      >
        Оставить отзыв ✍️
      </button>
    </div>
  );
}

interface LandingPageProps {
  onLogin: () => void;
  user: UserAccount;
  onUpdateUser: (updated: UserAccount) => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  isLoggedIn?: boolean;
}

// Global helper to parse markdown bold syntax **bold text** into strong JSX elements
export function renderWithBold(text: string): React.ReactNode {
  if (!text) return '';
  const regex = /\*\*(.*?)\*\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-extrabold text-slate-900">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

interface MessageItem {
  id: string;
  senderKey: string;
  text: string;
  timestamp: string;
  replyTo?: {
    name: string;
    role: string;
    text: string;
  };
}

const CHAT_PARTICIPANTS: Record<string, { name: string; role: string; avatar: string; color: string; status: string }> = {
  alex: { name: "Алексей С.", role: "Копирайтер", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80", color: "from-sky-500 to-sky-600 bg-sky-50 text-sky-700 border-sky-200", status: "В сети" },
  marina: { name: "Марина К.", role: "Канал-Админ", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80", color: "from-sky-500 to-sky-600 bg-sky-50 text-sky-700 border-sky-200", status: "Печатает..." },
  dmitry: { name: "Дмитрий В.", role: "Рекламодатель", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80", color: "from-rose-500 to-rose-600 bg-rose-50 text-rose-700 border-rose-200", status: "В сети" },
  olga: { name: "Ольга А.", role: "ИИ Модератор", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&fit=crop&q=80", color: "from-indigo-500 to-indigo-600 bg-indigo-50 text-indigo-700 border-indigo-200", status: "В сети" },
  sergey: { name: "Сергей П.", role: "Закупщик", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80", color: "from-amber-500 to-amber-600 bg-amber-50 text-amber-700 border-amber-200", status: "В сети" },
  elena: { name: "Елена Р.", role: "Бьюти-Блогер", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&fit=crop&q=80", color: "from-pink-500 to-pink-600 bg-pink-50 text-pink-700 border-pink-200", status: "Печатает..." },
  ivan: { name: "Иван @shishkarnem", role: "Основатель", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80", color: "from-purple-500 to-purple-600 bg-purple-50 text-purple-700 border-purple-200", status: "В сети" },
  anna: { name: "Анна М. 🤡", role: "Мультипостинг", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80", color: "from-teal-500 to-teal-600 bg-teal-50 text-teal-700 border-teal-200", status: "В сети" },
  vlad: { name: "Влад Т.", role: "Продюсер", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80", color: "from-orange-500 to-orange-600 bg-orange-50 text-orange-700 border-orange-200", status: "В сети" },
  katerina: { name: "Екатерина Д.", role: "Дизайнер", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&fit=crop&q=80", color: "from-cyan-500 to-cyan-600 bg-cyan-50 text-cyan-700 border-cyan-200", status: "В сети" },
};

const CHAT_SCRIPTS: Array<{ senderKey: string; text: string; isReply?: boolean }> = [
  { senderKey: "marina", text: "Привет всей SMM тусовке! Как дела с утренним постингом сегодня?" },
  { senderKey: "alex", text: "Да вот, настраиваю автопостинг через бота на всю неделю вперед." },
  { senderKey: "dmitry", text: "О, а сколько каналов подключил? Слышал, на фри-тарифе дают аж 3 слота.", isReply: true },
  { senderKey: "elena", text: "Привет! А у меня бьюти-блог, и я просто обожаю авто-наложение вотермарок!" },
  { senderKey: "katerina", text: "Согласна, вотермарки спасают от воровства авторских фоток." },
  { senderKey: "anna", text: "А я вообще ворую и рерайчу через ИИ! 🤡 И всё уникально получается, охваты летят!", isReply: true },
  { senderKey: "sergey", text: "Анна, вот из-за таких уникализаторов мне как закупщику приходится тщательно каналы собирать 😂" },
  { senderKey: "olga", text: "Не переживайте, наш бот-модератор сразу вычищает неуникальный спам из комментариев." },
  { senderKey: "vlad", text: "Кстати про закупку. Кто-то тестировал ИИ Биржу с безопасными сделками?", isReply: true },
  { senderKey: "marina", text: "Да! Деньги морозятся на балансе, пока админ не выдаст пост и бот не проверит топ-удержание." },
  { senderKey: "dmitry", text: "Идеальное решение для рекламодателей, никакого кидалова в ЛС." },
  { senderKey: "sergey", text: "И админам спокойно — выплаты зачисляются на внутренний баланс за 10 минут.", isReply: true },
  { senderKey: "ivan", text: "Привет, команда! Рад видеть такое живое обсуждение. Готовим большое обновление с генерацией Stories." },
  { senderKey: "elena", text: "Ооо, Иван, Reels и Stories — это моя главная боль! Очень ждём шаблоны." },
  { senderKey: "alex", text: "А ИИ-копирайтер будет адаптирован под новые форматы историй?", isReply: true },
  { senderKey: "ivan", text: "Да, добавим специальные промты: 'Прогрев', 'Интрига', 'Продажа' и 'Игры с подписчиками'." },
  { senderKey: "vlad", text: "Шикарно! Я сейчас все прогревы пишу исключительно через формулы PAS и AIDA в ИИSMM." },
  { senderKey: "katerina", text: "Ребята, а у всех картинки быстро грузятся в боте? На прошлой неделе слегка лагало.", isReply: true },
  { senderKey: "ivan", text: "Катя, мы обновили сервера, переехали ближе и настроили CDN, теперь летает буквально за сотые секунды." },
  { senderKey: "olga", text: "Да, я заметила, модерация картинок теперь моментально отрабатывает." },
  { senderKey: "marina", text: "Кстати, а вы знали, что за квизы в Академии дают реальные ИИрки?", isReply: true },
  { senderKey: "anna", text: "Серьёзно? А я думала это просто для проверки знаний 🤡 Побежала сдавать тест!" },
  { senderKey: "vlad", text: "Сдал вчера квиз по маркировке ОРД, зачислили 100 000 ИИрок. Сразу распределил на автопосты." },
  { senderKey: "sergey", text: "Маркировка ОРД — это вообще ад. Бот действительно делает её автоматом?", isReply: true },
  { senderKey: "marina", text: "Да, при публикации выбираешь чекбокс 'Промаркировать', вводишь токен рекламы, и он сам крепит плашку." },
  { senderKey: "dmitry", text: "Очень законно и без лишних кликов на сторонних сайтах." },
  { senderKey: "elena", text: "Девочки, а кто-нибудь создавал папки взаимного пиара?", isReply: true },
  { senderKey: "vlad", text: "Я создавал папку для крипто-каналов. Собрали 8 участников, залили трафик и выросли суммарно на 4к подписчиков." },
  { senderKey: "sergey", text: "Папки пиара — бесплатный инструмент, а окупаемость космическая." },
  { senderKey: "marina", text: "А как туда попасть? Есть какие-то требования по просмотрам?", isReply: true },
  { senderKey: "vlad", text: "Создатель папки сам ставит фильтры. Можно ограничить от 500 глаз на пост, к примеру." },
  { senderKey: "alex", text: "Я как копирайтер пишу тексты для всей папки взаимного пиара, чтобы стиль был одинаковый." },
  { senderKey: "anna", text: "А я просто скопирую твой текст и ИИ перепишет под Клоуна-убийцу 🤡", isReply: true },
  { senderKey: "katerina", text: "Анна, пощади подписчиков! И так лента переполнена креативом." },
  { senderKey: "olga", text: "Модераторы следят за качеством юмора, так что сильно не шалите!" },
  { senderKey: "ivan", text: "На самом деле ИИ отлично понимает сарказм, можете потестировать температуру генерации в промте.", isReply: true },
  { senderKey: "alex", text: "Обычно ставлю температуру 0.7 для обычных постов и 0.95, если нужно накреативить безумие." },
  { senderKey: "dmitry", text: "Я для бизнес-постов ставлю строго 0.2, чтобы факты не плыли." },
  { senderKey: "sergey", text: "О, это полезная фишка, а то вечно ИИ придумывает несуществующие промокоды 😂", isReply: true },
  { senderKey: "elena", text: "Ребята, а как дела с выводами средств со сделок на карту?" },
  { senderKey: "marina", text: "Выводила позавчера 15 тысяч, пришли на СБП за пару минут. Всё полностью автоматизировано." },
  { senderKey: "dmitry", text: "Удобно. И налоги платить проще, когда есть детальная выписка из кабинета.", isReply: true },
  { senderKey: "olga", text: "И никакой рутины с таблицами в Экселе. Всё хранится в облаке." },
  { senderKey: "anna", text: "Эксель — прошлый век. Я веду 20 каналов чисто из Телеграм-интерфейса ИИSMM 🤖" },
  { senderKey: "vlad", text: "20 каналов? Жесть, ты вообще спишь?", isReply: true },
  { senderKey: "anna", text: "Я сплю, а планировщик ИИSMM постит круглосуточно по заранее настроенному контент-плану." },
  { senderKey: "marina", text: "Слушайте, а лям ИИрок на месяц — это много или мало?" },
  { senderKey: "ivan", text: "Этого хватает примерно на 150 лонгридов с детальной генерацией картинок. Более чем щедро.", isReply: true },
  { senderKey: "katerina", text: "Да, у меня за месяц уходит от силы 400 тысяч токенов. Очень выгодно." },
  { senderKey: "marina", text: "Ну всё, окончательно убедили! Иду жать кнопку 'Присоединиться' внизу!", isReply: true }
];

function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let currentLen = 0;
    setDisplayed("");
    const intervalMs = 1000 / speed; // 30 cps -> ~33ms
    const timer = setInterval(() => {
      currentLen++;
      if (currentLen <= text.length) {
        setDisplayed(text.slice(0, currentLen));
      } else {
        clearInterval(timer);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayed}</span>;
}

export function SmmLiveChat({ onJoin }: { onJoin: () => void }) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scriptIdx = 0;
    let timeoutId: any;

    const addNextMessage = () => {
      const idx = scriptIdx % CHAT_SCRIPTS.length;
      const currentScript = CHAT_SCRIPTS[idx];
      
      let replyTo: MessageItem['replyTo'] = undefined;
      if (currentScript.isReply) {
        const prevIdx = (idx - 1 + CHAT_SCRIPTS.length) % CHAT_SCRIPTS.length;
        const prevScript = CHAT_SCRIPTS[prevIdx];
        const prevSender = CHAT_PARTICIPANTS[prevScript.senderKey];
        if (prevSender) {
          replyTo = {
            name: prevSender.name,
            role: prevSender.role,
            text: prevScript.text
          };
        }
      }

      const newMsg: MessageItem = {
        id: `msg-live-${Date.now()}-${idx}`,
        senderKey: currentScript.senderKey,
        text: currentScript.text,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        replyTo
      };

      setMessages(prev => {
        const combined = [...prev, newMsg];
        if (combined.length > 35) {
          return combined.slice(combined.length - 35);
        }
        return combined;
      });

      scriptIdx++;

      // Dynamic pacing: typing duration + read pause
      const typingTimeMs = (currentScript.text.length / 30) * 1000;
      const readPauseMs = 1200; // Comfortable pause
      const nextDelayMs = Math.min(Math.max(typingTimeMs + readPauseMs, 3200), 6500);

      timeoutId = setTimeout(addNextMessage, nextDelayMs);
    };

    // Start typing first message 400ms after load
    timeoutId = setTimeout(addNextMessage, 400);

    return () => clearTimeout(timeoutId);
  }, []);

  // Soft localized container-only scrolling (prevents jumping of entire page viewport)
  useEffect(() => {
    if (chatContainerRef.current) {
      const c = chatContainerRef.current;
      c.scrollTo({
        top: c.scrollHeight,
        behavior: 'smooth'
      });
    }
    const scrollFallback = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 120);
    return () => clearTimeout(scrollFallback);
  }, [messages]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Side: Active SMM experts listing (10 people) */}
      <div className="lg:col-span-4 apple-liquid-glass rounded-3xl p-5 bg-white/45 border border-white/65 flex flex-col justify-start space-y-4 shadow-xl select-none">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100/60">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            <h3 className="font-medium text-[#cb0080] text-xs">Участники в сети (10)</h3>
          </div>
          <span className="text-[10px] bg-sky-100 text-sky-850 px-2 py-0.5 rounded-full font-medium font-mono border border-sky-200">Live-эфир</span>
        </div>

        {/* Participant Grid/List */}
        <div className="grid grid-cols-5 lg:grid-cols-1 gap-2 max-h-[140px] lg:max-h-[460px] overflow-y-auto no-scrollbar">
          {Object.entries(CHAT_PARTICIPANTS).map(([key, p]) => {
            const isTyping = p.status === "Печатает...";
            return (
              <div key={key} className="flex lg:flex-row flex-col items-center gap-2.5 p-1.5 lg:px-2.5 rounded-xl hover:bg-white/65 transition-all border border-transparent lg:hover:border-pink-100/40">
                {/* Avatar with live status dot */}
                <div className="relative shrink-0">
                  <img src={p.avatar} alt={p.name} className="w-8 h-8 lg:w-9 lg:h-9 rounded-full object-cover border border-slate-200/50 shadow-xs" referrerPolicy="no-referrer" />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isTyping ? 'bg-pink-500 animate-pulse' : 'bg-sky-500'}`} />
                </div>

                {/* Desktop Label Details */}
                <div className="hidden lg:block text-left min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 truncate block leading-tight">{p.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-slate-500 font-medium">{p.role}</span>
                    <span className={`text-[9px] font-medium ${isTyping ? 'text-pink-600 animate-pulse' : 'text-slate-500'}`}>{p.status}</span>
                  </div>
                </div>

                {/* Mobile Tooltip/Truncated Label */}
                <span className="lg:hidden text-[8px] font-medium text-slate-700 truncate max-w-full text-center mt-1">{p.name.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Side: Interactive Real-time Chat Timeline in Light Apple Liquid Glass theme */}
      <div className="lg:col-span-8 flex flex-col justify-between apple-liquid-glass rounded-3xl bg-white/60 backdrop-blur-xl text-slate-800 border border-white/80 p-4 lg:p-6 shadow-xl relative min-h-[500px] lg:min-h-[555px]">
        {/* Screen Monitor Glow Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100/40 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#cb0080] animate-pulse shadow-sm" style={{ boxShadow: '0 0 10px #cb0080' }} />
            <div className="text-left">
              <h3 
                className="font-extrabold text-sm sm:text-base tracking-tight text-transparent bg-clip-text font-mono"
                style={{ 
                  background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Чат-Эфир
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[9px]">
            <span className="px-2.5 py-1 rounded-xl bg-pink-50 text-pink-700 font-medium border border-pink-100/70">Темы: Автопостинг / Биржа / ИИ</span>
          </div>
        </div>

        {/* Scrolling bubbles list */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent max-h-[350px] lg:max-h-[390px] min-h-[290px]">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const sender = CHAT_PARTICIPANTS[m.senderKey] || CHAT_PARTICIPANTS.alex;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -15, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="flex flex-col space-y-1.5 max-w-[92%] lg:max-w-[85%] text-left"
                >
                  {/* Sender name & details ABOVE the bubble */}
                  <div className="flex items-center gap-2 pl-3 select-none">
                    <span className="font-semibold text-[11px] text-slate-800 tracking-tight">{sender.name}</span>
                    <span className="text-[8px] font-medium px-1.5 py-0.2 rounded-md bg-pink-100/60 text-pink-700 border border-pink-200/50">
                      {sender.role}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono font-normal">{m.timestamp}</span>
                  </div>

                  {/* Bubble + Avatar */}
                  <div className="flex items-start gap-2.5">
                    <img
                      src={sender.avatar}
                      alt={sender.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-white shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div className="p-3.5 px-4 rounded-3xl rounded-tl-none bg-white/75 backdrop-blur-md border border-white/95 text-xs text-slate-700 font-normal leading-relaxed shadow-sm hover:shadow-md hover:bg-white/90 transition-all duration-200 w-full relative">
                      {/* Reply Quote Block inside bubble */}
                      {m.replyTo && (
                        <div className="mb-2 p-2 rounded-xl bg-pink-50/50 border-l-2 border-[#cb0080] text-[10px] text-slate-600 flex flex-col gap-0.5 pointer-events-none select-none">
                          <span className="font-medium text-[#cb0080] text-[9px]">{m.replyTo.name} • {m.replyTo.role}</span>
                          <span className="truncate text-slate-500 italic">"{m.replyTo.text}"</span>
                        </div>
                      )}

                      {/* Typewriter text animating 30 chars/sec */}
                      <TypewriterText text={m.text} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Static Simulated Footer warning that they are viewing */}
        <div className="mt-4 pt-3 border-t border-pink-100/60 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/75 backdrop-blur-md p-3.5 rounded-2xl border border-white/90 shadow-xs">
          <div className="text-left text-[11px] text-slate-600">
            <span className="font-medium text-slate-800 block">💬 Вы просматриваете трансляцию эфира SMM-чата.</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Пройдите авторизацию в 1 клик, чтобы подключить ИИ к своим каналам бесплатно.</span>
          </div>
          <button
            onClick={onJoin}
            className="w-full sm:w-auto px-6 py-3 hover:scale-102 active:scale-98 text-white text-xs font-medium rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10 shrink-0"
            style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
          >
            <span>Присоединиться к чату 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onLogin, user, onUpdateUser, currentPath, onNavigate, isLoggedIn = false }: LandingPageProps) {
  const pathToTab = (path: string): 'abilities' | 'oferta' => {
    switch (path) {
      case '/oferta': return 'oferta';
      default: return 'abilities';
    }
  };

  const tabToPath = (tab: string) => {
    switch (tab) {
      case 'oferta': return '/oferta';
      default: return '/main';
    }
  };

  const activeTab = pathToTab(currentPath);
  
  const setActiveTab = (tab: 'abilities' | 'oferta') => {
    onNavigate(tabToPath(tab));
  };

  // Interactive states for landing play pieces
  const [phonePreviewText, setPhonePreviewText] = useState('Анонс: Новый запуск ИИSMM в 2026 году!');
  const [selectedPlatform, setSelectedPlatform] = useState<'tg' | 'vk' | 'ok'>('tg');
  const [aiDemoInput, setAiDemoInput] = useState('Топ 3 нейросети для рекламы');
  const [aiDemoResult, setAiDemoResult] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // States for Reviews / Testimonials carousel
  const [reviews, setReviews] = useState([
    { name: "Александр (SMM-агентство)", rating: 5, text: "Тариф «Отрыв» — лучшее решение для нашей сетки из 15 Telegram-каналов! Ручные и обычные посты публикуем совершенно безлимитно, а 4,900 ИИрок в месяц с запасом хватает на регулярный рерайт текста с ИИ стилем и генерацию нейрокартинок." },
    { name: "Мария С. (Блогер)", rating: 5, text: "На тарифе «Старт» в подарок сразу пришло 100 ИИрок — за пару минут сгенерировала 5 отличных постов и красивую обложку! А главное, что обычный автопостинг и каналы 100% бесплатные!" },
    { name: "Семён Т. (@semen_smm)", rating: 5, text: "Прозрачнейший курс 1 рубль = 1 ИИрка! На тарифе «Разгон» подключил умные сценарии автопостинга 24/7 и автокалендарь. Посты выходят в Telegram четко по расписанию." },
    { name: "Анна Ковалева (Контент-мейкер)", rating: 5, text: "Конструктор Markdown V2 со спойлерами и Rich-кнопками просто шикарен! Облачная медиагалерея экономит кучу времени при загрузке картинками и GIF." },
    { name: "Dmitry Dev (Разработчик)", rating: 5, text: "На тарифе «Отрыв» подключил собственные API ключи OpenAI и Gemini, а также активировал мультиплеер для команды. Голосовое управление надиктованными текстами работает безупречно!" }
  ]);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  // Advantages card active index state for dynamic tap-to-expand behavior on mobile & click
  const [activeAdvIdx, setActiveAdvIdx] = useState<number | null>(null);
  const [activeMarketAdvIdx, setActiveMarketAdvIdx] = useState<number | null>(null);

  // Testimonial submission form modal states (No registration required)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalText, setModalText] = useState('');
  const [modalRating, setModalRating] = useState(5);
  const [modalAvatar, setModalAvatar] = useState('👤');

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalText.trim()) {
      alert('Пожалуйста, напишите текст отзыва!');
      return;
    }
    const safeName = modalName.trim() || 'Аноним';
    const newRev = {
      name: safeName,
      rating: modalRating,
      text: modalText
    };
    setReviews(prev => [...prev, newRev]);
    alert('🎉 Спасибо! Ваш отзыв успешно отправлен и будет опубликован на платформе!');
    // Clear and close
    setModalName('');
    setModalText('');
    setModalRating(5);
    setModalAvatar('👤');
    setShowReviewModal(false);
    // Focus on the newly added review
    setActiveReviewIdx(reviews.length);
  };

  // Interactive demo states for simulated marketplace on landing page
  const [simName, setSimName] = useState('Магия Нейросетей ✨');
  const [simPrice, setSimPrice] = useState('500');
  const [simViews, setSimViews] = useState('2500');
  const [simSubmitted, setSimSubmitted] = useState(false);
  const [simEarning, setSimEarning] = useState(0);

  // Academy interactive course engine states
  const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
  const [customSmmQuestion, setCustomSmmQuestion] = useState('');
  const [aiAnswerResult, setAiAnswerResult] = useState('');
  const [aiAnswering, setAiAnswering] = useState(false);
  const [lessonCompletedState, setLessonCompletedState] = useState<Record<string, boolean>>({
    'c0-l0': true
  });
  const [lessonQuizAnswers, setLessonQuizAnswers] = useState<Record<string, number>>({});
  const [lessonQuizFeedback, setLessonQuizFeedback] = useState<string | null>(null);

  // Mini quiz state for SMM Academy on landing page
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  // Auth modal simulator & Email Registration / SMTP Recovery State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [customUsername, setCustomUsername] = useState('@smm_expert');

  // E-mail Auth & SMTP Password Reset states
  const [authTab, setAuthTab] = useState<'email_register' | 'email_login' | 'telegram' | 'forgot_password'>('email_register');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Referral tracking state
  const [refCode, setRefCode] = useState<string>('169262990');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref') || urlParams.get('startapp') || urlParams.get('startParam');
      if (refParam) {
        localStorage.setItem('iismm_ref', refParam);
        setRefCode(refParam);
      } else {
        const savedRef = localStorage.getItem('iismm_ref');
        if (savedRef) setRefCode(savedRef);
      }
    }
  }, []);

  const handleEmailLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Пожалуйста, введите E-mail и пароль');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthError(data.error || 'Неверный логин или пароль');
        setAuthLoading(false);
        return;
      }
      onUpdateUser({
        ...user,
        id: data.user.id || 'usr-' + Date.now(),
        name: data.user.firstName || data.user.email,
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        telegramUsername: data.user.username || `@${data.user.email.split('@')[0]}`,
        email: data.user.email,
        role: data.user.role,
        tokens: data.user.balance || 1000,
        iirky: data.user.balance || 1000
      });
      setShowTelegramModal(false);
      onLogin();
      onNavigate('/profile');
    } catch (err) {
      setAuthError('Сетевая ошибка при попытке входа');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailRegisterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    if (!emailInput.trim() || !passwordInput.trim() || !confirmPasswordInput.trim()) {
      setAuthError('Пожалуйста, заполните E-mail, пароль и подтверждение пароля');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('Пароли не совпадают. Пожалуйста, проверьте правильность ввода.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
          firstName: nameInput || emailInput.split('@')[0],
          username: `@${emailInput.split('@')[0]}`,
          ref: refCode || '169262990',
          referredBy: refCode || '169262990'
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthError(data.error || 'Ошибка при регистрации');
        setAuthLoading(false);
        return;
      }
      setAuthSuccessMsg('🎉 Регистрация успешна! Данные внесены в БД, отправлено письмо на почту.');
      onUpdateUser({
        ...user,
        id: data.user.id,
        name: data.user.firstName,
        firstName: data.user.firstName,
        email: data.user.email,
        telegramUsername: data.user.username,
        tokens: data.user.balance || 1000,
        iirky: data.user.balance || 1000
      });
      setTimeout(() => {
        setShowTelegramModal(false);
        onLogin();
        onNavigate('/profile');
      }, 1500);
    } catch (err) {
      setAuthError('Ошибка подключения к серверу авторизации');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    if (!emailInput.trim()) {
      setAuthError('Укажите ваш E-mail для отправки пароля');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthError(data.error || 'Ошибка при восстановлении пароля');
        setAuthLoading(false);
        return;
      }
      setAuthSuccessMsg(data.message || 'Новый пароль отправлен via SMTP!');
    } catch (err) {
      setAuthError('Ошибка отправки письма сброса пароля');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminBypassLogin = () => {
    onUpdateUser({
      ...user,
      id: 'usr-928',
      name: 'Иван Шишкарёв',
      firstName: 'Иван',
      lastName: 'Шишкарёв',
      telegramUsername: '@shishkarnem',
      tariff: 'vip',
      tokens: 1000000,
      iirky: 1000000,
      telegramStars: 250,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      balanceRub: 350,
      earningsRub: 14500,
    });
    setShowTelegramModal(false);
    onLogin();
    alert('👑 ВХОД АДМИНИСТРАТОРА: Режим разработчика активирован. Добро пожаловать, Иван!');
  };

  // Canva Canvas interactive simulator on landing page
  const [canvasBgColor, setCanvasBgColor] = useState<string>('from-sky-100 to-pink-100');
  const [canvasWatermark, setCanvasWatermark] = useState('© ИИSMM @bot');
  const [canvasMainText, setCanvasMainText] = useState('КАК НАПИСАТЬ ИДЕАЛЬНЫЙ ПОСТ');

  // Paper plane scroll tracking with premium elastic physical response
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });
  const rawY = useTransform(scrollYProgress, [0, 1], ["0%", "99%"]);
  const y = useSpring(rawY, { stiffness: 120, damping: 20 });
  const scrollVelocity = useVelocity(scrollYProgress);
  const [isScrollingUp, setIsScrollingUp] = useState(false);

  useEffect(() => {
    return scrollVelocity.on("change", (v) => {
      if (v < -0.005) {
        setIsScrollingUp(true);
      } else if (v > 0.005) {
        setIsScrollingUp(false);
      }
    });
  }, [scrollVelocity]);

  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveAdvIdx(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleRunAiDemo = () => {
    if (!aiDemoInput.trim()) return;
    setAiGenerating(true);
    setTimeout(() => {
      setAiDemoResult(
        `✍️ ИИ-Ассистент ИИSMM подготовил публикацию по теме "${aiDemoInput}":\n\n` +
        `🚀 Нейросети меняют автопостинг в Telegram со скоростью света! Вот 3 главных инструмента 2026 года для вашей рекламы:\n\n` +
        `1️⃣ ИИSMM Модель - идеален для адаптации длинных постов, генерации фото и расписания.\n` +
        `2️⃣ SAV AI Writer - автоматически вырезает спам из репостов и подбирает хештеги.\n` +
        `3️⃣ Flux SMM Art - генерирует привлекательные обложки прямо на холсте.\n\n` +
        `#маркетинг #автопостинг #иисмм`
      );
      setAiGenerating(false);
    }, 1200);
  };

  const handleFinishQuiz = () => {
    const correctAnswers = { 0: 1, 1: 2, 2: 0 }; // keys are questions index, vals are correct option indices
    let score = 0;
    if (selectedAnswers[0] === correctAnswers[0]) score += 1;
    if (selectedAnswers[1] === correctAnswers[1]) score += 1;
    if (selectedAnswers[2] === correctAnswers[2]) score += 1;
    setQuizScore(score);
    setQuizFinished(true);
    if (score === 3) {
      // Simulate adding bonus ИИрок to the starting user state when they actually log in
      onUpdateUser({
        ...user,
        iirky: (user.iirky || 1000000) + 100000 // Grant +100,000 ИИрок as promo code!
      });
    }
  };

  const handleConfirmLogin = () => {
    if (phoneNumber.length < 5 && step === 1) {
      alert('Пожалуйста, введите корректный номер телефона или никнейм!');
      return;
    }
    if (step === 1) {
      setStep(2);
      alert('Код подтверждения отправлен в ваш Telegram-бот @IIrkiBot. Пожалуйста, введите его.');
    } else {
      // Step 2, update user state
      onUpdateUser({
        ...user,
        telegramUsername: customUsername.startsWith('@') ? customUsername : '@' + customUsername,
        name: `ИИSMM Эксперт (${customUsername})`,
        iirky: (user.iirky || 1000000), // credit standard initial balance
        tariff: 'vip' // 7 days VIP default as per TMA starting trial
      });
      setShowTelegramModal(false);
      onLogin(); // Login successfully!
      alert(`🎉 Успешная ТМА-авторегистрация в 1-клик! Вам начислен стартовый баланс 1,000,000 ИИрок и 7 дней подписки VIP!`);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen text-slate-800 flex flex-col font-sans relative overflow-hidden">
      <LiquidGlassBackground />
      
      {/* 1. Global Navigation header block (Apple Liquid Glass) */}
      <header className="sticky top-0 z-40 bg-white/45 backdrop-blur-xl border-b border-white/30 shadow-xs px-4 py-3 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('/main')}>
            <ShinyLogo height={38} />
          </div>

          {/* Header Authorization button */}
          <div className="flex items-center gap-3">
            <button 
              id="header-btn-login"
              onClick={() => {
                if (isLoggedIn) {
                  onNavigate('/profile');
                } else {
                  setShowTelegramModal(true);
                }
              }}
              className="px-4 sm:px-5 py-2 sm:py-2.5 hover:scale-103 text-white font-black text-xs rounded-xl tracking-wider flex items-center justify-center gap-2 border border-white/20 shadow-md active:scale-98 transition-all cursor-pointer"
              style={{ background: 'linear-gradient(120deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-current shrink-0 animate-bounce">
                <path d="M19.897 5.115l-17.1 6.59c-1.17.47-1.16 1.12-.22 1.41l4.39 1.37 10.16-6.41c.48-.29.92-.13.56.19l-8.24 7.44-.32 4.79c.47 0 .68-.21.94-.47l2.25-2.19 4.68 3.46c.86.48 1.48.23 1.69-.8l3.07-14.47c.31-1.26-.48-1.83-1.32-1.37z" />
              </svg>
              {isLoggedIn ? 'Кабинет 👤' : 'Войти ⚡'}
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Page Render and Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center relative z-10">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.22 }}
            className="w-full"
          >
            
            {/* INFORMATIVE SECTION 1: ВОЗМОЖНОСТИ (ГЛАВНАЯ) */}
            {(activeTab === 'abilities' && currentPath !== '/oferta') && (
              <>
                <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center py-6 space-y-12">
                  {/* CENTRED HIGH-FIDELITY PLATFORM NETWORK CLOUD — Logo surrounded by platform icons-planets */}
                  <div 
                    className="w-full relative overflow-visible flex flex-col justify-center items-center min-h-[340px] max-w-full transition-all duration-300 ease-out"
                    style={{
                      transform: `translateY(${scrollY * 0.42}px)`,
                      opacity: Math.max(0.18, 1 - scrollY / 650),
                      zIndex: scrollY > 60 ? -10 : 0,
                      pointerEvents: scrollY > 60 ? 'none' : 'auto',
                    }}
                  >
                    <PlatformNetworkCloud />
                  </div>

                  {/* PREMIUM HIGH-FIDELITY TWO-COLUMN COMMAND CENTER PANEL */}
                  <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[620px] lg:min-h-[650px] bg-gradient-to-b from-white via-white/80 via-white/40 to-transparent backdrop-blur-xl border-t border-x border-white/90 border-b-0 p-6 sm:p-10 pb-16 sm:pb-20 rounded-t-3xl shadow-none relative overflow-hidden group">
                    
                    {/* Background glows representing intelligent pulses */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-orange-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Left Column: Text Content and High-CTAs */}
                    <div className="lg:col-span-7 space-y-6 text-left relative z-10 flex flex-col justify-center">
                      <div className="inline-flex w-fit items-center gap-2 bg-gradient-to-r from-orange-100 to-pink-100/80 border border-orange-200/50 px-3.5 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-orange-950 font-black text-[9px] uppercase tracking-wider">
                          УМНАЯ ИИ-ПЛАТФОРМА №1 В РОССИИ
                        </span>
                      </div>
                      
                      <h2 className="text-2.5xl sm:text-3.5xl lg:text-4.5xl font-black tracking-tight leading-[1.15] text-gradient-header">
                        Интеллектуальная автоматизация SMM во все популярные платформы
                      </h2>
                      
                      <p className="text-slate-655 text-xs sm:text-sm leading-relaxed max-w-2xl font-medium">
                        Добро пожаловать в <strong className="text-slate-900">ИИSMM</strong> — продвинутый планировщик и конструктор автопубликаций в стильном, современном интерфейсе. Управляйте публикациями одной кнопкой абсолютно бесплатно!
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-700 font-bold pt-1">
                        <div className="flex items-center gap-2 bg-white/60 p-2.5 rounded-xl border" style={{ borderColor: '#cb0080', color: '#cb0080' }}>
                          <Check className="w-4 h-4 text-[#cb0080]" style={{ color: '#cb0080' }} />
                          <span style={{ color: '#cb0080' }}>ИИSMM Автопостинг 24/7</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 p-2.5 rounded-xl border border-slate-150/40" style={{ color: '#cb0080' }}>
                          <Check className="w-4 h-4 text-[#cb0080]" style={{ color: '#cb0080' }} />
                          <span style={{ color: '#cb0080', borderColor: '#cb0080' }}>Постинг в Telegram в 1 Клик</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 p-2.5 rounded-xl border font-bold" style={{ color: '#cb0080', borderColor: '#cb0080' }}>
                          <Check className="w-4 h-4 text-[#cb0080]" style={{ color: '#cb0080' }} />
                          <span style={{ color: '#cb0080' }}>Конструктор Markdown V2 & Rich</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 p-2.5 rounded-xl border font-bold" style={{ borderColor: '#cb0080', color: '#cb0080' }}>
                          <Check className="w-4 h-4 text-[#cb0080]" style={{ color: '#cb0080' }} />
                          <span style={{ color: '#cb0080' }}>Бесплатный Хостинг Галереи</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-4">
                        <button 
                          onClick={() => setShowTelegramModal(true)}
                          className="px-6 py-3.5 text-white font-black text-[11px] uppercase tracking-wide rounded-2xl shadow-xl hover:scale-103 hover:shadow-2xl transition-all border border-white/40 cursor-pointer"
                          style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                        >
                          Попробовать Бесплатно через TG 🚀
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Interactive Live Showroom Terminal Simulator */}
                    <div className="lg:col-span-5 w-full relative z-10">
                      <IntroLiveSimWidget />
                    </div>
                  </div>
                </div>

                <div className="text-center max-w-2xl mx-auto space-y-3 mt-16 mb-8">
                  <h3 
                    className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-transparent bg-clip-text"
                    style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    10 УМНЫХ ВОЗМОЖНОСТЕЙ ПЛАТФОРМЫ ИИСММ
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Наш интерактивный пульт управления: переключайте слайды вручную или запустите автоматический тур по SMM инновациям ИИSMM.
                  </p>
                </div>

                <FeaturesCarousel />

                {/* ADVANTAGES — ПРЕИМУЩЕСТВА СЕКЦИЯ */}
                <div id="advantages-section" className="pt-20 space-y-8 max-w-7xl mx-auto px-4">
                  <div className="text-center max-w-xl mx-auto space-y-3">
                    <h2 
                      className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-transparent bg-clip-text"
                      style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                      Преимущества работы с ИИSMM
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 pt-4 justify-items-center">
                    {[
                      {
                        title: "Работа без VPN и Лимитов",
                        shortTitle: "Без Лимитов 🌐",
                        desc: "Прямой доступ ко всем ИИ-генераторам и API со скоростью света. Не нужно регистрировать зарубежные аккаунты или держать включенным прокси.",
                        type: "city",
                        emoji: "🌐",
                        cta: "Начать"
                      },
                      {
                        title: "Многозадачные AI-Ассистенты",
                        shortTitle: "20+ Агентов 🤖",
                        desc: "Специализированные ИИ-агенты знают формулу AIDA, умеют шутить, пишут яркие прогревы, сценарии и анализируют тренды.",
                        type: "ski",
                        emoji: "🤖",
                        cta: "Выбрать"
                      },
                      {
                        title: "Память & Контекст ИИ",
                        shortTitle: "Память Постов 🧠",
                        desc: "Нейросеть запоминает ваши прошлые публикации, исключает дубли и формирует целостную контент-стратегию под вашу тематику.",
                        type: "beach",
                        emoji: "🧠",
                        cta: "Попробовать"
                      },
                      {
                        title: "ИИ Автопланирование",
                        shortTitle: "Автопилот 📡",
                        desc: "Умное авторасписание самостоятельно определяет время публикации для получения пикового охвата. Вы отдыхаете — автоматика работает.",
                        type: "camping",
                        emoji: "📡",
                        cta: "Тест драйв"
                      }
                    ].map((adv, aIdx) => (
                      <div 
                        key={aIdx} 
                        className={`new-adv-card ${activeAdvIdx === aIdx ? 'is-active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAdvIdx(activeAdvIdx === aIdx ? null : aIdx);
                        }}
                      >
                        {/* Rear Face - White background text content */}
                        <div className="new-adv-face new-adv-face1">
                          <div className="flex flex-col justify-between h-full pt-[52px] sm:pt-[60px]">
                            <div className="space-y-1 my-auto">
                              <h4 className="text-[11px] sm:text-[13px] font-black text-rose-600 uppercase tracking-tight leading-snug">
                                {adv.shortTitle}
                              </h4>
                              <p className="text-[9.5px] sm:text-[11px] leading-relaxed text-slate-600 font-medium font-sans">
                                {adv.desc}
                              </p>
                            </div>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowTelegramModal(true);
                              }}
                              className="w-full py-2 border border-pink-500 text-pink-600 hover:bg-pink-500 hover:text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer"
                            >
                              {adv.cta} ⚡️
                            </button>
                          </div>
                        </div>

                        {/* Front Face - Brand multi-gradient backdrop */}
                        <div className="new-adv-face new-adv-face2">
                          <span className="new-adv-emoji">{adv.emoji}</span>
                          <h3 className="new-adv-title">
                            {adv.title}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TARIFFS SECTION ON MAIN PAGE */}
                <div id="main-tariffs-section" className="pt-24 space-y-8 max-w-7xl mx-auto">
                  <div className="text-center max-w-2xl mx-auto space-y-3 px-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest font-mono">ГИБКИЙ ВЫБОР</span>
                    {/* Headings with multicolor gradient */}
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-multicolor-gradient uppercase">Наши тарифные планы</h2>
                    <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                      <span className="text-multicolor-gradient font-black text-sm sm:text-base">1 рубль = 1 ИИрка.</span>
                    </p>
                  </div>

                  <TariffCards onAction={() => setShowTelegramModal(true)} />
                </div>

                {/* SMM LIVE CHAT SECTION (ЧАТ-ЭФИР) */}
                <div id="chat-live-section" className="pt-20 pb-4 max-w-4xl mx-auto px-4 space-y-6">
                  <div className="text-center max-w-2xl mx-auto space-y-2">
                    <span className="px-3 py-1 bg-pink-100 text-pink-850 rounded-full text-[10px] font-black uppercase tracking-widest border border-pink-200">
                      ОБЩЕНИЕ И ЭФИР
                    </span>
                    <h2 
                      className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text"
                      style={{ 
                        background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Чат-Эфир
                    </h2>
                    <p className="text-slate-500 text-xs">Живые сообщения, обсуждения и обмен опытом в реальном времени</p>
                  </div>

                  <SmmLiveChat onJoin={() => setShowTelegramModal(true)} />
                </div>

                {/* REVIEWS TESTIMONIAL CAROUSEL */}
                <div id="reviews-carousel-section" className="pt-24 pb-12 max-w-4xl mx-auto px-4 space-y-8 overflow-visible">
                  <div className="text-center max-w-md mx-auto space-y-3">
                    <span className="px-3 py-1 bg-pink-100 text-pink-850 rounded-full text-[10px] font-black uppercase tracking-widest border border-pink-200">ОТЗЫВЫ КЛИЕНТОВ</span>
                    {/* Headings with multicolor gradient */}
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-multicolor-gradient uppercase">Что говорят SMM эксперты?</h2>
                    <p className="text-slate-500 text-xs">Мнения профессиональных блогеров, маркетологов и авторов каналов о платформе ИИSMM.</p>
                  </div>

                  {/* 3D orbit carousel for reviews matching the AIAgent3DCarousel layout */}
                  <Reviews3DCarousel 
                    reviews={reviews} 
                    onAddReviewClick={() => setShowReviewModal(true)} 
                  />
                </div>

                {/* POPUP MODAL FOR LEAVING REVIEWS (Anonymous & No register needed, styled under Registration template with transparent blurred backdrop) */}
                <AnimatePresence>
                  {showReviewModal && (
                    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-transparent backdrop-blur-[2px]">
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 15 }}
                        className="w-full max-w-sm apple-liquid-glass-heavy rounded-[28px] overflow-hidden shadow-2xl border border-white/60 p-1 bg-white/70 backdrop-blur-md relative"
                      >
                        {/* Soft pastel 5-color gradient header matching user instructions */}
                        <div 
                          className="p-5 rounded-[24px] relative shadow-xs border border-pink-200/60 text-center flex flex-col items-center"
                          style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(236, 72, 153, 0.12) 25%, rgba(249, 115, 22, 0.12) 50%, rgba(236, 72, 153, 0.12) 75%, rgba(56, 189, 248, 0.12) 100%)' }}
                        >
                          <button 
                            type="button"
                            onClick={() => setShowReviewModal(false)}
                            className="absolute right-3.5 top-3.5 w-6 h-6 bg-slate-200/60 hover:bg-slate-300/80 text-slate-600 rounded-full flex items-center justify-center font-bold transition-all border border-slate-300/40 cursor-pointer text-[10px]"
                          >
                            ✕
                          </button>
                          
                          <div className="w-9 h-9 rounded-full bg-white/90 border border-pink-200/60 shadow-xs flex items-center justify-center transition-all hover:rotate-6 shrink-0 mb-2">
                            <span className="text-base">✨</span>
                          </div>
                          
                          <h3 
                            className="text-xs font-black uppercase tracking-wider text-transparent bg-clip-text"
                            style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                          >
                            Оставить отзыв без регистрации
                          </h3>
                          <p className="text-slate-600 text-[10px] font-medium leading-relaxed mt-1">Поделитесь вашим мнением о платформе ИИSMM. Ваш отзыв появится на главном экране в реальном времени.</p>
                        </div>

                        <form onSubmit={handleReviewSubmit} className="p-4 space-y-3 pt-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Имя / Никнейм в Telegram:</label>
                            <input 
                              type="text"
                              value={modalName}
                              onChange={(e) => setModalName(e.target.value)}
                              placeholder="Например: Александр (@alex_smm)"
                              className="w-full text-xs p-3 bg-white/75 border border-slate-200/80 rounded-xl focus:ring-1 focus:ring-pink-500 focus:outline-none focus:border-pink-500/80 shadow-xxs font-medium"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Оценка (Звезды):</label>
                            <select 
                              value={modalRating} 
                              onChange={(e) => setModalRating(Number(e.target.value))}
                              className="w-full text-xs p-3 bg-white/75 border border-slate-200/80 rounded-xl focus:ring-1 focus:ring-pink-500 focus:outline-none font-bold text-orange-500 cursor-pointer shadow-xxs"
                            >
                              <option value="5" className="text-orange-500">⭐️⭐️⭐️⭐️⭐️ (5/5)</option>
                              <option value="4" className="text-orange-500">⭐️⭐️⭐️⭐️ (4/5)</option>
                              <option value="3" className="text-orange-500">⭐️⭐️⭐️ (3/5)</option>
                              <option value="2" className="text-orange-500">⭐️⭐️ (2/5)</option>
                              <option value="1" className="text-orange-500">⭐️ (1/5)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center mb-0.5">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Текст вашего отзыва:</label>
                              <span className="text-[9px] font-bold text-slate-400 font-mono" style={{ color: '#434c58' }}>{modalText.length} / 120 лимит</span>
                            </div>
                            <textarea 
                              rows={3}
                              value={modalText}
                              onChange={(e) => setModalText(e.target.value)}
                              placeholder="Пожалуйста, расскажите об опыте запуска постов..."
                              className="w-full text-xs p-3 bg-white/75 border border-slate-200/80 rounded-xl focus:ring-1 focus:ring-pink-500 focus:outline-none focus:border-pink-500/80 shadow-xxs font-medium"
                              maxLength={120}
                              required
                            />
                          </div>

                          <button 
                            type="submit"
                            className="w-full py-3 hover:opacity-95 text-white font-black text-[11px] uppercase rounded-xl tracking-wider shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                            style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                          >
                            Опубликовать отзыв 🚀
                          </button>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
            </>
          )}

          {/* INFORMATIVE SECTION: ДОГОВОР ОФЕРТЫ */}
          {currentPath === '/oferta' && (
            <OfertaPage onNavigate={onNavigate} />
          )}



            {/* INFORMATIVE SECTION 11: АКАДЕМИЯ */}
            {false && (() => {
              // 1. Academy Courses Data
              const academyCourses = [
                {
                  title: "🤖 Платформа ИИSMM & Автопостинг",
                  icon: "🤖",
                  description: "Освойте все тонкости публикации, автоматизации кросспостинга и умного календаря за 10 минут.",
                  lessons: [
                    {
                      id: "c0-l0",
                      title: "Урок 1: Подключение каналов и первый автопост",
                      excerpt: "Узнаем основы интеграции API, правила привязки до 3 бесплатных каналов и быстрый старт через бота.",
                      content: `Добро пожаловать в Академию ИИSMM! Наш первый урок посвящен связыванию ваших пабликов с платформой.\n\n📋 Шаги подключения:\n1. Откройте Telegram-бота @IIrkiBot и нажмите /start.\n2. Добавьте бота в администраторы вашего канала Telegram или предоставьте права доступа к сообществу ВКонтакте/Одноклассники.\n3. Пропишите уникальный ID канала в панели "📡 Каналы" ИИSMM.\n\n💡 Совет от ИИ: Публикуйте первый пост с кнопкой-ссылкой — это повышает ER (вовлеченность) на 17%.`,
                      question: "Сколько каналов можно бесплатно привязать на базовом тарифе ИИSMM?",
                      options: [
                        "А) Ни одного, только платные тарифы",
                        "Б) До 3-х каналов включительно",
                        "В) До 10 каналов",
                        "Г) Ограничений нет"
                      ],
                      correctIdx: 1,
                      feedback: "Правильно! Бесплатный тариф позволяет полноценно использовать до 3-х каналов одновременно."
                    },
                    {
                      id: "c0-l1",
                      title: "Урок 2: Разработка вотермарок и шаблонов на Холсте",
                      excerpt: "Как создавать защитные водяные знаки, использовать Apple Liquid Glass стиль для картинок и уникализировать визуал.",
                      content: `Защита авторского права в SMM в 2026 году — критически важная деталь.\n\n🎨 Правила Холста:\n• Водяной знак должен располагаться в углу изображения, занимая не более 5-7% площади.\n• Используйте полупрозрачный белый цвет с белой обводкой для универсальной видимости на любом фоне.\n• Вы можете задать автоматическое наложение водяного знака — система сама применит его ко всем картинкам ваших постов при кросспостинге.\n\n💡 Совет от ИИ: Уникализированные картинки с вотермарками получают в 1.5 раза больше органического поиска в Яндекс и Google Дзене.`,
                      question: "Какой процент от площади изображения должен занимать гармоничный водяной знак?",
                      options: [
                        "А) 50% в центре картинки",
                        "Б) Около 5-7% в одном из углов",
                        "В) 90% для полной защиты",
                        "Г) Водяные знаки вообще не нужны"
                      ],
                      correctIdx: 1,
                      feedback: "Правильно! Компактные 5-7% в углу защищают контент без визуального захламления!"
                    },
                    {
                      id: "c0-l2",
                      title: "Урок 3: Умный репостер и новостной авто-рерайт",
                      excerpt: "Осваиваем автопилотирование: забирайте контент доноров, делайте мгновенный рерайт и постите без штрафов за плагиат.",
                      content: `Запуск авто-репостера сокращает время ведения новостных пабликов в 10 раз!\n\n⚙️ Настройка автопилота:\n1. Перейдите во вкладку "Репостер" и укажите адрес открытого канала-источника.\n2. Включите опцию "ИИ-Рерайтер" для автоматического синонимического парафраза.\n3. Укажите стоп-слова, чтобы вырезать чужую рекламу и ссылки.\n\n⚡ Внимание на закон: Обязательно настраивайте правила уникализации контента, чтобы сети не понижали охваты за неоригинальность.`,
                      question: "Какая функция репостера оберегает паблик от понижения за неоригинальные посты?",
                      options: [
                        "А) Быстрое копирование без изменений",
                        "Б) ИИ-Рерайтер контента",
                        "В) Ссылка на оригинал огромным шрифтом",
                        "Г) Удаление всех картинок"
                      ],
                      correctIdx: 1,
                      feedback: "Правильно! Автоматический ИИ-Рерайтер адаптирует лексику и уникализирует текст."
                    }
                  ]
                },
                {
                  title: "📈 Вирусное SMM Продвижение от ИИ",
                  icon: "📈",
                  description: "Комплексное продвижение блогов, привлечение органической аудитории и искусство взаимного пиара.",
                  lessons: [
                    {
                      id: "c1-l0",
                      title: "Урок 1: Копирайтинг AIDA & зацепка внимания за 1.5 секунды",
                      excerpt: "Учимся писать первые 2 строки поста, которые заставят нажать кнопку «Читать далее» в любой соцсети.",
                      content: `Пользователь в 2026 году принимает решение за секунды!\n\n📌 Формула AIDA в ИИSMM:\n• Attention (Внимание): Крупный интригующий заголовок в первой строке.\n• Interest (Интерес): Факт, противоречие или статистика.\n• Desire (Желание): Описание выгоды читателя.\n• Action (Действие): Простая ссылка или кнопка.\n\n💡 Совет от ИИ: Избегайте черных фонов на картинках и избытка красных восклицательных знаков (это триггерит алгоритмы спам-фильтров).`,
                      question: "Что важнее всего поместить в самую первую строчку промо-публикации?",
                      options: [
                        "А) Десять смайликов подряд",
                        "Б) Интригующий заголовок (Attention)",
                        "В) Ссылку на свой профиль",
                        "Г) Длинное приветствие"
                      ],
                      correctIdx: 1,
                      feedback: "Правильно! Захватывающее внимание (Attention) — фундамент успеха любого поста."
                    },
                    {
                      id: "c1-l1",
                      title: "Урок 2: Организация Взаимного Пиара в Папках",
                      excerpt: "Используйте встроенный модуль Проектов, чтобы обмениваться аудиторией с другими SMM-админами абсолютно бесплатно.",
                      content: `Папка взаимного пиара — это подборка каналов схожей тематики, в которую пользователи добавляются в 1 клик.\n\n🚀 Как это работает в ИИSMM:\n1. Создайте проект-папку во вкладке "Папки Пиара".\n2. Пригласите от 3 до 8 каналов схожих масштабов аудитории.\n3. Все участники делают репост папки. В итоге каждый получает приток лояльных подписчиков совершенно бесплатно!\n\n💡 Совет от ИИ: Оптимальное количество участников в одной папке пиара — от 4 до 6. Больше вызовет баннерную слепоту.`,
                      question: "Какое рекомендуемое число блогов в одной папке взаимного пиара для максимального эффекта?",
                      options: [
                        "А) Не менее 100 блогов",
                        "Б) От 4 до 6 блогов",
                        "В) Только 1 блог",
                        "Г) Чем больше, тем лучше"
                      ],
                      correctIdx: 1,
                      feedback: "Правильно! Фокусированный подбор 4-6 близких тематических каналов дает лучшую конверсию."
                    },
                    {
                      id: "c1-l2",
                      title: "Урок 3: Безопасное бронирование на Рекламной Бирже",
                      excerpt: "Как продать свободные рекламные места, пройти модерацию и заработать первые рубли через Escrow софт.",
                      content: `На бирже ИИSMM сделки защищены системой безопасного депонирования (Escrow).\n\n💰 Правила работы биржи:\n• Рекламодатель резервирует место, и рубли холдируются на балансе системы.\n• Блогер берет заявку в работу и публикует пост.\n• Наш робот проверяет наличие публикации в течение 24 часов и мгновенно зачисляет средства бложеру.\n• Стандартная комиссия биржи при успешном закрытии сделки составляет 25% и идет на развитие и поддержание ИИ-инфраструктуры.\n\n🛡️ Важно: За накрутку ботов перед проверкой канал бессрочно блокируется без права вывода баланса!`,
                      question: "Сколько составляет комиссия биржи ИИSMM при успешном проведении сделки депонирования?",
                      options: [
                        "А) 50% от суммы сделки",
                        "Б) 25% фиксированно",
                        "В) Комиссии нет вообще",
                        "Г) 5% фиксированно"
                      ],
                      correctIdx: 1,
                      feedback: "Великолепно! Стандартная комиссия составляет 25%, покрывая гарантии Escrow-сделки."
                    }
                  ]
                }
              ];

              const currentCourse = academyCourses[selectedCourseIdx] || academyCourses[0];
              const currentLesson = currentCourse.lessons[selectedLessonIdx] || currentCourse.lessons[0];
              const lessonKey = `${selectedCourseIdx}-${selectedLessonIdx}`;

              // Calculate course completion
              const totalLessonsCount = academyCourses.reduce((acc, c) => acc + c.lessons.length, 0);
              const completedLessonsCount = Object.keys(lessonCompletedState).filter(k => lessonCompletedState[k]).length;
              const isCertified = completedLessonsCount >= 3;

              // Action triggers
              const handleAnswerSelect = (optionIdx: number) => {
                const newAnswers = { ...lessonQuizAnswers, [lessonKey]: optionIdx };
                setLessonQuizAnswers(newAnswers);

                if (optionIdx === currentLesson.correctIdx) {
                  setLessonCompletedState({ ...lessonCompletedState, [currentLesson.id]: true });
                  setLessonQuizFeedback(`🎉 ${currentLesson.feedback}`);
                } else {
                  setLessonQuizFeedback(`❌ Неверный ответ. Перечитайте материал урока и попробуйте другой вариант!`);
                }
              };

              // Real ProTalk AI tutor integration with local backup fallback
              const handleAskAiCurator = async () => {
                const questionText = customSmmQuestion.trim();
                if (!questionText) return;
                setAiAnswering(true);
                setAiAnswerResult('');
                
                try {
                  const pSystemInstruction = `Ты — ИИ-Преподаватель Академии ИИSMM по SMM и автоматизации. Твоя роль — помогать пользователю с курсом "${currentCourse.title}" и уроком "${currentLesson.title}". Давай профессиональные, структурированные ответы средней длины в стиле дружелюбного преподавателя-наставника. Твой ответ должен быть полезным, включать практический совет по продвижению или заработку на блогах, использовать Markdown для акцентов и списков. Отвечай на русском языке. Моделируй свой ответ как авторитетный Куратор курса. Если спрашивают про бота, напоминай про бота @IIrkiBot.`;
                  
                  const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      prompt: questionText,
                      history: [],
                      systemInstruction: pSystemInstruction
                    })
                  });

                  if (!response.ok) {
                    throw new Error('Network error requesting AI tutor');
                  }

                  const data = await response.json();
                  if (data && data.text) {
                    setAiAnswerResult(data.text);
                  } else {
                    throw new Error('Empty AI response');
                  }
                } catch (err) {
                  console.warn('ProTalk AI Curator chat failed, using local specialized fallback response... Error details:', err);
                  // Dynamic backup simulation
                  const query = questionText.toLowerCase();
                  let fallbackAns = `🤖 ИИ-Куратор Академии ИИSMM (Локальный режим): Рад помочь! По теме "${currentLesson.title}" сообщаю следующее:\n\n`;
                  
                  if (query.includes('канал') || query.includes('подключ') || query.includes('tg') || query.includes('vk')) {
                    fallbackAns += `Для надежного кросспостинга обязательно проверьте, что боту @IIrkiBot даны права администратора на "Публикацию сообщений" и "Редактирование". Без этого API Telegram вернет ошибку доступа. Наша система обрабатывает отправки мгновенно или в запланированное вами время.`;
                  } else if (query.includes('вотермарк') || query.includes('водян') || query.includes('картин')) {
                    fallbackAns += `Защищать визуал крайне полезно в Одноклассниках и VK, где встроенные алгоритмы Ленты ("Прометей" / "Умная лента") проверяют графический шум на уникальность. Минимальный водяной знак в правом нижнем углу со значением прозрачности 25% — наилучшее решение для сохранения эстетики паблика.`;
                  } else if (query.includes('деньги') || query.includes('комисси') || query.includes('вывод')) {
                    fallbackAns += `Сделки по покупке и продаже تبلیغات (рекламы) на нашей бирже защищены смарт-депонированием. Рекламодатель спокоен, что деньги спишутся только за реальный пост, провисевший в топе нужный срок. Комиссия 25% используется для компенсации серверов и разработки новых ИИ-ассистентов.`;
                  } else if (query.includes('рерайт') || query.includes('репост') || query.includes('копир')) {
                    fallbackAns += `ИИ-Рерайтер в ИИSMM использует релевантные языковые модели со SMM-приоритетом. Он не просто заменяет слова синонимами, а форматирует лонгрид по стилю AIDA, расставляет эмодзи, выделяет абзацы жирным и структурирует списки по канонам эффективных рекламных постов.`;
                  } else {
                    fallbackAns += `Отличный рабочий вопрос! На практике в SMM для старта органического продвижения используйте бесплатные проекты взаимного пиара папок. Добавьте в папку 5 смежных блогов, запустите взаимные рассылки, и вы получите лояльную аудиторию абсолютно бесплатно в первый же день сотрудничества!`;
                  }
                  
                  setAiAnswerResult(fallbackAns);
                } finally {
                  setAiAnswering(false);
                }
              };

              return (
                <div className="lg:col-span-12 w-full space-y-6 pt-2">
                  {/* Academy Head Banner - Social Style Apple Liquid Glass */}
                  <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 border border-white/80 shadow-[0_16px_40px_rgba(236,72,153,0.08)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                    {/* Top gradient accent line */}
                    <div 
                      className="absolute top-0 inset-x-0 h-1"
                      style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                    />

                    <div className="space-y-2 max-w-xl relative z-10">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 rounded-full border border-pink-200/60 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-pink-600">
                          Интерактивное ИИ-Обучение
                        </span>
                      </div>
                      <h2 
                        className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-tight text-transparent bg-clip-text"
                        style={{ 
                          background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        Академия Своих Блогов ИИSMM
                      </h2>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Бесплатный курс от ИИ по автоматизации автопостинга, закупкам рекламы и комплексному SMM продвижению.
                      </p>
                    </div>

                    {/* Progress Counter Badge */}
                    <div 
                      className="p-[1.5px] rounded-[22px] shadow-sm shrink-0 w-full md:w-auto"
                      style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                    >
                      <div className="p-4 bg-white/95 backdrop-blur-md rounded-[20px] text-center space-y-1">
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Пройдено Уроков</p>
                        <p 
                          className="text-2xl font-black font-mono text-transparent bg-clip-text"
                          style={{ 
                            background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                        >
                          {completedLessonsCount} / {totalLessonsCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Course Categories Selection Bar - Social Liquid Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                    {academyCourses.map((c, idx) => {
                      const isSelected = selectedCourseIdx === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setSelectedCourseIdx(idx); setSelectedLessonIdx(0); setLessonQuizFeedback(null); }}
                          className={`p-[1.5px] rounded-[24px] text-left transition-all overflow-hidden ${
                            isSelected 
                              ? 'shadow-md scale-[1.005]' 
                              : 'hover:scale-[1.002] opacity-90 hover:opacity-100'
                          }`}
                          style={{
                            background: isSelected 
                              ? 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' 
                              : 'rgba(255, 255, 255, 0.8)'
                          }}
                        >
                          <div className={`p-4 sm:p-5 rounded-[22.5px] h-full transition-all ${
                            isSelected 
                              ? 'bg-white/95 text-slate-900 shadow-inner' 
                              : 'bg-white/80 backdrop-blur-md hover:bg-white text-slate-600 border border-white/60'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs"
                                style={{ background: isSelected ? 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(236,72,153,0.15) 50%, rgba(249,115,22,0.15) 100%)' : 'rgba(241, 245, 249, 0.8)' }}
                              >
                                {c.icon}
                              </div>
                              <div className="space-y-0.5">
                                <h4 
                                  className={`font-extrabold text-xs uppercase tracking-wide ${
                                    isSelected ? 'font-black' : 'text-slate-900'
                                  }`}
                                  style={isSelected ? {
                                    background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                  } : undefined}
                                >
                                  {c.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{c.description}</p>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Main Academy Working Area */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
                    {/* Left Sidebar: Lesson Selectors & AI Curator Chat */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Список уроков курса:</span>
                          <span className="text-[10px] font-bold text-pink-600 font-mono">{currentCourse.lessons.length} урока</span>
                        </div>
                        
                        <div className="space-y-2">
                          {currentCourse.lessons.map((lesson, lIdx) => {
                            const isCurrent = selectedLessonIdx === lIdx;
                            const isCompleted = lessonCompletedState[lesson.id];
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => { setSelectedLessonIdx(lIdx); setLessonQuizFeedback(null); }}
                                className={`w-full text-left transition-all rounded-[20px] overflow-hidden ${
                                  isCurrent ? 'shadow-xs' : ''
                                }`}
                                style={isCurrent ? {
                                  background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                                  padding: '1.5px'
                                } : undefined}
                              >
                                <div className={`w-full p-3.5 flex justify-between items-center transition-all ${
                                  isCurrent 
                                    ? 'bg-white text-slate-950 rounded-[18.5px]' 
                                    : 'bg-white/60 hover:bg-white text-slate-700 border border-slate-200/50 rounded-[20px]'
                                }`}>
                                  <div className="space-y-1 pr-2 text-left">
                                    <p 
                                      className={`font-black text-xs leading-tight ${
                                        !isCurrent ? 'text-slate-900' : ''
                                      }`}
                                      style={isCurrent ? {
                                        background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                      } : undefined}
                                    >
                                      {lesson.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">{lesson.excerpt}</p>
                                  </div>
                                  <div className="shrink-0">
                                    {isCompleted ? (
                                      <span 
                                        className="w-6 h-6 rounded-full p-[1.5px] flex items-center justify-center text-[10px] text-white font-bold shadow-2xs"
                                        style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                                      >
                                        <span className="w-full h-full rounded-full bg-white flex items-center justify-center text-pink-600 font-black">✓</span>
                                      </span>
                                    ) : (
                                      <span className="w-6 h-6 rounded-full bg-slate-100/80 border border-slate-200/80 flex items-center justify-center text-[10px] text-slate-400 font-bold">?</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Interactive AI Curator Panel - Liquid Glass */}
                      <div 
                        className="p-[1.5px] rounded-[28px] shadow-lg"
                        style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                      >
                        <div className="bg-white/95 backdrop-blur-2xl rounded-[26.5px] p-5 space-y-3.5">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                            <span 
                              className="text-[11px] font-black uppercase tracking-wide text-transparent bg-clip-text"
                              style={{ 
                                background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                            >
                              💬 Чат с ИИ-Преподавателем
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal font-medium">
                            Задайте любой вопрос по автоматизации постов, выводу денег, водяным знакам или охватам папок.
                          </p>
                          
                          <div className="space-y-2.5">
                            <textarea
                              value={customSmmQuestion}
                              onChange={(e) => setCustomSmmQuestion(e.target.value)}
                              placeholder="Например: Как добавить бота в канал или вывести средства с биржи?"
                              className="w-full p-3 text-xs rounded-2xl border border-slate-200/80 focus:border-pink-400 focus:outline-hidden resize-none bg-slate-50/70 font-medium text-slate-800 focus:bg-white transition-colors"
                              rows={2}
                            />
                            <button
                              onClick={handleAskAiCurator}
                              disabled={aiAnswering || !customSmmQuestion.trim()}
                              className="w-full py-2.5 hover:brightness-105 duration-200 text-white font-extrabold text-[11px] rounded-2xl uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer border border-white/30 shadow-md active:scale-98"
                              style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                            >
                              {aiAnswering ? 'ИИ Диктует... ⚡' : 'Задать вопрос ИИ-Куратору 🔮'}
                            </button>
                          </div>

                          {aiAnswering && (
                            <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl animate-pulse flex flex-col gap-2 shadow-2xs">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce duration-1000 delay-100" />
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce duration-1000 delay-200" />
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce duration-1000 delay-300" />
                                <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase tracking-wider font-mono">Составляю разбор...</span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="h-2 bg-slate-200/85 rounded-full w-[95%] animate-pulse" />
                                <div className="h-2 bg-slate-200/85 rounded-full w-[85%] animate-pulse" />
                                <div className="h-2 bg-slate-200/85 rounded-full w-[40%] animate-pulse" />
                              </div>
                            </div>
                          )}

                          {!aiAnswering && aiAnswerResult && (
                            <div 
                              className="p-[1.5px] rounded-2xl animate-fade-in shadow-2xs"
                              style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                            >
                              <div className="p-4 bg-white/95 rounded-[14.5px] text-[11px] text-slate-800 leading-relaxed font-medium">
                                <MarkdownRenderer content={aiAnswerResult} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Active Lesson Content & Quiz Test */}
                    <div className="lg:col-span-8 space-y-4">
                      {/* Active Lesson Text Reader */}
                      <div 
                        className="p-[1.5px] rounded-[28px] shadow-lg"
                        style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                      >
                        <div className="bg-white/95 backdrop-blur-2xl rounded-[26.5px] p-6 sm:p-8 space-y-5">
                          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-4">
                            <h3 
                              className="font-black text-base sm:text-lg uppercase tracking-tight text-transparent bg-clip-text"
                              style={{ 
                                background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                            >
                              {currentLesson.title}
                            </h3>
                            <div className="flex gap-2">
                              <span className="px-2.5 py-1 bg-gradient-to-r from-sky-50 to-pink-50 text-pink-600 rounded-xl text-[10px] font-bold border border-pink-200/50">ИИ Курс</span>
                              <span className="px-2.5 py-1 bg-gradient-to-r from-pink-50 to-orange-50 text-orange-600 rounded-xl text-[10px] font-bold border border-orange-200/50">Бесплатно</span>
                            </div>
                          </div>

                          {/* Lesson text */}
                          <div className="text-xs sm:text-sm text-slate-700 space-y-3 font-normal font-sans leading-relaxed whitespace-pre-wrap">
                            {currentLesson.content}
                          </div>

                          {/* Interactive Quiz Zone */}
                          <div className="mt-6 pt-5 border-t border-slate-150 space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="text-pink-500 text-base">🎓</span>
                              <h4 
                                className="font-extrabold text-xs uppercase tracking-wide text-transparent bg-clip-text"
                                style={{ 
                                  background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent'
                                }}
                              >
                                Экспресс-Проверка пройденного материала:
                              </h4>
                            </div>
                            <p className="font-extrabold text-slate-800 text-xs sm:text-sm">{currentLesson.question}</p>

                            <div className="grid grid-cols-1 gap-2.5">
                              {currentLesson.options.map((opt, oIdx) => {
                                const selectedAnswer = lessonQuizAnswers[lessonKey];
                                const isThisSelected = selectedAnswer === oIdx;
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => handleAnswerSelect(oIdx)}
                                    className={`w-full text-left text-xs transition-all font-semibold rounded-2xl overflow-hidden ${
                                      isThisSelected ? 'shadow-xs' : ''
                                    }`}
                                    style={isThisSelected ? {
                                      background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                                      padding: '1.5px'
                                    } : undefined}
                                  >
                                    {isThisSelected ? (
                                      <div 
                                        className="w-full p-3.5 text-white font-extrabold rounded-[14.5px] shadow-sm"
                                        style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                                      >
                                        {opt}
                                      </div>
                                    ) : (
                                      <div className="w-full border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 p-3.5 rounded-2xl transition-colors">
                                        {opt}
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {lessonQuizFeedback && (
                              <div 
                                className="p-[1.5px] rounded-2xl mt-3 shadow-2xs"
                                style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                              >
                                <div className="p-4 bg-white rounded-[14.5px] text-slate-800 font-semibold text-xs space-y-1.5">
                                  <p className="leading-relaxed whitespace-pre-wrap">{lessonQuizFeedback}</p>
                                  {lessonQuizFeedback.includes('🎉') && (
                                    <p 
                                      className="text-[10px] font-black font-mono uppercase tracking-wider text-transparent bg-clip-text"
                                      style={{ 
                                        background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                      }}
                                    >
                                      Урок зачтен! Прогресс обновлен.
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          </motion.div>
        </AnimatePresence>

        {/* 3. Global Promotional Features Panel under each landing view */}
        <div className="mt-12 p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm text-center space-y-4 max-w-4xl mx-auto">
          <h3 
            className="text-xl sm:text-2xl font-black tracking-tight leading-none uppercase text-transparent bg-clip-text inline-block"
            style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Быстрый Старт
          </h3>
          <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed font-semibold">
            Начисляем <strong>300 ИИрок каждый месяц бесплатно</strong>! Полный безлимит отложенного автопостинга и каналов без ИИ, умные ИИ-сценарии 24/7 и участие в папках взаимного пиара.
          </p>
          <div className="flex justify-center pt-2">
            <button
              id="cta-btn-landing-auth"
              onClick={() => {
                if (isLoggedIn) {
                  onNavigate('/profile');
                } else {
                  setShowTelegramModal(true);
                }
              }}
              className="px-8 py-4 hover:scale-103 text-white font-black text-xs rounded-2xl shadow-xl border border-white/40 transition-all uppercase tracking-wide flex items-center gap-2.5 cursor-pointer"
              style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 23%, #f97316 50%, #ec4899 77%, #38bdf8 100%)' }}
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current shrink-0">
                <path d="M19.897 5.115l-17.1 6.59c-1.17.47-1.16 1.12-.22 1.41l4.39 1.37 10.16-6.41c.48-.29.92-.13.56.19l-8.24 7.44-.32 4.79c.47 0 .68-.21.94-.47l2.25-2.19 4.68 3.46c.86.48 1.48.23 1.69-.8l3.07-14.47c.31-1.26-.48-1.83-1.32-1.37z" />
              </svg>
              {isLoggedIn ? 'Перейти в личный кабинет 🚀' : 'Начать бесплатно на тарифе СТАРТ 🚀'}
            </button>
          </div>
        </div>

      </main>

      {/* 4. Realistic Telegram & E-mail Auth Glass Dialog Simulator */}
      {showTelegramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/20 backdrop-blur-[2px] overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto apple-liquid-glass-heavy rounded-[28px] shadow-2xl border border-white/60 p-1 bg-white/95 backdrop-blur-md custom-scrollbar my-auto"
          >
            {/* Header */}
            <div 
              className="p-4 sm:p-5 rounded-[24px] text-white flex items-center justify-between shadow-md border border-white/25"
              style={{ background: 'linear-gradient(90deg, rgba(56,189,248,0.95) 0%, rgba(236,72,153,0.95) 25%, rgba(249,115,22,0.95) 50%, rgba(236,72,153,0.95) 75%, rgba(56,189,248,0.95) 100%)' }}
            >
              <div className="flex items-center gap-2.5">
                <h4 className="font-extrabold text-sm tracking-tight text-white">300 ИИрок бесплатно</h4>
              </div>
              <button 
                onClick={() => { setShowTelegramModal(false); setStep(1); setAuthError(''); setAuthSuccessMsg(''); }}
                className="text-white hover:text-orange-50 font-extrabold text-xs bg-white/20 hover:bg-white/30 p-1.5 px-2.5 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-4 pt-3 flex gap-1 border-b border-slate-200/60 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => { setAuthTab('email_register'); setAuthError(''); setAuthSuccessMsg(''); }}
                className={`px-3 py-2 text-[11px] font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
                  authTab === 'email_register'
                    ? 'bg-white text-orange-600 border-t border-x border-slate-200 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📝 Регистрация
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('email_login'); setAuthError(''); setAuthSuccessMsg(''); }}
                className={`px-3 py-2 text-[11px] font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
                  authTab === 'email_login'
                    ? 'bg-white text-orange-600 border-t border-x border-slate-200 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ✉️ Вход E-mail
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Alert Notifications */}
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl animate-shake space-y-1">
                  <div>⚠️ {authError}</div>
                  {authTab === 'email_login' && (
                    <button
                      type="button"
                      onClick={() => { setAuthTab('forgot_password'); setAuthError(''); }}
                      className="text-[10px] text-orange-600 font-bold hover:underline cursor-pointer block pt-0.5"
                    >
                      Забыли пароль? Восстановить доступ ➔
                    </button>
                  )}
                </div>
              )}
              {authSuccessMsg && (
                <div className="p-3 bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 border border-pink-200 text-slate-800 text-xs font-semibold rounded-xl">
                  {authSuccessMsg}
                </div>
              )}

              {/* TAB: TELEGRAM MINI APP LINK */}
              {authTab === 'telegram' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200/80 text-sky-950 text-xs leading-relaxed font-semibold space-y-2">
                    <p className="font-extrabold text-sky-900 text-sm">📱 Авторизация через Telegram Mini App</p>
                    <p>Для моментальной регистрации и безопасного входа через Telegram используйте прямую ссылку на приложение в боте <strong>@IIrkiBot</strong>.</p>
                  </div>

                  <a 
                    href={`https://t.me/IIrkiBot/app?startapp=${refCode || '169262990'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all text-center uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-98"
                    style={{ background: 'linear-gradient(120deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current shrink-0">
                      <path d="M19.897 5.115l-17.1 6.59c-1.17.47-1.16 1.12-.22 1.41l4.39 1.37 10.16-6.41c.48-.29.92-.13.56.19l-8.24 7.44-.32 4.79c.47 0 .68-.21.94-.47l2.25-2.19 4.68 3.46c.86.48 1.48.23 1.69-.8l3.07-14.47c.31-1.26-.48-1.83-1.32-1.37z" />
                    </svg>
                    <span>Открыть Telegram Mini App @IIrkiBot 🚀</span>
                  </a>
                </div>
              )}

              {/* TAB 2: EMAIL LOGIN */}
              {authTab === 'email_login' && (
                <form onSubmit={handleEmailLoginSubmit} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block tracking-wider">E-mail адрес</label>
                    <input 
                      type="email" 
                      placeholder="user@example.com" 
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 focus:outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-500 font-bold block tracking-wider">Пароль</label>
                      <button 
                        type="button" 
                        onClick={() => { setAuthTab('forgot_password'); setAuthError(''); }}
                        className="text-[10px] text-orange-600 font-bold hover:underline cursor-pointer"
                      >
                        Забыли пароль?
                      </button>
                    </div>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 focus:outline-none font-medium"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={authLoading}
                    className="w-full py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all text-center uppercase tracking-wider disabled:opacity-50"
                    style={{ background: 'linear-gradient(120deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                  >
                    {authLoading ? 'Вход...' : 'Войти в аккаунт ➔'}
                  </button>
                </form>
              )}

              {/* TAB 3: REGISTER */}
              {authTab === 'email_register' && (
                <div className="space-y-3 text-xs">
                  <a 
                    href={`https://t.me/IIrkiBot/app?startapp=${refCode || '169262990'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all text-center uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-98"
                    style={{ background: 'linear-gradient(120deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current shrink-0">
                      <path d="M19.897 5.115l-17.1 6.59c-1.17.47-1.16 1.12-.22 1.41l4.39 1.37 10.16-6.41c.48-.29.92-.13.56.19l-8.24 7.44-.32 4.79c.47 0 .68-.21.94-.47l2.25-2.19 4.68 3.46c.86.48 1.48.23 1.69-.8l3.07-14.47c.31-1.26-.48-1.83-1.32-1.37z" />
                    </svg>
                    <span>Быстрая регистрация Telegram 🚀</span>
                  </a>

                  <form onSubmit={handleEmailRegisterSubmit} className="space-y-3.5 text-xs">
                    {refCode && (
                      <div className="p-2.5 bg-gradient-to-r from-orange-50 to-pink-50 border border-pink-200/60 rounded-xl flex items-center justify-between text-[11px] text-pink-900 font-bold">
                        <span className="flex items-center gap-1.5">
                          <span>🎁 Реферер:</span>
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-pink-200 text-pink-700 font-black">{refCode}</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-extrabold">+300 ИИрок пригласившему</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block tracking-wider">Ваше имя</label>
                      <input 
                        type="text" 
                        placeholder="Иван Петров" 
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 focus:outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block tracking-wider">E-mail адрес</label>
                      <input 
                        type="email" 
                        placeholder="user@example.com" 
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 focus:outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block tracking-wider">Придумайте пароль</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        required
                        minLength={4}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 focus:outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block tracking-wider">Повторите пароль</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={confirmPasswordInput}
                        onChange={e => setConfirmPasswordInput(e.target.value)}
                        required
                        minLength={4}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 focus:outline-none font-medium"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={authLoading}
                      className="w-full py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all text-center uppercase tracking-wider disabled:opacity-50"
                      style={{ background: 'linear-gradient(120deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                    >
                      {authLoading ? 'Регистрация...' : 'Зарегистрироваться 🚀'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: FORGOT PASSWORD */}
              {authTab === 'forgot_password' && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5 text-xs">
                  <div className="p-3 bg-sky-50/80 rounded-2xl border border-sky-200/80 text-sky-900 text-[11px] leading-relaxed font-semibold">
                    🔑 Укажите ваш E-mail. Система сгенерирует токен сброса доступа и отправит письмо с кнопкой сброса через SMTP сервер.
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block tracking-wider">Ваш E-mail</label>
                    <input 
                      type="email" 
                      placeholder="user@example.com" 
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 focus:outline-none font-medium"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={authLoading}
                    className="w-full py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all text-center uppercase tracking-wider disabled:opacity-50"
                    style={{ background: 'linear-gradient(120deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                  >
                    {authLoading ? 'Отправка...' : 'Отправить кнопку сброса via SMTP ✉️'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('email_login'); setAuthError(''); }}
                    className="w-full text-center text-[10px] text-slate-500 hover:text-slate-800 font-bold pt-1 cursor-pointer block"
                  >
                    ← Вернуться ко входу
                  </button>
                </form>
              )}
            </div>

            {/* Footer / Disclaimer */}
            <div className="p-3 bg-white/40 rounded-b-[24px] border-t text-center text-[9px] text-slate-500">
              Нажимая кнопку, вы соглашаетесь с <a href="/oferta" className="underline text-sky-600 hover:text-sky-700 font-bold cursor-pointer transition-all">договором оферты</a>.
            </div>
          </motion.div>
        </div>
      )}

      {/* 4.5 Terms of Service Elegant Glass Sheet Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-transparent backdrop-blur-[2px]">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg apple-liquid-glass-heavy rounded-[28px] overflow-hidden shadow-2xl border border-white/60 p-1 bg-white/80 backdrop-blur-md"
          >
            <div className="bg-gradient-to-r from-orange-400 via-pink-500 to-sky-450 p-5 rounded-[24px] text-white flex items-center justify-between shadow-md border border-white/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center transition-all shadow-inner">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight leading-none text-white">Условия обслуживания</h4>
                  <span className="text-[10px] text-orange-50/90 block mt-1 font-mono">Документ: ИИSMM_API_v2.0_2026</span>
                </div>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-white hover:text-orange-50 font-extrabold text-xs bg-white/10 hover:bg-white/20 p-1.5 px-2.5 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto text-xs text-slate-700 leading-relaxed scrollbar-thin scrollbar-thumb-slate-200">
              <h5 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">1. Общие положения</h5>
              <p>
                Использование интеллектуальной платформы автоматического постинга и комбайна ИИSMM API регулируется данным соглашением. Подключая свой аккаунт через Telegram-бот <strong><a href="https://t.me/IIrkiBot" target="_blank" rel="noopener noreferrer" className="text-pink-650 hover:underline">@IIrkiBot</a></strong>, вы получаете доступ к автономному облачному генератору контента, планировщику, рерайтеру ссылок и внутреннему кошельку ИИрок.
              </p>

              <h5 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">2. Безопасность и Telegram API</h5>
              <p>
                Авторизация осуществляется моментально через официальный безопасный протокол и не запрашивает личные пароли от мессенджера Telegram. Система использует защищенный шлюз сквозного шифрования для публикации в ваши каналы, групповые чаты и личные блоги. Вы сохраняете полный контроль над правами бота-администратора.
              </p>

              <h5 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">3. Правила использования ИИрок и Эскроу</h5>
              <p>
                Внутренние токены (ИИрки) используются для оплаты генерации текстов, ИИ-дизайна холстов, SMM-анализа и участия в совместных закупках (Промо-пулах). Пулы регулируются смарт-контрактами эскроу-сделок, гарантируя возврат средств в случае невыполнения условий организаторами.
              </p>

              <h5 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">4. Ограничение ответственности</h5>
              <p>
                Платформа ИИSMM не несет ответственности за характер публикуемого пользователями контента. Пожалуйста, соблюдайте нормы законодательства Российской Федерации и правила целевых социальных платформ (Telegram, ВК, Одноклассники, Сетка) при генерации текстов нейросетью.
              </p>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-sky-950 text-[10px] font-semibold text-center mt-2">
                ⚡ ИИSMM — Автономия вашего медиа-бизнеса в цифровую эпоху 2026.
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 rounded-b-[24px] border-t flex items-center justify-between gap-4">
              <span className="text-[9px] text-slate-400 font-mono">Обновлено: 26 мая 2026 г.</span>
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-sky-450 hover:opacity-95 text-white font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer shadow-sm"
              >
                Согласен с условиями
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 5. Pure Landing Footer on landing page */}
      <footer className="mt-auto py-10 bg-white/50 backdrop-blur-xl text-slate-700 border-t border-white/60 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-xs font-semibold">
          
          {/* Brand & Copy */}
          <div className="flex flex-col gap-2 max-w-xs">
            <div className="flex items-center gap-3">
              <ShinyLogo height={32} />
            </div>
            <p className="text-slate-500 font-medium text-[11px] leading-snug">
              &copy; 2026 ИИSMM. Все права защищены.
            </p>
            <span className="font-mono text-[10px] text-slate-400">Платформа SMM-автопостинга v1.4.1</span>
          </div>

          {/* Requisites Block */}
          <div className="text-left text-[11px] text-slate-600 space-y-1 bg-white/70 p-4 rounded-2xl border border-white/90 shadow-2xs w-full md:w-auto">
            <div className="font-bold text-slate-900 text-xs">ООО «РентРоп»</div>
            <div><span className="text-slate-400">Юридический адрес:</span> г . Москва, пер. Духовской, д. 17, стр. 15, помещ. 11Н/2</div>
            <div className="flex flex-wrap gap-x-4">
              <span><span className="text-slate-400">ОГРН:</span> 1217700234157</span>
              <span><span className="text-slate-400">ИНН:</span> 7726477438</span>
            </div>
            <div>
              <span className="text-slate-400">E-mail:</span>{' '}
              <a href="mailto:info@arenda-ropa.com" className="text-sky-600 hover:underline font-bold">
                info@arenda-ropa.com
              </a>
            </div>
            <div className="pt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs border-t border-pink-100/80">
              <a 
                href="/oferta" 
                onClick={(e) => { e.preventDefault(); onNavigate('/oferta'); }}
                className="text-pink-600 hover:text-pink-700 font-bold underline cursor-pointer"
              >
                📄 Публичная оферта и регламент ИИрок
              </a>
              <a 
                href="/tarif/pay" 
                onClick={(e) => { e.preventDefault(); onNavigate('/tarif/pay'); }}
                className="text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer"
              >
                🪙 Тарифы и оплата ИИрок
              </a>
            </div>
          </div>

          {/* Action Links & Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
            <a 
              href="https://rent-rop.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 hover:scale-102 border border-white/20"
              style={{ background: 'linear-gradient(120deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
            >
              🌐 Продукт компании РентРОП
            </a>
            <a 
              href="https://t.me/+Ebz9dE5gS1plNDRi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 hover:scale-102 border border-white/20"
              style={{ background: 'linear-gradient(120deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
            >
              💬 Чат техподдержки
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}
