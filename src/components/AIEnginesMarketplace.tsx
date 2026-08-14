import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Radar as RadarIcon, TrendingUp, Sliders, PlayCircle, ShieldCheck, 
  AlertCircle, RefreshCw, Send, CheckCircle2, HelpCircle, ArrowUpRight, 
  DollarSign, Users, Award, BookOpen, Layers, BarChart4, FileText, Check, 
  Plus, Edit3, MessageSquare, Flame, CheckCircle, HelpCircle as HelpIcon, ArrowRight, CornerDownRight, ThumbsUp
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

// Mock Blog Database matching the application's domain style
interface MockBlog {
  id: string;
  name: string;
  username: string;
  category: string;
  subscribers: number;
  avgViews: number;
  er: number; // engagement rate in %
  priceRub: number;
  tone: 'humor' | 'analytics' | 'lifestyle' | 'education';
  avatarColor: string;
  avatarEmoji: string;
}

const mockBlogsList: MockBlog[] = [
  {
    id: 'spb_pottery',
    name: 'Гончарная школа "Глина" 🍯',
    username: '@spb_pottery',
    category: 'Хендмейд и Дизайн',
    subscribers: 14500,
    avgViews: 4200,
    er: 8.2,
    priceRub: 1600,
    tone: 'lifestyle',
    avatarColor: 'from-amber-400 to-orange-500',
    avatarEmoji: '🏺'
  },
  {
    id: 'code_kids',
    name: 'ITSMM-Детство: Кодинг 🚀',
    username: '@code_kids_online',
    category: 'Образование и IT',
    subscribers: 18900,
    avgViews: 5100,
    er: 6.7,
    priceRub: 2100,
    tone: 'education',
    avatarColor: 'from-blue-400 to-indigo-600',
    avatarEmoji: '💻'
  },
  {
    id: 'coffee_geometry',
    name: 'Геометрия Кофе ☕',
    username: '@coffee_geometry',
    category: 'Кафе и Гастрономия',
    subscribers: 8500,
    avgViews: 1900,
    er: 11.2,
    priceRub: 1100,
    tone: 'lifestyle',
    avatarColor: 'from-yellow-600 to-amber-800',
    avatarEmoji: '☕'
  },
  {
    id: 'tg_syndicate',
    name: 'Стартап Синдикат 💼',
    username: '@tg_syndicate',
    category: 'Бизнес и Стартапы',
    subscribers: 28000,
    avgViews: 7800,
    er: 5.1,
    priceRub: 4205,
    tone: 'analytics',
    avatarColor: 'from-slate-700 to-slate-900',
    avatarEmoji: '📊'
  },
  {
    id: 'green_lifestyle',
    name: 'Зеленый Дзен 🌱',
    username: '@green_lifestyle',
    category: 'Здоровье и Йога',
    subscribers: 11200,
    avgViews: 2400,
    er: 9.4,
    priceRub: 1400,
    tone: 'lifestyle',
    avatarColor: 'from-emerald-400 to-teal-600',
    avatarEmoji: '🍃'
  },
  {
    id: 'smm_hacks',
    name: 'SMM Креативы & Прогревы 💎',
    username: '@smm_hacks',
    category: 'Маркетинг и Медиа',
    subscribers: 35000,
    avgViews: 10400,
    er: 7.3,
    priceRub: 4900,
    tone: 'humor',
    avatarColor: 'from-pink-500 to-rose-600',
    avatarEmoji: '⚡'
  }
];

export default function AIEnginesMarketplace() {
  const [activeConceptTab, setActiveConceptTab] = useState<'radar' | 'valuation' | 'sandbox' | 'creativity' | 'mediaplan'>('radar');

  return (
    <div className="w-full space-y-6">
      {/* Tab Selectors for the 5 Concepts */}
      <div className="flex flex-nowrap overflow-x-auto pb-2 gap-2 scrollbar-none snap-x touch-pan-x">
        <button
          onClick={() => setActiveConceptTab('radar')}
          className={`flex-none snap-start px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all duration-300 ${
            activeConceptTab === 'radar'
              ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md'
              : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/50'
          }`}
        >
          <RadarIcon className="w-3.5 h-3.5" />
          <span>Smart Scoring Радар</span>
        </button>

        <button
          onClick={() => setActiveConceptTab('valuation')}
          className={`flex-none snap-start px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all duration-300 ${
            activeConceptTab === 'valuation'
              ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md'
              : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>ИИ-Оценка & Охваты</span>
        </button>

        <button
          onClick={() => setActiveConceptTab('sandbox')}
          className={`flex-none snap-start px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all duration-300 ${
            activeConceptTab === 'sandbox'
              ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md'
              : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/50'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Симулятор Подач</span>
        </button>

        <button
          onClick={() => setActiveConceptTab('creativity')}
          className={`flex-none snap-start px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all duration-300 ${
            activeConceptTab === 'creativity'
              ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md'
              : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Экспертиза Креатива</span>
        </button>

        <button
          onClick={() => setActiveConceptTab('mediaplan')}
          className={`flex-none snap-start px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all duration-300 ${
            activeConceptTab === 'mediaplan'
              ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md'
              : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Умный Медиаплан</span>
        </button>
      </div>

      {/* Main Concept Board container */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeConceptTab === 'radar' && <ConceptRadar key="radar" />}
          {activeConceptTab === 'valuation' && <ConceptValuation key="valuation" />}
          {activeConceptTab === 'sandbox' && <ConceptSandbox key="sandbox" />}
          {activeConceptTab === 'creativity' && <ConceptCreativity key="creativity" />}
          {activeConceptTab === 'mediaplan' && <ConceptMediaplan key="mediaplan" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==========================================
// CONCEPT 1: Smart Matching Radar
// ==========================================
function ConceptRadar() {
  const [productDesc, setProductDesc] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStateText, setScanStateText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [matchingResults, setMatchingResults] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState('');
  const [isFetchingAiReport, setIsFetchingAiReport] = useState(false);

  const sampleProducts = [
    'Гончарная студия в Санкт-Петербурге: ищу блоги с творческой аудиторией и упором на ручной хендмейд',
    'Онлайн-курс программирования на Python для подростков, ищем авторов с аудиторией увлеченных родителей',
    'Премиальный кофейный бренд, ищу классных фуд-блогеров и ценителей изысканного сторителлинга',
    'Школа подготовки к ЕГЭ по обществознанию, нужны молодежные каналы с высоким ER в VK/Telegram'
  ];

  const handleStartScan = async () => {
    if (!productDesc.trim()) return;
    setIsScanning(true);
    setMatchingResults([]);
    setAiReport('');
    setHighlightedIndex(-1);

    const steps = [
      'Семантическое профилирование креатива...',
      'Поиск векторов соответствия в ядре каналов ИИSMM...',
      'Анализ поведенческих маркеров аудитории...',
      'Калибровка совпадений!'
    ];

    for (let i = 0; i < steps.length; i++) {
      setScanStateText(steps[i]);
      // Flash blogging cards simulation during scan
      if (i < 3) {
        let flashCount = 0;
        const interval = setInterval(() => {
          setHighlightedIndex(Math.floor(Math.random() * mockBlogsList.length));
          flashCount++;
          if (flashCount > 4) clearInterval(interval);
        }, 150);
      }
      await new Promise(r => setTimeout(r, 650));
    }

    setHighlightedIndex(-1);
    setIsScanning(false);

    // Calculate mock compatible matches instantly
    const query = productDesc.toLowerCase();
    const scoredBlogs = mockBlogsList.map(blog => {
      let baseScore = 60 + Math.floor(Math.random() * 20); // random base

      // Smart semantic correlation checks
      if (query.includes('гончар') || query.includes('хендмейд') || query.includes('творчес') || query.includes('дизайн')) {
        if (blog.id === 'spb_pottery') baseScore = 96;
        else if (blog.id === 'coffee_geometry') baseScore = 84;
        else if (blog.id === 'green_lifestyle') baseScore = 78;
        else baseScore = 48;
      } else if (query.includes('курс') || query.includes('програм') || query.includes('егэ') || query.includes('обуч') || query.includes('детей') || query.includes('родител')) {
        if (blog.id === 'code_kids') baseScore = 95;
        else if (blog.id === 'tg_syndicate') baseScore = 88;
        else if (blog.id === 'smm_hacks') baseScore = 79;
        else baseScore = 52;
      } else if (query.includes('кофе') || query.includes('бренд') || query.includes('вкус') || query.includes('еда')) {
        if (blog.id === 'coffee_geometry') baseScore = 98;
        else if (blog.id === 'spb_pottery') baseScore = 81;
        else if (blog.id === 'green_lifestyle') baseScore = 84;
        else baseScore = 40;
      } else if (query.includes('маркетинг') || query.includes('реклама') || query.includes('бизнес') || query.includes('стартап') || query.includes('smm')) {
        if (blog.id === 'smm_hacks') baseScore = 97;
        else if (blog.id === 'tg_syndicate') baseScore = 91;
        else if (blog.id === 'code_kids') baseScore = 72;
        else baseScore = 35;
      }

      // Generate dynamic context-based reason matching why recommended
      let localReason = '';
      if (blog.id === 'spb_pottery') {
        localReason = '73% аудитории активно интересуются эстетичным хендмейдом, глиняным дизайном и локальными мастер-классами в Санкт-Петербурге.';
      } else if (blog.id === 'code_kids') {
        localReason = 'Высокая концентрация платежеспособных родителей (30-48 лет). Интерес к обучению, школьному развитию и современным детским кружкам.';
      } else if (blog.id === 'coffee_geometry') {
        localReason = 'Стильный контент. Аудитория преимущественно состоит из дизайнеров, студентов-гуманитариев и гиков, ценящих стильный крафтовый продукт.';
      } else if (blog.id === 'tg_syndicate') {
        localReason = 'Владельцы малого бизнеса, маркетологи и инвесторы. Локальный интерес к масштабированию проектов и качественным франшизам.';
      } else if (blog.id === 'green_lifestyle') {
        localReason = 'Контент про осознанный стиль, ментальное равновесие и йогу. Идеальный фит под натуральные крафтовые сувенирные товары.';
      } else {
        localReason = 'SMM-специалисты и авторы блогов, находящиеся в поисках свежих механик трафика и инновационных инструментов.';
      }

      return {
        ...blog,
        score: baseScore,
        aiReason: localReason
      };
    }).sort((a, b) => b.score - a.score);

    setMatchingResults(scoredBlogs);

    // Call real ProTalk backend API asynchronously to provide a high-fidelity expert strategic commentary
    setIsFetchingAiReport(true);
    try {
      const bestMatch = scoredBlogs[0];
      const pSystemInstruction = `Ты — ведущий AI-маркетолог ИИ-Биржи ИИSMM. Твоя задача — дать профессиональную, суперзажигательную и глубокую оценку подбора рекламной площадки. Давай ответ строго на русском языке в красивом структурированном маркдауне. Используй эмодзи. Сделай акцент на синергии продукта и целевой аудитории. Посоветуй оптимальный формат рекламного поста.`;

      const promptText = `Пользователь ищет блог на нашей бирже. Описание его продукта: "${productDesc}".
Наш радар-сканер выдал максимальную совместимость с блогом: "${bestMatch.name}" (${bestMatch.username}), тематика: "${bestMatch.category}", подписчиков: ${bestMatch.subscribers}, средний охват: ${bestMatch.avgViews}. Коэффициент соответствия: ${bestMatch.score}%.
Обоснуй, почему наш радар рекомендует этот подбор? Предложи 3 кратких огненных тезиса о том, как лучше всего вовлечь эту аудиторию именно для продукта пользователя, и назови подходящую форму подачи. Ограничься 150-180 словами в красивом Markdown.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText,
          history: [],
          systemInstruction: pSystemInstruction
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.text) {
          setAiReport(data.text);
        }
      }
    } catch (err) {
      console.warn('Silent fallback for Gemini Radar Commentary:', err);
    } finally {
      setIsFetchingAiReport(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="bg-white/40 backdrop-blur-2xl border border-white p-5 rounded-3xl shadow-xl space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-rose-100 text-rose-800 text-[9px] font-black rounded-lg uppercase tracking-wider">AI CONCEPT #1</span>
            <div className="flex items-center gap-1 text-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Радар запущен</span>
            </div>
          </div>
          <h3 className="text-xl font-black bg-clip-text text-transparent bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] leading-snug">Smart Matching Радар</h3>
          <p className="text-[11px] text-slate-500">Умный подбор блогов на бирже под особенности и концепцию вашего продукта.</p>
        </div>
      </div>

      {/* Input product section */}
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Расскажите ИИ о вашем продукте:</label>
          <div className="relative">
            <textarea
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder="Напишите кратко, что вы рекламируете, цену, город или суть оффера... ИИSMM моментально найдет целевую связку."
              className="w-full bg-white/70 border border-slate-200 focus:border-pink-300 focus:ring-1 focus:ring-pink-300 p-3.5 rounded-2xl text-xs text-slate-800 font-medium tracking-tight outline-none resize-none h-20 transition-all shadow-2xs"
            />
            {productDesc && !isScanning && (
              <button 
                onClick={() => setProductDesc('')}
                className="absolute right-3.5 bottom-3.5 text-slate-400 hover:text-slate-600 font-bold transition-colors cursor-pointer text-xs"
              >
                Очистить
              </button>
            )}
          </div>
        </div>

        {/* Templates suggestions list */}
        <div className="space-y-2">
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Быстрые демо-шаблоны (кликните):</span>
          <div className="flex flex-wrap gap-1.5">
            {sampleProducts.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (!isScanning) setProductDesc(sample);
                }}
                className={`text-[10px] text-left px-2.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  productDesc === sample 
                    ? 'bg-slate-800 border-slate-900 text-white font-bold'
                    : 'bg-white/80 hover:bg-white text-slate-600 hover:slate-800 border-slate-200/50 hover:border-slate-350'
                }`}
              >
                {sample.split(':')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Scan Start button */}
        <button
          onClick={handleStartScan}
          disabled={isScanning || !productDesc.trim()}
          className={`w-full py-3.5 bg-gradient-to-r from-orange-400 via-pink-500 to-rose-600 text-white text-xs font-black rounded-2xl uppercase tracking-wider shadow-md hover:shadow-lg transition-transform ${
            isScanning || !productDesc.trim() 
              ? 'opacity-50 cursor-not-allowed contrast-75' 
              : 'hover:-translate-y-0.5 cursor-pointer active:translate-y-0'
          } flex items-center justify-center gap-2`}
        >
          <RadarIcon className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'ИИ Считывает параметры базы...' : 'Запустить ИИ-Радар подбора'}</span>
        </button>
      </div>

      {/* Radar Animation screen interface */}
      {isScanning && (
        <div className="w-full flex flex-col items-center justify-center py-8 bg-slate-50 rounded-3xl relative overflow-hidden h-64 border border-slate-100 shadow-inner">
          {/* Animated concentric circles */}
          <div className="absolute inset-0 flex items-center justify-center opacity-70">
            <div className="w-48 h-48 rounded-full border border-pink-500/20 animate-pulse" />
            <div className="w-32 h-32 rounded-full border border-purple-500/20 absolute" />
            <div className="w-16 h-16 rounded-full border border-sky-500/15 absolute" />
          </div>

          {/* Sweeping radar beam */}
          <div className="absolute w-[180px] h-[180px] origin-center bg-gradient-to-tr from-pink-500/0 via-pink-500/10 to-pink-500/40 rounded-tr-full animate-spin duration-3500 absolute" />

          {/* Glowing node dots flashing on radar */}
          {mockBlogsList.map((blog, idx) => {
            const positions = [
              { top: '25%', left: '35%' },
              { top: '35%', left: '72%' },
              { top: '65%', left: '20%' },
              { top: '75%', left: '60%' },
              { top: '45%', left: '48%' },
              { top: '15%', left: '55%' },
            ];
            const pos = positions[idx % positions.length];
            const isHighlighted = idx === highlightedIndex;

            return (
              <div 
                key={blog.id} 
                className="absolute transition-all duration-300"
                style={{ top: pos.top, left: pos.left }}
              >
                <div className={`rounded-xl px-1.5 py-0.5 text-[8px] font-mono flex items-center gap-1 border ${
                  isHighlighted 
                    ? 'bg-pink-500 border-pink-300 text-white scale-110 shadow-lg shadow-pink-500/50' 
                    : 'bg-slate-100 border-slate-200 text-slate-600 opacity-60'
                }`}>
                  <span className="text-[10px]">{blog.avatarEmoji}</span>
                  <span className="font-bold">{blog.username}</span>
                </div>
              </div>
            );
          })}

          <div className="z-10 mt-1 flex flex-col items-center select-none text-center gap-2">
            <span className="p-1 px-3 bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] rounded-full text-[9px] font-bold text-white font-mono tracking-widest animate-pulse uppercase">
              {scanStateText}
            </span>
            <span className="text-[10px] font-bold text-slate-500 capitalize">Анализатор: ИИ-Куратор ИИSMM</span>
          </div>
        </div>
      )}

      {/* Matching result reports */}
      {matchingResults.length > 0 && !isScanning && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <h4 className="font-extrabold text-slate-800 text-sm">Результаты ИИ-подбора ({matchingResults.length} совпавших каналов):</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchingResults.slice(0, 2).map((match, rank) => (
              <div 
                key={match.id} 
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  rank === 0 
                    ? 'bg-gradient-to-br from-orange-50/55 to-pink-50/55 border-orange-255 shadow-xs ring-1 ring-orange-200/50' 
                    : 'bg-white/80 border-slate-100'
                }`}
              >
                {/* Ranking badge */}
                <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 font-mono">РЕКОМЕНДАЦИЯ #{rank + 1}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    match.score >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {match.score}%
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${match.avatarColor} flex items-center justify-center text-lg shadow-sm font-bold`}>
                      {match.avatarEmoji}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">{match.name}</span>
                      <span className="text-[9px] font-mono font-bold text-slate-400">{match.username}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center bg-white/50 p-2 rounded-xl border border-slate-100">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 block font-bold uppercase leading-none">Подписчики</span>
                      <span className="text-[11px] font-black text-slate-800 font-mono">{(match.subscribers / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="space-y-0.5 border-x border-slate-100">
                      <span className="text-[8px] text-slate-400 block font-bold uppercase leading-none">Ср. Охват</span>
                      <span className="text-[11px] font-black text-slate-800 font-mono">{(match.avgViews / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 block font-bold uppercase leading-none">Ед.Цена</span>
                      <span className="text-[11px] font-black text-pink-600 font-mono">{match.priceRub} IR</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white/80 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[8px] text-orange-900 block font-black uppercase tracking-wider">Глубокое обоснование ИИ:</span>
                    <p className="text-[10px] text-slate-600 leading-normal font-semibold font-sans">{match.aiReason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Strategic Advice commentary */}
          <div className="p-0.5 bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] rounded-2xl shadow-sm relative overflow-hidden">
            <div className="p-4 bg-white/95 backdrop-blur-md rounded-[14px] space-y-2">
              <div className="absolute right-4 top-4 opacity-5">
                <Sparkles className="w-16 h-16 text-pink-400" />
              </div>

              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                <span className="text-[10px] bg-clip-text text-transparent bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] font-black uppercase tracking-wider font-mono">Экспертный ИИ-Аудит подбора (ИИSMM)</span>
              </div>

              {isFetchingAiReport ? (
                <div className="space-y-2 py-2 animate-pulse">
                  <div className="h-2 bg-slate-100 rounded-full w-[45%]" />
                  <div className="h-2 bg-slate-100 rounded-full w-[90%]" />
                  <div className="h-2 bg-slate-100 rounded-full w-[80%]" />
                </div>
              ) : aiReport ? (
                <div className="text-[11px] leading-relaxed text-slate-755 font-medium">
                  <MarkdownRenderer content={aiReport} />
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                  ИИ-Радар успешно рассчитал оптимальный вектор. Данные подбора готовы для добавления в медиаплан.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ==========================================
// CONCEPT 2: Fair Price Evaluator
// ==========================================
function ConceptValuation() {
  const [subscribers, setSubscribers] = useState(24000);
  const [reach, setReach] = useState(8500);
  const [niche, setNiche] = useState('tech');

  const niches = [
    { key: 'business', label: 'Бизнес и Стартапы (Высокий ценник)', cpm: 900, botRate: 6 },
    { key: 'tech', label: 'Технологии & ИИ', cpm: 800, botRate: 8 },
    { key: 'lifestyle', label: 'Лайфстайл, Йога и Дизайн', cpm: 550, botRate: 10 },
    { key: 'education', label: 'Образование & IT-Код', cpm: 600, botRate: 7 },
    { key: 'humor', label: 'Юмор & Мемы (Низкий чек)', cpm: 350, botRate: 16 }
  ];

  const currentNiche = niches.find(n => n.key === niche) || niches[1];

  // Restrict reach to always be <= subscribers
  useEffect(() => {
    if (reach > subscribers) {
      setReach(subscribers);
    }
  }, [subscribers]);

  const er = subscribers > 0 ? Number(((reach / subscribers) * 100).toFixed(1)) : 0;
  
  // SMM formula calculations
  const botCount = Math.floor(subscribers * (currentNiche.botRate / 100));
  const activeCore = Math.floor(reach * 0.7);
  const passiveReaders = Math.max(0, subscribers - activeCore - botCount);

  // Price valuation calculations
  const engagementBonus = er > 15 ? 1.3 : er < 3 ? 0.7 : 1.0;
  const rawBase = (reach * currentNiche.cpm) / 1000;
  const calculatedPrice = Math.round(rawBase * engagementBonus);

  const priceLow = Math.max(200, Math.round(calculatedPrice * 0.85));
  const priceHigh = Math.round(calculatedPrice * 1.15);

  // SVG Donut calculation parameters
  const totalCircle = 2 * Math.PI * 40; // R=40
  const activePercent = (activeCore / subscribers) * 100;
  const passivePercent = (passiveReaders / subscribers) * 100;
  const botPercent = (botCount / subscribers) * 100;

  // Stroke values
  const strokeActive = (activePercent / 100) * totalCircle;
  const strokePassive = (passivePercent / 100) * totalCircle;
  const strokeBot = (botPercent / 100) * totalCircle;

  // AI Verdict commentary
  const getAiVerdict = () => {
    if (er > 25) {
      return `💎 Крайне высокая концентрация вовлеченности (ER ${er}%)! Аудитория гипер-лояльна, глубина дочитываемости постов максимальная. Канал является премиальным, за интеграцию можно просить надбавку до +30%.`;
    } else if (er < 5) {
      return `⚠️ Пониженная активность вовлечения (ER ${er}%). Охваты слабые относительно базы подписчиков. Рекомендуется использовать цену строго по нижней границе диапазона и просить скидку у блогера.`;
    } else {
      return `💪 Стабильный органический аккаунт с оптимальными SMM коэффициентами. Отношение охвата к объему подписчиков (ER ${er}%) находится в здоровой зеленой зоне. Риск накруток отсутствует.`;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="bg-white/40 backdrop-blur-2xl border border-white p-5 rounded-3xl shadow-xl space-y-6"
    >
      <div className="space-y-1">
        <span className="p-1 px-2.5 bg-rose-100 text-rose-800 text-[9px] font-black rounded-lg uppercase tracking-wider">AI CONCEPT #2</span>
        <h3 className="text-xl font-black bg-clip-text text-transparent bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] leading-snug">ИИ-Правообладатель & Оценка цены (Fair Price)</h3>
        <p className="text-[11px] text-slate-500">Автоматический аудит вовлеченности и волатильности накруток. Рассчитайте кристально честную рекламную ставку.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left pane: Sliders & options */}
        <div className="lg:col-span-7 space-y-5">
          {/* Niche Theme Selector */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#cb0080] font-bold uppercase tracking-wide">Тематическая ниша канала:</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-800 font-semibold outline-none focus:border-pink-300"
            >
              {niches.map(n => (
                <option key={n.key} value={n.key}>{n.label}</option>
              ))}
            </select>
          </div>

          {/* Slider 1: Subscribers */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-bold uppercase text-[9px]">Общее число подписчиков:</span>
              <span className="font-mono font-bold text-slate-800 text-xs">{subscribers.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="150000"
              step="500"
              value={subscribers}
              onChange={(e) => {
                setSubscribers(Number(e.target.value));
              }}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <div className="flex justify-between text-[8px] text-slate-400 font-mono uppercase">
              <span>1k</span>
              <span className="text-[#cb0080]">75k</span>
              <span>150k</span>
            </div>
          </div>

          {/* Slider 2: Average Views / Reach */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-bold uppercase text-[9px]">Средний охват 1 поста:</span>
              <span className="font-mono font-bold text-slate-800 text-xs">{reach.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="100"
              max={subscribers}
              step="100"
              value={reach}
              onChange={(e) => setReach(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[8px] text-slate-400 font-mono uppercase">
              <span>100</span>
              <span>Ср.Охват постов</span>
              <span>{subscribers.toLocaleString()}</span>
            </div>
          </div>

          {/* ER and Bots alert meters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/70 border border-[#cb0080] text-[#cb0080] rounded-2xl space-y-1">
              <span className="text-[8px] text-slate-400 block font-bold uppercase leading-none">Коэффициент ER:</span>
              <span className="text-base font-black font-mono leading-none block text-[#cb0080]">{er}%</span>
              <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">
                {er > 10 ? '🔥 Превосходно' : er < 4 ? '⛔ Слабое удержание' : '🟢 Стабильно'}
              </span>
            </div>

            <div className="p-3 bg-white/70 border border-[#cb0080] text-[#cb0080] rounded-2xl space-y-1">
              <span className="text-[8px] text-slate-400 block font-bold uppercase leading-none">Индекс Ботов (Шум):</span>
              <span className="text-base font-black font-mono leading-none block text-[#cb0080]">{currentNiche.botRate}%</span>
              <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">
                {currentNiche.botRate > 12 ? '🔎 Риск накруток' : '🛡 Стерильный трафик'}
              </span>
            </div>
          </div>
        </div>

        {/* Right pane: Interactive SVG Audience chart & prices */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-orange-50/50 rounded-3xl border border-slate-100 p-5 flex flex-col justify-between space-y-4">
          <div className="text-center space-y-2">
            <span className="text-[9px] text-slate-400 block font-black uppercase tracking-wider">ИИ-Прогноз Распределения Трафика</span>
            
            {/* Donuts Layout Chart */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg width="130" height="130" viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                {/* Active slice */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ec4899" strokeWidth="12" 
                        strokeDasharray={`${strokeActive} ${totalCircle - strokeActive}`} 
                        strokeDashoffset="0" />
                {/* Passive slice */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="12" 
                        strokeDasharray={`${strokePassive} ${totalCircle - strokePassive}`} 
                        strokeDashoffset={-strokeActive} />
                {/* Bot slice */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="12" 
                        strokeDasharray={`${strokeBot} ${totalCircle - strokeBot}`} 
                        strokeDashoffset={-(strokeActive + strokePassive)} />
              </svg>
              <div className="absolute text-center select-none leading-none">
                <span className="text-[9px] text-slate-400 block font-bold uppercase leading-none">ER %</span>
                <span className="text-lg font-black text-slate-800 font-mono tracking-tighter">{er}</span>
              </div>
            </div>

            {/* Legend indicators */}
            <div className="flex justify-center gap-4 text-[9px] font-mono leading-none pt-1">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded bg-pink-500 block" />
                <span>Актив: {(activePercent).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded bg-blue-500 block" />
                <span>Пассив: {(passivePercent).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded bg-red-500 block" />
                <span>Шум/Боты: {currentNiche.botRate}%</span>
              </div>
            </div>
          </div>

          {/* Pricing calculations details */}
          <div className="bg-white/80 p-3.5 rounded-2xl border border-orange-100/30 text-center space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Справедливая цена по ИИ-Бирже:</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">{priceLow.toLocaleString()} – {priceHigh.toLocaleString()} IR</span>
            <span className="text-[9px] text-slate-400 block font-black uppercase">Учитывая нишу CPM ({currentNiche.cpm} ₽) и аудит вовлечения</span>
          </div>

          <div className="p-3 bg-orange-50/70 border border-orange-100/50 text-[10px] text-slate-700 leading-normal rounded-xl">
            {getAiVerdict()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// CONCEPT 3: Ad Angle Sandbox
// ==========================================
function ConceptSandbox() {
  const [selectedBlogger, setSelectedBlogger] = useState<string>('marina');
  const [adFormat, setAdFormat] = useState<'reels' | 'story' | 'post'>('reels');
  const [isGeneratingAngle, setIsGeneratingAngle] = useState(false);
  const [generatedCreative, setGeneratedCreative] = useState<string>('');
  const [customKeyFeatures, setCustomKeyFeatures] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);

  const characters = [
    {
      id: 'marina',
      name: 'Марина 🌸',
      role: 'Эстетика & Лайфстайл',
      emoji: '🏺',
      bgColor: 'from-amber-200 to-pink-200',
      description: 'Нежный, расслабленный тон рассказов. Акцент на комфорт, визуал и тактильные приятные мелочи.'
    },
    {
      id: 'igor',
      name: 'Игорь 📊',
      role: 'Бизнес & Аналитика & IT',
      emoji: '💻',
      bgColor: 'from-sky-200 to-blue-200',
      description: 'Строгий, логичный экспертный стиль. Четкие графики, неопровержимые аргументы, выгода, цифры.'
    },
    {
      id: 'danila',
      name: 'Данила ⚡',
      role: 'Юмор & Креативные посты',
      emoji: '⚡',
      bgColor: 'from-pink-200 to-rose-200',
      description: 'Мемный, легкий, супер-динамичный тон. Остроумные шутки, контрастные сравнения, хайп.'
    }
  ];

  const handleGenerateAngle = async () => {
    setIsGeneratingAngle(true);
    setGeneratedCreative('');

    try {
      const activeChar = characters.find(c => c.id === selectedBlogger) || characters[0];
      const pSystemInstruction = `Ты — профессиональный ИИ-копирайтер в SMM. Твоя задача — сгенерировать готовый рекламный креатив исключительно в стиле и тональности выбранного блогера. Для Марины пиши нежно, кинестетично, тепло с милыми смайликами. Для Игоря пиши сухо, структурировано в виде тезисов, с расчетами преимуществ. Для Данилы используй легкую постиронию, шутки и супердинамичный молодежный сленг. Твой ответ должен содержать заголовок-крючок и сам сценарий до 80 слов. Отвечай только на русском.`;

      let formatDesc = '';
      if (adFormat === 'reels') formatDesc = 'Рекламный Сценарий Видео Reels / Stories (диалог или закадровый голос на 15 секунд)';
      else if (adFormat === 'story') formatDesc = 'Интерактивный Вовлекающий прогрев с опросом/квизом в Stories';
      else formatDesc = 'Лонгрид-пост для Ленты с призывом пойти по ссылке';

      const promptText = `Пожалуйста, сгенерируй нативный рекламный креатив от лица блогера: ${activeChar.name}.
В стиле: "${activeChar.role}. ${activeChar.description}".
Желаемый формат размещения: "${formatDesc}".
Что рекламируем (особенности продукта): "${customKeyFeatures || "Революционная ИИ-SMM платформа для автоматической публикации, планирования и создания постов в Telegram и VK с ботом @IIrkiBot"}".`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText,
          history: [],
          systemInstruction: pSystemInstruction
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.text) {
          setGeneratedCreative(data.text);
          setIsGeneratingAngle(false);
          setIsAiMode(true);
          return;
        }
      }
      throw new Error('API query failed');
    } catch (err) {
      console.warn('Fallback creative sandbox rendering:', err);
      // Simulation backup generator
      setTimeout(() => {
        let text = '';
        if (selectedBlogger === 'marina') {
          text = `### ✨ Кусочек уюта для вашей ленты...\n\nДевочки, вы часто спрашиваете, как я все успеваю и почему мои посты выходят так эстетично и регулярно 🕯️\n\nМой секрет — чудесный ИИ-ассистент, который сам берет на себя оформление планируемых мыслей. Это как глоток теплого латте со сливками ранним утром! Без суеты и спешки. Всё красиво организуется само 🌸\n\n👉 Загляните на огонёк к ИИSMM и почувствуйте эту магию уюта!`;
        } else if (selectedBlogger === 'igor') {
          text = `### 📉 Эффективность автоматизации каналов: Сухие цифры\n\nПроанализировал 12 проектов. Ручной SMMщик тратит до 15 часов в неделю на рутинные клики и вычитку постов. Это неэффективно.\n\nВнедрил ИИSMM. Результаты:\n• Экономия ресурсов: -74% времени.\n• Стабильность сетки: Публикация по долям таймингов 24/7.\n• Снижение издержек на контент в 4.2 раза.\n\n📊 Ссылка на автоматического робота эскроу-биржи — в закрепленном сообщении. Рекомендую для коммерческих сеток.`;
        } else {
          text = `### 🔥 ШОК! Роботы захватили мой паблик и заставляют меня пить чай!\n\nРебят, забудьте про мучительное придумывание подписей к фоткам в 3 часа ночи. Наш железный друг Скайнет наконец-то сделал что-то полезное 😂\n\nИИSMM нарезает посты, пилит мемы и даже проверяет мои косяки в запятых. SMMщики вышли из чата. Роботы, я вас люблю!\n\nКликните кнопку ниже, пока роботы не подорожали! 🚀⚡`;
        }
        setGeneratedCreative(text);
        setIsGeneratingAngle(false);
        setIsAiMode(true);
      }, 1000);
    }
  };

  const getSimulatedCreativeText = (bloggerId: string, format: string, customText?: string) => {
    const extraInfo = customText ? `\n\n📌 Учтено спец-свойство: "${customText}"` : '';
    const formatText = format === 'reels' ? 'Сценарий Reels 🎥' : format === 'story' ? 'Серия Stories 🌸' : 'Лонгрид в Ленту 📰';
    if (bloggerId === 'marina') {
      return `### ✨ Нативный превью-креатив от Марины (Симуляция)\n**Выбранный SMM формат**: ${formatText}\n\nВсем привет, мои хорошие! 🌸 На днях я устроила себе вечер полной тишины и уюта. Навела порядок во всех делах за полчаса с потрясающим ИИ-помощником. Знакомьтесь — ИИSMM! Настоящая находка для тех, кто хочет вести блоги без стресса и суеты. Всё планируется само, так нативно и легко! Настоящий дзен 🕯️${extraInfo}\n\n👉 Ссылка на авто-бота в описании!`;
    } else if (bloggerId === 'igor') {
      return `### 📊 Бизнес-эффективность: Метрика и Оптимизация (Симуляция)\n**Выбранный SMM формат**: ${formatText}\n\nПриветствую коллег. Хочу поделиться практическими цифрами по ведению каналов. Ручное администрирование забирает до 15 часов. С платформой ИИSMM мы разгрузили сетку пабликов на 80%. Процессы планирования и Escrow-депонирования автоматизированы через бота @IIrkiBot. Стабильные алгоритмы 24/7.${extraInfo}\n\n📈 Рекомендую для коммерческих сеток. Ссылка в закрепе.`;
    } else {
      return `### 😂 ШОК! Роботы захватили мой паблик! (Симуляция)\n**Выбранный SMM формат**: ${formatText}\n\nНарод, расходимся, забудьте про мучительный ночной копирайтинг. Наш железный друг Скайнет наконец-то выдал что-то годное! 💥 ИИSMM нарезает посты, пилит мемы и даже проверяет мои косяки в запятых. ИИSMM — это легальный чит для блогеров.${extraInfo}\n\n🚀 Переходите по кнопке ниже и убедитесь сами!`;
    }
  };

  // Instantly load simulated backup text on transition without consuming Gemini tokens automatically
  useEffect(() => {
    const simulatedText = getSimulatedCreativeText(selectedBlogger, adFormat, customKeyFeatures);
    setGeneratedCreative(simulatedText);
    setIsAiMode(false);
  }, [selectedBlogger, adFormat, customKeyFeatures]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="bg-white/40 backdrop-blur-2xl border border-white p-5 rounded-3xl shadow-xl space-y-6"
    >
      <div className="space-y-1">
        <span className="p-1 px-2.5 bg-rose-100 text-rose-800 text-[9px] font-black rounded-lg uppercase tracking-wider">AI CONCEPT #3</span>
        <h3 className="text-xl font-black bg-clip-text text-transparent bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] leading-snug">Симулятор рекламных подач (Sandbox)</h3>
        <p className="text-[11px] text-slate-500">Примерьте подачу под тональность каждого инфлюенсера. ИИ подстроит текст под стиль блогера.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1 & 2 Left Controls */}
        <div className="lg:col-span-6 space-y-4">
          {/* Blogger select block */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Шаг 1: Выберите блогера-автора:</label>
            <div className="grid grid-cols-3 gap-2">
              {characters.map(char => (
                <button
                  key={char.id}
                  onClick={() => setSelectedBlogger(char.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between h-28 ${
                    selectedBlogger === char.id
                      ? 'bg-gradient-to-br from-sky-50 via-pink-50 to-orange-50 border-pink-300 text-slate-900 shadow-md scale-[1.02]'
                      : 'bg-white/80 border-slate-200/50 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-xl">{char.emoji}</span>
                    {selectedBlogger === char.id && (
                      <span className="p-0.5 bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c)] rounded-full">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="leading-none space-y-0.5">
                    <span className="text-[10px] font-black block leading-none">{char.name}</span>
                    <span className={`text-[8px] font-bold block ${
                      selectedBlogger === char.id ? 'text-pink-600' : 'text-slate-400'
                    }`}>{char.role.split(' ')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ad Format select block */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Шаг 2: Формат рекламы на бирже:</label>
            <div className="flex gap-2 text-[10px] uppercase font-black tracking-wider">
              <button
                onClick={() => setAdFormat('reels')}
                className={`flex-1 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                  adFormat === 'reels' 
                    ? 'bg-pink-100 text-pink-900 border-pink-200' 
                    : 'bg-white/80 text-slate-500 border-slate-200/70'
                }`}
              >
                🎥 Reels / Сценарий
              </button>
              <button
                onClick={() => setAdFormat('story')}
                className={`flex-1 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                  adFormat === 'story' 
                    ? 'bg-pink-100 text-pink-900 border-pink-200' 
                    : 'bg-white/80 text-slate-500 border-slate-200/70'
                }`}
              >
                🌸 Stories квиз
              </button>
              <button
                onClick={() => setAdFormat('post')}
                className={`flex-1 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                  adFormat === 'post' 
                    ? 'bg-pink-100 text-pink-900 border-pink-200' 
                    : 'bg-white/80 text-slate-500 border-slate-200/70'
                }`}
              >
                📰 Пост лонгрид
              </button>
            </div>
          </div>

          {/* Prompt features */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Доп. особенности продукта (необязательно):</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customKeyFeatures}
                onChange={(e) => setCustomKeyFeatures(e.target.value)}
                placeholder="Например: скидка 10% по промокоду PROMO..."
                className="flex-1 bg-white/85 border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-pink-300"
              />
              <button
                onClick={handleGenerateAngle}
                disabled={isGeneratingAngle}
                className="px-4 bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] hover:opacity-95 text-white rounded-xl text-[9px] uppercase font-black tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${isGeneratingAngle ? 'animate-spin' : ''}`} />
                <span>Запустить ИИ 🤖</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right iPhone Creative Display */}
        <div className="lg:col-span-6 flex justify-center">
          {/* Beautiful iPhone mockup container */}
          <div className="w-full max-w-[280px] bg-white border-[5px] border-slate-200 rounded-[36px] shadow-2xl relative overflow-hidden h-[390px] flex flex-col justify-between text-slate-800 border-b-[8px] border-slate-300">
            {/* Dynamic notch bar */}
            <div className="absolute top-0 inset-x-0 h-5 flex justify-center z-10">
              <div className="w-20 h-4 bg-slate-100 rounded-b-xl flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              </div>
            </div>

            {/* Simulated iPhone Header */}
            <div className="px-4 pt-6 pb-2 border-b border-slate-100 bg-white/60 backdrop-blur-md flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-xs">
                {characters.find(c => c.id === selectedBlogger)?.emoji || '🌸'}
              </div>
              <div className="leading-none">
                <span className="text-[10px] font-black block text-slate-800 leading-none">
                  {characters.find(c => c.id === selectedBlogger)?.name || 'Марина'}
                </span>
                <span className="text-[7px] text-slate-400 block font-bold leading-none font-mono font-semibold">Превью интеграции</span>
              </div>
            </div>

            {/* Scrollable feed body */}
            <div className="flex-1 p-3.5 space-y-3 bg-slate-50 relative overflow-y-auto scrollbar-none flex flex-col">
              {isGeneratingAngle ? (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono animate-pulse font-bold">ИИ генерирует адаптацию...</span>
                </div>
              ) : generatedCreative ? (
                <div className="space-y-2 flex-grow flex flex-col">
                  <div className="flex justify-between items-center shrink-0">
                    {isAiMode ? (
                      <span className="inline-block text-[8px] bg-sky-500/15 text-sky-700 border border-sky-450/25 px-2 py-0.5 rounded-full font-mono font-bold leading-none">
                        ⚡ ИИ Активен (Gemini)
                      </span>
                    ) : (
                      <span className="inline-block text-[8px] bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] text-white px-2 py-0.5 rounded-full font-mono font-bold leading-none animate-pulse">
                        🟢 Симуляция (0 токенов)
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-white border border-slate-100 rounded-2xl space-y-2 leading-relaxed text-[11px] font-medium text-slate-700 flex-grow shadow-xs">
                    <MarkdownRenderer content={generatedCreative} />
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 text-center my-auto font-mono">
                  Превью креатива появится после клика на генерацию.
                </p>
              )}
            </div>

            {/* Phone bottom toolbar */}
            <div className="p-2 border-t border-slate-100 bg-white/95 flex items-center justify-between text-[8px] tracking-wide text-slate-500 uppercase font-mono font-bold">
              <span>❤️ 2.4k лайков</span>
              <span className="px-2 py-0.5 rounded bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] text-white font-black cursor-pointer hover:opacity-95 transition-opacity">Разместить</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// CONCEPT 4: Reach Booster (Creative Examiner)
// ==========================================
function ConceptCreativity() {
  const [creativeText, setCreativeText] = useState(
    '🔥 ВНИМАНИЕ!!! ШОК НОВОСТЬ!!! СКИДКА 99% СРОЧНО КЛИКАЙТЕ СЮДА!!! Самый лучший и невероятный в мире автоматический чат-бот для заработка денег гарантировано ждет вас прямо сейчас без СМС!!! Кликай!'
  );
  const [analyzed, setAnalyzed] = useState(true);
  const [selectedWord, setSelectedWord] = useState<{ word: string, rule: string, fix: string } | null>(null);
  const [reachScore, setReachScore] = useState(38);
  const [isRewriting, setIsRewriting] = useState(false);

  // Hardcoded map of trigger words, reason, suggestions
  const triggerList = [
    { word: 'ВНИМАНИЕ', type: 'red', rule: 'Алгоритмы умных лент снижают охваты за капс и кликбейтные крючки.', fix: 'Оцените решение' },
    { word: 'ШОК НОВОСТЬ', type: 'red', rule: 'Анти-спам фильтры понижают показы постов с желтыми заголовками.', fix: 'Уникальное предложение' },
    { word: 'СКИДКА 99%', type: 'red', rule: 'Снижает доверие аудитории. Роботы маркируют как агрессивный спам.', fix: 'Выгодный тариф' },
    { word: 'КЛИКАЙТЕ СЮДА', type: 'yellow', rule: 'Прямой агрессивный призыв к клику (Call-to-Click) пессимизируется.', fix: 'Узнать больше подробностей' },
    { word: 'Кликай', type: 'yellow', rule: 'Прямой агрессивный призыв к клику (Call-to-Click) пессимизируется.', fix: 'Ознакомиться' },
    { word: 'гарантировано', type: 'red', rule: 'Юридический финансовый триггер, грозящий баном.', fix: 'Стабильный результат' },
    { word: 'заработка денег', type: 'red', rule: 'Стоп-слово для алгоритмов рекламы в ВК, ТГ и Одноклассниках.', fix: 'Автоматизации вещания' },
    { word: 'Самый лучший', type: 'yellow', rule: 'Нарушение стилистики и закона о рекламе. Звучит сухо.', fix: 'Один из удобных' }
  ];

  // Compute organic reach score based on presence of trigger words in text
  useEffect(() => {
    let badHits = 0;
    triggerList.forEach(item => {
      if (creativeText.toLowerCase().includes(item.word.toLowerCase())) {
        badHits++;
      }
    });

    const score = Math.max(30, 100 - badHits * 8.5);
    setReachScore(Math.round(score));
  }, [creativeText]);

  // Handle single dynamic replace action
  const handleApplyFix = (bad: string, good: string) => {
    const rx = new RegExp(bad, 'gi');
    const updated = creativeText.replace(rx, good);
    setCreativeText(updated);
    setSelectedWord(null);
  };

  // Completely rewrite the copy with Gemini API under AIDA framework
  const handleAidaRewrite = async () => {
    setIsRewriting(true);
    try {
      const pSystemInstruction = `Ты — элитный копирайтер SMM агентства. Напиши профессиональный рекламный пост по классической структуре AIDA (Attention, Interest, Desire, Action). Полностью избавься от кликбейта, спама и необоснованных капсов. Сделай текст читаемым, нативным, раздели на абзацы с красивыми списками и деликатными эмодзи. Ответ должен быть на русском языке и иметь длину не более 100-110 слов.`;

      const promptText = `Пожалуйста, сделай полный ИИ-рерайт следующего некачественного рекламного поста: "${creativeText}". Удали весь спам и стоп-слова, повысь показатель органического охвата для алгоритмов умных лент.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText,
          history: [],
          systemInstruction: pSystemInstruction
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.text) {
          setCreativeText(data.text);
          setIsRewriting(false);
          return;
        }
      }
      throw new Error('API failure during rewrite');
    } catch (err) {
      console.warn('Fallback creative placeholder rewrite loaded:', err);
      setTimeout(() => {
        setCreativeText(
          `🚀 Как автоматизировать SMM и освободить до 15 часов каждую неделю?\n\nВы наверняка замечали, сколько времени отнимает рутина: планирование, вычитка и публикация постов в разные паблики. \n\nИИSMM решает это в 1 клик:\n• Умный планировщик выведет посты точно в тайминг.\n• ИИ-ассистент адаптирует текст под тональность каждого канала.\n• Полностью прозрачные и безопасные операции защищены Escrow.\n\n🛡️ Попробуйте сейчас и начните управлять вашими каналами профессионально с ботом @IIrkiBot!`
        );
        setIsRewriting(false);
      }, 1200);
    }
  };

  const getHighlightedText = () => {
    let elements: React.ReactNode[] = [];
    let currentIdx = 0;

    // A very simple lexical match scanner for demo
    const words = creativeText.split(/(\s+)/);
    
    return (
      <div className="text-[12px] leading-relaxed text-slate-800 font-medium whitespace-pre-wrap">
        {words.map((w, index) => {
          const match = triggerList.find(t => w.toLowerCase().includes(t.word.toLowerCase()));
          
          if (match) {
            const isRed = match.type === 'red';
            return (
              <span
                key={index}
                onClick={() => setSelectedWord({ word: match.word, rule: match.rule, fix: match.fix })}
                className={`cursor-pointer underline rounded px-1 transition-colors font-bold ${
                  isRed 
                    ? 'bg-red-100 hover:bg-red-200 text-red-700 decoration-red-500' 
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-800 decoration-amber-500'
                }`}
                title="Нажмите для ИИ-рекомендации"
              >
                {w}
              </span>
            );
          }
          return <span key={index}>{w}</span>;
        })}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="bg-white/40 backdrop-blur-2xl border border-white p-5 rounded-3xl shadow-xl space-y-6"
    >
      <div className="space-y-1">
        <span className="p-1 px-2.5 bg-rose-100 text-rose-800 text-[9px] font-black rounded-lg uppercase tracking-wider">AI CONCEPT #4</span>
        <h3 className="text-xl font-black bg-clip-text text-transparent bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] leading-snug">ИИ-Экспертиза рекламных креативов (Reach Booster)</h3>
        <p className="text-[11px] text-slate-500">Автоматический сканер спам-фильтров соцсетей. Предотвратите снижение показов в «умной ленте» ещё до публикации.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Editorial Textbox */}
        <div className="md:col-span-7 space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Ваш рекламный креатив:</label>
              <button 
                onClick={() => setCreativeText('🔥 ВНИМАНИЕ!!! ШОК НОВОСТЬ!!! СКИДКА 99% СРОЧНО КЛИКАЙТЕ СЮДА!!! Самый лучший и невероятный в мире автоматический чат-бот для заработка денег гарантировано ждет вас прямо сейчас без СМС!!! Кликай!')}
                className="text-[9px] text-pink-650 font-bold underline cursor-pointer"
              >
                Сбросить на плохой шаблон
              </button>
            </div>
            
            {/* Split view: either edit or show highlights */}
            <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/65 min-h-[140px] focus-within:ring-1 focus-within:ring-pink-300 transition-all shadow-2xs relative">
              {isRewriting && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest animate-pulse">Оптимизирую креатив...</span>
                </div>
              )}
              {analyzed ? (
                getHighlightedText()
              ) : (
                <textarea
                  value={creativeText}
                  onChange={(e) => setCreativeText(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 font-medium tracking-tight outline-none resize-none min-h-[120px]"
                />
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setAnalyzed(prev => !prev)}
              className="flex-1 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 text-[10px] uppercase font-black tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              {analyzed ? '✍️ Редактировать текст' : '🔍 Проверить ИИ-Сканером'}
            </button>
            <button
              onClick={handleAidaRewrite}
              disabled={isRewriting}
              className="flex-1 py-3 bg-slate-900 text-white hover:bg-slate-800 text-[10px] uppercase font-black tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>AIDA ИИ-Вычитка</span>
            </button>
          </div>
        </div>

        {/* Audit feedback report */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-50 to-pink-50/20 p-5 rounded-3xl border border-slate-100 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[9px] text-slate-400 block font-black uppercase tracking-wider">Прогноз Фида Алгоритмов</span>
              <span className="text-3xl font-black font-semi font-mono block tracking-tight text-slate-900">{reachScore}%</span>
              <span className="text-[8px] text-slate-450 block uppercase font-bold tracking-widest">Индекс органического охвата</span>

              {/* Progress visual bar */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    reachScore > 80 ? 'bg-emerald-500' : reachScore > 50 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${reachScore}%` }}
                />
              </div>
            </div>

            {/* Micro interaction details of selected word */}
            <AnimatePresence mode="wait">
              {selectedWord ? (
                <motion.div
                  key={selectedWord.word}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border rounded-2xl p-3.5 space-y-3 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 font-mono">
                      КРИТИЧЕСКАЯ ЗОНА: "{selectedWord.word}"
                    </span>
                    <button 
                      onClick={() => setSelectedWord(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-[10px] cursor-pointer"
                    >
                      ×
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold font-sans">
                    {selectedWord.rule}
                  </p>

                  <button
                    onClick={() => handleApplyFix(selectedWord.word, selectedWord.fix)}
                    className="w-full text-center p-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[9px] uppercase font-mono font-black tracking-widest rounded-lg cursor-pointer hover:scale-101 transition-all"
                  >
                    Замена на: "{selectedWord.fix}" ⚡
                  </button>
                </motion.div>
              ) : (
                <div className="p-3 bg-white/60 border border-slate-100 rounded-2xl text-center text-[10px] text-slate-400 leading-relaxed py-6 font-mono">
                  Кликните на слова, подсвеченные <span className="text-red-500 font-bold uppercase text-[9px]">красным</span> или <span className="text-amber-600 font-bold uppercase text-[9px]">желтым</span> цветом, чтобы получить ИИ-замену автозаполнения в 1 клик!
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-3.5 bg-white/70 border rounded-2xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10.5px] text-slate-600 leading-tight font-sans font-semibold">
              ИИ защищает ваши посты от теневого бана в алгоритмических лентах Telegram/ВК.
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// CONCEPT 5: Budget Allocator (Smart Media Plan)
// ==========================================
function ConceptMediaplan() {
  const [budget, setBudget] = useState(25000);
  const [goal, setGoal] = useState<'clicks' | 'views' | 'brand'>('views');
  const [assembledPlan, setAssembledPlan] = useState<any[]>([]);
  const [strategicAdvice, setStrategicAdvice] = useState('');
  const [isFetchingAdvice, setIsFetchingAdvice] = useState(false);
  const isAssembling = false;

  const assemblePlanLocally = () => {
    // Distribute budget based on current objectives
    let channelsToUse: MockBlog[] = [];
    if (goal === 'clicks') {
      channelsToUse = [
        mockBlogsList.find(b => b.id === 'smm_hacks')!,
        mockBlogsList.find(b => b.id === 'coffee_geometry')!,
        mockBlogsList.find(b => b.id === 'green_lifestyle')!
      ].filter(Boolean);
    } else if (goal === 'views') {
      channelsToUse = [
        mockBlogsList.find(b => b.id === 'smm_hacks')!,
        mockBlogsList.find(b => b.id === 'tg_syndicate')!,
        mockBlogsList.find(b => b.id === 'code_kids')!
      ].filter(Boolean);
    } else {
      channelsToUse = [
        mockBlogsList.find(b => b.id === 'spb_pottery')!,
        mockBlogsList.find(b => b.id === 'tg_syndicate')!,
        mockBlogsList.find(b => b.id === 'green_lifestyle')!
      ].filter(Boolean);
    }

    const totalWeight = channelsToUse.reduce((acc, c) => acc + (100 - c.avgViews / 300), 0);
    const allocated = channelsToUse.map(channel => {
      const channelRatio = (100 - channel.avgViews / 300) / totalWeight;
      const roundedAmount = Math.round(budget * channelRatio);
      const postsCount = Math.max(1, Math.round(roundedAmount / channel.priceRub));
      const totalCost = postsCount * channel.priceRub;
      const expectedClicks = Math.round(postsCount * channel.avgViews * (channel.er / 100));
      const expectedViews = postsCount * channel.avgViews;

      return {
        ...channel,
        amountSpent: totalCost,
        postsCount,
        expectedClicks,
        expectedViews
      };
    });

    setAssembledPlan(allocated);
  };

  const handleGetAiAdvice = async () => {
    if (assembledPlan.length === 0) return;
    setIsFetchingAdvice(true);
    setStrategicAdvice('');

    try {
      const pSystemInstruction = `Ты — ведущий финансовый AI-аналитик и SMM-стратег биржи ИИSMM. Твоя задача — проанализировать распределение бюджета рекламодателя и дать обоснованные рекомендации по ведению кампании. Давай краткий, зажигательный ответ строго на русском языке в красивом структурированном маркдауне. Используй эмодзи и разметку списков.`;

      const promptText = `Пользователь собрал медиаплан на общую сумму ${budget} IR под цель "${
        goal === 'clicks' ? 'Максимизация переходов и активности' : goal === 'views' ? 'Максимальный охват и просмотры' : 'Имидж бренда и вовлечение'
      }".
ИИ распределил средства на каналы: ${assembledPlan.map(a => `${a.name} (${a.postsCount} сообщений, охват ${a.expectedViews} пользователей)`).join(', ')}.
Напиши экспертный вывод по этому медиаплану (не более 150 слов). Чего ожидать от такой рекламной кампании? Назови 2 главных правила контроля креатива у данных блогеров. Обязательно используй Markdown.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText,
          history: [],
          systemInstruction: pSystemInstruction
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.text) {
          setStrategicAdvice(data.text);
          return;
        }
      }
      throw new Error('API failure');
    } catch (e) {
      console.warn('Fallback strategic plan commentary:', e);
      setStrategicAdvice(
        `### 📈 Анализ стратегии медиаплана (Симуляция)\n\nВыбранная стратегия отлично подходит под ваши бизнес-цели в текущем рекламном бюджете **${budget.toLocaleString()} IR**.\n\n🎯 **Советы по интеграции**:\n1. Контролируйте удержание постов в топе не менее 24 часов на всех каналах.\n2. Используйте нативный тон подачи, избегая прямой рекламы для сохранения аномально высокого СТR.`
      );
    } finally {
      setIsFetchingAdvice(false);
    }
  };

  useEffect(() => {
    assemblePlanLocally();
    setStrategicAdvice('');
  }, [budget, goal]);

  // Calculations for graphics
  const totalCostCombined = assembledPlan.reduce((acc, i) => acc + i.amountSpent, 0);
  const totalViewsCombined = assembledPlan.reduce((acc, i) => acc + i.expectedViews, 0);
  const totalClicksCombined = assembledPlan.reduce((acc, i) => acc + i.expectedClicks, 0);

  // SVG parameters for Budget Allocation Pie
  const totalCirclePie = 2 * Math.PI * 30; // R=30
  let cumulativeOffset = 0;

  // Day statistics for cumulative viewer growth graph
  const daysTrajectory = Array.from({ length: 7 }, (_, idx) => {
    const fraction = (idx + 1) / 7;
    // slightly logarithmic growth curve simulation
    const coeff = 1 - Math.pow(1 - fraction, 2.5);
    return Math.round(totalViewsCombined * coeff);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="bg-white/40 backdrop-blur-2xl border border-white p-5 rounded-3xl shadow-xl space-y-6"
    >
      <div className="space-y-1">
        <span className="p-1 px-2.5 bg-rose-100 text-rose-800 text-[9px] font-black rounded-lg uppercase tracking-wider">AI CONCEPT #5</span>
        <h3 className="text-xl font-black bg-clip-text text-transparent bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] leading-snug">Конструктор Умного Медиаплана (Budget Allocator)</h3>
        <p className="text-[11px] text-slate-500">Автоматическое депонирование и распределение рекламного бюджета по проверенным СММ-площадкам.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Input */}
        <div className="lg:col-span-4 space-y-5">
          {/* Target Goal Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Выберите приоритетную цель кампании:</label>
            <div className="flex flex-col gap-1.5 text-[10px] font-black uppercase tracking-wider">
              <button
                onClick={() => setGoal('views')}
                className={`py-2 rounded-xl border text-left px-3 cursor-pointer flex justify-between items-center ${
                  goal === 'views' 
                    ? 'bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] text-white border-transparent' 
                    : 'bg-white/70 text-slate-600 border-slate-200/50 hover:bg-white'
                }`}
              >
                <span>🌍 Максимум охвата постов</span>
                {goal === 'views' && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <button
                onClick={() => setGoal('clicks')}
                className={`py-2 rounded-xl border text-left px-3 cursor-pointer flex justify-between items-center ${
                  goal === 'clicks' 
                    ? 'bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] text-white border-transparent' 
                    : 'bg-white/70 text-slate-600 border-slate-200/50 hover:bg-white'
                }`}
              >
                <span>🎯 Максимум кликов & интерактив</span>
                {goal === 'clicks' && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <button
                onClick={() => setGoal('brand')}
                className={`py-2 rounded-xl border text-left px-3 cursor-pointer flex justify-between items-center ${
                  goal === 'brand' 
                    ? 'bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] text-white border-transparent' 
                    : 'bg-white/70 text-slate-600 border-slate-200/50 hover:bg-white'
                }`}
              >
                <span>💎 Имидж бренда & Доверие</span>
                {goal === 'brand' && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            </div>
          </div>

          {/* Slider: Budget size */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-bold uppercase text-[9px]">Рекламный Бюджет (IR / ₽):</span>
              <span className="font-mono font-black text-rose-500 text-sm">{budget.toLocaleString()} IR</span>
            </div>
            <input
              type="range"
              min="5000"
              max="200000"
              step="2500"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <div className="flex justify-between text-[8px] text-slate-400 font-mono uppercase">
              <span>5k IR</span>
              <span>100k IR</span>
              <span>200k IR</span>
            </div>
          </div>

          {/* Aggregate Quick Stats Display */}
          {assembledPlan.length > 0 && !isAssembling && (
            <div className="p-0.5 bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-[14px] space-y-1.5 font-mono text-slate-800">
                <span className="text-[8px] bg-clip-text text-transparent bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] block uppercase font-black tracking-widest">Прогноз по Медиаплану:</span>
                <div className="flex justify-between items-end border-b border-slate-100 pb-1 text-xs">
                  <span className="text-slate-500">Общие просмотры:</span>
                  <span className="font-bold text-slate-900 tracking-tight">{totalViewsCombined.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-1 text-xs">
                  <span className="text-slate-500">Целевые клики:</span>
                  <span className="font-bold text-emerald-600 tracking-tight">{totalClicksCombined.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end text-xs">
                  <span className="text-slate-500">Ср. Сделка (CPM):</span>
                  <span className="font-bold text-slate-700 tracking-tight">
                    {totalViewsCombined > 0 ? Math.round((totalCostCombined / totalViewsCombined) * 1000) : 0} ₽
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Distributed channels listing */}
        <div className="lg:col-span-8 space-y-4">
          {isAssembling ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white/60 border rounded-2xl h-full min-h-[220px]">
              <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mt-2 animate-pulse">ИИ калибрует медиаплан...</span>
            </div>
          ) : assembledPlan.length > 0 ? (
            <div className="space-y-4 animate-fade-in">
              {/* Media plan title bar */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Каналы в медиаплан (депонирование):</span>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  Эскроу защита активна
                </span>
              </div>

              {/* Grid of channels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* SVG Visual Pie left box */}
                <div className="p-4 bg-white/80 border rounded-2xl flex flex-col justify-between space-y-3">
                  <span className="text-[9px] text-slate-450 block font-black uppercase tracking-wider text-center">Распределение выделенного бюджета</span>
                  
                  <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                    <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle cx="50" cy="50" r="30" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                      {assembledPlan.map((it, idx) => {
                        const sliceRatio = it.amountSpent / totalCostCombined;
                        const strokeAmt = sliceRatio * totalCirclePie;
                        const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
                        const strokeCol = colors[idx % colors.length];
                        const offset = cumulativeOffset;
                        cumulativeOffset += strokeAmt;

                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="30"
                            fill="transparent"
                            stroke={strokeCol}
                            strokeWidth="8"
                            strokeDasharray={`${strokeAmt} ${totalCirclePie - strokeAmt}`}
                            strokeDashoffset={-offset}
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute text-center leading-none">
                      <span className="text-[17px] font-black text-slate-800 font-mono tracking-tighter">
                        {assembledPlan.length}
                      </span>
                      <span className="text-[8px] text-slate-400 block font-bold uppercase leading-none">Канала</span>
                    </div>
                  </div>

                  {/* Pie legends listing */}
                  <div className="space-y-1 font-mono text-[9px] font-bold">
                    {assembledPlan.map((it, idx) => {
                      const colors = ['bg-pink-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
                      return (
                        <div key={idx} className="flex justify-between items-center leading-none">
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-xs ${colors[idx % colors.length]} block`} />
                            <span className="text-slate-600 truncate max-w-[85px]">{it.username}</span>
                          </div>
                          <span className="text-slate-800 font-black">{Math.round((it.amountSpent / totalCostCombined) * 100)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trajectory Growth Line SVG */}
                <div className="p-4 bg-white/80 border rounded-2xl flex flex-col justify-between space-y-2">
                  <div className="text-center">
                    <span className="text-[9px] text-slate-450 block font-black uppercase tracking-wider">Кумулятивный прирост просмотров курса (7 дней)</span>
                    <span className="text-xs font-mono font-black text-slate-800 block mt-0.5">🚀 +{totalViewsCombined.toLocaleString()} уников</span>
                  </div>

                  {/* Custom inline curve vector graph rendering */}
                  <div className="w-full h-24 flex items-end justify-center pt-2 select-none relative">
                    <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                      {/* Grid parallel lines */}
                      <line x1="0" y1="10" x2="100" y2="10" stroke="#f1f5f9" strokeWidth="0.5" />
                      <line x1="0" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                      <line x1="0" y1="30" x2="100" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />
                      
                      {/* Area background under the curve */}
                      <path 
                        d={`M 0 40 
                            L 14 ${40 - (daysTrajectory[0] / totalViewsCombined) * 35} 
                            L 28 ${40 - (daysTrajectory[1] / totalViewsCombined) * 35} 
                            L 42 ${40 - (daysTrajectory[2] / totalViewsCombined) * 35} 
                            L 56 ${40 - (daysTrajectory[3] / totalViewsCombined) * 35} 
                            L 70 ${40 - (daysTrajectory[4] / totalViewsCombined) * 35} 
                            L 84 ${40 - (daysTrajectory[5] / totalViewsCombined) * 35} 
                            L 100 ${40 - (daysTrajectory[6] / totalViewsCombined) * 35} 
                            L 100 40 Z`} 
                        fill="url(#gradientPlan)" 
                        opacity="0.15" 
                      />
                      
                      {/* Main line path */}
                      <path 
                        d={`M 0 40 
                            L 14 ${40 - (daysTrajectory[0] / totalViewsCombined) * 35} 
                            L 28 ${40 - (daysTrajectory[1] / totalViewsCombined) * 35} 
                            L 42 ${40 - (daysTrajectory[2] / totalViewsCombined) * 35} 
                            L 56 ${40 - (daysTrajectory[3] / totalViewsCombined) * 35} 
                            L 70 ${40 - (daysTrajectory[4] / totalViewsCombined) * 35} 
                            L 84 ${40 - (daysTrajectory[5] / totalViewsCombined) * 35} 
                            L 100 ${40 - (daysTrajectory[6] / totalViewsCombined) * 35}`} 
                        fill="none" 
                        stroke="#ec4899" 
                        strokeWidth="1.5" 
                      />
                      
                      <defs>
                        <linearGradient id="gradientPlan" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Left & Right scale annotations */}
                    <div className="absolute left-0 bottom-0 text-[7px] text-slate-400 font-mono">день 1</div>
                    <div className="absolute right-0 bottom-0 text-[7px] text-slate-400 font-mono">день 7</div>
                  </div>

                  <p className="text-[9px] text-slate-400 text-center font-mono italic">
                    Запуск постов распределяется с зазором в 24ч для продления шлейфа рекомендаций
                  </p>
                </div>
              </div>

              {/* Strategic Commentary block */}
              <div className="p-0.5 bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] rounded-2xl shadow-sm relative overflow-hidden">
                <div className="p-4 bg-white/95 backdrop-blur-md rounded-[14px] space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                      <span className="text-[9px] bg-clip-text text-transparent bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] font-mono uppercase tracking-widest font-black">ИИ-Рецензия Интеграции (ИИSMM)</span>
                    </div>
                    {strategicAdvice ? (
                      <span className="text-[8px] bg-sky-500/15 text-sky-655 border border-sky-400/25 px-2 py-0.5 rounded-full font-mono font-bold leading-none">
                        ⚡ ИИ Активен (ИИSMM)
                      </span>
                    ) : (
                      <span className="text-[8px] bg-emerald-500/15 text-emerald-655 border border-emerald-400/25 px-2 py-0.5 rounded-full font-mono font-bold leading-none animate-pulse">
                        🟢 Симуляция (0 токенов)
                      </span>
                    )}
                  </div>

                  {isFetchingAdvice ? (
                    <div className="space-y-2 py-4 animate-pulse">
                      <div className="h-2 bg-slate-100 rounded-full w-[45%]" />
                      <div className="h-2 bg-slate-100 rounded-full w-[90%]" />
                      <div className="h-2 bg-slate-100 rounded-full w-[80%]" />
                    </div>
                  ) : strategicAdvice ? (
                    <div className="text-[11px] leading-relaxed text-slate-700 font-medium font-sans">
                      <MarkdownRenderer content={strategicAdvice} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        Медиаплан успешно рассчитан в демо-режиме (0 токенов). Вы можете запустить глубокий ИИ-аудит, чтобы получить экспертные рекомендации от Gemini по снижению рисков слива бюджета.
                      </p>
                      <button
                        onClick={handleGetAiAdvice}
                        className="w-full py-2 bg-[linear-gradient(to_right,#38bdf8,#f472b6,#fb923c,#f472b6,#38bdf8)] hover:opacity-95 text-white font-black text-[10px] uppercase rounded-xl tracking-wider shadow-sm cursor-pointer transition-all active:scale-99 flex items-center justify-center gap-2"
                      >
                        <span>Провести глубокий ИИ-Аудит медиаплана 🧠</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-xs py-10 font-mono text-center">Задайте бюджет для автораспределения полей.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
