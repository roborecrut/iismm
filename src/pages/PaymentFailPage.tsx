import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw, HelpCircle, FileText, Sparkles } from 'lucide-react';

interface PaymentFailPageProps {
  onNavigate?: (path: string) => void;
}

export default function PaymentFailPage({ onNavigate }: PaymentFailPageProps) {
  const [params, setParams] = useState<{ invId?: string; outSum?: string }>({});

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      setParams({
        invId: urlParams.get('InvId') || urlParams.get('inv_id') || urlParams.get('orderId') || undefined,
        outSum: urlParams.get('OutSum') || urlParams.get('amount') || undefined
      });
    } catch (e) {}
  }, []);

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState(null, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-slate-800 bg-gradient-to-r from-sky-100/90 via-pink-100/90 via-orange-100/90 via-pink-100/90 to-sky-100/90 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-xl w-full space-y-6 text-center">
        
        {/* Fail Card */}
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-pink-300 shadow-xl space-y-6 text-left">
          
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 via-orange-400 to-pink-500 flex items-center justify-center shadow-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <span className="px-3.5 py-1.5 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200">
              Robokassa • Оплата не завершена
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Оплата была отменена или прервана
            </h1>
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed">
              Средства с вашей карты не были списаны. Вы можете повторить попытку оплаты, выбрать другой способ (СБП, карту другого банка) или связаться с нашей службой поддержки.
            </p>
          </div>

          {/* Details block */}
          <div className="p-4 bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 rounded-2xl border border-pink-200 space-y-2.5 text-sm">
            {params.invId && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Номер заказа:</span>
                <span className="font-mono font-bold text-slate-900">#{params.invId}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Статус:</span>
              <span className="font-bold text-rose-600">Не оплачено / Отменено</span>
            </div>
            <div className="text-xs text-slate-600 font-medium border-t border-pink-200/60 pt-2">
              Если средства были списаны банком, но баланс не обновился, пожалуйста, отправьте квитанцию на <a href="mailto:info@arenda-ropa.com" className="text-pink-600 underline font-bold">info@arenda-ropa.com</a>.
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleNavigate('/tarif/pay')}
              className="w-full py-3.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Вернуться к калькулятору и повторить оплату</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/')}
              className="w-full py-3 bg-white/90 hover:bg-white text-slate-800 font-bold text-sm rounded-2xl border border-pink-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-pink-500" />
              <span>Вернуться на главную страницу</span>
            </button>

            <div className="flex justify-center gap-4 pt-2 text-xs font-semibold text-slate-600">
              <a
                href="/oferta"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate('/oferta');
                }}
                className="hover:text-pink-600 underline cursor-pointer"
              >
                Публичная оферта
              </a>
              <span>•</span>
              <a
                href="https://t.me/IIrkiBot"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sky-600 underline"
              >
                Бот поддержки: @IIrkiBot
              </a>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-600 font-medium">
          &copy; 2026 ИИSMM • ООО «РентРоп» (ИНН 7726477438)
        </div>

      </div>
    </div>
  );
}
