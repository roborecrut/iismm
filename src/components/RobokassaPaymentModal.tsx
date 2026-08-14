import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Settings, ShieldCheck, Zap, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { UserAccount } from '../types';

interface RobokassaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onUpdateUser?: (updated: UserAccount) => void;
  initialPlanName?: string;
  initialAmountRub?: number;
}

export default function RobokassaPaymentModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  initialPlanName = 'РАЗГОН',
  initialAmountRub = 990
}: RobokassaPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'pay' | 'settings'>('pay');

  // Payment states
  const [selectedPlan, setSelectedPlan] = useState(initialPlanName);
  const [customAmount, setCustomAmount] = useState<number>(initialAmountRub || 990);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState('');
  const [createdUrl, setCreatedUrl] = useState('');

  // Settings states
  const [merchantLogin, setMerchantLogin] = useState('');
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [isTestMode, setIsTestMode] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  useEffect(() => {
    if (initialPlanName) {
      setSelectedPlan(initialPlanName);
      if (initialPlanName === 'РАЗГОН') setCustomAmount(990);
      else if (initialPlanName === 'ОТРЫВ') setCustomAmount(4900);
      else if (initialPlanName === 'КОСМОС') setCustomAmount(15000);
      else if (initialAmountRub) setCustomAmount(initialAmountRub);
    }
  }, [initialPlanName, initialAmountRub]);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/payments/robokassa/config');
      const data = await res.json();
      if (data.success && data.config) {
        setMerchantLogin(data.config.merchantLogin || '');
        setIsTestMode(data.config.isTest !== false);
        if (data.config.pass1Set) setPass1('********');
        if (data.config.pass2Set) setPass2('********');
      }
    } catch (err) {
      console.error('Error fetching Robokassa config:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg('');
    try {
      const res = await fetch('/api/payments/robokassa/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantLogin,
          pass1,
          pass2,
          isTest: isTestMode
        })
      });
      const data = await res.json();
      if (data.success) {
        setSettingsMsg('🎉 Настройки Робокассы успешно сохранены в БД!');
      } else {
        setSettingsMsg(`⚠️ ${data.error || 'Ошибка при сохранении'}`);
      }
    } catch (err: any) {
      setSettingsMsg('⚠️ Ошибка подключения к серверу');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCreatePaymentUrl = async () => {
    setPaymentLoading(true);
    setPaymentMsg('');
    setCreatedUrl('');
    try {
      const res = await fetch('/api/payments/robokassa/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: customAmount,
          tariffName: selectedPlan,
          userId: user.id || user.telegramId || '169262990',
          description: `Оплата тарифа ${selectedPlan} (${customAmount} ₽ = ${customAmount} ИИрок)`
        })
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        setCreatedUrl(data.paymentUrl);
        setPaymentMsg('✅ Ссылка на оплату сформирована! Нажмите кнопку ниже для перехода в терминал Робокассы.');
      } else {
        setPaymentMsg(`⚠️ ${data.error || 'Не удалось сформировать ссылку'}`);
      }
    } catch (err: any) {
      setPaymentMsg('⚠️ Ошибка сети при связи с терминалом оплаты');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSimulateSuccess = async () => {
    setPaymentLoading(true);
    setPaymentMsg('');
    try {
      const res = await fetch('/api/payments/robokassa/simulate-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id || user.telegramId || '169262990',
          amount: customAmount,
          tariffName: selectedPlan
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setPaymentMsg(data.message || '🎉 Оплата прошла успешно!');
        if (onUpdateUser) {
          onUpdateUser({
            ...user,
            balanceRub: (user.balanceRub || 0) + customAmount,
            iirky: (user.iirky || 0) + customAmount,
            tariff: data.user.tariff || user.tariff
          });
        }
        setTimeout(() => {
          onClose();
          setPaymentMsg('');
        }, 2000);
      } else {
        setPaymentMsg(`⚠️ ${data.error || 'Ошибка при симуляции оплаты'}`);
      }
    } catch (err: any) {
      setPaymentMsg('⚠️ Ошибка сервера');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 text-left overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl text-white">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase">Оплата через Робокассу</h3>
                <p className="text-[10px] text-slate-400 font-medium">Безопасный эквайринг (1 ₽ = 1 ИИрка)</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-700 font-bold p-1 text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button 
              onClick={() => setActiveTab('pay')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'pay' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💳 Оплата тарифа / ИИрок
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'settings' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Настройки Робокассы</span>
            </button>
          </div>

          {/* TAB 1: PAY */}
          {activeTab === 'pay' && (
            <div className="space-y-4 text-xs font-semibold">
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Выбранный тариф:</span>
                  <span className="font-mono font-black text-xs text-orange-600 uppercase bg-white px-2 py-0.5 rounded border border-orange-200">
                    {selectedPlan}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">
                    Сумма к оплате (₽):
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min={1}
                      value={customAmount}
                      onChange={e => setCustomAmount(Math.max(1, Number(e.target.value)))}
                      className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl font-mono text-sm font-black text-slate-800 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    />
                    <div className="px-3 py-2 bg-orange-100/60 text-orange-800 rounded-xl font-mono text-xs font-bold flex items-center shrink-0">
                      = {customAmount} ИИрок 🪙
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 leading-relaxed pt-1 border-t border-orange-200/40">
                  <p>✨ <strong>Курс конвертации:</strong> 1 ₽ = 1 ИИрка. При оплате сумма моментально зачисляется на ваш баланс ИИрок!</p>
                </div>
              </div>

              {paymentMsg && (
                <div className="p-3 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl leading-relaxed">
                  {paymentMsg}
                </div>
              )}

              {/* Created URL Button */}
              {createdUrl && (
                <a 
                  href={createdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Перейти в платежный шлюз Робокассы</span>
                </a>
              )}

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                <button 
                  onClick={handleCreatePaymentUrl}
                  disabled={paymentLoading}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black text-xs uppercase rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{paymentLoading ? 'Формирование...' : 'Сформировать ссылку Робокассы 💳'}</span>
                </button>

                <button 
                  onClick={handleSimulateSuccess}
                  disabled={paymentLoading}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Тестовое мгновенное зачисление без списания реальных денег"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Тестовая симуляция оплаты (Мгновенный рефилл)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS FOR ROBOKASSA */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs font-semibold">
              <div className="p-3 bg-blue-50/60 border border-blue-100 text-blue-900 text-[11px] rounded-xl space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Реквизиты Робокассы (Мерчант)</span>
                </p>
                <p className="text-[10px] text-blue-700 font-medium">Внесите данные MerchantLogin, Pass1 и Pass2 из личного кабинета Robokassa. Они используются для генерации валидной электронной подписи SignatureValue.</p>
              </div>

              {settingsMsg && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl">
                  {settingsMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">MerchantLogin (Идентификатор магазина)</label>
                <input 
                  type="text"
                  placeholder="iismm_shop"
                  value={merchantLogin}
                  onChange={e => setMerchantLogin(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-mono focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Пароль #1 (Pass1 - Инициация оплаты)</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={pass1}
                  onChange={e => setPass1(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-mono focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Пароль #2 (Pass2 - Подтверждение уведомлений)</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={pass2}
                  onChange={e => setPass2(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-mono focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox"
                  id="chk-test-mode"
                  checked={isTestMode}
                  onChange={e => setIsTestMode(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
                <label htmlFor="chk-test-mode" className="text-xs text-slate-700 font-bold cursor-pointer select-none">
                  Включить тестовый режим Робокассы (IsTest = 1)
                </label>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {settingsLoading ? 'Сохранение...' : 'Сохранить реквизиты Робокассы 💾'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
