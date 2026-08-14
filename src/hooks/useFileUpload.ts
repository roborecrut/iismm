import { useState } from 'react';
import { getUploadService } from '../services/FileUploadService';

export function useFileUpload() {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const service = getUploadService();

    const upload = async (file: File | string, key?: string) => {
        setUploading(true);
        setError(null);
        
        try {
            const result = await service.uploadAndStore(file, key);
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
        error,
        service
    };
}
