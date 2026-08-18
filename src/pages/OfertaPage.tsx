import React from 'react';
import { ShieldCheck, FileText, ArrowLeft, Check, Sparkles, CreditCard, ExternalLink, HelpCircle } from 'lucide-react';

interface OfertaPageProps {
  onNavigate?: (path: string) => void;
}

export default function OfertaPage({ onNavigate }: OfertaPageProps) {
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
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation back and header banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 hover:bg-white border border-pink-300 rounded-2xl text-sm font-bold text-slate-700 hover:text-pink-600 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-pink-500" />
            <span>Вернуться на главную</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold bg-white/60 px-4 py-2 rounded-2xl border border-pink-200">
            <span>Дата последней редакции: 1 августа 2026 г.</span>
          </div>
        </div>

        {/* Title Card */}
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-pink-300 shadow-md space-y-3 text-left">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-400/20 via-pink-400/20 to-orange-400/20 text-slate-900 text-sm font-bold rounded-xl border border-pink-300">
            <ShieldCheck className="w-4 h-4 text-pink-600" />
            <span>Официальный юридический документ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Договор публичной оферты на оказание услуг сервиса «ИИSMM» и регламент использования внутренних единиц «ИИрки»
          </h1>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
            Настоящий документ является официальным предложением (публичной офертой) ООО «РентРоп» заключить договор предоставления простой (неисключительной) лицензии и доступа к облачному программно-аппаратному сервису генерации контента, медиапланирования и автоматических публикаций «ИИSMM».
          </p>
        </div>

        {/* Detailed Contract Body */}
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-pink-300 shadow-md space-y-8 text-sm sm:text-base leading-relaxed text-slate-800 text-left">
          
          {/* Section 1: Terms */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-pink-200 pb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-500" />
              <span>1. Термины и определения</span>
            </h2>
            <div className="space-y-2.5 text-slate-700 font-medium">
              <p>
                <strong>1.1. Сервис (Платформа «ИИSMM»)</strong> — программный облачный комплекс, доступный в сети Интернет по сетевым адресам Сервиса, а также в интерфейсе Telegram Mini App (<a href="https://t.me/IIrkiBot/app" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline font-bold">@IIrkiBot</a>), включающий в себя модуль генеративного ИИ, умный контент-план, медиахранилище, генератор нейроиллюстраций и шлюзы интеграции с социальными сетями (Telegram, ВКонтакте, Одноклассники, Сетка и др.).
              </p>
              <p>
                <strong>1.2. Лицензиар (Исполнитель)</strong> — Общество с ограниченной ответственностью «РентРоп» (ОГРН 1217700234157, ИНН 7726477438), обладающее исключительными правами на Сервис.
              </p>
              <p>
                <strong>1.3. Пользователь (Лицензиат)</strong> — любое полностью дееспособное физическое лицо, индивидуальный предприниматель или уполномоченный представитель юридического лица, прошедший регистрацию в Сервисе или совершивший акцепт настоящей оферты.
              </p>
              <p>
                <strong>1.4. Внутренние единицы учета («ИИрки» / «Iirky»)</strong> — специализированная цифровая условная учетная единица вычислительных мощностей Сервиса, применяемая исключительно внутри программного интерфейса для тарификации фактических генераций текстов нейросетью, создания графических изображений, анализа контент-планов и выполнения автоматических публикаций в социальные сети.
              </p>
              <p>
                <strong>1.5. Тарифный план (Подписка)</strong> — совокупность предоставляемых функциональных возможностей, лимитов каналов, сценариев автопостинга и пакетов внутренних единиц на определенный календарный срок (1 месяц, 3 месяца, 6 месяцев, 12 месяцев).
              </p>
            </div>
          </section>

          {/* Section 2: Subject */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-pink-200 pb-2">
              2. Предмет договора и порядок акцепта
            </h2>
            <div className="space-y-2 text-slate-700 font-medium">
              <p>
                2.1. Лицензиар предоставляет Пользователю право использования Сервиса «ИИSMM» на условиях простой неисключительной лицензии в пределах функционала выбранного тарифного плана или приобретенного пакета внутренних единиц.
              </p>
              <p>
                2.2. Полным и безоговорочным акцептом настоящей публичной оферты в соответствии со ст. 438 Гражданского кодекса РФ признается любое из следующих действий Пользователя:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li>Регистрация или авторизация в веб-версии Сервиса или через Telegram Mini App;</li>
                <li>Оплата тарифного плана или пополнение баланса внутренних единиц «ИИрки» через платежный шлюз;</li>
                <li>Фактическое использование инструментов генерации, планирования или автопостинга.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Detailed Tariffs & Pricing Breakdown */}
          <section className="space-y-4 bg-gradient-to-r from-sky-50/90 via-pink-50/90 to-orange-50/90 p-5 sm:p-6 rounded-2xl border border-pink-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              <span>3. Тарифные планы и стоимость услуг</span>
            </h2>
            <p className="text-slate-700 font-medium">
              3.1. В Сервисе действуют следующие базовые тарифные планы:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-white/90 rounded-xl border border-pink-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Тариф «Старт»</span>
                  <span className="font-mono font-bold text-pink-600">300 ₽ / мес (300 ИИрок)</span>
                </div>
                <p className="text-slate-600 text-xs font-medium">
                  Базовый тариф для начинающих авторов. Включает 1 подключенный канал, 30 автопостов в месяц, базовую генерацию текстов и генерацию постов в один клик.
                </p>
              </div>

              <div className="p-4 bg-white/90 rounded-xl border border-pink-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Тариф «Про»</span>
                  <span className="font-mono font-bold text-pink-600">990 ₽ / мес (990 ИИрок)</span>
                </div>
                <p className="text-slate-600 text-xs font-medium">
                  Для активных блогеров и SMM-специалистов. До 5 каналов, генерация фотореалистичных обложек с ИИ, расширенный контент-план и календарь публикаций.
                </p>
              </div>

              <div className="p-4 bg-white/90 rounded-xl border border-pink-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Тариф «VIP»</span>
                  <span className="font-mono font-bold text-pink-600">2 990 ₽ / мес (2 990 ИИрок)</span>
                </div>
                <p className="text-slate-600 text-xs font-medium">
                  Для агентств и медиасетей. До 15 каналов, одновременный кросспостинг во все соцсети, командная работа, экспорт аналитики и приоритетная очередь генерации.
                </p>
              </div>

              <div className="p-4 bg-white/90 rounded-xl border border-pink-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Тариф «Космос» (Корпоративный)</span>
                  <span className="font-mono font-bold text-pink-600">9 900 ₽ / мес (9 900 ИИрок)</span>
                </div>
                <p className="text-slate-600 text-xs font-medium">
                  Неограниченное количество каналов, индивидуальная дообученная нейросеть под стиль бренда, персональный менеджер поддержки 24/7 и API-интеграции.
                </p>
              </div>
            </div>

            <p className="text-slate-700 font-medium text-xs sm:text-sm pt-2">
              3.2. При оплате тарифа на длительный период предоставляются скидки: 3 месяца — 10%, 6 месяцев — 20%, 12 месяцев — 30%.
            </p>
          </section>

          {/* Section 4: Virtual units status & rules */}
          <section className="space-y-3 bg-pink-50/70 p-5 sm:p-6 rounded-2xl border border-pink-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <span>4. Правовой статус внутренних единиц «ИИрки» и порядок расходования</span>
            </h2>
            <div className="space-y-2 text-slate-800 font-medium">
              <p>
                4.1. <strong>Курс конвертации при покупке:</strong> 1 российский рубль (₽) = 1 виртуальная единица «ИИрка» (🪙).
              </p>
              <p>
                4.2. Внутренние единицы «ИИрки» не являются валютой, деньгами, электронными денежными средствами или ценными бумагами в смысле законодательства РФ. Они являются исключительно техническим измерителем объема доступных операций и вычислительных мощностей в облачном сервисе.
              </p>
              <p>
                4.3. <strong>Бессрочность баланса:</strong> Приобретенные Пользователем ИИрки не сгорают по истечении календарного месяца или года и сохраняются на лицевом счете аккаунта до момента их фактического расходования на генерации или оплату тарифов.
              </p>
              <p>
                4.4. <strong>Невозможность обратного вывода:</strong> В связи с природой цифровой лицензии и предоставлением мгновенного доступа к вычислительным серверам ИИ, вывод, конвертация в наличные или безналичные денежные средства, а также передача ИИрок третьим лицам за пределами функционала Сервиса не производятся.
              </p>
            </div>
          </section>

          {/* Section 5: Payment Processing & Robokassa */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-pink-200 pb-2">
              5. Порядок расчетов, платежи через Robokassa и чеки 54-ФЗ
            </h2>
            <div className="space-y-2 text-slate-700 font-medium">
              <p>
                5.1. Оплата тарифов и пополнение баланса производятся в безналичном порядке через авторизованный платежный сервис Robokassa с использованием банковских карт платежных систем МИР, Visa, MasterCard, Системы быстрых платежей (СБП) и электронных кошельков.
              </p>
              <p>
                5.2. При совершении платежа Пользователь перенаправляется на защищенную платежную страницу процессингового центра Robokassa, соответствующую международным стандартам безопасности PCI DSS.
              </p>
              <p>
                5.3. Все платежи фискализируются в соответствии с Федеральным законом № 54-ФЗ «О применении контрольно-кассовой техники». Электронный кассовый чек направляется на адрес электронной почты, указанный Пользователем при совершении платежа.
              </p>
              <p>
                5.4. Моментом исполнения обязательства Пользователя по оплате считается момент успешного подтверждения транзакции платежной системой Robokassa и зачисления соответствующей суммы ИИрок на баланс в Сервисе (происходит автоматически в течение 1–3 минут).
              </p>
            </div>
          </section>

          {/* Section 6: Refund and Cancellation Policy */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-pink-200 pb-2">
              6. Порядок возврата денежных средств и отмены услуг
            </h2>
            <div className="space-y-2 text-slate-700 font-medium">
              <p>
                6.1. В соответствии со ст. 1235 ГК РФ и Законом РФ «О защите прав потребителей», в случае если услуга доступа к Сервису не была оказана по вине Лицензиара (критический технический сбой, сделавший невозможным доступ к Сервису более чем на 72 часа непрерывно), Пользователь имеет право обратиться с мотивированным заявлением о возврате неизрасходованной части денежных средств.
              </p>
              <p>
                6.2. Для оформления возврата Пользователь направляет официальный запрос на электронную почту <a href="mailto:info@arenda-ropa.com" className="text-pink-600 font-bold underline">info@arenda-ropa.com</a> с указанием:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>ID пользователя или зарегистрированного E-mail / Telegram ID;</li>
                <li>Номер транзакции и дату платежа в Robokassa;</li>
                <li>Подробное описание возникшей проблемы;</li>
                <li>Банковские реквизиты плательщика для возврата.</li>
              </ul>
              <p>
                6.3. Срок рассмотрения заявления о возврате составляет не более 10 (десяти) рабочих дней.
              </p>
            </div>
          </section>

          {/* Section 7: User Rights and Obligations */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-pink-200 pb-2">
              7. Права, обязанности и ответственность сторон
            </h2>
            <div className="space-y-2 text-slate-700 font-medium">
              <p>
                7.1. <strong>Пользователь обязуется:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Соблюдать нормы действующего законодательства РФ при создании и распространении контента;</li>
                <li>Не использовать Сервис для генерации вредоносного ПО, спам-рассылок, клеветы, пропаганды экстремизма или нарушения авторских прав третьих лиц;</li>
                <li>Самостоятельно обеспечивать сохранность авторизационных данных.</li>
              </ul>
              <p className="pt-1">
                7.2. <strong>Лицензиар гарантирует:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Обеспечение функционирования Сервиса на уровне доступности не менее 99% времени;</li>
                <li>Защиту и конфиденциальность персональных данных Пользователя в соответствии с ФЗ № 152-ФЗ «О персональных данных».</li>
              </ul>
            </div>
          </section>

          {/* Section 8: Legal Requisites */}
          <section className="space-y-3 bg-white/95 p-6 rounded-2xl border border-pink-300">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-pink-500" />
              <span>8. Реквизиты Лицензиара и контакты службы поддержки</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-800 text-sm font-medium pt-2">
              <div className="space-y-1.5">
                <p className="font-bold text-base text-slate-900">Общество с ограниченной ответственностью «РентРоп»</p>
                <p><strong>ОГРН:</strong> 1217700234157</p>
                <p><strong>ИНН:</strong> 7726477438</p>
                <p><strong>КПП:</strong> 772601001</p>
                <p><strong>Юридический адрес:</strong> 115191, г. Москва, пер. Духовской, д. 17, стр. 15, помещ. 11Н/2</p>
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-slate-900">Каналы связи и поддержка:</p>
                <p><strong>E-mail поддержки:</strong> <a href="mailto:info@arenda-ropa.com" className="text-pink-600 font-bold underline">info@arenda-ropa.com</a></p>
                <p><strong>Сервисный бот Telegram:</strong> <a href="https://t.me/IIrkiBot" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold underline">@IIrkiBot</a></p>
                <p><strong>Официальный сайт продукта:</strong> <a href="https://rent-rop.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold underline">rent-rop.com</a></p>
                <p><strong>Режим работы службы поддержки:</strong> Ежедневно с 09:00 до 21:00 (МСК)</p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 text-sm font-semibold text-slate-600">
          <span>&copy; 2026 ИИSMM. Все права защищены. ООО «РентРоп»</span>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => onNavigate ? onNavigate('/tarif/pay') : window.location.href = '/tarif/pay'}
              className="text-pink-600 hover:text-pink-800 font-bold underline cursor-pointer"
            >
              Перейти к тарифам и калькулятору
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="text-slate-700 hover:text-slate-900 font-bold cursor-pointer"
            >
              На главную
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
