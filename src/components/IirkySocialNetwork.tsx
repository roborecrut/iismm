import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, MessageSquare, Heart, Send, Trash2, Smile, Sparkles, UserPlus, 
  Globe, Image, Share2, Award, ThumbsUp, MoreHorizontal, X, ArrowRight,
  ExternalLink, Bookmark, Shield, Radio, Check, CheckCircle2, MessageCircle, 
  SendHorizontal, Coins, FolderPlus, Settings, AlertCircle, Search, HelpCircle, 
  Lock, RefreshCw, Star, CheckSquare, ChevronLeft, ChevronRight, Paperclip, Bot, Edit3, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAccount } from '../types';
import VoiceRecorderModal from './VoiceRecorderModal';
import VoiceMessagePlayer from './VoiceMessagePlayer';

export const RainbowHeartIcon = ({ className = "w-5 h-5", id = "rainbow-heart-grad" }: { className?: string; id?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill={`url(#${id})`}>
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="25%" stopColor="#ec4899" />
        <stop offset="50%" stopColor="#f97316" />
        <stop offset="75%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

interface IirkySocialNetworkProps {
  user: UserAccount;
  currentUser?: UserAccount;
  onUpdateUser?: (updated: UserAccount) => void;
  currentPath?: string;
}

interface SocialPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    username: string;
    isVip?: boolean;
  };
  content: string;
  image?: string;
  images?: string[];
  backgroundGradient?: string;
  feeling?: string;
  taggedFriends?: string[];
  createdAt: string;
  likes: { [type: string]: number };
  myReaction?: string;
  comments: Array<{
    id: string;
    author: string;
    avatar: string;
    text: string;
    createdAt: string;
  }>;
  sharesCount: number;
}

const AlbumGrid = ({ images }: { images?: string[] }) => {
  if (!images || images.length === 0) return null;
  
  const count = images.length;
  let gridCols = "grid-cols-2";
  if (count === 1) gridCols = "grid-cols-1";
  else if (count === 3) gridCols = "grid-cols-3";
  else if (count >= 4) gridCols = "grid-cols-2";

  return (
    <div className={`mt-2.5 grid ${gridCols} gap-2 rounded-xl overflow-hidden max-w-lg border border-slate-200 p-1 bg-slate-50`}>
      {images.slice(0, 4).map((img, index) => {
        const isLastAndMore = index === 3 && count > 4;
        return (
          <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200">
            <img src={img} className="w-full h-full object-cover" alt="Attached album detail" />
            {isLastAndMore && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-black text-sm select-none">
                +{count - 4}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface Story {
  id: string;
  authorName: string;
  authorAvatar: string;
  image: string;
  isMe?: boolean;
}

interface VirtualFriend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline';
  bio: string;
  isFriend: boolean;
  isPendingMe?: boolean;
  isPendingThem?: boolean;
}

interface FloatingChat {
  friendId: string;
  friendName: string;
  friendAvatar: string;
  messages: Array<{
    id: string;
    sender: 'me' | 'them';
    text: string;
    time: string;
    images?: string[];
    senderName?: string;
  }>;
  isMinimized?: boolean;
}

interface EscrowDeal {
  id: string;
  title: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  amount: number;
  description: string;
  status: 'pending_funding' | 'funded' | 'completed' | 'disputed' | 'refunded';
  date: string;
  logs: string[];
}

export default function IirkySocialNetwork({ user, currentUser, onUpdateUser, currentPath = '/social' }: IirkySocialNetworkProps) {
  const activeUser = currentUser || user;
  // --- Active Tab determination from routing path ---
  const getTabFromPath = (path: string) => {
    if (path.includes('/social/messages')) return 'messages';
    if (path.includes('/social/deals')) return 'deals';
    if (path.includes('/social/coauthors')) return 'coauthors';
    if (path.includes('/social/saved')) return 'saved';
    return 'feed';
  };

  const activeSocialTab = getTabFromPath(currentPath);

  // Push tab changes back to App.tsx
  const navigateToTab = (tab: 'feed' | 'messages' | 'deals' | 'coauthors' | 'saved') => {
    let sub = '';
    if (tab === 'feed') sub = 'feed';
    else if (tab === 'messages') sub = 'messages';
    else if (tab === 'deals') sub = 'deals';
    else if (tab === 'coauthors') sub = 'coauthors';
    else if (tab === 'saved') sub = 'saved';
    
    window.history.pushState(null, '', `/social/${sub}`);
    window.dispatchEvent(new Event('popstate'));
  };

  // --- Dynamic posts state ---
  const [posts, setPosts] = useState<SocialPost[]>([
    {
      id: 'post-1',
      author: {
        name: 'Павел Дуров (ИИ-клон)',
        username: '@durov_ai',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        isVip: true
      },
      content: '⚡ Мы полностью перевели инфраструктуру Синдиката Соавторов на ИИрки (🪙). Больше никаких задержек платежей за взаимный пиар или рекламные интеграции в Telegram и Сетке! Все транзакции депонируются ИИ-ботом и распределяются мгновенно. Ваша стена — это ваша валюта. Копите ИИрки и делайте правильный контент!',
      createdAt: '15 минут назад',
      likes: { 'like': 42, 'love': 21, 'wow': 8 },
      myReaction: undefined,
      comments: [
        {
          id: 'c-1',
          author: 'Дмитрий Performance',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
          text: 'Павел, это гениально! С ИИрками вся реклама стала на 15% дешевле из-за отсутствия банковских аппетитов.',
          createdAt: '10 мин. назад'
        },
        {
          id: 'c-2',
          author: 'Анна Трафик-SMM',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
          text: 'Уже перевела 4 своих Telegram канала на сдельную систему оплаты за ИИрки 🪙🚀',
          createdAt: '5 мин. назад'
        }
      ],
      sharesCount: 14
    },
    {
      id: 'post-diy-smm',
      author: {
        name: 'Дмитрий Performance',
        username: '@dima_smm',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
      },
      content: '🔥 Разбор кейса: Слили 500 тыс. рублей на таргет в авто-сообществах и вышли в плюс x3.2 за счет точечного кросс-пиара с соавторами! Секрет успеха очень простой: договаривайтесь о взаимных папках только с партнерами, у которых высокий рейтинг вовлеченности в Сетке.',
      createdAt: '1 час назад',
      likes: { 'like': 24, 'love': 18 },
      comments: [],
      sharesCount: 8
    },
    {
      id: 'post-2',
      author: {
        name: 'Анна Трафик-SMM',
        username: '@anna_traffic',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
      },
      content: 'Обожаю запускать новые рекламные папки взаимного пиара вместе с соавторами! Написала умный контент-план и сгенерировала картинки через Gemini. Давайте объединяться, ребят!👇',
      image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800',
      createdAt: '2 часа назад',
      likes: { 'like': 18, 'love': 12 },
      myReaction: 'love',
      comments: [
        {
          id: 'c-3',
          author: 'SAV AI Developer',
          avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80',
          text: 'Отличный визуал! Шаблон папки опубликовали уже?',
          createdAt: '1 час назад'
        }
      ],
      sharesCount: 3
    },
    {
      id: 'post-sav-ai-1',
      author: {
        name: 'SAV AI Developer',
        username: '@SAV_AI',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
        isVip: true
      },
      content: '⚒️ Залил глобальное обновление для социальной экосистемы ИИSMM! Написал полноценный движок управления заявками в друзья/соавторы с возможностью мгновенного переключения и "просмотра их лент". Теперь вы видите публикации коллег прямо в реальном времени.',
      createdAt: '3 часа назад',
      likes: { 'like': 14, 'love': 10 },
      comments: [],
      sharesCount: 5
    },
    {
      id: 'post-mariya-seo-1',
      author: {
        name: 'Мария Сеошница',
        username: '@mariya_seo',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
      },
      content: '📈 Рост трафика за счет LSI-подборок в Сетке. Каждый соавтор выступает как донор ссылочной массы и живого трафика. Проверили на 12 Telegram-каналах — рост поисковой выдачи превосходный! Применяйте ИИ-арбитраж для защиты рекламных трат.',
      createdAt: '5 часов назад',
      likes: { 'like': 11, 'haha': 1 },
      comments: [],
      sharesCount: 2
    },
    {
      id: 'post-3',
      author: {
        name: 'ИИ Помощник ИИSMM',
        username: '@iismm_helper',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
        isVip: true
      },
      backgroundGradient: 'from-sky-400 via-pink-500 through-orange-500 to-sky-400',
      content: '🚀 СОВЕТ ДНЯ: Используйте AI рерайтер, чтобы адаптировать один и тот же крутой инфоповод под специфику Telegram (кратко/броско), VK (подробно/картинка) и Сетку (интеллектуально)! Сделки защищаются блокчейн-протоколом ИИрок!',
      createdAt: '4 часа назад',
      likes: { 'like': 35, 'wow': 15, 'haha': 2 },
      comments: [],
      sharesCount: 32
    }
  ]);

  // --- Virtual Friends Database ---
  const [virtualFriends, setVirtualFriends] = useState<VirtualFriend[]>([
    {
      id: 'group-smm',
      name: '💬 Групповой Чат Синдиката',
      username: '@syndicate_group',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=105',
      status: 'online',
      bio: 'Общий чат всех соавторов и партнеров SMM-комбайна. Копим ИИрки всей толпой!',
      isFriend: true
    },
    {
      id: 'f-1',
      name: 'Дмитрий Performance',
      username: '@dima_smm',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      status: 'online',
      bio: 'Спец по платному трафику и анализу UTM-меток в ИИрках. Наливаю трафик.',
      isFriend: true
    },
    {
      id: 'f-2',
      name: 'Анна Трафик-SMM',
      username: '@anna_traffic',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      status: 'online',
      bio: 'Креативный продюсер папок пиара. Ищу сильных соавторов.',
      isFriend: true
    },
    {
      id: 'f-3',
      name: 'Павел Дуров (ИИ-клон)',
      username: '@durov_ai',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      status: 'offline',
      bio: 'Верните стену и копите ИИрки у себя в кошельке.',
      isFriend: true
    },
    {
      id: 'f-4',
      name: 'SAV AI Developer',
      username: '@SAV_AI',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
      status: 'online',
      bio: 'Тимлид платформы ИИSMM. Кожу на React и Node.js. Спроси меня об ИИрках!',
      isFriend: false,
      isPendingMe: true
    },
    {
      id: 'f-5',
      name: 'Мария Сеошница',
      username: '@mariya_seo',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      status: 'online',
      bio: 'LSI оптимизация и автогенерируемые блоги. Куплю подборку.',
      isFriend: false
    }
  ]);

  // --- Stories Database ---
  const stories: Story[] = [
    {
      id: 's-me',
      authorName: 'Вы',
      authorAvatar: user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120',
      image: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400',
      isMe: true
    },
    {
      id: 's-1',
      authorName: 'Павел Дуров',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400'
    },
    {
      id: 's-2',
      authorName: 'Анна Трафик',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400'
    },
    {
      id: 's-3',
      authorName: 'Дмитрий Performance',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400'
    }
  ];

  // --- Page - Interactive Full Messaging System ---
  const [activeChatFriendId, setActiveChatFriendId] = useState<string>('group-smm');
  const [chatHistories, setChatHistories] = useState<{ [friendId: string]: Array<{ id: string; sender: 'me' | 'them'; text: string; time: string; images?: string[]; senderName?: string }> }>({
    'group-smm': [
      { id: 'g-1', sender: 'them', senderName: 'Дмитрий Performance', text: 'Всем привет! Как продвигается запуск таргета ИИрок?', time: '10:10' },
      { id: 'g-2', sender: 'them', senderName: 'Анна Трафик-SMM', text: 'Завтра опубликуем совместный пост Взаимного Пиара! Готовлю картинки ✨', time: '10:12' }
    ],
    'f-1': [
      { id: '1', sender: 'them', text: 'Привет! Подготовил папки взаимного пиара для Сетки. Готов проверить коэффициенты?', time: '10:15' },
      { id: '2', sender: 'me', text: 'Супер, скидывай. Посмотрим, сколько у нас участников.', time: '10:18' },
      { id: '3', sender: 'them', text: 'Там 5 соавторов, общая аудитория ~45К. Оформу сделку через эскроу ИИрок?', time: '10:20' }
    ],
    'f-2': [
      { id: '1', sender: 'them', text: 'Привет! Твой ИИ-рерайтер выдал отличные результаты для моего Telegram-канала.', time: 'Вчера' },
      { id: '2', sender: 'me', text: 'Круто, рад помочь! Подключай автопостинг по API.', time: 'Вчера' }
    ],
    'f-3': [
      { id: '1', sender: 'them', text: 'Завтра запускаем масштабное обновление ИИрок. Сделай анонс у себя.', time: 'Вчера' }
    ],
    'f-4': [
      { id: '1', sender: 'them', text: 'Слушай, а ты тестировал автоподбор соавторов по общим интересам SMM?', time: '12:00' }
    ],
    'f-5': [
      { id: '1', sender: 'them', text: 'Хочу обменять 100 000 ИИрок на раскрутку моей рекламной папки.', time: 'Какое-то время назад' }
    ]
  });
  const [currentMessageInputText, setCurrentMessageInputText] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyPrompt, setAutoReplyPrompt] = useState('Я сейчас немного занят, генерирую контент через Gemini. Напишу через пару минут! Можете отправить мне ИИрки на эскроу-депозит.');
  const [isTyping, setIsTyping] = useState(false);
  const [messagesSubTab, setMessagesSubTab] = useState<'all' | 'group' | 'personal' | 'unread'>('all');
  const [unreadChatIds, setUnreadChatIds] = useState<string[]>(['f-3', 'f-4']);
  const [messageSearchText, setMessageSearchText] = useState('');

  // Premium In-App Toast Notification state
  const [premiumToast, setPremiumToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [toastTimeoutId, setToastTimeoutId] = useState<any>(null);

  const customAlertShadow = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    let derivedType = type;
    const lower = message.toLowerCase();
    if (lower.includes('ошиб') || lower.includes('недостаточно') || lower.includes('огранич') || lower.includes('отклонена') || lower.includes('неверн')) {
      derivedType = 'error';
    } else if (lower.includes('удален') || lower.includes('отмен') || lower.includes('отклонен')) {
      derivedType = 'info';
    }

    setPremiumToast({ message, type: derivedType });
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    const tid = setTimeout(() => {
      setPremiumToast(null);
    }, 4500);
    setToastTimeoutId(tid);
  };

  // Shadow standard window.alert
  const alert = (msg: string) => {
    customAlertShadow(msg);
  };

  // SMM grid premium attachments preview, replies and forwarding states
  const [activeImagePreviewUrl, setActiveImagePreviewUrl] = useState<string | null>(null);
  const [activePreviewAlbum, setActivePreviewAlbum] = useState<string[]>([]);
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState<number>(0);

  const [replyingToMessage, setReplyingToMessage] = useState<{ id: string; sender: 'me' | 'them'; text: string; senderName?: string } | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<{ text: string; images?: string[] } | null>(null);
  const [selectedMessageForAction, setSelectedMessageForAction] = useState<{ id: string; sender: 'me' | 'them'; text: string; senderName?: string; images?: string[]; reactions?: string[] } | null>(null);
  const [msgClickPos, setMsgClickPos] = useState<{ x: number; y: number } | null>(null);
  const [showAutoReplyModal, setShowAutoReplyModal] = useState(false);

  const handleOpenImagePreview = (clickedImg: string, album: string[] = []) => {
    setActiveImagePreviewUrl(clickedImg);
    setActivePreviewAlbum(album.length > 0 ? album : [clickedImg]);
    const idx = album.indexOf(clickedImg);
    setCurrentAlbumIndex(idx >= 0 ? idx : 0);
  };

  // Protalk Media Loader state for photos, videos, voice messages, files
  const [protalkMediaFile, setProtalkMediaFile] = useState<{
    url: string;
    type: 'photo' | 'video' | 'voice' | 'file';
    name: string;
    progress: number;
    isUploading: boolean;
  } | null>(null);

  const handleProtalkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let mediaType: 'photo' | 'video' | 'voice' | 'file' = 'file';
    if (file.type.startsWith('image/')) mediaType = 'photo';
    else if (file.type.startsWith('video/')) mediaType = 'video';
    else if (file.type.startsWith('audio/')) mediaType = 'voice';

    const objectUrl = URL.createObjectURL(file);
    setProtalkMediaFile({
      url: objectUrl,
      type: mediaType,
      name: file.name,
      progress: 15,
      isUploading: true
    });

    let p = 15;
    const interval = setInterval(() => {
      p += 25;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProtalkMediaFile(prev => prev ? { ...prev, progress: 100, isUploading: false } : null);
      } else {
        setProtalkMediaFile(prev => prev ? { ...prev, progress: p } : null);
      }
    }, 150);
  };

  // Fetch persisted chat messages from SQLite DB
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/chat/messages?chatId=${encodeURIComponent(activeChatFriendId)}`)
      .then(res => res.json())
      .then(dbMsgs => {
        if (isMounted && Array.isArray(dbMsgs) && dbMsgs.length > 0) {
          const formatted = dbMsgs.map((m: any) => ({
            id: String(m.id),
            sender: m.sender as 'me' | 'them',
            senderName: m.senderName || m.sender_name || undefined,
            text: m.text || '',
            time: m.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            images: m.images || (m.images_json ? JSON.parse(m.images_json) : undefined),
            mediaUrl: m.mediaUrl || m.media_url || undefined,
            mediaType: m.mediaType || m.media_type || undefined,
            replyTo: m.replyTo || (m.reply_to_json ? JSON.parse(m.reply_to_json) : undefined)
          }));
          setChatHistories(prev => ({
            ...prev,
            [activeChatFriendId]: formatted
          }));
        }
      })
      .catch(err => console.error('Error fetching chat messages from DB:', err));

    return () => { isMounted = false; };
  }, [activeChatFriendId]);

  // Clear unread mark on opening chat
  useEffect(() => {
    if (activeChatFriendId) {
      setUnreadChatIds(prev => prev.filter(id => id !== activeChatFriendId));
    }
  }, [activeChatFriendId]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Auto Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, activeChatFriendId]);

  // Handle Voice Recording Processed from ProTalk STT Modal
  const handleVoiceProcessed = (result: { url: string; text: string }) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userText = result.text ? result.text : '🎤 Голосовое сообщение';
    
    const newMsg = {
      id: `full-m-voice-${Date.now()}`,
      sender: 'me' as const,
      senderName: user?.name || 'Вы',
      text: userText,
      time: timeNow,
      mediaUrl: result.url,
      mediaType: 'voice' as const
    };

    const updatedMsgs = [
      ...(chatHistories[activeChatFriendId] || []),
      newMsg
    ];

    setChatHistories({
      ...chatHistories,
      [activeChatFriendId]: updatedMsgs
    });

    // Save voice message to SQLite DB
    fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: activeChatFriendId,
        sender: 'me',
        senderName: user?.name || 'Вы',
        text: userText,
        mediaUrl: result.url,
        mediaType: 'voice',
        time: timeNow
      })
    }).catch(e => console.error('Failed to save voice message to DB:', e));

    // Trigger ProTalk AI response to the voice message / STT text
    setIsTyping(true);
    const currentBuddy = virtualFriends.find(f => f.id === activeChatFriendId) || virtualFriends[0];
    const responderName = currentBuddy.name;
    const userName = user?.name || 'Тимошенко Денис';

    fetch('/api/protalk/chat-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userText: userText,
        userName: userName,
        chatId: activeChatFriendId,
        responderName: responderName
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsTyping(false);
        const aiText = data.text || `Принял твое голосовое сообщение, ${userName}! Обязательно берем в работу. 🚀`;
        const replyQuote = {
          text: userText,
          senderName: userName.toUpperCase()
        };

        setChatHistories(prev => ({
          ...prev,
          [activeChatFriendId]: [
            ...(prev[activeChatFriendId] || []),
            {
              id: `full-m-reply-${Date.now()}`,
              sender: 'them' as const,
              senderName: responderName,
              text: aiText,
              time: timeNow,
              replyTo: replyQuote
            }
          ]
        }));

        fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChatFriendId,
            sender: 'them',
            senderName: responderName,
            text: aiText,
            time: timeNow,
            replyTo: replyQuote
          })
        }).catch(e => console.error('Failed to save ProTalk AI voice response to DB:', e));
      })
      .catch(err => {
        setIsTyping(false);
        console.warn('ProTalk voice reply fetch error:', err);
      });
  };

  // Handle send message on full page messaging
  const handleSendFullChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessageInputText.trim() && chatAttachedImages.length === 0 && !protalkMediaFile) return;

    const userMessageText = currentMessageInputText;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const attached = chatAttachedImages.length > 0 ? chatAttachedImages : undefined;

    const mediaUrl = protalkMediaFile?.url;
    const mediaType = protalkMediaFile?.type;

    const replyData = replyingToMessage 
      ? {
          text: replyingToMessage.text,
          senderName: replyingToMessage.senderName || (replyingToMessage.sender === 'me' ? 'Вы' : (virtualFriends.find(f => f.id === activeChatFriendId)?.name || 'Соавтор'))
        }
      : undefined;

    const newMsg = {
      id: `full-m-${Date.now()}`, 
      sender: 'me' as const, 
      senderName: user?.name || 'Вы',
      text: userMessageText, 
      time: timeNow, 
      images: attached,
      mediaUrl,
      mediaType,
      replyTo: replyData
    };

    const updatedMsgs = [
      ...(chatHistories[activeChatFriendId] || []),
      newMsg
    ];

    setChatHistories({
      ...chatHistories,
      [activeChatFriendId]: updatedMsgs
    });

    // Save to SQLite DB
    fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: activeChatFriendId,
        sender: 'me',
        senderName: user?.name || 'Вы',
        text: userMessageText,
        images: attached ? JSON.stringify(attached) : null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        replyTo: replyData ? JSON.stringify(replyData) : null,
        time: timeNow
      })
    }).catch(e => console.error('Failed to save chat message to DB:', e));

    setCurrentMessageInputText('');
    setChatAttachedImages([]);
    setChatAttachedImagesError('');
    setReplyingToMessage(null);
    setProtalkMediaFile(null);

    // Trigger ProTalk AI response to text message
    setIsTyping(true);
    const isGroup = activeChatFriendId === 'group-smm';
    let responderName: string | undefined = undefined;
    if (isGroup) {
      const list = virtualFriends.filter(f => f.id !== 'group-smm');
      const f = list[Math.floor(Math.random() * list.length)];
      responderName = f.name;
    } else {
      const currentBuddy = virtualFriends.find(f => f.id === activeChatFriendId) || virtualFriends[0];
      responderName = currentBuddy.name;
    }

    const userName = user?.name || 'Тимошенко Денис';

    fetch('/api/protalk/chat-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userText: userMessageText,
        userName: userName,
        chatId: activeChatFriendId,
        responderName: responderName
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsTyping(false);
        const selectedResponseText = data.text || `Отличная идея, ${userName}! Запускаем в SMM-синдикате. 🔥`;
        const replyQuote = {
          text: userMessageText,
          senderName: userName.toUpperCase()
        };

        setChatHistories(prev => ({
          ...prev,
          [activeChatFriendId]: [
            ...(prev[activeChatFriendId] || []),
            { 
              id: `full-m-reply-${Date.now()}`, 
              sender: 'them' as const, 
              senderName: responderName,
              text: selectedResponseText, 
              time: timeNow,
              replyTo: replyQuote
            }
          ]
        }));

        fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChatFriendId,
            sender: 'them',
            senderName: responderName,
            text: selectedResponseText,
            time: timeNow,
            replyTo: replyQuote
          })
        }).catch(e => console.error('Failed to save text ProTalk AI reply to DB:', e));

        // Trigger AI Autoreply demonstration notice if enabled (only if not a group chat for realistic feel)
        if (autoReplyEnabled && !isGroup) {
          setTimeout(() => {
            setChatHistories(prev => ({
              ...prev,
              [activeChatFriendId]: [
                ...(prev[activeChatFriendId] || []),
                { id: `full-m-auto-${Date.now()}`, sender: 'me' as const, text: `[ИИ-Автоответчик]: ${autoReplyPrompt}`, time: timeNow }
              ]
            }));
          }, 800);
        }
      })
      .catch(err => {
        setIsTyping(false);
        console.warn('ProTalk text reply fetch error:', err);
      });
  };

  // --- Page - Escrow / Secure Deals state & simulation ---
  const [escrowDeals, setEscrowDeals] = useState<EscrowDeal[]>([
    {
      id: 'deal-1',
      title: 'Взаимный пиар Telegram Сетка',
      partnerId: 'f-2',
      partnerName: 'Анна Трафик-SMM',
      partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      amount: 150000,
      description: 'Закрепить взаимный рекламный пост на 48 часов в нашем совместном паблике Сетки.',
      status: 'funded',
      date: 'Сегодня, 11:24',
      logs: ['Сделка создана соавтором', 'ИИрки (150,000 🪙) депонированы на независимом эскроу-счете системы']
    },
    {
      id: 'deal-2',
      title: 'Аудит рекламного креатива по СЕО',
      partnerId: 'f-5',
      partnerName: 'Мария Сеошница',
      partnerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      amount: 75000,
      description: 'LSI оптимизация заголовков и подборов ключевых слов для умного ИИ-помощника продвижения.',
      status: 'completed',
      date: 'Вчера, 18:40',
      logs: [
        'Сделка успешно создана', 
        'Депозит 75,000 ИИрок внесен', 
        'Заказчик подтвердил надлежащее качество выполненных работ', 
        'ИИрки автоматически депонированы и разблокированы исполнителю'
      ]
    }
  ]);

  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealBuddyId, setNewDealBuddyId] = useState('f-1');
  const [newDealAmount, setNewDealAmount] = useState('50000');
  const [newDealDesc, setNewDealDesc] = useState('');
  const [isSubmittingDeal, setIsSubmittingDeal] = useState(false);

  // Arbitration Chat State Mock
  const [arbitrationDealId, setArbitrationDealId] = useState<string | null>(null);
  const [arbitrationLog, setArbitrationLog] = useState<string[]>([]);
  const [arbitrationVerdict, setArbitrationVerdict] = useState<string | null>(null);

  // Trigger Escrow Deal simulation
  const handleCreateEscrowDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle.trim() || !newDealAmount) return;

    const amountNum = parseInt(newDealAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Пожалуйста, введите корректную сумму ИИрок!');
      return;
    }

    if (user.iirky < amountNum) {
      alert(`Недостаточно ИИрок на балансе! Ваш баланс: ${user.iirky.toLocaleString()} 🪙`);
      return;
    }

    setIsSubmittingDeal(true);
    setTimeout(() => {
      const selectedBuddy = virtualFriends.find(f => f.id === newDealBuddyId) || virtualFriends[0];
      const newDeal: EscrowDeal = {
        id: `deal-${Date.now()}`,
        title: newDealTitle,
        partnerId: selectedBuddy.id,
        partnerName: selectedBuddy.name,
        partnerAvatar: selectedBuddy.avatar,
        amount: amountNum,
        description: newDealDesc || 'Информационное сопровождение в союзе соавторов.',
        status: 'funded',
        date: 'Только что',
        logs: [
          'Сделка инициирована', 
          `Списано ${amountNum.toLocaleString()} 🪙 из вашего кошелька`, 
          'ИИрки благополучно переведены на защищенный смарт-эскроу адрес'
        ]
      };

      // Deduct ИИрки from real state
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          iirky: user.iirky - amountNum
        });
      }

      setEscrowDeals([newDeal, ...escrowDeals]);
      setNewDealTitle('');
      setNewDealDesc('');
      setNewDealAmount('50000');
      setIsSubmittingDeal(false);

      alert('Сделка успешно открыта! ИИрки заморожены на эскроу контракте.');
    }, 1000);
  };

  // Complete Escrow Deal (Release funds)
  const handleReleaseEscrowFunds = (dealId: string) => {
    setEscrowDeals(prev => prev.map(deal => {
      if (deal.id === dealId) {
        return {
          ...deal,
          status: 'completed' as const,
          logs: [...deal.logs, 'Заказчик подтвердил успешную приемку!', 'ИИрки отправлены получателю. Сделка благополучно закрыта! ✔️']
        };
      }
      return deal;
    }));
    alert('Средства успешно высвобождены и отправлены вашему соавтору! Спасибо за безопасную работу.');
  };

  // Request Arbitration (AI-Durov Referee)
  const handleRequestArbitration = (dealId: string) => {
    const targetDeal = escrowDeals.find(d => d.id === dealId);
    if (!targetDeal) return;

    setArbitrationDealId(dealId);
    setArbitrationLog([
      'Инициализирован протокол умного ИИ-Арбитража.',
      'Анализ условий сделки и переписки в чате...',
      'Вызов независимого авторитетного арбитра Павла Дурова...'
    ]);
    setArbitrationVerdict(null);

    setTimeout(() => {
      setArbitrationLog(prev => [...prev, 'Павел Дуров подключился к арбитражной сессии.']);
      
      setTimeout(() => {
        const verdicts = [
          `Решение арбитра: Условия сделки со стороны '${targetDeal.partnerName}' признаны выполненными. ИИрки переводятся исполнителю за вычетом 1% стандартной комиссии экосистемы Сетки.`,
          `Решение арбитра: Обнаружены грубые нарушения сроков рекламы. Сделка отменена. Сумма в размере ${targetDeal.amount.toLocaleString()} 🪙 возвращена обратно на баланс соавтора.`
        ];
        const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
        setArbitrationVerdict(verdict);

        // If returned, add to balance
        if (verdict.includes('возвращена обратно') && onUpdateUser) {
          onUpdateUser({
            ...user,
            iirky: user.iirky + targetDeal.amount
          });
        }

        setEscrowDeals(prev => prev.map(deal => {
          if (deal.id === dealId) {
            const hasRefunded = verdict.includes('возвращена обратно');
            return {
              ...deal,
              status: hasRefunded ? ('refunded' as const) : ('completed' as const),
              logs: [...deal.logs, 'Запущен ИИ-Арбитраж платформы', `Павел Дуров вынес официальный вердикт: ${verdict}`]
            };
          }
          return deal;
        }));
      }, 2000);

    }, 1500);
  };

  // --- Page - competitive leaderboards & tips ---
  const [tippingBuddyId, setTippingBuddyId] = useState<string | null>(null);
  const [tipQuantityInput, setTipQuantityInput] = useState('25000');
  const [isSendingTip, setIsSendingTip] = useState(false);
  const [tipResponse, setTipResponse] = useState<string | null>(null);

  const handleSendTip = () => {
    const amt = parseInt(tipQuantityInput);
    if (isNaN(amt) || amt <= 0) {
      alert('Укажите верное количество ИИрок!');
      return;
    }
    if (user.iirky < amt) {
      alert('Недостаточно ИИрок для поощрения соавтора!');
      return;
    }

    setIsSendingTip(true);
    setTimeout(() => {
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          iirky: user.iirky - amt
        });
      }

      const buddy = virtualFriends.find(f => f.id === tippingBuddyId);
      setIsSendingTip(false);
      setTipResponse(`Вы успешно поддержали ${buddy?.name || 'соавтора'} переводом в ${amt.toLocaleString()} 🪙 ИИрок! Получено автоматическое "Спасибо!" в ЛС.`);
      
      // Auto close and clean
      setTimeout(() => {
        setTippingBuddyId(null);
        setTipResponse(null);
        setTipQuantityInput('25000');
      }, 3500);
    }, 1200);
  };

  // --- Page - Saved folders & templates ---
  const [savedFolders, setSavedFolders] = useState([
    {
      id: 'fol-1',
      name: '🚀 Топ Копирайтеры VIP',
      channelsCount: 6,
      estimatedCoverage: 32500,
      utmActive: true,
      category: 'SMM & Копирайтинг',
      channelsList: ['@durov_ai', '@SAV_AI', '@anna_traffic', '@dima_smm', '@iismm_helper', '@mariya_seo']
    },
    {
      id: 'fol-2',
      name: '📈 Трафик & Performance',
      channelsCount: 3,
      estimatedCoverage: 18000,
      utmActive: false,
      category: 'Performance Marketing',
      channelsList: ['@dima_smm', '@anna_traffic', '@SAV_AI']
    },
    {
      id: 'fol-3',
      name: '🔥 Кроспиар 10k+ Сетка',
      channelsCount: 4,
      estimatedCoverage: 24500,
      utmActive: true,
      category: 'Взаимный Пиар',
      channelsList: ['@durov_ai', '@anna_traffic', '@iismm_helper', '@dima_smm']
    }
  ]);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCategory, setNewFolderCategory] = useState('SMM & Копирайтинг');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    setTimeout(() => {
      const folder = {
        id: `fol-${Date.now()}`,
        name: newFolderName,
        channelsCount: Math.floor(Math.random() * 5) + 2,
        estimatedCoverage: (Math.floor(Math.random() * 15) + 5) * 1000,
        utmActive: true,
        category: newFolderCategory,
        channelsList: ['@my_partner_bot', '@smm_digest', '@iismm_helper']
      };

      setSavedFolders([...savedFolders, folder]);
      setNewFolderName('');
      setIsCreatingFolder(false);
      alert('Новая рекламная папка соавторства создана!');
    }, 800);
  };

  const toggleUtmOnFolder = (id: string) => {
    setSavedFolders(savedFolders.map(f => f.id === id ? { ...f, utmActive: !f.utmActive } : f));
  };

  // --- Coauthors/Friends Action Helpers ---
  const handleSendRequest = (id: string) => {
    setVirtualFriends(prev => prev.map(f => f.id === id ? { ...f, isPendingThem: true } : f));
    
    // Auto-accept request in 3 seconds to keep it dynamic and fun!
    setTimeout(() => {
      setVirtualFriends(prev => prev.map(f => {
        if (f.id === id && f.isPendingThem) {
          return { ...f, isFriend: true, isPendingThem: false };
        }
        return f;
      }));
    }, 3000);
  };

  const handleCancelRequest = (id: string) => {
    setVirtualFriends(prev => prev.map(f => f.id === id ? { ...f, isPendingThem: false } : f));
  };

  const handleAcceptProposal = (id: string) => {
    setVirtualFriends(prev => prev.map(f => f.id === id ? { ...f, isFriend: true, isPendingMe: false } : f));
  };

  const handleRemoveOrDecline = (id: string) => {
    setVirtualFriends(prev => prev.map(f => f.id === id ? { ...f, isFriend: false, isPendingMe: false, isPendingThem: false } : f));
  };


  // --- Original Feed Code logic ---
  // Active floating chat windows (Facebook-style persistent boxes)
  const [floatingChats, setFloatingChats] = useState<FloatingChat[]>([]);

  // Post Creator States
  const [inputText, setInputText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [attachedImage, setAttachedImage] = useState<string>('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [imagesError, setImagesError] = useState<string>('');
  const [chatAttachedImages, setChatAttachedImages] = useState<string[]>([]);
  const [chatAttachedImagesError, setChatAttachedImagesError] = useState<string>('');
  const [floatingAttachedImages, setFloatingAttachedImages] = useState<{ [friendId: string]: string[] }>({});
  const [floatingAttachedImagesError, setFloatingAttachedImagesError] = useState<{ [friendId: string]: string }>({});
  const [taggedFriendId, setTaggedFriendId] = useState<string>('');
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);

  // --- Coauthors (Friends) Page States ---
  const [coauthorActiveSubTab, setCoauthorActiveSubTab] = useState<'my' | 'incoming' | 'search'>('my');
  const [coauthorSearchText, setCoauthorSearchText] = useState('');
  const [feedFilterUser, setFeedFilterUser] = useState<VirtualFriend | null>(null);

  // Synchronize currentPath with the app states & sub-routes
  useEffect(() => {
    if (currentPath.includes('/social/messages/')) {
      const parts = currentPath.split('/social/messages/');
      const possibleIdOrUsername = parts[parts.length - 1];
      if (possibleIdOrUsername) {
        const pureQuery = possibleIdOrUsername.trim().toLowerCase();
        const found = virtualFriends.find(f => {
          const fid = f.id.toLowerCase();
          const fusername = f.username.toLowerCase().replace('@', '');
          return fid === pureQuery || fusername === pureQuery;
        });
        if (found) {
          setActiveChatFriendId(found.id);
        }
      }
    } else if (currentPath.includes('/social/feed/')) {
      const parts = currentPath.split('/social/feed/');
      const possibleIdOrUsername = parts[parts.length - 1];
      if (possibleIdOrUsername) {
        const pureQuery = possibleIdOrUsername.trim().toLowerCase();
        const found = virtualFriends.find(f => {
          const fid = f.id.toLowerCase();
          const fusername = f.username.toLowerCase().replace('@', '');
          return fid === pureQuery || fusername === pureQuery;
        });
        if (found) {
          setFeedFilterUser(found);
        } else {
          // Fallback if not found in virtualFriends database: represent as guest or temp author filter
          const rawName = possibleIdOrUsername.charAt(0).toUpperCase() + possibleIdOrUsername.slice(1);
          setFeedFilterUser({
            id: `temp-${possibleIdOrUsername}`,
            name: rawName,
            username: `@${possibleIdOrUsername}`,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
            status: 'offline',
            bio: 'Автор Сетки соавторов',
            isFriend: false
          });
        }
      }
    } else if (currentPath === '/social/feed' || currentPath === '/social/' || currentPath === '/social') {
      setFeedFilterUser(null);
    } else {
      const matchUserRoute = currentPath.match(/^\/social(?:(?:\/user\/|\/)?([0-9a-zA-Z_]+))?$/);
      if (matchUserRoute && matchUserRoute[1] && !['feed', 'messages', 'deals', 'coauthors', 'saved'].includes(matchUserRoute[1])) {
        const pureQuery = matchUserRoute[1].trim().toLowerCase();
        const currentUserId = String(user.id || '').toLowerCase();
        const currentTgId = String(user.telegramId || '').toLowerCase();
        const currentUsername = (user.telegramUsername || user.username || '').replace('@','').toLowerCase();

        if (pureQuery === currentUserId || pureQuery === currentTgId || (currentUsername && pureQuery === currentUsername)) {
          setFeedFilterUser({
            id: user.id || String(user.telegramId || '169262990'),
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Тимошенко Денис',
            username: user.telegramUsername || `@${user.username || 'shishkarnem'}`,
            avatar: user.userAvatar || (user as any).user_avatar || user.avatarUrl || user.photoUrl || '/api/avatar/169262990.png',
            status: 'online',
            bio: user.bio || 'Моя страница в Сетке Соавторов',
            isFriend: true
          });
        } else {
          const found = virtualFriends.find(f => {
            const fid = f.id.toLowerCase();
            const fusername = f.username.toLowerCase().replace('@', '');
            return fid === pureQuery || fusername === pureQuery;
          });
          if (found) {
            setFeedFilterUser(found);
          } else {
            setFeedFilterUser({
              id: pureQuery,
              name: `Профиль #${pureQuery}`,
              username: `@id${pureQuery}`,
              avatar: `/api/avatar/${pureQuery}.png`,
              status: 'online',
              bio: 'Участник Сетки Соавторов',
              isFriend: false
            });
          }
        }
      }
    }
  }, [currentPath, virtualFriends]);

  // Active hovering post ID for reaction bar
  const [hoveringPostId, setHoveringPostId] = useState<string | null>(null);

  // Temp comment states per post
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  // Gradients for text posts
  const postGradients = [
    'from-indigo-500 to-purple-600',
    'from-pink-500 via-red-500 to-yellow-500',
    'from-green-400 to-blue-500',
    'from-orange-400 to-pink-600',
    'from-slate-800 via-slate-900 to-black'
  ];

  // Mood options
  const moods = [
    { label: '😊 Счастлив(а)', value: 'счастлив(а)' },
    { label: '🚀 Запускает таргет', value: 'запускает таргет' },
    { label: '💡 Генерирует посты', value: 'генерирует посты' },
    { label: '🍕 Вкушает пиццу', value: 'вкушает пиццу' },
    { label: '🪙 Зарабатывает ИИрки', value: 'зарабатывает ИИрки' },
    { label: '⚡ Полн(а) сил', value: 'на амфе ИИ контента' }
  ];

  // Demo stock images for attachment quick selection
  const stockImages = [
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=500',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500'
  ];

  // Publish dynamic post
  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    let taggedNames: string[] = [];
    if (taggedFriendId) {
      const fr = virtualFriends.find(f => f.id === taggedFriendId);
      if (fr) taggedNames.push(fr.name);
    }

    const newPost: SocialPost = {
      id: `my-post-${Date.now()}`,
      author: {
        name: user.name,
        username: user.telegramUsername || '@user',
        avatar: user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        isVip: user.tariff === 'vip' || user.tariff === 'pro'
      },
      content: inputText,
      image: selectedGradient ? undefined : attachedImage || undefined,
      images: selectedGradient ? undefined : (attachedImages.length > 0 ? attachedImages : undefined),
      backgroundGradient: selectedGradient || undefined,
      feeling: selectedMood || undefined,
      taggedFriends: taggedNames.length > 0 ? taggedNames : undefined,
      createdAt: 'Только что',
      likes: { 'like': 1 },
      myReaction: 'like',
      comments: [],
      sharesCount: 0
    };

    setPosts([newPost, ...posts]);
    setInputText('');
    setSelectedGradient(null);
    setSelectedMood('');
    setAttachedImage('');
    setAttachedImages([]);
    setImagesError('');
    setTaggedFriendId('');
    setShowMoodDropdown(false);

    // Auto mock comments from virtual buddies
    setTimeout(() => {
      const commenter = virtualFriends[Math.floor(Math.random() * virtualFriends.length)];
      const templates = [
        'Вау, прекрасная мысль! Буду тестировать у себя.',
        'Лови мои ИИрки в виде лайка! 🪙 Полностью солидарен!',
        'Записал этот инсайд. Завтра запущу в рассылку бота!',
        'Круто! SMM комбайн выходит на новый галактический уровень!'
      ];
      const commentText = templates[Math.floor(Math.random() * templates.length)];

      setPosts(currentPosts => currentPosts.map(p => {
        if (p.id === newPost.id) {
          return {
            ...p,
            likes: { ...p.likes, 'love': 1, 'like': (p.likes['like'] || 0) + 1 },
            comments: [
              ...p.comments,
              {
                id: `rep-${Date.now()}`,
                author: commenter.name,
                avatar: commenter.avatar,
                text: commentText,
                createdAt: '1 мин. назад'
              }
            ]
          };
        }
        return p;
      }));
    }, 4000);
  };

  // Algorithmic interleaving helper for Feed (Popular - New - Own)
  const buildInterleavedFeed = (): SocialPost[] => {
    const ownPosts = posts.filter(p => 
      p.id.startsWith('my-post-') || 
      p.author.username === user.telegramUsername || 
      p.author.username === '@user'
    );
    
    const restPosts = posts.filter(p => !ownPosts.some(op => op.id === p.id));
    
    // Define popular as sorted by total reactions count desc
    const getReactionsCount = (p: SocialPost) => {
      return Object.values(p.likes).reduce<number>((acc, cur) => acc + (cur as number), 0);
    };
    const popularSorted = [...restPosts].sort((a, b) => getReactionsCount(b) - getReactionsCount(a));
    
    // Define new as sorted/retained by chronological order
    const newSorted = [...restPosts];
    
    const interleaved: SocialPost[] = [];
    const addedIds = new Set<string>();
    
    let popularIdx = 0;
    let newIdx = 0;
    let ownIdx = 0;
    
    let turn = 0; // 0 = popular, 1 = new, 2 = own
    
    while (addedIds.size < posts.length) {
      let addedInThisStep = false;
      
      if (turn === 0) {
        while (popularIdx < popularSorted.length) {
          const p = popularSorted[popularIdx++];
          if (!addedIds.has(p.id)) {
            interleaved.push(p);
            addedIds.add(p.id);
            addedInThisStep = true;
            break;
          }
        }
        turn = 1;
      } else if (turn === 1) {
        while (newIdx < newSorted.length) {
          const p = newSorted[newIdx++];
          if (!addedIds.has(p.id)) {
            interleaved.push(p);
            addedIds.add(p.id);
            addedInThisStep = true;
            break;
          }
        }
        turn = 2;
      } else if (turn === 2) {
        while (ownIdx < ownPosts.length) {
          const p = ownPosts[ownIdx++];
          if (!addedIds.has(p.id)) {
            interleaved.push(p);
            addedIds.add(p.id);
            addedInThisStep = true;
            break;
          }
        }
        turn = 0;
      }
      
      if (!addedInThisStep) {
        let fallbackSearchSuccess = false;
        for (let i = 0; i < 3; i++) {
          turn = (turn + 1) % 3;
          if (turn === 0) {
            while (popularIdx < popularSorted.length) {
              const p = popularSorted[popularIdx++];
              if (!addedIds.has(p.id)) {
                interleaved.push(p);
                addedIds.add(p.id);
                fallbackSearchSuccess = true;
                break;
              }
            }
          } else if (turn === 1) {
            while (newIdx < newSorted.length) {
              const p = newSorted[newIdx++];
              if (!addedIds.has(p.id)) {
                interleaved.push(p);
                addedIds.add(p.id);
                fallbackSearchSuccess = true;
                break;
              }
            }
          } else if (turn === 2) {
            while (ownIdx < ownPosts.length) {
              const p = ownPosts[ownIdx++];
              if (!addedIds.has(p.id)) {
                interleaved.push(p);
                addedIds.add(p.id);
                fallbackSearchSuccess = true;
                break;
              }
            }
          }
          if (fallbackSearchSuccess) break;
        }
        
        if (!fallbackSearchSuccess) {
          break;
        }
      }
    }
    
    return interleaved;
  };

  // Image upload handlers with strict image validation
  const handleFeedImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImagesError('');
    const files = e.target.files;
    if (!files) return;

    let containsInvalid = false;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        containsInvalid = true;
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedImages((prev) => {
            if (prev.length >= 10) {
              setImagesError('Максимум 10 картинок в альбоме!');
              return prev;
            }
            return [...prev, event.target!.result as string].slice(0, 10);
          });
        }
      };
      reader.readAsDataURL(file);
    }
    if (containsInvalid) {
      setImagesError('Только картинки! Файлы, видео и аудио файлы нельзя!');
    }
  };

  const handleChatImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatAttachedImagesError('');
    const files = e.target.files;
    if (!files) return;

    let containsInvalid = false;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        containsInvalid = true;
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setChatAttachedImages((prev) => {
            if (prev.length >= 10) {
              setChatAttachedImagesError('Максимум 10 картинок!');
              return prev;
            }
            return [...prev, event.target!.result as string].slice(0, 10);
          });
        }
      };
      reader.readAsDataURL(file);
    }
    if (containsInvalid) {
      setChatAttachedImagesError('Только картинки! Файлы, видео и аудио файлы нельзя!');
    }
  };

  const handleFloatingImagesChange = (friendId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setFloatingAttachedImagesError(prev => ({ ...prev, [friendId]: '' }));
    const files = e.target.files;
    if (!files) return;

    let containsInvalid = false;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        containsInvalid = true;
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFloatingAttachedImages(prev => {
            const list = prev[friendId] || [];
            if (list.length >= 10) {
              setFloatingAttachedImagesError(err => ({ ...err, [friendId]: 'Максимум 10 картинок!' }));
              return prev;
            }
            return {
              ...prev,
              [friendId]: [...list, event.target!.result as string].slice(0, 10)
            };
          });
        }
      };
      reader.readAsDataURL(file);
    }

    if (containsInvalid) {
      setFloatingAttachedImagesError(prev => ({ ...prev, [friendId]: 'Только картинки! Файлы, видео и аудио нельзя.' }));
    }
  };

  // Add comments live
  const handleAddComment = (postId: string, text: string) => {
    if (!text.trim()) return;

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `c-me-${Date.now()}`,
              author: user.name,
              avatar: user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
              text: text,
              createdAt: 'Только что'
            }
          ]
        };
      }
      return p;
    }));

    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  // Open Chat persistent box click
  const openChatWith = (friend: VirtualFriend) => {
    // Check if already open
    const openIndex = floatingChats.findIndex(c => c.friendId === friend.id);
    if (openIndex >= 0) {
      setFloatingChats(
        floatingChats.map((c, idx) => idx === openIndex ? { ...c, isMinimized: false } : c)
      );
      return;
    }

    // Limit to max 3 floating chats
    let currentChats = [...floatingChats];
    if (currentChats.length >= 3) {
      currentChats.shift(); // remove first
    }

    const initialMsgs = [
      { id: '1', sender: 'them' as const, text: `Привет! Как твои дела в SMM комбайне? Твои ИИрки копятся?`, time: '10:20' }
    ];

    setFloatingChats([
      ...currentChats,
      {
        friendId: friend.id,
        friendName: friend.name,
        friendAvatar: friend.avatar,
        messages: initialMsgs,
        isMinimized: false
      }
    ]);
  };

  // Send msg in floating box
  const sendFloatingMessage = (friendId: string, text: string) => {
    const attached = floatingAttachedImages[friendId] || [];
    if (!text.trim() && attached.length === 0) return;

    setFloatingChats(floatingChats.map(c => {
      if (c.friendId === friendId) {
        return {
          ...c,
          messages: [
            ...c.messages,
            {
              id: `m-f-${Date.now()}`,
              sender: 'me',
              text: text,
              time: 'Только что',
              images: attached.length > 0 ? attached : undefined
            }
          ]
        };
      }
      return c;
    }));

    // Clear attachments for this friendId
    setFloatingAttachedImages(prev => ({ ...prev, [friendId]: [] }));
    setFloatingAttachedImagesError(prev => ({ ...prev, [friendId]: '' }));

    // Simulated reply based on content
    setTimeout(() => {
      const answers = [
        'Потрясающий расклад! Я закину эти требования в нашу VIP папку продвижения 🤝',
        'Инструменты ИИSMM просто космос! Сэкономил кучу времени на копирайтинге.',
        'Держу кулачки за твою следующую подборку. Давай устроим взаимный пиар!',
        'Отправил тебе 50,000 ИИрок в качестве депонирования сделки.'
      ];
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

      setFloatingChats(currentChats => currentChats.map(chat => {
        if (chat.friendId === friendId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              {
                id: `m-rep-${Date.now()}`,
                sender: 'them',
                text: randomAnswer,
                time: 'Только что'
              }
            ]
          };
        }
        return chat;
      }));
    }, 1500);
  };

  // Accept Friend requests
  const handleAcceptFriendRequest = (id: string) => {
    setVirtualFriends(virtualFriends.map(f => {
      if (f.id === id) {
        return { ...f, isFriend: true, isPendingMe: false };
      }
      return f;
    }));
    alert('Вы приняли предложение дружбы и соавторства! Теперь можете переписываться.');
  };

  // Helper reaction symbol
  const getReactionSymbol = (type: string) => {
    switch (type) {
      case 'rainbow_heart': return <RainbowHeartIcon className="w-4.5 h-4.5 inline-block drop-shadow-xs" />;
      case 'like': return '👍';
      case 'love': return '❤️';
      case 'haha': return '😆';
      case 'wow': return '😮';
      case 'sad': return '😢';
      case 'angry': return '😡';
      case 'fire': return '🔥';
      default: return '👍';
    }
  };

  // Add Reaction Hover Popover Handler
  const handleReact = (postId: string, reactionType: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const reactions = { ...post.likes };
        
        // Remove previous reaction if same, or update
        if (post.myReaction) {
          reactions[post.myReaction] = Math.max(0, (reactions[post.myReaction] || 0) - 1);
        }

        reactions[reactionType] = (reactions[reactionType] || 0) + 1;

        return {
          ...post,
          likes: reactions,
          myReaction: reactionType
        };
      }
      return post;
    }));
    setHoveringPostId(null);
  };


  return (
    <div className="iirky-social-container min-h-screen bg-slate-50 font-sans text-slate-800 rounded-3xl overflow-hidden shadow-xl relative">
      
      {/* 3. Main Facebook Grid (Adapts based on layout active subpage) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-1 md:gap-6 p-1 md:p-5 items-start pb-24">
        
        {/* ================= CENTRAL & RIGHT CONTENT - ADAPTS ACCORDING TO SELECTED TAB ================= */}
        
        {/* VIEW 1: NEWS FEED */}
        {activeSocialTab === 'feed' && (
          <>
            <section className="col-span-12 lg:col-span-7 space-y-5">
              {/* Central Block: Write Post button for own profile only */}
              {(!currentPath.includes('/social/') || currentPath === '/social' || currentPath === '/social/feed' || (user && currentUser && (user.id === currentUser.id || String(user.telegramId) === String(currentUser.telegramId)))) && (
                <div className="iirky-card-block rounded-2xl p-5 text-left space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={currentUser?.avatarUrl || user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'} 
                        alt="Me" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-pink-200 shadow-sm shrink-0"
                      />
                      <div>
                        <h3 className="text-sm font-black text-slate-800">Создать новую публикацию</h3>
                        <p className="text-xs text-slate-500 font-medium">Перейдите в редактор постов для подготовки контента</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        window.history.pushState(null, '', '/posts');
                        window.dispatchEvent(new Event('popstate'));
                      }}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md border border-white/20 cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                      <Edit3 className="w-4 h-4 text-white" />
                      <span>Написать пост</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Filter Banner */}
              {feedFilterUser && (
                <div className="bg-gradient-to-r from-pink-500 via-orange-500 to-sky-400 p-0.5 rounded-2xl shadow-sm mb-5 text-left">
                  <div className="bg-white rounded-[14px] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={feedFilterUser.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-pink-500" alt="Filtered avatar" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-800 text-sm leading-none">{feedFilterUser.name}</span>
                          <span className="text-[10px] text-pink-600 font-mono font-bold px-1.5 py-0.5 rounded bg-pink-50">{feedFilterUser.username}</span>
                        </div>
                        <p className="text-[11px] text-slate-550 mt-1 font-bold">Вы просматриваете персональную ленту этого соавтора</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => {
                          const existingBuddy = virtualFriends.find(f => f.id === feedFilterUser.id || f.username === feedFilterUser.username);
                          const targetBuddy = existingBuddy || {
                            id: feedFilterUser.id,
                            name: feedFilterUser.name,
                            username: feedFilterUser.username,
                            avatar: feedFilterUser.avatar,
                            status: 'offline' as const,
                            bio: feedFilterUser.bio || 'Пользователь Сетки соавторов',
                            isFriend: true
                          };

                          if (!existingBuddy) {
                            setVirtualFriends(prev => [...prev, targetBuddy]);
                          }

                          openChatWith(targetBuddy);
                          setActiveChatFriendId(targetBuddy.id);
                          const identifier = targetBuddy.username ? targetBuddy.username.replace('@', '') : targetBuddy.id;
                          window.history.pushState(null, '', `/social/messages/${identifier}`);
                          window.dispatchEvent(new Event('popstate'));
                        }}
                        className="px-3.5 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-black rounded-xl cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 border border-pink-200"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Написать Соавтору</span>
                      </button>

                      <button 
                        onClick={() => {
                          setFeedFilterUser(null);
                          window.history.pushState(null, '', '/social/feed');
                          window.dispatchEvent(new Event('popstate'));
                        }}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer transition-colors shrink-0"
                      >
                        Показать все публикации
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Posts */}
              <div className="space-y-5">
                {(() => {
                  const postsToRender = feedFilterUser 
                    ? posts.filter(p => p.author.username === feedFilterUser.username)
                    : buildInterleavedFeed();

                  if (postsToRender.length === 0) {
                    return (
                      <div className="iirky-card-block p-10 text-center rounded-2xl text-slate-400 text-xs">
                        У этого соавтора пока нет опубликованных записей в Ленте.
                      </div>
                    );
                  }

                  return postsToRender.map((post) => {
                    const reactionIcons = Object.keys(post.likes).filter(k => post.likes[k] > 0);
                    const totalReactions = Object.values(post.likes).reduce<number>((acc, cur) => acc + (cur as number), 0);
                    const hasLiked = !!post.myReaction;

                  return (
                    <div key={post.id} className="iirky-card-block rounded-2xl p-5 pt-7 text-left space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
                      
                      {/* Post Header Info */}
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => {
                            const buddy = virtualFriends.find(f => f.username === post.author.username);
                            const identifier = post.author.username ? post.author.username.replace('@', '') : post.id;
                            if (buddy) {
                              setFeedFilterUser(buddy);
                            } else {
                              setFeedFilterUser({
                                id: `temp-${identifier}`,
                                name: post.author.name,
                                username: post.author.username,
                                avatar: post.author.avatar,
                                status: 'offline',
                                bio: 'Пользователь Сетки соавторов',
                                isFriend: false
                              });
                            }
                            window.history.pushState(null, '', `/social/feed/${identifier}`);
                            window.dispatchEvent(new Event('popstate'));
                          }}
                          title="Посмотреть персональную ленту соавтора"
                        >
                          <img src={post.author.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border group-hover:border-pink-500 transition-colors" />
                          <div className="text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-800 text-sm leading-none group-hover:text-pink-650 transition-colors">{post.author.name}</span>
                              {post.author.isVip && (
                                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                              )}
                              {post.feeling && (
                                <span className="text-xs text-slate-400 font-medium">чувствует себя <strong className="text-slate-600 font-bold">{post.feeling}</strong></span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5 font-bold">
                              <span className="group-hover:underline">{post.author.username}</span>
                              <span>•</span>
                              <span>{post.createdAt}</span>
                              <span>•</span>
                              <Globe className="w-3 h-3 text-slate-400" />
                            </div>
                          </div>
                        </div>

                        {post.taggedFriends && post.taggedFriends.length > 0 && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                            с {post.taggedFriends.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Content Section */}
                      {post.backgroundGradient ? (
                        <div className={`p-8 text-center text-white font-extrabold bg-gradient-to-r ${post.backgroundGradient} rounded-2xl text-base shadow-sm font-sans flex items-center justify-center leading-relaxed select-none min-h-[140px]`}>
                          {post.content}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-line px-1">
                          {post.content}
                        </p>
                      )}

                      {/* Attached visual */}
                      {post.image && (
                        <div className="rounded-2xl overflow-hidden border max-h-80 shadow-xs">
                          <img src={post.image} alt="Attachment" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Album Grid Support */}
                      {post.images && post.images.length > 0 && (
                        <AlbumGrid images={post.images} />
                      )}

                      {/* Counts row */}
                      <div className="flex items-center justify-between border-b pb-2 text-[11px] text-slate-400 font-bold">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center -space-x-1.5 pl-0.5">
                            {reactionIcons.map((recType, idx) => (
                              <span key={idx} className="w-5 h-5 rounded-full bg-white border flex items-center justify-center text-[11px] shadow-xs">
                                {getReactionSymbol(recType)}
                              </span>
                            ))}
                          </div>
                          <span>{totalReactions} соавторов оценили</span>
                        </div>
                        <div className="flex gap-2 text-[10px]">
                          <span>{post.comments.length} комм.</span>
                          <span>•</span>
                          <span>{post.sharesCount} репостов</span>
                        </div>
                      </div>

                      {/* Action buttons row with icon-only controls and informative popover windows */}
                      <div className="flex items-center justify-around py-1.5 px-2 bg-slate-50/70 rounded-2xl border border-slate-100/90 relative">
                        {/* 1. Respect Icon (React) */}
                        <div 
                          className="relative group flex-1 flex justify-center"
                          onMouseEnter={() => setHoveringPostId(post.id)}
                          onMouseLeave={() => setHoveringPostId(null)}
                        >
                          <button 
                            type="button"
                            onClick={() => handleReact(post.id, 'like')}
                            className={`p-2 hover:bg-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                              hasLiked ? 'bg-pink-50 text-pink-600 scale-105' : 'text-slate-600'
                            }`}
                            title="Респект (Наведите или нажмите для реакций)"
                          >
                            {post.myReaction ? (
                              <span className="text-base">{getReactionSymbol(post.myReaction)}</span>
                            ) : (
                              <ThumbsUp className="w-4.5 h-4.5 text-sky-500" />
                            )}
                            <span className="text-[10px] font-black text-slate-700 font-mono">{totalReactions}</span>
                          </button>

                          {/* Info popover + reactions window */}
                          <AnimatePresence>
                            {hoveringPostId === post.id && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: -50, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-pink-100 space-y-1.5 min-w-[220px]"
                              >
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider text-center border-b pb-1">
                                  👍 Респект автора (Инфо-окно)
                                </div>
                                <div className="flex justify-center gap-1.5 items-center">
                                  {[
                                    { type: 'rainbow_heart', isCustom: true, label: 'Радужное Сердечко ❤️ (Премиум)' },
                                    { type: 'like', icon: '👍', label: 'Красава' },
                                    { type: 'love', icon: '❤️', label: 'Обожаю' },
                                    { type: 'fire', icon: '🔥', label: 'Огонь' },
                                    { type: 'haha', icon: '😆', label: 'Жара' },
                                    { type: 'wow', icon: '😮', label: 'Шок' }
                                  ].map(rec => (
                                    <button
                                      key={rec.type}
                                      type="button"
                                      onClick={() => handleReact(post.id, rec.type)}
                                      className="transform hover:scale-130 active:scale-95 transition-transform duration-100 p-1 rounded-lg hover:bg-pink-50 cursor-pointer"
                                      title={rec.label}
                                    >
                                      {rec.isCustom ? (
                                        <RainbowHeartIcon className="w-5 h-5 animate-pulse" />
                                      ) : (
                                        <span className="text-lg block">{rec.icon}</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* 2. Discuss Icon (Comments) */}
                        <div className="relative group flex-1 flex justify-center">
                          <button 
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(`cmt-full-${post.id}`);
                              if (el) {
                                el.focus();
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            className="p-2 hover:bg-white text-slate-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Обсудить (Комментарии)"
                          >
                            <MessageCircle className="w-4.5 h-4.5 text-orange-500" />
                            <span className="text-[10px] font-black text-slate-700 font-mono">{post.comments.length}</span>
                          </button>

                          {/* Info popover tooltip */}
                          <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none">
                            <div className="bg-slate-900/90 text-white text-[10px] font-bold py-1 px-2.5 rounded-xl shadow-lg whitespace-nowrap border border-slate-700">
                              💬 Обсудить — открыть поле комментариев
                            </div>
                            <div className="w-2 h-2 bg-slate-900/90 rotate-45 -mt-1" />
                          </div>
                        </div>

                        {/* 3. Repost Icon (Share) */}
                        <div className="relative group flex-1 flex justify-center">
                          <button 
                            type="button"
                            onClick={() => {
                              setPosts(posts.map(p => p.id === post.id ? { ...p, sharesCount: p.sharesCount + 1 } : p));
                              alert(`📢 Публикация от ${post.author.name} успешно репостнута во все ваши SMM-каналы Сетки! Начислено +150 органических просмотров по вашей UTM-структуре. 🚀`);
                            }}
                            className="p-2 hover:bg-white text-slate-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Репостнуть (Авто-кросспостинг)"
                          >
                            <Share2 className="w-4.5 h-4.5 text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-700 font-mono">{post.sharesCount}</span>
                          </button>

                          {/* Info popover tooltip */}
                          <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none">
                            <div className="bg-slate-900/90 text-white text-[10px] font-bold py-1 px-2.5 rounded-xl shadow-lg whitespace-nowrap border border-slate-700">
                              📢 Репостнуть в SMM-каналы (+150 просмотров)
                            </div>
                            <div className="w-2 h-2 bg-slate-900/90 rotate-45 -mt-1" />
                          </div>
                        </div>
                      </div>

                      {/* Comments list box */}
                      <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        {post.comments.length > 0 && (
                          <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar pt-1">
                            {post.comments.map(comm => (
                              <div key={comm.id} className="flex gap-2.5 text-xs text-left leading-normal">
                                <img src={comm.avatar} alt="Author" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border" />
                                <div className="flex-1 bg-white p-2.5 rounded-xl shadow-2xs border">
                                  <div className="flex justify-between items-baseline mb-0.5">
                                    <span className="font-extrabold text-[11px] text-pink-650">{comm.author}</span>
                                    <span className="text-[8px] text-slate-400 font-mono">{comm.createdAt}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-650 font-semibold leading-relaxed">{comm.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Comment Input */}
                        <div className="flex gap-2">
                          <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'} alt="Avatar" className="w-7 h-7 rounded-full object-cover shrink-0 border" />
                          <div className="flex-1 flex gap-2">
                            <input 
                              id={`cmt-full-${post.id}`}
                              type="text"
                              placeholder="Ваш профессиональный комментарий..."
                              className="flex-1 bg-white border border-slate-200 px-3.5 py-1.5 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-300"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(post.id, commentInputs[post.id] || '');
                                }
                              }}
                            />
                            <button 
                              type="button"
                              onClick={() => handleAddComment(post.id, commentInputs[post.id] || '')}
                              className="p-2 iirky-social-bg-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
                            >
                              <SendHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                });
              })()}
              </div>
            </section>

            {/* RIGHT SIDEBAR WITH ADVERTS AND REQUESTS */}
            <aside className="col-span-12 lg:col-span-5 space-y-5 text-left">
              {/* Partner Offers Column */}
              <div className="iirky-card-block p-4 pt-5 rounded-2xl space-y-3.5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
                <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Сетка Реклама:</span>
                <div className="space-y-3 text-xs">
                  <a href="#" className="block hover:bg-slate-50 p-2 rounded-xl border border-transparent hover:border-slate-100 transition-all flex gap-3 text-slate-700">
                    <img 
                      src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=150" 
                      alt="Ads" 
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border"
                    />
                    <div>
                      <h4 className="font-extrabold text-[11px] text-slate-900 line-clamp-1">🪙 ИИрка Кэшбэк: До 50% прибыли</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">Получайте автоматический возврат по UTM интеграциям за коины.</p>
                    </div>
                  </a>

                  <a href="#" className="block hover:bg-slate-50 p-2 rounded-xl border border-transparent hover:border-slate-100 transition-all flex gap-3 text-slate-700">
                    <img 
                      src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=150" 
                      alt="Ads" 
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border"
                    />
                    <div>
                      <h4 className="font-extrabold text-[11px] text-pink-650 line-clamp-1">👾 Botmother SMM Билдер</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">Автоматический конструктор воронки продаж и автовебинаров.</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Online list */}
              <div className="iirky-card-block p-4 pt-5 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
                <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase block text-left">Сейчас Онлайн ({virtualFriends.filter(f => f.isFriend).length}):</span>
                <div className="space-y-2">
                  {virtualFriends.filter(f => f.isFriend).map(friend => (
                    <div
                      key={friend.id}
                      className="p-2.5 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100/90 rounded-2xl flex items-center gap-2.5 text-left transition-all shadow-2xs"
                    >
                      <div className="relative shrink-0">
                        <img src={friend.avatar} alt={friend.name} className="w-9 h-9 rounded-full object-cover border border-white shadow-2xs" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="truncate text-xs font-extrabold text-slate-800 block leading-tight">{friend.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChatFriendId(friend.id);
                            const identifier = friend.username ? friend.username.replace('@', '') : friend.id;
                            window.history.pushState(null, '', `/social/messages/${identifier}`);
                            window.dispatchEvent(new Event('popstate'));
                          }}
                          className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Написать</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </>
        )}

        {/* VIEW 2: DEDICATED MESSAGES PAGE (TAKES FULL WIDTH FOR SPACE AND COMFORT) */}
        {activeSocialTab === 'messages' && (
          <section className="col-span-12 lg:col-span-12 grid grid-cols-1 md:grid-cols-3 rounded-2xl overflow-hidden h-[calc(100vh-80px)] min-h-[680px] relative iirky-card-block bg-white w-full flex-1 mb-2">
            <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient shrink-0" />
            
            {/* Left Col: Contact Selectors list */}
            <div className="col-span-1 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full overflow-hidden">
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b bg-white space-y-3 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Поиск соавторов..." 
                      value={messageSearchText}
                      onChange={(e) => setMessageSearchText(e.target.value)}
                      className="w-full bg-slate-100 border-none pl-9 pr-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-pink-300 transition-shadow"
                    />
                  </div>

                  {/* Chat Sub-Tab selection bar */}
                  <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { value: 'all', label: 'Все' },
                      { value: 'group', label: 'Группы' },
                      { value: 'personal', label: 'Личные' },
                      { value: 'unread', label: 'Новые', count: unreadChatIds.length }
                    ].map((tabObj) => (
                      <button
                        key={tabObj.value}
                        onClick={() => setMessagesSubTab(tabObj.value as any)}
                        className={`px-2.5 py-1 text-[9px] uppercase font-black tracking-wider rounded-lg border transition-all cursor-pointer shrink-0 ${
                          messagesSubTab === tabObj.value
                            ? 'bg-pink-100 hover:bg-pink-150 text-pink-700 border-pink-200'
                            : 'bg-white hover:bg-slate-50 text-slate-555 border-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <span>{tabObj.label}</span>
                          {tabObj.count !== undefined && tabObj.count > 0 && (
                            <span className="bg-pink-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-mono font-bold animate-pulse leading-none">
                              {tabObj.count}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 flex-1 min-h-0 overflow-y-auto no-scrollbar">
                  {(() => {
                    const filtered = virtualFriends.filter((buddy) => {
                      // 1. Text filter
                      if (messageSearchText.trim()) {
                        const q = messageSearchText.toLowerCase();
                        if (
                          !buddy.name.toLowerCase().includes(q) &&
                          !buddy.username.toLowerCase().includes(q)
                        ) {
                          return false;
                        }
                      }
                      
                      // 2. Tab filter
                      if (messagesSubTab === 'group') {
                        return buddy.id === 'group-smm';
                      }
                      if (messagesSubTab === 'personal') {
                        return buddy.id !== 'group-smm';
                      }
                      if (messagesSubTab === 'unread') {
                        return unreadChatIds.includes(buddy.id);
                      }
                      return true; // 'all'
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-white/50 border border-dashed rounded-xl m-3">
                          Активных чатов не найдено
                        </div>
                      );
                    }

                    return filtered.map((buddy) => {
                      const isSelected = activeChatFriendId === buddy.id;
                      const isUnread = unreadChatIds.includes(buddy.id);
                      const history = chatHistories[buddy.id] || [];
                      const lastMsgText = history.length > 0 ? history[history.length - 1].text : buddy.bio;

                      return (
                        <button
                          key={buddy.id}
                          onClick={() => setActiveChatFriendId(buddy.id)}
                          className={`w-full p-3.5 text-left flex gap-3 transition-colors cursor-pointer select-none items-center relative ${
                            isSelected ? 'bg-pink-50/60 border-l-4 border-pink-500' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <img src={buddy.avatar} alt="Buddy photo" className="w-10 h-10 rounded-full object-cover border" />
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                              buddy.status === 'online' ? 'bg-emerald-500' : 'bg-slate-350'
                            }`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <span className={`text-xs truncate block ${isUnread ? 'font-black text-pink-650' : 'font-extrabold text-slate-800'}`}>
                                {buddy.name}
                              </span>
                              <span className="text-[8px] text-slate-400 font-mono shrink-0">11:15</span>
                            </div>
                            <p className={`text-[10px] truncate leading-normal ${isUnread ? 'font-bold text-slate-705' : 'text-slate-400'}`}>
                              {lastMsgText}
                            </p>
                          </div>

                          {isUnread && (
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Right Cols: Complete Active Chat Area */}
            <div className="col-span-1 md:col-span-2 flex flex-col h-full bg-slate-50/50 overflow-hidden">
              {/* Active Chat Header */}
              {(() => {
                const currentBuddy = virtualFriends.find(f => f.id === activeChatFriendId) || virtualFriends[0];
                return (
                  <>
                    <div className="p-3.5 bg-white border-b flex items-center justify-between shadow-xs shrink-0">
                      <div className="flex items-center gap-3">
                        <img src={currentBuddy.avatar} alt="Buddy Avatar" className="w-9 h-9 rounded-full object-cover border" />
                        <div className="text-left">
                          <span className="font-extrabold text-xs text-slate-800 block leading-tight">{currentBuddy.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold">{currentBuddy.username} • {currentBuddy.status === 'online' ? 'В сети' : 'Не в сети'}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => setShowAutoReplyModal(true)}
                          className="px-3 py-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 hover:opacity-95 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md border border-white/20 transition-all cursor-pointer active:scale-95 shrink-0"
                          title="Настройки ИИ-Автоответчика ProTalk API"
                        >
                          <Bot className="w-4 h-4 text-white animate-pulse" />
                          <span className="hidden sm:inline">ИИ-Автоответчик</span>
                        </button>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 min-h-0 pt-1 px-4 pb-4 overflow-y-auto space-y-3.5">
                      {(chatHistories[activeChatFriendId] || []).map((msg) => {
                        const isMe = msg.sender === 'me';
                        return (
                          <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto text-left items-start'}`}>
                            {!isMe && msg.senderName && (
                              <span className="text-[9px] font-mono font-black text-pink-600 mb-0.5">{msg.senderName}</span>
                            )}
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                const clickX = Math.min(e.clientX, window.innerWidth - 300);
                                const clickY = Math.min(e.clientY, window.innerHeight - 300);
                                setMsgClickPos({ x: Math.max(10, clickX), y: Math.max(10, clickY) });
                                setSelectedMessageForAction(msg);
                              }}
                              className={`p-3 rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform duration-100 select-none relative ${
                                isMe 
                                  ? 'msg-bubble-sent text-slate-800 rounded-tr-none shadow-md' 
                                  : 'msg-bubble-received text-slate-800 rounded-tl-none shadow-sm'
                              }`}
                              title="Кликните, чтобы выбрать реакции или действие"
                            >
                              {/* Replied to section */}
                              {msg.replyTo && (
                                <div className="mb-2 p-2.5 rounded-xl bg-pink-100/80 border-l-4 border-pink-500 text-[10.5px] leading-snug text-slate-800 italic max-w-full">
                                  <span className="font-extrabold text-[9.5px] text-pink-700 block not-italic uppercase tracking-wider mb-0.5">
                                    ОТВЕТ ДЛЯ {(msg.replyTo.senderName || 'ВЫ').toUpperCase()}:
                                  </span>
                                  <span className="text-slate-700 font-medium italic block whitespace-pre-wrap">{msg.replyTo.text}</span>
                                </div>
                              )}

                              {msg.text && msg.mediaType !== 'voice' && (
                                <p className="text-[11px] font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              )}
                              
                              {/* Attached chat images album list */}
                              {msg.images && msg.images.length > 0 && (
                                <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg overflow-hidden border border-black/10">
                                  {msg.images.map((img, i) => (
                                    <div 
                                      key={i} 
                                      className="aspect-video relative overflow-hidden bg-slate-100 cursor-zoom-in"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenImagePreview(img, msg.images);
                                      }}
                                    >
                                      <img src={img} className="w-full h-full object-cover" alt="Chat attachment detail" />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Protalk media attachments rendering */}
                              {msg.mediaUrl && (
                                <div className="mt-1.5">
                                  {msg.mediaType === 'photo' && (
                                    <img src={msg.mediaUrl} className="max-w-xs rounded-xl border object-cover" alt="Protalk photo" />
                                  )}
                                  {msg.mediaType === 'video' && (
                                    <video src={msg.mediaUrl} controls className="max-w-xs rounded-xl border" />
                                  )}
                                  {msg.mediaType === 'voice' && (
                                    <VoiceMessagePlayer 
                                      audioUrl={msg.mediaUrl} 
                                      initialText={msg.text} 
                                      sender={msg.sender} 
                                      onTextUpdated={(newText) => {
                                        setChatHistories(prev => ({
                                          ...prev,
                                          [activeChatFriendId]: (prev[activeChatFriendId] || []).map(m => m.id === msg.id ? { ...m, text: newText } : m)
                                        }));
                                      }}
                                    />
                                  )}
                                  {msg.mediaType === 'file' && (
                                    <a href={msg.mediaUrl} download className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-xl font-bold text-xs hover:bg-pink-100 transition-colors">
                                      📁 Скачать документ / медиа
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Attached Message Reactions rendering */}
                              {(msg as any).reactions && (msg as any).reactions.length > 0 && (
                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                  {(msg as any).reactions.map((r: string, idx: number) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-white/90 border border-pink-200 rounded-full text-[10px] shadow-2xs flex items-center gap-1">
                                      {getReactionSymbol(r)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="text-[8px] opacity-70 text-right mt-1 font-mono font-bold">{msg.time}</div>
                            </div>
                          </div>
                        );
                      })}

                      {isTyping && (
                        <div className="flex mr-auto items-center gap-2 text-slate-400 text-xs font-bold font-mono">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-500" />
                          <span>Соавтор печатает ИИ-ответ...</span>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input form with Image attachments */}
                    <div className="border-t border-pink-100 bg-white p-3 text-left shrink-0 w-full mt-auto">
                      {replyingToMessage && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-pink-50 to-sky-50 border-l-4 border-pink-500 p-2 text-[10px] rounded-lg mb-2">
                          <div className="min-w-0">
                            <span className="font-extrabold text-pink-700 block text-[9px] uppercase">Ответ на сообщение ({replyingToMessage.senderName || 'соавтор'}):</span>
                            <p className="text-slate-600 truncate font-semibold">{replyingToMessage.text}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setReplyingToMessage(null)}
                            className="text-slate-405 hover:text-pink-600 font-extrabold text-base px-2 shrink-0 leading-none cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      )}

                      {/* Chat attached images previews */}
                      {chatAttachedImages.length > 0 && (
                        <div className="flex gap-2 p-1.5 overflow-x-auto no-scrollbar max-h-16 mb-2 border-b">
                          {chatAttachedImages.map((img, idx) => (
                            <div key={idx} className="relative w-11 h-11 rounded-lg overflow-hidden border group shrink-0">
                              <img src={img} className="w-full h-full object-cover" alt="Selected attachment thumbnail" />
                              <button 
                                type="button" 
                                onClick={() => setChatAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {chatAttachedImagesError && (
                        <p className="text-[10px] text-red-500 font-bold mb-1.5 px-1">{chatAttachedImagesError}</p>
                      )}

                      {/* Protalk Loader Progress Indicator */}
                      {protalkMediaFile && (
                        <div className="p-2 mb-2 bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 border border-pink-200 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-pink-600 font-black">⚡ Protalk Loader:</span>
                            <span className="font-semibold text-slate-700 truncate max-w-[140px]">{protalkMediaFile.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">({protalkMediaFile.progress}%)</span>
                          </div>
                          {protalkMediaFile.isUploading ? (
                            <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden shrink-0">
                              <div className="bg-gradient-to-r from-sky-400 to-pink-500 h-full transition-all duration-150" style={{ width: `${protalkMediaFile.progress}%` }} />
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => setProtalkMediaFile(null)}
                              className="text-rose-500 hover:text-rose-700 font-bold text-sm px-1 cursor-pointer shrink-0"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )}

                      <form onSubmit={handleSendFullChatMessage} className="flex gap-2 items-center">
                        {/* Custom visual attachment button */}
                        <label id="upload-chat-images-btn" title="Загрузить фото" className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl hover:border-pink-400 hover:text-pink-600 transition-colors cursor-pointer shrink-0">
                          <Image className="w-4 h-4" />
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            onChange={handleChatImagesChange} 
                            className="hidden" 
                          />
                        </label>

                        {/* Protalk Media File Upload Button (Photos, Videos, Voice, Docs) */}
                        <label id="upload-protalk-media-btn" title="Загрузить медиа/файл через Protalk Loader" className="p-2.5 bg-pink-50 border border-pink-200 text-pink-600 rounded-xl hover:bg-pink-100 transition-colors cursor-pointer shrink-0">
                          <Paperclip className="w-4 h-4" />
                          <input 
                            type="file" 
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt" 
                            onChange={handleProtalkFileSelect} 
                            className="hidden" 
                          />
                        </label>

                        <input 
                          type="text"
                          placeholder={`Написать личное сообщение ${currentBuddy.name}...`}
                          value={currentMessageInputText}
                          onChange={(e) => setCurrentMessageInputText(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-205 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pink-300 font-semibold"
                        />

                        {/* Voice recording button (AI STT) */}
                        <button 
                          type="button"
                          onClick={() => setIsVoiceModalOpen(true)}
                          title="Записать голосовое сообщение (ИИ-Распознавание)"
                          className="p-2.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-xl hover:opacity-95 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-2xs active:scale-95"
                        >
                          <Mic className="w-4 h-4 text-white" />
                        </button>

                        <button 
                          type="submit"
                          className="p-2.5 iirky-social-bg-gradient text-white rounded-xl hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center shrink-0"
                        >
                          <SendHorizontal className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </>
                );
              })()}
            </div>
          </section>
        )}

        {/* VIEW 3: DEDICATED ESCROW & DEALS PAGE */}
        {activeSocialTab === 'deals' && (
          <section className="col-span-12 lg:col-span-12 space-y-6 text-left">
            
            {/* Module Banner: В разработке и соцсети */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-50 via-pink-50 via-orange-50 to-sky-50 border border-pink-200/80 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider mb-2 shadow-xs">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>🚧 В разработке и соцсети</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Модуль "В разработке и соцсети"</h2>
                  <p className="text-xs text-slate-600 font-medium mt-1 max-w-2xl leading-relaxed">
                    Здесь разрабатываются новые автономные интеграции с соцсетями (Telegram, ВК, YouTube, TenChat), совместный смарт-кросспостинг и партнерские соглашения.
                  </p>
                </div>
                <div className="shrink-0 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-pink-200/80 shadow-2xs text-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase block">Статус модуля</span>
                  <span className="text-xs font-black text-emerald-600 flex items-center justify-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Активное тестирование
                  </span>
                </div>
              </div>
            </div>

            {/* Create secure deal block */}
            <div className="iirky-card-block rounded-2xl p-5 pt-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-1 bg-gradient-to-r from-orange-600 to-pink-650 bg-clip-text text-transparent">
                <Shield className="w-5 h-5 text-orange-500 animate-pulse" />
                <span>Офис взаимных интеграций и соглашений Синдиката</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mb-4">
                Заполните форму, чтобы заблокировать монеты ИИрки 🪙 под выполнение рекламного обязательства. Деньги поступят исполнителю только после вашего подтверждения!
              </p>

              <form onSubmit={handleCreateEscrowDeal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Название соглашения / Цель:</label>
                    <input 
                      type="text"
                      placeholder="Например: Пин папки на канале @target_digest"
                      className="w-full bg-slate-50 border px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                      value={newDealTitle}
                      onChange={(e) => setNewDealTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Сумма вознаграждения ИИрок (🪙):</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs">🪙</span>
                      <input 
                        type="number"
                        placeholder="50000"
                        className="w-full bg-slate-50 border pl-8 pr-3 py-2 rounded-xl text-xs font-mono font-bold text-orange-655 focus:outline-none"
                        value={newDealAmount}
                        onChange={(e) => setNewDealAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Исполнитель проекта:</label>
                    <select 
                      className="w-full bg-slate-50 border px-3 py-2 rounded-xl text-xs font-bold focus:outline-none"
                      value={newDealBuddyId}
                      onChange={(e) => setNewDealBuddyId(e.target.value)}
                    >
                      {virtualFriends.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.username})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Подробные условия сделки (Что должен сделать соавтор):</label>
                    <textarea 
                      rows={4}
                      placeholder="Опишите обязательства, сроки и необходимый UTM-трекинг..."
                      className="w-full bg-slate-50 border p-3 rounded-xl text-xs font-medium focus:outline-none"
                      value={newDealDesc}
                      onChange={(e) => setNewDealDesc(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingDeal}
                    className="w-full iirky-social-bg-gradient hover:opacity-90 text-white font-black text-xs py-3 rounded-xl uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition-opacity"
                  >
                    {isSubmittingDeal ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Регистрация контракта...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-orange-200" />
                        <span>Депонировать ИИрки и открыть сделку</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Arbitration Live Panel (Mock Modal built inline) */}
            {arbitrationDealId && (
              <div className="bg-gradient-to-b from-slate-905 to-slate-950 text-white rounded-2xl p-5 border-2 border-orange-500 shadow-xl space-y-3.5 relative">
                <button 
                  onClick={() => setArbitrationDealId(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold"
                >
                  &times; Close
                </button>
                <div className="flex gap-2 items-center">
                  <Star className="w-5 h-5 text-yellow-300 animate-pulse animate-spin-slow" />
                  <h3 className="font-black text-sm uppercase text-orange-405">Заседание ИИ-Арбитража Сетки</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl font-mono text-[11px] leading-relaxed max-h-44 overflow-y-auto no-scrollbar space-y-1 text-slate-300">
                  {arbitrationLog.map((log, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <span className="text-orange-500">&gt;&gt;</span>
                      <p>{log}</p>
                    </div>
                  ))}
                </div>

                {arbitrationVerdict ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4.5 rounded-xl text-xs space-y-1.5 text-left">
                    <p className="font-extrabold text-emerald-400 uppercase tracking-wider text-[10px]">⚖️ Вердикт арбитра получен:</p>
                    <p className="text-slate-100 italic leading-relaxed">"{arbitrationVerdict}"</p>
                    <span className="text-[9px] text-slate-400 block font-bold">Решение окончательное и обжалованию в союзе не подлежит.</span>
                  </div>
                ) : (
                  <div className="text-center font-mono text-xs text-orange-300 animate-pulse">
                    Павел Дуров выносит решение...
                  </div>
                )}
              </div>
            )}

            {/* Existing Active Deals list */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">Мои активные сделки:</h3>
              
              {escrowDeals.length === 0 ? (
                <div className="iirky-card-block p-8 rounded-2xl text-center text-slate-400 text-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
                  У вас пока нет зарегистрированных сделок в Сетке.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {escrowDeals.map((deal) => {
                    const isFunded = deal.status === 'funded';
                    const isCompleted = deal.status === 'completed';
                    const isRefunded = deal.status === 'refunded';
                    const isDisputed = deal.status === 'disputed';

                    return (
                      <div key={deal.id} className="iirky-card-block rounded-2xl p-4 pt-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
                        <div className="space-y-2 text-xs">
                          {/* Top Status */}
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-bold">{deal.date}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              isFunded ? 'bg-orange-100 text-orange-850 border border-orange-200' :
                              isCompleted ? 'bg-emerald-100 text-emerald-800' : 
                              isRefunded ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                            }`}>
                              {isFunded ? '🪙 Выполнено & Депонировано' :
                               isCompleted ? '✔️ Исполнено & Выплачено' :
                               isRefunded ? '↩️ Возвращено заказчику' : '⚖️ Арбитраж Сетки'}
                            </span>
                          </div>

                          <h4 className="font-black text-slate-800 leading-tight text-[13px]">{deal.title}</h4>
                          <p className="text-[11px] text-slate-500 leading-normal">{deal.description}</p>

                          {/* Buddy row */}
                          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                            <img src={deal.partnerAvatar} alt="Partner" className="w-6.5 h-6.5 rounded-full object-cover border" />
                            <div className="text-[10px]">
                              <span className="font-extrabold text-slate-700 block leading-tight">{deal.partnerName}</span>
                              <span className="text-slate-400 font-mono tracking-wider">Соавтор сделки</span>
                            </div>
                            <div className="ml-auto font-mono text-xs font-black text-orange-605">
                              {deal.amount.toLocaleString()} 🪙
                            </div>
                          </div>

                          {/* Collapsable Action logs history */}
                          <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 font-mono text-[9px] text-slate-400 leading-relaxed">
                            <span className="font-bold text-slate-500 uppercase block text-[8px] tracking-wider mb-0.5">История логов:</span>
                            {deal.logs.map((log, i) => (
                              <div key={i} className="flex gap-1">
                                <span className="text-pink-500">•</span>
                                <p>{log}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions available only on pending funded deal */}
                        {isFunded && (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button 
                              onClick={() => handleReleaseEscrowFunds(deal.id)}
                              className="py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] rounded-xl uppercase cursor-pointer text-center"
                            >
                              Выплатить ИИрки
                            </button>
                            <button 
                              onClick={() => handleRequestArbitration(deal.id)}
                              className="py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[10px] rounded-xl uppercase cursor-pointer text-center"
                            >
                              ИИ-Арбитраж (Паша)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </section>
        )}

        {/* VIEW 4: COAUTHORS / FRIENDS FLOW PAGE */}
        {activeSocialTab === 'coauthors' && (
          <section className="col-span-12 lg:col-span-12 space-y-6 text-left">
            
            {/* Direct Tipping Modal inside tab */}
            {tippingBuddyId && (
              <div className="iirky-card-block p-5 pt-7 rounded-2xl relative overflow-hidden space-y-4">
                <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-xs uppercase text-slate-800 flex items-center gap-1">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span>Поощрить соавтора ИИрками напрямую</span>
                  </h3>
                  <button onClick={() => setTippingBuddyId(null)} className="text-slate-400 font-bold">&times; Close</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold">Кому перевод:</p>
                    <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border">
                      <img 
                        src={virtualFriends.find(f => f.id === tippingBuddyId)?.avatar} 
                        className="w-8 h-8 rounded-full object-cover" 
                        alt="Receiver" 
                      />
                      <div>
                        <span className="font-black block">{virtualFriends.find(f => f.id === tippingBuddyId)?.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{virtualFriends.find(f => f.id === tippingBuddyId)?.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-extrabold">Количество 🪙 ИИрок:</p>
                    <input 
                      type="number"
                      value={tipQuantityInput}
                      onChange={(e) => setTipQuantityInput(e.target.value)}
                      className="w-full bg-slate-50 border px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-orange-600 focus:outline-none"
                    />
                  </div>
                </div>

                {tipResponse ? (
                  <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs font-semibold">
                    {tipResponse}
                  </div>
                ) : (
                  <button 
                    onClick={handleSendTip}
                    disabled={isSendingTip}
                    className="w-full py-2.5 iirky-social-bg-gradient text-white text-xs font-black uppercase rounded-xl tracking-wider select-none shadow-md cursor-pointer transition-opacity"
                  >
                    {isSendingTip ? 'Передаем в блокчейне Сетки...' : 'Перевести монеты'}
                  </button>
                )}
              </div>
            )}

            {/* Main Friends Panel */}
            <div className="iirky-card-block rounded-2xl p-5 pt-7 relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider bg-gradient-to-r from-pink-500 through-orange-500 to-sky-400 bg-clip-text text-transparent">
                    👥 Соавторы & Партнеры Сетки
                  </h2>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                    Управление вашим профессиональным содружеством. Ищите соавторов, обменивайтесь заявками и читайте их ленты.
                  </p>
                </div>
              </div>

              {/* Sub-tab Selection bar */}
              <div className="flex border-b border-slate-100 pb-px gap-1 bg-slate-50 p-1.5 rounded-xl border">
                {[
                  { value: 'my', label: 'Мои Соавторы', count: virtualFriends.filter(f => f.isFriend && f.id !== 'group-smm').length, color: 'text-sky-600 bg-sky-50' },
                  { value: 'incoming', label: 'Входящие предложения', count: virtualFriends.filter(f => f.isPendingMe && !f.isFriend).length, alertPulse: virtualFriends.some(f => f.isPendingMe && !f.isFriend), color: 'text-pink-600 bg-pink-50 animate-pulse-subtle' },
                  { value: 'search', label: 'Найти соавторов', count: null, color: 'text-orange-600 bg-orange-50' }
                ].map((st) => (
                  <button 
                    key={st.value}
                    onClick={() => {
                      setCoauthorActiveSubTab(st.value as any);
                      setCoauthorSearchText('');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 sm:px-2 text-[10px] sm:text-[11px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                      coauthorActiveSubTab === st.value 
                        ? `${st.color} shadow-xs border border-black/5` 
                        : 'text-slate-500 hover:bg-white hover:text-slate-800'
                    }`}
                  >
                    <span>{st.label}</span>
                    {st.alertPulse && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                    {st.count !== null && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white border font-bold">
                        {st.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search text input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder={
                    coauthorActiveSubTab === 'my' ? 'Быстрый поиск среди соавторов по имени или юзернейму...' :
                    coauthorActiveSubTab === 'incoming' ? 'Поиск во входящих предложениях...' :
                    'Искать соавторов во всей базе Сетки...'
                  }
                  value={coauthorSearchText}
                  onChange={(e) => setCoauthorSearchText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-pink-350 transition-colors"
                />
              </div>

              {/* Dynamic list rendering */}
              <div className="space-y-3.5">
                {(() => {
                  let filteredList = virtualFriends;

                  // Filter by current active tab status
                  if (coauthorActiveSubTab === 'my') {
                    filteredList = virtualFriends.filter(f => f.isFriend && f.id !== 'group-smm');
                  } else if (coauthorActiveSubTab === 'incoming') {
                    filteredList = virtualFriends.filter(f => f.isPendingMe && !f.isFriend);
                  } else {
                    // Search tab displays co-authors not in friend list and not group
                    filteredList = virtualFriends.filter(f => f.id !== 'group-smm');
                  }

                  // Filter by text query
                  if (coauthorSearchText.trim()) {
                    const q = coauthorSearchText.toLowerCase();
                    filteredList = filteredList.filter(f => 
                      f.name.toLowerCase().includes(q) || 
                      f.username.toLowerCase().includes(q)
                    );
                  }

                  if (filteredList.length === 0) {
                    return (
                      <div className="p-10 text-center bg-slate-50 border border-dashed rounded-xl space-y-2 text-slate-400 font-semibold text-xs">
                        <UserPlus className="w-8 h-8 text-slate-300 mx-auto" />
                        <p>Никого не найдено с такими критериями.</p>
                        {coauthorActiveSubTab === 'search' && (
                          <p className="text-[10px] text-slate-400 font-normal">
                            Попробуйте ввести другое имя, зарегистрировать нового автора кнопкой выше или сбросить поисковый запрос!
                          </p>
                        )}
                      </div>
                    );
                  }

                  return filteredList.map(buddy => {
                    const isFriend = buddy.isFriend;
                    const isPendingMe = buddy.isPendingMe;
                    const isPendingThem = buddy.isPendingThem;

                    return (
                      <div 
                        key={buddy.id} 
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                          isFriend ? 'bg-emerald-50/10 hover:border-emerald-250 border-slate-100' : 'bg-white hover:border-pink-200 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className="relative shrink-0">
                            <img src={buddy.avatar} className="w-11 h-11 rounded-full object-cover border" alt={buddy.name} />
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              buddy.status === 'online' ? 'bg-emerald-500' : 'bg-slate-350'
                            }`} />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-extrabold text-slate-800 text-sm leading-snug">{buddy.name}</span>
                              <span className="font-mono text-[10px] font-bold text-pink-600">{buddy.username}</span>
                              {isFriend && (
                                <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                  Соавтор
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-[11px] font-semibold mt-1 leading-normal max-w-md">{buddy.bio}</p>
                          </div>
                        </div>

                        {/* Interactive Buttons for co-author management */}
                        <div className="flex flex-wrap gap-2 shrink-0 self-end sm:self-center">
                          
                          {/* Viewing Feed always allowed */}
                          <button 
                            onClick={() => {
                              setFeedFilterUser(buddy);
                              const identifier = buddy.username ? buddy.username.replace('@', '') : buddy.id;
                              window.history.pushState(null, '', `/social/feed/${identifier}`);
                              window.dispatchEvent(new Event('popstate'));
                            }}
                            className="p-2 px-3 text-[10px] uppercase font-black tracking-wider rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 transition-colors border border-pink-100 cursor-pointer"
                            title="Смотреть авторскую ленту"
                          >
                            Смотреть Ленту
                          </button>

                          {/* Friends actions */}
                          {isFriend && (
                            <>
                              <button 
                                onClick={() => {
                                  openChatWith(buddy);
                                  setActiveChatFriendId(buddy.id);
                                  const identifier = buddy.username ? buddy.username.replace('@', '') : buddy.id;
                                  window.history.pushState(null, '', `/social/messages/${identifier}`);
                                  window.dispatchEvent(new Event('popstate'));
                                }}
                                className="p-2 px-3 text-[10px] uppercase font-black tracking-wider rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors border border-sky-100 cursor-pointer"
                              >
                                Написать
                              </button>

                              <button 
                                onClick={() => {
                                  setTippingBuddyId(buddy.id);
                                  setTipResponse(null);
                                }}
                                className="p-2 px-3 text-[10px] uppercase font-black tracking-wider rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-700 transition-colors border border-yellow-250 cursor-pointer flex items-center gap-0.5 font-mono"
                              >
                                <span>🪙 Перевести</span>
                              </button>

                              <button 
                                onClick={() => {
                                  if (confirm(`Вы уверены, что хотите прекратить соавторство с ${buddy.name}?`)) {
                                    handleRemoveOrDecline(buddy.id);
                                  }
                                }}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Прекратить соавторство"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Inbound request management */}
                          {!isFriend && isPendingMe && (
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => handleAcceptProposal(buddy.id)}
                                className="p-2 px-3 text-[10px] uppercase font-black tracking-wider rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                              >
                                Принять
                              </button>
                              <button 
                                onClick={() => handleRemoveOrDecline(buddy.id)}
                                className="p-2 px-3 text-[10px] uppercase font-black tracking-wider rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              >
                                Отклонить
                              </button>
                            </div>
                          )}

                          {/* Outbound request management */}
                          {!isFriend && !isPendingMe && isPendingThem && (
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider bg-slate-50 px-2 py-1 rounded border">
                                Заявка отправлена
                              </span>
                              <button 
                                onClick={() => handleCancelRequest(buddy.id)}
                                className="p-1 px-2.5 text-[9px] uppercase font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer border"
                              >
                                Отменить
                              </button>
                            </div>
                          )}

                          {/* Invite/Add Co-author action */}
                          {!isFriend && !isPendingMe && !isPendingThem && (
                            <button 
                              onClick={() => handleSendRequest(buddy.id)}
                              className="p-2 px-3 text-[10px] uppercase font-black tracking-wider rounded-lg bg-gradient-to-r from-pink-500 via-orange-500 to-sky-400 hover:opacity-90 active:scale-95 text-white transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Предложить соавторство</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Smart assistance sidebar-type tips */}
            <div className="iirky-card-block p-5 rounded-2xl text-left bg-gradient-to-tr from-sky-50 to-pink-50 relative overflow-hidden text-xs leading-relaxed border border-pink-100/40">
              <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span>Зачем объединяться с другими соавторами?</span>
              </h4>
              <p className="text-slate-605 font-semibold leading-normal">
                SMM Сетка построена на принципах децентрализованного взаимного пиара и защищенных эскроу-сделок. Объединяясь со взаимными партнерами, вы можете моментально формировать рекламные папки, раздавать репосты со своей стены и наливать органический SMM-трафик. Индивидуальный траст соавторов напрямую зависит от количества завершенных коллабораций.
              </p>
            </div>
          </section>
        )}

        {/* VIEW 5: SAVED FOLDERS PAGE */}
        {activeSocialTab === 'saved' && (
          <section className="col-span-12 lg:col-span-12 space-y-6 text-left">
            {/* Create dynamic promo bundle folder */}
            <div className="iirky-card-block rounded-2xl p-5 pt-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5 bg-gradient-to-r from-pink-500 to-sky-400 bg-clip-text text-transparent">
                <FolderPlus className="w-5 h-5 text-pink-500" />
                <span>Создать новую папку соавторов взаимного пиара</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mb-4">
                Категоризируйте любимых партнеров и рассчитывайте суммарный SMM охват папки для ваших Telegram/VK ботов-интеграторов.
              </p>

              <form onSubmit={handleCreateFolder} className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text"
                  placeholder="Назовите вашу тематическую папку..."
                  className="flex-1 bg-slate-50 border px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  required
                />

                <select 
                  className="bg-slate-50 border px-3 py-2 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                  value={newFolderCategory}
                  onChange={(e) => setNewFolderCategory(e.target.value)}
                >
                  <option value="SMM & Копирайтинг">SMM & Копирайтинг</option>
                  <option value="Performance Marketing">Performance Marketing</option>
                  <option value="Взаимный Пиар">Взаимный Пиар</option>
                  <option value="Крипта & Финансы">Крипта & Финансы</option>
                </select>

                <button 
                  type="submit"
                  disabled={isCreatingFolder}
                  className="px-6 py-2.5 iirky-social-bg-gradient text-white font-black text-xs uppercase rounded-xl shadow-md cursor-pointer transition-opacity"
                >
                  Создать папку
                </button>
              </form>
            </div>

            {/* List folders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedFolders.map((fol) => {
                return (
                  <div key={fol.id} className="iirky-card-block rounded-2xl p-4.5 pt-6 text-left space-y-4 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 iirky-social-bg-gradient" />
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold uppercase">{fol.category}</span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-bold">UTM-трекер:</span>
                          <button 
                            type="button"
                            onClick={() => toggleUtmOnFolder(fol.id)}
                            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                              fol.utmActive ? 'bg-pink-600' : 'bg-slate-300'
                            }`}
                          >
                            <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-xs transform transition-transform ${
                              fol.utmActive ? 'translate-x-4.5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-black text-slate-800 text-sm leading-tight">{fol.name}</h4>
                      
                      {/* Estimate row */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono p-2.5 bg-slate-50 rounded-xl border">
                        <div>
                          <span className="text-slate-400 uppercase block">Соавторы:</span>
                          <span className="text-slate-700 font-bold text-xs">{fol.channelsCount} SMM союзов</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase block">Суммарный охват:</span>
                          <span className="text-pink-605 font-bold text-xs">{fol.estimatedCoverage.toLocaleString()} просмотров/ч</span>
                        </div>
                      </div>

                      {/* Partners usernames */}
                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">Участники папки:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {fol.channelsList.map((ch, idx) => (
                            <span key={idx} className="bg-sky-50 text-sky-700 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center gap-1.5 text-xs">
                      <button 
                        onClick={() => {
                          alert(`Экспортировано ${fol.channelsCount} ссылок соавторов в формат JSON папки взаимного пиара для публикации!`);
                        }}
                        className="text-[9px] uppercase font-black text-pink-650 hover:underline"
                      >
                        Экспорт ссылок
                      </button>
                      <button 
                        onClick={() => {
                          setSavedFolders(savedFolders.filter(f => f.id !== fol.id));
                          alert('Папка удалена');
                        }}
                        className="text-[9px] uppercase font-black text-rose-500 hover:underline"
                      >
                        Удалить папку
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>

      {/* 4. BACKGROUND PERSISTENT CHAT POPUPS (Floating messenger windows like Facebook) */}
      <div className="fixed bottom-0 right-4 z-50 flex gap-4 items-end justify-end pointer-events-none">
        {floatingChats.map(chat => (
          <div 
            key={chat.friendId}
            className="w-72 bg-white rounded-t-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col justify-between iirky-card-block"
            style={{ height: chat.isMinimized ? '40px' : '360px' }}
          >
            {/* Header chat row */}
            <div className="iirky-social-bg-gradient text-white p-2.5 flex items-center justify-between shrink-0 select-none cursor-pointer">
              <div 
                className="flex items-center gap-2 flex-1 text-left"
                onClick={() => setFloatingChats(
                  floatingChats.map(c => c.friendId === chat.friendId ? { ...c, isMinimized: !c.isMinimized } : c)
                )}
              >
                <img src={chat.friendAvatar} alt="Friend avatar" className="w-6 h-6 rounded-full object-cover border" />
                <span className="text-[11px] font-black truncate">{chat.friendName}</span>
              </div>

              <div className="flex gap-1.5 text-xs text-white/90 font-bold">
                <button 
                  onClick={() => setFloatingChats(
                    floatingChats.map(c => c.friendId === chat.friendId ? { ...c, isMinimized: !c.isMinimized } : c)
                  )}
                  className="hover:text-white"
                >
                  _
                </button>
                <button 
                  onClick={() => setFloatingChats(
                    floatingChats.filter(c => c.friendId !== chat.friendId)
                  )}
                  className="hover:text-white pl-1 font-bold text-sm leading-none"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            {!chat.isMinimized && (
              <>
                <div className="flex-1 p-3 overflow-y-auto no-scrollbar space-y-2 text-[11px] leading-relaxed max-h-[220px] bg-slate-50">
                  {chat.messages.map(msg => {
                    const isMe = msg.sender === 'me';
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto text-left items-start'}`}>
                        {msg.senderName && !isMe && (
                          <span className="text-[8px] font-mono text-pink-655 font-bold mb-0.5">{msg.senderName}</span>
                        )}
                        <div 
                          onClick={() => setSelectedMessageForAction(msg)}
                          className={`p-2.5 rounded-xl cursor-pointer hover:scale-[1.01] transition-transform duration-100 select-none ${
                            isMe 
                              ? 'msg-bubble-sent text-slate-800 rounded-tr-none shadow-sm' 
                              : 'msg-bubble-received text-slate-800 rounded-tl-none shadow-xs'
                          }`}
                          title="Кликните, чтобы ответить или переслать"
                        >
                          {/* Replied to section */}
                          {msg.replyTo && (
                            <div className="mb-1 p-1.5 rounded bg-pink-100/60 border-l-2 border-pink-500 text-[9px] leading-snug text-slate-800 italic max-w-full truncate">
                              <span className="font-extrabold text-[8px] text-pink-700 block not-italic uppercase mb-0.5">{msg.replyTo.senderName}:</span>
                              {msg.replyTo.text}
                            </div>
                          )}

                          {msg.text && <p className="font-semibold leading-normal">{msg.text}</p>}
                          
                          {/* Attached visual list */}
                          {msg.images && msg.images.length > 0 && (
                            <div className="mt-1 grid grid-cols-2 gap-0.5 rounded overflow-hidden">
                              {msg.images.map((img, i) => (
                                <img 
                                  key={i} 
                                  src={img} 
                                  className="w-full h-8 object-cover border border-black/10 cursor-zoom-in" 
                                  alt="Floating thumbnail" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenImagePreview(img, msg.images);
                                  }}
                                />
                              ))}
                            </div>
                          )}

                          <span className="block text-[8px] opacity-60 text-right mt-1 font-mono font-bold">{msg.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Send chat entry */}
                <div className="border-t bg-white p-1 shrink-0">
                  {/* Selected images list */}
                  {floatingAttachedImages[chat.friendId] && floatingAttachedImages[chat.friendId].length > 0 && (
                    <div className="flex gap-1 p-1 bg-slate-50 border-b max-h-11 overflow-x-auto no-scrollbar">
                      {floatingAttachedImages[chat.friendId].map((img, idx) => (
                        <div key={idx} className="relative w-8 h-8 rounded overflow-hidden border group shrink-0">
                          <img src={img} className="w-full h-full object-cover" alt="Thumb" />
                          <button 
                            type="button"
                            onClick={() => setFloatingAttachedImages(prev => ({
                              ...prev,
                              [chat.friendId]: prev[chat.friendId].filter((_, i) => i !== idx)
                            }))}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {floatingAttachedImagesError[chat.friendId] && (
                    <p className="text-[8px] text-red-500 font-bold px-1 mb-1">{floatingAttachedImagesError[chat.friendId]}</p>
                  )}

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const input = form.elements.namedItem('chat-msg') as HTMLInputElement;
                      sendFloatingMessage(chat.friendId, input.value);
                      form.reset();
                    }}
                    className="flex gap-1.5 bg-white shrink-0 items-center px-1"
                  >
                    {/* Visual attachment label */}
                    <label className="p-1 px-1.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg hover:border-pink-400 hover:text-pink-600 transition-colors cursor-pointer shrink-0">
                      <Image className="w-3.5 h-3.5" />
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={(e) => handleFloatingImagesChange(chat.friendId, e)} 
                        className="hidden" 
                      />
                    </label>

                    <input 
                      name="chat-msg"
                      autoComplete="off"
                      type="text" 
                      placeholder="Ваш ответ соавтору..." 
                      className="flex-1 bg-slate-50 border border-slate-200 px-2 py-1 text-[10px] rounded-lg focus:outline-none"
                    />
                    <button 
                      type="submit"
                      className="p-1 px-2.5 iirky-social-bg-gradient text-white rounded-lg text-[9px] font-black uppercase transition-colors shrink-0"
                    >
                      Отпр.
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Premium Toast Notification Banner */}
      <AnimatePresence>
        {premiumToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] max-w-md w-[calc(100%-2.5rem)] text-left select-none pointer-events-none"
          >
            <div className={`p-4 rounded-2xl shadow-xl border backdrop-blur-md flex items-start gap-3 pointer-events-auto ${
              premiumToast.type === 'error' 
                ? 'bg-red-50/95 border-red-200 text-red-900' 
                : premiumToast.type === 'info'
                  ? 'bg-sky-50/95 border-sky-200 text-sky-900' 
                  : 'bg-white/95 border-pink-200 text-slate-800'
            }`}>
              <div className="shrink-0 mt-0.5">
                {premiumToast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                {premiumToast.type === 'info' && <HelpCircle className="w-5 h-5 text-sky-500" />}
                {premiumToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-pink-500" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold leading-relaxed">{premiumToast.message}</p>
              </div>
              <button
                onClick={() => setPremiumToast(null)}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Image Carousel Preview Modal (Light Theme & Ambient Gradient Style) */}
      {activeImagePreviewUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-tr from-pink-200/50 via-white/80 to-sky-200/50 backdrop-blur-md"
          onClick={() => {
            setActiveImagePreviewUrl(null);
            setActivePreviewAlbum([]);
          }}
        >
          <div 
            className="relative max-w-4xl w-full bg-white/95 p-6 rounded-3xl shadow-2xl border border-white flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full flex justify-between items-center pb-2 border-b border-pink-100">
              <span className="text-xs font-black tracking-wider text-pink-700 bg-pink-50 px-3 py-1 rounded-full uppercase">
                Просмотр фото {activePreviewAlbum.length > 1 && `(${currentAlbumIndex + 1} из ${activePreviewAlbum.length})`}
              </span>
              <button 
                onClick={() => {
                  setActiveImagePreviewUrl(null);
                  setActivePreviewAlbum([]);
                }}
                className="p-1.5 h-8 w-8 flex items-center justify-center bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-full cursor-pointer transition-colors"
                title="Закрыть просмотр"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Image Slider Area */}
            <div className="relative w-full flex items-center justify-between bg-gradient-to-tr from-pink-50/20 via-white/50 to-sky-50/20 rounded-2xl p-4 min-h-[250px] max-h-[60vh] overflow-hidden group">
              {/* Navigation Arrows if album */}
              {activePreviewAlbum.length > 1 && (
                <button 
                  onClick={() => {
                    const prevIdx = (currentAlbumIndex - 1 + activePreviewAlbum.length) % activePreviewAlbum.length;
                    setCurrentAlbumIndex(prevIdx);
                    setActiveImagePreviewUrl(activePreviewAlbum[prevIdx]);
                  }}
                  className="p-2.5 bg-white/90 hover:bg-white text-pink-700 rounded-full cursor-pointer transition-colors shadow-md border hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <img 
                src={activeImagePreviewUrl} 
                alt="Premium attachment preview" 
                className="max-w-[70vw] max-h-[50vh] object-contain rounded-xl shadow-lg border border-slate-100/50 mx-auto transition-all duration-300"
                referrerPolicy="no-referrer"
              />

              {activePreviewAlbum.length > 1 && (
                <button 
                  onClick={() => {
                    const nextIdx = (currentAlbumIndex + 1) % activePreviewAlbum.length;
                    setCurrentAlbumIndex(nextIdx);
                    setActiveImagePreviewUrl(activePreviewAlbum[nextIdx]);
                  }}
                  className="p-2.5 bg-white/90 hover:bg-white text-pink-700 rounded-full cursor-pointer transition-colors shadow-md border hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Dots indicator */}
            {activePreviewAlbum.length > 1 && (
              <div className="flex gap-1.5 justify-center">
                {activePreviewAlbum.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentAlbumIndex(i);
                      setActiveImagePreviewUrl(activePreviewAlbum[i]);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      currentAlbumIndex === i ? 'bg-pink-500 scale-125 w-4' : 'bg-pink-200 hover:bg-pink-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Message Actions Dialog Menu */}
      {selectedMessageForAction && (
        <div 
          className="fixed inset-0 z-[100] bg-transparent"
          onClick={() => {
            setSelectedMessageForAction(null);
            setMsgClickPos(null);
          }}
        >
          <div 
            style={{
              position: 'fixed',
              top: msgClickPos ? `${msgClickPos.y}px` : '50%',
              left: msgClickPos ? `${msgClickPos.x}px` : '50%',
              transform: msgClickPos ? 'none' : 'translate(-50%, -50%)',
            }}
            className="z-[101] max-w-xs w-72 bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-pink-200 flex flex-col gap-3 text-left animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-1 border-b border-slate-100">
              <h3 className="font-extrabold text-xs text-slate-800">Реакции и действия</h3>
              <button 
                onClick={() => {
                  setSelectedMessageForAction(null);
                  setMsgClickPos(null);
                }}
                className="p-1 text-slate-400 hover:text-pink-600 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reactions Row - First is Rainbow Heart SVG */}
            <div className="bg-slate-50/90 p-2 rounded-2xl border border-pink-100 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
              {[
                { type: 'rainbow_heart', isCustom: true, label: 'Радужное Сердечко ❤️' },
                { type: 'like', icon: '👍', label: 'Красава' },
                { type: 'love', icon: '❤️', label: 'Любовь' },
                { type: 'fire', icon: '🔥', label: 'Огонь' },
                { type: 'haha', icon: '😆', label: 'Смех' },
                { type: 'wow', icon: '😮', label: 'Шок' }
              ].map(rec => (
                <button
                  key={rec.type}
                  type="button"
                  onClick={() => {
                    const msgId = selectedMessageForAction.id;
                    setChatHistories(prev => {
                      const list = prev[activeChatFriendId] || [];
                      const updated = list.map(m => {
                        if (m.id === msgId) {
                          const currentReactions = (m as any).reactions || [];
                          const exists = currentReactions.includes(rec.type);
                          const newReactions = exists 
                            ? currentReactions.filter((r: string) => r !== rec.type)
                            : [...currentReactions, rec.type];
                          return { ...m, reactions: newReactions };
                        }
                        return m;
                      });
                      return { ...prev, [activeChatFriendId]: updated };
                    });
                    setSelectedMessageForAction(null);
                    setMsgClickPos(null);
                  }}
                  className="p-1.5 hover:bg-pink-100 rounded-xl transition-all cursor-pointer transform hover:scale-125 active:scale-95 flex items-center justify-center shrink-0"
                  title={rec.label}
                >
                  {rec.isCustom ? (
                    <RainbowHeartIcon className="w-5 h-5 animate-pulse" />
                  ) : (
                    <span className="text-base leading-none">{rec.icon}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-slate-50/70 p-2.5 rounded-2xl border border-slate-100 max-h-20 overflow-y-auto">
              <span className="text-[8px] font-mono font-bold text-pink-600 block uppercase mb-0.5">
                {selectedMessageForAction.sender === 'me' ? 'Вы' : (selectedMessageForAction.senderName || 'Соавтор')}
              </span>
              <p className="text-[10px] text-slate-600 font-semibold leading-relaxed truncate">
                {selectedMessageForAction.text || '(Изображения)'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <button 
                onClick={() => {
                  setReplyingToMessage({
                    id: selectedMessageForAction.id,
                    sender: selectedMessageForAction.sender,
                    text: selectedMessageForAction.text || '(Изображение)',
                    senderName: selectedMessageForAction.senderName
                  });
                  setSelectedMessageForAction(null);
                  setMsgClickPos(null);
                }}
                className="w-full flex items-center gap-2.5 p-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-pink-50 hover:text-pink-700 rounded-xl transition-all cursor-pointer border border-slate-100 hover:border-pink-200"
              >
                <MessageCircle className="w-4 h-4 text-pink-500" />
                <span>Ответить</span>
              </button>

              <button 
                onClick={() => {
                  setForwardingMessage({
                    text: selectedMessageForAction.text || '',
                    images: selectedMessageForAction.images
                  });
                  setSelectedMessageForAction(null);
                  setMsgClickPos(null);
                }}
                className="w-full flex items-center gap-2.5 p-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 rounded-xl transition-all cursor-pointer border border-slate-100 hover:border-sky-200"
              >
                <SendHorizontal className="w-4 h-4 text-sky-500" />
                <span>Переслать в другой чат</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ProTalk API AI Autoresponder Modal */}
      {showAutoReplyModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowAutoReplyModal(false)}
        >
          <div 
            className="relative max-w-md w-full bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-pink-200 space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 rounded-xl text-white shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800 uppercase">ИИ-Автоответчик Синдиката</h3>
                  <span className="text-[10px] text-pink-600 font-extrabold flex items-center gap-1">
                    ⚡ ProTalk API (Тариф «Отрыв»)
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowAutoReplyModal(false)}
                className="p-1 text-slate-400 hover:text-pink-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-pink-50/70 border border-pink-200/80 rounded-2xl text-xs text-slate-700 space-y-1">
              <p className="font-extrabold text-slate-800 flex items-center gap-1">
                <span>🌐 Подключение ProTalk API</span>
              </p>
              <p className="text-[11px] text-slate-600 leading-snug">
                Настройка умного автоответчика постов и личных сообщений на базе <strong className="text-pink-600">ProTalk API</strong>. Данный функционал эксклюзивно доступен для пользователей с тарифом <strong className="text-orange-600 uppercase">«Отрыв»</strong>.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-800">Статус автоответа:</span>
              <button 
                type="button"
                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase transition-all shadow-xs cursor-pointer ${
                  autoReplyEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {autoReplyEnabled ? 'Активен ✔️' : 'Выключен'}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase block">Шаблон / Промпт ИИ-Ответа:</label>
              <textarea 
                rows={3}
                value={autoReplyPrompt}
                onChange={(e) => setAutoReplyPrompt(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-pink-400 p-3 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none shadow-xs"
                placeholder="Например: Спасибо за сообщение! Нахожусь на встрече, отвечу в течение 10 минут..."
              />
              <span className="text-[10px] text-slate-400 font-semibold block">ИИ отправит ответ соавтору автоматически от вашего имени через ProTalk API.</span>
            </div>

            <button 
              type="button"
              onClick={() => {
                setShowAutoReplyModal(false);
                alert('Настройки ИИ-Автоответчика ProTalk API успешно сохранены!');
              }}
              className="w-full py-3 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black text-xs uppercase rounded-2xl shadow-md hover:opacity-95 transition-all cursor-pointer"
            >
              Сохранить настройки
            </button>
          </div>
        </div>
      )}

      {/* 3. Forward Message Target Selection Modal */}
      {forwardingMessage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-tr from-pink-100/75 via-white/80 to-sky-100/75 backdrop-blur-md"
          onClick={() => setForwardingMessage(null)}
        >
          <div 
            className="relative max-w-sm w-full bg-white/95 p-5 rounded-3xl shadow-2xl border border-pink-100 flex flex-col gap-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Переслать сообщение</h3>
                <span className="text-[9px] text-slate-400 italic">Выберите получателя из списка соавторов</span>
              </div>
              <button 
                onClick={() => setForwardingMessage(null)}
                className="p-1 bg-slate-100 rounded-full text-slate-400 hover:text-pink-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message preview inside forwarding */}
            <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100 text-[10px] text-slate-600 italic">
              <span className="font-black text-pink-700 text-[8px] block uppercase not-italic mb-1">Пересылаемое сообщение:</span>
              "{forwardingMessage.text || '(Изображения)'}"
            </div>

            {/* Target chats list */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
              {virtualFriends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between py-2 text-xs first:pt-0">
                  <div className="flex items-center gap-3">
                    <img src={friend.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border" />
                    <div>
                      <span className="font-extrabold text-slate-800 block leading-tight text-xs">{friend.name}</span>
                      <span className="text-[9px] font-mono text-slate-400">{friend.username}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const fwdText = forwardingMessage.text ? forwardingMessage.text : '';
                      const fwdMsg = {
                        id: `full-m-fwd-${Date.now()}`,
                        sender: 'me' as const,
                        text: fwdText ? `[Переслано]: ${fwdText}` : '[Переслано фото]',
                        time: timeNow,
                        images: forwardingMessage.images,
                        replyTo: undefined
                      };

                      setChatHistories(prev => ({
                        ...prev,
                        [friend.id]: [...(prev[friend.id] || []), fwdMsg]
                      }));

                      setForwardingMessage(null);
                    }}
                    className="p-1 px-3 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Отправить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. ProTalk Voice Recording Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onVoiceProcessed={handleVoiceProcessed}
        activeFriendName={virtualFriends.find(f => f.id === activeChatFriendId)?.name || 'Соавтор'}
      />

    </div>
  );
}
