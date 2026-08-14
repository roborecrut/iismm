import React, { useState } from 'react';
import { AdListing, BulletinAd, SocialNetwork, SocialChannel, AdOrder } from '../types';
import { 
  Megaphone, ShoppingBag, Eye, Star, CreditCard, ChevronRight, CheckCircle2, BadgeAlert, Plus, Layers, DollarSign, ExternalLink, RefreshCw, Send, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SocialIcon from './SocialIcon';

interface AdMarketplaceProps {
  adListings: AdListing[];
  bulletinAds: BulletinAd[];
  userTariff: 'free' | 'pro' | 'vip';
  userBalance: number;
  onPostBulletinAd: (ad: Omit<BulletinAd, 'id' | 'createdAt' | 'clicks'>) => void;
  onBuyAdSlot: (listingPrice: number) => void;
  onAddFunds: (amount: number) => void;
  onAdClick: (adId: string) => void;
  connectedChannels?: SocialChannel[];
  onAddAdListing?: (listing: Omit<AdListing, 'id'>) => void;
  onEarnMoney?: (amount: number, orderTitle: string, channelName: string) => void;
  advertiserOrders?: AdOrder[];
}

export default function AdMarketplace({
  adListings,
  bulletinAds,
  userTariff,
  userBalance,
  onPostBulletinAd,
  onBuyAdSlot,
  onAddFunds,
  onAdClick,
  connectedChannels = [],
  onAddAdListing,
  onEarnMoney,
  advertiserOrders = []
}: AdMarketplaceProps) {
  const [activeTab, setActiveTab] = useState<'exchange' | 'bulletin-feed'>('exchange');
  const [subTab, setSubTab] = useState<'all-channels' | 'submit-own' | 'advertiser-orders'>('all-channels');

  // State for listing own channel
  const [selectedChannelIdForListing, setSelectedChannelIdForListing] = useState('');
  const [listingPriceRub, setListingPriceRub] = useState('350000');
  const [listingDescription, setListingDescription] = useState('');
  const [listingAvgViews, setListingAvgViews] = useState('1500');

  // State for responding to advertiser order
  const [respondingOrder, setRespondingOrder] = useState<AdOrder | null>(null);
  const [selectedChannelIdForOrder, setSelectedChannelIdForOrder] = useState('');

  // Ad slot booking state
  const [bookingListing, setBookingListing] = useState<AdListing | null>(null);
  const [dealTermsAccepted, setDealTermsAccepted] = useState(false);

  // New Bulletin board ad state
  const [showBulletinForm, setShowBulletinForm] = useState(false);
  const [bullTitle, setBullTitle] = useState('');
  const [bullContent, setBullContent] = useState('');
  const [bullLink, setBullLink] = useState('');

  // SMM AD broker exchange escrow logic: 10% commission with transaction security
  const BROKER_COMMISSION_PERCENT = 10;

  const handleBookAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingListing) return;

    if (userBalance < bookingListing.priceRub) {
      if (confirm(`Ваш баланс маловат (${(userBalance * 1000).toLocaleString()} ИИрок). Пополнить на ${(bookingListing.priceRub * 1000).toLocaleString()} ИИрок для мгновенной сделки по бирже?`)) {
        onAddFunds(bookingListing.priceRub);
        onBuyAdSlot(bookingListing.priceRub);
        setBookingListing(null);
        alert('УСПЕХ: Оплата в ИИрках заблокирована на безопасном эскроу-счете ИИSMM. Сделка поступила в бот-контроллер рекламы!');
      }
      return;
    }

    onBuyAdSlot(bookingListing.priceRub);
    setBookingListing(null);
    alert('УСПЕХ: Оплата в ИИрках заблокирована на безопасном эскроу-счете ИИSMM. Сделка поступила в бот-контроллер рекламы!');
  };

  const handlePostBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bullTitle.trim() || !bullContent.trim() || !bullLink.trim()) {
      alert('Заполните заголовок, текст и ссылку объявления!');
      return;
    }

    // Free users must pay 200,000 ИИрок or upgrade to Premium
    if (userTariff === 'free') {
      if (confirm('Размещение в общей ленте без Premium-тарифа стоит 200,000 ИИрок за объявление. Оплатить?')) {
        onAddFunds(200);
      } else {
        return;
      }
    }

    onPostBulletinAd({
      title: bullTitle,
      content: bullContent,
      linkUrl: bullLink,
      postedBy: '@shishkarnem' // Simulated
    });

    setBullTitle('');
    setBullContent('');
    setBullLink('');
    setShowBulletinForm(false);
    alert('Объявление опубликовано на общей доске ИИSMM и уже доступно рекламодателям!');
  };

  return (
    <div className="space-y-6">
      
      {/* Exchange vs Bulletin Feed toggle header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Биржа & Лента Объявлений</h2>
          <p className="text-sm text-slate-500 mt-1">
            Закупайте интеграции безопасно или рекламируйте свои продукты в платной всеобщей ленте.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            id="tab-exchange-listings"
            onClick={() => setActiveTab('exchange')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'exchange' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📊 Биржа каналов (Безопасная сделка)
          </button>
          <button
            id="tab-bulletin-listings"
            onClick={() => {
              setActiveTab('bulletin-feed');
              setShowBulletinForm(false);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'bulletin-feed' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-orange-500" />
            Общая лента (Bulletin board)
          </button>
        </div>
      </div>

      {activeTab === 'exchange' ? (
        
        /* THE AD EXCHANGE / ADS BROKERAGE MODULE */
        <div className="space-y-6">
          
          <div className="p-4 bg-orange-50/60 backdrop-blur-md border border-orange-100/80 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 text-xs text-slate-700 leading-normal">
            <span className="p-2.5 bg-white rounded-xl shadow-sm border border-orange-150 text-base">🛡️</span>
            <div className="flex-1">
              <span className="font-bold text-slate-800 block text-[13px]">Безопасная SMM-сделка с эскроу-гарантом ИИSMM</span>
              <span>
                Средства резервируются на балансе и выплачиваются владельцу площадки только после успешного факта публикации и автоматической проверки ботом <a href="https://t.me/IIrkiBot" target="_blank" rel="noopener noreferrer" className="font-bold text-pink-650 hover:underline">@IIrkiBot</a>. Комиссия биржи составляет всего 10%.
              </span>
            </div>
          </div>

          {/* Sub-Tabs: Catalog vs Post Own Channel vs Advertiser Orders */}
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
            <button
              onClick={() => setSubTab('all-channels')}
              className={`px-4 py-2 text-xs font-black rounded-full transition-all cursor-pointer border ${
                subTab === 'all-channels'
                  ? 'bg-gradient-to-r from-orange-100 to-pink-100/90 border-white text-slate-900 shadow-2xs scale-[1.02]'
                  : 'bg-white/60 text-slate-600 hover:bg-white border-slate-200'
              }`}
            >
              📊 Каталог каналов ({adListings.length})
            </button>
            <button
              onClick={() => setSubTab('submit-own')}
              className={`px-4 py-2 text-xs font-black rounded-full transition-all cursor-pointer flex items-center gap-1.5 border ${
                subTab === 'submit-own'
                  ? 'bg-gradient-to-r from-orange-100 to-pink-100 border-white text-slate-900 shadow-2xs scale-[1.02]'
                  : 'bg-white/60 text-slate-600 hover:bg-white border-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-pink-500" />
              Разместить свой канал
            </button>
            <button
              onClick={() => setSubTab('advertiser-orders')}
              className={`px-4 py-2 text-xs font-black rounded-full transition-all cursor-pointer flex items-center gap-1.5 border ${
                subTab === 'advertiser-orders'
                  ? 'bg-gradient-to-r from-orange-100 to-pink-100 border-white text-slate-900 shadow-2xs scale-[1.02]'
                  : 'bg-white/60 text-slate-600 hover:bg-white border-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-orange-500" />
              Заказы рекламодателей ({advertiserOrders.length})
            </button>
          </div>

          <AnimatePresence mode="wait">
            {subTab === 'all-channels' ? (
              <motion.div
                key="all-channels"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {adListings.map((list) => (
                  <div key={list.id} className="p-5 rounded-2xl bg-white/80 border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-white border border-slate-200 font-mono shadow-xs">
                          <SocialIcon platform={list.platform} size={14} />
                          <span className="text-slate-700 font-bold uppercase text-[9px]">{list.platform}</span>
                        </span>
                        <span className="text-xs font-black text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                          {(list.priceRub * 1000).toLocaleString()} ИИрок
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base">{list.channelName}</h4>
                        <span className="text-xs text-slate-400 font-mono">{list.category}</span>
                      </div>

                      <p className="text-xs text-slate-600 italic">"{list.description}"</p>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs">
                        <div>
                          <span className="block text-slate-400 text-[10px]">Подписчики</span>
                          <span className="font-bold text-slate-700">{list.subscribersCount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[10px]">Средний охват</span>
                          <span className="font-bold text-slate-700">{list.avgViews.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3.5 border-t border-slate-100 mt-4">
                      <button
                        id={`btn-order-ad-${list.id}`}
                        onClick={() => setBookingListing(list)}
                        className="w-full py-2 bg-gradient-to-r from-orange-100 via-pink-100/80 to-orange-100/90 border border-orange-200 text-slate-900 font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95 active:scale-98 transition-all"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                        Заказать интеграцию
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : subTab === 'submit-own' ? (
              <motion.div
                key="submit-own"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto rounded-2xl bg-white/80 border border-slate-200 p-6 shadow-sm space-y-4"
              >
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">Добавить канал на Биржу</h4>
                  <p className="text-xs text-slate-500">Укажите ценники в ИИрках и условия. Рекламодатели смогут заказывать у вас авторазмещение по безопасной сделке.</p>
                </div>

                {connectedChannels.length === 0 ? (
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-center space-y-2">
                    <p className="text-xs text-amber-700 font-semibold">У вас нет подключенных каналов в личном кабинете!</p>
                    <p className="text-[11px] text-slate-500">Сначала перейдите во вкладку «Подключенные каналы» и привяжите свою площадку.</p>
                  </div>
                ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedChannelIdForListing) {
                        alert('Выберите канал!');
                        return;
                      }
                      const channel = connectedChannels.find(c => c.id === selectedChannelIdForListing);
                      if (!channel) return;
                      
                      if (onAddAdListing) {
                        onAddAdListing({
                          channelId: channel.id,
                          channelName: channel.name,
                          platform: channel.platform,
                          priceRub: Math.round((parseInt(listingPriceRub) || 350000) / 1000),
                          subscribersCount: channel.subscribers,
                          avgViews: parseInt(listingAvgViews) || 1500,
                          category: channel.category,
                          contactUsername: channel.username,
                          description: listingDescription || `Эксклюзивная рекламная интеграция. Канал: ${channel.name}`
                        });
                        alert(`УСПЕХ: Канал "${channel.name}" добавлен на Биржу интеграций!`);
                        setSubTab('all-channels');
                        setSelectedChannelIdForListing('');
                        setListingDescription('');
                      }
                    }} 
                    className="space-y-4 text-xs font-medium"
                  >
                    <div className="space-y-1">
                      <label className="block text-slate-600 font-bold uppercase text-[9px]">Выберите ваш подключенный канал</label>
                      <select
                        value={selectedChannelIdForListing}
                        onChange={(e) => setSelectedChannelIdForListing(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-orange-400"
                      >
                        <option value="">-- Выбрать свой канал --</option>
                        {connectedChannels.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.platform.toUpperCase()})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-slate-600 font-bold uppercase text-[9px]">Цена за интеграцию (ИИрок 🪙)</label>
                        <input
                          type="number"
                          value={listingPriceRub}
                          onChange={(e) => setListingPriceRub(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-1 focus:ring-orange-450"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-655 font-bold uppercase text-[9px]">Средние просмотры на пост</label>
                        <input
                          type="number"
                          value={listingAvgViews}
                          onChange={(e) => setListingAvgViews(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-1 focus:ring-orange-450"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-600 font-bold uppercase text-[9px]">Описание аудитории / предложения</label>
                      <textarea
                        value={listingDescription}
                        onChange={(e) => setListingDescription(e.target.value)}
                        placeholder="Опишите ваши фишки, когда выходят посты, делаете ли вы ИИ-креативы рекламодателям."
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-1 focus:ring-orange-400 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white font-bold rounded-xl shadow cursor-pointer text-center uppercase"
                    >
                      Опубликовать канал на Бирже интеграций ⭐
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="advertiser-orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100/60 flex items-center justify-between text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <div>
                      <span className="font-bold text-slate-800 block">Размещайте стороннюю рекламу и получайте мгновенные зачисления</span>
                      <span>Рекламодатели ждут публикации креативов. Откликнитесь и пост выйдет автоматически через ИИSMM!</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {advertiserOrders.map(order => (
                    <div key={order.id} className="p-5 rounded-2xl bg-white/80 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 shadow-xs">
                            <SocialIcon platform={order.platform} size={14} />
                            <span className="text-[9px] uppercase font-bold">{order.platform}</span>
                          </span>
                          <span className="text-xs font-black text-pink-600 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded">
                            +{(order.payoutRub * 1000).toLocaleString()} ИИрок
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-800 text-base">{order.title}</h4>
                          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">Требования: {order.requirements}</p>
                        </div>

                        <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Рекламный текст:</span>
                          <p className="text-xs text-slate-600 font-sans italic whitespace-pre-line">"{order.postContent}"</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setRespondingOrder(order);
                          setSelectedChannelIdForOrder('');
                        }}
                        className="w-full py-2 bg-gradient-to-r from-orange-100 to-pink-100 border border-white text-slate-900 font-black text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1 cursor-pointer hover:opacity-95 transition-all"
                      >
                        <Check className="w-4 h-4 text-pink-500" />
                        Откликнуться / Разместить пост
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      ) : (

        /* PREMIUM BULLETIN BOARD OVERALL FEED MODULE */
        <div className="space-y-4">
          
          <div className="flex justify-between items-center bg-white/60 p-4.5 rounded-2xl border border-white/40">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Общая рекламная Лента</h3>
              <p className="text-xs text-slate-500">Доступно всем пользователям. Клик на карточку трекает UTM-переходы.</p>
            </div>
            
              {!showBulletinForm && (
                <button
                  id="btn-show-bulletin-form"
                  onClick={() => setShowBulletinForm(true)}
                  className="px-4 py-2 text-xs font-black text-slate-900 bg-gradient-to-r from-orange-100 to-pink-100 border border-white hover:opacity-95 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-700" /> Разместить объявление
                </button>
              )}
          </div>

          {/* Bulletin form */}
          {showBulletinForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  💡 Сверстать рекламное предложение
                </h4>
                <button 
                  id="btn-close-bulletin-form"
                  onClick={() => setShowBulletinForm(false)}
                  className="text-slate-400 text-lg cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handlePostBulletin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Заголовок предложения</label>
                  <input 
                    id="input-bulletin-title"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Напр. Взаимный пиар или Продажа мест в TG ботах"
                    value={bullTitle}
                    onChange={(e) => setBullTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">URL Перехода (куда ведет объявление)</label>
                    <input 
                      id="input-bulletin-url"
                      type="url"
                      required
                      placeholder="https://t.me/your_channel"
                      value={bullLink}
                      onChange={(e) => setBullLink(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 bg-white font-mono"
                    />
                  </div>
                  <div className="flex items-center p-3.5 bg-slate-50 border rounded-xl text-[11px] text-slate-500">
                    ℹ️ Для <span className="font-bold text-pink-600 mx-1">Premium</span> бесплатно. Свободные тарифы берут 200,000 ИИрок разово.
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Текст рекламного оффера</label>
                  <textarea 
                    id="textarea-bulletin-content"
                    rows={3}
                    required
                    placeholder="Напишите подробный цепляющий оффер рекламного предложения..."
                    value={bullContent}
                    onChange={(e) => setBullContent(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 bg-white resize-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    id="btn-submit-bulletin"
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-transform active:scale-95"
                  >
                    Разместить на Bulletin Board
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* List of active Ads */}
          <div className="space-y-3">
            {bulletinAds.map((ad) => (
              <div 
                key={ad.id} 
                onClick={() => onAdClick(ad.id)}
                className="p-5 rounded-2xl bg-white border border-rose-100 shadow-sm hover:shadow transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-orange-100 text-orange-700">
                      PREMIUM SPONSOR
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Размещено {ad.postedBy} • {new Date(ad.createdAt).toLocaleString()}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">{ad.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{ad.content}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-center md:text-right">
                    <span className="block text-[10px] text-slate-400">Переходы</span>
                    <span className="font-bold text-slate-800 text-xs">{ad.clicks} кликов</span>
                  </div>
                  
                  <a 
                    id={`btn-click-bulletin-ad-${ad.id}`}
                    href={ad.linkUrl}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <span>Перейти</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Booking Checkout Modal */}
      <AnimatePresence>
        {bookingListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm apple-liquid-glass-heavy rounded-[28px] overflow-hidden shadow-2xl border border-white/60 p-1"
            >
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-5 rounded-[24px] text-white flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2.5 bg-white/20 rounded font-black text-xs text-white">ESCROW</span>
                  <h4 className="font-extrabold text-sm text-white tracking-tight">Резервирование по Бирже</h4>
                </div>
                <button 
                  id="btn-close-ad-booking-modal"
                  onClick={() => setBookingListing(null)}
                  className="text-white hover:text-slate-100 font-extrabold text-sm bg-white/10 hover:bg-white/20 p-1.5 px-2.5 rounded-full transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleBookAdSubmit} className="p-5 space-y-4">
                <div className="p-3.5 bg-gradient-to-br from-indigo-50/50 to-pink-50/50 border border-slate-200/50 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Площадка:</span>
                    <span className="text-slate-800">{bookingListing.channelName}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Оплата в Холд:</span>
                    <span className="text-pink-600 font-extrabold">{(bookingListing.priceRub * 1000).toLocaleString()} ИИрок 🪙</span>
                  </div>
                  <div className="text-[9px] text-slate-400 leading-normal">
                    *Включает налог и техническую гарантию сделки. Комиссия биржи (10%) списывается с получателя со стороны партнера.
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-450 uppercase font-black tracking-tight">Ссылка на рекламный креатив/пост:</span>
                  <input 
                    id="input-ad-creative-link"
                    type="text"
                    required
                    placeholder="Напр. Ссылка на post в ваших черновиках или файл"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <input 
                    id="checkbox-accept-deal-terms"
                    type="checkbox"
                    required
                    checked={dealTermsAccepted}
                    onChange={(e) => setDealTermsAccepted(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-pink-500 cursor-pointer mt-0.5"
                  />
                  <span className="text-[9px] text-slate-500 leading-normal font-semibold">
                    Я соглашаюсь с резервированием баланса на время публикации и автоматическим контролем через <a href="https://t.me/IIrkiBot" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700 underline font-semibold">@IIrkiBot</a>.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    id="btn-ad-booking-cancel"
                    type="button" 
                    onClick={() => setBookingListing(null)}
                    className="py-2.5 bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-xs transition-colors"
                  >
                    Назад
                  </button>
                  <button 
                    id="btn-ad-booking-submit"
                    type="submit" 
                    disabled={!dealTermsAccepted}
                    className="py-2.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-extrabold rounded-xl text-xs shadow disabled:opacity-45 cursor-pointer hover:opacity-95 transition-all text-center uppercase tracking-wide"
                  >
                    Зарезервировать
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {respondingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm apple-liquid-glass-heavy rounded-[28px] overflow-hidden shadow-2xl border border-white/60 p-1"
            >
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-5 rounded-[24px] text-white flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 bg-white/20 rounded font-black text-[10px] text-white">ПРОМО-ОТКЛИК</span>
                  <h4 className="font-extrabold text-sm text-white tracking-tight">Размещение Рекламы</h4>
                </div>
                <button 
                  onClick={() => setRespondingOrder(null)}
                  className="text-white hover:text-slate-100 font-extrabold text-xs bg-white/10 hover:bg-white/20 p-1.5 px-2.5 rounded-full transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-3.5 bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-105 rounded-xl space-y-1.5 text-xs">
                  <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Название промо-заказа:</div>
                  <span className="font-bold block text-slate-805 leading-snug">{respondingOrder.title}</span>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-205">
                    <span className="text-[10px] text-slate-500">Ваш мгновенный доход:</span>
                    <span className="text-pink-600 font-black text-xs font-mono">+{(respondingOrder.payoutRub * 1000).toLocaleString()} ИИрок 🪙</span>
                  </div>
                </div>

                {connectedChannels.filter(c => c.platform === respondingOrder.platform).length === 0 ? (
                  <div className="p-4 bg-rose-50 border border-rose-150 rounded-xl text-[10px] text-rose-800 leading-relaxed font-semibold text-center space-y-2">
                    <p>🚨 У вас нет подключенных площадок на платформе {respondingOrder.platform.toUpperCase()}!</p>
                    <p className="text-slate-500 font-normal">Подключите нужный канал во вкладке «Каналы», чтобы выполнять этот заказ на Бирже.</p>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <label className="block text-slate-655 font-bold uppercase text-[9px] tracking-tight">На какой ваш канал разместить пост?</label>
                      <select
                        value={selectedChannelIdForOrder}
                        onChange={(e) => setSelectedChannelIdForOrder(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-orange-400 font-medium"
                      >
                        <option value="">-- Выберите канал --</option>
                        {connectedChannels.filter(c => c.platform === respondingOrder.platform).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setRespondingOrder(null)}
                        className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-xs transition-colors"
                      >
                        Отмена
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (!selectedChannelIdForOrder) {
                            alert('Пожалуйста, выберите канал!');
                            return;
                          }
                          const c = connectedChannels.find(chan => chan.id === selectedChannelIdForOrder);
                          if (!c) return;
                          
                          if (onEarnMoney) {
                            onEarnMoney(respondingOrder.payoutRub, respondingOrder.title, c.name);
                            setRespondingOrder(null);
                            setSelectedChannelIdForOrder('');
                          }
                        }}
                        className="flex-1 py-2.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-extrabold rounded-xl text-xs shadow cursor-pointer hover:opacity-95 transition-all uppercase tracking-wide text-center"
                      >
                        Разместить и заработать
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
