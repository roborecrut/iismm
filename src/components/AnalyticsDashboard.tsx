import React, { useState } from 'react';
import { 
  TrendingUp, Eye, MousePointer, Wallet, ArrowUpRight, BarChart3, Radio, Link, Calendar, CheckSquare, Layers
} from 'lucide-react';

interface AnalyticsDashboardProps {
  channelsCount: number;
  postsCount: number;
  totalViews: number;
  totalClicks: number;
  balanceRub: number;
  earningsRub: number;
}

export default function AnalyticsDashboard({
  channelsCount,
  postsCount,
  totalViews,
  totalClicks,
  balanceRub,
  earningsRub
}: AnalyticsDashboardProps) {
  
  // Interactive UTM Campaign stats
  const [activeMetricFilter, setActiveMetricFilter] = useState<'views' | 'clicks' | 'growth'>('views');

  // Withdrawal States for the specified 25% commission rule from exchange
  const [withdrawAmount, setWithdrawAmount] = useState('5000');
  const [withdrawMethod, setWithdrawMethod] = useState<'card' | 'qiwi' | 'stars'>('card');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'checking' | 'success'>('idle');

  const parsedWithdraw = Number(withdrawAmount) || 0;
  const commissionFee = Math.round(parsedWithdraw * 0.25);
  const payoutAmount = Math.max(0, parsedWithdraw - commissionFee);

  const handleWithdrawFunds = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedWithdraw < 100) {
      alert('Минимальная сумма для вывода — 100 ₽');
      return;
    }
    if (!withdrawAccount.trim()) {
      alert('Пожалуйста, введите реквизиты для вывода средств!');
      return;
    }
    setWithdrawStatus('checking');
    setTimeout(() => {
      setWithdrawStatus('success');
      alert(`Заявка оформлена! ${payoutAmount} ₽ будут отправлены на ваши реквизиты в течение 24 часов. Комиссия биржи соавторов (25%): ${commissionFee} ₽ вычтена.`);
    }, 1200);
  };

  // Simulated UTM Source campaign breakdowns
  const UTM_SOURCES = [
    { source: 'tg_folder_promo', clicks: Math.round(totalClicks * 0.45), category: 'Mutual Folder', cr: '12.4%' },
    { source: 'vk_cross_post', clicks: Math.round(totalClicks * 0.25), category: 'Crossposting', cr: '8.1%' },
    { source: 'iismm_board', clicks: Math.round(totalClicks * 0.18), category: 'Bulletin Feed', cr: '14.2%' },
    { source: 'organic_search', clicks: Math.round(totalClicks * 0.12), category: 'Web Grounding', cr: '9.6%' }
  ];

  // Handcrafted premium SVG responsive coordinates for statistical trends
  const trendPoints = {
    views: [
      { date: '18 Мая', val: 3400, label: '3.4k' },
      { date: '19 Мая', val: 4200, label: '4.2k' },
      { date: '20 Мая', val: 4900, label: '4.9k' },
      { date: '21 Мая', val: 6800, label: '6.8k' },
      { date: '22 Мая', val: 8200, label: '8.2k' },
      { date: '23 Мая', val: totalViews, label: `${(totalViews/1000).toFixed(1)}k` }
    ],
    clicks: [
      { date: '18 Мая', val: 120, label: '120' },
      { date: '19 Мая', val: 180, label: '180' },
      { date: '20 Мая', val: 240, label: '240' },
      { date: '21 Мая', val: 390, label: '390' },
      { date: '22 Мая', val: 450, label: '450' },
      { date: '23 Мая', val: totalClicks, label: `${totalClicks}` }
    ],
    growth: [
      { date: '18 Мая', val: 23, label: '+23' },
      { date: '19 Мая', val: 45, label: '+45' },
      { date: '20 Мая', val: 34, label: '+34' },
      { date: '21 Мая', val: 89, label: '+89' },
      { date: '22 Мая', val: 120, label: '+120' },
      { date: '23 Мая', val: 145, label: '+145' }
    ]
  };

  const activeTrend = trendPoints[activeMetricFilter];
  const maxVal = Math.max(...activeTrend.map((t) => t.val));
  const minVal = Math.min(...activeTrend.map((t) => t.val));

  // SVG drawing logic height multiplier
  const heightMultiplier = maxVal > minVal ? 110 / (maxVal - minVal) : 1;

  return (
    <div className="space-y-6">
      
      {/* Bento Grid layout statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        
        {/* Bento 1: Views Counter */}
        <div 
          onClick={() => setActiveMetricFilter('views')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeMetricFilter === 'views' 
              ? 'bg-orange-500/10 border-orange-300 ring-2 ring-orange-200' 
              : 'bg-white/80 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider block">Охват / Просмотры</span>
            <Eye className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{totalViews.toLocaleString()}</h3>
            <span className="text-[10px] text-pink-600 font-bold flex items-center gap-0.5 mt-1.5">
              <TrendingUp className="w-3 h-3" /> +14.2% Свежий прирост
            </span>
          </div>
        </div>

        {/* Bento 2: Click counters */}
        <div 
          onClick={() => setActiveMetricFilter('clicks')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeMetricFilter === 'clicks' 
              ? 'bg-pink-500/10 border-pink-300 ring-2 ring-pink-200' 
              : 'bg-white/80 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider block">Клики по UTM</span>
            <MousePointer className="w-4 h-4 text-pink-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{totalClicks.toLocaleString()}</h3>
            <span className="text-[10px] text-pink-600 font-bold flex items-center gap-0.5 mt-1.5">
              <TrendingUp className="w-3 h-3" /> +28.4% Свежий прирост
            </span>
          </div>
        </div>

        {/* Bento 3: Channels limit */}
        <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 hover:bg-white transition-all">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider block">Каналы & Посты</span>
            <BarChart3 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{channelsCount} / {postsCount}</h3>
            <p className="text-[11px] text-slate-400 mt-1.5">Подключено блогов и сделано постов соответственно.</p>
          </div>
        </div>

        {/* Bento 4: Accumulated revenues */}
        <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 hover:bg-white transition-all">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider block">Заработано (Чистыми)</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-850 tracking-tight">{earningsRub} ₽</h3>
            <span className="text-[10px] text-slate-400 block mt-1.5">Комиссионный баланс: {balanceRub} ₽</span>
          </div>
        </div>

      </div>

      {/* Visual Chart Panel */}
      <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <span className="text-xs font-extrabold text-slate-400 tracking-wider block uppercase">Анализ SMM эффективности</span>
            <h4 className="font-extrabold text-slate-800 text-sm mt-0.5">
              {activeMetricFilter === 'views' ? 'Динамика просмотров' :
               activeMetricFilter === 'clicks' ? 'Переходы по UTM ссылкам' : 'Общий прирост аудитории за день'}
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Обновлено: Сегодня, 13:37</span>
        </div>

        {/* Handy curve SVG graph */}
        <div className="h-44 w-full relative pt-4">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {/* Horizontal Gridlines */}
            <line x1="0" y1="20" x2="100%" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="70" x2="100%" y2="70" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="120" x2="100%" y2="120" stroke="#f1f5f9" strokeWidth="1" />

            {/* Glowing Gradient fill for curve underlay */}
            <defs>
              <linearGradient id="chart-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={activeMetricFilter === 'views' ? '#f97316' : activeMetricFilter === 'clicks' ? '#ec4899' : '#f43f5e'} stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
              </linearGradient>
            </defs>

            {/* Graph Paths */}
            <path 
              d={`
                M 0 140 
                L ${activeTrend.map((p, idx) => `${idx * 100}% ${130 - (p.val - minVal) * heightMultiplier}`).join(' L ')} 
                L 100% 140 Z
              `}
              fill="url(#chart-glow)"
              style={{ transition: 'all 0.5s ease' }}
            />
            
            <path 
              d={activeTrend.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${idx * (95 / (activeTrend.length - 1)) + 2.5}% ${130 - (p.val - minVal) * heightMultiplier}`).join(' ')}
              fill="none" 
              stroke={activeMetricFilter === 'views' ? '#f97316' : activeMetricFilter === 'clicks' ? '#ec4899' : '#f43f5e'} 
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{ transition: 'all 0.5s ease' }}
            />

            {/* Interactive dot nodes on vertices */}
            {activeTrend.map((p, idx) => {
              const xPos = idx * (95 / (activeTrend.length - 1)) + 2.5;
              const yPos = 130 - (p.val - minVal) * heightMultiplier;
              return (
                <g key={idx} className="group cursor-pointer">
                  <circle 
                    cx={`${xPos}%`} 
                    cy={yPos} 
                    r="5.5" 
                    fill="#ffffff" 
                    stroke={activeMetricFilter === 'views' ? '#f97316' : activeMetricFilter === 'clicks' ? '#ec4899' : '#f43f5e'} 
                    strokeWidth="3"
                    style={{ transition: 'all 0.5s ease' }}
                  />
                  
                  {/* Tooltip labels */}
                  <text 
                    x={`${xPos}%`} 
                    y={yPos - 12} 
                    textAnchor="middle" 
                    className="text-[10px] font-bold fill-slate-700 font-mono"
                    style={{ transition: 'all 0.5s ease' }}
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* X-axis time representations */}
        <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-mono font-extrabold text-slate-400">
          {activeTrend.map((t, idx) => <span key={idx}>{t.date}</span>)}
        </div>

      </div>

      {/* 25% Exchange commission Withdrawal panel */}
      <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-sm space-y-4">
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm">Вывод заработанных средств с биржи</h4>
          <p className="text-xs text-slate-500 mt-0.5">Переводите заработанные средства соавторов или партнеров на свои личные кошельки.</p>
        </div>

        <form onSubmit={handleWithdrawFunds} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          <div className="md:col-span-4 space-y-1.5 text-xs">
            <label className="text-[10px] text-slate-400 font-bold uppercase block">Сумма к выводу (₽):</label>
            <input 
              type="number" 
              required
              min={100}
              placeholder="5000"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          <div className="md:col-span-4 space-y-1.5 text-xs">
            <label className="text-[10px] text-slate-400 font-bold uppercase block">Платежная система:</label>
            <select
              value={withdrawMethod}
              onChange={e => setWithdrawMethod(e.target.value as any)}
              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="card">💳 Банковская карта РФ (Visa/MIR)</option>
              <option value="qiwi">👛 QIWI Кошелек</option>
              <option value="stars">✈️ Telegram Stars</option>
            </select>
          </div>

          <div className="md:col-span-4 space-y-1.5 text-xs">
            <label className="text-[10px] text-slate-400 font-bold uppercase block">Номер карты / реквизиты:</label>
            <input 
              type="text" 
              required
              placeholder="4276 •••• •••• ••••"
              value={withdrawAccount}
              onChange={e => setWithdrawAccount(e.target.value)}
              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {/* Commission calculations live display */}
          <div className="md:col-span-12 p-3 bg-orange-50 text-orange-950 border border-orange-100 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="block text-[9px] text-orange-605 font-mono uppercase font-bold leading-none mb-1">Сумма запроса:</span>
              <span className="font-mono font-black">{parsedWithdraw} ₽</span>
            </div>
            <div>
              <span className="block text-[9px] text-rose-500 font-mono uppercase font-bold leading-none mb-1">Комиссия биржи (25%):</span>
              <span className="font-mono font-bold text-rose-600">-{commissionFee} ₽</span>
            </div>
            <div>
              <span className="block text-[9px] text-pink-605 font-mono uppercase font-bold leading-none mb-1">Вы получите чистыми:</span>
              <span className="font-mono font-black text-pink-605 text-sm">{payoutAmount} ₽</span>
            </div>
          </div>

          <div className="md:col-span-12 flex justify-end">
            <button
              type="submit"
              disabled={withdrawStatus === 'checking'}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-400 via-pink-500 to-sky-450 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 uppercase font-sans tracking-wide border border-white/20 active:scale-98"
            >
              {withdrawStatus === 'checking' ? 'Оформление...' : 'Заказать вывод средств 🚀'}
            </button>
          </div>

        </form>

        {withdrawStatus === 'success' && (
          <div className="p-3 bg-orange-50 text-orange-900 border border-orange-100 text-xs rounded-xl font-semibold">
            🎉 Заявка на вывод {payoutAmount} ₽ успешно зарегистрирована и поставлена в системную очередь! Реквизиты: {withdrawAccount}.
          </div>
        )}
      </div>

      {/* UTM Referrals Campaign Sources listing */}
      <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-sm space-y-3.5">
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm">UTM-Сводка и источники переходов</h4>
          <p className="text-xs text-slate-500 mt-0.5">Встроенный UTM-генератор ИИSMM автоматически маркирует каждую исходящую ссылку.</p>
        </div>

        <div className="space-y-2">
          {UTM_SOURCES.map((itm, idx) => (
            <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between gap-4 text-xs font-medium">
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                  <Link className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="font-bold text-slate-800 block font-mono">utm_source={itm.source}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">{itm.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-right text-slate-700">
                <div>
                   <span className="block text-slate-400 text-[9px] uppercase font-sans">Клики</span>
                   <span className="font-bold text-slate-800">{itm.clicks}</span>
                </div>
                <div>
                   <span className="block text-slate-400 text-[9px] uppercase font-sans">Конверсия CR</span>
                   <span className="font-bold text-pink-600">{itm.cr}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
