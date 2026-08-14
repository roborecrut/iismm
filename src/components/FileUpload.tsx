import React, { useRef } from 'react';
import { Paperclip, Loader2, UploadCloud } from 'lucide-react';
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
    const { upload, uploading, error } = useFileUpload();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileList: File[] = Array.from(files);
        for (const file of fileList) {
            try {
                const { key, url } = await upload(file);
                onUploaded(key, url, { name: file.name, type: file.type });
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }

        // Сброс input
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
                onUploaded(key, url, { name: file.name, type: file.type });
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

    if (variant === 'dropzone') {
        return (
            <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`border-2 border-dashed border-slate-300 hover:border-indigo-500/80 rounded-xl p-4 text-center transition-all bg-slate-50/80 hover:bg-indigo-50/30 cursor-pointer ${className}`}
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
                        <Loader2 className="animate-spin text-indigo-600" size={24} />
                    ) : (
                        <UploadCloud className="text-indigo-600" size={24} />
                    )}
                    <span className="text-xs font-bold text-slate-800">
                        {uploading ? 'Загрузка файла на сервер ИИSMM...' : buttonLabel}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                        Перетащите файл сюда или нажмите для выбора (картинки, видео, аудио, документы)
                    </span>
                    {error && <span className="text-xs text-rose-600 font-bold">{error}</span>}
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
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-600 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 border border-slate-200"
                    title="Загрузить файл на ИИSMM"
                >
                    {uploading ? <Loader2 className="animate-spin" size={14} /> : <Paperclip size={14} />}
                    <span className="text-xs">{uploading ? 'Загрузка...' : buttonLabel}</span>
                </label>
                {error && <span className="text-xs text-rose-600 ml-2 font-bold">{error}</span>}
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
                className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
                {uploading ? <Loader2 className="animate-spin" size={14} /> : <Paperclip size={14} />}
                <span>{uploading ? 'Загрузка на ИИSMM...' : buttonLabel}</span>
            </label>
            {error && <div className="text-[10px] text-rose-400 mt-1">{error}</div>}
        </div>
    );
};

export default FileUpload;
