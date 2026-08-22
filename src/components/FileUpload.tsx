import React, { useRef } from 'react';
import { Paperclip, Loader2, UploadCloud, CheckCircle2, Clock } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';

interface FileUploadProps {
    onUploaded?: (key: string, url: string, fileInfo?: { name: string; type: string }) => void;
    accept?: string;
    multiple?: boolean;
    buttonLabel?: string;
    className?: string;
    variant?: 'button' | 'dropzone' | 'compact';
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
    onUploaded, 
    accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt",
    multiple = false,
    buttonLabel = "Прикрепить файл",
    className = "",
    variant = "button"
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { upload, uploading, progress, error } = useFileUpload();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileList: File[] = Array.from(files);
        for (const file of fileList) {
            try {
                const { key, url } = await upload(file);
                if (onUploaded) {
                    onUploaded(key, url, { name: file.name, type: file.type });
                }
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }

        // Reset input
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (uploading) return;

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        const fileList: File[] = Array.from(files);
        for (const file of fileList) {
            try {
                const { key, url } = await upload(file);
                if (onUploaded) {
                    onUploaded(key, url, { name: file.name, type: file.type });
                }
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const uniqueId = `file-input-${Math.random().toString(36).substring(2, 9)}`;

    // Render progress message
    const renderProgressText = () => {
        if (!uploading) return buttonLabel;
        if (progress.stage === 'uploading') {
            return `Загрузка файла: ${progress.percent}%`;
        }
        if (progress.stage === 'saving_gallery') {
            const secs = (progress.secondsElapsed || 0).toFixed(1);
            return `Сохранение в галерею... ⏳ ${secs} сек`;
        }
        return 'Файл обработан!';
    };

    if (variant === 'dropzone') {
        return (
            <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`border-2 border-dashed border-pink-300 hover:border-pink-400 rounded-2xl p-4 text-center transition-all bg-white/90 hover:bg-white cursor-pointer ${className}`}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                    id={uniqueId}
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                    {uploading ? (
                        <div className="relative">
                            <Loader2 className="animate-spin text-pink-600" size={28} />
                            {progress.stage === 'saving_gallery' && (
                                <Clock className="absolute -top-1 -right-2 text-orange-500 animate-pulse" size={14} />
                            )}
                        </div>
                    ) : (
                        <UploadCloud className="text-pink-600" size={28} />
                    )}
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-800">
                            {renderProgressText()}
                        </span>
                        {uploading && (
                            <div className="w-48 bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden border border-pink-200">
                                <div 
                                    className="h-full bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 transition-all duration-200"
                                    style={{ width: `${progress.percent}%` }}
                                />
                            </div>
                        )}
                    </div>
                    <span className="text-sm text-slate-600 font-medium">
                        Перетащите файл сюда или нажмите для выбора (картинки, видео, аудио, документы)
                    </span>
                    {error && <span className="text-sm text-rose-600 font-bold">{error}</span>}
                </div>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={`inline-flex items-center ${className}`}>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                    id={uniqueId}
                />
                <label 
                    htmlFor={uniqueId} 
                    className="px-3 py-2 bg-gradient-to-r from-sky-50 via-pink-50 to-orange-50 hover:bg-white text-pink-700 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center space-x-2 border border-pink-200 shadow-2xs"
                    title="Загрузить файл"
                >
                    {uploading ? <Loader2 className="animate-spin text-pink-600 shrink-0" size={16} /> : <Paperclip size={16} className="text-pink-600 shrink-0" />}
                    <span className="text-sm">{renderProgressText()}</span>
                </label>
                {error && <span className="text-sm text-rose-600 ml-2 font-bold">{error}</span>}
            </div>
        );
    }

    return (
        <div className={`file-upload inline-block ${className}`}>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                id={uniqueId}
            />
            <label 
                htmlFor={uniqueId} 
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 hover:opacity-95 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
                {uploading ? <Loader2 className="animate-spin shrink-0" size={16} /> : <Paperclip size={16} className="shrink-0" />}
                <span className="text-sm">{renderProgressText()}</span>
            </label>
            {error && <div className="text-sm text-rose-500 mt-1 font-bold">{error}</div>}
        </div>
    );
};

export default FileUpload;

