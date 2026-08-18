import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck, FileText, Home } from 'lucide-react';

interface PaymentSuccessPageProps {
  onNavigate?: (path: string) => void;
}

export default function PaymentSuccessPage({ onNavigate }: PaymentSuccessPageProps) {
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
        
        {/* Success Card */}
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-pink-300 shadow-xl space-y-6 text-left">
          
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <span className="px-3.5 py-1.5 bg-pink-50 text-pink-700 font-bold text-xs rounded-xl border border-pink-200">
              Robokassa • Успешная транзакция
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Оплата успешно завершена!
            </h1>
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed">
              Ваш платеж успешно обработан платежной системой Robokassa. Баланс аккаунта пополнен, ИИрки зачислены и готовы к использованию.
            </p>
          </div>

          {/* Details block */}
          <div className="p-4 bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 rounded-2xl border border-pink-200 space-y-2.5 text-sm">
            {params.outSum && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Сумма оплаты:</span>
                <span className="font-mono font-bold text-slate-900 text-base">{params.outSum} ₽</span>
              </div>
            )}
            {params.invId && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Номер счета (InvId):</span>
                <span className="font-mono font-bold text-slate-900">#{params.invId}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-pink-200/60 pt-2">
              <span className="text-slate-600 font-medium">Статус:</span>
              <span className="font-bold text-pink-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-pink-500" />
                <span>Зачислено на баланс</span>
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-pink-200/60 pt-2">
              <span className="text-slate-600 font-medium">Электронный чек:</span>
              <span className="text-xs text-slate-700 font-semibold">Отправлен на ваш E-mail (54-ФЗ)</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleNavigate('/tarif')}
              className="w-full py-3.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Перейти в личный кабинет к тарифам</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/posts')}
              className="w-full py-3 bg-white/90 hover:bg-white text-slate-800 font-bold text-sm rounded-2xl border border-pink-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-all"
            >
              <span>Создать новый пост с помощью ИИ</span>
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
                href="mailto:info@arenda-ropa.com"
                className="hover:text-pink-600 underline"
              >
                Поддержка: info@arenda-ropa.com
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
