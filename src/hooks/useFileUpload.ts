import { useState, useRef } from 'react';
import { getUploadService, UploadProgressInfo, UploadFileOptions } from '../services/FileUploadService';

export function useFileUpload() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgressInfo>({
        stage: 'uploading',
        percent: 0,
        secondsElapsed: 0
    });
    const [error, setError] = useState<string | null>(null);
    const service = getUploadService();
    const abortRef = useRef<boolean>(false);

    const cancel = () => {
        abortRef.current = true;
        setUploading(false);
        setError('Загрузка отменена');
        setProgress({ stage: 'done', percent: 0 });
    };

    const upload = async (file: File | string, key?: string, options?: UploadFileOptions) => {
        abortRef.current = false;
        setUploading(true);
        setError(null);
        setProgress({ stage: 'uploading', percent: 0, secondsElapsed: 0 });
        
        try {
            const result = await service.uploadAndStore(file, key, (prog) => {
                if (!abortRef.current) {
                    setProgress(prog);
                }
            }, options);
            return result;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setError(msg);
            throw err;
        } finally {
            setUploading(false);
        }
    };

    const uploadBatch = async (
        files: File[],
        onEachComplete?: (key: string, url: string, file: File, index: number, total: number) => void,
        options?: UploadFileOptions
    ) => {
        if (!files || files.length === 0) return [];
        abortRef.current = false;
        setUploading(true);
        setError(null);
        const results: { key: string; url: string; file: File }[] = [];
        const total = files.length;

        try {
            for (let i = 0; i < total; i++) {
                if (abortRef.current) {
                    break;
                }
                const file = files[i];
                const currentIdx = i + 1;

                // Reset progress and timer explicitly before starting next file
                setProgress({
                    stage: 'uploading',
                    percent: 0,
                    secondsElapsed: 0,
                    batchIndex: currentIdx,
                    batchTotal: total,
                    currentFileName: file.name
                });

                let result: any = null;
                let lastErr: any = null;

                // Try with automatic retry for resilience
                for (let attempt = 1; attempt <= 2; attempt++) {
                    if (abortRef.current) break;
                    try {
                        result = await service.uploadAndStore(file, undefined, (prog) => {
                            if (!abortRef.current) {
                                setProgress({
                                    ...prog,
                                    batchIndex: currentIdx,
                                    batchTotal: total,
                                    currentFileName: file.name
                                });
                            }
                        }, options);
                        if (result) break;
                    } catch (e: any) {
                        lastErr = e;
                        console.warn(`[uploadBatch] File ${file.name} attempt ${attempt} failed:`, e.message);
                        if (attempt < 2 && !abortRef.current) {
                            await new Promise(r => setTimeout(r, 500));
                        }
                    }
                }

                if (abortRef.current) break;

                if (result) {
                    results.push({ key: result.key, url: result.url, file });
                    if (onEachComplete) {
                        try {
                            onEachComplete(result.key, result.url, file, currentIdx, total);
                        } catch (cbErr) {
                            console.error('onEachComplete callback error:', cbErr);
                        }
                    }
                } else if (lastErr) {
                    console.error(`[uploadBatch] Failed to upload ${file.name}:`, lastErr);
                }

                // Short transition delay between files so network connections settle
                if (i < total - 1 && !abortRef.current) {
                    await new Promise(r => setTimeout(r, 200));
                }
            }

            if (!abortRef.current) {
                setProgress({
                    stage: 'done',
                    percent: 100,
                    batchIndex: total,
                    batchTotal: total
                });
            }
            return results;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Batch upload failed';
            setError(msg);
            throw err;
        } finally {
            setUploading(false);
        }
    };

    const convertAudioToOgg = async (fileOrUrl: File | string, folderIds?: (number | string)[]) => {
        setUploading(true);
        setError(null);
        setProgress({ stage: 'uploading', percent: 30 });
        try {
            const res = await service.convertAudioToOgg(fileOrUrl, folderIds, (prog) => {
                setProgress(prog);
            });
            return res;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Audio conversion failed';
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
        uploadBatch,
        convertAudioToOgg,
        getUrl,
        replaceKeys,
        uploading,
        progress,
        error,
        cancel,
        service
    };
}

