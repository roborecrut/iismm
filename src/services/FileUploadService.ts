const UPLOAD_URL = "https://file.pro-talk.ru/tgf";
const STORAGE_KEY = "protalk_upload_token";
const FILES_MAP_KEY = "protalk_files_map";

export interface UploadProgressInfo {
    stage: 'uploading' | 'saving_gallery' | 'done';
    percent: number;
    secondsElapsed?: number;
    estimatedSecondsLeft?: number;
    loadedBytes?: number;
    totalBytes?: number;
}

export type UploadProgressCallback = (progress: UploadProgressInfo) => void;

interface FileMap {
    [key: string]: string; // key -> полный URL
}

export class FileUploadService {
    private token: string;

    constructor(token?: string) {
        this.token = token || this.getToken();
    }

    // Получение токена из настроек
    private getToken(): string {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return saved;
            }
        }
        // Токен по умолчанию
        return "b2VcU3NrVVttYlh3GHM_AEQ4eA8yDR4FGREODwsaLyUqQjpTEA8HGzMdFB8aORQYaG9dWGpkVQRvAXM";
    }

    // Установка токена
    public setToken(token: string): void {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.getItem(STORAGE_KEY);
            localStorage.setItem(STORAGE_KEY, token);
        }
    }

    // Загрузка по URL через серверный API
    async uploadFromUrl(url: string): Promise<string> {
        try {
            const proxyRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, token: this.token })
            });
            const proxyData = await proxyRes.json();
            if (proxyRes.ok && proxyData.url) {
                return proxyData.shortUrl || proxyData.url;
            }
            throw new Error(proxyData.error || 'Failed to upload from URL');
        } catch (err) {
            // Direct fallback to ProTalk if server API fails
            const response = await fetch(UPLOAD_URL, {
                method: "POST",
                headers: {
                    "X-Upload-Token": this.token
                },
                body: new URLSearchParams({ url })
            });
            if (!response.ok) {
                throw new Error(`Upload by URL failed with status ${response.status}`);
            }
            const data = await response.json();
            
            // Register in backend DB & generate short URL
            try {
                const regRes = await fetch('/api/files', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: data.url })
                });
                const regData = await regRes.json();
                if (regData.shortUrl) return regData.shortUrl;
            } catch (e) {}

            return data.url;
        }
    }

    // Загрузка из File через серверный API с трекингом прогресса и таймером сохранения в галерею
    async uploadFromFileWithProgress(
        file: File, 
        folderIds?: (number | string)[],
        onProgress?: UploadProgressCallback
    ): Promise<{ url: string; proxyUrl?: string; fileKey?: string; file?: any }> {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("token", this.token);
            if (folderIds && folderIds.length > 0) {
                folderIds.forEach(id => formData.append("folderIds", String(id)));
            }

            const xhr = new XMLHttpRequest();
            let timerInterval: any = null;
            let gallerySeconds = 0;

            const cleanupTimer = () => {
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
            };

            // Progress tracking for file bytes upload
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
                    onProgress({
                        stage: 'uploading',
                        percent,
                        loadedBytes: event.loaded,
                        totalBytes: event.total
                    });
                }
            };

            // When upload bytes are 100% transferred, start the gallery saving waiting timer
            xhr.upload.onload = () => {
                if (onProgress) {
                    onProgress({
                        stage: 'saving_gallery',
                        percent: 100,
                        secondsElapsed: 0,
                        estimatedSecondsLeft: 2
                    });

                    const startTime = Date.now();
                    timerInterval = setInterval(() => {
                        gallerySeconds = Math.round((Date.now() - startTime) / 100) / 10;
                        onProgress({
                            stage: 'saving_gallery',
                            percent: 100,
                            secondsElapsed: gallerySeconds,
                            estimatedSecondsLeft: Math.max(0, Math.round((2.5 - gallerySeconds) * 10) / 10)
                        });
                    }, 100);
                }
            };

            xhr.onload = async () => {
                cleanupTimer();
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const proxyData = JSON.parse(xhr.responseText);
                        if (proxyData && (proxyData.url || proxyData.proxyUrl)) {
                            if (onProgress) {
                                onProgress({
                                    stage: 'done',
                                    percent: 100,
                                    secondsElapsed: gallerySeconds
                                });
                            }
                            resolve({
                                url: proxyData.proxyUrl || proxyData.shortUrl || proxyData.url,
                                proxyUrl: proxyData.proxyUrl,
                                fileKey: proxyData.fileKey,
                                file: proxyData.file
                            });
                            return;
                        }
                    } catch (e) {}
                }

                // If proxy failed, try fallback
                try {
                    const fallbackRes = await this.uploadFromFile(file, folderIds);
                    if (onProgress) {
                        onProgress({ stage: 'done', percent: 100 });
                    }
                    resolve(fallbackRes);
                } catch (err) {
                    reject(err);
                }
            };

            xhr.onerror = async () => {
                cleanupTimer();
                try {
                    const fallbackRes = await this.uploadFromFile(file, folderIds);
                    if (onProgress) {
                        onProgress({ stage: 'done', percent: 100 });
                    }
                    resolve(fallbackRes);
                } catch (err) {
                    reject(err);
                }
            };

            xhr.open('POST', '/api/upload', true);
            xhr.send(formData);
        });
    }

    // Загрузка из File через серверный API
    async uploadFromFile(file: File, folderIds?: (number | string)[], onProgress?: UploadProgressCallback): Promise<{ url: string; proxyUrl?: string; fileKey?: string; file?: any }> {
        if (onProgress) {
            return this.uploadFromFileWithProgress(file, folderIds, onProgress);
        }
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("token", this.token);
            if (folderIds && folderIds.length > 0) {
                folderIds.forEach(id => formData.append("folderIds", String(id)));
            }

            const proxyRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const proxyData = await proxyRes.json();
            if (proxyRes.ok && (proxyData.url || proxyData.proxyUrl)) {
                return {
                    url: proxyData.proxyUrl || proxyData.shortUrl || proxyData.url,
                    proxyUrl: proxyData.proxyUrl,
                    fileKey: proxyData.fileKey,
                    file: proxyData.file
                };
            }
            throw new Error(proxyData.error || 'Failed to upload file');
        } catch (err) {
            // Direct fallback to ProTalk if server API fails
            const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
            const targetUrl = isPng ? "https://filestore.pro-talk.ru/up" : UPLOAD_URL;

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(targetUrl, {
                method: "POST",
                headers: {
                    "X-Upload-Token": this.token,
                    "X-Preserve-Alpha": "true"
                },
                body: formData
            });
            if (!response.ok) {
                throw new Error(`Upload file failed with status ${response.status}`);
            }
            const rawText = await response.text();
            let data: any = {};
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                const trimmed = rawText.trim().replace(/^["']|["']$/g, '');
                if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                    data = { url: trimmed, key: trimmed.split('/').pop() || '' };
                } else {
                    throw new Error(`Upload file failed: ${rawText}`);
                }
            }

            // Register in backend DB & generate short URL
            try {
                const regRes = await fetch('/api/files/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        original_url: data.url,
                        name: file.name,
                        file_size: file.size,
                        mime_type: file.type || 'image/png',
                        folder_ids: folderIds
                    })
                });
                const regData = await regRes.json();
                if (regData.file) {
                    return {
                        url: regData.file.short_url || data.url,
                        proxyUrl: regData.file.proxyUrl,
                        fileKey: regData.file.file_key,
                        file: regData.file
                    };
                }
            } catch (e) {}

            return { url: data.url };
        }
    }

    // Загрузка из Blob
    async uploadFromBlob(blob: Blob, filename: string): Promise<string> {
        const file = new File([blob], filename);
        const res = await this.uploadFromFile(file);
        return typeof res === 'string' ? res : res.url;
    }

    // Загрузка из base64
    async uploadFromBase64(base64: string, filename: string): Promise<string> {
        const response = await fetch(base64);
        const blob = await response.blob();
        return this.uploadFromBlob(blob, filename);
    }

    // Получение карты файлов
    private getFileMap(): FileMap {
        if (typeof window === 'undefined') return {};
        const saved = localStorage.getItem(FILES_MAP_KEY);
        return saved ? JSON.parse(saved) : {};
    }

    // Сохранение карты файлов
    private saveFileMap(map: FileMap): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(FILES_MAP_KEY, JSON.stringify(map));
        }
    }

    // Добавление файла в карту
    addFile(key: string, url: string): void {
        const map = this.getFileMap();
        map[key] = url;
        this.saveFileMap(map);
    }

    // Получение URL по ключу
    getFileUrl(key: string): string | null {
        const map = this.getFileMap();
        return map[key] || null;
    }

    // Удаление файла из карты
    removeFile(key: string): void {
        const map = this.getFileMap();
        delete map[key];
        this.saveFileMap(map);
    }

    // Получение всех файлов
    getAllFiles(): FileMap {
        return this.getFileMap();
    }

    // Очистка карты
    clearFiles(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(FILES_MAP_KEY);
        }
    }

    // Генерация уникального ключа
    generateKey(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Загрузка и сохранение в карту
    async uploadAndStore(file: File | string, customKey?: string, onProgress?: UploadProgressCallback): Promise<{ key: string; url: string }> {
        let url: string;
        
        if (typeof file === 'string') {
            // Это URL
            url = await this.uploadFromUrl(file);
            if (onProgress) onProgress({ stage: 'done', percent: 100 });
        } else {
            // Это File
            const res = await this.uploadFromFile(file, undefined, onProgress);
            url = typeof res === 'string' ? res : res.url;
        }

        const key = customKey || this.generateKey();
        this.addFile(key, url);

        return { key, url };
    }

    // Замена ключей на URL в тексте
    replaceKeysWithUrls(text: string): string {
        const map = this.getFileMap();
        let result = text;
        
        for (const [key, url] of Object.entries(map)) {
            // Заменяем {{key}} на полный URL
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), url);
        }
        
        return result;
    }

    // Замена URL на ключи в тексте
    replaceUrlsWithKeys(text: string): string {
        const map = this.getFileMap();
        let result = text;
        
        for (const [key, url] of Object.entries(map)) {
            result = result.replace(new RegExp(url, 'g'), `{{${key}}}`);
        }
        
        return result;
    }
}

// Синглтон
let uploadService: FileUploadService | null = null;

export function getUploadService(): FileUploadService {
    if (!uploadService) {
        uploadService = new FileUploadService();
    }
    return uploadService;
}
