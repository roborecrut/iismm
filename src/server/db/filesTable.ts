import { Database } from 'sql.js';
import { saveDatabaseToDisk } from './index';

export function slugifyFilename(name: string): string {
  if (!name) return 'file.bin';
  const ruToEn: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const base = parts.join('.');
  
  let slug = base.toLowerCase().split('').map(ch => ruToEn[ch] !== undefined ? ruToEn[ch] : ch).join('');
  slug = slug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug) slug = 'file';
  
  return ext ? `${slug}.${ext}` : slug;
}

export function initFilesTable(db: Database) {
  // 1. Legacy files table
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      original_name TEXT,
      name TEXT,
      full_url TEXT,
      short_key TEXT,
      short_url TEXT,
      file_type TEXT,
      mime_type TEXT,
      file_size INTEGER,
      size_formatted TEXT,
      width INTEGER,
      height INTEGER,
      aspect_ratio REAL,
      created_at TEXT
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);`);

  // 2. Folders table
  db.run(`
    CREATE TABLE IF NOT EXISTS file_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'admin',
      name TEXT NOT NULL,
      color TEXT DEFAULT '#ec4899',
      folder_type TEXT DEFAULT 'custom',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_file_folders_user ON file_folders(user_id);`);

  // 3. Storage Table
  db.run(`
    CREATE TABLE IF NOT EXISTS file_storage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_key TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL DEFAULT 'admin',
      folder_id INTEGER,
      name TEXT NOT NULL,
      slug_name TEXT NOT NULL,
      original_url TEXT NOT NULL,
      short_url TEXT,
      mime_type TEXT DEFAULT 'image/png',
      file_type TEXT DEFAULT 'photo',
      file_size INTEGER DEFAULT 0,
      width INTEGER DEFAULT 0,
      height INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  try {
    db.run("ALTER TABLE file_storage ADD COLUMN folder_id INTEGER;");
  } catch (e) {}
  db.run(`CREATE INDEX IF NOT EXISTS idx_file_storage_key ON file_storage(file_key);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_file_storage_user ON file_storage(user_id);`);

  // 4. File-Folder Relations (Many-to-Many)
  db.run(`
    CREATE TABLE IF NOT EXISTS file_folder_relations (
      file_id INTEGER NOT NULL,
      folder_id INTEGER NOT NULL,
      PRIMARY KEY (file_id, folder_id)
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_file_folder_rel_file ON file_folder_relations(file_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_file_folder_rel_folder ON file_folder_relations(folder_id);`);

  // Seed permanent essential database assets
  seedEssentialFiles(db);
}

export const ESSENTIAL_FILE_STORAGE_ITEMS = [
  {
    id: 15,
    file_key: "A06uq4Tj",
    user_id: "admin",
    folder_id: 1,
    name: "heart.png",
    slug_name: "heart.png",
    original_url: "https://filestore.pro-talk.ru/GgMpJwQ9JCkYKglyGHQPNFk8O1QnDT8YBRAGaw8fBmQUcTV4PCtGJH8IKk0ZEyNJKz0sKzMVJgMKBR4pdRkmKh08Dz84NRQmEVBrZVICawB2UgdrCjgNKQkRJBVyNhwhaT8nQz0CdhBRAyAcKD4sGAMiDDQMAzouHg5oB3dWCmN4.png",
    short_url: "/file/A06uq4Tj/heart.png",
    mime_type: "image/png",
    file_type: "photo",
    file_size: 339451,
    width: 0,
    height: 0,
    created_at: "2026-08-14 01:27:36"
  },
  {
    id: 14,
    file_key: "FpnVFwTE",
    user_id: "admin",
    folder_id: 1,
    name: "setka2.png",
    slug_name: "setka2.png",
    original_url: "https://filestore.pro-talk.ru/GgMpJwQ9JCkYKglyGHQPNFkGO1QkAh1iOTcxdzQHECMaYj12Fhl5Bi1IPwMZEyNSKz0sKzMVJgMKByAnaysuNygyNzA4NRQmEVBrZVICawB2UgdrCjgNKQkRJBVyNhwhaT8nQz0CdhBRAyAcKD4sGAMiDDQMAzouHg5oB3dWCmN4.png",
    short_url: "/file/FpnVFwTE/setka2.png",
    mime_type: "image/png",
    file_type: "photo",
    file_size: 23417,
    width: 0,
    height: 0,
    created_at: "2026-08-14 01:10:41"
  },
  {
    id: 13,
    file_key: "ZGjXvZtz",
    user_id: "admin",
    folder_id: 1,
    name: "VKlogo.png",
    slug_name: "vklogo.png",
    original_url: "https://filestore.pro-talk.ru/GgMpJwQ9JCkYKglyGHQPNFkWO1QkDWEfKjICGwZdLGY7UT9jFVB6OjwbaEMZEyNRKz0sKzMVJgMKTAAnQyAtPww7Aj44NRQmEVBrZVICawB2UgdrCjgNKQkRJBVyNhwhaT8nQz0CdhBRAyAcKD4sGAMiDDQMAzouHg5oB3dWCmN4.png",
    short_url: "/file/ZGjXvZtz/vklogo.png",
    mime_type: "image/png",
    file_type: "photo",
    file_size: 30574,
    width: 0,
    height: 0,
    created_at: "2026-08-14 01:10:39"
  },
  {
    id: 12,
    file_key: "9PYJd0pr",
    user_id: "admin",
    folder_id: 1,
    name: "OKlogo.png",
    slug_name: "oklogo.png",
    original_url: "https://filestore.pro-talk.ru/GgMpJwQ9JCkYKglyGHQPNFhjO1QkDWkDJQgOAhUCEAoqbwsYCjVWJQg1Mw8ZEyNQKz0sKzMVJgMKQg4RVxoKLgMIKxMpMHUfERRhYFUGbQdzUQFkcTgEMgsDKyg0bQEZEGIPcyxRcVFDMhkSIBccJiIPAxMDCTIxHkphBHRQBWl5Sg.png",
    short_url: "/file/9PYJd0pr/oklogo.png",
    mime_type: "image/png",
    file_type: "photo",
    file_size: 36324,
    width: 0,
    height: 0,
    created_at: "2026-08-14 01:10:38"
  },
  {
    id: 11,
    file_key: "lgpokeop",
    user_id: "admin",
    folder_id: 1,
    name: "Maxlogo.png",
    slug_name: "maxlogo.png",
    original_url: "https://filestore.pro-talk.ru/GgMpJwQ9JCkYKglyGHQPNFg8O1QkDS0EJVV2YiYcHz8mcwh7AyxQMAVJDAkZEyNXKz0sKzMVJgMKDTIXYz15FWg-FWs4NRQmEVBrZVICawB2UgdrCjgNKQkRJBVyNhwhaT8nQz0CdhBRAyAcKD4sGAMiDDQMAzouHg5oB3dWCmN4.png",
    short_url: "/file/lgpokeop/maxlogo.png",
    mime_type: "image/png",
    file_type: "photo",
    file_size: 36229,
    width: 0,
    height: 0,
    created_at: "2026-08-14 01:10:36"
  },
  {
    id: 10,
    file_key: "6L4ApDcy",
    user_id: "admin",
    folder_id: 1,
    name: "social iismm.png",
    slug_name: "social-iismm.png",
    original_url: "https://filestore.pro-talk.ru/GgMpJwQ9JCkYKglyGHQPNFgGO1QkDTNiEDwoFD08MTQ0ZWxtAiNUAA8BdCwZEyNWKz0sKzMVJgMKBgw-BRYiMho2NAs4NRQmEVBrZVICawB2UgdrCjgNKQkRJBVyNhwhaT8nQz0CdhBRAyAcKD4sGAMiDDQMAzouHg5oB3dWCmN4.png",
    short_url: "/file/6L4ApDcy/social-iismm.png",
    mime_type: "image/png",
    file_type: "photo",
    file_size: 47844,
    width: 0,
    height: 0,
    created_at: "2026-08-14 01:10:34"
  },
  {
    id: 9,
    file_key: "nI19WoBu",
    user_id: "admin",
    folder_id: 1,
    name: "iismmlogo.png",
    slug_name: "iismmlogo.png",
    original_url: "https://filestore.pro-talk.ru/GgMpJwQ9JCkYKglyGHQPNFgWO1QkDTo2JwwBbEAlMh0BBithAiUGNGYbLhgZEyNVKz0sKzMVJgMKTC0Aag4bDwdMDhE4NRQmEVBrZVICawB2UgdrCjgNKQkRJBVyNhwhaT8nQz0CdhBRAyAcKD4sGAMiDDQMAzouHg5oB3dWCmN4.png",
    short_url: "/file/nI19WoBu/iismmlogo.png",
    mime_type: "image/png",
    file_type: "photo",
    file_size: 58579,
    width: 0,
    height: 0,
    created_at: "2026-08-14 01:10:31"
  }
];

export function seedEssentialFiles(db: Database) {
  try {
    // 1. Ensure folder id 1 exists
    db.run(`
      INSERT OR IGNORE INTO file_folders (id, user_id, name, color, folder_type, created_at)
      VALUES (1, 'admin', 'Картинки', '#0284c7', 'photo', '2026-08-14 01:00:00')
    `);

    // 2. Insert or replace each file in file_storage
    for (const f of ESSENTIAL_FILE_STORAGE_ITEMS) {
      db.run(`
        INSERT OR REPLACE INTO file_storage (
          id, file_key, user_id, folder_id, name, slug_name,
          original_url, short_url, mime_type, file_type, file_size, width, height, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        f.id, f.file_key, f.user_id, f.folder_id, f.name, f.slug_name,
        f.original_url, f.short_url, f.mime_type, f.file_type, f.file_size, f.width, f.height, f.created_at
      ]);

      // 3. File folder relation
      db.run(`
        INSERT OR REPLACE INTO file_folder_relations (file_id, folder_id)
        VALUES (?, ?)
      `, [f.id, f.folder_id]);

      // 4. Legacy files table record
      const legacyId = 'file_' + f.id + '_' + f.file_key;
      db.run(`
        INSERT OR REPLACE INTO files (
          id, user_id, original_name, name, full_url, short_key,
          short_url, file_type, mime_type, file_size, size_formatted, width, height, aspect_ratio, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        legacyId, f.user_id, f.name, f.name, f.original_url, f.file_key,
        f.short_url, f.file_type, f.mime_type, f.file_size, formatFileSize(f.file_size),
        f.width, f.height, 1, f.created_at
      ]);
    }
  } catch (err) {
    console.error('[SQLite] Error seeding essential file_storage items:', err);
  }
}

export function detectFileType(filename: string, mimeType: string = ''): 'photo' | 'video' | 'audio' | 'document' {
  const mime = (mimeType || '').toLowerCase();
  const ext = (filename || '').toLowerCase().split('.').pop() || '';

  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
    return 'photo';
  }
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) {
    return 'audio';
  }
  return 'document';
}

export function formatFileSize(bytes: number = 0): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Trigger: Ensure 4 default folders exist for a user
 */
export function ensureDefaultFoldersForUser(db: Database, userId: string = 'admin') {
  const normUserId = String(userId || 'admin').trim();
  const defaultCategories = [
    { name: 'Картинки', folder_type: 'photo', color: '#0284c7' },
    { name: 'Видео', folder_type: 'video', color: '#ec4899' },
    { name: 'Аудио', folder_type: 'audio', color: '#f97316' },
    { name: 'Файлы', folder_type: 'document', color: '#8b5cf6' },
  ];

  let newlyCreated = false;
  try {
    const stmt = db.prepare("SELECT * FROM file_folders WHERE user_id = ?");
    stmt.bind([normUserId]);
    const existingFolders: any[] = [];
    while (stmt.step()) {
      existingFolders.push(stmt.getAsObject());
    }
    stmt.free();

    for (const cat of defaultCategories) {
      const exists = existingFolders.some(f => f.folder_type === cat.folder_type || f.name === cat.name);
      if (!exists) {
        db.run(
          "INSERT INTO file_folders (user_id, name, color, folder_type) VALUES (?, ?, ?, ?)",
          [normUserId, cat.name, cat.color, cat.folder_type]
        );
        newlyCreated = true;
      }
    }
    if (newlyCreated) {
      try { saveDatabaseToDisk(); } catch (e) {}
    }
  } catch (err) {
    console.error('[SQLite] Error ensuring default folders:', err);
  }

  return getFoldersForUser(db, normUserId);
}

export function getFoldersForUser(db: Database, userId: string = 'admin') {
  const normUserId = String(userId || 'admin').trim();
  try {
    const stmt = db.prepare("SELECT * FROM file_folders WHERE user_id = ? OR user_id = 'admin' ORDER BY id ASC");
    stmt.bind([normUserId]);
    const res: any[] = [];
    const seenIds = new Set<number>();
    while (stmt.step()) {
      const obj = stmt.getAsObject();
      if (!seenIds.has(Number(obj.id))) {
        seenIds.add(Number(obj.id));
        res.push(obj);
      }
    }
    stmt.free();
    return res;
  } catch (e) {
    return [];
  }
}

/**
 * Register file into storage with multi-folder attachment
 */
export function registerFileInStorage(
  db: Database,
  params: {
    userId?: string;
    name: string;
    originalUrl: string;
    mimeType?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    folderIds?: (number | string)[];
    hostProtocol?: { host: string; protocol: string };
  }
) {
  const userId = String(params.userId || 'admin').trim();
  const name = params.name || 'file.bin';
  const originalUrl = params.originalUrl || '';
  const mimeType = params.mimeType || 'image/png';
  const fileSize = Number(params.fileSize || 0);
  const width = Number(params.width || 0);
  const height = Number(params.height || 0);

  const fileType = detectFileType(name, mimeType);
  const folders = ensureDefaultFoldersForUser(db, userId);

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let fileKey = '';
  for (let i = 0; i < 8; i++) fileKey += chars.charAt(Math.floor(Math.random() * chars.length));

  const slugName = slugifyFilename(name);

  const host = params.hostProtocol?.host || 'localhost:3000';
  const protocol = params.hostProtocol?.protocol || 'https';
  const shortUrl = `${protocol}://${host}/file/${fileKey}/${slugName}`;

  const targetDefaultFolder = folders.find((f: any) => f.folder_type === fileType);
  const assignedFolderIds = new Set<number>();

  if (Array.isArray(params.folderIds)) {
    params.folderIds.forEach(fid => {
      const parsed = Number(fid);
      if (!isNaN(parsed) && parsed > 0) {
        assignedFolderIds.add(parsed);
      }
    });
  }

  if (targetDefaultFolder && targetDefaultFolder.id) {
    assignedFolderIds.add(Number(targetDefaultFolder.id));
  }

  const primaryFolderId = Array.from(assignedFolderIds)[0] || (targetDefaultFolder?.id ? Number(targetDefaultFolder.id) : null);

  db.run(
    `INSERT INTO file_storage (file_key, user_id, folder_id, name, slug_name, original_url, short_url, mime_type, file_type, file_size, width, height)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [fileKey, userId, primaryFolderId, name, slugName, originalUrl, shortUrl, mimeType, fileType, fileSize, width, height]
  );

  const stmt = db.prepare("SELECT * FROM file_storage WHERE file_key = ?");
  stmt.bind([fileKey]);
  let insertedFile: any = null;
  if (stmt.step()) {
    insertedFile = stmt.getAsObject();
  }
  stmt.free();

  if (!insertedFile) return null;

  for (const fid of assignedFolderIds) {
    try {
      db.run("INSERT OR IGNORE INTO file_folder_relations (file_id, folder_id) VALUES (?, ?)", [insertedFile.id, fid]);
    } catch (e) {}
  }

  // Sync with legacy files table
  try {
    const legacyId = 'file_' + insertedFile.id + '_' + fileKey;
    db.run(
      `INSERT OR REPLACE INTO files (id, user_id, original_name, name, full_url, short_key, short_url, file_type, mime_type, file_size, size_formatted, width, height, aspect_ratio, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        legacyId,
        userId,
        name,
        name,
        originalUrl,
        fileKey,
        shortUrl,
        fileType,
        mimeType,
        fileSize,
        formatFileSize(fileSize),
        width,
        height,
        width && height ? width / height : 1,
        insertedFile.created_at || new Date().toISOString()
      ]
    );
  } catch (e) {}

  return {
    ...insertedFile,
    folderIds: Array.from(assignedFolderIds)
  };
}

/**
 * Fetch storage files for a user or admin, with folder relations
 */
export function getStorageFilesForUser(
  db: Database,
  userId: string = 'admin',
  options: { folderId?: number; search?: string } = {}
) {
  const normUserId = String(userId || 'admin').trim();
  ensureDefaultFoldersForUser(db, normUserId);

  let query = "";
  const queryParams: any[] = [];

  if (normUserId === 'all' || normUserId === 'admin') {
    if (options.folderId) {
      query = `
        SELECT fs.* FROM file_storage fs
        JOIN file_folder_relations ffr ON fs.id = ffr.file_id
        WHERE ffr.folder_id = ?
      `;
      queryParams.push(options.folderId);
    } else {
      query = "SELECT fs.* FROM file_storage fs WHERE 1=1";
    }
  } else {
    if (options.folderId) {
      query = `
        SELECT fs.* FROM file_storage fs
        JOIN file_folder_relations ffr ON fs.id = ffr.file_id
        WHERE (fs.user_id = ? OR fs.user_id = 'admin') AND ffr.folder_id = ?
      `;
      queryParams.push(normUserId, options.folderId);
    } else {
      query = "SELECT fs.* FROM file_storage fs WHERE (fs.user_id = ? OR fs.user_id = 'admin')";
      queryParams.push(normUserId);
    }
  }

  if (options.search) {
    query += " AND (fs.name LIKE ? OR fs.slug_name LIKE ? OR fs.file_key LIKE ?)";
    const term = `%${options.search}%`;
    queryParams.push(term, term, term);
  }

  query += " ORDER BY fs.id DESC";

  try {
    const stmt = db.prepare(query);
    stmt.bind(queryParams);
    const files: any[] = [];
    while (stmt.step()) {
      files.push(stmt.getAsObject());
    }
    stmt.free();

    // Attach folderIds to each file
    for (const f of files) {
      const relStmt = db.prepare("SELECT folder_id FROM file_folder_relations WHERE file_id = ?");
      relStmt.bind([f.id]);
      const folderIds: number[] = [];
      while (relStmt.step()) {
        const obj = relStmt.getAsObject();
        folderIds.push(Number(obj.folder_id));
      }
      relStmt.free();
      f.folderIds = folderIds;
    }

    return files;
  } catch (e) {
    console.error('[SQLite] Error fetching storage files:', e);
    return [];
  }
}

export function getAllFilesFromDb(db: Database) {
  try {
    const stmt = db.prepare("SELECT * FROM files ORDER BY created_at DESC");
    const res: any[] = [];
    while (stmt.step()) {
      res.push(stmt.getAsObject());
    }
    stmt.free();
    return res;
  } catch (e) {
    return [];
  }
}

