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
  username: string; // e.g. @tech_trends
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
  scheduledAt?: string; // ISO string or specific time
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
  entryFeeRub: number; // e.g. 500
  channelsCount: number;
  maxChannels: number;
  status: 'draft' | 'collecting' | 'published';
  joinedChannels: string[]; // IDs of channels
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
  tariff?: 'free' | 'pro' | 'vip' | 'start' | 'otryv' | 'kosmos';
  tokens: number; // AI tokens (ИИ-токены)
  iirky: number;  // ИИрки - internal currency
  telegramStars?: number; // Telegram Stars balance
  avatarUrl?: string; // profile photo url
  username?: string;
  photoUrl?: string;
  userAvatar?: string; // custom priority avatar
  user_avatar?: string;
  profileLink?: string;
  bio?: string;
  isPremium?: boolean;
  languageCode?: string;
  phone?: string;
  allowsWriteToPm?: boolean;
  latitude?: number;
  longitude?: number;
  referredBy?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referralRewardBalance?: number;
  lastLogin?: string;
  balanceRub: number; // income from promos, ad orders etc
  balance?: number;
  timezone?: string;
  earningsRub: number; // total earnings in system
  premiumUntil?: string; // Date formatted for premium trial
  createdAt?: string;
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
  referredBy?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referralRewardBalance?: number;
  lastLogin?: string;
  balance?: number;
  timezone?: string;
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
  attachmentType?: 'none' | 'photo' | 'document' | 'video' | 'audio' | 'album' | 'video_note';
  attachmentUrl?: string;
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
}

export interface DayRequest {
  id: string;
  userId?: string;
  dayOfWeek?: string;
  category: string; // Тема (max 15 chars)
  requestTemplate: string; // AI Prompt template
  channel: string;
  channels?: string[]; // Мультивыбор каналов публикации
  title: string;
  signature: string;
  messageFormat?: 'v2' | 'rich' | 'markdown' | 'html';
  uppercaseHeader?: boolean;
  postText?: string;
  attachmentType?: 'none' | 'photo' | 'document' | 'video' | 'audio' | 'album' | 'video_note';
  attachmentUrl?: string;
  attachmentUrls?: string[]; // Up to 10 for album
  inlineButtons?: InlineButton[][]; // Rows of buttons
  uniquenessMemoryCount?: number;
  imagePrompt?: string;
  status?: 'draft' | 'scheduled' | 'sent' | 'failed' | 'создается' | 'создан' | string;
  created_at?: string;
  createdAt?: string;
  triggerSchedule?: {
    frequency: 'interval_minutes' | 'interval_hours' | 'daily' | 'dayOfWeek' | 'exact_date';
    intervalMinutes?: number;
    intervalHours?: number;
    time?: string;
    days?: string[];
    exactDateTime?: string;
    scheduledAt?: string;
    enabled: boolean;
    notifyUser?: boolean;
    status?: string;
    attemptCount?: number;
    lastError?: string;
    sentAt?: string;
    lastAttemptAt?: string;
  };
}

export interface PostTemplate {
  id: string;
  type: 'header' | 'postText' | 'signature' | 'full';
  name: string;
  category?: string;
  content: string;
  createdAt: string;
}

export interface Settings {
  telegramBotToken: string;
  channelId: string;
  backupChannelId: string;
  autoPostSchedule: boolean;
  autoPostTime: string;
  theme: 'dark' | 'light';
  protalkBotId: string;
  protalkBotToken: string;
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
}

export interface Stats {
  totalPrompts: number;
  publishedThisMonth: number;
  engagementRate: number;
  chartData: { name: string; count: number }[];
  recentPublications: Publication[];
}

export interface ScenarioStep {
  id: string;
  stepNumber: number; // 1 to 6
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
    channel?: string;
    channels?: string[];
    autoPublish?: boolean;
  };
}

export interface Scenario {
  id: string;
  userId?: string;
  postId?: string;
  name: string;
  description?: string;
  basePromptId?: string;
  basePromptTitle?: string;
  topicCategory: string;
  targetChannels: string[];
  messageFormat: 'v2' | 'rich';
  enabled: boolean;
  schedule: {
    frequency: 'interval_minutes' | 'interval_hours' | 'daily' | 'dayOfWeek';
    intervalMinutes?: number;
    intervalHours?: number;
    time?: string;
    days?: string[];
  };
  offsetHoursBeforePost?: number;
  generatedTopic?: string;
  generatedText?: string;
  generatedImagePrompt?: string;
  generatedImageUrls?: string[];
  formattedPreview?: string;
  completedTestSteps?: number[];
  steps: ScenarioStep[];
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus?: 'success' | 'failed' | 'running';
  lastError?: string;
  createdAt: string;
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
