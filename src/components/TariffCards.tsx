import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Sparkles, Check } from 'lucide-react';

export interface TariffPlan {
  name: string;
  price: string;
  sub: string;
  continuation?: string;
  amountRub: number;
  features: { title: string; desc: string }[];
}

export const TARIFF_PLANS: TariffPlan[] = [
  {
    name: "СТАРТ",
    price: "0 ИИрок",
    sub: "Старт без вложений",
    amountRub: 0,
    features: [
      {
        title: "Безлимитно постов и каналов без ИИ",
        desc: "Полный безлимит по количеству каналов и постов при ручной публикации или автопланировании отложенных постов в календарь."
      },
      {
        title: "300 ИИрок каждый месяц бесплатно",
        desc: "Хватит на 190 рерайтов через ИИ или 30 постов с ИИ бесплатно (на каждый день для канала)!"
      },
      {
        title: "Умные ИИ-сценарии автопостинга 24/7",
        desc: "Автономные цепочки: регулярный выбор темы ➔ генерация текста с форматированием Markdown V2 ➔ подбор обложки ➔ постановка в календарь."
      },
      {
        title: "Участие в папках и подборах",
        desc: "Автоматическое участие ваших Telegram-каналов в тематических папках и подборках взаимного пиара для роста подписчиков."
      },
      {
        title: "Докупка ИИрок в любой момент",
        desc: "Если вам требуются дополнительные нейро-тексты или генерации обложек, докупайте ИИрки в любом удобном объёме без смены тарифа."
      },
      {
        title: "Конструктор Markdown V2 & Rich",
        desc: "Визуальный редактор Telegram-постов со спойлерами, форматированием текста, ссылками и красивыми цветными inline-кнопками."
      },
      {
        title: "Облачная медиагалерея & Хостинг",
        desc: "Загрузка и бесплатное хранение фото, GIF-анимаций и видеофайлов с сохранением оригинального качества."
      },
      {
        title: "Интерактивный календарь постов",
        desc: "Удобный планировщик публикаций с наглядной сеткой выходов на месяц и автоотправкой постов точно в срок."
      }
    ]
  },
  {
    name: "РАЗГОН",
    price: "990 ИИрок / мес",
    sub: "Хватит на несколько каналов или несколько ежедневных постов",
    continuation: "Все возможности тарифа СТАРТ, плюс:",
    amountRub: 990,
    features: [
      {
        title: "990 ИИрок на баланс каждый месяц",
        desc: "Пакет 990 ИИрок в месяц (1 ₽ = 1 ИИрка) — хватит на несколько каналов или несколько ежедневных ИИ-постов и нейро-обложек."
      },
      {
        title: "Нейро-копирайтер & Рерайт с ИИ стилем",
        desc: "Мгновенный рерайт постов конкурентов и генерация уникального контента в фирменном стиле вашего бренда."
      },
      {
        title: "Память прошлых постов и серийность",
        desc: "Нейросеть помнит прошлые публикации, исключает дубли и предлагает логическое продолжение рубрик."
      },
      {
        title: "20+ ИИ-Ассистентов",
        desc: "Персональные агенты (AIDA Копирайтер, Редактор офферов, SMM Стратег) для написания постов под любые ниши."
      },
      {
        title: "Значок Радужного Сердца ❤️ в профиле",
        desc: "Выделенная SVG иконка радужного сердечка над аватаром профиля для всех пользователей тарифов выше Старта."
      }
    ]
  },
  {
    name: "ОТРЫВ",
    price: "4,900 ИИрок / мес",
    sub: "Хватит на десяток каналов",
    continuation: "Все возможности тарифа РАЗГОН, плюс:",
    amountRub: 4900,
    features: [
      {
        title: "4,900 ИИрок на баланс каждый месяц",
        desc: "Мощный баланс 4,900 ИИрок в месяц (1 ₽ = 1 ИИрка) — хватит на ведение десятка каналов с автопилотом, ИИ-сценариями и иллюстрациями."
      },
      {
        title: "Полный автопилот контент-планирования",
        desc: "Автоматическое составление контент-плана на месяцы вперёд с автогенерацией текстов, кнопок и медиафайлов."
      },
      {
        title: "Голосовое управление кабинетом",
        desc: "Возможность надиктовать мысли голосом — ИИ превратит их в готовый структурированный пост с идеальным форматированием."
      },
      {
        title: "Мультиплеер (командный доступ)",
        desc: "Совместная работа нескольких SMM-специалистов и контент-мейкеров в одном рабочем кабинете."
      },
      {
        title: "Подключение собственных API ключей для ИИ",
        desc: "Возможность использовать свои API ключи OpenAI / Gemini без расхода баланса ИИрок."
      },
      {
        title: "ProTalk API: ИИ-Автоответчик постов",
        desc: "Автоматические умные ответы и автокомментирование публикаций в каналах через интеграцию с ProTalk API (эксклюзивно для тарифа Отрыв)."
      },
      {
        title: "Продвижение постов в соцсети ИИрки",
        desc: "Приоритетное размещение и вывод публикаций в топ Ленты социальной сети платформы."
      }
    ]
  },
  {
    name: "КОСМОС",
    price: "Индивидуально",
    sub: "Индивидуальная разработка под ключ",
    continuation: "Все возможности тарифа ОТРЫВ, плюс:",
    amountRub: 15000,
    features: [
      {
        title: "Любой объем ИИрок под задачи",
        desc: "Персональный баланс ИИрок под масштабы вашего бизнеса с приоритетным выделенным GPU сервером."
      },
      {
        title: "Разработка брендбука и SMM-стратегии",
        desc: "Глубокая проработка позиционирования бренда, ИИ стиля и дизайна контента экспертами платформы."
      },
      {
        title: "Индивидуальный контент-план под ключ",
        desc: "Составление стратегии продвижения и материалов персональной командой редакторов."
      },
      {
        title: "Кастомная ИИ-разработка",
        desc: "Индивидуальное создание ИИ-агентов, парсеров, специализированных Telegram-ботов и ведение внешних систем."
      },
      {
        title: "Интеграции с любыми соцсетями",
        desc: "Специфические связки и автокросспостинг в любые внешние платформы и корпоративные CRM."
      }
    ]
  }
];

interface TariffCardsProps {
  onAction?: (planName: string, priceText: string, amountRub: number) => void;
  buttonText?: string;
  userTariff?: string;
}

export default function TariffCards({ onAction, buttonText = "Подключить", userTariff }: TariffCardsProps) {
  const [selectedFeature, setSelectedFeature] = useState<{ title: string; desc: string; planName: string } | null>(null);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [currentFeatureLimit, setCurrentFeatureLimit] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let timer: NodeJS.Timeout;
    
    const step = () => {
      const currentCard = TARIFF_PLANS[activeCardIdx];
      if (!currentCard) return;

      if (currentFeatureLimit < currentCard.features.length) {
        setCurrentFeatureLimit(prev => prev + 1);
      } else {
        if (activeCardIdx < TARIFF_PLANS.length - 1) {
          setActiveCardIdx(prev => prev + 1);
          setCurrentFeatureLimit(0);
        }
      }
    };

    timer = setTimeout(step, 100);
    return () => clearTimeout(timer);
  }, [activeCardIdx, currentFeatureLimit, hasStarted]);

  return (
    <div ref={containerRef} className="space-y-5 w-full relative text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch px-4 min-h-[500px]">
        {TARIFF_PLANS.map((plan, idx) => {
          const isCardVisible = idx <= activeCardIdx;
          if (!isCardVisible) return null;

          const visibleFeaturesCount = idx < activeCardIdx ? plan.features.length : currentFeatureLimit;
          const isCurrentPlanActive = userTariff === (plan.name === 'СТАРТ' ? 'free' : plan.name === 'РАЗГОН' ? 'pro' : plan.name === 'ОТРЫВ' ? 'vip' : 'none');

          return (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`apple-liquid-glass rounded-3xl p-6 border flex flex-col justify-between space-y-5 relative transition-all duration-300 hover:scale-102 shadow-sm ${
                isCurrentPlanActive 
                  ? 'border-orange-500 ring-2 ring-orange-400/30 bg-orange-50/20' 
                  : 'border-slate-200/60 bg-white/40'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-800 uppercase">
                      {plan.name}
                    </h3>
                    {isCurrentPlanActive && (
                      <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black rounded-full uppercase">
                        Текущий
                      </span>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-multicolor-gradient mt-1">
                    {plan.price}
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-medium mt-1 leading-snug">{plan.sub}</p>
                </div>

                {plan.continuation && (
                  <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-multicolor-gradient bg-transparent py-0.5 text-left">
                    ✨ {plan.continuation}
                  </div>
                )}

                <ul className="space-y-1.5 text-[10.5px] text-slate-600 font-semibold pt-2 border-t border-slate-200/55">
                  {plan.features.slice(0, visibleFeaturesCount).map((feat, fIdx) => (
                    <motion.li 
                      key={fIdx} 
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      onClick={() => setSelectedFeature({ title: feat.title, desc: feat.desc, planName: plan.name })}
                      className="flex items-start justify-between gap-1.5 leading-normal cursor-pointer p-1.5 rounded-xl hover:bg-white/80 hover:shadow-xs transition-all group"
                      title="Нажмите для просмотра подробностей"
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="text-sky-500 shrink-0 select-none mt-0.5">✦</span>
                        <span className="text-slate-700 font-medium group-hover:text-pink-600 transition-colors text-left">{feat.title}</span>
                      </div>
                      <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-500 shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => onAction && onAction(plan.name, plan.price, plan.amountRub)} 
                className="w-full py-3.5 text-white font-black text-[11px] uppercase rounded-xl tracking-wider shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer active:translate-y-0 mt-4 flex items-center justify-center gap-1.5 bg-multicolor-gradient hover:opacity-95"
              >
                <span>{plan.name === 'СТАРТ' ? 'Бесплатно' : buttonText}</span>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Feature details modal */}
      <AnimatePresence>
        {selectedFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-3 text-left"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                  Тариф {selectedFeature.planName}
                </span>
                <button 
                  onClick={() => setSelectedFeature(null)} 
                  className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 leading-snug">{selectedFeature.title}</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{selectedFeature.desc}</p>
              <button 
                onClick={() => setSelectedFeature(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl mt-2 cursor-pointer"
              >
                Понятно
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
