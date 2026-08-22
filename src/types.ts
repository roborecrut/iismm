export type SocialNetwork =
  | 'telegram'
  | 'vk'
  | 'max'
  | 'instagram'
  | 'facebook'
  | 'pinterest'
  | 'linkedin'
  | 'discord'
  | 'x'
  | 'ok'
  | 'tenchat'
  | 'dzen'
  | 'setka'
  | 'tiktok';

export interface InlineButton {
  id: string;
  text: string;
  type?: 'callback' | 'url' | 'webapp';
  url?: string;
  callbackData?: string;
  style?: 'default' | 'primary' | 'success' | 'danger';
  color?: 'blue' | 'purple' | 'pink' | 'emerald' | 'orange' | 'red';
}

export interface SocialChannel {
  id: string;
  name: string;
  username: string;
  platform?: SocialNetwork;
  avatarUrl?: string;
  subscribers?: number;
  subscribersCount?: number;
  category?: string;
  isPremium?: boolean;
  status?: 'connected' | 'pending';
  isActive?: boolean;
  role?: 'own' | 'donor';
  channelType?: 'channel' | 'group' | 'stories' | 'chat';
  telegramId?: string;
  inviteLink?: string;
  description?: string;
  photoUrl?: string;
  userId?: string;
}

export interface CampaignPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  platforms?: SocialNetwork[];
  scheduledAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'sent' | 'failed';
  inlineButtons?: InlineButton[];
  isAiGenerated?: boolean;
  rewriteReferenceChannel?: string;
  clicks?: number;
  views?: number;
  utmData?: {
    source: string;
    medium: string;
    campaign: string;
  };
}

export interface PromoBundle {
  id: string;
  title: string;
  organizerUsername: string;
  rules: string;
  entryFeeRub: number;
  channelsCount: number;
  maxChannels: number;
  status: 'draft' | 'collecting' | 'published';
  joinedChannels: string[];
  isFreeForOrganizer: boolean;
}

export interface AdListing {
  id: string;
  channelId: string;
  channelName: string;
  platform: SocialNetwork;
  priceRub: number;
  subscribersCount: number;
  avgViews: number;
  category: string;
  contactUsername: string;
  description: string;
}

export interface BulletinAd {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  linkUrl: string;
  postedBy: string;
  createdAt: string;
  clicks: number;
}

export interface AdOrder {
  id: string;
  title: string;
  payoutRub: number;
  platform: SocialNetwork;
  requirements: string;
  postContent: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email?: string;
  password?: string;
  passwordHash?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  telegramUsername: string;
  telegramId?: number;
  tariff?: string;
  tokens: number;
  iirky: number;
  telegramStars?: number;
  avatarUrl?: string;
  username?: string;
  photoUrl?: string;
  userAvatar?: string;
  user_avatar?: string;
  profileLink?: string;
  bio?: string;
  isPremium?: boolean;
  languageCode?: string;
  phone?: string;
  allowsWriteToPm?: boolean;
  latitude?: number;
  longitude?: number;
  referredBy?: number | string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  balance?: number;
  balance_free?: number;
  balance_pay?: number;
  balance_start?: number;
  balance_ref?: number;
  balance_tarif?: number;
  balance_admin?: number;
  balance_cost?: number;
  balance_time?: string;
  referralRewardBalance?: number;
  status?: 'Активный' | 'Блок' | 'Удален';
  timezone?: string;
  balanceRub: number;
  earningsRub: number;
  premiumUntil?: string;
  lastLogin?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email?: string;
  password?: string;
  passwordHash?: string;
  role: string;
  createdAt: string;
  telegramId?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  avatarUrl?: string;
  userAvatar?: string;
  profileLink?: string;
  bio?: string;
  isPremium?: boolean;
  languageCode?: string;
  phone?: string;
  allowsWriteToPm?: boolean;
  latitude?: number;
  longitude?: number;
  referredBy?: number | string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  balance?: number;
  balance_free?: number;
  balance_pay?: number;
  balance_start?: number;
  balance_ref?: number;
  balance_tarif?: number;
  balance_admin?: number;
  balance_cost?: number;
  balance_time?: string;
  referral_reward_balance?: number;
  status?: 'Активный' | 'Блок' | 'Удален';
  tariff?: string;
  timezone?: string;
  lastLogin?: string;
  [key: string]: any;
}

export type TransactionType = 'start' | 'pay' | 'tarif' | 'ref' | 'admin' | 'cost';

export interface TransactionRecord {
  id: string;
  user_id: string;
  type: TransactionType;
  balance_type: string;
  amount: number;
  description: string;
  comment?: string;
  status: string;
  created_at: string;
}

export interface TariffFeature {
  title: string;
  desc: string;
}

export interface TariffRecord {
  id: string;
  name: string;
  price_iirky: string;
  price_rub: number;
  sub: string;
  continuation?: string;
  monthly_iirky: number;
  features: string | TariffFeature[];
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: 'balance' | 'transaction' | 'social' | 'publish' | 'system';
  title: string;
  message: string;
  is_read: number;
  link?: string;
  created_at: string;
}

export interface Stats {
  postsCount: number;
  channelsCount: number;
  subscribersCount?: number;
  earningsRub?: number;
  viewsCount?: number;
  clicksCount?: number;
}

export interface Prompt {
  id: string;
  title: string;
  dayOfWeek: string;
  category: string;
  content: string;
  createdAt: string;
  authorId: string;
  messageFormat?: 'v2' | 'rich' | 'markdown' | 'html';
  uppercaseHeader?: boolean;
  signature?: string;
  linkPreviewEnabled?: boolean;
  attachmentType?: 'none' | 'photo' | 'document' | 'video' | 'audio' | 'album' | 'video_note';
  attachmentUrl?: string;
  attachmentUrls?: string[];
  [key: string]: any;
}

export interface Publication {
  id: string;
  userId?: string;
  promptId?: string;
  promptTitle: string;
  category?: string;
  text: string;
  channel: string;
  messageId?: string;
  status: boolean;
  publishedAt: string;
  response?: string;
  [key: string]: any;
}

export interface DayRequest {
  id: string;
  userId?: string;
  dayOfWeek?: string;
  category?: string;
  promptText?: string;
  postTitle?: string;
  title?: string;
  published?: boolean;
  status?: any;
  scheduledTime?: string;
  targetChannel?: string;
  attachmentUrl?: string;
  attachmentUrls?: string[];
  attachmentType?: string;
  signature?: string;
  linkPreviewEnabled?: boolean;
  requestTemplate?: string;
  imagePrompt?: string;
  postText?: string;
  messageFormat?: string;
  uppercaseHeader?: boolean;
  uniquenessMemoryCount?: number;
  channels?: string[];
  channel?: string;
  inlineButtons?: InlineButton[];
  triggerSchedule?: any;
  [key: string]: any;
}

export interface PublicationLog {
  id: string;
  userId?: string;
  promptTitle: string;
  channel: string;
  time: string;
  status: 'Успешно' | 'Ошибка';
  message: string;
}

export interface Settings {
  telegramBotToken?: string;
  channelId?: string;
  backupChannelId?: string;
  autoPostSchedule?: boolean;
  autoPostTime?: string;
  theme?: string;
  protalkBotId?: string;
  protalkBotToken?: string;
  robokassa?: {
    merchantLogin: string;
    pass1: string;
    pass2: string;
    isTest: boolean;
  };
}

export interface Channel {
  id: string;
  userId?: string;
  name: string;
  username: string;
  isActive: boolean;
  subscribersCount?: number;
  inviteLink?: string;
  telegramId?: string;
  description?: string;
  photoUrl?: string;
  isPremium?: boolean;
  status?: string;
}

export interface PostTemplate {
  id: string;
  type: 'header' | 'postText' | 'signature' | 'full';
  name: string;
  category?: string;
  content: string;
  createdAt: string;
}

export interface ScenarioStep {
  id: string;
  stepNumber: number;
  type: 'analyze_history' | 'generate_text' | 'generate_image_prompt' | 'generate_image' | 'format_post' | 'schedule_post';
  title: string;
  description: string;
  enabled: boolean;
  config: {
    memoryCount?: number;
    topic?: string;
    requestTemplate?: string;
    imageStylePrompt?: string;
    messageFormat?: 'v2' | 'rich';
    channelId?: string;
    postTime?: string;
    signature?: string;
    inlineButtons?: InlineButton[];
    autoPublish?: boolean;
    [key: string]: any;
  };
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  schedule: string;
  targetChannels: string[];
  messageFormat: 'v2' | 'rich';
  steps: ScenarioStep[];
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus?: 'success' | 'failed' | 'running';
  lastError?: string;
  createdAt: string;
  generatedTopic?: string;
  topicCategory?: string;
  generatedText?: string;
  generatedImagePrompt?: string;
  generatedImageUrls?: string[];
  formattedPreview?: string;
  autoPublish?: boolean;
  [key: string]: any;
}

export interface ScenarioLog {
  id: string;
  scenarioId: string;
  scenarioName: string;
  runAt: string;
  executedAt?: string;
  status: 'success' | 'failed';
  generatedText?: string;
  generatedImageUrl?: string;
  details: string;
  cost: number;
}

export interface MediaFile {
  id: string;
  userId?: string;
  originalName: string;
  name: string;
  fullUrl: string;
  shortKey: string;
  shortUrl: string;
  fileType: 'photo' | 'video' | 'audio' | 'document' | 'video_note';
  mimeType?: string;
  fileSize?: number;
  sizeFormatted?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  createdAt: string;
}

export interface ProTalkResponse {
  title: string;
  content: string;
}

export interface DatabaseSchema {
  users: User[];
  prompts: Prompt[];
  publications: Publication[];
  dayRequests: DayRequest[];
  templates: PostTemplate[];
  channels: Channel[];
  settings: Settings;
  scenarios: Scenario[];
  scenarioLogs: ScenarioLog[];
  files?: MediaFile[];
}
