import React from 'react';
import { FileText, Sparkles, CreditCard, ShieldCheck } from 'lucide-react';

export default function OfertaModalContent() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-slate-800">
      
      {/* Title block */}
      <div className="bg-white/90 rounded-2xl p-5 border border-pink-200 shadow-2xs space-y-2">
        <span className="px-3 py-1 bg-pink-50 text-pink-700 text-xs font-bold rounded-lg border border-pink-200 inline-block">
          Юридическая информация • ООО «РентРоп»
        </span>
        <h2 className="text-lg font-bold text-slate-900 leading-snug">
          Договор публичной оферты на оказание услуг сервиса «ИИSMM» и регламент использования внутренних единиц «ИИрки»
        </h2>
        <p className="text-xs text-slate-600 font-medium">
          Редакция от 1 августа 2026 г. • Действует бессрочно до момента отзыва или изменения Лицензиаром.
        </p>
      </div>

      {/* Section 1 */}
      <div className="bg-white/80 rounded-2xl p-5 border border-pink-200 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-pink-100 pb-2">
          <FileText className="w-4 h-4 text-pink-500" />
          <span>1. Термины и определения</span>
        </h3>
        <div className="space-y-2 text-slate-700 text-xs font-medium">
          <p>
            <strong>1.1. Сервис (Платформа «ИИSMM»)</strong> — облачный комплекс для автоматизации автопостинга, генерации постов, иллюстраций и сценариев с использованием технологий генеративного ИИ.
          </p>
          <p>
            <strong>1.2. Лицензиар (Исполнитель)</strong> — Общество с ограниченной ответственностью «РентРоп» (ОГРН 1217700234157, ИНН 7726477438).
          </p>
          <p>
            <strong>1.3. Пользователь (Лицензиат)</strong> — физическое или юридическое лицо, принявшее условия настоящей публичной оферты.
          </p>
          <p>
            <strong>1.4. Внутренние единицы учета («ИИрки» / «Iirky»)</strong> — техническая виртуальная учетная единица расхода вычислительной мощности Сервиса. 1 российский рубль (₽) = 1 виртуальная единица «ИИрка» (🪙).
          </p>
        </div>
      </div>

      {/* Section 2 & 3: Tariffs and Iirky status */}
      <div className="bg-white/80 rounded-2xl p-5 border border-pink-200 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-pink-100 pb-2">
          <CreditCard className="w-4 h-4 text-orange-500" />
          <span>2. Статус виртуальных единиц «ИИрки» и тарифные планы</span>
        </h3>
        <div className="space-y-2 text-slate-700 text-xs font-medium">
          <p>
            <strong>2.1. Прямой курс:</strong> 1 ₽ = 1 ИИрка. Баланс приобретенных ИИрок является бессрочным и сохраняется до фактического расходования.
          </p>
          <p className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950 font-bold">
            ⚠️ 2.2. ВНИМАНИЕ: «ИИрки» не являются валютой, денежными средствами или средствами накопления. Возврат неизрасходованных ИИрок в денежном эквиваленте после их активации в сервисе не производится.
          </p>
          <p>
            <strong>2.3. Тарифная сетка:</strong>
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-700">
            <li><strong>Старт</strong> — 300 ₽ / мес (300 ИИрок): 1 канал, 30 автопостов в мес.</li>
            <li><strong>Про</strong> — 990 ₽ / мес (990 ИИрок): 5 каналов, генерация обложек, контент-план.</li>
            <li><strong>VIP</strong> — 2 990 ₽ / мес (2 990 ИИрок): 15 каналов, кросспостинг, командная работа.</li>
            <li><strong>Космос</strong> — 9 900 ₽ / мес (9 900 ИИрок): Безлимит каналов, персональный ИИ, API.</li>
          </ul>
        </div>
      </div>

      {/* Section 4: Payments & Robokassa */}
      <div className="bg-white/80 rounded-2xl p-5 border border-pink-200 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-pink-100 pb-2">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span>3. Оплата через Robokassa и кассовые чеки 54-ФЗ</span>
        </h3>
        <div className="space-y-2 text-slate-700 text-xs font-medium">
          <p>
            3.1. Прием платежей осуществляется через платежный сервис Robokassa банковскими картами (МИР, Visa, MasterCard), через СБП и электронные кошельки по защищенному протоколу 3D-Secure.
          </p>
          <p>
            3.2. Электронный кассовый чек по 54-ФЗ автоматически направляется на E-mail, указанный Пользователем при оплате.
          </p>
          <p>
            3.3. Зачисление ИИрок на баланс личного кабинета происходит автоматически в течение 1–3 минут после подтверждения оплаты.
          </p>
        </div>
      </div>

      {/* Section 5: Requisites */}
      <div className="bg-white/90 rounded-2xl p-5 border border-pink-200 shadow-2xs space-y-2 text-xs">
        <h3 className="font-bold text-slate-900 text-sm">4. Реквизиты Лицензиара</h3>
        <p className="font-bold text-slate-900">ООО «РентРоп»</p>
        <p><strong>Юр. адрес:</strong> 115191, г. Москва, пер. Духовской, д. 17, стр. 15, помещ. 11Н/2</p>
        <p><strong>ОГРН:</strong> 1217700234157 | <strong>ИНН:</strong> 7726477438 | <strong>КПП:</strong> 772601001</p>
        <p><strong>E-mail поддержки:</strong> <a href="mailto:info@arenda-ropa.com" className="text-pink-600 font-bold underline">info@arenda-ropa.com</a></p>
      </div>

    </div>
  );
}
