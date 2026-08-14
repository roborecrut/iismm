import React, { useState, useEffect } from 'react';
import PostMaker from '../components/PostMaker';
import ChannelList from '../components/ChannelList';
import CrosspostingHub from '../components/CrosspostingHub';
import { CampaignPost, SocialChannel, SocialNetwork } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Radio, Share2, Sparkles } from 'lucide-react';

interface CombinedPostsPageProps {
  // PostMaker props
  onPublishPost: (post: Omit<CampaignPost, 'id' | 'clicks' | 'views'>) => void;
  onDeletePost: (id: string) => void;
  onUpdatePost: (post: CampaignPost) => void;
  savedPosts: CampaignPost[];
  connectedChannels: SocialChannel[];
  tokens: number;
  onDeductTokens: (amount: number) => void;

  // ChannelList props
  channels: SocialChannel[];
  onAddChannel: (channel: Omit<SocialChannel, 'id' | 'subscribers' | 'isPremium' | 'status'>) => boolean | string;
  onRemoveChannel: (id: string) => void;
  tariff: 'free' | 'pro' | 'vip';
  userBalance: number;
  onDeductBalanceRub?: (amount: number) => void;
  onBuySlot: (slotsCount: number) => void;

  // Global Navigation
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function PostsPage({
  onPublishPost,
  onDeletePost,
  onUpdatePost,
  savedPosts,
  connectedChannels,
  tokens,
  onDeductTokens,
  channels,
  onAddChannel,
  onRemoveChannel,
  tariff,
  userBalance,
  onDeductBalanceRub,
  onBuySlot,
  currentPath,
  onNavigate
}: CombinedPostsPageProps) {
  // Determine active subpage based on path matches
  const getTabFromPath = (path: string): 'channels' | 'crosspost' | 'redactor' | 'autogenerator' | 'rewright' => {
    if (path.includes('/crosspost')) return 'crosspost';
    if (path.includes('/redactor')) return 'redactor';
    if (path.includes('/autogenerator')) return 'autogenerator';
    if (path.includes('/rewright')) return 'rewright';
    return 'channels'; // Default to first page in requested order
  };

  const activeTab = getTabFromPath(currentPath);

  const switchTab = (tab: 'channels' | 'crosspost' | 'redactor' | 'autogenerator' | 'rewright') => {
    onNavigate(`/posts/${tab}`);
  };

  // Convert currentPath containing /posts/channels or /posts169262990/channels back to simulated legacy /channels for ChannelList
  let simulatedChannelPath = '/channels';
  const cleanPath = currentPath.replace('169262990', '');
  if (cleanPath.includes('/posts/channels/')) {
    simulatedChannelPath = cleanPath.substring(cleanPath.indexOf('/posts/channels/')).replace('/posts/channels/', '/channels/');
  } else if (cleanPath.includes('/posts/id')) {
    simulatedChannelPath = cleanPath.substring(cleanPath.indexOf('/posts/id')).replace('/posts/', '/channels/');
  } else if (cleanPath.includes('/posts/telegram') || cleanPath.includes('/posts/vk') || cleanPath.includes('/posts/max') || cleanPath.includes('/posts/instagram') || cleanPath.includes('/posts/facebook') || cleanPath.includes('/posts/x') || cleanPath.includes('/posts/tiktok') || cleanPath.includes('/posts/pinterest') || cleanPath.includes('/posts/linkedin') || cleanPath.includes('/posts/discord') || cleanPath.includes('/posts/ok') || cleanPath.includes('/posts/tenchat') || cleanPath.includes('/posts/dzen') || cleanPath.includes('/posts/setka')) {
    const platformSegment = cleanPath.split('/posts/').pop() || '';
    simulatedChannelPath = `/channels/${platformSegment}`;
  }

  // Wrapper for parent navigation
  const handleAdaptedNavigate = (path: string) => {
    // Convert /channels/... back to /posts/channels/... or /posts/id...
    let target = path;
    if (path.startsWith('/channels/')) {
      target = path.replace('/channels/', '/posts/channels/');
    } else if (path === '/channels') {
      target = '/posts/channels';
    }
    onNavigate(target);
  };

  const tabItems = [
    { key: 'channels', label: 'Каналы', path: '/posts/channels', icon: <Radio className="w-3.5 h-3.5" /> },
    { key: 'crosspost', label: 'Кросспостинг HUB', path: '/posts/crosspost', icon: <Share2 className="w-3.5 h-3.5" /> },
    { key: 'redactor', label: 'Редактор', path: '/posts/redactor', icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'autogenerator', label: 'Автогенератор', path: '/posts/autogenerator', icon: <Sparkles className="w-3.5 h-3.5 text-orange-500" /> },
    { key: 'rewright', label: 'ИИ Рерайтер', path: '/posts/rewright', icon: <Sparkles className="w-3.5 h-3.5 text-pink-500" /> }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab Switcher Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 rounded-3xl bg-white/90 backdrop-blur-md border border-pink-200/80 shadow-md gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            {activeTab === 'channels' ? (
              <Radio className="w-5 h-5 text-pink-500" />
            ) : activeTab === 'crosspost' ? (
              <Share2 className="w-5 h-5 text-pink-500 animate-pulse" />
            ) : activeTab === 'redactor' ? (
              <FileText className="w-5 h-5 text-pink-500" />
            ) : activeTab === 'autogenerator' ? (
              <Sparkles className="w-5 h-5 text-pink-500 animate-pulse fill-pink-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
            )}
            <span>
              {activeTab === 'channels' ? '📡 Мои каналы и лимиты' :
               activeTab === 'crosspost' ? '🔄 Кросспостинг HUB' :
               activeTab === 'redactor' ? '✍️ Ручной редактор SMM' :
               activeTab === 'autogenerator' ? '🔮 ИИ-Автогенератор постов' :
               '🎭 ИИ Рерайт под автора'}
            </span>
          </h2>
          <p className="text-[11px] text-slate-600 leading-snug font-bold">
            {activeTab === 'channels' ? 'Управление вашими площадками, покупка слотов лимитов и детальный ER/охват аудит' :
             activeTab === 'crosspost' ? 'Умная адаптация единого поста под форматы Telegram, VK, Сетки, Instagram и X в один клик' :
             activeTab === 'redactor' ? 'Создавайте публикации вручную с поддержкой медиафайлов и инлайн-кнопок' :
             activeTab === 'autogenerator' ? 'Сгенерируйте качественный, готовый к публикации контент с помощью ИИ' :
             'Превратите любой текст или внешнюю ссылку в уникальный авторский пост'}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1.5 bg-white/80 rounded-2xl w-full lg:w-auto shrink-0 border border-pink-200/80 shadow-xs">
          {tabItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                id={`tab-select-${item.key}-mode`}
                key={item.key}
                onClick={() => switchTab(item.key)}
                className={`flex-1 lg:flex-none px-3.5 py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md border border-white/20'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-pink-50/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Animation wrapper for smooth sub-pages switching */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.18 }}
        >
          {['redactor', 'autogenerator', 'rewright'].includes(activeTab) ? (
            <PostMaker
              onPublishPost={onPublishPost}
              onDeletePost={onDeletePost}
              onUpdatePost={onUpdatePost}
              savedPosts={savedPosts}
              connectedChannels={connectedChannels}
              tokens={tokens}
              onDeductTokens={onDeductTokens}
              onAddChannel={onAddChannel}
              activeMode={activeTab === 'redactor' ? 'write' : activeTab === 'autogenerator' ? 'ai' : 'rewrite'}
              onModeChange={(mode) => {
                const sub = mode === 'write' ? 'redactor' : mode === 'ai' ? 'autogenerator' : 'rewright';
                onNavigate(`/posts/${sub}`);
              }}
            />
          ) : activeTab === 'crosspost' ? (
            <CrosspostingHub
              onPublishPost={onPublishPost}
              savedPosts={savedPosts}
              connectedChannels={channels.filter(c => c.status === 'connected')}
              tokens={tokens}
              onDeductTokens={onDeductTokens}
              userBalance={userBalance}
              onDeductBalanceRub={onDeductBalanceRub}
            />
          ) : (
            <ChannelList
              channels={channels}
              onAddChannel={onAddChannel}
              onRemoveChannel={onRemoveChannel}
              tariff={tariff}
              userBalance={userBalance}
              onBuySlot={onBuySlot}
              currentPath={simulatedChannelPath}
              onNavigate={handleAdaptedNavigate}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
