import { useState } from 'react';
import { getUploadService, UploadProgressInfo } from '../services/FileUploadService';

export function useFileUpload() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgressInfo>({
        stage: 'uploading',
        percent: 0,
        secondsElapsed: 0
    });
    const [error, setError] = useState<string | null>(null);
    const service = getUploadService();

    const upload = async (file: File | string, key?: string) => {
        setUploading(true);
        setError(null);
        setProgress({ stage: 'uploading', percent: 0, secondsElapsed: 0 });
        
        try {
            const result = await service.uploadAndStore(file, key, (prog) => {
                setProgress(prog);
            });
            return result;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setError(msg);
            throw err;
        } finally {
            setUploading(false);
        }
    };

    const getUrl = (key: string) => service.getFileUrl(key);
    const replaceKeys = (text: string) => service.replaceKeysWithUrls(text);

    return {
        upload,
        getUrl,
        replaceKeys,
        uploading,
        progress,
        error,
        service
    };
}

