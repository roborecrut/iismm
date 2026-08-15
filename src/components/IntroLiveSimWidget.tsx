import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, FileText, Check, Image, Settings, Clock, Send, Radio } from 'lucide-react';

export default function IntroLiveSimWidget() {
  const [activeStep, setActiveStep] = useState(0);

  // Transition between scenario stages automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      id="intro-live-showroom" 
      className="w-full h-[585px] min-h-[585px] max-h-[585px] bg-white/95 backdrop-blur-2xl text-slate-800 rounded-3xl border border-white/90 shadow-2xl p-4 sm:p-6 flex flex-col justify-between relative shrink-0 z-20 overflow-hidden group/sim"
    >
      {/* Dynamic ambient glowing background sphere */}
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-pink-400/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-orange-400/15 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-multicolor-gradient text-white rounded-full text-[9.5px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-spin" />
            Сценарий ИИSMM
          </div>
        </div>
        <span className="text-[10px] font-mono font-extrabold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
          Шаг {activeStep + 1} / 3
        </span>
      </div>

      {/* Active Stage Renderer - inner container allows smooth overflow/scrolling without enlarging outer box */}
      <div className="flex-1 flex flex-col justify-start py-2 overflow-y-auto no-scrollbar scrollbar-none z-10 relative my-1">
        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div
              key="step-settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-3 text-left"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-500" />
                <h4 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">
                  Шаг 1: Задание параметров канала Telegram, расписания и ИИ стиля
                </h4>
              </div>

              <div className="space-y-2 bg-white/90 p-3.5 rounded-2xl border border-slate-200/70 shadow-xs text-xs font-medium">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-400 font-mono text-[10px]">Telegram-канал:</span>
                  <span className="font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">@neuro_smm_official ✈️</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-400 font-mono text-[10px]">Расписание выхода:</span>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">Ежедневно в 10:00, 15:00, 19:30</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono text-[10px]">ИИ стиль:</span>
                  <span className="font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">Экспертный + Вдохновляющий ✨</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-pink-200/60 text-[10.5px] font-bold text-slate-800 bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 shadow-xs">
                <Check className="w-4 h-4 text-pink-500 shrink-0" />
                <span>Сценарий сохранён. ИИ готовит публикацию по расписанию 24/7!</span>
              </div>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div
              key="step-generate"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-2.5 text-left"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pink-500" />
                <h4 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">
                  Шаг 2: Предпоказ Rich-сообщения в Telegram (Картинка, Текст и Кнопки)
                </h4>
              </div>

              {/* Telegram Rich Post Live Preview Card (Light Theme) */}
              <div className="bg-gradient-to-b from-sky-50/90 to-white text-slate-800 p-3.5 rounded-2xl border border-sky-100/90 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-b border-sky-100/80 pb-1.5">
                  <span className="font-extrabold text-sky-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-500" /> Предпоказ поста Telegram (Rich)
                  </span>
                  <span className="text-white font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide shadow-xs" style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}>Готов к отправке</span>
                </div>

                {/* Telegram Message Bubble */}
                <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 space-y-2 shadow-xs">
                  {/* Brand Logo Header Image */}
                  <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-orange-50 via-pink-50 to-sky-50 p-3 flex items-center justify-center border border-slate-100">
                    <img 
                      src="/file/9/iismmlogo.png" 
                      alt="ИИSMM Логотип" 
                      className="h-8 sm:h-10 object-contain drop-shadow-xs"
                    />
                  </div>

                  {/* Message Text Body */}
                  <div className="text-[11px] text-slate-700 leading-relaxed space-y-1 font-sans">
                    <p className="font-extrabold text-slate-900">
                      🚀 <strong>Автопостинг нового поколения с ИИSMM!</strong>
                    </p>
                    <p className="text-slate-600">
                      Нейросеть сгенерировала текст под ваш <span className="text-pink-600 font-bold">ИИ стиль</span>, подобрала хештеги и закомпоновала элементы.
                    </p>
                    <p className="text-slate-500 italic text-[10px] pt-0.5">
                      ✨ Секретный бонус для подписчиков канала активирован
                    </p>
                  </div>

                  {/* Telegram Inline Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[10px] font-extrabold text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>🔗 Читать статью</span>
                    </a>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="py-1.5 px-2 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-[10px] font-extrabold text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>🔥 Подписаться</span>
                    </a>
                  </div>

                  {/* Message Footer timestamp */}
                  <div className="flex justify-end items-center gap-1 text-[9px] text-slate-400 font-mono pt-0.5">
                    <span>19:30</span>
                    <span className="text-sky-500">✓✓</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              key="step-calendar"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-3 text-left"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-500" />
                <h4 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">
                  Шаг 3: Авто-постановка поста в интерактивный календарь Telegram
                </h4>
              </div>

              <div className="space-y-2 bg-white/90 p-3.5 rounded-2xl border border-slate-200/70 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold p-2 bg-sky-50/80 rounded-xl border border-sky-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span className="text-slate-800">Сегодня, 19:30</span>
                  </div>
                  <span className="px-2 py-0.5 text-white rounded text-[9px] font-black uppercase shadow-xs" style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}>
                    Запланирован ✈️
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold p-2 bg-slate-50 rounded-xl border border-slate-150 opacity-80">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-700">Завтра, 10:00</span>
                  </div>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-[9px] font-bold uppercase">
                    В очереди ИИ
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-100 to-pink-100 p-2.5 rounded-xl border border-pink-200/60 text-[10.5px] font-black text-slate-800">
                <Radio className="w-3.5 h-3.5 text-pink-600 animate-pulse" />
                <span>Автопостинг Telegram активирован: Все посты выходят вовремя!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SMM Platform Stepper Dots */}
      <div className="flex justify-between items-center border-t border-slate-200/50 pt-3 mt-2">
        <span className="text-[10px] text-slate-500 font-extrabold uppercase">Умный сценарий ИИSMM</span>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeStep ? 'w-7 bg-multicolor-gradient' : 'w-2.5 bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
