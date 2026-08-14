import React, { useState, useEffect } from 'react';
import { PromoBundle, SocialChannel } from '../types';
import { 
  Users, FolderLock, PlusCircle, Check, DollarSign, Wallet, 
  ShieldAlert, Sparkles, Gift, ArrowUpRight, Bell, Settings, 
  CheckSquare, FileText, Image, Globe, Clock, HelpCircle, 
  Link as LinkIcon, Radio, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromoBundlesProps {
  bundles: PromoBundle[];
  joinedChannelsIds: string[];
  onAddBundle: (bundle: Omit<PromoBundle, 'id' | 'channelsCount' | 'joinedChannels'>) => void;
  onJoinBundle: (bundleId: string, channelId: string) => void;
  userBalance: number;
  userChannels: Array<{ id: string; name: string; username: string; platform: string; category?: string; subscribers?: number }>;
  onAddFunds: (amount: number) => void;
}

// Predefined Themes for Promotions
const PROMO_THEMES = [
  'Бизнес и Стартапы',
  'Маркетинг и PR',
  'Лайфхаки и Технологии',
  'Развлечения и Юмор',
  'Новости и Медиа'
];

interface ChannelPromoConfig {
  channelId: string;
  theme: string;
  participateInFolders: boolean;
  participateInSelections: boolean;
}

interface SimulatedFolderProject {
  id: string;
  title: string;
  theme: string;
  intro: string;
  description: string;
  signature: string;
  imageUrl: string;
  rules: string;
  organizer: string;
  status: 'waiting_approvals' | 'ready_for_link' | 'active' | 'published';
  participants: Array<{
    channelId: string;
    channelName: string;
    username: string;
    status: 'pending' | 'accepted' | 'declined';
  }>;
  folderLink?: string;
  inlineButtonText?: string;
  scheduledTime?: string;
}

interface SimulatedSelection {
  id: string;
  theme: string;
  targetDate: string;
  organizer: string;
  joinedCount: number;
  maxParticipants: number;
  welcomeText: string;
  participants: Array<{
    channelName: string;
    username: string;
    promoDescription: string;
  }>;
}

export default function PromoBundles({
  bundles,
  joinedChannelsIds,
  onAddBundle,
  onJoinBundle,
  userBalance,
  userChannels,
  onAddFunds
}: PromoBundlesProps) {
  // Main Tab Navigation: 'channels' | 'folders' | 'selections'
  const [activeTab, setActiveTab] = useState<'channels' | 'folders' | 'selections'>('folders');

  // Channel Participation State
  const [channelsConfig, setChannelsConfig] = useState<Record<string, ChannelPromoConfig>>({});

  // Initialize/synchronize Channel Promo configurations
  useEffect(() => {
    const updated: Record<string, ChannelPromoConfig> = { ...channelsConfig };
    let changed = false;

    userChannels.forEach(ch => {
      if (!updated[ch.id]) {
        updated[ch.id] = {
          channelId: ch.id,
          theme: ch.category || 'Бизнес и Стартапы',
          participateInFolders: true,
          participateInSelections: true
        };
        changed = true;
      }
    });

    if (changed) {
      setChannelsConfig(updated);
    }
  }, [userChannels]);

  // Handle Channel Theme/Opt-In updates
  const handleUpdateChannelConfig = (channelId: string, key: keyof ChannelPromoConfig, value: any) => {
    setChannelsConfig(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        [key]: value
      }
    }));
  };

  // ---------------------------------------------------------------------------
  // FOLDERS (Папки) STATE & SIMULATION MACHINE
  // ---------------------------------------------------------------------------
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [folderTitle, setFolderTitle] = useState('');
  const [folderTheme, setFolderTheme] = useState('Бизнес и Стартапы');
  const [folderIntro, setFolderIntro] = useState('Свежая папка лучших бизнес-каналов СНГ!');
  const [folderDesc, setFolderDesc] = useState('Топовые авторы объединились, чтобы делиться секретами успеха, инсайдами рынка и практическими кейсами.');
  const [folderSign, setFolderSign] = useState('Подписывайтесь на всю папку в один клик, чтобы не упустить тренды!');
  const [folderImageUrl, setFolderImageUrl] = useState('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60');
  const [folderRules, setFolderRules] = useState('3 дня в ленте и 3 часа в топе без перекрытия');
  const [folderPubTime, setFolderPubTime] = useState('2026-06-15T12:00');

  // Simulated active community channel pool to invite to folder
  const communityFolderChannels = [
    { id: 'com-1', name: 'Стартап Будни 🚀', username: '@startup_days', theme: 'Бизнес и Стартапы' },
    { id: 'com-2', name: 'ИИ Маркетолог 🤖', username: '@ai_promo_smm', theme: 'Маркетинг и PR' },
    { id: 'com-3', name: 'Код Будущего 💻', username: '@next_gen_code', theme: 'Лайфхаки и Технологии' },
    { id: 'com-4', name: 'Мемы Веб3 🤡', username: '@web3_laughs', theme: 'Развлечения и Юмор' },
    { id: 'com-5', name: 'Дайджест Мира 🌍', username: '@world_digest_m', theme: 'Новости и Медиа' },
    { id: 'com-6', name: 'Трафик & Лиды 📈', username: '@leads_traffic', theme: 'Бизнес и Стартапы' },
    { id: 'com-7', name: 'Креативный Копирайт ✍️', username: '@creative_copy', theme: 'Маркетинг и PR' },
  ];

  // Simulated Folder Projects
  const [folderProjects, setFolderProjects] = useState<SimulatedFolderProject[]>([
    {
      id: 'fold-1',
      title: 'Бизнес-Авангард 2026',
      theme: 'Бизнес и Стартапы',
      intro: '⚡ Дарим готовый интеллектуальный набор для предпринимателей!',
      description: 'Мы собрали каналы, которые ежедневно читают венчурные инвесторы и топ-менеджеры. Аналитика, разборы ниш и ИИ-автоматизация маркетинга.',
      signature: 'Нажмите кнопку ниже, чтобы добавить всю подборку в свои чаты Telegram.',
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=60',
      rules: '3 дня в ленте и 3 часа в топе без перекрытия',
      organizer: '@shishkarnem',
      status: 'ready_for_link',
      participants: [
        { channelId: 'ch-1', channelName: 'SAV_AI Новости & Обновления', username: '@SAV_AI', status: 'accepted' },
        { channelId: 'com-1', channelName: 'Стартап Будни 🚀', username: '@startup_days', status: 'accepted' },
        { channelId: 'com-6', channelName: 'Трафик & Лиды 📈', username: '@leads_traffic', status: 'accepted' }
      ],
      folderLink: '',
      inlineButtonText: '⚡ Добавить папку 📁',
      scheduledTime: '2026-06-08T18:00'
    }
  ]);

  // Notifications Queue (Simulating incoming request to join others' folder)
  const [incomingFolderInvites, setIncomingFolderInvites] = useState<Array<{
    id: string;
    folderTitle: string;
    organizer: string;
    theme: string;
    intro: string;
    description: string;
    signature: string;
    imageUrl: string;
    rules: string;
    targetChannelName: string;
    targetChannelId: string;
    status: 'pending' | 'accepted' | 'declined';
  }>>([
    {
      id: 'inv-1',
      folderTitle: 'Мега Пиар Технологий & ИИ',
      organizer: '@tech_guru_promo',
      theme: 'Лайфхаки и Технологии',
      intro: '🔥 Самые полезные ИИ-ресурсы этого лета в одной папке!',
      description: 'Собрали ведущие блоги о программировании, нейросетях и автоматизации рутины. Прокачайте свои навыки в один клик.',
      signature: 'Жмите кнопку, чтобы забрать всю папку целиком!',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60',
      rules: '3 дня в ленте и 3 часа в топе без перекрытия',
      targetChannelName: 'Группа Обсуждений SAV AI',
      targetChannelId: 'ch-2',
      status: 'pending'
    }
  ]);

  // Handle invitation answers
  const handleAnswerInvite = (inviteId: string, answer: 'accepted' | 'declined') => {
    setIncomingFolderInvites(prev =>
      prev.map(inv => inv.id === inviteId ? { ...inv, status: answer } : inv)
    );
    if (answer === 'accepted') {
      alert('Участие подтверждено! Бот ИИSMM запланировал автоматическое размещение папки на вашем канале.');
    } else {
      alert('Приглашение отклонено.');
    }
  };

  // Form handle for Custom Folder project creation
  const handleCreateFolderProject = (e: React.FormEvent) => {
    e.preventDefault();
    const fullText = `${folderIntro}\n\n${folderDesc}\n\n${folderSign}`;
    if (fullText.length > 900) {
      alert(`Ошибка! Общий размер рекламного текста (${fullText.length} симв.) превышает лимит 900 символов!`);
      return;
    }

    // Filter available candidate channels matching the theme
    // We auto-include default eligible simulated channels that are marked active
    const themeChannels = communityFolderChannels.filter(c => c.theme === folderTheme);
    const mockInvites = themeChannels.map(c => ({
      channelId: c.id,
      channelName: c.name,
      username: c.username,
      status: 'pending' as const
    }));

    // Add user's own channel if they have one matching or just general first channel
    const myMatch = userChannels.find(u => {
      const config = channelsConfig[u.id];
      return config && config.theme === folderTheme && config.participateInFolders;
    }) || userChannels[0];

    const finalParticipants = [];
    if (myMatch) {
      finalParticipants.push({
        channelId: myMatch.id,
        channelName: myMatch.name,
        username: myMatch.username,
        status: 'accepted' as const // Author accepts immediately
      });
    }
    finalParticipants.push(...mockInvites);

    const newProj: SimulatedFolderProject = {
      id: 'fold-' + Date.now(),
      title: folderTitle || `Папка Пиара: ${folderTheme}`,
      theme: folderTheme,
      intro: folderIntro,
      description: folderDesc,
      signature: folderSign,
      imageUrl: folderImageUrl,
      rules: folderRules,
      organizer: '@shishkarnem',
      status: 'waiting_approvals',
      participants: finalParticipants,
      scheduledTime: folderPubTime
    };

    setFolderProjects([newProj, ...folderProjects]);
    setShowCreateFolderModal(false);
    
    // Notify SMM agent or parent of simulation
    onAddBundle({
      title: newProj.title,
      rules: newProj.rules,
      organizerUsername: '@shishkarnem',
      entryFeeRub: 0,
      maxChannels: finalParticipants.length,
      status: 'collecting',
      isFreeForOrganizer: true
    });

    // Reset fields
    setFolderTitle('');
    setFolderIntro('Свежая папка рекламного обмена!');
    setFolderDesc('Мы объединились с крутыми каналами рынка... ');
    setFolderSign('Забирайте папку в один клик!');
    alert('Проект папки создан! Приглашения участникам отправлены в Telegram-боте.');
  };

  // Simulated acceptance confirmation by a participant in organizer's folder
  const simulateAcceptance = (projectId: string, participantId: string) => {
    setFolderProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const updated = p.participants.map(part =>
          part.channelId === participantId ? { ...part, status: 'accepted' as const } : part
        );
        // If all accepted or just triggering transition
        const anyPending = updated.some(part => part.status === 'pending');
        const nextStatus = anyPending ? 'waiting_approvals' : 'ready_for_link';
        return {
          ...p,
          participants: updated,
          status: nextStatus as any
        };
      })
    );
  };

  // Generate invite/folder link
  const handleGenerateFolderLink = (projectId: string) => {
    const link = `https://t.me/addlist/smm_ai_folder_${Math.floor(1000 + Math.random() * 9000)}`;
    setFolderProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          status: 'active',
          folderLink: link,
          inlineButtonText: '📂 Добавить Папку Пиара'
        };
      })
    );
    alert(`Ссылка на папку успешно сгенерирована!\n\n${link}\n\nОна прикреплена к инлайн-кнопе рекламного поста.`);
  };

  // Dispatch publication immediately
  const handlePublishFolderNow = (projectId: string) => {
    setFolderProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          status: 'published'
        };
      })
    );
    alert('Пост с папкой успешно размещен на всех каналах участников автоматически!');
  };

  // Total text counter for 900 chars check
  const totalFolderTextLength = folderIntro.length + folderDesc.length + folderSign.length + 4; // approximate spacing newlines

  // ---------------------------------------------------------------------------
  // SELECTIONS (Подборки) STATE & MACHINE
  // ---------------------------------------------------------------------------
  const [showCreateSelection, setShowCreateSelection] = useState(false);
  const [selTheme, setSelTheme] = useState('Бизнес и Стартапы');
  const [selDate, setSelDate] = useState('25 июня 2026, 15:00');
  const [selWelcomeText, setSelWelcomeText] = useState('📢 Рекомендуем для обязательного ознакомления! Авторская подборка блогов, которые создают тренды прямо сейчас. Только проверенный контент!');

  // Join selection parameters
  const [activeJoinSelectionId, setActiveJoinSelectionId] = useState<string | null>(null);
  const [joinSelectedChannelId, setJoinSelectedChannelId] = useState('');
  const [joinChannelPromoDesc, setJoinChannelPromoDesc] = useState('');

  // SMM Selections
  const [selectionsList, setSelectionsList] = useState<SimulatedSelection[]>([
    {
      id: 'sel-1',
      theme: 'Бизнес и Стартапы',
      targetDate: '10 июня 2026, 12:00 МСК',
      organizer: '@shishkarnem',
      joinedCount: 4,
      maxParticipants: 10,
      welcomeText: '🎉 Полезная подборка ведущих каналов рунета для предпринимателей. Рекомендуем подписаться на каждый!',
      participants: [
        { channelName: 'AI для Бизнеса 🤖', username: '@ai_biz_world', promoDescription: 'Инсайды об интеграции нейросетей, кейсы экономии бюджетов.' },
        { channelName: 'SAV_AI Новости & Обновления', username: '@SAV_AI', promoDescription: 'Главный анонсирующий канал рекрутер-бота и полезных нейропромптов.' },
        { channelName: 'Венчурные булки 🍞', username: '@venture_bakes', promoDescription: 'Новости инвестиций и стартапов без пафоса.' },
        { channelName: 'Трафик под ключ 🔑', username: '@turnkey_traffic', promoDescription: 'Авторские связки, фишки закупки рекламы в TG.' }
      ]
    },
    {
      id: 'sel-2',
      theme: 'Маркетинг и PR',
      targetDate: '12 июня 2026, 18:00 МСК',
      organizer: '@pr_manager_super',
      joinedCount: 3,
      maxParticipants: 10,
      welcomeText: '📢 Свежие тренды SMM, маркетинга и PR под микроскопом. Подписывайтесь!',
      participants: [
        { channelName: 'Креативный Копирайт ✍️', username: '@creative_copy', promoDescription: 'Учим писать цепляющие тексты, увеличивающие вовлеченность.' },
        { channelName: 'Партизанский Пиар 🥷', username: '@guerrilla_news', promoDescription: 'Свежие разборы нестандартных вирусных рекламных кампаний.' },
        { channelName: 'Кухня SMM 🥘', username: '@smm_kitchen_blog', promoDescription: 'Проверенные связки для мессенджеров, утилиты веб-мастера.' }
      ]
    }
  ]);

  // Handle creating selection project
  const handleCreateSelectionProject = (e: React.FormEvent) => {
    e.preventDefault();
    const newSel: SimulatedSelection = {
      id: 'sel-' + Date.now(),
      theme: selTheme,
      targetDate: selDate,
      organizer: '@shishkarnem',
      joinedCount: 1, // Starts with organizer's channel or just 1 default
      maxParticipants: 10,
      welcomeText: selWelcomeText,
      participants: []
    };

    // Auto-fill owner's channel matching theme
    const myMatchingChannel = userChannels.find(u => {
      const config = channelsConfig[u.id];
      return config && config.theme === selTheme && config.participateInSelections;
    });

    if (myMatchingChannel) {
      newSel.participants.push({
        channelName: myMatchingChannel.name,
        username: myMatchingChannel.username,
        promoDescription: 'ИИ-автопостинг, автопилот ведения контента и аналитики.'
      });
      newSel.joinedCount = 1;
    } else {
      newSel.joinedCount = 0;
    }

    setSelectionsList([newSel, ...selectionsList]);
    setShowCreateSelection(false);
    alert(`Подборка по теме "${selTheme}" создана и запланирована на ${selDate}. Другие авторы могут присоединяться к ней!`);
  };

  // Open Join Selection dialog
  const handleOpenJoinSelection = (selectionId: string) => {
    // Find eligible channels that have agreed to participate in selections
    const eligible = userChannels.filter(c => {
      const config = channelsConfig[c.id];
      return config ? config.participateInSelections : true;
    });

    if (eligible.length === 0) {
      alert('Внимание! Сначала разрешите участие в подборках галочкой на вкладке "⚙️ Настройки"! Или добавьте каналы.');
      return;
    }

    setActiveJoinSelectionId(selectionId);
    setJoinSelectedChannelId(eligible[0].id);
    setJoinChannelPromoDesc('');
  };

  // Submit Join Selection
  const handleJoinSelectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJoinSelectionId) return;
    if (!joinChannelPromoDesc.trim()) {
      alert('Пожалуйста, введите рекламное описание канала для публикации!');
      return;
    }

    const sel = selectionsList.find(s => s.id === activeJoinSelectionId);
    if (!sel) return;

    if (sel.joinedCount >= sel.maxParticipants) {
      alert('Ошибка! Достигнут лимит 10 участников на эту подборку!');
      return;
    }

    const joinedChannel = userChannels.find(c => c.id === joinSelectedChannelId);
    if (!joinedChannel) return;

    // Add to participants list
    setSelectionsList(prev =>
      prev.map(s => {
        if (s.id !== activeJoinSelectionId) return s;
        // Verify channel not already in selection
        if (s.participants.some(p => p.username === joinedChannel.username)) {
          alert('Этот канал уже добавлен в подборку!');
          return s;
        }
        return {
          ...s,
          joinedCount: s.joinedCount + 1,
          participants: [
            ...s.participants,
            {
              channelName: joinedChannel.name,
              username: joinedChannel.username,
              promoDescription: joinChannelPromoDesc
            }
          ]
        };
      })
    );

    setActiveJoinSelectionId(null);
    alert(`Поздравляем! Ваш канал "${joinedChannel.name}" успешно добавлен в подборку. Текстовый вариант сформирован.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header with tab-switching mechanism */}
      <div className="p-5 md:p-6 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-orange-100 text-orange-900 border border-orange-200/50 px-2 py-0.5 rounded-md font-black tracking-widest uppercase block w-fit mb-1">
            Модуль Взаимного Пиара
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight font-sans">
            Папки и Подборки Продвижения
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Объединяйте охваты ваших каналов для бесплатного взрывного обмена читателями.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 space-x-1 shrink-0 self-start md:self-auto">
          <button
            id="tab-btn-folders"
            onClick={() => setActiveTab('folders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'folders' 
                ? 'bg-white text-slate-900 shadow-3xs' 
                : 'text-slate-550 hover:text-slate-850'
            }`}
          >
            📁 Папки Пиара
          </button>
          <button
            id="tab-btn-selections"
            onClick={() => setActiveTab('selections')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'selections' 
                ? 'bg-white text-slate-900 shadow-3xs' 
                : 'text-slate-550 hover:text-slate-850'
            }`}
          >
            📚 Подборки & Списки
          </button>
          <button
            id="tab-btn-channels"
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'channels' 
                ? 'bg-white text-slate-900 shadow-3xs' 
                : 'text-slate-550 hover:text-slate-850'
            }`}
          >
            ⚙️ Настройки участия
          </button>
        </div>
      </div>

      {/* RENDER CHANNELS SETTINGS TAB */}
      {activeTab === 'channels' && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-4 md:p-5 bg-blue-50/20 border border-blue-200/50 rounded-2xl flex items-start gap-3.5 text-xs text-slate-700 leading-relaxed">
            <Settings className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-slate-800 text-sm block mb-1">
                Как работает взаимный пиар на ИИSMM?
              </span>
              <p className="mb-2">
                Для участия в продвижении каждый ваш канал настраивает тему и дает согласие на публикацию взаимных постов. 
              </p>
              <div className="font-bold text-blue-800 bg-white border border-blue-100 p-2.5 rounded-xl block">
                🚨 Важное правило: Включая галочки участия, вы гарантируете, что на вашем канале будут размещаться рекламные промо-материалы проектов в замен на размещение вашей персональной ссылки на каналах всех остальных соавторов! Бот контролирует выполнение обязательств.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-100 bg-slate-50/55 flex justify-between items-center">
              <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider font-mono">Мои Сконфигурированные Каналы</h3>
              <span className="bg-slate-200/60 text-slate-755 text-[10px] px-2.5 py-0.5 rounded font-black">
                {userChannels.length} Подключено
              </span>
            </div>

            <div className="divide-y divide-slate-150">
              {userChannels.map(ch => {
                const config = channelsConfig[ch.id] || {
                  channelId: ch.id,
                  theme: 'Бизнес и Стартапы',
                  participateInFolders: true,
                  participateInSelections: true
                };

                return (
                  <div key={ch.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">
                          {ch.platform === 'telegram' ? '✈️' : ch.platform === 'vk' ? '🔵' : '📸'}
                        </span>
                        <span className="font-extrabold text-sm text-slate-800">{ch.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                          {ch.username}
                        </span>
                      </div>
                      <p className="text-xs text-slate-450 font-medium">
                        Подписчиков: <strong className="text-slate-600">{(ch.subscribers || 1200).toLocaleString()}</strong> | Исходная тема: {ch.category}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4.5">
                      {/* Topic Selector */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase font-mono block">Тематическая Ниша</label>
                        <select
                          value={config.theme}
                          onChange={(e) => handleUpdateChannelConfig(ch.id, 'theme', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-400"
                        >
                          {PROMO_THEMES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Participate in Folders Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer pt-3 md:pt-0">
                        <input
                          type="checkbox"
                          checked={config.participateInFolders}
                          onChange={(e) => handleUpdateChannelConfig(ch.id, 'participateInFolders', e.target.checked)}
                          className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-400 cursor-pointer"
                        />
                        <div className="text-left">
                          <span className="text-xs font-extrabold text-slate-700 block leading-tight">Участвовать в Папках</span>
                          <span className="text-[9.5px] text-slate-400 block font-mono">Взаимный пиар папками</span>
                        </div>
                      </label>

                      {/* Participate in Selections Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer pt-3 md:pt-0">
                        <input
                          type="checkbox"
                          checked={config.participateInSelections}
                          onChange={(e) => handleUpdateChannelConfig(ch.id, 'participateInSelections', e.target.checked)}
                          className="w-4 h-4 rounded text-pink-500 border-slate-300 focus:ring-pink-400 cursor-pointer"
                        />
                        <div className="text-left">
                          <span className="text-xs font-extrabold text-slate-700 block leading-tight">Участвовать в Подборках</span>
                          <span className="text-[9.5px] text-slate-400 block font-mono">Текстовые взаимные списки</span>
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })}

              {userChannels.length === 0 && (
                <p className="p-8 text-center text-slate-400 text-xs italic">Нет подключенных каналов для настройки.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* RENDER FOLDERS TAB */}
      {activeTab === 'folders' && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Explain and Invite block */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Guide to Folders */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur rounded-2xl border border-slate-200/60 p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-1.5 py-0.5 font-bold uppercase font-mono tracking-widest block w-fit">
                  ИНСТРУКЦИЯ К ФОЛДЕРАМ
                </span>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <FolderLock className="w-4 h-4 text-indigo-500" />
                  Как работает создание и ведение Папок Пиара:
                </h3>
                <ul className="text-[11px] text-slate-650 space-y-2 list-decimal list-inside pl-1">
                  <li>
                    Организатор папки создает проект, выбирает тему и приглашает каналы-участники (только тех, у кого включено согласие на участие в настройках).
                  </li>
                  <li>
                    Участники автоматически получают уведомления по API/боту с деталями: примером поста и правилами.
                  </li>
                  <li>
                    После подтверждения согласия всеми соавторами, организатор генерирует Telegram-ссылку на папку и закрепляет за кнопкой поста.
                  </li>
                  <li>
                    В назначенное время бот ИИSMM автоматически публикует готовый пост на всех каналах-участниках одновременно!
                  </li>
                </ul>
              </div>

              <div className="pt-2 flex justify-start">
                <button
                  id="btn-trigger-create-folder"
                  onClick={() => setShowCreateFolderModal(true)}
                  className="px-4.5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-transform active:scale-98 flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Создать Проект Папки 📁</span>
                </button>
              </div>
            </div>

            {/* Telegram simulated incoming notification for user as participant */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-md">
              {/* Telegram-vibe Header */}
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2.5 shrink-0">
                <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse"></span>
                <span className="text-[10.5px] font-mono text-sky-400 uppercase font-black tracking-wide flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5" /> ВХОДЯЩИЕ ЗАПРОСЫ (SIMULATOR BOT)
                </span>
              </div>

              {incomingFolderInvites.map(inv => (
                <div key={inv.id} className="space-y-2.5 text-xs">
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50 space-y-2">
                    <p className="text-[11px] leading-relaxed">
                      💬 Вас приглашает <strong>{inv.organizer}</strong> вступить в папку <strong>«{inv.folderTitle}»</strong> ({inv.theme}) под ваш канал <strong>{inv.targetChannelName}</strong>!
                    </p>
                    
                    <div className="p-2 bg-slate-850 rounded-lg text-[10px] space-y-1 text-slate-350 select-none">
                      <span className="font-extrabold text-sky-300 block text-[9px] uppercase tracking-wider">Превью рекламного поста:</span>
                      <p className="italic">«{inv.intro} {inv.description} {inv.signature}»</p>
                      
                      <div className="pt-1.5 border-t border-slate-700/60 flex items-center gap-1 text-[9px] text-amber-400">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Правила размещения: {inv.rules}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2">
                    {inv.status === 'pending' ? (
                      <>
                        <button
                          id={`btn-decline-invite-${inv.id}`}
                          onClick={() => handleAnswerInvite(inv.id, 'declined')}
                          className="w-1/2 py-1.5 bg-slate-800 hover:bg-red-500 hover:text-white rounded-lg text-[10.5px] font-black tracking-tight text-slate-300 transition-colors"
                        >
                          ❌ Отклонить
                        </button>
                        <button
                          id={`btn-accept-invite-${inv.id}`}
                          onClick={() => handleAnswerInvite(inv.id, 'accepted')}
                          className="w-1/2 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-[10.5px] font-black tracking-tight text-white transition-all shadow-xs"
                        >
                          ✅ Подтвердить
                        </button>
                      </>
                    ) : inv.status === 'accepted' ? (
                      <span className="w-full text-center py-1.5 bg-green-950 border border-green-800 rounded-lg text-[11px] text-green-300 font-extrabold block">
                        ✓ Вы подтвердили участие. Бот опубликует пост!
                      </span>
                    ) : (
                      <span className="w-full text-center py-1.5 bg-slate-800 border border-slate-750 rounded-lg text-[11px] text-slate-400 font-extrabold block">
                        ✗ Вы отклонили приглашение
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {incomingFolderInvites.length === 0 && (
                <p className="text-slate-500 text-xs italic text-center py-12">Входящих запросов пока нет.</p>
              )}
            </div>
          </div>

          {/* ACTIVE PROJECTS LIST OF ORGANIZED FOLDERS */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider font-mono">Мои папки продвижения (Как Организатор)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {folderProjects.map(proj => {
                const totalParticipants = proj.participants.length;
                const acceptedParticipantsCount = proj.participants.filter(p => p.status === 'accepted').length;

                return (
                  <div key={proj.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="space-y-0.5">
                          <span className="text-[10px] bg-amber-150 text-amber-800 px-2 py-0.5 rounded font-black uppercase font-mono tracking-wider block w-fit">
                            Папка: {proj.theme}
                          </span>
                          <span className="font-sans font-black text-slate-800 text-[15px] block">{proj.title}</span>
                        </div>
                        
                        <div className="text-right">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase font-mono">Согласие авторов</span>
                          <span className="text-xs font-black text-slate-700">
                            {acceptedParticipantsCount} из {totalParticipants} соавторов
                          </span>
                        </div>
                      </div>

                      {/* Display Status indicators */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        {proj.status === 'waiting_approvals' && (
                          <span className="bg-orange-100 text-orange-850 px-2.5 py-1 rounded-full font-black flex items-center gap-1 border border-orange-200/50">
                            ⌛ ОЖИДАЕТ РЕШЕНИЙ УЧАСТНИКОВ
                          </span>
                        )}
                        {proj.status === 'ready_for_link' && (
                          <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-black flex items-center gap-1 border border-blue-200/50 animate-pulse">
                            🚨 СОГЛАСИЕ ПОЛУЧЕНО! СГЕНЕРИРУЙТЕ ССЫЛКУ НА ПАПКУ
                          </span>
                        )}
                        {proj.status === 'active' && (
                          <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-black flex items-center gap-1 border border-indigo-200/50">
                            🌐 ССЫЛКА НА ПАПКУ ПРИКРЕПЛЕНА
                          </span>
                        )}
                        {proj.status === 'published' && (
                          <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-black flex items-center gap-1 border border-green-250">
                            ✓ ОПУБЛИКОВАНО СИСТЕМОЙ ВЗАИМОПИАРА
                          </span>
                        )}
                      </div>

                      {/* Organizer post text content representation */}
                      <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl space-y-1.5 text-xs relative max-h-[170px] overflow-y-auto">
                        <span className="text-[9px] bg-slate-200/60 text-slate-500 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider block w-fit">
                          Макет публикации СНГ ({proj.intro.length + proj.description.length + proj.signature.length + 4} симв.)
                        </span>
                        
                        {proj.imageUrl && (
                          <img src={proj.imageUrl} alt="Promo" className="w-full h-24 object-cover rounded-lg border border-slate-100 opacity-90 referrer-policy='no-referrer'" />
                        )}

                        <div className="font-normal text-slate-700 leading-relaxed space-y-1">
                          <p className="font-extrabold text-slate-800">{proj.intro}</p>
                          <p className="text-slate-600 text-[11px]">{proj.description}</p>
                          <p className="font-bold text-slate-700">{proj.signature}</p>
                        </div>

                        {/* Rules rule list representation */}
                        <div className="pt-2 border-t border-slate-200/60 text-[10px] font-mono text-slate-450 space-y-0.5">
                          <p>⚖️ <strong>Правила размещения:</strong> {proj.rules}</p>
                          <p>📅 <strong>Запланировано на:</strong> {new Date(proj.scheduledTime || '').toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Participant agreement visual status list */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono block">Статус приглашенных соавторов:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {proj.participants.map(p => (
                            <div key={p.channelId} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-150 text-[10.5px]">
                              <div className="truncate pr-1">
                                <span className="font-bold text-slate-700 truncate block">{p.channelName}</span>
                                <span className="text-slate-400 text-[9px] font-mono block">{p.username}</span>
                              </div>
                              <div className="shrink-0">
                                {p.status === 'accepted' ? (
                                  <span className="text-green-600 font-black flex items-center gap-0.5 bg-green-50 px-1 py-0.5 rounded text-[9.5px]">
                                    <Check className="w-3 h-3" /> Ок
                                  </span>
                                ) : (
                                  <button
                                    id={`btn-force-accept-${proj.id}-${p.channelId}`}
                                    onClick={() => simulateAcceptance(proj.id, p.channelId)}
                                    className="text-amber-600 hover:text-amber-800 font-black bg-amber-50 px-1 py-0.5 rounded text-[9.5px] cursor-pointer"
                                    title="Нажмите, чтобы симулировать согласие автора"
                                  >
                                    ⌛ Ждать
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Operational Actions */}
                    <div className="pt-3 border-t border-slate-150 flex items-center justify-end gap-2">
                      {proj.status === 'ready_for_link' && (
                        <button
                          id={`btn-generate-folder-link-${proj.id}`}
                          onClick={() => handleGenerateFolderLink(proj.id)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white text-xs rounded-xl flex items-center justify-center gap-1"
                        >
                          🔗 Создать ссылку на папку и прикрепить кнопку
                        </button>
                      )}

                      {proj.status === 'active' && (
                        <div className="w-full flex gap-2">
                          <span className="flex-1 text-center py-2 bg-slate-100 border border-indigo-200 text-indigo-700 text-xs font-mono font-bold rounded-xl truncate" title={proj.folderLink}>
                            🔗 {proj.folderLink}
                          </span>
                          <button
                            id={`btn-publish-folder-now-${proj.id}`}
                            onClick={() => handlePublishFolderNow(proj.id)}
                            className="px-4.5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-extrabold text-xs rounded-xl hover:opacity-95"
                          >
                            🚀 Опубликовать сейчас
                          </button>
                        </div>
                      )}

                      {proj.status === 'published' && (
                        <span className="w-full text-center py-2 bg-green-50 text-green-700 font-black text-xs rounded-xl border border-green-200 block">
                          🚀 Пост с папкой успешно опубликован взаимно!
                        </span>
                      )}

                      {proj.status === 'waiting_approvals' && (
                        <div className="w-full text-center py-2 text-orange-700 bg-orange-50/50 rounded-xl text-xs font-semibold border border-orange-100">
                          Симуляция: Согласие всех соавторов требуется для генерации папки
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* RENDER SELECTIONS/DIRECTORIES TAB */}
      {activeTab === 'selections' && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Concept Header */}
          <div className="p-4.5 bg-pink-50/20 border border-pink-200/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1 pr-2">
              <span className="font-extrabold text-slate-800 text-sm block">
                Как работают Текстовые Подборки (Каталоги)?
              </span>
              <p className="text-slate-650">
                Организатор заявляет тему и дату публикации подборки. Любой автор канала данной ниши может вступить в подборку (максимум 10 участников на подборку). При вступлении автор заполняет рекламное описание своего канала.
              </p>
              <p className="text-slate-500 font-bold">
                🔥 Подборка транслируется как единый, чистый текстовый блок без картинок со списком инлайн ссылок за кнопками!
              </p>
            </div>

            <button
              id="btn-show-create-selection"
              onClick={() => setShowCreateSelection(true)}
              className="px-4 py-2 font-black text-xs text-white bg-pink-600 hover:bg-pink-700 rounded-xl shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
              + Создать Подборку/Проект
            </button>
          </div>

          {/* Form to create selection */}
          {showCreateSelection && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="p-5 bg-white border border-rose-200 rounded-2xl space-y-4 shadow-sm"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-slate-800 text-sm">Новая рекламная подборка</h4>
                <button onClick={() => setShowCreateSelection(false)} className="text-xs text-slate-405 font-black">&times;</button>
              </div>

              <form onSubmit={handleCreateSelectionProject} className="space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Тема подборки</label>
                    <select
                      value={selTheme}
                      onChange={(e) => setSelTheme(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      {PROMO_THEMES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Планируемая дата и время выхода</label>
                    <input
                      type="text"
                      required
                      placeholder="Напр. 25 июня 2026, 18:00 МСК"
                      value={selDate}
                      onChange={(e) => setSelDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-pink-400 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">Приветственное слово (Welcome Block)</label>
                  <textarea
                    rows={2}
                    required
                    value={selWelcomeText}
                    onChange={(e) => setSelWelcomeText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-pink-400"
                  />
                </div>

                <div className="flex justify-end gap-2 text-xs">
                  <button type="button" onClick={() => setShowCreateSelection(false)} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold">
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 bg-pink-600 text-white font-extrabold rounded-xl shadow-xs">
                    Опубликовать сбор в список
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* LIST OF ACTIVE SELECTIONS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {selectionsList.map(sel => (
              <div key={sel.id} className="bg-white border border-slate-200 shadow-3xs rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2 border-b pb-2.5">
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] bg-pink-100 text-pink-850 px-2.5 py-0.5 rounded font-black uppercase font-mono tracking-wide block w-fit">
                        Ниша: {sel.theme}
                      </span>
                      <p className="text-xs text-slate-400 font-mono">Организатор: {sel.organizer}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs bg-slate-100 font-extrabold text-slate-700 px-2.5 py-1 rounded">
                        👥 {sel.joinedCount} из {sel.maxParticipants} человек
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 font-mono">
                    <p>📅 <strong>Дата публикации:</strong> {sel.targetDate}</p>
                  </div>

                  {/* LIVE VISUAL PREVIEW OF THE SELECTION POST (Text block with no images!) */}
                  <div className="space-y-2 bg-slate-50 border border-slate-200/60 p-4 rounded-xl relative leading-relaxed">
                    <div className="absolute top-2 right-2 text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider select-none">
                      Текстовый макет поста (без картинок)
                    </div>

                    <div className="text-xs text-slate-700 font-normal space-y-3.5 whitespace-pre-wrap pt-2 pr-12 text-left font-sans">
                      {/* Welcome string */}
                      <p className="italic text-slate-600 font-medium">«{sel.welcomeText}»</p>
                      
                      {/* Active channels listing */}
                      <div className="space-y-3 pl-1 text-slate-800">
                        {sel.participants.map((p, pidx) => (
                          <div key={pidx} className="border-l-2 border-pink-400 pl-2.5 space-y-0.5">
                            <span className="font-extrabold block text-slate-850">{pidx + 1}. {p.channelName} ({p.username})</span>
                            <p className="text-slate-500 font-normal text-[11px] leading-relaxed">{p.promoDescription}</p>
                          </div>
                        ))}

                        {sel.participants.length === 0 && (
                          <p className="text-slate-400 italic text-[11px]">Пока нет зарегистрированных участников.</p>
                        )}
                      </div>

                      {/* Footer markup specified: created via SMM with link inline */}
                      <div className="pt-3 border-t border-slate-200/50 text-[10.5px] font-medium text-pink-700 flex flex-col gap-1 w-fit">
                        <span>⚙️ Подборка создана на платформе ИИSMM</span>
                        {/* Simulation of Telegram inline link */}
                        <div className="mt-1 bg-white border border-pink-250 py-1.5 px-3 rounded-xl text-center font-black text-xs cursor-not-allowed hover:bg-pink-50 transition-colors w-fit shadow-3xs">
                          🚀 Сделать такую же подборку бесплатно →
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit action for channel owners */}
                <div className="pt-2">
                  {sel.joinedCount >= sel.maxParticipants ? (
                    <span className="w-full text-center py-2 bg-slate-105 text-slate-500 text-xs font-bold rounded-xl border border-slate-150 block">
                      ✓ Набор закрыт (Максимум 10 участников)
                    </span>
                  ) : (
                    <button
                      id={`btn-join-selection-${sel.id}`}
                      onClick={() => handleOpenJoinSelection(sel.id)}
                      className="w-full py-2 bg-gradient-to-r from-pink-500 to-pink-650 text-white font-black text-xs rounded-xl shadow-3xs cursor-pointer hover:opacity-95"
                    >
                      Присоединиться к подборке (Бесплатно)
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* DIALOG FOR PARTICIPANT CHANNEL INPUT IN SELECTION (Description & Selection dialog) */}
      <AnimatePresence>
        {activeJoinSelectionId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-3xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-5 border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="font-extrabold text-slate-800 text-sm">Присоединиться к подборке</h4>
                <button onClick={() => setActiveJoinSelectionId(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
              </div>

              <form onSubmit={handleJoinSelectionSubmit} className="space-y-4 text-xs">
                {/* Channel dropdown picker */}
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-black text-slate-600 block">Какой канал заявить к пиару:</label>
                  <select
                    value={joinSelectedChannelId}
                    onChange={(e) => setJoinSelectedChannelId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  >
                    {userChannels.filter(c => {
                      const config = channelsConfig[c.id];
                      return config ? config.participateInSelections : true;
                    }).map(c => (
                      <option key={c.id} value={c.id}>{c.platform.toUpperCase() ? c.platform.toUpperCase() : 'TG'} - {c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Promo Description */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-slate-600 block">Рекламное описание вашего канала:</label>
                    <span className="text-[10px] text-slate-400">{joinChannelPromoDesc.length}/200 симв.</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={200}
                    required
                    placeholder="Напр. Первый новостной блог об автоматизации продаж и нейросетях. Умные кейсы для вашего бизнеса."
                    value={joinChannelPromoDesc}
                    onChange={(e) => setJoinChannelPromoDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-pink-400 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 italic">Описание будет транслироваться под ссылкой вашего канала.</p>
                </div>

                <div className="p-3 bg-pink-50 border border-pink-100 rounded-xl flex items-start gap-2 text-[11.5px] text-pink-700 leading-normal text-left">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block mb-0.5">Условия подборки</span>
                    <p>Вы соглашаетесь, что в день выхода подборки, бот ИИSMM разместит этот текстовый список ссылок на вашем канале.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button type="button" onClick={() => setActiveJoinSelectionId(null)} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold">
                    Отмена
                  </button>
                  <button type="submit" className="px-5 py-2 bg-pink-600 hover:bg-pink-700 font-extrabold text-white rounded-xl shadow-xs">
                    Подтвердить и вступить
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BIG FOLDER CREATION MODAL WITH DETAILED TEXT-CHECK AND LIMITS */}
      <AnimatePresence>
        {showCreateFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-3xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg p-5 md:p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b pb-2.5">
                <h4 className="font-sans font-black text-slate-800 text-base">Организовать новую Папку Пиара</h4>
                <button onClick={() => setShowCreateFolderModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
              </div>

              <form onSubmit={handleCreateFolderProject} className="space-y-4 text-xs text-left">
                
                {/* Title and Theme */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Название проекта</label>
                    <input
                      type="text"
                      required
                      placeholder="Напр. Стартап Авангард"
                      value={folderTitle}
                      onChange={(e) => setFolderTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Тематика подборки</label>
                    <select
                      value={folderTheme}
                      onChange={(e) => setFolderTheme(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                    >
                      {PROMO_THEMES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 900 Chars visual segment */}
                <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-150 space-y-3">
                  <div className="flex justify-between items-center text-[10px] uppercase font-mono font-black text-indigo-750">
                    <span>Составляющие Рекламного посты</span>
                    <span className={totalFolderTextLength > 900 ? 'text-red-500 font-extrabold' : 'text-indigo-650'}>
                      {totalFolderTextLength} / 900 символов
                    </span>
                  </div>

                  {/* Intro/Заход */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-900 block uppercase">1. Заход по тексту (Intro)</label>
                    <input
                      type="text"
                      required
                      placeholder="Напр. ⚡️ Срочно сохраняйте эту папку предпринимателя!"
                      value={folderIntro}
                      onChange={(e) => setFolderIntro(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs"
                    />
                  </div>

                  {/* Description/Описание */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-900 block uppercase">2. Описание папки (Body Description)</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Напр. Внутри собраны только проверенные авторские блоги о выходе на зарубежные маркетплейсы, аналитике стартапов и пошаговых гайдлайнах управления персоналом."
                      value={folderDesc}
                      onChange={(e) => setFolderDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs resize-none"
                    />
                  </div>

                  {/* Signature/Подпись */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-900 block uppercase">3. Призывающая Подпись (Signature)</label>
                    <input
                      type="text"
                      required
                      placeholder="Напр. Подпишитесь, пока доступ открыт бесплатно!"
                      value={folderSign}
                      onChange={(e) => setFolderSign(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Image and placement rules */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Картинка рекламного поста (URL)</label>
                    <input
                      type="text"
                      value={folderImageUrl}
                      onChange={(e) => setFolderImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Время автоматического размещения</label>
                    <input
                      type="datetime-local"
                      required
                      value={folderPubTime}
                      onChange={(e) => setFolderPubTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Fixed placement rules: "3 дня в ленте и 3 часа в топе без перекрытия" */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">Правила размещения для участников (Лимит)</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={folderRules}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed"
                    title="Длина утилитарных правил размещения зафиксирована"
                  />
                  <p className="text-[10px] text-slate-400 italic">✓ Фиксировано: 3 дня в ленте и 3 часа в топе без перекрытия для равенства отдачи охватов.</p>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-2">
                  <button type="button" onClick={() => setShowCreateFolderModal(false)} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold">
                    Отмена
                  </button>
                  <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white rounded-xl shadow-xs">
                    Отправить приглашения авторам
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
