import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { deleteRow, insertRow, updateRow, fetchAllPostsFromSQLite, fetchAllUsersFromSQLite, fetchAllFilesFromSQLite, fetchAllChannelsFromSQLite, getSyncSQLiteDB, normalizeUserId, syncPostCronTask } from './sqlite';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  passwordHash?: string;
  role: string;
  createdAt: string;
  telegramId?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  telegramUsername?: string;
  photoUrl?: string;
  avatarUrl?: string;
  userAvatar?: string;
  profileLink?: string;
  bio?: string;
  isPremium?: boolean;
  tariff?: 'free' | 'start' | 'pro' | 'vip';
  premiumUntil?: string;
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
  balance?: number;
  iirky?: number;
  tokens?: number;
  balanceRub?: number;
  earningsRub?: number;
  status?: 'Активный' | 'Блок' | 'Удален';
  timezone?: string;
  lastLogin?: string;
}

export interface Prompt {
  id: string;
  title: string;
  dayOfWeek: string;
  category: string;
  content: string;
  createdAt: string;
  authorId: string;
  messageFormat?: 'markdown' | 'html';
  uppercaseHeader?: boolean;
  signature?: string;
  attachmentType?: 'none' | 'photo' | 'document' | 'video' | 'audio';
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

export interface InlineButton {
  id: string;
  text: string;
  type: 'callback' | 'url' | 'webapp';
  url?: string;
  callbackData?: string;
  style?: 'default' | 'primary' | 'success' | 'danger';
}

export interface ScenarioStep {
  id: string;
  stepNumber: number; // 1 to 6
  type: 'analyze_history' | 'generate_text' | 'generate_image_prompt' | 'generate_image' | 'format_post' | 'schedule_post';
  title: string;
  description: string;
  enabled: boolean;
  config: {
    memoryCount?: number; // Step 1: 1..30 posts memory
    topic?: string; // Step 1/2: Topic/category
    requestTemplate?: string; // Step 2: prompt instruction for text
    imageStylePrompt?: string; // Step 3: style guide for image prompt
    messageFormat?: 'v2' | 'rich'; // Step 5: format style
    channel?: string; // Target channel
    channels?: string[]; // Target channels
    autoPublish?: boolean; // Step 6: publish immediately or schedule
  };
}

export interface Scenario {
  id: string;
  userId?: string;
  name: string;
  description?: string;
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
  status: 'success' | 'failed';
  generatedText?: string;
  generatedImageUrl?: string;
  details: string;
  cost: number;
}

export interface DayRequest {
  id: string;
  userId?: string;
  dayOfWeek?: string;
  category: string;
  requestTemplate: string;
  channel: string;
  channels?: string[];
  title: string;
  signature: string;
  messageFormat?: 'v2' | 'rich' | 'markdown' | 'html';
  uppercaseHeader?: boolean;
  postText?: string;
  attachmentType?: 'none' | 'photo' | 'document' | 'video' | 'audio' | 'album';
  attachmentUrl?: string;
  attachmentUrls?: string[];
  inlineButtons?: InlineButton[][];
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

export interface PublicationLog {
  id: string;
  publicationId: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface Settings {
  telegramBotToken: string;
  channelId: string;
  backupChannelId: string;
  autoPostSchedule: boolean;
  autoPostTime: string; // e.g. "07:00"
  theme: 'dark' | 'light';
  protalkBotId: string;
  protalkBotToken: string;
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

export interface SystemPrompt {
  id: string;
  scenarioKey: string;
  title: string;
  promptText: string;
  description?: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  prompts: Prompt[];
  publications: Publication[];
  dayRequests: DayRequest[];
  publicationLogs: PublicationLog[];
  settings: Settings;
  channels: Channel[];
  templates: PostTemplate[];
  scenarios: Scenario[];
  scenarioLogs: ScenarioLog[];
  files?: MediaFile[];
}

const DB_FILE = path.join(process.cwd(), 'database.json');

const INITIAL_DAY_REQUESTS: DayRequest[] = [];

const INITIAL_PUBLICATIONS: Publication[] = [];

export class DB {
  private static load(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      const defaultDb: DatabaseSchema = {
        users: [
          {
            id: '16926299042',
            telegramId: 169262990,
            email: 'shishkarnem@gmail.com',
            passwordHash: hashPassword('wkL35eTm'),
            role: 'admin',
            firstName: 'Dr.White',
            lastName: 'SAV AI',
            username: 'shishkarnem',
            createdAt: new Date().toISOString(),
            balance: 10000
          }
        ],
        prompts: [],
        publications: [],
        dayRequests: [],
        publicationLogs: [],
        settings: {
          telegramBotToken: '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o',
          channelId: '',
          backupChannelId: '',
          autoPostSchedule: false,
          autoPostTime: '07:00',
          theme: 'light',
          protalkBotId: '66275',
          protalkBotToken: 'GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE'
        },
        channels: [],
        templates: [
          { id: 'tpl_1', type: 'header', name: 'Стандартный заголовок с эмодзи', category: 'бизнес/финансы', content: '💰Случайный промт для бизнеса от ИИ💰', createdAt: new Date().toISOString() },
          { id: 'tpl_2', type: 'postText', name: 'Шаблон бизнес-разбора', category: 'бизнес/финансы', content: 'Роль: Гуру бизнес-стратегии.\nЗадача: Разбери нишу и предложи 3 уникальных оффера...', createdAt: new Date().toISOString() },
          { id: 'tpl_3', type: 'signature', name: 'Подпись с хештегами', category: 'общие', content: 'Присылайте полученные варианты в комментариях!\n#бизнес #ии #промпт', createdAt: new Date().toISOString() }
        ],
        scenarios: [],
        scenarioLogs: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
      return defaultDb;
    }
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (!parsed.channels) {
        parsed.channels = [];
      } else {
        // Remove legacy unassigned default channel ch_1
        parsed.channels = parsed.channels.filter((c: any) => c.id !== 'ch_1' && c.name !== 'SAV_AI Основной');
      }
      if (!parsed.templates) {
        parsed.templates = [
          { id: 'tpl_1', type: 'header', name: 'Стандартный заголовок с эмодзи', category: 'бизнес/финансы', content: '💰Случайный промт для бизнеса от ИИ💰', createdAt: new Date().toISOString() },
          { id: 'tpl_2', type: 'postText', name: 'Шаблон бизнес-разбора', category: 'бизнес/финансы', content: 'Роль: Гуру бизнес-стратегии.\nЗадача: Разбери нишу и предложи 3 уникальных оффера...', createdAt: new Date().toISOString() },
          { id: 'tpl_3', type: 'signature', name: 'Подпись с хештегами', category: 'общие', content: 'Присылайте полученные варианты в комментариях!\n#бизнес #ии #промпт', createdAt: new Date().toISOString() }
        ];
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
      }
      if (!parsed.scenarios) {
        parsed.scenarios = [];
      }
      if (!parsed.scenarioLogs) {
        parsed.scenarioLogs = [];
      }
      if (!parsed.settings) {
        parsed.settings = {};
      }
      // Migration to the user's new Telegram Bot token
      if (!parsed.settings.telegramBotToken || parsed.settings.telegramBotToken === '7535924888:AAF4LY16DBtxYmyuTvzFUHZFi6nQBVWzUsU' || parsed.settings.telegramBotToken === '8804680831:AAF_QwiZqHlkiH884OnoE7lfjZ4P24IQE_A') {
        parsed.settings.telegramBotToken = '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
      }
      if (!parsed.settings.robokassa) {
        parsed.settings.robokassa = {
          merchantLogin: '',
          pass1: '',
          pass2: '',
          isTest: true
        };
      }
      if (!parsed.settings.protalkBotId || parsed.settings.protalkBotId === '14137' || parsed.settings.protalkBotId === '8142466188') {
        parsed.settings.protalkBotId = '66275';
      }
      if (!parsed.settings.protalkBotToken || parsed.settings.protalkBotToken === 'E1ZJEei4By6GcSUsJF2tIYvdDG3nGcaY') {
        parsed.settings.protalkBotToken = 'GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE';
      }
      // Remove default/demo users and keep ONLY admin ID: 169262990
      if (parsed.users && Array.isArray(parsed.users)) {
        const initialCount = parsed.users.length;
        parsed.users = parsed.users.filter((u: any) => 
          u.id === '169262990' || 
          u.telegramId === 169262990 || 
          String(u.telegramId) === '169262990'
        );
        let changed = parsed.users.length !== initialCount;
        let found169 = false;
        parsed.users.forEach((u: any) => {
          if (u.balance === undefined) {
            u.balance = 1000;
            changed = true;
          }
          if (u.telegramId === 169262990 || String(u.telegramId) === '169262990' || u.id === '169262990') {
            found169 = true;
            if (u.role !== 'admin') { u.role = 'admin'; changed = true; }
            if (u.email !== 'shishkarnem@gmail.com') { u.email = 'shishkarnem@gmail.com'; changed = true; }
            const expectedHash = hashPassword('wkL35eTm');
            if (u.passwordHash !== expectedHash) { u.passwordHash = expectedHash; changed = true; }
          }
        });
        if (!found169) {
          parsed.users.push({
            id: '169262990',
            telegramId: 169262990,
            email: 'shishkarnem@gmail.com',
            passwordHash: hashPassword('wkL35eTm'),
            role: 'admin',
            firstName: 'Прохор',
            username: 'shishkarnem',
            createdAt: new Date().toISOString(),
            balance: 1000
          });
          changed = true;
        }
        if (changed) {
          fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
        }
      }
      return parsed;
    } catch (e) {
      console.error('Error reading database file, resetting', e);
      return {
        users: [],
        prompts: [],
        publications: [],
        dayRequests: INITIAL_DAY_REQUESTS,
        publicationLogs: [],
        settings: {
          telegramBotToken: '',
          channelId: '@SAV_AI',
          backupChannelId: '@SAVPartnerBot',
          autoPostSchedule: false,
          autoPostTime: '07:00',
          theme: 'dark',
          protalkBotId: '66275',
          protalkBotToken: 'GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE'
        },
        channels: [],
        templates: [],
        scenarios: [],
        scenarioLogs: []
      };
    }
  }

  private static save(data: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  }

  // Users
  static getUsers(): User[] {
    const sqliteRows = fetchAllUsersFromSQLite();
    if (sqliteRows && sqliteRows.length > 0) {
      const users: User[] = sqliteRows.map(row => {
        const telegramId = row.telegram_id ? Number(row.telegram_id) : undefined;
        let id = String(row.id || '').trim();
        if (!id || id === '169262990' || (telegramId === 169262990 && id.length !== 11)) {
          id = '16926299042';
        }
        const email = row.email || (id === '16926299042' || telegramId === 169262990 ? 'shishkarnem@gmail.com' : undefined);
        const passwordHash = row.password_hash || (id === '16926299042' || telegramId === 169262990 ? 'wkL35eTm' : undefined);
        const role = row.role || (id === '16926299042' || telegramId === 169262990 ? 'admin' : 'user');

        const userAvatar = row.user_avatar || (row as any).userAvatar || undefined;
        const finalPhoto = userAvatar || row.photo_url || '';

        return {
          id,
          email,
          passwordHash,
          role,
          telegramId,
          firstName: row.first_name || '',
          lastName: row.last_name || '',
          username: row.username || '',
          photoUrl: finalPhoto,
          avatarUrl: finalPhoto,
          userAvatar,
          user_avatar: userAvatar,
          bio: row.bio || '',
          status: (row.status as any) || 'Активный',
          tariff: row.tariff || (row.role === 'admin' ? 'Космос' : 'Старт'),
          balance: row.balance !== undefined && row.balance !== null ? Number(row.balance) : 1000,
          referredBy: row.referred_by 
            ? (isNaN(Number(row.referred_by)) ? String(row.referred_by) : Number(row.referred_by)) 
            : (row.referredBy ? row.referredBy : ((id === '16926299042' || id === '169262990' || telegramId === 169262990) ? 80926979801 : ((id === '16187387221' || id === '1618738722' || telegramId === 1618738722) ? 16926299042 : undefined))),
          referralRewardBalance: row.referral_reward_balance !== undefined && row.referral_reward_balance !== null ? Number(row.referral_reward_balance) : 0,
          createdAt: row.created_at || new Date().toISOString()
        };
      });

      const db = this.load();
      db.users = users;
      this.save(db);

      return users;
    }

    return this.load().users;
  }

  static getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  }

  static getUserByTelegramId(telegramId: number): User | undefined {
    return this.getUsers().find(u => u.telegramId === telegramId);
  }

  static getUserById(id: string): User | undefined {
    const cleanId = String(id || '').trim();
    return this.getUsers().find(u => u.id === cleanId);
  }

  static addUser(user: User) {
    if (!user.id || user.id.length !== 11 || !/^\d{11}$/.test(user.id)) {
      user.id = String(Math.floor(10000000000 + Math.random() * 90000000000));
    }
    const db = this.load();
    const existingIndex = db.users.findIndex(u => u.id === user.id || (user.telegramId && u.telegramId === user.telegramId));
    if (existingIndex !== -1) {
      db.users[existingIndex] = { ...db.users[existingIndex], ...user };
    } else {
      db.users.push(user);
    }
    this.save(db);

    insertRow('users', {
      id: user.id,
      email: user.email,
      password_hash: user.passwordHash,
      role: user.role,
      telegram_id: user.telegramId,
      first_name: user.firstName,
      last_name: user.lastName,
      username: user.username,
      photo_url: user.photoUrl,
      balance: user.balance !== undefined ? user.balance : 1000,
      created_at: user.createdAt || new Date().toISOString()
    }).catch(() => null);
  }

  static updateUser(id: string, updated: Partial<User>): User {
    const db = this.load();
    const index = db.users.findIndex(u => u.id === id);
    let updatedUser: User;
    if (index !== -1) {
      db.users[index] = { ...db.users[index], ...updated };
      updatedUser = db.users[index];
      this.save(db);
    } else {
      updatedUser = {
        id,
        role: updated.role || 'editor',
        createdAt: new Date().toISOString(),
        ...updated
      };
      db.users.push(updatedUser);
      this.save(db);
    }

    // Sync to SQLite users table
    const sqlRow: Record<string, any> = {};
    if (updatedUser.email !== undefined) sqlRow.email = updatedUser.email;
    if (updatedUser.passwordHash !== undefined) sqlRow.password_hash = updatedUser.passwordHash;
    if (updatedUser.role !== undefined) sqlRow.role = updatedUser.role;
    if (updatedUser.telegramId !== undefined) sqlRow.telegram_id = updatedUser.telegramId;
    if (updatedUser.firstName !== undefined) sqlRow.first_name = updatedUser.firstName;
    if (updatedUser.lastName !== undefined) sqlRow.last_name = updatedUser.lastName;
    if (updatedUser.username !== undefined) sqlRow.username = updatedUser.username;
    if (updatedUser.photoUrl !== undefined) sqlRow.photo_url = updatedUser.photoUrl;
    if (updatedUser.userAvatar !== undefined || (updatedUser as any).user_avatar !== undefined) {
      sqlRow.user_avatar = updatedUser.userAvatar || (updatedUser as any).user_avatar;
    }
    if (updatedUser.balance !== undefined) sqlRow.balance = updatedUser.balance;
    if (updatedUser.timezone !== undefined) sqlRow.timezone = updatedUser.timezone;

    updateRow('users', id, sqlRow).catch(() => null);

    return updatedUser;
  }

  static deleteUser(id: string) {
    const db = this.load();
    db.users = db.users.filter(u => u.id !== id);
    this.save(db);
    deleteRow('users', id).catch(() => null);
  }

  // DayRequests
  static getDayRequests(userId?: string): DayRequest[] {
    const sqliteRows = fetchAllPostsFromSQLite();
    if (sqliteRows && sqliteRows.length > 0) {
      const normUser = userId ? normalizeUserId(userId) : '';
      let filteredRows = sqliteRows;
      if (normUser) {
        filteredRows = sqliteRows.filter(row => {
          const rowUser = row.user_id ? normalizeUserId(row.user_id) : '';
          return !rowUser || rowUser === normUser || rowUser === '16926299042';
        });
      }
      return filteredRows.map(row => {
        let channels: string[] = ['@SAV_AI'];
        if (row.channels) {
          try {
            const parsed = typeof row.channels === 'string' ? JSON.parse(row.channels) : row.channels;
            if (Array.isArray(parsed) && parsed.length > 0) channels = parsed;
          } catch (e) {
            if (typeof row.channels === 'string') channels = [row.channels];
          }
        } else if (row.channel) {
          channels = [row.channel];
        }

        let attachmentUrls: string[] = [];
        if (row.attachment_urls) {
          try {
            const parsed = typeof row.attachment_urls === 'string' ? JSON.parse(row.attachment_urls) : row.attachment_urls;
            if (Array.isArray(parsed)) attachmentUrls = parsed;
          } catch (e) {
            attachmentUrls = [];
          }
        }

        let triggerSchedule: any = { enabled: false };
        if (row.trigger_schedule) {
          try {
            triggerSchedule = typeof row.trigger_schedule === 'string' ? JSON.parse(row.trigger_schedule) : row.trigger_schedule;
          } catch (e) {
            triggerSchedule = { enabled: false };
          }
        }

        return {
          id: String(row.id || ''),
          userId: row.user_id ? normalizeUserId(row.user_id) : '16926299042',
          title: row.title || 'Новый пост без названия',
          category: row.category || 'общее',
          dayOfWeek: row.day_of_week || '',
          requestTemplate: row.request_template || '',
          postText: row.post_text || '',
          channel: row.channel || channels[0] || '@SAV_AI',
          channels: channels,
          signature: row.signature !== null && row.signature !== undefined ? String(row.signature) : '',
          messageFormat: row.message_format || 'v2',
          uppercaseHeader: row.uppercase_header !== 0 && row.uppercase_header !== false,
          attachmentType: row.attachment_type || 'none',
          attachmentUrl: row.attachment_url || '',
          attachmentUrls: attachmentUrls,
          inlineButtons: [],
          uniquenessMemoryCount: 0,
          triggerSchedule: triggerSchedule,
          status: row.status || 'создается',
          createdAt: row.created_at || new Date().toISOString()
        };
      });
    }

    let allPosts = this.load().dayRequests;
    if (userId) {
      const normUser = normalizeUserId(userId);
      allPosts = allPosts.filter(p => !p.userId || normalizeUserId(p.userId) === normUser || normalizeUserId(p.userId) === '16926299042');
    }
    return allPosts;
  }

  static addDayRequest(req: Omit<DayRequest, 'id'> & { id?: string; userId?: string }): DayRequest {
    const db = this.load();
    const effectiveUserId = normalizeUserId(req.userId || '16926299042');
    const newReq: DayRequest = {
      id: req.id || ('req_' + Math.random().toString(36).substr(2, 8)),
      status: req.status || 'создается',
      userId: effectiveUserId,
      ...req
    };
    db.dayRequests.push(newReq);
    this.save(db);

    // Sync to SQLite posts table
    insertRow('posts', {
      id: newReq.id,
      user_id: effectiveUserId,
      title: newReq.title || 'Новый пост без названия',
      category: newReq.category || 'общее',
      request_template: newReq.requestTemplate || '',
      post_text: newReq.postText || '',
      channel: newReq.channel || '@SAV_AI',
      channels: newReq.channels ? JSON.stringify(newReq.channels) : JSON.stringify([newReq.channel || '@SAV_AI']),
      message_format: newReq.messageFormat || 'v2',
      signature: newReq.signature || '',
      attachment_type: newReq.attachmentType || 'none',
      attachment_url: newReq.attachmentUrl || '',
      attachment_urls: newReq.attachmentUrls ? JSON.stringify(newReq.attachmentUrls) : '[]',
      status: newReq.status || 'создается',
      trigger_schedule: newReq.triggerSchedule ? JSON.stringify(newReq.triggerSchedule) : JSON.stringify({ enabled: false }),
      created_at: new Date().toISOString()
    }).catch(() => null);

    // Only log actual sent/published publications to history
    if (newReq.status === 'sent' || newReq.status === 'published') {
      insertRow('history', {
        id: 'hist_' + Math.random().toString(36).substr(2, 8),
        post_id: newReq.id,
        action: 'Публикация поста: ' + (newReq.title || 'Новый пост'),
        details: newReq.postText || newReq.requestTemplate || 'Пост опубликован',
        user_id: effectiveUserId,
        created_at: new Date().toISOString()
      }).catch(() => null);
    }

    syncPostCronTask(newReq.id, newReq, effectiveUserId);

    return newReq;
  }

  static updateDayRequest(id: string, updated: Partial<DayRequest>): DayRequest {
    const db = this.load();
    const cleanId = String(id || '').trim();
    const strippedId = cleanId.replace(/^req_/, '');

    let resultReq: DayRequest | null = null;
    let index = db.dayRequests.findIndex(r => {
      const rid = String(r.id || '').trim();
      return rid === cleanId || rid === strippedId || ('req_' + rid) === cleanId || rid.replace(/^req_/, '') === strippedId;
    });

    if (index !== -1) {
      db.dayRequests[index] = { ...db.dayRequests[index], ...updated };
      this.save(db);
      resultReq = db.dayRequests[index];
    } else {
      const newReq: DayRequest = {
        id: cleanId,
        dayOfWeek: updated.dayOfWeek || 'Сегодня',
        category: updated.category || 'Общее',
        requestTemplate: updated.requestTemplate !== undefined ? updated.requestTemplate : '',
        channel: updated.channel || '@SAV_AI',
        title: updated.title || 'Новый пост',
        signature: updated.signature || '',
        ...updated
      };
      db.dayRequests.push(newReq);
      this.save(db);
      resultReq = newReq;
    }

    if (resultReq) {
      const sqlFields: Record<string, any> = {
        title: resultReq.title,
        category: resultReq.category,
        request_template: resultReq.requestTemplate,
        post_text: resultReq.postText !== undefined ? resultReq.postText : '',
        channel: resultReq.channel,
        channels: resultReq.channels ? JSON.stringify(resultReq.channels) : undefined,
        message_format: resultReq.messageFormat,
        signature: resultReq.signature,
        attachment_type: resultReq.attachmentType,
        attachment_url: resultReq.attachmentUrl,
        attachment_urls: resultReq.attachmentUrls ? JSON.stringify(resultReq.attachmentUrls) : undefined,
        status: resultReq.status,
        trigger_schedule: resultReq.triggerSchedule ? JSON.stringify(resultReq.triggerSchedule) : undefined
      };
      if (resultReq.userId) {
        sqlFields.user_id = resultReq.userId;
      }
      updateRow('posts', resultReq.id, sqlFields).catch(() => null);

      syncPostCronTask(resultReq.id, resultReq, resultReq.userId);

      // Only log to SQLite history table when sent or published
      if (updated.status === 'sent' || updated.status === 'published') {
        insertRow('history', {
          id: 'hist_' + Math.random().toString(36).substr(2, 8),
          post_id: resultReq.id,
          action: 'Отправка поста: ' + (resultReq.title || 'Пост'),
          details: resultReq.postText || resultReq.requestTemplate || 'Пост отправлен',
          user_id: resultReq.userId || '',
          created_at: new Date().toISOString()
        }).catch(() => null);
      }
    }

    return resultReq!;
  }

  static deleteDayRequest(id: string) {
    const db = this.load();
    const cleanId = String(id || '').trim();
    const strippedId = cleanId.replace(/^req_/, '');

    deleteRow('posts', cleanId).catch(() => null);
    deleteRow('prompts', cleanId).catch(() => null);

    if (db.dayRequests) {
      db.dayRequests = db.dayRequests.filter(r => {
        const rid = String(r.id || '').trim();
        return rid !== cleanId && rid !== strippedId && ('req_' + rid) !== cleanId && rid.replace(/^req_/, '') !== strippedId;
      });
    }
    if (db.prompts) {
      db.prompts = db.prompts.filter(p => {
        const pid = String(p.id || '').trim();
        return pid !== cleanId && pid !== strippedId && ('req_' + pid) !== cleanId && pid.replace(/^req_/, '') !== strippedId;
      });
    }
    if (db.publications) {
      db.publications = db.publications.filter(pub => {
        const pbid = String(pub.id || '').trim();
        return pbid !== cleanId && pbid !== strippedId && ('pub_' + pbid) !== cleanId && pbid.replace(/^pub_/, '') !== strippedId;
      });
    }
    this.save(db);
  }

  // Prompts
  static getPrompts(): Prompt[] {
    return this.load().prompts;
  }

  static addPrompt(prompt: Omit<Prompt, 'id' | 'createdAt'>): Prompt {
    const db = this.load();
    const newPrompt: Prompt = {
      ...prompt,
      id: 'prompt_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    db.prompts.push(newPrompt);
    this.save(db);
    return newPrompt;
  }

  static updatePrompt(id: string, updated: Partial<Prompt>): Prompt {
    const db = this.load();
    const index = db.prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      db.prompts[index] = { ...db.prompts[index], ...updated };
      this.save(db);
      return db.prompts[index];
    }
    throw new Error('Prompt not found');
  }

  static deletePrompt(id: string) {
    const db = this.load();
    const cleanId = String(id || '').trim();
    if (db.prompts) {
      db.prompts = db.prompts.filter(p => String(p.id || '').trim() !== cleanId);
    }
    if (db.dayRequests) {
      db.dayRequests = db.dayRequests.filter(r => String(r.id || '').trim() !== cleanId);
    }
    this.save(db);
  }

  // Publications
  static getPublications(userId?: string): Publication[] {
    let pubs = this.load().publications || [];
    if (userId) {
      pubs = pubs.filter(p => String(p.userId) === String(userId));
    }
    return pubs;
  }

  static addPublication(pub: Partial<Publication> & Omit<Publication, 'id' | 'publishedAt'> & { publishedAt?: string }): Publication {
    const db = this.load();
    if (!db.publications) db.publications = [];
    const newPub: Publication = {
      ...pub,
      id: 'pub_' + Math.random().toString(36).substr(2, 9),
      publishedAt: pub.publishedAt || new Date().toISOString()
    };
    db.publications.unshift(newPub); // newest first
    this.save(db);

    insertRow('history', {
      id: newPub.id,
      post_id: newPub.promptId || newPub.id,
      action: newPub.promptTitle || 'Публикация',
      details: newPub.text,
      user_id: newPub.userId || '',
      created_at: newPub.publishedAt
    }).catch(() => null);

    return newPub;
  }

  static deletePublication(id: string) {
    const db = this.load();
    const cleanId = String(id || '').trim();
    const strippedId = cleanId.replace(/^pub_/, '');
    if (db.publications) {
      db.publications = db.publications.filter(p => {
        const pid = String(p.id || '').trim();
        return pid !== cleanId && pid !== strippedId && ('pub_' + pid) !== cleanId && pid.replace(/^pub_/, '') !== strippedId;
      });
      this.save(db);
    }
    deleteRow('history', cleanId).catch(() => null);
  }

  // Settings
  static getSettings(): Settings {
    return this.load().settings;
  }

  static updateSettings(updated: Partial<Settings>): Settings {
    const db = this.load();
    db.settings = { ...db.settings, ...updated };
    this.save(db);
    return db.settings;
  }

  // PublicationLogs
  static getLogs(): PublicationLog[] {
    return this.load().publicationLogs || [];
  }

  static addLog(log: Omit<PublicationLog, 'id' | 'timestamp'>) {
    const db = this.load();
    if (!db.publicationLogs) db.publicationLogs = [];
    const newLog: PublicationLog = {
      ...log,
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    db.publicationLogs.push(newLog);
    this.save(db);
  }

  static deletePublicationLog(id: string) {
    const db = this.load();
    const cleanId = String(id || '').trim();
    if (db.publicationLogs) {
      db.publicationLogs = db.publicationLogs.filter(l => String(l.id || '').trim() !== cleanId);
      this.save(db);
    }
  }

  // Channels CRUD
  static getChannels(userId?: string): Channel[] {
    const sqliteRows = fetchAllChannelsFromSQLite();
    if (sqliteRows && sqliteRows.length > 0) {
      const channels: Channel[] = sqliteRows.map(row => ({
        id: String(row.id),
        userId: normalizeUserId(row.user_id || '16926299042'),
        name: row.name || 'Telegram канал',
        username: row.username || '@channel',
        telegramId: row.telegram_id || '',
        isActive: row.is_active === 1 || row.is_active === true,
        subscribersCount: Number(row.subscribers_count || 0),
        inviteLink: row.invite_link || '',
        description: row.description || '',
        photoUrl: row.photo_url || row.photoUrl || '',
        platform: 'telegram',
        status: (row.is_active === 1 || row.is_active === true) ? 'connected' : 'disconnected'
      }));
      if (userId) {
        const canonicalUserId = normalizeUserId(userId);
        const shortId = canonicalUserId.replace(/\d$/, '');
        const filtered = channels.filter(c => 
          c.userId === canonicalUserId || 
          c.userId === shortId || 
          (canonicalUserId === '16926299042' && (c.userId === '16926299042' || c.userId === '169262990'))
        );
        if (filtered.length > 0) return filtered;
      }
      return channels;
    }

    let channels = this.load().channels || [];
    if (userId) {
      const canonicalUserId = normalizeUserId(userId);
      channels = channels.filter(c => normalizeUserId(c.userId) === canonicalUserId);
    }
    return channels;
  }

  static addChannel(channel: Omit<Channel, 'id'>): Channel {
    const db = this.load();
    const canonicalUserId = normalizeUserId(channel.userId);
    const newChannel: Channel = {
      ...channel,
      userId: canonicalUserId,
      id: 'ch_' + Math.random().toString(36).substr(2, 9)
    };
    db.channels.push(newChannel);
    this.save(db);

    insertRow('channels', {
      id: newChannel.id,
      user_id: canonicalUserId,
      name: newChannel.name,
      username: newChannel.username,
      telegram_id: newChannel.telegramId || '',
      is_active: newChannel.isActive ? 1 : 0,
      subscribers_count: newChannel.subscribersCount || 0,
      invite_link: newChannel.inviteLink || '',
      description: newChannel.description || '',
      photo_url: newChannel.photoUrl || ''
    }).catch(() => null);

    return newChannel;
  }

  static updateChannel(id: string, updated: Partial<Channel>): Channel {
    const db = this.load();
    const index = db.channels.findIndex(c => c.id === id);
    if (index !== -1) {
      if (updated.userId) {
        updated.userId = normalizeUserId(updated.userId);
      }
      db.channels[index] = { ...db.channels[index], ...updated };
      this.save(db);

      const ch = db.channels[index];
      const canonicalUserId = normalizeUserId(ch.userId);
      updateRow('channels', id, {
        user_id: canonicalUserId,
        name: ch.name,
        username: ch.username,
        telegram_id: ch.telegramId || '',
        is_active: ch.isActive ? 1 : 0,
        subscribers_count: ch.subscribersCount || 0,
        invite_link: ch.inviteLink || '',
        description: ch.description || '',
        photo_url: ch.photoUrl || ''
      }).catch(() => null);

      return db.channels[index];
    }
    throw new Error('Channel not found');
  }

  static deleteChannel(id: string) {
    const db = this.load();
    db.channels = db.channels.filter(c => c.id !== id);
    this.save(db);

    deleteRow('channels', id).catch(() => null);
  }

  // Templates CRUD
  static getTemplates(): PostTemplate[] {
    return this.load().templates || [];
  }

  static addTemplate(template: Omit<PostTemplate, 'id' | 'createdAt'>): PostTemplate {
    const db = this.load();
    if (!db.templates) db.templates = [];
    const newTpl: PostTemplate = {
      ...template,
      id: 'tpl_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    db.templates.push(newTpl);
    this.save(db);
    return newTpl;
  }

  static deleteTemplate(id: string) {
    const db = this.load();
    if (db.templates) {
      db.templates = db.templates.filter(t => t.id !== id);
      this.save(db);
    }
  }

  // Scenarios CRUD
  static getScenarios(userId?: string): Scenario[] {
    let scenarios = this.load().scenarios || [];
    if (userId) {
      scenarios = scenarios.filter(s => !s.userId || String(s.userId) === String(userId));
    }
    return scenarios;
  }

  static addScenario(scenario: Omit<Scenario, 'id' | 'createdAt'>): Scenario {
    const db = this.load();
    if (!db.scenarios) db.scenarios = [];
    const newScenario: Scenario = {
      ...scenario,
      id: 'scen_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    db.scenarios.push(newScenario);
    this.save(db);
    return newScenario;
  }

  static updateScenario(id: string, updated: Partial<Scenario>): Scenario {
    const db = this.load();
    if (!db.scenarios) db.scenarios = [];
    const index = db.scenarios.findIndex(s => s.id === id);
    if (index !== -1) {
      db.scenarios[index] = { ...db.scenarios[index], ...updated };
      this.save(db);
      return db.scenarios[index];
    }
    throw new Error('Scenario not found');
  }

  static deleteScenario(id: string) {
    const db = this.load();
    if (db.scenarios) {
      db.scenarios = db.scenarios.filter(s => s.id !== id);
      this.save(db);
    }
  }

  // Scenario Logs
  static getScenarioLogs(): ScenarioLog[] {
    return this.load().scenarioLogs || [];
  }

  static addScenarioLog(log: Omit<ScenarioLog, 'id' | 'runAt'>): ScenarioLog {
    const db = this.load();
    if (!db.scenarioLogs) db.scenarioLogs = [];
    const newLog: ScenarioLog = {
      ...log,
      id: 'slog_' + Math.random().toString(36).substr(2, 9),
      runAt: new Date().toISOString()
    };
    db.scenarioLogs.push(newLog);
    this.save(db);
    return newLog;
  }

  static deleteScenarioLog(id: string) {
    const db = this.load();
    const cleanId = String(id || '').trim();
    if (db.scenarioLogs) {
      db.scenarioLogs = db.scenarioLogs.filter(l => String(l.id || '').trim() !== cleanId);
      this.save(db);
    }
  }

  // Media Files CRUD
  static getFiles(userId?: string): MediaFile[] {
    const sqliteRows = fetchAllFilesFromSQLite();
    if (sqliteRows && sqliteRows.length > 0) {
      let files: MediaFile[] = sqliteRows.map(row => ({
        id: String(row.id || ''),
        userId: row.user_id ? String(row.user_id) : undefined,
        originalName: row.original_name || row.name || '',
        name: row.name || '',
        fullUrl: row.full_url || '',
        shortKey: row.short_key || '',
        shortUrl: row.short_url || '',
        fileType: (row.file_type || 'file') as any,
        mimeType: row.mime_type || '',
        fileSize: row.file_size ? Number(row.file_size) : 0,
        sizeFormatted: row.size_formatted || '',
        width: row.width ? Number(row.width) : undefined,
        height: row.height ? Number(row.height) : undefined,
        aspectRatio: row.aspect_ratio ? Number(row.aspect_ratio) : undefined,
        createdAt: row.created_at || new Date().toISOString()
      }));

      // Sync to database.json as secondary storage
      const db = this.load();
      db.files = files;
      this.save(db);

      if (userId) {
        files = files.filter(f => !f.userId || String(f.userId) === String(userId));
      }
      return files;
    }

    let files = this.load().files || [];
    if (userId) {
      files = files.filter(f => !f.userId || String(f.userId) === String(userId));
    }
    return files;
  }

  static getFileByShortKey(key: string): MediaFile | undefined {
    const files = this.getFiles();
    const cleanKey = String(key || '').trim();
    return files.find(f => f.shortKey === cleanKey || f.id === cleanKey || f.fullUrl.includes(cleanKey));
  }

  static addFile(file: Omit<MediaFile, 'id' | 'createdAt'> & { id?: string }): MediaFile {
    const db = this.load();
    if (!db.files) db.files = [];
    const newFile: MediaFile = {
      ...file,
      id: file.id || ('file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
      createdAt: new Date().toISOString()
    };
    db.files.unshift(newFile); // Newest first
    this.save(db);

    insertRow('files', {
      id: newFile.id,
      user_id: newFile.userId || '',
      original_name: newFile.originalName,
      name: newFile.name,
      full_url: newFile.fullUrl,
      short_key: newFile.shortKey,
      short_url: newFile.shortUrl,
      file_type: newFile.fileType,
      mime_type: newFile.mimeType || '',
      file_size: newFile.fileSize || 0,
      size_formatted: newFile.sizeFormatted || '',
      width: newFile.width || 0,
      height: newFile.height || 0,
      aspect_ratio: newFile.aspectRatio || 1,
      created_at: newFile.createdAt
    }).catch(() => null);

    return newFile;
  }

  static deleteFile(id: string) {
    const db = this.load();
    const cleanId = String(id || '').trim();
    if (db.files) {
      db.files = db.files.filter(f => f.id !== cleanId && f.shortKey !== cleanId);
      this.save(db);
    }
    deleteRow('files', cleanId).catch(() => null);
  }

  static getSyncSQLiteDB() {
    return getSyncSQLiteDB();
  }

  static getSystemPrompts(): SystemPrompt[] {
    const sqliteDB = getSyncSQLiteDB();
    if (sqliteDB) {
      try {
        const rows = sqliteDB.exec("SELECT * FROM system_prompts ORDER BY rowid ASC");
        if (rows && rows[0] && rows[0].values) {
          return rows[0].values.map((v: any) => ({
            id: String(v[0]),
            scenarioKey: String(v[1]),
            title: String(v[2]),
            promptText: String(v[3]),
            description: String(v[4] || ''),
            createdAt: String(v[5] || new Date().toISOString())
          }));
        }
      } catch (e) {
        console.warn('[DB] getSystemPrompts error:', e);
      }
    }
    return [];
  }

  static getSystemPromptByKey(key: string): SystemPrompt | undefined {
    const prompts = this.getSystemPrompts();
    return prompts.find(p => p.scenarioKey === key || p.id === key);
  }

  static updateSystemPrompt(idOrKey: string, promptText: string, title?: string): SystemPrompt | undefined {
    const sqliteDB = getSyncSQLiteDB();
    const prompts = this.getSystemPrompts();
    const target = prompts.find(p => p.id === idOrKey || p.scenarioKey === idOrKey);
    if (!target) return undefined;

    target.promptText = promptText;
    if (title) target.title = title;

    if (sqliteDB) {
      try {
        sqliteDB.run(
          "UPDATE system_prompts SET prompt_text = ?, title = ? WHERE id = ? OR scenario_key = ?",
          [target.promptText, target.title, target.id, target.scenarioKey]
        );
      } catch (e) {
        console.error('[DB] updateSystemPrompt error:', e);
      }
    }
    return target;
  }
}

