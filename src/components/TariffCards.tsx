import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Sparkles, Check, X, ShieldCheck } from 'lucide-react';
import { TariffRecord } from '../types';

export interface TariffPlan {
  id?: string;
  name: string;
  price: string;
  sub: string;
  continuation?: string;
  amountRub: number;
  monthlyIirky?: number;
  features: { title: string; desc: string }[];
}

export const DEFAULT_TARIFF_PLANS: TariffPlan[] = [
  {
    id: 'start',
    name: "Старт",
    price: "0 ИИрок",
    sub: "Старт без вложений",
    amountRub: 0,
    monthlyIirky: 300,
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
        title: "Облачная медиагалерея и хостинг",
        desc: "Загрузка и бесплатное хранение фото, анимаций и видеофайлов с сохранением оригинального качества."
      },
      {
        title: "Интерактивный календарь постов",
        desc: "Удобный планировщик публикаций с наглядной сеткой выходов на месяц и автоотправкой постов точно в срок."
      }
    ]
  },
  {
    id: 'razgon',
    name: "Разгон",
    price: "990 ИИрок / мес",
    sub: "Хватит на несколько каналов или несколько ежедневных постов",
    continuation: "Все возможности тарифа Старт, плюс:",
    amountRub: 990,
    monthlyIirky: 990,
    features: [
      {
        title: "990 ИИрок на баланс каждый месяц",
        desc: "Пакет 990 ИИрок в месяц (1 ₽ = 1 ИИрка) — хватит на несколько каналов или несколько ежедневных ИИ-постов и нейро-обложек."
      },
      {
        title: "Нейро-копирайтер и рерайт с ИИ стилем",
        desc: "Мгновенный рерайт постов конкурентов и генерация уникального контента в фирменном стиле вашего бренда."
      },
      {
        title: "Память прошлых постов и серийность",
        desc: "Нейросеть помнит прошлые публикации, исключает дубли и предлагает логическое продолжение рубрик."
      },
      {
        title: "20+ ИИ-Ассистентов",
        desc: "Персональные агенты (AIDA копирайтер, редактор офферов, SMM стратег) для написания постов под любые ниши."
      },
      {
        title: "Значок радужного сердца в профиле",
        desc: "Выделенная иконка радужного сердечка над аватаром профиля для всех пользователей тарифов выше Старта."
      }
    ]
  },
  {
    id: 'otryv',
    name: "Отрыв",
    price: "4,900 ИИрок / мес",
    sub: "Хватит на десяток каналов",
    continuation: "Все возможности тарифа Разгон, плюс:",
    amountRub: 4900,
    monthlyIirky: 4900,
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
        desc: "Автоматические умные ответы и автокомментирование публикаций в каналах через интеграцию с ProTalk API."
      },
      {
        title: "Продвижение постов в соцсети ИИрки",
        desc: "Приоритетное размещение и вывод публикаций в топ ленты социальной сети платформы."
      }
    ]
  },
  {
    id: 'cosmos',
    name: "Космос",
    price: "Индивидуально",
    sub: "Индивидуальная разработка под ключ",
    continuation: "Все возможности тарифа Отрыв, плюс:",
    amountRub: 15000,
    monthlyIirky: 15000,
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
  const [plans, setPlans] = useState<TariffPlan[]>(DEFAULT_TARIFF_PLANS);
  const [selectedFeature, setSelectedFeature] = useState<{ title: string; desc: string; planName: string } | null>(null);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [currentFeatureLimit, setCurrentFeatureLimit] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load dynamic tariffs from SQLite API
  useEffect(() => {
    fetch('/api/tariffs')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.tariffs) && data.tariffs.length > 0) {
          const formatted = data.tariffs.map((t: any) => ({
            id: t.id,
            name: t.name,
            price: t.price_iirky || (t.price_rub > 0 ? `${t.price_rub.toLocaleString('ru-RU')} ИИрок / мес` : '0 ИИрок'),
            sub: t.sub || '',
            continuation: t.continuation || (t.id === 'razgon' ? 'Все возможности тарифа Старт, плюс:' : t.id === 'otryv' ? 'Все возможности тарифа Разгон, плюс:' : t.id === 'cosmos' ? 'Все возможности тарифа Отрыв, плюс:' : undefined),
            amountRub: Number(t.price_rub) || 0,
            monthlyIirky: Number(t.monthly_iirky) || Number(t.price_rub) || 0,
            features: Array.isArray(t.features) ? t.features : typeof t.features === 'string' ? JSON.parse(t.features || '[]') : []
          }));
          if (formatted.length > 0) {
            setPlans(formatted);
          }
        }
      })
      .catch(e => console.warn('Использование базовых тарифов:', e));
  }, []);

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
      const currentCard = plans[activeCardIdx];
      if (!currentCard) return;

      if (currentFeatureLimit < currentCard.features.length) {
        setCurrentFeatureLimit(prev => prev + 1);
      } else {
        if (activeCardIdx < plans.length - 1) {
          setActiveCardIdx(prev => prev + 1);
          setCurrentFeatureLimit(0);
        }
      }
    };

    timer = setTimeout(step, 80);
    return () => clearTimeout(timer);
  }, [activeCardIdx, currentFeatureLimit, hasStarted, plans]);

  const cleanUserTariff = (userTariff || '').toLowerCase();

  return (
    <div ref={containerRef} className="space-y-6 w-full relative text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch px-2 sm:px-4 min-h-[500px]">
        {plans.map((plan, idx) => {
          const isCardVisible = idx <= activeCardIdx;
          if (!isCardVisible) return null;

          const visibleFeaturesCount = idx < activeCardIdx ? plan.features.length : currentFeatureLimit;
          const planNameLower = plan.name.toLowerCase();
          const isCurrentPlanActive = 
            (planNameLower.includes('старт') && (cleanUserTariff === 'free' || cleanUserTariff === 'старт' || !cleanUserTariff)) ||
            (planNameLower.includes('разгон') && (cleanUserTariff === 'pro' || cleanUserTariff === 'разгон')) ||
            (planNameLower.includes('отрыв') && (cleanUserTariff === 'vip' || cleanUserTariff === 'отрыв')) ||
            (planNameLower.includes('космос') && (cleanUserTariff === 'cosmos' || cleanUserTariff === 'космос'));

          return (
            <motion.div 
              key={plan.id || idx} 
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border flex flex-col justify-between space-y-5 relative transition-all duration-300 hover:scale-102 shadow-md ${
                isCurrentPlanActive 
                  ? 'border-pink-500 ring-2 ring-pink-400/40' 
                  : 'border-pink-300'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {plan.name}
                    </h3>
                    {isCurrentPlanActive && (
                      <span className="px-2.5 py-0.5 bg-gradient-to-r from-sky-500 via-pink-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-xs">
                        Текущий
                      </span>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mt-1">
                    {plan.price}
                  </div>
                  <p className="text-sm text-slate-700 font-medium mt-1 leading-snug">{plan.sub}</p>
                </div>

                {plan.continuation && (
                  <div className="text-sm font-bold text-pink-700 bg-white/50 px-3 py-1 rounded-xl border border-pink-200 text-left">
                    {plan.continuation}
                  </div>
                )}

                <ul className="space-y-2 text-sm text-slate-800 font-medium pt-2 border-t border-pink-200/80">
                  {plan.features.slice(0, visibleFeaturesCount).map((feat, fIdx) => (
                    <motion.li 
                      key={fIdx} 
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      onClick={() => setSelectedFeature({ title: feat.title, desc: feat.desc, planName: plan.name })}
                      className="flex items-start justify-between gap-2 leading-normal cursor-pointer p-2 rounded-xl hover:bg-white/90 hover:shadow-xs transition-all group border border-transparent hover:border-pink-200"
                      title="Нажмите для просмотра подробностей"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-pink-500 shrink-0 select-none mt-0.5">✦</span>
                        <span className="text-slate-800 font-medium group-hover:text-pink-700 transition-colors text-left break-words">{feat.title}</span>
                      </div>
                      <Info className="w-4 h-4 text-slate-400 group-hover:text-pink-500 shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => onAction && onAction(plan.name, plan.price, plan.amountRub)} 
                className="w-full py-3 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-bold text-sm rounded-2xl shadow-md transition-all duration-200 hover:opacity-95 cursor-pointer active:scale-98 mt-4 flex items-center justify-center gap-2"
              >
                <span>{plan.amountRub === 0 ? 'Подключить бесплатно' : buttonText}</span>
                <Sparkles className="w-4 h-4 text-white" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Feature details modal */}
      <AnimatePresence>
        {selectedFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-900/20 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 rounded-3xl p-6 max-w-md w-full border border-pink-300 shadow-2xl space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-pink-200 pb-2.5">
                <span className="text-sm font-bold text-pink-700">
                  Тариф {selectedFeature.planName}
                </span>
                <button 
                  onClick={() => setSelectedFeature(null)} 
                  className="text-slate-500 hover:text-slate-800 p-1.5 rounded-full bg-white/80 border border-pink-200 cursor-pointer"
                  title="Закрыть"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="font-bold text-base text-slate-900 leading-snug">{selectedFeature.title}</h4>
              <p className="text-sm text-slate-800 font-medium leading-relaxed bg-white/70 p-3.5 rounded-2xl border border-pink-200">{selectedFeature.desc}</p>
              <button 
                onClick={() => setSelectedFeature(null)}
                className="w-full py-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-md cursor-pointer transition-all"
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
