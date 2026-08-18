import React, { useState } from 'react';
import { 
  Sparkles, CreditCard, ArrowLeft, Check, 
  FileText, ExternalLink, X, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OfertaModalContent from '../components/OfertaModalContent';

interface PublicTarifPayPageProps {
  onNavigate?: (path: string) => void;
  currentUser?: any;
}

export default function PublicTarifPayPage({ onNavigate, currentUser }: PublicTarifPayPageProps) {
  const [selectedPreset, setSelectedPreset] = useState<number>(990);
  const [customAmount, setCustomAmount] = useState<string>('990');
  const [userIdentifier, setUserIdentifier] = useState<string>(
    currentUser?.email || currentUser?.telegramId || currentUser?.id || ''
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showOfertaModal, setShowOfertaModal] = useState(false);

  const amountRub = Number(customAmount) || selectedPreset || 990;
  const iirkyAmount = amountRub; // 1 ruble = 1 Iirka

  const handleSelectPreset = (val: number) => {
    setSelectedPreset(val);
    setCustomAmount(String(val));
  };

  const handleDirectPay = async () => {
    if (amountRub < 10) {
      setMessage({ type: 'error', text: 'Минимальная сумма пополнения — 10 рублей.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/payments/robokassa/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountRub: amountRub,
          planName: `Пополнение ${iirkyAmount} ИИрок`,
          userId: userIdentifier || currentUser?.id || 'guest_user',
          periodMonths: 1
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.paymentUrl) {
        // Direct redirect to Robokassa payment gateway
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || 'Не удалось сформировать платеж');
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Ошибка связи с платежным шлюзом'
      });
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('/');
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-slate-800 bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 hover:bg-white border border-pink-300 rounded-2xl text-sm font-bold text-slate-700 hover:text-pink-600 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-pink-500" />
            <span>Вернуться на главную</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowOfertaModal(true)}
              className="text-sm font-bold text-pink-600 hover:text-pink-800 underline cursor-pointer"
            >
              Договор оферты
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-pink-300 shadow-md space-y-3 text-left">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-400/20 via-pink-400/20 to-orange-400/20 text-slate-900 text-sm font-bold rounded-xl border border-pink-300">
            <Sparkles className="w-4 h-4 text-pink-600" />
            <span>Официальный калькулятор покупки ИИрок</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Калькулятор покупки ИИрок и пополнение баланса ИИSMM
          </h1>
          <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed">
            Пополняйте баланс внутренней вычислительной единицы «ИИрка» по прямому курсу <strong>1 рубль = 1 ИИрка</strong>. ИИрки не сгорают со временем и могут расходоваться на генерацию текстов, изображений и использование возможностей платформы.
          </p>
        </div>

        {/* Main Center Section: Interactive Calculator */}
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-pink-300 shadow-md space-y-6 text-left">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-pink-200 pb-3">
            <CreditCard className="w-5 h-5 text-pink-500" />
            <span>Калькулятор пополнения</span>
          </h2>

          {/* Presets Grid */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block">
              Выберите популярный пакет:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { rub: 500, label: '500 ₽' },
                { rub: 990, label: '990 ₽' },
                { rub: 2500, label: '2 500 ₽' },
                { rub: 5000, label: '5 000 ₽' },
                { rub: 10000, label: '10 000 ₽' },
                { rub: 25000, label: '25 000 ₽' }
              ].map(p => (
                <button
                  key={p.rub}
                  type="button"
                  onClick={() => handleSelectPreset(p.rub)}
                  className={`py-3 px-2 rounded-2xl text-sm font-mono font-bold transition-all cursor-pointer text-center ${
                    Number(customAmount) === p.rub
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-sm scale-102'
                      : 'bg-white/90 border border-pink-200 text-slate-800 hover:bg-pink-50/60'
                  }`}
                >
                  <div>{p.label}</div>
                  <div className="text-[11px] font-sans font-medium opacity-90">={p.rub} ИИрок</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 block">
              Или введите произвольную сумму в рублях (₽):
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                step="10"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="990"
                className="w-full bg-white border border-pink-300 p-3.5 pl-4 pr-12 rounded-2xl font-mono text-base font-bold text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none shadow-inner"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                ₽
              </span>
            </div>
          </div>

          {/* User Identifier field */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 block">
              E-mail или Telegram ID для зачисления ИИрок:
            </label>
            <input
              type="text"
              value={userIdentifier}
              onChange={e => setUserIdentifier(e.target.value)}
              placeholder="ваш_email@gmail.com или Telegram ID"
              className="w-full bg-white border border-pink-300 p-3 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-pink-400 focus:outline-none shadow-inner"
            />
            <p className="text-xs text-slate-500 font-medium">
              На указанную почту поступит электронный кассовый чек по 54-ФЗ.
            </p>
          </div>

          {/* Result preview calculation card */}
          <div className="p-4 bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 border border-pink-200 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-700 font-medium">Сумма к оплате:</span>
              <span className="font-mono font-bold text-slate-900 text-base">
                {amountRub.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-pink-200/60 pt-2">
              <span className="text-slate-700 font-medium">Будет зачислено на баланс:</span>
              <span className="font-mono font-extrabold text-pink-600 text-lg">
                {iirkyAmount.toLocaleString('ru-RU')} ИИрок 🪙
              </span>
            </div>
          </div>

          {/* Message alert */}
          {message && (
            <div className={`p-3.5 rounded-2xl border text-sm font-medium ${
              message.type === 'success' 
                ? 'bg-sky-50 text-sky-950 border-sky-200' 
                : 'bg-rose-50 text-rose-950 border-rose-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Direct Pay Action Button */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              disabled={loading || amountRub < 10}
              onClick={handleDirectPay}
              className="w-full py-4 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold text-base rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5 text-white" />
              <span>{loading ? 'Перенаправление на оплату...' : `Оплатить ${amountRub.toLocaleString('ru-RU')} ₽ (получить ${iirkyAmount.toLocaleString('ru-RU')} ИИрок) 💳`}</span>
            </button>
          </div>

          {/* Modal Oferta Link */}
          <button
            type="button"
            onClick={() => setShowOfertaModal(true)}
            className="w-full py-2.5 px-3 bg-white/40 hover:bg-white/70 text-slate-800 text-xs font-bold rounded-xl border border-pink-300 text-center cursor-pointer transition-all block"
          >
            📄 Ознакомиться с договором публичной оферты и регламентом ИИрок
          </button>

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-600 font-medium py-4">
          &copy; 2026 ИИSMM Platform. Продукт ООО «РентРоп» (ОГРН 1217700234157, ИНН 7726477438)
        </div>

      </div>

      {/* Oferta Modal */}
      <AnimatePresence>
        {showOfertaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-gradient-to-r from-sky-100/95 via-pink-100/95 via-orange-100/95 via-pink-100/95 to-sky-100/95 backdrop-blur-md rounded-3xl p-6 border border-pink-300 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-pink-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-500" />
                  <h3 className="font-bold text-slate-900 text-base">Публичная оферта и регламент ИИрок</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOfertaModal(false)}
                  className="p-1.5 bg-white/80 hover:bg-white rounded-xl border border-pink-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-4 no-scrollbar flex-1">
                <OfertaModalContent />
              </div>

              <div className="border-t border-pink-200 pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowOfertaModal(false)}
                  className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-bold text-sm rounded-xl cursor-pointer shadow-xs"
                >
                  Понятно, закрыть
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
