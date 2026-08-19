import { Router, Request, Response } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import nodemailer from 'nodemailer';
import { DB, Prompt, DayRequest, Publication, Settings, User, Channel } from './db';

const uploadMiddleware = multer({ storage: multer.memoryStorage() });
import { generateProkhorPrompt, generateImagePromptFromPost, generateProTalkImage, callProTalkBotApi, generateTopicFromHistory } from './protalk';
import { sendPromptToTelegram, sendPrivateTelegramNotification } from './telegram';
import { 
  getAllTablesInfo, getTableRows, insertRow, updateRow, deleteRow, executeRawSQL, importCSVRows,
  fetchAllBlogPostsFromSQLite, fetchBlogPostByIdFromSQLite, createBlogPostInSQLite, updateBlogPostInSQLite,
  deleteBlogPostFromSQLite, incrementBlogPostViewsInSQLite, incrementBlogPostLikesInSQLite, getBotTokenFromSQLite, getBotDetailsFromSQLite,
  getSQLiteDB, fetchAllUsersFromSQLite, saveSQLiteDB, normalizeUserId
} from './sqlite';
import { getAllTariffsFromDb, getTariffById, createOrUpdateTariffInDb, deleteTariffFromDb } from './db/tariffsTable';
import { getUserByIdFromDb, getUserByTelegramIdFromDb, insertOrUpdateUserInDb, checkAndSyncReferralTransactions, reconcileAllUserBalancesFromTransactions, checkAndApplyStartRegistrationBonus } from './db/usersTable';
import { getUserNotificationsFromDb, markNotificationAsReadInDb, markAllNotificationsAsReadInDb, createNotificationInDb } from './db/notificationsTable';
import { addTransactionWithBalanceUpdate, getUserTransactionsFromDb, getAllTransactionsFromDb } from './db/transactionsTable';
import { 
  ensureDefaultFoldersForUser, getFoldersForUser, registerFileInStorage,
  getStorageFilesForUser, slugifyFilename
} from './db/filesTable';
import { 
  getTeamsByOwnerOrMember, seedDefaultTeams, addMemberToTeamInDb, 
  removeMemberFromTeamInDb, TeamMember, createTeamInDb, updateTeamInDb, 
  deleteTeamInDb, getAllTeamsFromDb, getTeamById, TeamRecord,
  findUserInDb, syncTeamChannelsFromDb 
} from './db/teamsTable';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export const apiRouter = Router();

// ==========================================
// BLOG POSTS SQLITE API ENDPOINTS
// ==========================================
apiRouter.get('/blog/posts', (req: Request, res: Response) => {
  try {
    const posts = fetchAllBlogPostsFromSQLite();
    res.json({ success: true, posts });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка при получении постов из SQLite DB: ' + err.message });
  }
});

apiRouter.get('/blog/posts/:id', (req: Request, res: Response) => {
  try {
    const post = fetchBlogPostByIdFromSQLite(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: 'Пост не найден' });
      return;
    }
    res.json({ success: true, post });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка получения поста: ' + err.message });
  }
});

apiRouter.post('/blog/posts', (req: Request, res: Response) => {
  try {
    const post = createBlogPostInSQLite(req.body);
    res.json({ success: true, post });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка создания поста в SQLite: ' + err.message });
  }
});

apiRouter.put('/blog/posts/:id', (req: Request, res: Response) => {
  try {
    const updated = updateBlogPostInSQLite(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Пост не найден' });
      return;
    }
    res.json({ success: true, post: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка обновления поста в SQLite: ' + err.message });
  }
});

apiRouter.delete('/blog/posts/:id', (req: Request, res: Response) => {
  try {
    const success = deleteBlogPostFromSQLite(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка удаления поста: ' + err.message });
  }
});

apiRouter.post('/blog/posts/:id/view', (req: Request, res: Response) => {
  try {
    const views = incrementBlogPostViewsInSQLite(req.params.id);
    res.json({ success: true, views });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/blog/posts/:id/like', (req: Request, res: Response) => {
  try {
    const likes = incrementBlogPostLikesInSQLite(req.params.id);
    res.json({ success: true, likes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SMTP Helper for sending emails (password reset, welcome email)
async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
  const host = process.env.SMTP_HOST || 'mail.hosting.reg.ru';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || 'info@arenda-ropa.com';
  const pass = process.env.SMTP_PASS || 'pass12345';
  const from = process.env.SMTP_FROM || '"ИИSMM" <info@arenda-ropa.com>';

  if (user && pass && pass !== 'pass12345') {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    return await transporter.sendMail({
      from,
      to,
      subject,
      text: text || subject,
      html
    });
  } else {
    // Try sending with default auth if user is provided
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });

      return await transporter.sendMail({
        from,
        to,
        subject,
        text: text || subject,
        html
      });
    } catch (err) {
      console.log(`[SMTP Email Log] Fallback log for email to ${to}: ${subject}`);
      return { messageId: 'simulated-' + Date.now() };
    }
  }
}

// ==========================================
// ROBOKASSA PAYMENT INTEGRATION ENDPOINTS
// ==========================================
apiRouter.get('/payments/robokassa/config', (req: Request, res: Response) => {
  try {
    const settings = DB.getSettings();
    const robokassa = settings.robokassa || { merchantLogin: '', pass1: '', pass2: '', isTest: true };
    res.json({
      success: true,
      config: {
        merchantLogin: robokassa.merchantLogin || '',
        pass1Set: Boolean(robokassa.pass1),
        pass2Set: Boolean(robokassa.pass2),
        isTest: robokassa.isTest !== false
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/payments/robokassa/config', (req: Request, res: Response) => {
  try {
    const { merchantLogin, pass1, pass2, isTest } = req.body;
    const settings = DB.getSettings();
    const currentRobokassa = settings.robokassa || { merchantLogin: '', pass1: '', pass2: '', isTest: true };

    const updatedRobokassa = {
      merchantLogin: merchantLogin !== undefined ? String(merchantLogin).trim() : currentRobokassa.merchantLogin,
      pass1: (pass1 !== undefined && pass1 !== '********') ? String(pass1).trim() : currentRobokassa.pass1,
      pass2: (pass2 !== undefined && pass2 !== '********') ? String(pass2).trim() : currentRobokassa.pass2,
      isTest: isTest !== undefined ? Boolean(isTest) : currentRobokassa.isTest
    };

    DB.updateSettings({ robokassa: updatedRobokassa });
    res.json({ success: true, message: 'Настройки Робокассы успешно сохранены!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/payments/robokassa/create', (req: Request, res: Response) => {
  try {
    const { amount, tariffName, userId, description } = req.body;
    const settings = DB.getSettings();
    const robokassa = settings.robokassa || { merchantLogin: '', pass1: '', pass2: '', isTest: true };
    
    const merchantLogin = robokassa.merchantLogin || 'iismm_merchant';
    const pass1 = robokassa.pass1 || 'pass1_placeholder';
    const isTest = robokassa.isTest !== false;
    
    const numAmount = parseFloat(amount) || 0;
    const outSum = numAmount.toFixed(2);
    const invId = Math.floor(Date.now() / 1000);
    const shpTariff = tariffName || 'custom';
    const shpUserId = String(userId || '169262990');
    const desc = description || `Оплата услуг ИИSMM: ${tariffName || 'Пополнение баланса'}`;

    // MD5 signature calculation per Robokassa spec:
    // SignatureValue = md5(MerchantLogin:OutSum:InvId:Pass1:shp_tariff=...:shp_user_id=...)
    const signatureRaw = `${merchantLogin}:${outSum}:${invId}:${pass1}:shp_tariff=${shpTariff}:shp_user_id=${shpUserId}`;
    const signature = crypto.createHash('md5').update(signatureRaw).digest('hex');

    const paymentUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=${encodeURIComponent(merchantLogin)}&OutSum=${outSum}&InvId=${invId}&Description=${encodeURIComponent(desc)}&SignatureValue=${signature}&shp_tariff=${encodeURIComponent(shpTariff)}&shp_user_id=${encodeURIComponent(shpUserId)}${isTest ? '&IsTest=1' : ''}`;

    res.json({
      success: true,
      paymentUrl,
      invId,
      outSum,
      signature,
      merchantLogin,
      isTest
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/payments/robokassa/simulate-success', async (req: Request, res: Response) => {
  try {
    const { userId, amount, tariffName } = req.body;
    const numAmount = parseFloat(amount) || 0;
    const cleanUserId = normalizeUserId(userId || '16926299042');
    const db = await getSQLiteDB();

    let txType: any = 'pay';
    let desc = `Пополнение баланса через Робокасса (+${numAmount} ИИрок)`;
    let targetTariff = '';

    if (tariffName && !tariffName.includes('Пополнение') && tariffName.toLowerCase() !== 'custom') {
      txType = 'pay';
      desc = `Оплата тарифа «${tariffName}» (+${numAmount} ИИрок)`;
      const lower = tariffName.toLowerCase();
      if (lower.includes('разгон')) targetTariff = 'Разгон';
      else if (lower.includes('отрыв')) targetTariff = 'Отрыв';
      else if (lower.includes('космос')) targetTariff = 'Космос';
    }

    const result = addTransactionWithBalanceUpdate(db, {
      userId: cleanUserId,
      type: txType,
      balanceType: 'pay',
      amount: numAmount,
      description: desc
    });

    if (targetTariff) {
      db.run("UPDATE users SET tariff = ? WHERE id = ?", [targetTariff, cleanUserId]);
    }

    saveSQLiteDB();

    res.json({
      success: true,
      transaction: result.transaction,
      newBalances: result.newBalances,
      message: `Платеж на сумму ${numAmount} ₽ успешно зачислен! Ваш баланс пополнен на +${numAmount} ИИрок.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory token store for password resets
const resetTokensStore = new Map<string, { userId: string; email: string; expiresAt: number }>();

// Helper for hashing password (sha256)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Authentication
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Пожалуйста, введите E-mail и пароль' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = DB.getUserByEmail(cleanEmail);

  if (!user) {
    res.status(404).json({
      error: 'Пользователь с такой почтой не найден. Регистрация нового аккаунта на сайте невозможна. Зарегистрируйтесь через Telegram Mini App по ссылке t.me/IIrkiBot/app и привяжите почту в профиле (/profile).'
    });
    return;
  }

  if (!user.passwordHash || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: 'Неверный пароль' });
    return;
  }

  // Trigger check and start bonus for Email registration
  getSQLiteDB().then(db => {
    const resCheck = checkAndApplyStartRegistrationBonus(db, user.id, 'email');
    if (resCheck.applied) {
      saveSQLiteDB();
    }
  }).catch(() => null);

  res.json({
    success: true,
    user: {
      id: user.id,
      telegramId: user.telegramId,
      email: user.email,
      role: user.role,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      photoUrl: user.photoUrl || '',
      balance: user.balance || 0,
      createdAt: user.createdAt
    }
  });
});

function handleAutoJoinTeamInvite(db: any, user: any, rawParam?: string | null) {
  if (!rawParam || !user) return;
  try {
    const code = String(rawParam).trim();
    if (!code) return;
    const team = getTeamById(db, code);
    if (team) {
      const cleanUserId = normalizeUserId(user.id || user.telegramId);
      const isAlreadyMember = Array.isArray(team.members) && team.members.some((m: any) => 
        normalizeUserId(m.userId) === cleanUserId || (m.telegramId && String(m.telegramId) === cleanUserId)
      );
      if (!isAlreadyMember && team.ownerId !== cleanUserId) {
        const newMember: TeamMember = {
          userId: String(user.id),
          telegramId: user.telegramId || user.telegram_id,
          handle: user.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : `@user_${user.id}`,
          name: `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || user.username || 'Пользователь',
          joinedAt: new Date().toISOString(),
          status: 'active',
          role: 'Участник'
        };
        addMemberToTeamInDb(db, team.id, newMember);
        saveSQLiteDB();
      }
    }
  } catch (e) {
    console.error('[Auth AutoJoin] Team invite joining error:', e);
  }
}

apiRouter.post('/auth/telegram', async (req: Request, res: Response) => {
  const { telegramId, firstName, lastName, password, username, photoUrl, initData } = req.body;
  
  const botToken = DB.getSettings().telegramBotToken || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';
  let verifiedTgUser: any = null;
  let startParam: string | null = req.body.startParam || req.body.ref || null;

  // Telegram Mini App HASH verification
  if (initData && typeof initData === 'string' && initData.includes('hash=')) {
    try {
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');
      if (params.get('start_param')) {
        startParam = params.get('start_param');
      }
      if (hash) {
        params.delete('hash');
        const sortedKeys = Array.from(params.keys()).sort();
        const dataCheckString = sortedKeys.map(key => `${key}=${params.get(key)}`).join('\n');
        
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (calculatedHash === hash) {
          const userStr = params.get('user');
          if (userStr) {
            verifiedTgUser = JSON.parse(userStr);
          }
        } else {
          console.warn('[Telegram Auth] HASH validation mismatch for initData');
        }
      }
    } catch (e) {
      console.error('[Telegram Auth] initData parsing error:', e);
    }
  }

  const rawTgId = verifiedTgUser?.id ? String(verifiedTgUser.id) : (telegramId ? String(telegramId) : '');
  if (!rawTgId) {
    res.status(400).json({ error: 'Telegram ID или авторизационные данные Telegram недоступны' });
    return;
  }

  const parsedTelegramId = parseInt(rawTgId, 10);
  if (isNaN(parsedTelegramId)) {
    res.status(400).json({ error: 'Некорректный Telegram ID' });
    return;
  }

  let user = DB.getUserByTelegramId(parsedTelegramId);
  const userRole = user ? user.role : (parsedTelegramId === 169262990 ? 'admin' : 'editor');

  const updateFields: any = {
    firstName: verifiedTgUser?.first_name || (firstName !== undefined ? firstName : (user ? user.firstName : '')),
    lastName: verifiedTgUser?.last_name || (lastName !== undefined ? lastName : (user ? user.lastName : '')),
    username: verifiedTgUser?.username || (username !== undefined ? username : (user ? user.username : '')),
    photoUrl: verifiedTgUser?.photo_url || (photoUrl !== undefined ? photoUrl : (user ? user.photoUrl : '')),
    role: userRole
  };

  if (parsedTelegramId === 169262990) {
    updateFields.email = user?.email || 'shishkarnem@gmail.com';
    updateFields.passwordHash = user?.passwordHash || hashPassword('wkL35eTm');
    updateFields.role = 'admin';
  }

  if (password && password.trim() !== '') {
    updateFields.passwordHash = hashPassword(password.trim());
  }

  if (user) {
    const updated = DB.updateUser(user.id, updateFields);
    // Sync to SQLite
    updateRow('users', user.id, {
      id: user.id,
      telegram_id: parsedTelegramId,
      first_name: updated.firstName,
      last_name: updated.lastName,
      username: updated.username,
      photo_url: updated.photoUrl,
      email: updated.email,
      password_hash: updated.passwordHash,
      role: updated.role
    }).catch(() => null);

    // Trigger registration bonus check for Telegram login
    getSQLiteDB().then(db => {
      const resCheck = checkAndApplyStartRegistrationBonus(db, user.id, 'telegram');
      if (resCheck.applied) {
        saveSQLiteDB();
      }
    }).catch(() => null);

    res.json({
      success: true,
      user: {
        id: user.id,
        telegramId: updated.telegramId,
        firstName: updated.firstName,
        lastName: updated.lastName,
        username: updated.username,
        photoUrl: updated.photoUrl,
        email: updated.email,
        role: updated.role,
        createdAt: updated.createdAt,
        balance: updated.balance || 0
      }
    });
  } else {
    // New registration via Telegram Mini App (11-digit ID)
    const generatedId = parsedTelegramId === 169262990 ? '16926299042' : String(Math.floor(10000000000 + Math.random() * 89999999999));
    const newUser: any = {
      id: generatedId,
      telegramId: parsedTelegramId,
      firstName: updateFields.firstName || '',
      lastName: updateFields.lastName || '',
      username: updateFields.username || '',
      photoUrl: updateFields.photoUrl || '',
      email: parsedTelegramId === 169262990 ? 'shishkarnem@gmail.com' : '',
      passwordHash: parsedTelegramId === 169262990 ? 'wkL35eTm' : (password && password.trim() !== '' ? password.trim() : ''),
      role: userRole,
      tariff: 'Космос',
      createdAt: new Date().toISOString(),
      balance: parsedTelegramId === 169262990 ? 1000 : 300,
      referredBy: startParam ? parseInt(startParam, 10) : null
    };
    
    DB.addUser(newUser);

    // If referred, credit referrer +300 Iirky!
    if (startParam) {
      const refId = parseInt(startParam, 10);
      if (!isNaN(refId)) {
        const referrer = DB.getUserByTelegramId(refId) || DB.getUserById(String(refId));
        if (referrer) {
          const newRefBal = (referrer.balance || 0) + 300;
          DB.updateUser(referrer.id, {
            balance: newRefBal
          });
          updateRow('users', referrer.id, { balance: newRefBal }).catch(() => null);
          insertRow('transactions', {
            id: `tx_ref_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            user_id: referrer.id,
            amount: 300,
            type: 'referral_bonus',
            description: `Бонус +300 ИИрок за приглашение реферала @${newUser.username || newUser.id}`,
            created_at: new Date().toISOString()
          }).catch(() => null);
        }
      }
    }

    insertRow('users', {
      id: newUser.id,
      telegram_id: newUser.telegramId,
      first_name: newUser.firstName,
      last_name: newUser.lastName,
      username: newUser.username,
      photo_url: newUser.photoUrl,
      email: newUser.email,
      password_hash: newUser.passwordHash,
      role: newUser.role,
      balance: newUser.balance,
      referred_by: newUser.referredBy,
      created_at: newUser.createdAt
    }).catch(() => null);

    try {
      getSQLiteDB().then(db => handleAutoJoinTeamInvite(db, newUser, startParam));
    } catch (e) {}

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        telegramId: newUser.telegramId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        photoUrl: newUser.photoUrl,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        balance: newUser.balance
      }
    });
  }
});

// Telegram WebApp (TWA) Strict HMAC-SHA256 Auth & Registration Endpoint
apiRouter.post('/auth/telegram-twa', async (req: Request, res: Response) => {
  const { initData, phone, email, latitude, longitude, bio } = req.body;
  
  if (!initData || typeof initData !== 'string') {
    res.status(401).json({ error: 'Не переданы данные initData' });
    return;
  }

  const botToken = getBotTokenFromSQLite() || process.env.TELEGRAM_BOT_TOKEN || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';
  let isValid = false;
  let parsedUser: any = null;
  let startParam: string | null = null;

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    startParam = urlParams.get('start_param') || req.body.startParam || req.body.ref || null;

    if (hash) {
      urlParams.delete('hash');
      const sortedPairs: string[] = [];
      urlParams.forEach((val, key) => {
        sortedPairs.push(`${key}=${val}`);
      });
      sortedPairs.sort();
      const dataCheckString = sortedPairs.join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      if (calculatedHash === hash) {
        isValid = true;
        const userJson = urlParams.get('user');
        if (userJson) {
          parsedUser = JSON.parse(userJson);
        }
      } else {
        console.warn('[TWA Auth] HASH mismatch for Telegram WebApp initData');
      }
    }
  } catch (err) {
    console.error('[TWA Auth] Ошибка валидации initData:', err);
  }

  if (!isValid) {
    res.status(401).json({ error: 'Invalid initData: ошибка проверки криптографического HMAC подписи' });
    return;
  }

  if (!parsedUser || !parsedUser.id) {
    res.status(400).json({ error: 'В initData отсутствует объект пользователя Telegram' });
    return;
  }

  const telegramId = parsedUser.id;
  const firstName = parsedUser.first_name || '';
  const lastName = parsedUser.last_name || '';
  const username = parsedUser.username || '';
  const photoUrl = parsedUser.photo_url || '';
  const profileLink = username ? `https://t.me/${username}` : `https://t.me/c/${telegramId}`;
  const isPremium = parsedUser.is_premium ? 1 : 0;
  const languageCode = parsedUser.language_code || 'ru';
  const allowsWriteToPm = parsedUser.allows_write_to_pm ? 1 : 0;

  let referredBy: number | null = null;
  let utmSource: string | null = null;
  let utmMedium: string | null = null;
  let utmCampaign: string | null = null;

  if (startParam) {
    if (!isNaN(parseInt(startParam, 10))) {
      referredBy = parseInt(startParam, 10);
    } else {
      const matchRef = startParam.match(/(\d+)/);
      if (matchRef) referredBy = parseInt(matchRef[1], 10);
      const utmMatch = startParam.match(/utm_source=([^&_]+)/);
      if (utmMatch) utmSource = utmMatch[1];
      const utmMedMatch = startParam.match(/utm_medium=([^&_]+)/);
      if (utmMedMatch) utmMedium = utmMedMatch[1];
      const utmCampMatch = startParam.match(/utm_campaign=([^&_]+)/);
      if (utmCampMatch) utmCampaign = utmCampMatch[1];
    }
  }

  const existingUser = DB.getUserByTelegramId(telegramId) || DB.getUserById(String(telegramId));
  const nowStr = new Date().toISOString();
  const role = telegramId === 169262990 ? 'admin' : (existingUser?.role || 'editor');

  if (existingUser) {
    const updatedUser = DB.updateUser(existingUser.id, {
      firstName: firstName || existingUser.firstName,
      lastName: lastName || existingUser.lastName,
      telegramUsername: username || existingUser.telegramUsername,
      photoUrl: existingUser.userAvatar || (existingUser as any).user_avatar || photoUrl || existingUser.photoUrl,
      profileLink,
      bio: bio || existingUser.bio,
      isPremium: !!isPremium,
      languageCode: languageCode || existingUser.languageCode,
      phone: phone || existingUser.phone,
      email: email || existingUser.email,
      allowsWriteToPm: !!allowsWriteToPm,
      latitude: latitude ?? existingUser.latitude,
      longitude: longitude ?? existingUser.longitude,
      lastLogin: nowStr,
      role
    });

    updateRow('users', existingUser.id, {
      first_name: updatedUser.firstName,
      last_name: updatedUser.lastName,
      username: updatedUser.telegramUsername,
      photo_url: updatedUser.photoUrl,
      profile_link: profileLink,
      bio: updatedUser.bio,
      is_premium: isPremium,
      language_code: languageCode,
      phone: updatedUser.phone,
      email: updatedUser.email,
      allows_write_to_pm: allowsWriteToPm,
      latitude: updatedUser.latitude,
      longitude: updatedUser.longitude,
      last_login: nowStr,
      role
    }).catch(() => null);

    // Trigger registration bonus check for TWA login
    getSQLiteDB().then(db => {
      const resCheck = checkAndApplyStartRegistrationBonus(db, existingUser.id, 'telegram');
      if (resCheck.applied) {
        saveSQLiteDB();
      }
    }).catch(() => null);

    res.json({
      success: true,
      token: `twa_jwt_${telegramId}_${Date.now()}`,
      user: updatedUser
    });
  } else {
    const generatedId = (telegramId && telegramId === 169262990) ? '16926299042' : String(Math.floor(10000000000 + Math.random() * 89999999999));
    const newUser: any = {
      id: generatedId,
      telegramId,
      name: `${firstName} ${lastName}`.trim() || username || `User_${telegramId}`,
      firstName,
      lastName,
      telegramUsername: username,
      photoUrl,
      profileLink,
      bio: bio || '',
      isPremium: !!isPremium,
      languageCode,
      phone: phone || null,
      email: email || (telegramId === 169262990 ? 'shishkarnem@gmail.com' : ''),
      passwordHash: telegramId === 169262990 ? 'wkL35eTm' : '',
      tariff: 'Космос',
      allowsWriteToPm: !!allowsWriteToPm,
      latitude: latitude || null,
      longitude: longitude || null,
      referredBy,
      utmSource,
      utmMedium,
      utmCampaign,
      referralRewardBalance: 0.0,
      balance: 1000,
      iirky: 1000,
      tokens: 100000,
      balanceRub: 0,
      earningsRub: 0,
      role,
      createdAt: nowStr,
      lastLogin: nowStr
    };

    DB.addUser(newUser);

    // Referral bonus: +300 ИИрок to referrer
    if (referredBy && !isNaN(referredBy)) {
      const referrer = DB.getUserByTelegramId(referredBy) || DB.getUserById(String(referredBy));
      if (referrer) {
        const newRefBal = (referrer.referralRewardBalance || 0) + 300;
        const newBal = (referrer.balance || 0) + 300;
        DB.updateUser(referrer.id, {
          balance: newBal,
          referralRewardBalance: newRefBal,
          iirky: (referrer.iirky || 0) + 300
        });

        updateRow('users', referrer.id, {
          balance: newBal,
          referral_reward_balance: newRefBal
        }).catch(() => null);

        insertRow('transactions', {
          id: `tx_ref_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          user_id: referrer.id,
          amount: 300,
          type: 'referral_bonus',
          description: `Бонус +300 ИИрок за приглашенного пользователя @${username || telegramId}`,
          created_at: nowStr
        }).catch(() => null);
      }
    }

    insertRow('users', {
      id: newUser.id,
      telegram_id: newUser.telegramId,
      first_name: newUser.firstName,
      last_name: newUser.lastName,
      username: newUser.telegramUsername,
      photo_url: newUser.photoUrl,
      profile_link: newUser.profileLink,
      bio: newUser.bio,
      is_premium: isPremium,
      language_code: newUser.languageCode,
      phone: newUser.phone,
      email: newUser.email,
      password_hash: newUser.passwordHash,
      allows_write_to_pm: allowsWriteToPm,
      latitude: newUser.latitude,
      longitude: newUser.longitude,
      referred_by: newUser.referredBy,
      utm_source: newUser.utmSource,
      utm_medium: newUser.utmMedium,
      utm_campaign: newUser.utmCampaign,
      referral_reward_balance: 0.0,
      balance: newUser.balance,
      role: newUser.role,
      created_at: newUser.createdAt,
      last_login: newUser.lastLogin
    }).catch(() => null);

    try {
      getSQLiteDB().then(db => handleAutoJoinTeamInvite(db, newUser, startParam));
    } catch (e) {}

    res.status(201).json({
      success: true,
      token: `twa_jwt_${telegramId}_${Date.now()}`,
      user: newUser
    });
  }
});

// Avatar streaming/caching endpoint (returns direct image/jpeg binary with inline headers)
const avatarCache = new Map<string, { buffer: Buffer; mime: string; timestamp: number }>();

apiRouter.get(['/avatar/:telegramId', '/avatar/:telegramId.jpg', '/avatar/:telegramId.png'], async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const cleanId = (telegramId || '').replace(/[^0-9]/g, '');

  if (!cleanId) {
    res.redirect('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80');
    return;
  }

  // Cache check (1 hour TTL)
  const cached = avatarCache.get(cleanId);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    res.setHeader('Content-Type', cached.mime || 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="avatar_${cleanId}.jpg"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(cached.buffer);
    return;
  }

  const settings = DB.getSettings();
  const token = settings.telegramBotToken || getBotTokenFromSQLite() || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';

  if (token) {
    try {
      const photoRes = await fetch(`https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${cleanId}&limit=1`);
      const photoData: any = await photoRes.json();

      if (photoData.ok && photoData.result?.total_count > 0) {
        const photosArr = photoData.result.photos[0];
        const mediumPhoto = photosArr[Math.min(1, photosArr.length - 1)];
        const fileId = mediumPhoto.file_id;

        const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
        const fileData: any = await fileRes.json();

        if (fileData.ok && fileData.result?.file_path) {
          const imgUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
          const imgBufferRes = await fetch(imgUrl);
          if (imgBufferRes.ok) {
            const arrayBuffer = await imgBufferRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = imgBufferRes.headers.get('content-type') || 'image/jpeg';
            avatarCache.set(cleanId, { buffer, mime: contentType, timestamp: Date.now() });

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="avatar_${cleanId}.jpg"`);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.send(buffer);
            return;
          }
        }
      }
    } catch (e) {
      console.error(`Error fetching avatar for ${cleanId}:`, e);
    }
  }

  res.redirect('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80');
});

// Sync Telegram user profile photos via Telegram Bot API (getUserProfilePhotos)
apiRouter.post('/users/sync-telegram-photos', async (req: Request, res: Response) => {
  try {
    const settings = DB.getSettings();
    const token = settings.telegramBotToken || getBotTokenFromSQLite() || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';

    if (!token) {
      res.status(400).json({ error: 'Токен Telegram бота не настроен в системе' });
      return;
    }

    const allUsers = DB.getUsers();
    let syncedCount = 0;
    let noPhotoCount = 0;
    let notStartedCount = 0;
    let errorsCount = 0;
    const details: any[] = [];

    for (const user of allUsers) {
      if (!user.telegramId) continue;
      
      try {
        const photoRes = await fetch(`https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${user.telegramId}&limit=1`);
        const photoData: any = await photoRes.json();

        if (photoData.ok && photoData.result && photoData.result.total_count > 0) {
          const realPhotoUrl = `/api/avatar/${user.telegramId}`;
          
          if (!user.userAvatar && !(user as any).user_avatar) {
            DB.updateUser(user.id, { photoUrl: realPhotoUrl });
            updateRow('users', user.id, { photo_url: realPhotoUrl }).catch(() => null);
          }

          syncedCount++;
          details.push({ telegramId: user.telegramId, username: user.username, status: 'synced', photoUrl: realPhotoUrl });
        } else if (photoData.ok && photoData.result && photoData.result.total_count === 0) {
          noPhotoCount++;
          details.push({ telegramId: user.telegramId, username: user.username, status: 'no_photo_or_private' });
        } else {
          notStartedCount++;
          details.push({ telegramId: user.telegramId, username: user.username, status: 'not_started_or_blocked', description: photoData.description });
        }
      } catch (err: any) {
        errorsCount++;
        details.push({ telegramId: user.telegramId, username: user.username, status: 'error', error: err.message });
      }

      await new Promise(resolve => setTimeout(resolve, 30));
    }

    res.json({
      success: true,
      message: `Синхронизация завершена. Успешно обновлено: ${syncedCount}, Нет фото/приватный профиль: ${noPhotoCount}, Бот не активирован пользователем: ${notStartedCount}, Ошибок: ${errorsCount}`,
      stats: {
        totalUsers: allUsers.length,
        syncedCount,
        noPhotoCount,
        notStartedCount,
        errorsCount
      },
      details: details.slice(0, 50)
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка синхронизации аватарок: ' + err.message });
  }
});

// Referral Stats Endpoint
apiRouter.get('/referrals/stats', (req: Request, res: Response) => {
  const telegramId = req.query.telegramId ? parseInt(String(req.query.telegramId), 10) : null;
  const userId = req.query.userId ? String(req.query.userId) : null;

  const users = DB.getUsers();
  let currentUser = null;
  if (telegramId) currentUser = users.find(u => u.telegramId === telegramId);
  if (!currentUser && userId) currentUser = users.find(u => u.id === userId);

  if (!currentUser) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  const currentIdStr = String(currentUser.id);
  const currentTgStr = currentUser.telegramId ? String(currentUser.telegramId) : '';

  let invitedUsers = users
    .filter(u => {
      // Exclude self
      const uIdStr = String(u.id);
      const uTgStr = u.telegramId ? String(u.telegramId) : '';
      if (uIdStr === currentIdStr || (currentTgStr && (uIdStr === currentTgStr || uTgStr === currentTgStr))) return false;

      if (!u.referredBy) return false;
      const refStr = String(u.referredBy);
      if (refStr === currentIdStr || (currentTgStr && refStr === currentTgStr)) return true;
      if ((currentIdStr === '16926299042' || currentTgStr === '169262990') && (refStr === '16926299042' || refStr === '169262990')) return true;
      if ((currentIdStr === '80926979801' || currentTgStr === '8092697980') && (refStr === '80926979801' || refStr === '8092697980')) return true;
      return false;
    })
    .map(u => ({
      id: u.id,
      telegramId: u.telegramId,
      firstName: u.firstName || u.name || `Пользователь ${u.id}`,
      username: u.telegramUsername || u.username,
      photoUrl: u.photoUrl,
      createdAt: u.createdAt || new Date().toISOString()
    }));

  let referrerInfo = null;
  let refCode = currentUser.referredBy;
  if (!refCode && (currentIdStr === '16926299042' || currentTgStr === '169262990')) {
    refCode = '80926979801';
  }
  if (!refCode && (currentIdStr === '16187387221' || currentTgStr === '1618738722')) {
    refCode = '16926299042';
  }

  if (refCode) {
    const refCodeStr = String(refCode);
    const ref = users.find(u => 
      String(u.id) === refCodeStr || 
      String(u.telegramId) === refCodeStr ||
      (refCodeStr.startsWith('8092697980') && (String(u.id).startsWith('8092697980') || u.telegramId === 8092697980)) ||
      (refCodeStr.startsWith('169262990') && (String(u.id).startsWith('169262990') || u.telegramId === 169262990))
    );
    if (ref) {
      referrerInfo = {
        id: ref.id,
        telegramId: ref.telegramId || (isNaN(Number(ref.id)) ? undefined : Number(ref.id)),
        firstName: ref.firstName || ref.name || `Пользователь ${ref.id}`,
        username: ref.telegramUsername || ref.username
      };
    } else {
      referrerInfo = {
        id: refCodeStr,
        telegramId: isNaN(Number(refCodeStr)) ? undefined : Number(refCodeStr),
        firstName: `Пользователь ${refCodeStr}`,
        username: undefined
      };
    }
  }

  res.json({
    referralLink: `https://t.me/IIrkiBot/app?startapp=${currentUser.telegramId || currentUser.id || '169262990'}`,
    referralRewardBalance: currentUser.referralRewardBalance || 0.0,
    invitedCount: invitedUsers.length,
    invitedUsers,
    referredBy: referrerInfo
  });
});

// Teams API Endpoints
apiRouter.get('/teams', async (req: Request, res: Response) => {
  try {
    const rawUserId = req.query.userId ? String(req.query.userId) : (req.query.telegramId ? String(req.query.telegramId) : '16926299042');
    const userId = normalizeUserId(rawUserId);
    const db = await getSQLiteDB();

    const teams = getTeamsByOwnerOrMember(db, userId);
    let team = teams[0] || null;

    if (!team && (userId === '16926299042' || userId === '169262990')) {
      const recheck = getTeamsByOwnerOrMember(db, '16926299042');
      team = recheck[0] || null;
    }

    if (team) {
      // Sync channels from 'channels' table for all participants
      const syncedChannels = syncTeamChannelsFromDb(db, team.id);
      team.channels = syncedChannels;
    }

    // Also get all distinct channels from SQLite channels table
    let allTeamChannels: Channel[] = [];
    if (team) {
      const allUserIds = new Set<string>();
      if (team.ownerId) allUserIds.add(team.ownerId);
      if (Array.isArray(team.members)) {
        team.members.forEach((m: any) => {
          if (m.userId) allUserIds.add(String(m.userId));
          if (m.telegramId) allUserIds.add(String(m.telegramId));
        });
      }
      allUserIds.add('16926299042');
      allUserIds.add('169262990');

      try {
        const inClause = Array.from(allUserIds).map(id => `'${id}'`).join(',');
        const sqlRes = db.exec(`SELECT * FROM channels WHERE user_id IN (${inClause}) OR user_id IS NULL OR user_id = ''`);
        if (sqlRes && sqlRes.length > 0 && sqlRes[0].values) {
          const cols = sqlRes[0].columns;
          sqlRes[0].values.forEach(row => {
            const chObj: any = {};
            cols.forEach((col, i) => chObj[col] = row[i]);
            if (chObj.username || chObj.name) {
              allTeamChannels.push({
                id: String(chObj.id),
                userId: normalizeUserId(chObj.user_id),
                name: chObj.name || chObj.username,
                username: chObj.username || chObj.name,
                telegramId: chObj.telegram_id || '',
                subscribersCount: chObj.subscribers_count || 0,
                isActive: chObj.is_active !== undefined ? Boolean(chObj.is_active) : true,
                isPremium: true,
                inviteLink: chObj.invite_link || '',
                description: chObj.description || '',
                status: chObj.is_active ? 'connected' : 'disconnected'
              });
            }
          });
        }
      } catch (e) {}
    }

    // Deduplicate channels
    const seen = new Set<string>();
    const deduplicatedChannels: Channel[] = [];
    allTeamChannels.forEach(c => {
      const key = (c.username || c.name || c.id).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduplicatedChannels.push(c);
      }
    });

    res.json({
      success: true,
      team,
      dbChannels: deduplicatedChannels
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка при получении данных команды: ' + err.message });
  }
});

// Get all teams in database
apiRouter.get('/teams/all', async (req: Request, res: Response) => {
  try {
    const db = await getSQLiteDB();
    const teams = getAllTeamsFromDb(db);
    res.json({ success: true, teams });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка при получении списка команд: ' + err.message });
  }
});

// Create new team
apiRouter.post('/teams', async (req: Request, res: Response) => {
  try {
    const { ownerId, name, inviteCode, channels, members } = req.body;
    const cleanOwnerId = normalizeUserId(ownerId || '16926299042');
    const db = await getSQLiteDB();

    const newTeam = createTeamInDb(db, {
      ownerId: cleanOwnerId,
      name: name || 'Новая SMM Команда',
      inviteCode: inviteCode || `team_${cleanOwnerId}_${Date.now()}`,
      channels: Array.isArray(channels) ? channels : [],
      members: Array.isArray(members) ? members : []
    });

    saveSQLiteDB();
    res.status(201).json({ success: true, team: newTeam });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка при создании команды: ' + err.message });
  }
});

// Update team details
apiRouter.put('/teams/:id', async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id;
    const { name, channels, members, ownerId, inviteCode } = req.body;
    const db = await getSQLiteDB();

    const updated = updateTeamInDb(db, teamId, {
      name,
      channels,
      members,
      ownerId,
      inviteCode
    });

    if (!updated) {
      res.status(404).json({ error: 'Команда не найдена' });
      return;
    }

    saveSQLiteDB();
    res.json({ success: true, team: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка при обновлении команды: ' + err.message });
  }
});

// Delete team from SQLite
apiRouter.delete('/teams/:id', async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id;
    const db = await getSQLiteDB();
    const ok = deleteTeamInDb(db, teamId);
    saveSQLiteDB();
    res.json({ success: ok, id: teamId });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка при удалении команды: ' + err.message });
  }
});

// Update team channels
apiRouter.put('/teams/:id/channels', async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id;
    const { channels } = req.body;
    const db = await getSQLiteDB();

    const updated = updateTeamInDb(db, teamId, { channels: Array.isArray(channels) ? channels : [] });
    saveSQLiteDB();
    res.json({ success: true, team: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка при обновлении каналов команды: ' + err.message });
  }
});

// Check user in database before adding to team
apiRouter.get('/teams/check-user', async (req: Request, res: Response) => {
  try {
    const rawHandle = String(req.query.handle || req.query.query || req.query.username || '').trim();
    if (!rawHandle) {
      return res.json({ success: true, found: false, user: null });
    }

    const db = await getSQLiteDB();
    const matchedUser = findUserInDb(db, rawHandle);

    if (!matchedUser) {
      return res.json({ 
        success: true, 
        found: false, 
        user: null, 
        message: `Пользователь ${rawHandle.startsWith('@') ? rawHandle : '@' + rawHandle} не найден в базе данных сервиса` 
      });
    }

    // Privacy & blacklist checks
    const allowInvites = matchedUser.allow_team_invites !== 0 && matchedUser.allow_team_invites !== false && matchedUser.allow_team_invites !== '0';
    let blacklist: string[] = [];
    try {
      if (matchedUser.team_blacklist) {
        blacklist = typeof matchedUser.team_blacklist === 'string' ? JSON.parse(matchedUser.team_blacklist) : matchedUser.team_blacklist;
      }
    } catch (e) {}

    const cleanUsername = matchedUser.username ? (matchedUser.username.startsWith('@') ? matchedUser.username : `@${matchedUser.username}`) : `@user_${matchedUser.id}`;
    const displayName = `${matchedUser.first_name || ''} ${matchedUser.last_name || ''}`.trim() || matchedUser.username || `Пользователь #${matchedUser.id}`;

    return res.json({
      success: true,
      found: true,
      user: {
        id: String(matchedUser.id),
        telegramId: matchedUser.telegram_id ? Number(matchedUser.telegram_id) : undefined,
        username: cleanUsername,
        firstName: matchedUser.first_name || '',
        lastName: matchedUser.last_name || '',
        displayName,
        photoUrl: matchedUser.photo_url || null,
        tariff: matchedUser.tariff || 'Старт',
        role: matchedUser.role || 'Пользователь',
        allowInvites,
        blacklist
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка проверки пользователя: ' + err.message });
  }
});

// Add member with strict user database validation & privacy & blacklist check
apiRouter.post('/teams/members', async (req: Request, res: Response) => {
  try {
    const { ownerId, username, handle, role, teamId } = req.body;
    const db = await getSQLiteDB();

    const rawHandle = (username || handle || '').replace(/^@/, '').trim();
    if (!rawHandle) {
      res.status(400).json({ error: 'Укажите @username или ID пользователя' });
      return;
    }

    // 1. Look up user in SQLite 'users' table - must exist in database!
    const matchedUser = findUserInDb(db, rawHandle);
    if (!matchedUser) {
      res.status(404).json({
        error: `Пользователь @${rawHandle} не найден в базе данных сервиса. Пользователь должен предварительно авторизоваться на сервисе или запустить Telegram-бота.`
      });
      return;
    }

    // 2. Check if user disabled team invites
    if (matchedUser.allow_team_invites === 0 || matchedUser.allow_team_invites === false || matchedUser.allow_team_invites === '0') {
      res.status(403).json({
        error: `Пользователь @${rawHandle} отключил возможность добавления себя в команды в настройках профиля.`
      });
      return;
    }

    // 3. Check if target user has blacklisted this team or owner
    let blacklist: string[] = [];
    try {
      if (matchedUser.team_blacklist) {
        blacklist = typeof matchedUser.team_blacklist === 'string' ? JSON.parse(matchedUser.team_blacklist) : matchedUser.team_blacklist;
      }
    } catch (e) {}

    const cleanOwnerId = normalizeUserId(ownerId || '16926299042');
    const cleanTeamId = teamId ? String(teamId) : `team_${cleanOwnerId}`;

    if (blacklist.includes(cleanTeamId) || blacklist.includes(cleanOwnerId)) {
      res.status(403).json({
        error: `Пользователь @${rawHandle} добавил эту команду в черный список.`
      });
      return;
    }

    const newMember: TeamMember = {
      userId: String(matchedUser.id),
      telegramId: matchedUser?.telegram_id ? Number(matchedUser.telegram_id) : undefined,
      handle: matchedUser?.username ? (matchedUser.username.startsWith('@') ? matchedUser.username : `@${matchedUser.username}`) : `@${rawHandle}`,
      name: (`${matchedUser.first_name || ''} ${matchedUser.last_name || ''}`.trim() || matchedUser.username || `@${rawHandle}`),
      joinedAt: new Date().toISOString(),
      status: 'active',
      role: role || 'Участник'
    };

    const updatedTeam = addMemberToTeamInDb(db, cleanTeamId, newMember);
    if (!updatedTeam) {
      res.status(400).json({ error: 'Не удалось добавить участника в команду' });
      return;
    }

    saveSQLiteDB();
    res.json({ success: true, team: updatedTeam, newMember });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка при добавлении участника в команду: ' + err.message });
  }
});

// Join team via invite code / link
apiRouter.post('/teams/join', async (req: Request, res: Response) => {
  try {
    const { inviteCode, userId } = req.body;
    if (!inviteCode || !userId) {
      res.status(400).json({ error: 'Не указан инвайт-код или ID пользователя' });
      return;
    }

    const cleanCode = String(inviteCode).trim();
    const cleanUserId = normalizeUserId(userId);
    const db = await getSQLiteDB();

    // Look up team by invite_code or id
    const team = getTeamById(db, cleanCode);
    if (!team) {
      res.status(404).json({ error: 'Команда по указанному инвайт-коду не найдена' });
      return;
    }

    // Verify user in SQLite
    const user = findUserInDb(db, cleanUserId);
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден в базе данных' });
      return;
    }

    // Check privacy
    if (user.allow_team_invites === 0 || user.allow_team_invites === false || user.allow_team_invites === '0') {
      res.status(403).json({ error: 'У вас в настройках включен запрет на приглашение в команды' });
      return;
    }

    // Check blacklist
    let blacklist: string[] = [];
    try {
      if (user.team_blacklist) {
        blacklist = typeof user.team_blacklist === 'string' ? JSON.parse(user.team_blacklist) : user.team_blacklist;
      }
    } catch (e) {}

    if (blacklist.includes(team.id) || blacklist.includes(team.ownerId)) {
      res.status(403).json({ error: 'Эта команда находится в вашем черном списке' });
      return;
    }

    const newMember: TeamMember = {
      userId: String(user.id),
      telegramId: user.telegram_id ? Number(user.telegram_id) : undefined,
      handle: user.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : `@user_${user.id}`,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || `Пользователь`,
      joinedAt: new Date().toISOString(),
      status: 'active',
      role: 'Участник'
    };

    const updatedTeam = addMemberToTeamInDb(db, team.id, newMember);
    saveSQLiteDB();

    res.json({ success: true, message: `Вы успешно присоединились к команде "${team.name}"!`, team: updatedTeam });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка при входе по инвайт-ссылке: ' + err.message });
  }
});

// Remove member from team
apiRouter.delete('/teams/members/:id', async (req: Request, res: Response) => {
  try {
    const memberId = req.params.id;
    const ownerId = (req.query.ownerId as string) || (req.query.teamId as string) || '16926299042';
    const db = await getSQLiteDB();

    const updatedTeam = removeMemberFromTeamInDb(db, ownerId, memberId);
    saveSQLiteDB();

    res.json({ success: true, team: updatedTeam });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка при удалении участника из команды: ' + err.message });
  }
});

// User Team Privacy Settings (GET / PUT)
apiRouter.get('/user/team-privacy', async (req: Request, res: Response) => {
  try {
    const rawUserId = req.query.userId ? String(req.query.userId) : '16926299042';
    const userId = normalizeUserId(rawUserId);
    const db = await getSQLiteDB();

    const user = findUserInDb(db, userId);
    if (!user) {
      res.json({ allowTeamInvites: true, teamBlacklist: [] });
      return;
    }

    const allowTeamInvites = user.allow_team_invites !== 0 && user.allow_team_invites !== '0' && user.allow_team_invites !== false;
    let teamBlacklist: string[] = [];
    try {
      if (user.team_blacklist) {
        teamBlacklist = typeof user.team_blacklist === 'string' ? JSON.parse(user.team_blacklist) : user.team_blacklist;
      }
    } catch (e) {}

    res.json({ allowTeamInvites, teamBlacklist });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка получения настроек приватности: ' + err.message });
  }
});

apiRouter.put('/user/team-privacy', async (req: Request, res: Response) => {
  try {
    const { userId, allowTeamInvites, teamBlacklist } = req.body;
    const cleanUserId = normalizeUserId(userId || '16926299042');
    const db = await getSQLiteDB();

    const allowVal = allowTeamInvites === false || allowTeamInvites === 0 ? 0 : 1;
    const blacklistVal = JSON.stringify(Array.isArray(teamBlacklist) ? teamBlacklist : []);

    db.run(
      `UPDATE users SET allow_team_invites = ?, team_blacklist = ? WHERE id = ? OR telegram_id = ?`,
      [allowVal, blacklistVal, cleanUserId, cleanUserId]
    );

    saveSQLiteDB();
    res.json({ success: true, allowTeamInvites: allowVal === 1, teamBlacklist: Array.isArray(teamBlacklist) ? teamBlacklist : [] });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка сохранения настроек приватности: ' + err.message });
  }
});

// Blacklist team for user
apiRouter.post('/teams/blacklist', async (req: Request, res: Response) => {
  try {
    const { userId, teamId } = req.body;
    if (!userId || !teamId) {
      res.status(400).json({ error: 'Не указан userId или teamId' });
      return;
    }

    const cleanUserId = normalizeUserId(userId);
    const db = await getSQLiteDB();
    const user = findUserInDb(db, cleanUserId);
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    let blacklist: string[] = [];
    try {
      if (user.team_blacklist) {
        blacklist = typeof user.team_blacklist === 'string' ? JSON.parse(user.team_blacklist) : user.team_blacklist;
      }
    } catch (e) {}

    if (!blacklist.includes(teamId)) {
      blacklist.push(teamId);
    }

    db.run(
      `UPDATE users SET team_blacklist = ? WHERE id = ? OR telegram_id = ?`,
      [JSON.stringify(blacklist), cleanUserId, cleanUserId]
    );

    // Also remove user from the team
    removeMemberFromTeamInDb(db, teamId, cleanUserId);

    saveSQLiteDB();
    res.json({ success: true, message: 'Команда добавлена в черный список', teamBlacklist: blacklist });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка добавления в черный список: ' + err.message });
  }
});

apiRouter.delete('/teams/blacklist/:teamId', async (req: Request, res: Response) => {
  try {
    const teamId = req.params.teamId;
    const rawUserId = req.query.userId as string;
    if (!rawUserId) {
      res.status(400).json({ error: 'Не указан userId' });
      return;
    }

    const cleanUserId = normalizeUserId(rawUserId);
    const db = await getSQLiteDB();
    const user = findUserInDb(db, cleanUserId);
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    let blacklist: string[] = [];
    try {
      if (user.team_blacklist) {
        blacklist = typeof user.team_blacklist === 'string' ? JSON.parse(user.team_blacklist) : user.team_blacklist;
      }
    } catch (e) {}

    blacklist = blacklist.filter(id => id !== teamId);

    db.run(
      `UPDATE users SET team_blacklist = ? WHERE id = ? OR telegram_id = ?`,
      [JSON.stringify(blacklist), cleanUserId, cleanUserId]
    );

    saveSQLiteDB();
    res.json({ success: true, message: 'Команда удалена из черного списка', teamBlacklist: blacklist });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка удаления из черного списка: ' + err.message });
  }
});

// Report Team to Admin in Telegram (16926299042)
apiRouter.post('/teams/report', async (req: Request, res: Response) => {
  try {
    const { reporterId, reporterName, teamId, teamName, ownerId, reason, details } = req.body;
    const db = await getSQLiteDB();

    const reportId = `rep_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();

    // 1. Save report in SQLite DB
    db.run(
      `INSERT INTO team_reports (id, reporter_id, reporter_name, team_id, team_name, owner_id, reason, details, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        String(reporterId || 'Unknown'),
        String(reporterName || 'Пользователь'),
        String(teamId || 'Unknown'),
        String(teamName || 'Без названия'),
        String(ownerId || 'Unknown'),
        String(reason || 'Жалоба на команду'),
        String(details || ''),
        'pending',
        createdAt
      ]
    );

    saveSQLiteDB();

    // 2. Send Telegram notification to service administrator 16926299042
    const adminTgId = 16926299042;
    const tgMessage = `🚨 <b>ЖАЛОБА НА КОМАНДУ В СЕРВИСЕ</b> 🚨\n\n` +
      `👤 <b>Заявитель:</b> ${reporterName || 'Пользователь'} (ID: <code>${reporterId}</code>)\n` +
      `👥 <b>Команда:</b> ${teamName || 'Без названия'} (ID: <code>${teamId}</code>)\n` +
      `👑 <b>Владелец команды:</b> <code>${ownerId}</code>\n` +
      `⚠️ <b>Причина:</b> <b>${reason || 'Не указана'}</b>\n` +
      `📝 <b>Комментарий:</b> ${details || 'Нет дополнительных деталей'}\n` +
      `🕒 <b>Дата:</b> ${new Date().toLocaleString('ru-RU')}`;

    try {
      await sendPrivateTelegramNotification(adminTgId, tgMessage);
    } catch (tgErr) {
      console.error('[Teams Report] Error sending Telegram alert to admin:', tgErr);
    }

    res.json({
      success: true,
      message: 'Жалоба успешно зафиксирована и отправлена администратору сервиса в Telegram (16926299042).'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка отправки жалобы: ' + err.message });
  }
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, password, firstName, username, ref, referredBy, startParam } = req.body;
  const referralCode = ref || referredBy || startParam;

  if (!email || !password) {
    res.status(400).json({ error: 'Пожалуйста, заполните E-mail и пароль' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
    res.status(400).json({ error: 'Введите корректный E-mail адрес' });
    return;
  }

  if (String(password).length < 4) {
    res.status(400).json({ error: 'Пароль должен содержать не менее 4 символов' });
    return;
  }

  const existingUser = DB.getUserByEmail(cleanEmail);
  if (existingUser) {
    res.status(400).json({ error: 'Пользователь с таким E-mail уже зарегистрирован. Воспользуйтесь входом.' });
    return;
  }

  const newId = String(Math.floor(10000000000 + Math.random() * 90000000000));
  const cleanUsername = username ? (String(username).startsWith('@') ? String(username) : `@${username}`) : `@${cleanEmail.split('@')[0]}`;
  const newUser: any = {
    id: newId,
    email: cleanEmail,
    passwordHash: hashPassword(String(password).trim()),
    firstName: firstName ? String(firstName).trim() : cleanEmail.split('@')[0],
    lastName: '',
    username: cleanUsername,
    role: 'editor',
    createdAt: new Date().toISOString(),
    balance: 300,
    referredBy: referralCode ? parseInt(String(referralCode), 10) : null
  };

  DB.addUser(newUser);

  // If referred, credit referrer +300 Iirky!
  if (referralCode) {
    const refId = parseInt(String(referralCode), 10);
    if (!isNaN(refId)) {
      const referrer = DB.getUserByTelegramId(refId) || DB.getUserById(String(refId));
      if (referrer) {
        const newRefBal = (referrer.balance || 0) + 300;
        DB.updateUser(referrer.id, {
          balance: newRefBal
        });
        updateRow('users', referrer.id, { balance: newRefBal }).catch(() => null);
        insertRow('transactions', {
          id: `tx_ref_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          user_id: referrer.id,
          amount: 300,
          type: 'referral_bonus',
          description: `Бонус +300 ИИрок за приглашение реферала ${cleanEmail}`,
          created_at: new Date().toISOString()
        }).catch(() => null);
      }
    }
  }

  insertRow('users', {
    id: newUser.id,
    first_name: newUser.firstName,
    last_name: newUser.lastName,
    username: newUser.username,
    email: newUser.email,
    password_hash: newUser.passwordHash,
    role: newUser.role,
    balance: newUser.balance,
    referred_by: newUser.referredBy,
    created_at: newUser.createdAt
  }).catch(() => null);

  try {
    getSQLiteDB().then(db => handleAutoJoinTeamInvite(db, newUser, referralCode));
  } catch (e) {}

  // Send welcome email via SMTP
  sendEmail({
    to: cleanEmail,
    subject: '🎉 Регистрация в ИИ SMM Платформе прошла успешно!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
        <h2 style="color: #ec4899; margin-top: 0;">Приветствуем на ИИ SMM Платформе!</h2>
        <p>Ваш аккаунт <strong>${cleanEmail}</strong> успешно зарегистрирован и сохранен в базе данных.</p>
        <div style="background: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px; color: #334155;">🎁 Вам начислено <strong>1,000,000 ИИрок (токенов)</strong> на стартовый баланс!</p>
        </div>
        <p style="font-size: 13px; color: #64748b;">Вы можете настраивать публикации, подключать телеграм-каналы и генерировать посты с помощью ИИ.</p>
        <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">ИИ SMM Автоматизация • ProTalk API</p>
      </div>
    `
  }).catch(err => console.error('[SMTP Error]:', err));

  res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      username: newUser.username,
      role: newUser.role,
      createdAt: newUser.createdAt,
      balance: newUser.balance
    }
  });
});

apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Пожалуйста, укажите ваш E-mail' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = DB.getUserByEmail(cleanEmail);

  if (!user) {
    res.status(404).json({ error: 'Пользователь с таким E-mail не найден в базе данных' });
    return;
  }

  // Generate token for link and 6-char code as backup
  const resetToken = crypto.randomBytes(24).toString('hex');
  const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Save in store for 1 hour
  resetTokensStore.set(resetToken, {
    userId: user.id,
    email: cleanEmail,
    expiresAt: Date.now() + 3600000
  });

  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    await sendEmail({
      to: cleanEmail,
      subject: '🔑 Восстановление пароля | ИИSMM',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 16px; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <h2 style="color: #0284c7; margin-top: 0; font-size: 20px;">Сброс пароля ИИSMM</h2>
          <p style="font-size: 14px; line-height: 1.5;">Здравствуйте, <strong>${user.firstName || user.username || cleanEmail}</strong>!</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">Вы запросили сброс пароля для вашего аккаунта на ИИSMM Платформе.</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(120deg, #38bdf8 0%, #0284c7 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
              🔑 Нажмите для сброса пароля ➔
            </a>
          </div>

          <div style="background: #f0f9ff; border: 1px dashed #0284c7; padding: 14px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <span style="font-size: 11px; color: #0369a1; font-weight: bold; display: block; margin-bottom: 4px;">ИЛИ ВВЕДИТЕ КОД НА СТРАНИЦЕ СБРОСА:</span>
            <strong style="font-size: 22px; color: #0284c7; letter-spacing: 2px; font-family: monospace;">${resetCode}</strong>
          </div>

          <p style="font-size: 12px; color: #64748b;">Ссылка действительна в течение 1 часа. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
          <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">ИИSMM Автоматизация • info@arenda-ropa.com</p>
        </div>
      `
    });

    res.json({
      success: true,
      resetToken,
      resetCode,
      message: `Инструкция и кнопка сброса пароля отправлены на ${cleanEmail} via SMTP!`
    });
  } catch (err: any) {
    console.error('[SMTP Reset Exception]:', err);
    res.json({
      success: true,
      resetToken,
      resetCode,
      message: `Ключ сброса сформирован. Перейдите на страницу /reset-password?token=${resetToken}`
    });
  }
});

apiRouter.get('/auth/verify-reset-token', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    res.status(400).json({ error: 'Не указан токен сброса пароля' });
    return;
  }

  const tokenData = resetTokensStore.get(token);
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    res.status(400).json({ error: 'Ссылка для сброса пароля устарела или недействительна' });
    return;
  }

  res.json({
    valid: true,
    email: tokenData.email
  });
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ error: 'Пожалуйста, укажите токен и новый пароль' });
    return;
  }

  if (String(newPassword).length < 4) {
    res.status(400).json({ error: 'Новый пароль должен содержать не менее 4 символов' });
    return;
  }

  const tokenData = resetTokensStore.get(token);
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    res.status(400).json({ error: 'Токен сброса пароля устарел или недействителен. Запросите сброс повторно.' });
    return;
  }

  const user = DB.getUserById(tokenData.userId) || DB.getUserByEmail(tokenData.email);
  if (!user) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  const newPasswordHash = hashPassword(String(newPassword).trim());
  DB.updateUser(user.id, { passwordHash: newPasswordHash });
  updateRow('users', user.id, { password_hash: newPasswordHash }).catch(() => null);

  // Remove used token
  resetTokensStore.delete(token);

  res.json({
    success: true,
    message: 'Пароль успешно изменен! Выполняем вход...',
    user: {
      id: user.id,
      telegramId: user.telegramId,
      email: user.email,
      role: user.role,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      photoUrl: user.photoUrl || '',
      balance: user.balance || 0,
      createdAt: user.createdAt
    }
  });
});

// Users Management CRUD (System Admin)
async function fetchTelegramAvatarPhoto(telegramId: number | string): Promise<string> {
  const parsedId = typeof telegramId === 'number' ? telegramId : parseInt(telegramId, 10);
  if (isNaN(parsedId)) return '';

  const token = getBotTokenFromSQLite() || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';
  if (!token) return '';

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${parsedId}&limit=1`);
    const data = await res.json() as any;
    if (data.ok && data.result?.photos?.length > 0) {
      const photosArray = data.result.photos[0];
      if (photosArray && photosArray.length > 0) {
        const fileId = photosArray[photosArray.length - 1].file_id;
        const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json() as any;
        if (fileData.ok && fileData.result?.file_path) {
          return `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
        }
      }
    }
  } catch (err) {
    console.error(`Error fetching Telegram avatar for user ${parsedId}:`, err);
  }
  return '';
}

apiRouter.get('/users', (req: Request, res: Response) => {
  res.json(DB.getUsers());
});

apiRouter.post('/users/sync-telegram-photos', async (req: Request, res: Response) => {
  try {
    const users = DB.getUsers();
    let updatedCount = 0;
    const results: any[] = [];

    for (const u of users) {
      if (u.telegramId) {
        const photo = await fetchTelegramAvatarPhoto(u.telegramId);
        if (photo) {
          DB.updateUser(u.id, { photoUrl: photo });
          updatedCount++;
          results.push({ id: u.id, telegramId: u.telegramId, photoUrl: photo });
        }
      }
    }

    res.json({
      success: true,
      updatedCount,
      results,
      message: `Успешно спарсено и обновлено ${updatedCount} аватарок пользователей из Telegram`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Ошибка спарсинга аватарок Telegram' });
  }
});

apiRouter.get('/users/me', async (req: Request, res: Response) => {
  const userId = (req.query.id as string) || '';
  const email = (req.query.email as string) || '';
  const telegramIdStr = (req.query.telegramId as string) || '';
  
  const users = DB.getUsers();
  let user: any = null;
  
  if (userId) {
    user = users.find(u => u.id === userId);
  }
  if (!user && telegramIdStr) {
    const tgId = parseInt(telegramIdStr, 10);
    if (!isNaN(tgId)) {
      user = users.find(u => u.telegramId === tgId);
    }
  }
  if (!user && email) {
    user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  }
  
  if (user) {
    // If user has telegramId and photoUrl is empty or not telegram photo, try fetching real avatar
    if (user.telegramId && (!user.photoUrl || !user.photoUrl.includes('telegram.org'))) {
      try {
        const tgPhoto = await fetchTelegramAvatarPhoto(user.telegramId);
        if (tgPhoto) {
          user = DB.updateUser(user.id, { photoUrl: tgPhoto });
        }
      } catch (e) {
        // ignore error
      }
    }
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Пользователь не найден' });
  }
});

apiRouter.post('/users', (req: Request, res: Response) => {
  const { email, password, role, telegramId, firstName, lastName, username, photoUrl, balance } = req.body;
  if (!email && !telegramId) {
    res.status(400).json({ error: 'Пожалуйста, заполните email или Telegram ID' });
    return;
  }

  if (email) {
    const existing = DB.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }
  }

  if (telegramId) {
    const parsedTgId = parseInt(telegramId, 10);
    if (!isNaN(parsedTgId)) {
      const existing = DB.getUserByTelegramId(parsedTgId);
      if (existing) {
        res.status(409).json({ error: 'Пользователь с таким Telegram ID уже существует' });
        return;
      }
    }
  }

  const newUser = {
    id: telegramId ? String(telegramId) : ('user_' + Math.random().toString(36).substr(2, 9)),
    email: email || undefined,
    passwordHash: password ? hashPassword(password) : undefined,
    role: role || 'editor',
    telegramId: telegramId ? parseInt(telegramId, 10) : undefined,
    firstName: firstName || '',
    lastName: lastName || '',
    username: username || '',
    photoUrl: photoUrl || '',
    balance: balance !== undefined ? parseInt(balance, 10) : ((role || 'editor') === 'admin' ? 1000 : 500),
    createdAt: new Date().toISOString()
  };

  DB.addUser(newUser);
  res.status(201).json({
    success: true,
    user: newUser
  });
});

apiRouter.put('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, password, role, telegramId, firstName, lastName, username, photoUrl, balance } = req.body;

  try {
    const updateData: any = {};
    if (email) {
      const existing = DB.getUserByEmail(email);
      if (existing && existing.id !== id) {
        res.status(409).json({ error: 'Пользователь с таким email уже существует' });
        return;
      }
      updateData.email = email;
    } else if (email === '') {
      updateData.email = undefined;
    }

    if (telegramId !== undefined) {
      if (telegramId === '' || telegramId === null) {
        updateData.telegramId = undefined;
      } else {
        const parsedTgId = parseInt(telegramId, 10);
        if (!isNaN(parsedTgId)) {
          const existing = DB.getUserByTelegramId(parsedTgId);
          if (existing && existing.id !== id) {
            res.status(409).json({ error: 'Пользователь с таким Telegram ID уже существует' });
            return;
          }
          updateData.telegramId = parsedTgId;
        }
      }
    }

    if (role) {
      updateData.role = role;
    }
    if (password && password.trim() !== '') {
      updateData.passwordHash = hashPassword(password);
    }
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (username !== undefined) updateData.username = username;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (req.body.userAvatar !== undefined) updateData.userAvatar = req.body.userAvatar;
    if (req.body.user_avatar !== undefined) updateData.userAvatar = req.body.user_avatar;
    if (req.body.timezone !== undefined) updateData.timezone = req.body.timezone;
    if (balance !== undefined) {
      const numBal = typeof balance === 'number' ? balance : parseInt(balance, 10);
      if (!isNaN(numBal)) {
        updateData.balance = numBal;
      }
    }

    const updatedUser = DB.updateUser(id, updateData);
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

apiRouter.delete('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Don't allow deleting the last administrator
  const users = DB.getUsers();
  const userToDelete = users.find(u => u.id === id);
  if (userToDelete && userToDelete.role === 'admin') {
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      res.status(400).json({ error: 'Нельзя удалить единственного администратора системы!' });
      return;
    }
  }

  DB.deleteUser(id);
  res.json({ success: true });
});

// Prompts CRUD
apiRouter.get('/prompts', (req: Request, res: Response) => {
  res.json(DB.getPrompts());
});

apiRouter.post('/prompts', (req: Request, res: Response) => {
  const { 
    title, 
    dayOfWeek, 
    category, 
    content, 
    authorId,
    messageFormat,
    uppercaseHeader,
    signature,
    attachmentType,
    attachmentUrl
  } = req.body;

  if (!title || !dayOfWeek || !category || !content) {
    res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    return;
  }
  const prompt = DB.addPrompt({
    title,
    dayOfWeek,
    category,
    content,
    authorId: authorId || 'admin_1',
    messageFormat,
    uppercaseHeader,
    signature,
    attachmentType,
    attachmentUrl
  });
  res.status(201).json(prompt);
});

apiRouter.put('/prompts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const prompt = DB.updatePrompt(id, req.body);
    res.json(prompt);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

apiRouter.delete('/prompts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DB.deletePrompt(id);
  res.json({ success: true });
});

// Publications (History & Trigger publishing)
apiRouter.get('/publications', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || '';
  res.json(DB.getPublications(userId));
});

apiRouter.delete('/publications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DB.deletePublication(id);
  res.json({ success: true, message: 'Публикация удалена из базы данных' });
});

apiRouter.delete('/publication-logs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DB.deletePublicationLog(id);
  res.json({ success: true, message: 'Лог публикации удален' });
});

apiRouter.delete('/scenario-logs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DB.deleteScenarioLog(id);
  res.json({ success: true, message: 'Лог сценария удален' });
});

apiRouter.post('/publications/publish', async (req: Request, res: Response) => {
  const { 
    title, 
    content, 
    dayRequestId,
    messageFormat,
    uppercaseHeader,
    signature,
    attachmentType,
    attachmentUrl,
    attachmentUrls,
    inlineButtons,
    channels,
    userId
  } = req.body;
  
  if (!title) {
    res.status(400).json({ error: 'Пожалуйста, укажите заголовок публикации' });
    return;
  }

  const dayRequests = DB.getDayRequests();
  const dayRequest = dayRequests.find(r => r.id === dayRequestId) || dayRequests[0] || {
    id: 'req_default',
    dayOfWeek: 'Понедельник',
    category: 'общий',
    requestTemplate: '',
    channel: '@SAV_AI',
    title,
    signature: signature || ''
  };

  let user: any = null;
  if (userId) {
    user = DB.getUsers().find(u => u.id === userId);
  }

  try {
    // Send to Telegram with rich formatting options & inline buttons
    const result = await sendPromptToTelegram(title, content, dayRequest, {
      messageFormat,
      uppercaseHeader,
      signature,
      attachmentType,
      attachmentUrl,
      attachmentUrls,
      inlineButtons,
      channels,
      telegramId: user?.telegramId || req.body.telegramId || 169262990
    });

    const updatedBalance = user ? user.balance : undefined;

    const effectiveUserId = userId || user?.id || (req.headers['x-user-id'] as string) || '';

    // Save publication in history
    const publication = DB.addPublication({
      userId: effectiveUserId,
      promptTitle: title,
      text: content,
      channel: result.channel || dayRequest.channel || '@SAV_AI',
      messageId: result.messageId,
      status: result.ok,
      response: result.error ? `Ошибка отправки. ${result.error}` : (result.simulated ? 'Имитация публикации в Telegram' : 'Опубликовано')
    });

    DB.addLog({
      publicationId: publication.id,
      action: result.ok ? 'PUBLISHED' : 'FAILED',
      details: result.error || 'Публикация отправлена в Telegram'
    });

    res.json({
      success: true,
      publication,
      simulated: result.simulated,
      error: result.error,
      updatedBalance
    });
  } catch (error: any) {
    console.error('Error in publication endpoint:', error);
    res.status(500).json({ error: error.message || 'Ошибка при публикации' });
  }
});

// DayRequests (Templates database)
apiRouter.get('/day-requests', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || '';
  res.json(DB.getDayRequests(userId));
});

apiRouter.post('/day-requests', (req: Request, res: Response) => {
  const body = req.body || {};
  const userId = body.userId || (req.headers['x-user-id'] as string) || '';
  const newReq = DB.addDayRequest({
    title: body.title || 'Новый пост без названия',
    category: body.category || 'общее',
    userId,
    status: body.status || 'создается',
    requestTemplate: body.requestTemplate || '',
    postText: body.postText !== undefined ? body.postText : '',
    channel: body.channel || (body.channels && body.channels[0]) || '@SAV_AI',
    channels: body.channels || [body.channel || '@SAV_AI'],
    signature: body.signature !== undefined ? body.signature : '',
    messageFormat: body.messageFormat || 'v2',
    uppercaseHeader: body.uppercaseHeader !== false,
    attachmentType: body.attachmentType || 'none',
    attachmentUrl: body.attachmentUrl || '',
    attachmentUrls: body.attachmentUrls || [],
    inlineButtons: body.inlineButtons || [],
    uniquenessMemoryCount: body.uniquenessMemoryCount || 0,
    triggerSchedule: body.triggerSchedule || { enabled: false }
  });
  res.status(201).json(newReq);
});

apiRouter.put('/day-requests/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updated = DB.updateDayRequest(id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

apiRouter.delete('/day-requests/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DB.deleteDayRequest(id);
  res.json({ success: true });
});

// Channels CRUD
apiRouter.get('/channels', (req: Request, res: Response) => {
  const rawUserId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || '';
  const userId = normalizeUserId(rawUserId);
  res.json(DB.getChannels(userId));
});

apiRouter.post('/channels', (req: Request, res: Response) => {
  const { name, username, isActive, userId } = req.body;
  if (!name || !username) {
    res.status(400).json({ error: 'Пожалуйста, укажите название и юзернейм канала' });
    return;
  }
  const effectiveUserId = normalizeUserId(userId || (req.headers['x-user-id'] as string) || '');
  const newCh = DB.addChannel({ name, username, isActive: isActive !== false, userId: effectiveUserId });
  res.status(201).json(newCh);
});

apiRouter.put('/channels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updated = DB.updateChannel(id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

apiRouter.delete('/channels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DB.deleteChannel(id);
  res.json({ success: true });
});

// Channel auto-check and addition via Telegram Bot API
apiRouter.post('/channels/check', async (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ error: 'Пожалуйста, введите юзернейм или ID канала (например, @channel_name)' });
    return;
  }

  let cleanUsername = username.trim();
  // Ensure it starts with @ if it looks like a username
  if (!cleanUsername.startsWith('-') && !cleanUsername.startsWith('@') && !/^\d+$/.test(cleanUsername)) {
    cleanUsername = '@' + cleanUsername;
  }

  const settings = DB.getSettings();
  const token = getBotTokenFromSQLite() || settings.telegramBotToken || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';

  if (!token) {
    res.status(400).json({ error: 'В настройках системы не задан токен Telegram-бота' });
    return;
  }

  try {
    // 1. Get bot info (getMe)
    let botUserId: number | null = null;
    let botUsername = 'IIrkiBot';
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meData = await meRes.json() as any;
      if (meData.ok && meData.result) {
        botUserId = meData.result.id;
        if (meData.result.username) {
          botUsername = meData.result.username;
        }
      }
    } catch (e) {
      console.error('Error fetching bot getMe:', e);
    }

    // 2. Fetch Chat Info (getChat)
    const url = `https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(cleanUsername)}`;
    const response = await fetch(url);
    const data = await response.json() as any;

    if (!data.ok) {
      const errMsg = data.description || 'Не удалось найти канал или бот не добавлен в него';
      res.status(400).json({ 
        error: `Не удалось найти канал ${cleanUsername}: ${errMsg}. Пожалуйста, убедитесь, что бот @${botUsername} добавлен в ваш канал как Администратор с правами публикации.`
      });
      return;
    }

    const chat = data.result;

    // 3. Verify Bot is a member and Administrator in the channel (getChatMember)
    if (botUserId) {
      const memberUrl = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(cleanUsername)}&user_id=${botUserId}`;
      const memberRes = await fetch(memberUrl);
      const memberData = await memberRes.json() as any;

      if (!memberData.ok || !memberData.result) {
        res.status(400).json({
          error: `Бот @${botUsername} НЕ добавлен в этот канал (${cleanUsername})! Пожалуйста, добавьте бота @${botUsername} в ваш канал как Администратора с правом публикации постов.`
        });
        return;
      }

      const memberStatus = memberData.result.status;
      if (memberStatus !== 'administrator' && memberStatus !== 'creator') {
        res.status(400).json({
          error: `Бот @${botUsername} присутствует в канале, но НЕ имеет прав Администратора (текущий статус: "${memberStatus}"). Назначьте бота @${botUsername} Администратором канала с разрешением публиковать сообщения.`
        });
        return;
      }

      if (memberData.result.can_post_messages === false) {
        res.status(400).json({
          error: `У бота @${botUsername} на канале ${cleanUsername} выключено право «Публикация сообщений» (can_post_messages). Включите разрешение на публикацию постов.`
        });
        return;
      }
    }

    // Fetch subscribers count
    let subscribersCount = 0;
    try {
      const countUrl = `https://api.telegram.org/bot${token}/getChatMemberCount?chat_id=${encodeURIComponent(cleanUsername)}`;
      const countRes = await fetch(countUrl);
      const countData = await countRes.json() as any;
      if (countData.ok) {
        subscribersCount = countData.result;
      }
    } catch (countErr) {
      console.error('Error fetching chat member count:', countErr);
    }

    // Fetch channel photo/avatar if present
    let photoUrl = '';
    if (chat.photo && (chat.photo.big_file_id || chat.photo.small_file_id)) {
      try {
        const fileId = chat.photo.big_file_id || chat.photo.small_file_id;
        const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json() as any;
        if (fileData.ok && fileData.result?.file_path) {
          photoUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
        }
      } catch (e) {
        console.error('Error fetching chat photo:', e);
      }
    }

    const name = chat.title || chat.username || cleanUsername;
    const inviteLink = chat.invite_link || (chat.username ? `https://t.me/${chat.username}` : '');
    const description = chat.description || 'Канал добавлен через автопроверку бота.';
    const telegramId = String(chat.id);

    const effectiveUserId = req.body.userId || (req.headers['x-user-id'] as string) || '';
    const existingChannels = DB.getChannels(effectiveUserId);
    let channel = existingChannels.find(c => c.username === cleanUsername || c.telegramId === telegramId);

    if (channel) {
      channel = DB.updateChannel(channel.id, {
        userId: effectiveUserId || channel.userId,
        name,
        username: cleanUsername,
        subscribersCount,
        inviteLink,
        telegramId,
        description,
        photoUrl: photoUrl || channel.photoUrl || '',
        isActive: true
      });
    } else {
      channel = DB.addChannel({
        userId: effectiveUserId,
        name,
        username: cleanUsername,
        isActive: true,
        subscribersCount,
        inviteLink,
        telegramId,
        description,
        photoUrl
      });
    }

    res.json({ success: true, channel });
  } catch (err: any) {
    console.error('Error in channels check endpoint:', err);
    res.status(500).json({ 
      error: `Ошибка при подключении к Telegram API: ${err.message}. Проверьте соединение.`
    });
  }
});

// Helper to check if Telegram Bot is active & administrator in a given channel
async function checkBotInTelegramChannel(usernameOrId: string): Promise<{ ok: boolean; name?: string; subscribersCount?: number; photoUrl?: string; error?: string }> {
  let cleanUsername = String(usernameOrId || '').trim();
  if (!cleanUsername.startsWith('-') && !cleanUsername.startsWith('@') && !/^\d+$/.test(cleanUsername)) {
    cleanUsername = '@' + cleanUsername;
  }

  const settings = DB.getSettings();
  const token = getBotTokenFromSQLite() || settings.telegramBotToken || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';
  if (!token) {
    return { ok: false, error: 'В настройках системы не задан токен Telegram-бота' };
  }

  try {
    let botUserId: number | null = null;
    let botUsername = 'IIrkiBot';
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meData = await meRes.json() as any;
      if (meData.ok && meData.result) {
        botUserId = meData.result.id;
        botUsername = meData.result.username || botUsername;
      }
    } catch (e) {}

    const chatRes = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(cleanUsername)}`);
    const chatData = await chatRes.json() as any;
    if (!chatData.ok) {
      return { ok: false, error: `Бот @${botUsername} не может найти канал ${cleanUsername} или был удален из него.` };
    }

    if (botUserId) {
      const memberRes = await fetch(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(cleanUsername)}&user_id=${botUserId}`);
      const memberData = await memberRes.json() as any;

      if (!memberData.ok || !memberData.result) {
        return { ok: false, error: `Бот @${botUsername} не найден в канале ${cleanUsername}.` };
      }

      const status = memberData.result.status;
      if (status !== 'administrator' && status !== 'creator') {
        return { ok: false, error: `Бот @${botUsername} не является Администратором в канале ${cleanUsername}.` };
      }
    }

    return { ok: true, name: chatData.result.title || cleanUsername };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Ошибка сети при проверке канала' };
  }
}

// Verify all channels for a user upon login/entering cabinet
apiRouter.post('/channels/verify-all', async (req: Request, res: Response) => {
  const userId = req.body.userId || (req.headers['x-user-id'] as string) || '';
  const channels = DB.getChannels(userId);

  const updatedChannels = [];
  for (const ch of channels) {
    if (ch.username || ch.telegramId) {
      const checkResult = await checkBotInTelegramChannel(ch.username || ch.telegramId || '');
      const newStatus = checkResult.ok;
      if (ch.isActive !== newStatus) {
        const updated = DB.updateChannel(ch.id, { isActive: newStatus });
        updatedChannels.push(updated);
      } else {
        updatedChannels.push(ch);
      }
    } else {
      updatedChannels.push(ch);
    }
  }

  res.json({ success: true, channels: updatedChannels });
});

// Re-verify a single channel by ID via Telegram Bot check button
apiRouter.post('/channels/:id/verify', async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.body.userId || (req.headers['x-user-id'] as string) || '';
  const channels = DB.getChannels(userId);
  const ch = channels.find(c => c.id === id);

  if (!ch) {
    res.status(404).json({ error: 'Канал не найден в базе данных' });
    return;
  }

  const checkResult = await checkBotInTelegramChannel(ch.username || ch.telegramId || ch.name);
  const updated = DB.updateChannel(ch.id, { isActive: checkResult.ok });

  if (checkResult.ok) {
    res.json({
      success: true,
      channel: updated,
      isActive: true,
      message: `🎉 Канал «${ch.name}» успешно проверен! Наш Telegram-бот найден и активен.`
    });
  } else {
    res.status(400).json({
      success: false,
      channel: updated,
      isActive: false,
      error: checkResult.error || `Бот не найден в канале «${ch.name}». Пожалуйста, добавьте бота @IIrkiBot администратором.`
    });
  }
});

// Settings CRUD
apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json(DB.getSettings());
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const updated = DB.updateSettings(req.body);
  res.json(updated);
});

// Templates CRUD
apiRouter.get('/templates', (req: Request, res: Response) => {
  res.json(DB.getTemplates());
});

apiRouter.post('/templates', (req: Request, res: Response) => {
  const { type, name, category, content } = req.body;
  if (!name || !content || !type) {
    res.status(400).json({ error: 'Пожалуйста, укажите тип, название и содержимое шаблона' });
    return;
  }
  const newTpl = DB.addTemplate({ type, name, category: category || '', content });
  res.status(201).json(newTpl);
});

apiRouter.delete('/templates/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DB.deleteTemplate(id);
  res.json({ success: true });
});

// Publications CRUD
apiRouter.get('/publications', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || '';
  res.json(DB.getPublications(userId));
});

apiRouter.delete('/publications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DB.deletePublication(id);
  res.json({ success: true });
});

// System Prompts Endpoints
apiRouter.get('/system-prompts', (req: Request, res: Response) => {
  res.json(DB.getSystemPrompts());
});

apiRouter.put('/system-prompts/:key', (req: Request, res: Response) => {
  const { key } = req.params;
  const { promptText, title } = req.body;
  if (!promptText) {
    res.status(400).json({ error: 'Промпт не может быть пустым' });
    return;
  }
  const updated = DB.updateSystemPrompt(key, promptText, title);
  if (updated) {
    res.json({ success: true, prompt: updated });
  } else {
    res.status(404).json({ error: 'Системный промпт не найден' });
  }
});

// ProTalk & Gemini Prompt Generation
apiRouter.post('/protalk/generate', async (req: Request, res: Response) => {
  const { 
    dayOfWeek, 
    category, 
    requestTemplate, 
    title,
    currentText,
    maxChars,
    messageFormat,
    escapeMode,
    postStyle,
    styleDesc,
    telegramId, 
    uniquenessMemoryCount,
    userId 
  } = req.body;

  const categoryName = category || 'SMM';
  const dayName = dayOfWeek || 'Сегодня';

  if (requestTemplate && requestTemplate.length > 10000) {
    res.status(400).json({ error: 'Шаблон запроса не должен превышать 10 000 символов' });
    return;
  }

  // 1. Check user balance (10 AI coins for post generation)
  let user: any = null;
  if (userId) {
    user = DB.getUsers().find(u => u.id === userId);
    if (user) {
      const currentBalance = user.balance || 0;
      if (currentBalance < 10) {
        // Send PM Telegram notification if telegramId exists
        const notifyTgId = telegramId || user.telegramId;
        if (notifyTgId) {
          await sendPrivateTelegramNotification(
            notifyTgId,
            `⚠️ <b>Недостаточно ИИрок на балансе!</b>\n\nНе удалось запустить генерацию поста по теме "<b>${categoryName}</b>".\nСтоимость генерации: 10 ИИрок.\nВаш текущий баланс: ${currentBalance} ИИрок.\n\nПожалуйста, пополните баланс в профиле!`
          );
        }
        res.status(402).json({
          error: `Недостаточно ИИрок на балансе! Стоимость генерации: 10 ИИрок. Ваш баланс: ${currentBalance} ИИрок. Пополните баланс в профиле.`
        });
        return;
      }
    }
  }

  // 2. Fetch uniqueness memory (recent publications on this category)
  let recentPostsText: string[] = [];
  const memoryDepth = Math.min(30, Math.max(0, Number(uniquenessMemoryCount) || 0));
  if (memoryDepth > 0) {
    const publications = DB.getPublications();
    const topicPubs = publications
      .filter(p => p.promptTitle.toLowerCase().includes(categoryName.toLowerCase()) || p.text.toLowerCase().includes(categoryName.toLowerCase()))
      .slice(0, memoryDepth);
    recentPostsText = topicPubs.map(p => p.text);
  }

  try {
    // Generate prompt with ProTalk & DB System Prompt
    const result = await generateProkhorPrompt(
      dayName,
      categoryName,
      requestTemplate || '',
      undefined,
      recentPostsText,
      {
        title,
        currentText,
        maxChars: maxChars ? Number(maxChars) : undefined,
        messageFormat,
        escapeMode: Boolean(escapeMode),
        postStyle,
        styleDesc
      }
    );

    // Deduct 10 ИИрок if user identified
    let updatedBalance = user ? user.balance : undefined;
    if (user) {
      const updatedUser = DB.updateUser(user.id, {
        balance: Math.max(0, (user.balance || 0) - 10)
      });
      updatedBalance = updatedUser.balance;

      const notifyTgId = telegramId || user.telegramId;
      if (notifyTgId) {
        await sendPrivateTelegramNotification(
          notifyTgId,
          `✨ <b>ИИ-Промпт успешно сгенерирован!</b>\n\nТема: "<b>${category}</b>"\nСписано: 10 ИИрок\nОстаток баланса: ${updatedBalance} ИИрок.`
        );
      }
    }

    res.json({
      title: result.title,
      content: result.content,
      updatedBalance
    });

  } catch (e: any) {
    console.error('Prompt generation error:', e);
    res.status(500).json({ error: e.message || 'Ошибка генерации промпта через ИИ' });
  }
});

// ProTalk Image Generation endpoint (Costs 10 AI coins)
apiRouter.post('/protalk/generate-image', async (req: Request, res: Response) => {
  const { imagePrompt, userId, telegramId } = req.body;

  if (!imagePrompt || !imagePrompt.trim()) {
    res.status(400).json({ error: 'Пожалуйста, укажите промпт для генерации картинки' });
    return;
  }

  // 1. Check user balance (10 AI coins)
  let user: any = null;
  if (userId) {
    user = DB.getUsers().find(u => u.id === userId);
    if (user) {
      const currentBalance = user.balance || 0;
      if (currentBalance < 10) {
        const notifyTgId = telegramId || user.telegramId;
        if (notifyTgId) {
          await sendPrivateTelegramNotification(
            notifyTgId,
            `⚠️ <b>Недостаточно ИИрок на балансе!</b>\n\nНе удалось запустить генерацию изображения через ProTalk ИИ.\nСтоимость генерации: 10 ИИрок.\nВаш баланс: ${currentBalance} ИИрок.`
          );
        }
        res.status(402).json({
          error: `Недостаточно ИИрок на балансе! Стоимость генерации картинки: 10 ИИрок. Ваш баланс: ${currentBalance} ИИрок.`
        });
        return;
      }
    }
  }

  try {
    const imageUrl = await generateProTalkImage(imagePrompt);

    let updatedBalance = user ? user.balance : undefined;
    if (user) {
      const updatedUser = DB.updateUser(user.id, {
        balance: Math.max(0, (user.balance || 0) - 10)
      });
      updatedBalance = updatedUser.balance;

      const notifyTgId = telegramId || user.telegramId;
      if (notifyTgId) {
        await sendPrivateTelegramNotification(
          notifyTgId,
          `🖼️ <b>Изображение через ProTalk ИИ сгенерировано!</b>\n\nСписано: 10 ИИрок\nОстаток баланса: ${updatedBalance} ИИрок.`
        );
      }
    }

    res.json({
      success: true,
      imageUrl,
      updatedBalance
    });
  } catch (e: any) {
    console.error('ProTalk Image generation error:', e);
    res.status(500).json({ error: e.message || 'Ошибка генерации картинки' });
  }
});

// Stats for Dashboard
apiRouter.get('/stats', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || '';
  const prompts = DB.getPrompts();
  const publications = DB.getPublications(userId);

  const totalPrompts = prompts.length + publications.length; // all prompts ever created or published
  const publishedThisMonth = publications.filter(p => {
    const date = new Date(p.publishedAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const successfulPublications = publications.filter(p => p.status).length;
  const engagementRate = publications.length > 0 
    ? Math.min(98.4, +( (successfulPublications / publications.length) * 85 + 10 ).toFixed(1))
    : 0;

  // Group publications by day of week for charts
  const dayStats: Record<string, number> = {
    'Понедельник': 0, 'Вторник': 0, 'Среда': 0, 'Четверг': 0, 'Пятница': 0, 'Суббота': 0, 'Воскресенье': 0
  };
  
  publications.forEach(p => {
    // try to resolve day of week from publishedAt
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const d = new Date(p.publishedAt);
    const dayName = days[d.getDay()];
    if (dayStats[dayName] !== undefined) {
      dayStats[dayName]++;
    }
  });

  const chartData = Object.keys(dayStats).map(day => ({
    name: day,
    count: dayStats[day]
  }));

  res.json({
    totalPrompts,
    publishedThisMonth,
    engagementRate,
    chartData,
    recentPublications: publications.slice(0, 5)
  });
});

// Import CSV endpoint
apiRouter.post('/import-csv', (req: Request, res: Response) => {
  const { csvText, type } = req.body;
  if (!csvText || !type) {
    res.status(400).json({ error: 'Неверные параметры импорта' });
    return;
  }

  try {
    const lines = csvText.split('\n');
    let importedCount = 0;

    if (type === 'templates') {
      // Parse day requests templates
      lines.forEach((line: string) => {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const day = parts[0].trim();
          const category = parts[1]?.trim() || '';
          const template = parts[2]?.trim() || '';
          const dayRequests = DB.getDayRequests();
          const found = dayRequests.find(r => r.dayOfWeek.toLowerCase() === day.toLowerCase());
          if (found) {
            DB.updateDayRequest(found.id, {
              category,
              requestTemplate: template
            });
            importedCount++;
          }
        }
      });
    } else if (type === 'history') {
      // Parse sent publications
      lines.forEach((line: string) => {
        const parts = line.split(',');
        if (parts.length >= 5) {
          const title = parts[1]?.trim() || 'Импортированная публикация';
          const text = parts[2]?.trim() || '';
          const channel = parts[3]?.trim() || '@SAV_AI';
          const msgId = parts[5]?.trim() || '';
          const status = parts[4]?.toUpperCase() === 'TRUE';
          const date = parts[0]?.trim() || new Date().toISOString();

          DB.addPublication({
            promptTitle: title,
            text,
            channel,
            messageId: msgId,
            status,
            response: status ? 'Опубликовано (импорт)' : 'Ошибка (импорт)'
          });
          importedCount++;
        }
      });
    }

    res.json({ success: true, importedCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка парсинга CSV: ' + err.message });
  }
});

// Balance Top-up
apiRouter.post('/users/:id/topup', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;
  
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ error: 'Пожалуйста, укажите корректную сумму пополнения' });
    return;
  }

  try {
    const cleanUserId = normalizeUserId(id);
    const db = await getSQLiteDB();

    const rubles = Number(amount);
    const coins = rubles; // 1 ruble = 1 AI-coin (ИИрка)

    const result = addTransactionWithBalanceUpdate(db, {
      userId: cleanUserId,
      type: 'pay',
      balanceType: 'pay',
      amount: coins,
      description: `Пополнение баланса (+${coins} ИИрок за ${rubles} руб.)`
    });

    saveSQLiteDB();

    res.json({
      success: true,
      balance: result.newBalances.balance,
      newBalances: result.newBalances,
      transaction: result.transaction,
      message: `Баланс успешно пополнен на ${coins} ИИрок за ${rubles} руб.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Re-parse & update Telegram status for all users in SQLite database
apiRouter.post('/admin/parse-tg-users', async (req: Request, res: Response) => {
  try {
    const db = await getSQLiteDB();
    const rows = fetchAllUsersFromSQLite();
    
    const botSettings = getBotDetailsFromSQLite();
    const botToken = (botSettings && botSettings.bot_token) || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';

    let activeCount = 0;
    let blockedCount = 0;
    let deletedCount = 0;

    for (const u of rows) {
      const tgId = u.telegram_id;
      if (!tgId) continue;

      let status: 'Активный' | 'Блок' | 'Удален' = 'Удален';

      try {
        const actRes = await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction?chat_id=${tgId}&action=typing`);
        const actData = await actRes.json();
        if (actData.ok) {
          status = 'Активный';
        } else {
          const errDesc = (actData.description || '').toLowerCase();
          if (errDesc.includes('blocked') || errDesc.includes('forbidden')) {
            status = 'Блок';
          } else {
            status = 'Удален';
          }
        }
      } catch (e) {
        status = 'Удален';
      }

      if (status === 'Активный') activeCount++;
      else if (status === 'Блок') blockedCount++;
      else deletedCount++;

      try {
        db.run("UPDATE users SET status = ? WHERE telegram_id = ?", [status, tgId]);
      } catch (e) {}
    }

    saveSQLiteDB();

    res.json({
      success: true,
      total: rows.length,
      active: activeCount,
      blocked: blockedCount,
      deleted: deletedCount,
      message: `Парсер успешно выполнил проверку ${rows.length} пользователей: Активных — ${activeCount}, Заблокировали бота — ${blockedCount}, Удалены/Не найдены — ${deletedCount}.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Database SQL/JSON query inspector
apiRouter.post('/db/query', (req: Request, res: Response) => {
  const { sql } = req.body;
  if (!sql) {
    res.status(400).json({ error: 'Запрос SQL пустой' });
    return;
  }

  try {
    const dbFile = path.join(process.cwd(), 'database.json');
    const rawData = fs.readFileSync(dbFile, 'utf-8');
    const db = JSON.parse(rawData);
    
    const query = sql.trim();
    // Helper to find real table key in db case-insensitively
    const getTableKey = (name: string) => {
      const lower = name.toLowerCase();
      return Object.keys(db).find(k => k.toLowerCase() === lower);
    };

    // Parse SELECT
    if (query.toUpperCase().startsWith('SELECT')) {
      const matchSelect = query.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
      if (matchSelect) {
        const fieldsStr = matchSelect[1].trim();
        const rawTable = matchSelect[2].trim();
        const realTable = getTableKey(rawTable);
        const whereClause = matchSelect[3];

        if (!realTable || !db[realTable]) {
          res.status(400).json({ error: `Таблица "${rawTable}" не найдена в базе данных` });
          return;
        }

        let rows = db[realTable];
        if (whereClause) {
          const parts = whereClause.split('=');
          if (parts.length === 2) {
            const col = parts[0].trim();
            const val = parts[1].trim().replace(/^['"]|['"]$/g, '');
            rows = rows.filter((r: any) => {
              const realCol = Object.keys(r).find(k => k.toLowerCase() === col.toLowerCase()) || col;
              return String(r[realCol]).trim() === val.trim();
            });
          }
        }

        if (fieldsStr !== '*') {
          const cols = fieldsStr.split(',').map((c: string) => c.trim());
          rows = rows.map((r: any) => {
            const obj: any = {};
            cols.forEach((col: string) => {
              const realCol = Object.keys(r).find(k => k.toLowerCase() === col.toLowerCase()) || col;
              obj[col] = r[realCol];
            });
            return obj;
          });
        }

        res.json({ success: true, rows, count: rows.length });
        return;
      }
    }
    
    // Parse INSERT INTO <table> (...) VALUES (...)
    if (query.toUpperCase().startsWith('INSERT')) {
      const matchInsert = query.match(/INSERT\s+INTO\s+(\w+)\s*(?:\(([^)]+)\))?\s*VALUES\s*\(([^)]+)\)/i);
      if (matchInsert) {
        const rawTable = matchInsert[1].trim();
        const realTable = getTableKey(rawTable);
        const colsStr = matchInsert[2];
        const valsStr = matchInsert[3];

        if (!realTable || !Array.isArray(db[realTable])) {
          res.status(400).json({ error: `Таблица "${rawTable}" не найдена в базе` });
          return;
        }

        const vals = valsStr.split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
        const newObj: any = { id: 'id_' + Math.random().toString(36).substring(2, 9), createdAt: new Date().toISOString() };

        if (colsStr) {
          const cols = colsStr.split(',').map(c => c.trim());
          cols.forEach((c, idx) => {
            let v: any = vals[idx] !== undefined ? vals[idx] : '';
            if (v === 'true') v = true;
            else if (v === 'false') v = false;
            else if (!isNaN(Number(v)) && v !== '') v = Number(v);
            newObj[c] = v;
          });
        } else {
          vals.forEach((val, idx) => {
            newObj[`col_${idx + 1}`] = val;
          });
        }

        db[realTable].push(newObj);
        fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
        res.json({ success: true, message: `Строка успешно добавлена в таблицу "${realTable}"`, count: 1, rows: [newObj] });
        return;
      }
    }

    // Parse UPDATE
    if (query.toUpperCase().startsWith('UPDATE')) {
      const matchUpdate = query.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?/i);
      if (matchUpdate) {
        const rawTable = matchUpdate[1].trim();
        const realTable = getTableKey(rawTable);
        const setClause = matchUpdate[2].trim();
        const whereClause = matchUpdate[3];

        if (!realTable || !db[realTable]) {
          res.status(400).json({ error: `Таблица "${rawTable}" не найдена` });
          return;
        }

        let updateCount = 0;
        const setParts = setClause.split('=');
        if (setParts.length === 2) {
          const col = setParts[0].trim();
          let valStr = setParts[1].trim();
          
          db[realTable].forEach((row: any) => {
            let matches = true;
            if (whereClause) {
              const whereParts = whereClause.split('=');
              if (whereParts.length === 2) {
                const wCol = whereParts[0].trim();
                const wVal = whereParts[1].trim().replace(/^['"]|['"]$/g, '');
                const realWCol = Object.keys(row).find(k => k.toLowerCase() === wCol.toLowerCase()) || wCol;
                matches = String(row[realWCol]).trim() === wVal.trim();
              }
            }

            if (matches) {
              const realCol = Object.keys(row).find(k => k.toLowerCase() === col.toLowerCase()) || col;
              let val: any = valStr.replace(/^['"]|['"]$/g, '');
              if (valStr.includes('+') || valStr.includes('-')) {
                const opMatch = valStr.match(/(\w+)\s*([+-])\s*(\d+)/);
                if (opMatch) {
                  const currentVal = Number(row[opMatch[1]] || 0);
                  const op = opMatch[2];
                  const num = Number(opMatch[3]);
                  val = op === '+' ? currentVal + num : currentVal - num;
                }
              } else if (!isNaN(Number(val))) {
                val = Number(val);
              } else if (val === 'true') {
                val = true;
              } else if (val === 'false') {
                val = false;
              }
              row[realCol] = val;
              updateCount++;
            }
          });

          fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
          res.json({ success: true, message: `Успешно обновлено строк: ${updateCount}`, count: updateCount });
          return;
        }
      }
    }

    // Parse DELETE
    if (query.toUpperCase().startsWith('DELETE')) {
      const matchDelete = query.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
      if (matchDelete) {
        const rawTable = matchDelete[1].trim();
        const realTable = getTableKey(rawTable);
        const whereClause = matchDelete[2];

        if (!realTable || !Array.isArray(db[realTable])) {
          res.status(400).json({ error: `Таблица "${rawTable}" не найдена` });
          return;
        }

        const initialCount = db[realTable].length;
        if (whereClause && whereClause.trim()) {
          const isNot = whereClause.includes('!=') || whereClause.includes('<>');
          const parts = whereClause.split(isNot ? (whereClause.includes('!=') ? '!=' : '<>') : '=');
          
          if (parts.length === 2) {
            const col = parts[0].trim();
            const val = parts[1].trim().replace(/^['"]|['"]$/g, '');
            db[realTable] = db[realTable].filter((r: any) => {
              const realCol = Object.keys(r).find(k => k.toLowerCase() === col.toLowerCase()) || col;
              const cellVal = String(r[realCol] !== undefined ? r[realCol] : '').trim();
              return isNot ? cellVal === val.trim() : cellVal !== val.trim();
            });
          } else if (whereClause.toUpperCase().includes('LIKE')) {
            const likeParts = whereClause.split(/LIKE/i);
            if (likeParts.length === 2) {
              const col = likeParts[0].trim();
              const val = likeParts[1].trim().replace(/^['"%]|['"%]$/g, '').toLowerCase();
              db[realTable] = db[realTable].filter((r: any) => {
                const realCol = Object.keys(r).find(k => k.toLowerCase() === col.toLowerCase()) || col;
                const cellVal = String(r[realCol] || '').toLowerCase();
                return !cellVal.includes(val);
              });
            }
          }
        } else {
          db[realTable] = [];
        }

        const deletedCount = initialCount - db[realTable].length;
        fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
        res.json({ success: true, message: `Успешно удалено строк: ${deletedCount}`, count: deletedCount });
        return;
      }
    }

    // JS executor fallback
    if (query.startsWith('db.')) {
      const fn = new Function('db', `return ${query}`);
      const resVal = fn(db);
      fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
      res.json({ success: true, result: resVal, message: 'Команда JS успешно выполнена и сохранена в БД' });
      return;
    }

    throw new Error('Поддерживаются SELECT, INSERT, UPDATE, DELETE и JS-скрипты вида db.<collection>');
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка выполнения запроса: ' + err.message });
  }
});

// Telegram Send Endpoint (Used by System Admin / direct publication)
apiRouter.post('/telegram/send', async (req: Request, res: Response) => {
  const { 
    channel, 
    rawText, 
    title, 
    format, 
    signature, 
    attachmentType, 
    attachmentUrl, 
    attachmentUrls, 
    inlineButtons 
  } = req.body;

  const textToSend = rawText || req.body.content || req.body.requestTemplate || '';
  if (!textToSend || !textToSend.trim()) {
    res.status(400).json({ error: 'Пожалуйста, заполните текст сообщения для публикации' });
    return;
  }

  const dummyReq: any = {
    id: req.body.id || 'admin_send',
    dayOfWeek: 'Сегодня',
    category: 'Публикация',
    requestTemplate: textToSend,
    channel: channel || '@SAV_AI',
    channels: [channel || '@SAV_AI'],
    title: title || 'Публикация из БД',
    signature: signature || '',
    messageFormat: format || 'v2'
  };

  try {
    const result = await sendPromptToTelegram(
      title || 'Публикация',
      textToSend,
      dummyReq,
      {
        messageFormat: format || 'v2',
        signature,
        attachmentType,
        attachmentUrl,
        attachmentUrls,
        inlineButtons,
        channels: channel ? [channel] : undefined
      }
    );

    if (result.ok) {
      // Save to publication history log
      DB.addPublication({
        promptTitle: title || 'Публикация из базы данных',
        text: textToSend,
        channel: channel || '@SAV_AI',
        messageId: result.messageId ? String(result.messageId) : undefined,
        status: true,
        publishedAt: new Date().toISOString(),
        response: 'Успешно отправлено из базы данных'
      });

      res.json({ success: true, messageId: result.messageId, message: 'Сообщение успешно отправлено в Telegram!' });
    } else {
      res.status(400).json({ success: false, error: result.error || 'Ошибка отправки в Telegram' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Ошибка сервера при отправке' });
  }
});

// Telegram Test-Send Direct Endpoint (Target: DM 169262990 or passed ID)
apiRouter.post('/telegram/test-send', async (req: Request, res: Response) => {
  const { 
    telegramId = 169262990, 
    title = 'Тестовое сообщение', 
    content = 'Это тестовое сообщение от PROTALK Manager!', 
    signature = 'С уважением, ИИ Помощник', 
    messageFormat = 'v2',
    attachmentType = 'none',
    attachmentUrl = ''
  } = req.body;

  try {
    const dummyReq: any = {
      id: 'test_send',
      dayOfWeek: 'Сегодня',
      category: 'Тест',
      requestTemplate: '',
      channel: String(telegramId),
      channels: [String(telegramId)],
      title,
      signature,
      messageFormat
    };

    const result = await sendPromptToTelegram(title, content, dummyReq, {
      messageFormat,
      uppercaseHeader: true,
      signature,
      attachmentType,
      attachmentUrl,
      telegramId
    });

    // Save publication and log entry so test send appears in History and Calendar
    const pub = DB.addPublication({
      promptTitle: `[Тест в личку ID: ${telegramId}] ${title}`,
      text: content,
      channel: `DM: ${telegramId}`,
      messageId: result.messageId ? String(result.messageId) : undefined,
      status: result.ok,
      publishedAt: new Date().toISOString(),
      response: result.ok ? 'Успешно отправлено в ЛС' : (result.error || 'Ошибка отправки')
    });

    DB.addLog({
      publicationId: pub.id,
      action: result.ok ? 'PUBLISHED' : 'FAILED',
      details: result.ok 
        ? `Тестовая отправка сообщения в личные сообщения Telegram ID ${telegramId}`
        : `Ошибка отправки в личку TG ID ${telegramId}: ${result.error}`
    });

    if (result.ok) {
      res.json({ success: true, messageId: result.messageId, message: `Сообщение успешно отправлено в личку Telegram (${telegramId})!` });
    } else {
      res.status(400).json({ error: result.error || 'Ошибка отправки в Telegram' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Ошибка тестовой отправки' });
  }
});

// Helper to extract custom_emoji_id recursively from Telegram updates
function extractCustomEmojiIds(obj: any, ids: Set<string> = new Set()): string[] {
  if (!obj) return Array.from(ids);
  
  // 1. String JSON regex search for custom_emoji_id
  try {
    const jsonStr = typeof obj === 'string' ? obj : JSON.stringify(obj);
    const matches = jsonStr.match(/"custom_emoji_id"\s*:\s*"?(\d+)"?/g);
    if (matches) {
      for (const m of matches) {
        const idMatch = m.match(/\d+/);
        if (idMatch) ids.add(idMatch[0]);
      }
    }
  } catch (e) {
    // Ignore stringify circular issues
  }

  // 2. Recursive object property search
  if (typeof obj === 'object') {
    if (obj.type === 'custom_emoji' && obj.custom_emoji_id) {
      ids.add(String(obj.custom_emoji_id));
    }
    if (obj.custom_emoji_id) {
      ids.add(String(obj.custom_emoji_id));
    }
    if (obj.sticker && obj.sticker.custom_emoji_id) {
      ids.add(String(obj.sticker.custom_emoji_id));
    }
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractCustomEmojiIds(obj[key], ids);
      }
    }
  }

  return Array.from(ids);
}

// Set Webhook Endpoint for @IIrkiBot
apiRouter.get('/telegram/bot-info', (req: Request, res: Response) => {
  res.json(getBotDetailsFromSQLite());
});

apiRouter.post('/telegram/setup-webhook', async (req: Request, res: Response) => {
  try {
    const token = getBotTokenFromSQLite() || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    });
    const tgData = await tgRes.json();

    res.json({
      success: tgData.ok,
      webhookUrl,
      telegramResponse: tgData
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Ошибка настройки Webhook' });
  }
});

// Endpoint to simulate/test custom emoji recognition in webhook
apiRouter.post('/telegram/test-webhook-emoji', (req: Request, res: Response) => {
  const { customEmojiId = '5386623631980895318' } = req.body;
  const mockUpdate = {
    update_id: 12345,
    message: {
      message_id: 99,
      chat: { id: 169262990, first_name: 'Test' },
      text: '✨',
      entities: [
        {
          offset: 0,
          length: 2,
          type: 'custom_emoji',
          custom_emoji_id: customEmojiId
        }
      ]
    }
  };
  const ids = extractCustomEmojiIds(mockUpdate);
  res.json({
    success: true,
    detectedIds: ids,
    mockCode: `![✨](tg://emoji?id=${ids[0] || customEmojiId})`
  });
});

// Telegram Webhook Endpoint for Custom Emoji ID recognition
apiRouter.post('/telegram/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    const message = update?.message || update?.edited_message || update?.channel_post;

    if (message && message.chat) {
      const chatId = message.chat.id;
      const foundEmojiIds = extractCustomEmojiIds(update);

      const settings = DB.getSettings();
      const token = getBotTokenFromSQLite() || settings.telegramBotToken || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';

      if (foundEmojiIds.length > 0) {
        const replyText = `✨ <b>Распознанный Telegram Custom Emoji ID:</b>\n\n` +
          foundEmojiIds.map((id: string, i: number) => 
            `<b>Эмодзи #${i + 1}:</b> <code>${id}</code>\n<b>Код для вставки в пост:</b> <code>![✨](tg://emoji?id=${id})</code>`
          ).join('\n\n') +
          `\n\n<i>Скопируйте код выше и вставьте в текст вашего поста!</i>`;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: 'HTML' })
        });
      } else {
        const helpText = `👋 <b>Бот определения ID кастомных эмодзи (@IIrkiBot)</b>\n\nПришлите сюда любой премиум (кастомный) эмодзи или стикер из Telegram, и я мгновенно пришлю его ID и готовый код для вставки в пост!\n\nТакже можно использовать бота: @CustomEmojiIdBot`;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: helpText, parse_mode: 'HTML' })
        });
      }
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    res.json({ ok: true });
  }
});

// Scenarios CRUD Endpoints
apiRouter.get('/scenarios', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || '';
  res.json(DB.getScenarios(userId));
});

apiRouter.post('/scenarios', (req: Request, res: Response) => {
  const userId = req.body.userId || (req.headers['x-user-id'] as string) || '';
  const { name, description, topicCategory, targetChannels, messageFormat, enabled, schedule, steps } = req.body;
  if (!name || !topicCategory) {
    res.status(400).json({ error: 'Пожалуйста, укажите название сценария и тему' });
    return;
  }
  const newScen = DB.addScenario({
    userId,
    name,
    description: description || '',
    topicCategory,
    targetChannels: targetChannels || ['@SAV_AI'],
    messageFormat: messageFormat || 'v2',
    enabled: enabled !== false,
    schedule: schedule || { frequency: 'daily', time: '09:00' },
    steps: steps || []
  });
  res.status(201).json(newScen);
});

apiRouter.put('/scenarios/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updated = DB.updateScenario(id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

apiRouter.delete('/scenarios/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  DB.deleteScenario(id);
  res.json({ success: true });
});

apiRouter.get('/scenarios/logs', (req: Request, res: Response) => {
  res.json(DB.getScenarioLogs());
});

// Fetch base posts for scenario selection (filtered strictly by user)
apiRouter.get('/scenarios/base-posts', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || '';
  const dayRequests = DB.getDayRequests(userId);

  const posts = dayRequests.map(d => ({
    id: d.id,
    title: d.title || d.category || 'Пост',
    category: d.category || 'Общее',
    content: d.postText !== undefined ? d.postText : (d.requestTemplate || ''),
    channel: d.channel || '@SAV_AI',
    format: d.messageFormat || 'v2',
    type: 'dayRequest'
  }));

  res.json(posts);
});

// Scenario Test Step Execution Endpoint
apiRouter.post('/scenarios/test-step', async (req: Request, res: Response) => {
  const { stepNumber, scenarioData, customAction } = req.body;
  try {
    if (stepNumber === 1) {
      // Step 1: Study history & generate new unique topic
      const memoryCount = scenarioData?.steps?.find((s: any) => s.stepNumber === 1)?.config?.memoryCount || 5;
      const recentPubs = DB.getPublications().slice(0, memoryCount).map(p => p.text);
      
      const topicCategory = scenarioData?.topicCategory || 'Технологии и ИИ';
      const newTopic = await generateTopicFromHistory(topicCategory, recentPubs);

      return res.json({
        success: true,
        stepNumber: 1,
        generatedTopic: newTopic,
        memoryCount: memoryCount,
        historyAnalyzedCount: recentPubs.length,
        message: `Изучена история ${recentPubs.length} последних постов. Сгенерирована новая уникальная тема: "${newTopic}"`
      });
    }

    if (stepNumber === 2) {
      // Step 2: Write post text
      const topic = scenarioData?.generatedTopic || scenarioData?.topicCategory || 'Технологии ИИ';
      const requestTemplate = scenarioData?.steps?.find((s: any) => s.stepNumber === 2)?.config?.requestTemplate || `Напиши экспертный пост по теме [ТЕМА]`;
      const templateFilled = requestTemplate.replace(/\[ТЕМА\]/gi, topic);

      let customInstructions = undefined;
      if (customAction === 'rewrite') {
        customInstructions = `Перепиши текущий пост более интересно, свежо и увлекательно, сохранив смысловую суть: "${(scenarioData?.generatedText || '').slice(0, 300)}"`;
      }

      const memoryCount = scenarioData?.steps?.find((s: any) => s.stepNumber === 1)?.config?.memoryCount || 5;
      const recentPubs = DB.getPublications().slice(0, memoryCount).map(p => p.text);

      const result = await generateProkhorPrompt(
        'Сегодня',
        topic,
        templateFilled,
        customInstructions,
        recentPubs
      );

      return res.json({
        success: true,
        stepNumber: 2,
        generatedTitle: result.title,
        generatedText: result.content,
        promptSent: templateFilled,
        message: 'Текст поста успешно сгенерирован нейросетью ProTalk.'
      });
    }

    if (stepNumber === 3) {
      // Step 3: Write image prompt
      const postTitle = scenarioData?.basePromptTitle || scenarioData?.generatedTopic || scenarioData?.topicCategory || 'Пост';
      const postText = scenarioData?.generatedText || 'Экспертный пост для Telegram';
      const stylePrompt = scenarioData?.steps?.find((s: any) => s.stepNumber === 3)?.config?.imageStylePrompt || 'Cyberpunk futuristic realistic style, 8k resolution';

      const imgPrompt = await generateImagePromptFromPost(postTitle, postText, stylePrompt);

      return res.json({
        success: true,
        stepNumber: 3,
        generatedImagePrompt: imgPrompt,
        message: 'Промпт для генерации изображения составлен на английском языке.'
      });
    }

    if (stepNumber === 4) {
      // Step 4: Generate image in ProTalk (Album support)
      const promptToUse = scenarioData?.generatedImagePrompt || `Futuristic illustration for ${scenarioData?.topicCategory || 'AI post'}, 8k, detailed`;
      const imageUrl = await generateProTalkImage(promptToUse);

      const currentList: string[] = Array.isArray(scenarioData?.generatedImageUrls) ? [...scenarioData.generatedImageUrls] : [];
      if (customAction === 'add_image') {
        currentList.push(imageUrl);
      } else {
        if (currentList.length === 0) currentList.push(imageUrl);
        else currentList[0] = imageUrl;
      }

      return res.json({
        success: true,
        stepNumber: 4,
        generatedImageUrl: imageUrl,
        generatedImageUrls: currentList,
        message: `Изображение сгенерировано в ProTalk (всего в альбоме: ${currentList.length}).`
      });
    }

    if (stepNumber === 5) {
      // Step 5: Format post
      const format = scenarioData?.messageFormat || 'v2';
      const text = scenarioData?.generatedText || 'Текст поста';
      const imageUrls = scenarioData?.generatedImageUrls || [];

      let formattedText = text;
      if (format === 'v2') {
        formattedText = `<b>${scenarioData?.basePromptTitle || scenarioData?.generatedTopic || 'АВТОПОСТ'}</b>\n\n${text}\n\n<i>⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n✍️ @SAV_AI AutoScript</i>`;
      } else {
        formattedText = `${text}\n\n<b>Подписывайтесь:</b> @SAV_AI`;
      }

      return res.json({
        success: true,
        stepNumber: 5,
        formattedPreview: formattedText,
        hasImages: imageUrls.length > 0,
        imageCount: imageUrls.length,
        message: imageUrls.length > 0 
          ? `Пост оформлен в формате ${format.toUpperCase()} с ${imageUrls.length} медиавложениями (альбом).` 
          : `Пост оформлен без медиавложений в текстовом формате ${format.toUpperCase()}.`
      });
    }

    if (stepNumber === 6) {
      // Step 6: Schedule calculation
      const offsetHours = scenarioData?.offsetHoursBeforePost ?? 12;
      const targetChannels = scenarioData?.targetChannels?.length ? scenarioData.targetChannels : ['@SAV_AI'];
      
      const now = new Date();
      const nextPostDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      if (scenarioData?.schedule?.time) {
        const [hh, mm] = scenarioData.schedule.time.split(':').map(Number);
        if (!isNaN(hh) && !isNaN(mm)) {
          nextPostDate.setHours(hh, mm, 0, 0);
        }
      }

      const scenarioRunDate = new Date(nextPostDate.getTime() - offsetHours * 60 * 60 * 1000);

      return res.json({
        success: true,
        stepNumber: 6,
        nextPostTime: nextPostDate.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        nextScenarioTime: scenarioRunDate.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        offsetHours: offsetHours,
        targetChannels: targetChannels,
        message: `Настроено: пост будет опубликован ${nextPostDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}, автосценарий запустится за ${offsetHours} часов до этого (${scenarioRunDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}).`
      });
    }

    throw new Error('Неизвестный номер шага');
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Ошибка тестирования шага' });
  }
});

// Scenario Manual Trigger Execution
apiRouter.post('/scenarios/:id/run', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, telegramId } = req.body;
  try {
    const result = await runScenarioExecution(id, userId, telegramId);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Ошибка запуска сценария' });
  }
});

// Helper for running scenario step by step
export async function runScenarioExecution(scenarioId: string, userId?: string, telegramId?: number) {
  const scenarios = DB.getScenarios();
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) throw new Error('Сценарий не найден');

  // Calculate cost: 10 AI coins for scenario run + 10 AI coins for image generation if image step is enabled
  const hasImageStep = scenario.steps.some(st => st.type === 'generate_image' && st.enabled);
  const totalCost = 10 + (hasImageStep ? 10 : 0);

  // Check user balance
  let user = userId ? DB.getUsers().find(u => u.id === userId) : DB.getUsers().find(u => u.role === 'admin');
  if (user && (user.balance || 0) < totalCost) {
    const errorMsg = `Недостаточно ИИрок для запуска сценария "${scenario.name}". Требуется: ${totalCost} ИИрок, ваш баланс: ${user.balance || 0} ИИрок.`;
    DB.addScenarioLog({
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      status: 'failed',
      details: errorMsg,
      cost: 0
    });
    DB.updateScenario(scenario.id, {
      lastStatus: 'failed',
      lastError: errorMsg,
      lastRunAt: new Date().toISOString()
    });
    const notifyTgId = telegramId || user.telegramId;
    if (notifyTgId) {
      await sendPrivateTelegramNotification(
        notifyTgId,
        `⚠️ <b>Ошибка автопубликации сценария "${scenario.name}"</b>\n\n${errorMsg}`
      );
    }
    throw new Error(errorMsg);
  }

  // Deduct balance
  let newBalance = user?.balance;
  if (user) {
    const updatedUser = DB.updateUser(user.id, {
      balance: Math.max(0, (user.balance || 0) - totalCost)
    });
    newBalance = updatedUser.balance;
  }

  let generatedText = '';
  let generatedTitle = scenario.name;
  let generatedImageUrl = '';
  let generatedImagePrompt = '';
  let logDetails = [];

  // Step 1: Analyze history
  const step1 = scenario.steps.find(st => st.type === 'analyze_history');
  let recentPublicationsText: string[] = [];
  if (step1 && step1.enabled) {
    const memoryCount = step1.config?.memoryCount || 5;
    const pubs = DB.getPublications().slice(0, memoryCount);
    recentPublicationsText = pubs.map(p => p.text);
    logDetails.push(`Шаг 1: Изучена история ${recentPublicationsText.length} последних постов.`);
  }

  // Step 2: Generate text
  const step2 = scenario.steps.find(st => st.type === 'generate_text');
  const textPrompt = step2?.config?.requestTemplate || `Напиши пост по теме "${scenario.topicCategory}"`;
  const result = await generateProkhorPrompt(
    'Сегодня',
    scenario.topicCategory,
    textPrompt,
    undefined,
    recentPublicationsText
  );
  generatedTitle = result.title || scenario.name;
  generatedText = result.content;
  logDetails.push(`Шаг 2: Текст поста сгенерирован по теме "${scenario.topicCategory}".`);

  // Step 3: Write image prompt based on post text
  const step3 = scenario.steps.find(st => st.type === 'generate_image_prompt');
  if (step3 && step3.enabled) {
    generatedImagePrompt = await generateImagePromptFromPost(generatedTitle, generatedText, step3.config?.imageStylePrompt);
    logDetails.push(`Шаг 3: Промпт для картинки составлен.`);
  }

  // Step 4: Generate image via ProTalk AI
  const step4 = scenario.steps.find(st => st.type === 'generate_image');
  if (step4 && step4.enabled) {
    if (!generatedImagePrompt) {
      generatedImagePrompt = `Futuristic concept artwork for ${generatedTitle}`;
    }
    generatedImageUrl = await generateProTalkImage(generatedImagePrompt);
    logDetails.push(`Шаг 4: Картинка сгенерирована через ProTalk ИИ.`);
  }

  // Step 5: Format post
  const step5 = scenario.steps.find(st => st.type === 'format_post');
  const format = step5?.config?.messageFormat || scenario.messageFormat || 'v2';
  logDetails.push(`Шаг 5: Пост оформлен в стиле ${format.toUpperCase()}.`);

  // Step 6: Schedule / Publish
  const targetChannels = scenario.targetChannels && scenario.targetChannels.length > 0
    ? scenario.targetChannels
    : ['@SAV_AI'];

  const newPost = DB.addDayRequest({
    title: generatedTitle,
    category: scenario.topicCategory,
    requestTemplate: textPrompt,
    postText: generatedText,
    imagePrompt: generatedImagePrompt,
    channel: targetChannels[0],
    channels: targetChannels,
    signature: 'Сгенерировано автосценарием @SAV_AI',
    messageFormat: format,
    attachmentType: generatedImageUrl ? 'photo' : 'none',
    attachmentUrl: generatedImageUrl,
    status: 'scheduled'
  });

  const step6 = scenario.steps.find(st => st.type === 'schedule_post');
  const shouldPublishNow = step6?.config?.autoPublish !== false;

  if (shouldPublishNow) {
    await sendPromptToTelegram(
      generatedTitle,
      generatedText,
      newPost,
      {
        signature: 'Сгенерировано автосценарием @SAV_AI',
        messageFormat: format,
        attachmentType: generatedImageUrl ? 'photo' : 'none',
        attachmentUrl: generatedImageUrl,
        channels: targetChannels
      }
    );
    DB.addPublication({
      promptId: newPost.id,
      promptTitle: generatedTitle,
      text: generatedText,
      channel: targetChannels[0],
      status: true
    });
    logDetails.push(`Шаг 6: Опубликовано в каналы: ${targetChannels.join(', ')}.`);
  } else {
    logDetails.push(`Шаг 6: Пост сохранен в Календарь как отложенная публикация.`);
  }

  // Add Scenario Log
  DB.addScenarioLog({
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    status: 'success',
    generatedText,
    generatedImageUrl,
    details: logDetails.join('\n'),
    cost: totalCost
  });

  DB.updateScenario(scenario.id, {
    lastStatus: 'success',
    lastRunAt: new Date().toISOString(),
    lastError: undefined
  });

  // Notify user in Telegram PM
  const notifyTgId = telegramId || user?.telegramId || 169262990;
  if (notifyTgId) {
    await sendPrivateTelegramNotification(
      notifyTgId,
      `🤖 <b>Автопубликация по сценарию "${scenario.name}" выполнена!</b>\n\n` +
      `<b>Заголовок:</b> ${generatedTitle}\n` +
      `<b>Списано:</b> ${totalCost} ИИрок\n` +
      `<b>Остаток:</b> ${newBalance !== undefined ? newBalance : 'N/A'} ИИрок\n` +
      `<b>Статус:</b> ${shouldPublishNow ? 'Опубликовано в Telegram' : 'Запланировано в Календарь'}`
    );
  }

  return {
    success: true,
    generatedTitle,
    generatedText,
    generatedImageUrl,
    cost: totalCost,
    newBalance
  };
}

// Setup Telegram Webhook endpoint
apiRouter.post('/telegram/set-webhook', async (req: Request, res: Response) => {
  try {
    const { webhookUrl } = req.body;
    const settings = DB.getSettings();
    const token = getBotTokenFromSQLite() || settings.telegramBotToken || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';
    const targetUrl = webhookUrl || `${req.protocol}://${req.get('host')}/api/telegram/webhook`;

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(targetUrl)}`);
    const tgData = await tgRes.json();

    res.json({ success: tgData.ok, telegramResponse: tgData, webhookUrl: targetUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Background Scheduler for Individual Scheduled Posts
export function startPostScheduler() {
  setInterval(async () => {
    try {
      const posts = DB.getDayRequests();
      const now = new Date();

      for (const post of posts) {
        // Skip already sent or failed/disabled posts
        if (post.status === 'sent' || post.status === 'failed') continue;

        const sched = post.triggerSchedule;
        if (!sched || !sched.enabled) continue;

        // Check if scheduled time has arrived
        let isDue = false;
        if (sched.scheduledAt) {
          const schedTime = new Date(sched.scheduledAt);
          if (now.getTime() >= schedTime.getTime()) {
            isDue = true;
          }
        } else if (sched.time) {
          const [hours, minutes] = sched.time.split(':').map(Number);
          if (now.getHours() === hours && now.getMinutes() === minutes) {
            isDue = true;
          }
        }

        if (isDue) {
          const attemptCount = (sched.attemptCount || 0) + 1;
          console.log(`[Scheduler] Publishing scheduled post "${post.title}" (ID: ${post.id})`);

          const targetChannels = (post.channels && post.channels.length > 0) ? post.channels : [post.channel || '@SAV_AI'];

          const res = await sendPromptToTelegram(post.title, post.postText || '', post, {
            messageFormat: post.messageFormat || 'rich',
            uppercaseHeader: post.uppercaseHeader !== false,
            signature: post.signature,
            attachmentType: post.attachmentType,
            attachmentUrl: post.attachmentUrl,
            attachmentUrls: post.attachmentUrls,
            inlineButtons: post.inlineButtons,
            channels: targetChannels
          });

          if (res.ok) {
            DB.updateDayRequest(post.id, {
              status: 'sent',
              triggerSchedule: { ...sched, enabled: false, status: 'sent', sentAt: now.toISOString(), attemptCount }
            });

            DB.addPublication({
              promptId: post.id,
              promptTitle: post.title,
              category: post.category,
              channel: targetChannels.join(', '),
              publishedAt: now.toISOString(),
              text: post.postText || '',
              status: true
            });
            console.log(`[Scheduler] Post "${post.title}" successfully published!`);
          } else {
            console.error(`[Scheduler] Failed publishing post "${post.title}": ${res.error}`);
            // Disable schedule on failure so it won't repeatedly spam errors
            DB.updateDayRequest(post.id, {
              status: 'failed',
              triggerSchedule: { 
                ...sched, 
                enabled: false,
                status: 'failed',
                lastError: res.error || 'Ошибка отправки', 
                attemptCount, 
                lastAttemptAt: now.toISOString() 
              }
            });
          }
        }
      }

      // 2. Check Scenarios Schedule
      const scenarios = DB.getScenarios();
      for (const scen of scenarios) {
        if (!scen.enabled) continue;
        if (scen.lastStatus === 'running') continue;

        let isDue = false;
        const lastRun = scen.lastRunAt ? new Date(scen.lastRunAt).getTime() : 0;
        const diffMinutes = (now.getTime() - lastRun) / (1000 * 60);

        if (scen.schedule?.frequency === 'interval_minutes') {
          const interval = scen.schedule.intervalMinutes || 15;
          if (diffMinutes >= interval) isDue = true;
        } else if (scen.schedule?.frequency === 'interval_hours') {
          const intervalHours = (scen.schedule.intervalHours || 1) * 60;
          if (diffMinutes >= intervalHours) isDue = true;
        } else if (scen.schedule?.frequency === 'daily') {
          if (scen.schedule.time) {
            const [h, m] = scen.schedule.time.split(':').map(Number);
            if (now.getHours() === h && now.getMinutes() === m && diffMinutes >= 60) {
              isDue = true;
            }
          }
        }

        if (isDue) {
          console.log(`[Scheduler] Auto-executing scenario "${scen.name}" (ID: ${scen.id})`);
          runScenarioExecution(scen.id).catch(err => {
            console.error(`[Scheduler] Error running scenario "${scen.name}":`, err);
          });
        }
      }
    } catch (e) {
      console.error('[Scheduler] Error in scheduler loop:', e);
    }
  }, 30000);
}

// SQLite Database Management API Routes
apiRouter.get('/db/tables', async (req: Request, res: Response) => {
  try {
    const info = await getAllTablesInfo();
    res.json({ success: true, tables: info });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/db/table/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const data = await getTableRows(tableName);
    res.json({ success: true, tableName, ...data });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/db/table/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const inserted = await insertRow(tableName, req.body);
    res.status(201).json({ success: true, row: inserted });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/db/table/:tableName/:id', async (req: Request, res: Response) => {
  try {
    const { tableName, id } = req.params;
    const updated = await updateRow(tableName, id, req.body);
    res.json({ success: true, row: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/db/table/:tableName/:id', async (req: Request, res: Response) => {
  try {
    const { tableName, id } = req.params;
    await deleteRow(tableName, id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// CSV Table Import endpoint (supports bulk rows insertion/replace into any SQLite table)
apiRouter.post('/db/table/:tableName/import-csv', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const { rows, csvText } = req.body;

    let parsedRows: Record<string, any>[] = [];

    if (Array.isArray(rows) && rows.length > 0) {
      parsedRows = rows;
    } else if (typeof csvText === 'string' && csvText.trim()) {
      // Parse CSV text
      const lines = csvText.trim().split(/\r?\n/);
      if (lines.length > 1) {
        // Parse header row
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Regex matching CSV values with quoted strings support
          const matches = line.match(/(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g);
          if (matches) {
            const values = matches.map(v => {
              let val = v.replace(/^,/, '').trim();
              if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1).replace(/""/g, '"');
              }
              return val;
            });
            const rowObj: Record<string, any> = {};
            headers.forEach((h, idx) => {
              if (h) rowObj[h] = values[idx] !== undefined ? values[idx] : '';
            });
            parsedRows.push(rowObj);
          }
        }
      }
    }

    if (parsedRows.length === 0) {
      return res.status(400).json({ error: 'Не найдены корректные строки для импорта из CSV' });
    }

    const result = await importCSVRows(tableName, parsedRows);
    res.json({ success: true, tableName, importedCount: result.importedCount });
  } catch (err: any) {
    res.status(400).json({ error: 'Ошибка импорта CSV: ' + err.message });
  }
});

// High Performance Media Caching Proxy for Gallery and Browser Persistence
apiRouter.get('/media-proxy', async (req: Request, res: Response) => {
  try {
    const mediaUrl = req.query.url as string;
    if (!mediaUrl || (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://'))) {
      return res.status(400).json({ error: 'Некорректный URL медиафайла' });
    }

    const upstreamRes = await fetch(mediaUrl);
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('Ошибка загрузки медиафайла с удалённого сервера');
    }

    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await upstreamRes.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка медиа-прокси: ' + err.message });
  }
});

apiRouter.post('/db/query', async (req: Request, res: Response) => {
  try {
    const { sql } = req.body;
    if (!sql) {
      return res.status(400).json({ error: 'SQL запрос не передан' });
    }
    const result = await executeRawSQL(sql);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Start scheduler when module loads
startPostScheduler();

// CRON API Endpoints
apiRouter.get('/cron', async (req: Request, res: Response) => {
  try {
    const data = await getTableRows('cron');
    res.json({ success: true, items: data.rows || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/cron', async (req: Request, res: Response) => {
  try {
    const { item_type, item_id, title, cron_expression, schedule_human } = req.body;
    const newCron = {
      id: `cron_${Date.now()}`,
      item_type: item_type || 'post',
      item_id: item_id || '1',
      title: title || 'Запланированный запуск',
      cron_expression: cron_expression || '0 12 * * *',
      schedule_human: schedule_human || 'Ежедневно в 12:00 MSK',
      next_run: new Date(Date.now() + 86400000).toISOString(),
      last_run: new Date().toISOString(),
      status: 'active',
      created_at: new Date().toISOString()
    };
    await insertRow('cron', newCron);
    res.status(201).json({ success: true, cron: newCron });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/cron/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await updateRow('cron', id, req.body);
    res.json({ success: true, cron: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/cron/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteRow('cron', id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/cron/:id/run', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cronData = await getTableRows('cron');
    const item = cronData.rows.find((r: any) => r.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Задача Крон не найдена' });
    }

    let executionResult: any = { message: 'Успешно запущено по расписанию Cron' };
    if (item.item_type === 'scenery') {
      executionResult = await runScenarioExecution(item.item_id);
    } else {
      // Execute Post publication trigger
      const postsData = await getTableRows('posts');
      const targetPost = postsData.rows.find((p: any) => p.id === item.item_id) || postsData.rows[0];
      if (targetPost) {
        await updateRow('posts', targetPost.id, {
          status: 'sent',
          published_at: new Date().toISOString()
        });
        executionResult = { message: `Пост "${targetPost.title}" успешно выгружен в Telegram!` };
      }
    }

    // Update last_run
    await updateRow('cron', id, {
      last_run: new Date().toISOString(),
      next_run: new Date(Date.now() + 86400000).toISOString()
    });

    res.json({ success: true, result: executionResult });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Chat Messages CRUD for Protalk & Social Messaging
apiRouter.get('/chat/messages', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.query;
    const tableData = await getTableRows('chat_messages');
    let msgs = tableData.rows || [];
    if (chatId) {
      msgs = msgs.filter((m: any) => String(m.chat_id) === String(chatId));
    }
    const formatted = msgs.map((m: any) => ({
      id: m.id,
      chatId: m.chat_id,
      sender: m.sender,
      senderName: m.sender_name,
      text: m.text,
      time: m.time,
      mediaUrl: m.media_url,
      mediaType: m.media_type,
      images: m.images_json ? (typeof m.images_json === 'string' ? JSON.parse(m.images_json) : m.images_json) : undefined,
      replyTo: m.reply_to_json ? (typeof m.reply_to_json === 'string' ? JSON.parse(m.reply_to_json) : m.reply_to_json) : undefined,
      forwardedFrom: m.forwarded_json ? (typeof m.forwarded_json === 'string' ? JSON.parse(m.forwarded_json) : m.forwarded_json) : undefined,
      fileName: m.file_name,
      fileSize: m.file_size,
      createdAt: m.created_at
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/chat/messages', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const newMsg = {
      id: body.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      chat_id: body.chatId || body.chat_id || 'group-smm',
      sender: body.sender || 'me',
      sender_name: body.senderName || body.sender_name || (body.sender === 'me' ? 'Вы' : 'Соавтор'),
      text: body.text || '',
      time: body.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      media_url: body.mediaUrl || body.media_url || '',
      media_type: body.mediaType || body.media_type || '',
      images_json: body.images ? JSON.stringify(body.images) : undefined,
      reply_to_json: body.replyTo ? JSON.stringify(body.replyTo) : undefined,
      forwarded_json: body.forwardedFrom ? JSON.stringify(body.forwardedFrom) : undefined,
      file_name: body.fileName || body.file_name || '',
      file_size: body.fileSize || body.file_size || '',
      created_at: new Date().toISOString()
    };

    await insertRow('chat_messages', newMsg);
    res.status(201).json({
      id: newMsg.id,
      chatId: newMsg.chat_id,
      sender: newMsg.sender,
      senderName: newMsg.sender_name,
      text: newMsg.text,
      time: newMsg.time,
      mediaUrl: newMsg.media_url,
      mediaType: newMsg.media_type,
      images: body.images,
      replyTo: body.replyTo,
      forwardedFrom: body.forwardedFrom,
      fileName: newMsg.file_name,
      fileSize: newMsg.file_size,
      createdAt: newMsg.created_at
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/chat/messages/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteRow('chat_messages', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ProTalk Chat AI Response Endpoint (using ProTalk Bot API credentials & system prompts from DB)
apiRouter.post('/protalk/chat-reply', async (req: Request, res: Response) => {
  try {
    const { userText, userName, chatId, responderName, isGroupChat, chatContext } = req.body || {};
    const textToProcess = userText && userText.trim() ? userText.trim() : 'Привет!';
    const sender = userName || 'Пользователь';
    const isGroup = Boolean(isGroupChat || (chatId && String(chatId).toLowerCase().startsWith('group')));

    // Read credentials from DB settings
    const settings = DB.getSettings();
    const botId = settings.protalkBotId || '66275';
    const botToken = settings.protalkBotToken || 'GaycdyJeSzd3Jja0E2S9jVTQiekUVkrE';

    // Fetch scenario system prompt from DB
    const scenarioKey = isGroup ? 'group_chat_assistant' : 'chat_assistant';
    const sysPromptObj = DB.getSystemPromptByKey(scenarioKey);

    let template = sysPromptObj?.promptText || (
      isGroup 
        ? 'Ты — эрудированный ассистент и участник группового SMM-чата по имени {responder_name}. На сообщение от {sender}: "{user_message}" напиши вовлекающий ответ.'
        : 'Ты — соавтор и коллега по SMM-синдикату по имени {responder_name}. На сообщение от {sender}: "{user_message}" напиши экспертный ответ.'
    );

    const compiledPrompt = template
      .replace(/\{responder_name\}/g, responderName || 'Нейросеть')
      .replace(/\{sender\}/g, sender)
      .replace(/\{user_message\}/g, textToProcess)
      .replace(/\{chat_context\}/g, chatContext || 'Обсуждение в чате')
      .replace(/\{chat_id\}/g, chatId || 'smm-chat');

    let replyText = '';
    try {
      replyText = await callProTalkBotApi(compiledPrompt, botId, botToken);
    } catch (err: any) {
      console.warn('[ProTalk Chat Reply Warning]:', err?.message);
      replyText = `Принял твое сообщение по поводу «${textToProcess}», ${sender}! Внесем это в наши SMM-материалы и автопостинг. 🚀`;
    }

    res.json({ success: true, text: replyText });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ProTalk Voice Audio Upload & STT Speech Recognition Endpoint
apiRouter.post('/protalk-stt', uploadMiddleware.single('file'), async (req: Request, res: Response) => {
  try {
    let audioBuffer: Buffer | null = null;
    let fileName = 'voice_message.webm';
    let mimeType = 'audio/webm';

    if (req.file) {
      audioBuffer = req.file.buffer;
      fileName = req.file.originalname || fileName;
      mimeType = req.file.mimetype || mimeType;
    } else if (req.body && req.body.audioBase64) {
      audioBuffer = Buffer.from(req.body.audioBase64, 'base64');
      if (req.body.fileName) fileName = req.body.fileName;
      if (req.body.mimeType) mimeType = req.body.mimeType;
    }

    if (!audioBuffer) {
      return res.status(400).json({ success: false, error: 'Файл аудио не передан' });
    }

    let uploadedFileUrl = '';

    // Step 1: Upload to ProTalk temporary server https://file.pro-talk.ru/upload_tmp using native Web FormData & Blob
    try {
      const blob = new Blob([audioBuffer], { type: mimeType });
      const webFormData = new globalThis.FormData();
      webFormData.append('file', blob, fileName);

      const uploadRes = await fetch('https://file.pro-talk.ru/upload_tmp', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: webFormData as any,
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        console.log('[ProTalk Server Upload Success]:', uploadData);
        if (uploadData && uploadData.status === 'success' && uploadData.data?.url) {
          uploadedFileUrl = uploadData.data.url;
        } else if (uploadData && uploadData.url) {
          uploadedFileUrl = uploadData.url;
        }
      } else {
        const errBody = await uploadRes.text().catch(() => '');
        console.warn(`[ProTalk upload_tmp warning] HTTP ${uploadRes.status}:`, errBody);
      }
    } catch (uErr) {
      console.warn('[ProTalk upload_tmp fetch error]:', uErr);
    }

    // Fallback if upload_tmp didn't return a remote URL, generate local media URL as fallback
    if (!uploadedFileUrl) {
      const base64Audio = audioBuffer.toString('base64');
      uploadedFileUrl = `data:${mimeType};base64,${base64Audio}`;
    }

    // Step 2: Transcribe audio using ProTalk STT endpoint if remote URL available
    let transcribedText = '';
    if (uploadedFileUrl && uploadedFileUrl.startsWith('http')) {
      try {
        const encodedUrl = encodeURIComponent(uploadedFileUrl);
        const sttUrl = `https://api.pro-talk.ru/api/v1.0/stt_from_widget?url=${encodedUrl}`;
        console.log('[ProTalk STT Requesting]:', sttUrl);
        const sttRes = await fetch(sttUrl);
        if (sttRes.ok) {
          const sttData = await sttRes.json();
          console.log('[ProTalk STT Response]:', sttData);
          transcribedText = sttData.text || (sttData.data && sttData.data.text) || (typeof sttData === 'string' ? sttData : '');
        } else {
          console.warn('[ProTalk STT status warning]:', sttRes.status);
        }
      } catch (sttErr) {
        console.warn('[ProTalk STT fetch error]:', sttErr);
      }
    }

    res.json({
      success: true,
      url: uploadedFileUrl,
      text: transcribedText
    });
  } catch (err: any) {
    console.error('ProTalk STT route error:', err);
    res.status(500).json({ success: false, error: err.message || 'Ошибка обработки голосового сообщения' });
  }
});

// Posts / DayRequests direct API endpoint aliases
apiRouter.get('/posts', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || '';
  res.json(DB.getDayRequests(userId));
});

apiRouter.post('/posts', (req: Request, res: Response) => {
  const body = req.body || {};
  const userId = body.userId || (req.headers['x-user-id'] as string) || '';
  const newReq = DB.addDayRequest({
    title: body.title || 'Новый пост',
    category: body.category || 'общее',
    userId,
    requestTemplate: body.requestTemplate || '',
    postText: body.postText !== undefined ? body.postText : '',
    channel: body.channel || (body.channels && body.channels[0]) || '@SAV_AI',
    channels: body.channels || [body.channel || '@SAV_AI'],
    signature: body.signature !== undefined ? body.signature : '',
    messageFormat: body.messageFormat || 'markdown',
    uppercaseHeader: body.uppercaseHeader !== false,
    attachmentType: body.attachmentType || 'none',
    attachmentUrl: body.attachmentUrl || '',
    attachmentUrls: body.attachmentUrls || [],
    inlineButtons: body.inlineButtons || [],
    uniquenessMemoryCount: body.uniquenessMemoryCount || 0,
    triggerSchedule: body.triggerSchedule || { enabled: false }
  });
  res.status(201).json(newReq);
});

// Helpers for file processing & tagging
function generate11CharShortKey(): string {
  return crypto.randomBytes(8).toString('base64url').slice(0, 11).replace(/[^a-zA-Z0-9]/g, 'x');
}

function detectFileType(fileNameOrUrl: string, mimeType?: string): 'photo' | 'video' | 'audio' | 'document' | 'video_note' {
  const lower = (fileNameOrUrl || '').toLowerCase();
  if (lower.includes('video_note') || lower.includes('circle')) return 'video_note';
  const extMatch = lower.match(/\.([a-z0-9]+)(\?.*)?$/);
  const ext = extMatch ? extMatch[1] : '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(ext) || mimeType?.startsWith('image/')) {
    return 'photo';
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', '3gp'].includes(ext) || mimeType?.startsWith('video/')) {
    return 'video';
  }
  if (['mp3', 'ogg', 'wav', 'm4a', 'aac', 'flac', 'opus'].includes(ext) || mimeType?.startsWith('audio/')) {
    return 'audio';
  }
  return 'document';
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Tariffs List API
apiRouter.get(['/tariffs', '/admin/tariffs'], async (req: Request, res: Response) => {
  try {
    const db = await getSQLiteDB();
    const reqUserId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || '';
    const cleanUserId = reqUserId ? normalizeUserId(reqUserId) : '';
    const isAdmin = req.path.includes('/admin/') || req.query.admin === 'true';

    const rows = getAllTariffsFromDb(db);
    if (rows && rows.length > 0) {
      const parsed = rows.map(r => ({
        ...r,
        is_custom: Number(r.is_custom || 0),
        duration_days: Number(r.duration_days || 30),
        features: typeof r.features === 'string' ? JSON.parse(r.features || '[]') : r.features
      }));

      // Filter: if user is not admin, show standard tariffs + custom tariffs assigned to this user
      const filtered = isAdmin 
        ? parsed 
        : parsed.filter(t => !t.is_custom || !t.target_user_id || t.target_user_id === cleanUserId);

      return res.json({ 
        success: true, 
        tariffs: filtered
      });
    }
  } catch (e) {
    console.error('[API /tariffs] Error reading tariffs from DB:', e);
  }
  res.json({
    success: true,
    tariffs: [
      { id: 'start', name: 'Старт', price_iirky: '0 ИИрок', price_rub: 0, sub: 'Старт без вложений', monthly_iirky: 300, features: [], is_custom: 0, duration_days: 30, duration_text: '30 дней' },
      { id: 'razgon', name: 'Разгон', price_iirky: '990 ИИрок / мес', price_rub: 990, sub: 'Хватит на несколько каналов', monthly_iirky: 990, features: [], is_custom: 0, duration_days: 30, duration_text: '30 дней' },
      { id: 'otryv', name: 'Отрыв', price_iirky: '4,900 ИИрок / мес', price_rub: 4900, sub: 'Хватит на десяток каналов', monthly_iirky: 4900, features: [], is_custom: 0, duration_days: 30, duration_text: '30 дней' },
      { id: 'cosmos', name: 'Космос', price_iirky: 'Индивидуально', price_rub: 15000, sub: 'Индивидуальная разработка', monthly_iirky: 15000, features: [], is_custom: 0, duration_days: 30, duration_text: 'Индивидуально' }
    ]
  });
});

// Create or update tariff (standard or custom)
apiRouter.post(['/tariffs', '/admin/tariffs'], async (req: Request, res: Response) => {
  try {
    const { id, name, price_iirky, price_rub, sub, monthly_iirky, features, duration_days, duration_text, target_user_id, is_custom } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Название тарифа обязательно' });
    }

    const db = await getSQLiteDB();
    const tariffId = id || `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const saved = createOrUpdateTariffInDb(db, {
      id: tariffId,
      name: String(name),
      price_iirky: price_iirky !== undefined ? String(price_iirky) : `${monthly_iirky || 0} ИИрок`,
      price_rub: Number(price_rub || 0),
      sub: sub ? String(sub) : 'Индивидуальный тариф',
      monthly_iirky: Number(monthly_iirky || 0),
      features: features || [],
      duration_days: Number(duration_days || 30),
      duration_text: duration_text ? String(duration_text) : `${duration_days || 30} дней`,
      target_user_id: target_user_id ? normalizeUserId(String(target_user_id)) : null,
      is_custom: is_custom !== undefined ? (is_custom ? 1 : 0) : 1
    });

    // If target_user_id is provided, automatically assign tariff to that user
    if (target_user_id) {
      const cleanTargetId = normalizeUserId(String(target_user_id));
      const targetUser = findUserInDb(db, cleanTargetId);
      if (targetUser) {
        const duration = Number(duration_days || 30);
        const assignedAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();

        db.run(
          `UPDATE users SET tariff = ?, tariff_assigned_at = ?, tariff_expires_at = ?, tariff_duration_days = ? WHERE id = ? OR telegram_id = ?`,
          [name, assignedAt, expiresAt, duration, targetUser.id, targetUser.telegram_id]
        );

        // If tariff gives monthly iirky, add transaction and update balance_tarif + balance_free
        if (Number(monthly_iirky || 0) > 0) {
          addTransactionWithBalanceUpdate(db, {
            userId: targetUser.id,
            type: 'tarif',
            balanceType: 'tarif',
            amount: Number(monthly_iirky),
            description: `Начисление по индивидуальному тарифу "${name}" (${duration} дней)`,
            createdAt: assignedAt
          });
        }
      }
    }

    saveSQLiteDB();
    res.json({ success: true, tariff: saved });
  } catch (err: any) {
    console.error('[API /tariffs POST] Error saving tariff:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete custom tariff
apiRouter.delete(['/tariffs/:id', '/admin/tariffs/:id'], async (req: Request, res: Response) => {
  try {
    const tariffId = req.params.id;
    const db = await getSQLiteDB();
    const deleted = deleteTariffFromDb(db, tariffId);
    if (deleted) {
      saveSQLiteDB();
      res.json({ success: true, message: 'Тариф успешно удален' });
    } else {
      res.status(404).json({ success: false, error: 'Тариф не найден' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// User Change Tariff endpoint (with downgrade retention, upgrade balance check, period months, and discounts)
apiRouter.post('/tariffs/change', async (req: Request, res: Response) => {
  try {
    const { userId, targetTariffId, targetTariffName, periodMonths: reqPeriod } = req.body;
    if (!userId || !targetTariffName) {
      return res.status(400).json({ success: false, error: 'userId и targetTariffName обязательны' });
    }

    const periodMonths = Number(reqPeriod) === 12 ? 12 : Number(reqPeriod) === 6 ? 6 : Number(reqPeriod) === 3 ? 3 : 1;
    const durationDays = periodMonths * 30;

    const db = await getSQLiteDB();
    const cleanUserId = normalizeUserId(String(userId));
    const targetUser = findUserInDb(db, cleanUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    const currentTariffLower = (targetUser.tariff || 'старт').toLowerCase();
    const targetNameLower = targetTariffName.toLowerCase();

    // Tariff rank mapping for comparison
    const getTariffRank = (t: string) => {
      if (t.includes('космос') || t.includes('cosmos')) return 4;
      if (t.includes('отрыв') || t.includes('vip')) return 3;
      if (t.includes('разгон') || t.includes('pro')) return 2;
      return 1; // start / free
    };

    const currentRank = getTariffRank(currentTariffLower);
    const targetRank = getTariffRank(targetNameLower);

    // Get tariff price details from database
    const allTariffs = getAllTariffsFromDb(db);
    const targetTariff = allTariffs.find(t => 
      t.id === targetTariffId || 
      t.name.toLowerCase() === targetNameLower ||
      (targetNameLower.includes('старт') && t.id === 'start') ||
      (targetNameLower.includes('разгон') && t.id === 'razgon') ||
      (targetNameLower.includes('отрыв') && t.id === 'otryv')
    );

    const discountPercent = periodMonths === 12 
      ? (targetTariff?.discount_12m !== undefined ? Number(targetTariff.discount_12m) : 15) 
      : periodMonths === 6 
      ? (targetTariff?.discount_6m !== undefined ? Number(targetTariff.discount_6m) : 10) 
      : periodMonths === 3 
      ? (targetTariff?.discount_3m !== undefined ? Number(targetTariff.discount_3m) : 5) 
      : 0;

    const baseMonthlyPriceRub = targetTariff ? Number(targetTariff.price_rub || 0) : (targetRank === 2 ? 990 : targetRank === 3 ? 4900 : 0);
    const totalWithoutDiscount = baseMonthlyPriceRub * periodMonths;
    const priceRub = Math.round(totalWithoutDiscount * (1 - discountPercent / 100));

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // Case 1: Same tariff and 1 month requested without extension intent
    if (currentTariffLower === targetNameLower && targetRank === 1) {
      return res.json({
        success: true,
        message: `У вас уже подключен базовый тариф «${targetTariffName}».`,
        user: targetUser
      });
    }

    // Case 2: Downgrade (Switch to lower tier)
    // Rule: "Не списываются ИИрки при даунгрейде и остаются на балансе, но ежемесячно баланс будет обновляться на более маленький."
    if (targetRank < currentRank || priceRub === 0) {
      db.run(
        `UPDATE users SET tariff = ?, tariff_assigned_at = ?, tariff_expires_at = ?, tariff_duration_days = ? WHERE id = ?`,
        [targetTariffName, now.toISOString(), expiresAt, durationDays, targetUser.id]
      );
      saveSQLiteDB();

      const updatedUser = findUserInDb(db, cleanUserId);
      return res.json({
        success: true,
        isDowngrade: true,
        message: `Тариф успешно изменен на «${targetTariffName}». Ваши накопленные ИИрки сохранены на балансе, а со следующего месяца лимит обновится согласно новому тарифу.`,
        user: updatedUser
      });
    }

    // Case 3: Upgrade / Paid tariff activation or extension
    const currentTotalBalance = Number(targetUser.balance ?? (Number(targetUser.balance_pay || 0) + Number(targetUser.balance_free || 0)));

    if (currentTotalBalance < priceRub) {
      const missing = priceRub - currentTotalBalance;
      return res.status(400).json({
        success: false,
        needTopup: true,
        missingAmount: missing,
        requiredAmount: priceRub,
        currentBalance: currentTotalBalance,
        periodMonths,
        discountPercent,
        error: `Недостаточно ИИрок на балансе для активации тарифа «${targetTariffName}» на ${periodMonths} мес.${discountPercent > 0 ? ` (скидка ${discountPercent}%)` : ''}. Требуется: ${priceRub} ИИрок, не хватает: ${missing} ИИрок.`
      });
    }

    // Deduct price from balance and activate
    const discountText = discountPercent > 0 ? ` (скидка ${discountPercent}%, экономия ${totalWithoutDiscount - priceRub} ИИрок)` : '';
    addTransactionWithBalanceUpdate(db, {
      userId: targetUser.id,
      type: 'tarif',
      balanceType: 'pay',
      amount: -priceRub,
      description: `Активация тарифа «${targetTariffName}» на ${periodMonths} мес.${discountText} (-${priceRub} ИИрок)`
    });

    db.run(
      `UPDATE users SET tariff = ?, tariff_assigned_at = ?, tariff_expires_at = ?, tariff_duration_days = ? WHERE id = ?`,
      [targetTariffName, now.toISOString(), expiresAt, durationDays, targetUser.id]
    );

    saveSQLiteDB();
    const updatedUser = findUserInDb(db, cleanUserId);

    return res.json({
      success: true,
      isUpgrade: true,
      message: `Тариф «${targetTariffName}» успешно подключен на ${periodMonths} мес. (${durationDays} дней)!`,
      user: updatedUser
    });
  } catch (err: any) {
    console.error('[API /tariffs/change] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Ошибка смены тарифа' });
  }
});

// Cosmos Tariff Contact Request endpoint
apiRouter.post('/tariffs/cosmos-request', async (req: Request, res: Response) => {
  try {
    const { userId, name, telegram, email, phone, message } = req.body;
    const db = await getSQLiteDB();
    const cleanUserId = userId ? normalizeUserId(String(userId)) : '16926299042';

    const title = `🚀 Новая заявка на тариф «Космос»`;
    const details = `Имя: ${name || 'Пользователь'}\nTelegram: ${telegram || 'не указан'}\nE-mail: ${email || 'не указан'}\nТелефон: ${phone || 'не указан'}\nЗапрос: ${message || 'Индивидуальная разработка'}`;

    // Insert admin notification for ID 16926299042 / 169262990
    try {
      db.run(
        `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
         VALUES (?, ?, ?, 'admin', 0, ?)`,
        ['16926299042', title, details, new Date().toISOString()]
      );
      saveSQLiteDB();
    } catch (e) {
      console.warn('Error adding cosmos notification to DB:', e);
    }

    // Send Telegram message to admin telegram_id 169262990 using bot token from DB
    const botToken = getBotTokenFromSQLite() || DB.getSettings().telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';
    if (botToken) {
      try {
        const tgText = `🚀 <b>Новая заявка на тариф «Космос»</b>\n\n👤 <b>Имя:</b> ${name || 'Пользователь'}\n📱 <b>Telegram:</b> ${telegram || 'не указан'}\n📧 <b>E-mail:</b> ${email || 'не указан'}\n📞 <b>Телефон:</b> ${phone || 'не указан'}\n🆔 <b>User ID:</b> <code>${cleanUserId}</code>\n💬 <b>Запрос:</b> ${message || 'Индивидуальная разработка под ключ'}`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: 169262990,
            text: tgText,
            parse_mode: 'HTML'
          })
        });
      } catch (tgErr) {
        console.error('[Cosmos TG Notification Error]:', tgErr);
      }
    }

    console.log(`[Cosmos Request Received for TG ID 169262990]:\n${details}`);

    res.json({
      success: true,
      message: 'Заявка на индивидуальный тариф «Космос» успешно принята! Наш специалист свяжется с вами в Telegram.'
    });
  } catch (err: any) {
    console.error('[API /tariffs/cosmos-request] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Ошибка отправки заявки' });
  }
});

// Assign tariff to user with custom duration
apiRouter.post('/admin/users/assign-tariff', async (req: Request, res: Response) => {
  try {
    const { userId, tariffName, durationDays, addMonthlyIirky } = req.body;
    if (!userId || !tariffName) {
      return res.status(400).json({ success: false, error: 'userId и tariffName обязательны' });
    }

    const db = await getSQLiteDB();
    const cleanUserId = normalizeUserId(String(userId));
    const targetUser = findUserInDb(db, cleanUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    const duration = Number(durationDays || 30);
    const assignedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();

    db.run(
      `UPDATE users SET tariff = ?, tariff_assigned_at = ?, tariff_expires_at = ?, tariff_duration_days = ? WHERE id = ? OR telegram_id = ?`,
      [tariffName, assignedAt, expiresAt, duration, targetUser.id, targetUser.telegram_id]
    );

    // If addMonthlyIirky requested, find tariff info or credit specified amount
    let iirkyAmount = Number(addMonthlyIirky || 0);
    if (iirkyAmount === 0) {
      const allTariffs = getAllTariffsFromDb(db);
      const matched = allTariffs.find(t => t.name.toLowerCase() === tariffName.toLowerCase() || t.id.toLowerCase() === tariffName.toLowerCase());
      if (matched && matched.monthly_iirky > 0) {
        iirkyAmount = matched.monthly_iirky;
      }
    }

    if (iirkyAmount > 0) {
      addTransactionWithBalanceUpdate(db, {
        userId: targetUser.id,
        type: 'tarif',
        balanceType: 'tarif',
        amount: iirkyAmount,
        description: `Начисление по тарифу "${tariffName}" на срок ${duration} дн.`,
        createdAt: assignedAt
      });
    }

    saveSQLiteDB();
    const updatedUser = getUserByIdFromDb(db, targetUser.id);
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger referral check and backfill
apiRouter.post('/admin/sync-referrals', async (req: Request, res: Response) => {
  try {
    const db = await getSQLiteDB();
    const addedCount = checkAndSyncReferralTransactions(db);
    saveSQLiteDB();
    res.json({ success: true, addedCount, message: `Синхронизировано ${addedCount} реферальных начислений` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// PROTALK FILE STORAGE & FOLDERS API
// ==========================================

// 1. Folders API (Ensures 4 default folders exist for user trigger)
apiRouter.get(['/file-folders', '/admin/file-folders'], async (req: Request, res: Response) => {
  try {
    const isAdminRoute = req.path.includes('/admin/');
    const reqUserId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const userId = isAdminRoute ? (reqUserId || 'admin') : (reqUserId || 'admin');

    const db = await getSQLiteDB();
    // Clean up any orphan relations before counting
    try {
      db.run("DELETE FROM file_folder_relations WHERE file_id NOT IN (SELECT id FROM file_storage)");
    } catch (e) {}

    const folders = ensureDefaultFoldersForUser(db, userId);

    const enriched = folders.map((f: any) => {
      let count = 0;
      try {
        const stmt = db.prepare(`
          SELECT COUNT(DISTINCT ffr.file_id) as cnt 
          FROM file_folder_relations ffr
          JOIN file_storage fs ON ffr.file_id = fs.id
          WHERE ffr.folder_id = ?
        `);
        stmt.bind([f.id]);
        if (stmt.step()) count = Number(stmt.getAsObject().cnt || 0);
        stmt.free();
      } catch (e) {}
      return { ...f, fileCount: count };
    });

    res.json({ success: true, folders: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post(['/file-folders', '/admin/file-folders'], async (req: Request, res: Response) => {
  try {
    const { name, color, userId: bodyUserId } = req.body;
    const userId = bodyUserId || (req.headers['x-user-id'] as string) || 'admin';
    if (!name) return res.status(400).json({ error: 'Название папки обязательно' });

    const db = await getSQLiteDB();
    db.run("INSERT INTO file_folders (user_id, name, color, folder_type) VALUES (?, ?, ?, ?)", [
      userId, name.trim(), color || '#ec4899', 'custom'
    ]);
    saveSQLiteDB();

    const folders = getFoldersForUser(db, userId);
    const created = folders.find((f: any) => f.name === name.trim());
    res.json({ success: true, folder: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete(['/file-folders/:id', '/admin/file-folders/:id'], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getSQLiteDB();
    db.run("DELETE FROM file_folders WHERE id = ?", [id]);
    db.run("DELETE FROM file_folder_relations WHERE folder_id = ?", [id]);
    saveSQLiteDB();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Files CRUD API
apiRouter.get(['/files', '/admin/files'], async (req: Request, res: Response) => {
  try {
    const isAdminRoute = req.path.includes('/admin/') || req.query.admin === 'true';
    const reqUserId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const userId = isAdminRoute ? (reqUserId || 'admin') : (reqUserId || 'admin');
    const folderId = req.query.folderId ? Number(req.query.folderId) : undefined;
    const search = req.query.search as string;

    const db = await getSQLiteDB();
    const storageFiles = getStorageFilesForUser(db, userId, { folderId, search });

    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';

    const formatted = storageFiles.map((f: any) => ({
      id: String(f.id),
      fileKey: f.file_key,
      userId: f.user_id,
      folderId: f.folder_id || (f.folderIds && f.folderIds[0]) || null,
      folder_id: f.folder_id || (f.folderIds && f.folderIds[0]) || null,
      name: f.name,
      slugName: f.slug_name,
      originalName: f.name,
      originalUrl: f.original_url,
      fullUrl: f.original_url,
      proxyUrl: `${protocol}://${host}/file/${f.id}/${f.slug_name}`,
      shortKey: f.file_key,
      shortUrl: f.short_url || `${protocol}://${host}/file/${f.file_key}/${f.slug_name}`,
      mimeType: f.mime_type,
      fileType: f.file_type,
      fileSize: f.file_size,
      sizeFormatted: formatFileSize(f.file_size),
      width: f.width,
      height: f.height,
      folderIds: f.folderIds || [],
      createdAt: f.created_at
    }));

    res.json({ success: true, files: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post(['/files/register', '/admin/files/register'], async (req: Request, res: Response) => {
  try {
    const { name, original_url, fullUrl, mime_type, file_size, folder_ids, folder_id, userId, width, height } = req.body;
    const targetUrl = original_url || fullUrl;
    if (!targetUrl) return res.status(400).json({ error: 'Не указан URL файла' });

    const normUserId = userId || (req.headers['x-user-id'] as string) || 'admin';
    const db = await getSQLiteDB();

    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';

    const folderIdsArr = Array.isArray(folder_ids) ? folder_ids : (folder_id ? [folder_id] : []);

    const created = registerFileInStorage(db, {
      userId: normUserId,
      name: name || targetUrl.split('/').pop()?.split('?')[0] || 'file.bin',
      originalUrl: targetUrl,
      mimeType: mime_type || 'image/png',
      fileSize: file_size || 0,
      width: width || 0,
      height: height || 0,
      folderIds: folderIdsArr,
      hostProtocol: { host, protocol }
    });

    saveSQLiteDB();
    res.json({ success: true, file: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch move files to folder(s)
apiRouter.post(['/files/batch-move', '/admin/files/batch-move'], async (req: Request, res: Response) => {
  try {
    const { file_ids, folder_ids, mode = 'add' } = req.body;
    if (!Array.isArray(file_ids) || file_ids.length === 0) {
      return res.status(400).json({ error: 'Не выбраны файлы' });
    }
    const folderIds = Array.isArray(folder_ids) ? folder_ids.map(Number) : [];

    const db = await getSQLiteDB();

    for (const fId of file_ids) {
      const numericId = Number(fId);
      if (isNaN(numericId)) continue;

      if (mode === 'set') {
        db.run("DELETE FROM file_folder_relations WHERE file_id = ?", [numericId]);
      }

      for (const folderId of folderIds) {
        try {
          db.run("INSERT OR IGNORE INTO file_folder_relations (file_id, folder_id) VALUES (?, ?)", [numericId, folderId]);
        } catch (e) {}
      }

      if (folderIds.length > 0) {
        db.run("UPDATE file_storage SET folder_id = ? WHERE id = ?", [folderIds[0], numericId]);
      }
    }

    saveSQLiteDB();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch delete files
apiRouter.post(['/files/batch-delete', '/admin/files/batch-delete'], async (req: Request, res: Response) => {
  try {
    const { file_ids } = req.body;
    if (!Array.isArray(file_ids) || file_ids.length === 0) {
      return res.status(400).json({ error: 'Не выбраны файлы для удаления' });
    }

    const db = await getSQLiteDB();

    for (const fId of file_ids) {
      const numericId = Number(fId);
      if (!isNaN(numericId)) {
        db.run("DELETE FROM file_storage WHERE id = ?", [numericId]);
        db.run("DELETE FROM file_folder_relations WHERE file_id = ?", [numericId]);
      } else {
        const key = String(fId);
        // Find numeric id first if any
        try {
          const stmt = db.prepare("SELECT id FROM file_storage WHERE file_key = ?");
          stmt.bind([key]);
          while (stmt.step()) {
            const foundId = stmt.getAsObject().id;
            if (foundId) {
              db.run("DELETE FROM file_folder_relations WHERE file_id = ?", [foundId]);
            }
          }
          stmt.free();
        } catch (e) {}

        db.run("DELETE FROM file_storage WHERE file_key = ?", [key]);
        DB.deleteFile(key);
      }
    }

    // Cleanup any orphaned relations
    try {
      db.run("DELETE FROM file_folder_relations WHERE file_id NOT IN (SELECT id FROM file_storage)");
    } catch (e) {}

    saveSQLiteDB();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete(['/files/:id', '/admin/files/:id'], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getSQLiteDB();

    const numericId = Number(id);
    if (!isNaN(numericId)) {
      db.run("DELETE FROM file_storage WHERE id = ?", [numericId]);
      db.run("DELETE FROM file_folder_relations WHERE file_id = ?", [numericId]);
    } else {
      try {
        const stmt = db.prepare("SELECT id FROM file_storage WHERE file_key = ?");
        stmt.bind([id]);
        while (stmt.step()) {
          const foundId = stmt.getAsObject().id;
          if (foundId) {
            db.run("DELETE FROM file_folder_relations WHERE file_id = ?", [foundId]);
          }
        }
        stmt.free();
      } catch (e) {}

      db.run("DELETE FROM file_storage WHERE file_key = ?", [id]);
      DB.deleteFile(id);
    }

    // Cleanup any orphaned relations
    try {
      db.run("DELETE FROM file_folder_relations WHERE file_id NOT IN (SELECT id FROM file_storage)");
    } catch (e) {}

    saveSQLiteDB();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ProTalk File Upload Proxy endpoint (with PNG X-Preserve-Alpha support)
apiRouter.post('/upload', uploadMiddleware.single('file'), async (req: Request, res: Response) => {
  try {
    const defaultToken = "b2VcU3NrVVttYlh3GHM_AEQ4eA8yDR4FGREODwsaLyUqQjpTEA8HGzMdFB8aORQYaG9dWGpkVQRvAXM";
    const uploadToken = (req.headers['x-upload-token'] as string) || req.body?.token || defaultToken;
    const userId = (req.headers['x-user-id'] as string) || req.body?.userId || 'admin';
    const folderIds = req.body?.folderIds ? (Array.isArray(req.body.folderIds) ? req.body.folderIds : [req.body.folderIds]) : (req.body?.folderId ? [req.body.folderId] : []);

    let uploadedUrl = '';
    let uploadedKey = '';
    let originalFilename = 'file.bin';
    let mimeType = '';
    let fileSize = 0;
    let width = Number(req.body?.width) || 0;
    let height = Number(req.body?.height) || 0;

    if (req.file) {
      originalFilename = req.file.originalname || 'file.bin';
      mimeType = req.file.mimetype || '';
      fileSize = req.file.size || req.file.buffer.length || 0;

      const isPng = mimeType === 'image/png' || originalFilename.toLowerCase().endsWith('.png');
      const targetUploadUrl = isPng ? "https://filestore.pro-talk.ru/up" : "https://file.pro-talk.ru/tgf";

      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: originalFilename,
        contentType: mimeType
      });

      const formHeaders = formData.getHeaders();
      const formBuffer = formData.getBuffer();

      let response = await fetch(targetUploadUrl, {
        method: "POST",
        headers: {
          "X-Upload-Token": uploadToken,
          "X-Preserve-Alpha": "true",
          ...formHeaders
        },
        body: formBuffer
      });

      if (!response.ok && isPng) {
        response = await fetch("https://file.pro-talk.ru/tgf", {
          method: "POST",
          headers: {
            "X-Upload-Token": uploadToken,
            "X-Preserve-Alpha": "true",
            ...formHeaders
          },
          body: formBuffer
        });
      }

      if (!response.ok) {
        throw new Error(`Upload server responded with status ${response.status}`);
      }

      const resText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch (e) {
        const trimmed = resText.trim().replace(/^["']|["']$/g, '');
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          data = { url: trimmed, key: trimmed.split('/').pop() || '' };
        } else {
          throw new Error(`ProTalk response error: ${resText}`);
        }
      }
      uploadedUrl = data.url || data.link || (typeof data === 'string' ? data : '');
      uploadedKey = data.key || data.file_key || (uploadedUrl ? uploadedUrl.split('/').pop() : '');
    } else if (req.body && req.body.url) {
      uploadedUrl = req.body.url;
      originalFilename = req.body.originalName || req.body.name || req.body.url.split('/').pop()?.split('?')[0] || 'file.bin';

      const response = await fetch("https://file.pro-talk.ru/tgf", {
        method: "POST",
        headers: {
          "X-Upload-Token": uploadToken,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ url: req.body.url }).toString()
      });

      if (!response.ok) {
        throw new Error(`Upload server responded with status ${response.status}`);
      }

      const resText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch (e) {
        const trimmed = resText.trim().replace(/^["']|["']$/g, '');
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          data = { url: trimmed, key: trimmed.split('/').pop() || '' };
        } else {
          throw new Error(`ProTalk response error: ${resText}`);
        }
      }
      uploadedUrl = data.url || data.link || (typeof data === 'string' ? data : '');
      uploadedKey = data.key || data.file_key || (uploadedUrl ? uploadedUrl.split('/').pop() : '');
    } else {
      return res.status(400).json({ error: 'Не передан файл или URL для загрузки' });
    }

    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';

    const db = await getSQLiteDB();
    const fileRecord = registerFileInStorage(db, {
      userId,
      name: originalFilename,
      originalUrl: uploadedUrl,
      mimeType,
      fileSize,
      width,
      height,
      folderIds,
      hostProtocol: { host, protocol }
    });

    saveSQLiteDB();

    return res.json({
      success: true,
      url: uploadedUrl,
      key: uploadedKey,
      fileKey: fileRecord?.file_key,
      shortUrl: fileRecord?.short_url,
      proxyUrl: `${protocol}://${host}/file/${fileRecord?.id}/${fileRecord?.slug_name}`,
      file: fileRecord
    });
  } catch (err: any) {
    console.error('ProTalk Upload error:', err);
    res.status(500).json({ error: err.message || 'Ошибка загрузки файла на ProTalk' });
  }
});

// GET AI Agents from SQLite database
apiRouter.get('/ai-agents', async (req: Request, res: Response) => {
  try {
    const tableData = await getTableRows('ai_agents');
    const rows = Array.isArray(tableData) ? tableData : (tableData.rows || []);
    const formatted = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      desc: r.desc,
      tag: r.tag,
      btnText: r.btn_text || 'Запустить',
      avatarEmoji: r.avatar_emoji || '🤖',
      gradient: r.gradient || 'from-blue-500 to-indigo-600',
      welcomeMessage: r.welcome_message || 'Привет! Напишите ваш запрос.',
      systemPrompt: r.system_prompt || '',
      interactiveChat: {
        user: r.interactive_user || '',
        assistant: r.interactive_assistant || ''
      }
    }));
    res.json({ success: true, agents: formatted });
  } catch (err: any) {
    console.error('Error fetching AI agents from SQLite:', err);
    res.status(500).json({ error: err.message || 'Error fetching agents' });
  }
});

// ==========================================
// DATABASE IMPORT, EXPORT & BACKUP ENDPOINTS
// ==========================================

// 1. Export entire DB as structured JSON
apiRouter.get('/admin/db/export/json', async (req: Request, res: Response) => {
  try {
    const db = await getSQLiteDB();
    const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const tables = tablesRes[0]?.values ? tablesRes[0].values.map(v => String(v[0])) : [];

    const dbExport: Record<string, any[]> = {};

    for (const table of tables) {
      const rowsRes = db.exec(`SELECT * FROM ${table}`);
      if (rowsRes.length > 0) {
        const columns = rowsRes[0].columns;
        const rows = rowsRes[0].values.map(row => {
          const obj: Record<string, any> = {};
          columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        });
        dbExport[table] = rows;
      } else {
        dbExport[table] = [];
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="database_backup_${new Date().toISOString().slice(0, 10)}.json"`);
    res.json({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tables: dbExport
    });
  } catch (err: any) {
    console.error('DB Export JSON error:', err);
    res.status(500).json({ error: err.message || 'Failed to export DB as JSON' });
  }
});

// 2. Export SQLite binary file
apiRouter.get('/admin/db/export/sqlite', async (req: Request, res: Response) => {
  try {
    saveSQLiteDB();
    const dbPath = path.join(process.cwd(), 'app.sqlite');
    if (fs.existsSync(dbPath)) {
      res.download(dbPath, `app_backup_${new Date().toISOString().slice(0, 10)}.sqlite`);
    } else {
      res.status(404).json({ error: 'Database file not found on disk' });
    }
  } catch (err: any) {
    console.error('DB Export SQLite error:', err);
    res.status(500).json({ error: err.message || 'Failed to export SQLite binary' });
  }
});

// 3. Import DB from JSON payload
apiRouter.post('/admin/db/import/json', async (req: Request, res: Response) => {
  try {
    const { tables } = req.body || {};
    if (!tables || typeof tables !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON payload. Expected { tables: { ... } }' });
    }

    const db = await getSQLiteDB();

    for (const [table, rows] of Object.entries(tables)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;

      // Check if table exists
      const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
      if (!tableCheck || tableCheck.length === 0) continue;

      for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        const keys = Object.keys(row);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map(k => row[k]);
        const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

        try {
          db.run(sql, values);
        } catch (e) {
          console.error(`Error importing row into ${table}:`, e);
        }
      }
    }

    saveSQLiteDB();
    res.json({ success: true, message: 'Database JSON imported and saved successfully' });
  } catch (err: any) {
    console.error('DB Import JSON error:', err);
    res.status(500).json({ error: err.message || 'Failed to import JSON' });
  }
});

// 3.1. Import rows into a specific table from CSV parsed rows
apiRouter.post('/admin/db/import/csv', async (req: Request, res: Response) => {
  try {
    const { table, rows } = req.body || {};
    if (!table || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Необходимо указать таблицу (table) и массив строк (rows)' });
    }

    const db = await getSQLiteDB();

    // Verify table exists
    const safeTable = table.replace(/[^a-zA-Z0-9_]/g, '');
    const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${safeTable}'`);
    if (!tableCheck || tableCheck.length === 0) {
      return res.status(404).json({ error: `Таблица «${safeTable}» не найдена в базе данных` });
    }

    // Get column names of the table
    const tableInfo = db.exec(`PRAGMA table_info(${safeTable})`);
    const validColumns = tableInfo[0]?.values?.map((col: any) => col[1]) || [];

    let importedCount = 0;
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      
      // Filter only columns that exist in the table schema
      const keys = Object.keys(row).filter(k => validColumns.includes(k));
      if (keys.length === 0) continue;

      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(k => {
        const val = row[k];
        if (val === '' || val === null || val === undefined) return null;
        if (typeof val === 'string' && /^-?\d+(\.\d+)?$/.test(val.trim())) {
          const num = Number(val.trim());
          if (!isNaN(num)) return num;
        }
        return val;
      });

      const sql = `INSERT OR REPLACE INTO ${safeTable} (${keys.join(', ')}) VALUES (${placeholders})`;
      try {
        db.run(sql, values);
        importedCount++;
      } catch (e: any) {
        console.error(`Error inserting CSV row into ${safeTable}:`, e);
      }
    }

    saveSQLiteDB();
    res.json({ success: true, importedCount, message: `Успешно импортировано ${importedCount} строк в таблицу «${safeTable}»` });
  } catch (err: any) {
    console.error('DB Import CSV error:', err);
    res.status(500).json({ error: err.message || 'Ошибка импорта CSV' });
  }
});

// 3.2. Export a table directly as CSV
apiRouter.get('/admin/db/export/csv/:table', async (req: Request, res: Response) => {
  try {
    const table = req.params.table.replace(/[^a-zA-Z0-9_]/g, '');
    const db = await getSQLiteDB();

    const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
    if (!tableCheck || tableCheck.length === 0) {
      return res.status(404).json({ error: `Таблица «${table}» не найдена` });
    }

    const results = db.exec(`SELECT * FROM ${table}`);
    if (!results || results.length === 0) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${table}.csv"`);
      return res.send('');
    }

    const columns = results[0].columns;
    const values = results[0].values;

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += columns.map(escapeCsv).join(',') + '\n';
    for (const row of values) {
      csvContent += row.map(escapeCsv).join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${table}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('DB Export CSV error:', err);
    res.status(500).json({ error: err.message || 'Ошибка экспорта CSV' });
  }
});

// 4. List DB backups on disk
apiRouter.get('/admin/db/backups', (req: Request, res: Response) => {
  try {
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const files = fs.readdirSync(backupsDir);
    const backups = files.map(file => {
      const filePath = path.join(backupsDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: stats.size,
        createdAt: stats.birthtime || stats.mtime
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, backups });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error listing backups' });
  }
});

// 5. Create immediate snapshot backup
apiRouter.post('/admin/db/backups/create', async (req: Request, res: Response) => {
  try {
    saveSQLiteDB();
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `app.sqlite.backup.${timestamp}.sqlite`;
    const backupPath = path.join(backupsDir, backupFileName);

    const sourcePath = path.join(process.cwd(), 'app.sqlite');
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, backupPath);
      res.json({ success: true, filename: backupFileName, message: 'Backup snapshot created successfully' });
    } else {
      res.status(404).json({ error: 'Main database file app.sqlite not found' });
    }
  } catch (err: any) {
    console.error('Create Backup error:', err);
    res.status(500).json({ error: err.message || 'Failed to create snapshot backup' });
  }
});

// 6. Restore DB from selected backup
apiRouter.post('/admin/db/backups/restore', async (req: Request, res: Response) => {
  try {
    const { filename } = req.body || {};
    if (!filename) return res.status(400).json({ error: 'Filename is required' });

    const backupPath = path.join(process.cwd(), 'backups', path.basename(filename));
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    const mainDbPath = path.join(process.cwd(), 'app.sqlite');
    fs.copyFileSync(backupPath, mainDbPath);

    // Reload DB into memory
    const { getSQLiteDB } = await import('./sqlite.js');
    await getSQLiteDB();

    res.json({ success: true, message: `Database restored successfully from ${filename}` });
  } catch (err: any) {
    console.error('Restore Backup error:', err);
    res.status(500).json({ error: err.message || 'Failed to restore backup' });
  }
});

// Billing & Transactions SQLite Endpoints
apiRouter.get('/billing/transactions', async (req: Request, res: Response) => {
  try {
    const rawUserId = req.query.userId ? String(req.query.userId) : '16926299042';
    const userId = normalizeUserId(rawUserId);
    const db = await getSQLiteDB();

    const list = getUserTransactionsFromDb(db, userId, 100);
    res.json({ success: true, transactions: list });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка загрузки истории транзакций: ' + err.message });
  }
});

apiRouter.post('/billing/transactions', async (req: Request, res: Response) => {
  try {
    const { userId, amount, type, description, comment, balanceType } = req.body;
    const cleanUserId = normalizeUserId(userId || '16926299042');
    const db = await getSQLiteDB();

    const numAmount = Number(amount) || 0;
    const txType = (type || 'cost') as any;

    const result = addTransactionWithBalanceUpdate(db, {
      userId: cleanUserId,
      type: txType,
      balanceType: balanceType,
      amount: numAmount,
      description: description || 'Транзакция',
      comment: comment || ''
    });

    saveSQLiteDB();
    res.json({ success: true, transaction: result.transaction, newBalances: result.newBalances });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка сохранения транзакции: ' + err.message });
  }
});

// Admin Balance Adjust Calculator Endpoint
apiRouter.post('/admin/user-balance-adjust', async (req: Request, res: Response) => {
  try {
    const { userId, amount, balanceType, comment, description } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'Не указан пользователь' });
      return;
    }
    const cleanUserId = normalizeUserId(userId);
    const numAmount = parseInt(String(amount), 10);
    if (isNaN(numAmount) || numAmount === 0) {
      res.status(400).json({ error: 'Укажите корректную сумму изменения (не равную 0)' });
      return;
    }
    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      res.status(400).json({ error: 'Обязательно укажите причину (комментарий) изменения баланса' });
      return;
    }

    const db = await getSQLiteDB();
    const result = addTransactionWithBalanceUpdate(db, {
      userId: cleanUserId,
      type: 'admin',
      balanceType: balanceType || 'admin',
      amount: numAmount,
      description: description || `Корректировка администратором: ${numAmount > 0 ? '+' : ''}${numAmount} ИИрок`,
      comment: comment.trim()
    });

    saveSQLiteDB();
    res.json({ 
      success: true, 
      transaction: result.transaction, 
      newBalances: result.newBalances,
      message: `Баланс пользователя ${cleanUserId} успешно скорректирован на ${numAmount > 0 ? '+' : ''}${numAmount} ИИрок.`
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка корректировки баланса: ' + err.message });
  }
});

// User Notifications Endpoints
apiRouter.get('/notifications', async (req: Request, res: Response) => {
  try {
    const rawUserId = req.query.userId ? String(req.query.userId) : '16926299042';
    const userId = normalizeUserId(rawUserId);
    const db = await getSQLiteDB();

    const list = getUserNotificationsFromDb(db, userId, 50);
    const unreadCount = list.filter(n => !n.is_read).length;

    res.json({ success: true, notifications: list, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка получения уведомлений: ' + err.message });
  }
});

apiRouter.post('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rawUserId = req.body.userId ? String(req.body.userId) : '16926299042';
    const userId = normalizeUserId(rawUserId);
    const db = await getSQLiteDB();

    markNotificationAsReadInDb(db, id, userId);
    saveSQLiteDB();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка отметки уведомления: ' + err.message });
  }
});

apiRouter.post('/notifications/read-all', async (req: Request, res: Response) => {
  try {
    const rawUserId = req.body.userId ? String(req.body.userId) : '16926299042';
    const userId = normalizeUserId(rawUserId);
    const db = await getSQLiteDB();

    markAllNotificationsAsReadInDb(db, userId);
    saveSQLiteDB();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка отметки всех уведомлений: ' + err.message });
  }
});

apiRouter.post('/billing/exchange', async (req: Request, res: Response) => {
  try {
    const { userId, amountRub } = req.body;
    const cleanUserId = normalizeUserId(userId || '16926299042');
    const db = await getSQLiteDB();

    const costRub = parseFloat(amountRub) || 0;
    if (costRub <= 0) {
      res.status(400).json({ error: 'Укажите корректную сумму в рублях' });
      return;
    }

    const iirkyToAdd = Math.round(costRub * 1);
    const result = addTransactionWithBalanceUpdate(db, {
      userId: cleanUserId,
      type: 'pay',
      balanceType: 'pay',
      amount: iirkyToAdd,
      description: `Обмен из рублевого баланса: +${iirkyToAdd} 🪙`
    });

    saveSQLiteDB();
    res.json({ success: true, addedIirky: iirkyToAdd, transactionId: result.transaction.id, newBalances: result.newBalances });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка обмена ИИрок: ' + err.message });
  }
});

// Real-Time Direct Profile & Balances from SQLite Endpoint
apiRouter.get(['/user-profile', '/user/profile', '/users/me'], async (req: Request, res: Response) => {
  try {
    const rawUserId = (req.query.userId as string) || (req.query.id as string) || (req.query.telegramId as string) || (req.headers['x-user-id'] as string) || '16926299042';
    const cleanUserId = normalizeUserId(rawUserId);
    const db = await getSQLiteDB();

    let userRecord = getUserByIdFromDb(db, cleanUserId);
    if (!userRecord && !isNaN(Number(rawUserId))) {
      userRecord = getUserByTelegramIdFromDb(db, Number(rawUserId));
    }
    if (!userRecord) {
      // Try fallback finding in users table
      userRecord = getUserByIdFromDb(db, '16926299042');
    }

    if (!userRecord) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Trigger start bonus check & migration (start -> start_tma / start_email)
    const bonusCheck = checkAndApplyStartRegistrationBonus(db, userRecord.id);
    if (bonusCheck.applied) {
      userRecord = getUserByIdFromDb(db, userRecord.id) || userRecord;
      saveSQLiteDB();
    }

    const balance_start = Number(userRecord.balance_start ?? 300);
    const balance_ref = Number(userRecord.balance_ref ?? 0);
    const balance_tarif = Number(userRecord.balance_tarif ?? 0);
    const balance_admin = Number(userRecord.balance_admin ?? 0);
    const balance_pay = Number(userRecord.balance_pay ?? 0);
    const balance_free = Math.max(0, balance_start + balance_ref + balance_tarif + balance_admin);
    const balance = Math.max(0, balance_pay + balance_free);
    const balance_cost = Number(userRecord.balance_cost ?? 0);
    const balance_time = userRecord.balance_time || null;

    res.json({
      success: true,
      user: {
        id: userRecord.id,
        telegramId: userRecord.telegram_id,
        email: userRecord.email,
        name: `${userRecord.first_name || ''} ${userRecord.last_name || ''}`.trim() || userRecord.username || `User_${userRecord.id}`,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        username: userRecord.username,
        photoUrl: userRecord.photo_url || userRecord.user_avatar || '',
        profileLink: userRecord.profile_link,
        bio: userRecord.bio,
        role: userRecord.role,
        tariff: userRecord.tariff || 'Старт',
        tarif_date: userRecord.tarif_date || userRecord.tariff_assigned_at || userRecord.created_at,
        tariff_date: userRecord.tarif_date || userRecord.tariff_assigned_at || userRecord.created_at,
        tariff_expires_at: userRecord.tariff_expires_at,
        tariffExpiresAt: userRecord.tariff_expires_at,
        tariffAssignedAt: userRecord.tariff_assigned_at || userRecord.tarif_date,
        tariffDurationDays: userRecord.tariff_duration_days || 30,
        status: userRecord.status || 'Активный',
        balance,
        balance_free,
        balance_pay,
        balance_start,
        balance_ref,
        balance_tarif,
        balance_admin,
        balance_cost,
        balance_time,
        createdAt: userRecord.created_at,
        lastLogin: userRecord.last_login
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка получения профиля: ' + err.message });
  }
});

// Admin endpoint to trigger full balance reconciliation against transactions
apiRouter.post('/admin/reconcile-balances', async (req: Request, res: Response) => {
  try {
    const db = await getSQLiteDB();
    const refSync = checkAndSyncReferralTransactions(db);
    const balanceSync = reconcileAllUserBalancesFromTransactions(db);
    saveSQLiteDB();

    res.json({
      success: true,
      message: `Аудит балансов завершен. Синхронизировано рефералов: ${refSync.syncedCount}, обновлено пользователей: ${balanceSync.updatedCount}`,
      refDetails: refSync.details,
      balanceDetails: balanceSync.details
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка аудита балансов: ' + err.message });
  }
});

// Dynamic Tariffs API Endpoints
apiRouter.get('/tariffs', async (req: Request, res: Response) => {
  try {
    const db = await getSQLiteDB();
    const tariffs = getAllTariffsFromDb(db);
    res.json({ success: true, tariffs });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка получения тарифов: ' + err.message });
  }
});

apiRouter.post('/tariffs', async (req: Request, res: Response) => {
  try {
    const { id, name, price_iirky, price_rub, sub, continuation, monthly_iirky, features, duration_days, duration_text, target_user_id, is_custom } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Укажите название тарифа' });
      return;
    }

    const db = await getSQLiteDB();
    const tariffId = id || `custom_${Date.now()}`;
    const result = createOrUpdateTariffInDb(db, {
      id: tariffId,
      name,
      price_iirky: price_iirky || (price_rub > 0 ? `${price_rub} ИИрок / мес` : 'Индивидуально'),
      price_rub: Number(price_rub) || 0,
      sub: sub || '',
      continuation: continuation || '',
      monthly_iirky: Number(monthly_iirky) || Number(price_rub) || 0,
      features: typeof features === 'string' ? features : JSON.stringify(features || []),
      is_active: 1,
      sort_order: is_custom ? 99 : 0,
      duration_days: Number(duration_days) || 30,
      duration_text: duration_text || `${duration_days || 30} дней`,
      target_user_id: target_user_id || undefined,
      is_custom: is_custom ? 1 : 0
    });

    saveSQLiteDB();
    res.json({ success: true, tariff: result });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка сохранения тарифа: ' + err.message });
  }
});

apiRouter.post('/tariffs/assign', async (req: Request, res: Response) => {
  try {
    const { userId, tariffName, durationDays, monthlyIirky, comment } = req.body;
    if (!userId || !tariffName) {
      res.status(400).json({ error: 'Не указан пользователь или название тарифа' });
      return;
    }

    const cleanUserId = normalizeUserId(userId);
    const db = await getSQLiteDB();
    const days = Number(durationDays) || 30;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const assignedAt = now.toISOString();

    db.run(
      `UPDATE users 
       SET tariff = ?, tariff_assigned_at = ?, tariff_expires_at = ?, tariff_duration_days = ?
       WHERE id = ? OR telegram_id = ?`,
      [tariffName, assignedAt, expiresAt, days, cleanUserId, cleanUserId]
    );

    // If monthlyIirky > 0, credit tariff bonus transaction
    const bonus = Number(monthlyIirky) || 0;
    if (bonus > 0) {
      addTransactionWithBalanceUpdate(db, {
        userId: cleanUserId,
        type: 'tarif',
        balanceType: 'tarif',
        amount: bonus,
        description: `Начисление по тарифу "${tariffName}" (+${bonus} ИИрок)`,
        comment: comment || `Активация тарифа ${tariffName} на ${days} дней`
      });
    }

    saveSQLiteDB();
    res.json({ 
      success: true, 
      message: `Тариф "${tariffName}" успешно привязан пользователю ${cleanUserId} на ${days} дней.`,
      assignedAt,
      expiresAt
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка привязки тарифа: ' + err.message });
  }
});

// Switch/Change Tariff by User using internal Iirky Balance
apiRouter.post('/tariffs/change', async (req: Request, res: Response) => {
  try {
    const { userId, targetTariffName, periodMonths = 1 } = req.body;
    if (!targetTariffName) {
      res.status(400).json({ error: 'Не указан целевой тариф' });
      return;
    }

    const cleanUserId = normalizeUserId(userId || '16926299042');
    const db = await getSQLiteDB();

    const userRecord = getUserByIdFromDb(db, cleanUserId);
    if (!userRecord) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Determine cost and duration
    const months = Math.max(1, Number(periodMonths) || 1);
    const days = months * 30;

    let basePricePerMonth = 0;
    let monthlyIirkyBonus = 0;
    const nameLower = targetTariffName.toLowerCase();

    if (nameLower.includes('старт')) {
      basePricePerMonth = 0;
      monthlyIirkyBonus = 300;
    } else if (nameLower.includes('разгон')) {
      basePricePerMonth = 990;
      monthlyIirkyBonus = 990;
    } else if (nameLower.includes('отрыв')) {
      basePricePerMonth = 4900;
      monthlyIirkyBonus = 4900;
    } else if (nameLower.includes('космос')) {
      res.status(400).json({ error: 'Тариф «Космос» подключается через персональную заявку и индивидуальный договор.' });
      return;
    }

    // Calculate discount for longer periods (3m -> 10%, 6m -> 20%, 12m -> 30%)
    let discountPercent = 0;
    if (months === 3) discountPercent = 10;
    else if (months === 6) discountPercent = 20;
    else if (months === 12) discountPercent = 30;

    const totalCost = Math.round(basePricePerMonth * months * (1 - discountPercent / 100));

    // Check user balance (balance_pay + balance_free)
    const availableBalance = (Number(userRecord.balance_pay) || 0) + (Number(userRecord.balance_free) || 0);

    if (totalCost > 0 && availableBalance < totalCost) {
      const missing = totalCost - availableBalance;
      res.status(400).json({
        success: false,
        needTopup: true,
        missingAmount: missing,
        error: `Недостаточно ИИрок на балансе для активации тарифа «${targetTariffName}» на ${months} мес. Требуется: ${totalCost} ИИрок, ваш баланс: ${availableBalance} ИИрок. Не хватает: ${missing} ИИрок.`
      });
      return;
    }

    // Deduct cost if > 0
    if (totalCost > 0) {
      addTransactionWithBalanceUpdate(db, {
        userId: cleanUserId,
        type: 'cost',
        amount: totalCost,
        description: `Списание за переход на тариф «${targetTariffName}» на ${months} мес.`,
        comment: `Тариф ${targetTariffName} (${days} дней)`
      });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    // Update user tariff info with triggers tracking tarif_date
    db.run(
      `UPDATE users 
       SET 
         tariff = ?, 
         tarif_date = ?, 
         tariff_assigned_at = ?, 
         tariff_expires_at = ?, 
         tariff_duration_days = ?,
         balance_time = ?
       WHERE id = ?`,
      [targetTariffName, nowIso, nowIso, expiresAt, days, nowIso, cleanUserId]
    );

    // Credit monthly Iirky bonus if applicable
    if (monthlyIirkyBonus > 0) {
      addTransactionWithBalanceUpdate(db, {
        userId: cleanUserId,
        type: 'tarif',
        balanceType: 'tarif',
        amount: monthlyIirkyBonus,
        description: `Пакетное начисление по тарифу «${targetTariffName}» (+${monthlyIirkyBonus} ИИрок)`,
        comment: `Бонус тарифа ${targetTariffName}`
      });
    }

    saveSQLiteDB();

    const updatedUser = getUserByIdFromDb(db, cleanUserId);

    res.json({
      success: true,
      message: `Тариф успешно изменен на «${targetTariffName}» на ${days} дней!`,
      user: {
        id: updatedUser?.id,
        tariff: updatedUser?.tariff,
        tarif_date: updatedUser?.tarif_date,
        tariff_expires_at: updatedUser?.tariff_expires_at,
        tariffDurationDays: updatedUser?.tariff_duration_days,
        balance: (Number(updatedUser?.balance_pay) || 0) + (Number(updatedUser?.balance_free) || 0),
        balance_pay: updatedUser?.balance_pay,
        balance_free: updatedUser?.balance_free
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка смены тарифа: ' + err.message });
  }
});

// Test Simulation Balance Topup Endpoint
apiRouter.post('/tariffs/simulate-topup', async (req: Request, res: Response) => {
  try {
    const { userId, amountRub = 990 } = req.body;
    const cleanUserId = normalizeUserId(userId || '16926299042');
    const db = await getSQLiteDB();

    const amount = Number(amountRub) || 990;
    const result = addTransactionWithBalanceUpdate(db, {
      userId: cleanUserId,
      type: 'pay',
      balanceType: 'pay',
      amount: amount,
      description: `Тестовая симуляция пополнения: +${amount} ИИрок 🪙`,
      comment: 'Тестовое пополнение баланса в кабинете'
    });

    saveSQLiteDB();

    res.json({
      success: true,
      addedIirky: amount,
      transaction: result.transaction,
      newBalances: result.newBalances,
      message: `Успешно начислено +${amount} ИИрок на баланс пользователя ${cleanUserId}!`
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Ошибка тестового пополнения: ' + err.message });
  }
});




