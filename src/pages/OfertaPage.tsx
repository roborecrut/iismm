import React from 'react';

interface OfertaPageProps {
  onNavigate?: (path: string) => void;
}

export default function OfertaPage({ onNavigate }: OfertaPageProps) {
  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate ? onNavigate('/') : window.location.href = '/'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-600 hover:border-sky-300 transition-all shadow-xs cursor-pointer"
          >
            ← Вернуться на главную
          </button>
          <span className="text-xs text-slate-400 font-semibold">Дата редакции: 1 августа 2026 г.</span>
        </div>

        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="inline-block px-3 py-1 bg-sky-50 text-sky-700 text-[11px] font-extrabold uppercase tracking-wider rounded-lg border border-sky-100">
            Юридическая информация
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Договор публичной оферты на оказание услуг сервиса «ИИSMM»
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Настоящий документ является официальным предложением (публичной офертой) Лицензиара заключить договор использования онлайн-сервиса автоматизации контента и генеративного искусственного интеллекта «ИИSMM».
          </p>
        </div>

        {/* Main Contract Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm space-y-8 text-xs sm:text-sm leading-relaxed text-slate-700">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
              1. Термины и определения
            </h2>
            <ul className="space-y-2 list-disc pl-5 text-slate-600">
              <li>
                <strong>Сервис (ИИSMM)</strong> — программно-аппаратный комплекс, доступный в сети Интернет по адресу платформы и в Telegram Mini App, предоставляющий Пользователю возможность автопостинга, генерации постов, иллюстраций и сценариев с использованием технологий искусственного интеллекта.
              </li>
              <li>
                <strong>Пользователь</strong> — дееспособное физическое лицо или представитель юридического лица, принявший условия настоящей Оферты.
              </li>
              <li>
                <strong>Внутренние единицы («ИИрки»)</strong> — техническая условная виртуальная единица расхода вычислительной мощности Сервиса, используемая исключительно для внутреннего учета объема сгенерированного текста, промптов и медиаматериалов.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
              2. Предмет договора
            </h2>
            <p>
              2.1. Лицензиар предоставляет Пользователю неисключительное право использования Сервиса «ИИSMM» на условиях простой (неисключительной) лицензии для создания, планирования и автопубликации контента в социальной сети Telegram и иных подключенных каналах.
            </p>
            <p>
              2.2. Акцептом (полным и безоговорочным принятием) настоящей оферты является факт регистрации Пользователя в Сервисе или совершение первого платежа за пополнение внутреннего баланса.
            </p>
          </section>

          {/* Section 3 - CRITICAL REQUIREMENT ABOUT IIRKY */}
          <section className="space-y-3 bg-amber-50/60 p-6 rounded-2xl border border-amber-200/80">
            <h2 className="text-base font-extrabold text-amber-950 flex items-center gap-2">
              <span>⚠️</span> 3. Статус виртуальных единиц «ИИрки» и порядок расчетов
            </h2>
            <p className="text-amber-900 font-medium leading-relaxed">
              3.1. Внутренние единицы Сервиса (обозначаемые как «ИИрки» или «Iirky») представляют собой чисто техническую виртуальную метрику, отражающую право Пользователя на совершение определенных операций с генеративными нейросетями в рамках тарифных пакетов.
            </p>
            <p className="text-amber-900 font-extrabold leading-relaxed">
              3.2. ВНИМАНИЕ: «ИИрки» НЕ являются средствами платежа, денежными средствами, электронными денежными средствами или средствами накопления капитала. Вывод, обмен на наличные или безналичные рубли/иную валюту, а также возврат ИИрок в каком-либо материальном или денежном эквиваленте КАТЕГОРИЧЕСКИ НЕВОЗМОЖЕН.
            </p>
            <p className="text-amber-900/90 font-medium leading-relaxed">
              3.3. Приобретенные или полученные бонусные ИИрки могут быть израсходованы исключительно внутри Сервиса ИИSMM для генерации контента, рерайта, создания промптов и публикаций.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
              4. Права и обязанности Сторон
            </h2>
            <p>
              4.1. <strong>Пользователь обязуется:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Не использовать Сервис для распространения материалов, нарушающих законодательство Российской Федерации;</li>
              <li>Не предпринимать попыток взлома, декомпиляции или несанкционированного доступа к инфраструктуре Сервиса;</li>
              <li>Самостоятельно обеспечивать сохранность логина, пароля и доступа к Telegram-аккаунту.</li>
            </ul>
            <p className="pt-2">
              4.2. <strong>Сервис оставляет за собой право:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Вносить изменения в функционал, интерфейсы и алгоритмы работы ИИSMM без предварительного уведомления;</li>
              <li>Приостанавливать доступ к Сервису при обнаружении подозрительной активности или спам-рассылок.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
              5. Ответственность и гарантии
            </h2>
            <p>
              5.1. Сервис предоставляется на условиях «как есть» (as is). Лицензиар не гарантирует 100% бесперебойность работы сторонних мессенджеров (включая Telegram API) и сервисов искусственного интеллекта.
            </p>
            <p>
              5.2. Лицензиар не несет ответственности за смысловое содержание постов, сгенерированных Пользователем с помощью встроенных ИИ-инструментов, а также за их публикацию в каналах Пользователя.
            </p>
          </section>

          {/* Section 6 - REQUISITES OF ООО РЕНТРОП */}
          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
              6. Реквизиты и контакты Лицензиара
            </h2>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-2 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <p className="font-black text-slate-900 text-sm sm:text-base">ООО «РентРоп»</p>
              <p><strong>Юридический адрес:</strong> г. Москва, пер. Духовской, д. 17, стр. 15, помещ. 11Н/2</p>
              <p><strong>ОГРН:</strong> 1217700234157</p>
              <p><strong>ИНН:</strong> 7726477438</p>
              <p><strong>E-mail для обращений и запросов:</strong> <a href="mailto:info@arenda-ropa.com" className="text-pink-600 hover:text-pink-700 font-bold underline">info@arenda-ropa.com</a></p>
              <p><strong>Официальный сервисный бот Telegram:</strong> <a href="https://t.me/IIrkiBot" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-700 font-bold underline">t.me/IIrkiBot</a></p>
            </div>
          </section>

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 font-medium py-4">
          © 2026 ИИSMM Platform. Все права защищены.
        </div>

      </div>
    </div>
  );
}
