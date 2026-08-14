import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  CalendarDays,
  History as HistoryIcon,
  Video, 
  Music, 
  FileText, 
  Upload, 
  Copy, 
  Check, 
  Download, 
  PlusCircle, 
  Send, 
  Trash2, 
  Search, 
  Loader2, 
  ExternalLink,
  Folder,
  FolderPlus,
  Layers,
  Link as LinkIcon,
  AlertCircle,
  FileCode,
  CheckCircle2,
  X,
  User as UserIcon,
  CheckSquare,
  Square,
  FolderOutput,
  Eye
} from 'lucide-react';
import { MediaFile, Channel, User } from '../types';
import { CachedMediaImage } from './CachedMediaImage';
import { preloadMediaFiles, clearMediaCache } from '../utils/mediaCache';

interface FileFolder {
  id: number;
  user_id: string;
  name: string;
  color: string;
  folder_type: 'photo' | 'video' | 'audio' | 'document' | 'custom';
  fileCount?: number;
}

interface GalleryViewProps {
  currentUser: User | null;
  channels: Channel[];
  setActiveTab?: (tab: string) => void;
  onSelectPostForEdit?: (postId: string) => void;
  isAdminView?: boolean;
  onNavigate?: (path: string) => void;
}

export default function GalleryView({
  currentUser,
  channels,
  setActiveTab,
  onSelectPostForEdit,
  isAdminView = false,
  onNavigate
}: GalleryViewProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<number | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | 'photo' | 'video' | 'audio' | 'document'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Batch Selection state
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isBatchMoveOpen, setIsBatchMoveOpen] = useState(false);
  const [batchMoveFolderIds, setBatchMoveFolderIds] = useState<number[]>([]);

  // Create Folder modal state
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#ec4899');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [directUrl, setDirectUrl] = useState('');
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Preview Modal state
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  // Deletion Confirmation Modal states
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick Post Modal State
  const [quickPostFile, setQuickPostFile] = useState<MediaFile | null>(null);
  const [quickPostTitle, setQuickPostTitle] = useState('');
  const [quickPostText, setQuickPostText] = useState('');
  const [quickPostChannel, setQuickPostChannel] = useState('');
  const [isSendingQuickPost, setIsSendingQuickPost] = useState(false);
  const [quickPostSuccess, setQuickPostSuccess] = useState<string | null>(null);
  const [quickPostError, setQuickPostError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetUserId = isAdminView ? 'admin' : (currentUser?.id || 'admin');

  // Trigger: Fetch folders and ensure 4 default folders exist
  const loadFolders = async () => {
    try {
      const endpoint = isAdminView
        ? '/api/admin/file-folders?userId=admin'
        : `/api/file-folders?userId=${encodeURIComponent(currentUser?.id || 'admin')}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  };

  // Load files from backend
  const loadFiles = async () => {
    setIsLoading(true);
    try {
      let endpoint = isAdminView
        ? '/api/admin/files?userId=admin'
        : `/api/files?userId=${encodeURIComponent(currentUser?.id || 'admin')}`;
      
      if (activeFolderId !== 'all') {
        endpoint += `&folderId=${activeFolderId}`;
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const loadedFiles = data.files || [];
        setFiles(loadedFiles);
        // Preload & Cache in browser memory + Cache API
        const urlsToCache = loadedFiles.map((f: any) => f.fullUrl || f.originalUrl || f.url);
        preloadMediaFiles(urlsToCache);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
    loadFiles();
  }, [currentUser?.id, isAdminView, activeFolderId]);

  // Create new folder handler
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const endpoint = isAdminView ? '/api/admin/file-folders' : '/api/file-folders';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          color: newFolderColor,
          userId: targetUserId
        })
      });

      if (res.ok) {
        setNewFolderName('');
        setShowCreateFolderModal(false);
        await loadFolders();
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка при создании папки');
      }
    } catch (err: any) {
      alert('Ошибка при создании папки: ' + err.message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Delete custom folder
  const handleDeleteFolder = async (folderId: number, folderName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить папку «${folderName}»? Файлы в ней останутся сохранены.`)) return;

    try {
      const endpoint = isAdminView ? `/api/admin/file-folders/${folderId}` : `/api/file-folders/${folderId}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        if (activeFolderId === folderId) setActiveFolderId('all');
        await loadFolders();
        await loadFiles();
      }
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  };

  // Upload files handler with PNG X-Preserve-Alpha support
  const handleFileUpload = async (fileList: FileList | File[]) => {
    const selectedFiles: File[] = Array.from(fileList);
    if (selectedFiles.length === 0) return;

    const filesToUpload = selectedFiles.slice(0, 10);
    setIsUploading(true);
    setUploadProgress(`Загрузка 1 из ${filesToUpload.length}...`);

    let uploadedCount = 0;
    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgress(`Загрузка ${i + 1} из ${filesToUpload.length}: ${file.name}...`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', targetUserId);
        
        if (activeFolderId !== 'all') {
          formData.append('folderId', String(activeFolderId));
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'x-user-id': targetUserId },
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Ошибка при загрузке ${file.name} (код ${res.status})`);
        }
        uploadedCount++;
      }
      setUploadProgress(`Успешно загружено файлов: ${uploadedCount}`);
      await loadFiles();
      await loadFolders();
      setTimeout(() => setUploadProgress(''), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Ошибка при загрузке файлов: ' + (err.message || 'Ошибка сети'));
      setUploadProgress('');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Direct URL submission handler
  const handleAddDirectUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;

    setIsSubmittingUrl(true);
    try {
      const endpoint = isAdminView ? '/api/admin/files/register' : '/api/files/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: directUrl.trim(),
          userId: targetUserId,
          folder_ids: activeFolderId !== 'all' ? [activeFolderId] : []
        })
      });

      if (res.ok) {
        setDirectUrl('');
        setShowUrlInput(false);
        await loadFiles();
        await loadFolders();
      } else {
        const data = await res.json();
        alert(data.error || 'Не удалось сохранить ссылку');
      }
    } catch (err: any) {
      alert('Ошибка при сохранении ссылки: ' + err.message);
    } finally {
      setIsSubmittingUrl(false);
    }
  };

  // Batch Selection Toggle
  const toggleSelectFile = (id: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiles = () => {
    setSelectedFileIds(new Set(filteredFiles.map(f => String(f.id))));
  };

  const clearSelection = () => {
    setSelectedFileIds(new Set());
  };

  // Batch Delete Files Trigger
  const handleBatchDelete = () => {
    if (selectedFileIds.size === 0) return;
    setShowBatchDeleteModal(true);
  };

  const confirmBatchDelete = async () => {
    if (selectedFileIds.size === 0) return;
    try {
      const endpoint = isAdminView ? '/api/admin/files/batch-delete' : '/api/files/batch-delete';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_ids: Array.from(selectedFileIds) })
      });

      if (res.ok) {
        clearSelection();
        await loadFiles();
        await loadFolders();
      }
    } catch (err) {
      console.error('Batch delete error:', err);
    } finally {
      setShowBatchDeleteModal(false);
    }
  };

  // Batch Move Files
  const handleBatchMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFileIds.size === 0 || batchMoveFolderIds.length === 0) return;

    try {
      const endpoint = isAdminView ? '/api/admin/files/batch-move' : '/api/files/batch-move';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: Array.from(selectedFileIds),
          folder_ids: batchMoveFolderIds,
          mode: 'add'
        })
      });

      if (res.ok) {
        setIsBatchMoveOpen(false);
        setBatchMoveFolderIds([]);
        clearSelection();
        await loadFiles();
        await loadFolders();
      }
    } catch (err) {
      console.error('Batch move error:', err);
    }
  };

  // Delete single file Trigger
  const handleDeleteFile = (id: string) => {
    const target = files.find(f => String(f.id) === String(id));
    if (target) {
      setFileToDelete(target);
    }
  };

  const confirmDeleteSingleFile = async () => {
    if (!fileToDelete) return;
    try {
      const endpoint = isAdminView ? `/api/admin/files/${fileToDelete.id}` : `/api/files/${fileToDelete.id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        setFiles(prev => prev.filter(f => String(f.id) !== String(fileToDelete.id)));
        await loadFolders();
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    } finally {
      setFileToDelete(null);
    }
  };

  // Copy link helper
  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Create Post editor with this file
  const handleCreatePostWithFile = (file: MediaFile) => {
    localStorage.setItem('protalk_preset_attachment', JSON.stringify({
      type: file.fileType,
      url: (file as any).proxyUrl || file.shortUrl || file.fullUrl,
      fileName: file.originalName || file.name
    }));

    if (onSelectPostForEdit) {
      onSelectPostForEdit('new');
    } else if (setActiveTab) {
      setActiveTab('posts');
    }
  };

  // Submit Quick Post
  const handleSendQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPostFile || !quickPostTitle.trim()) return;

    setIsSendingQuickPost(true);
    setQuickPostError(null);
    setQuickPostSuccess(null);

    const targetChannel = quickPostChannel || (channels[0]?.username || '@SAV_AI');

    try {
      const res = await fetch('/api/send-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.id ? { 'x-user-id': currentUser.id } : {})
        },
        body: JSON.stringify({
          title: quickPostTitle,
          content: quickPostText || quickPostTitle,
          channel: targetChannel,
          channels: [targetChannel],
          attachmentType: quickPostFile.fileType,
          attachmentUrl: (quickPostFile as any).proxyUrl || quickPostFile.shortUrl || quickPostFile.fullUrl,
          messageFormat: 'v2',
          userId: currentUser?.id
        })
      });

      const data = await res.json();
      if (data.success) {
        setQuickPostSuccess(`Пост успешно опубликован в канал ${targetChannel}!`);
        setTimeout(() => {
          setQuickPostFile(null);
          setQuickPostTitle('');
          setQuickPostText('');
          setQuickPostSuccess(null);
        }, 1800);
      } else {
        setQuickPostError(data.error || 'Ошибка при отправке поста');
      }
    } catch (err: any) {
      setQuickPostError('Ошибка сети: ' + err.message);
    } finally {
      setIsSendingQuickPost(false);
    }
  };

  // Filter files by category & search query
  const filteredFiles = files.filter(file => {
    const matchesCat = activeCategory === 'all' || file.fileType === activeCategory;
    const matchesQuery = !searchQuery || 
      (file.name && file.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (file.originalName && file.originalName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (file.shortKey && file.shortKey.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ((file as any).slugName && (file as any).slugName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const categoryCounts = {
    all: files.length,
    photo: files.filter(f => f.fileType === 'photo').length,
    video: files.filter(f => f.fileType === 'video' || f.fileType === 'video_note').length,
    audio: files.filter(f => f.fileType === 'audio').length,
    document: files.filter(f => f.fileType === 'document').length,
  };

  const handleNav = (targetPath: string) => {
    if (onNavigate) {
      onNavigate(targetPath);
    } else if (setActiveTab) {
      setActiveTab(targetPath.replace('/', ''));
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`space-y-6 text-left relative transition-all duration-300 ${
        isDragOver ? 'ring-4 ring-pink-400/60 rounded-3xl bg-pink-50/40 p-2' : ''
      }`}
    >
      {/* Drag Overlay Banner */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-sky-100/80 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-pink-400 rounded-3xl m-6 p-8 text-pink-700 animate-pulse">
          <Upload size={64} className="text-pink-500 mb-4 animate-bounce" />
          <h2 className="text-2xl font-black">Перетащите файлы сюда для загрузки</h2>
          <p className="text-sm font-bold text-slate-700 mt-2">
            Файлы автоматически добавятся в нужно категории и папки
          </p>
        </div>
      )}

      {/* Top Header / Mode Switcher */}
      {!isAdminView ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-2xl p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600 flex items-center space-x-2">
              <ImageIcon className="text-pink-500" size={22} />
              <span>Галерея файлов и Storage</span>
            </h2>
            <p className="text-xs text-slate-700 font-medium mt-1">
              Управление собственными медиафайлами, папками и адресами в системе ProTalk
            </p>
          </div>

          <div className="flex items-center bg-white/80 p-1.5 rounded-xl border border-pink-200/80 flex-wrap gap-1.5 shadow-2xs">
            <button
              onClick={() => handleNav('/calendar')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-slate-700 hover:text-slate-900 hover:bg-pink-50"
            >
              <CalendarDays size={15} />
              <span>Календарь</span>
            </button>

            <button
              onClick={() => handleNav('/gallery')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md"
            >
              <ImageIcon size={15} />
              <span>Галерея</span>
            </button>

            <button
              onClick={() => handleNav('/history')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-slate-700 hover:text-slate-900 hover:bg-pink-50"
            >
              <HistoryIcon size={15} />
              <span>История</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600 flex items-center space-x-2">
              <Folder className="text-pink-500" size={20} />
              <span>Admin File Storage (Файлы Администратора)</span>
            </h2>
            <p className="text-xs text-slate-700 font-medium mt-0.5">
              Собственный файловый Storage для системных баннеров, логотипов и контента администратора.
            </p>
          </div>
        </div>
      )}

      {/* Hidden File Input for Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files || [])}
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        className="hidden"
      />

      {/* Admin View: Storage Folders Panel ONLY */}
      {isAdminView ? (
        <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Folder size={18} className="text-pink-500" />
              <h3 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                Папки Storage ({folders.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl text-xs font-black border border-pink-200 transition-all cursor-pointer shadow-2xs"
              >
                <FolderPlus size={14} className="text-pink-500" />
                <span>Создать папку</span>
              </button>

              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/80 hover:bg-white text-slate-800 rounded-xl text-xs font-black border border-pink-200 transition-all cursor-pointer shadow-2xs"
              >
                <LinkIcon size={14} className="text-pink-500" />
                <span>Добавить по ссылке</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-xl text-xs font-black transition-all shadow-md hover:opacity-95 cursor-pointer active:scale-95"
              >
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                <span>Загрузить файлы (до 10 шт)</span>
              </button>
            </div>
          </div>

          {/* Folders Pills Bar */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => setActiveFolderId('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeFolderId === 'all'
                  ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md'
                  : 'bg-white/80 text-slate-700 hover:bg-white border border-pink-200/80'
              }`}
            >
              📁 Все файлы ({files.length})
            </button>

            {folders.map(folder => {
              const isActive = activeFolderId === folder.id;
              return (
                <div key={folder.id} className="relative group inline-flex items-center">
                  <button
                    onClick={() => setActiveFolderId(folder.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white border-transparent shadow-md'
                        : 'bg-white/80 text-slate-800 hover:bg-white border-pink-200/80'
                    }`}
                    style={!isActive && folder.color ? { borderLeftColor: folder.color, borderLeftWidth: '4px' } : {}}
                  >
                    <span>{folder.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white/30 text-white' : 'bg-pink-100 text-pink-700'
                    }`}>
                      {folder.fileCount || 0}
                    </span>
                  </button>

                  {folder.folder_type === 'custom' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id, folder.name);
                      }}
                      className="ml-1 text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Удалить папку"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* User View: Categories and Actions Panel ONLY */
        <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 backdrop-blur-md border border-pink-200/80 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Все медиа', icon: Layers, count: categoryCounts.all },
              { id: 'photo', label: 'Фото', icon: ImageIcon, count: categoryCounts.photo },
              { id: 'video', label: 'Видео', icon: Video, count: categoryCounts.video },
              { id: 'audio', label: 'Аудио', icon: Music, count: categoryCounts.audio },
              { id: 'document', label: 'Файлы', icon: FileText, count: categoryCounts.document },
            ].map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white shadow-md'
                      : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-pink-200/60'
                  }`}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                  <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/30 text-white' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/80 hover:bg-white text-slate-800 rounded-xl text-xs font-black border border-pink-200 transition-all cursor-pointer shadow-2xs"
            >
              <LinkIcon size={14} className="text-pink-500" />
              <span>Добавить по ссылке</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-xl text-xs font-black transition-all shadow-md hover:opacity-95 cursor-pointer active:scale-95"
            >
              {isUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              <span>Загрузить файлы (до 10 шт)</span>
            </button>
          </div>
        </div>
      )}

      {/* Mass Actions Toolbar */}
      {selectedFileIds.size > 0 && (
        <div className="bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckSquare size={18} />
            <span className="text-xs font-black">
              Выбрано файлов: {selectedFileIds.size} из {filteredFiles.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsBatchMoveOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
            >
              <FolderOutput size={14} className="text-pink-500" />
              <span>Переместить в папку...</span>
            </button>

            <button
              onClick={handleBatchDelete}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
            >
              <Trash2 size={14} />
              <span>Удалить выбранные</span>
            </button>

            <button
              onClick={clearSelection}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all"
            >
              Сбросить
            </button>
          </div>
        </div>
      )}

      {/* Progress / Status Notification */}
      {(isUploading || uploadProgress) && (
        <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 p-4 rounded-xl flex items-center space-x-3 text-xs text-pink-900 shadow-sm animate-fadeIn">
          {isUploading ? (
            <Loader2 size={18} className="animate-spin text-pink-500 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-pink-600 shrink-0" />
          )}
          <span className="font-extrabold">{uploadProgress}</span>
        </div>
      )}

      {/* Add Direct URL Form */}
      {showUrlInput && (
        <form onSubmit={handleAddDirectUrl} className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-200/80 rounded-xl p-4 flex flex-col md:flex-row gap-3 shadow-md animate-fadeIn">
          <div className="flex-1 relative">
            <LinkIcon size={16} className="absolute left-3.5 top-3 text-pink-400" />
            <input
              type="url"
              required
              value={directUrl}
              onChange={(e) => setDirectUrl(e.target.value)}
              placeholder="Вставьте прямую ссылку на файл (https://file.pro-talk.ru/tgf/...)"
              className="w-full bg-white/90 border border-pink-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingUrl}
            className="px-4 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-xs"
          >
            {isSubmittingUrl ? 'Сохранение...' : 'Сохранить в Storage'}
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="px-3 py-2 bg-white/80 hover:bg-white border border-pink-200 text-slate-700 rounded-xl text-xs font-bold"
          >
            Отмена
          </button>
        </form>
      )}

      {/* Search Bar & Select All Bar */}
      <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3 flex-1">
          <Search size={16} className="text-pink-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию файла, транскрипции или коду..."
            className="w-full bg-transparent border-none text-xs text-slate-800 focus:outline-none placeholder-slate-400 font-sans font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-700">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={selectedFileIds.size === filteredFiles.length ? clearSelection : selectAllFiles}
          className="text-xs font-bold text-slate-700 hover:text-pink-600 flex items-center space-x-1.5 shrink-0"
        >
          {selectedFileIds.size === filteredFiles.length && filteredFiles.length > 0 ? (
            <>
              <CheckSquare size={14} className="text-pink-500" />
              <span>Снять выбор</span>
            </>
          ) : (
            <>
              <Square size={14} />
              <span>Выбрать все</span>
            </>
          )}
        </button>
      </div>

      {/* Files Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 size={36} className="text-pink-500 animate-spin" />
          <p className="text-xs text-slate-600 font-bold">Загрузка файлов из Storage...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-200/80 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-white/80 border border-pink-200 flex items-center justify-center mx-auto text-pink-500">
            <ImageIcon size={24} />
          </div>
          <h3 className="text-sm font-black text-slate-900">В хранилище пока нет файлов</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
            Нажмите кнопку «Загрузить файлы» или перетащите файлы в окно галереи.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredFiles.map((file) => {
            const isSelected = selectedFileIds.has(String(file.id));
            const isCopiedShort = copiedId === `short_${file.id}`;
            const isCopiedProxy = copiedId === `proxy_${file.id}`;

            const fileProxyUrl = (file as any).proxyUrl || `/file/${file.id}/${(file as any).slugName || file.name}`;

            return (
              <div 
                key={file.id} 
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    toggleSelectFile(String(file.id));
                  }
                }}
                className={`bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all duration-200 group relative ${
                  isSelected ? 'border-pink-500 ring-2 ring-pink-400' : 'border-pink-200/80 hover:border-pink-300'
                }`}
              >
                {/* Select Checkbox & Badge Header */}
                <div className="flex items-start justify-between gap-2 z-10">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectFile(String(file.id));
                      }}
                      className="text-pink-500 hover:text-pink-600 transition-colors p-0.5"
                    >
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-400" />}
                    </button>

                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-white/90 text-slate-800 border border-pink-200/80">
                      {file.fileType === 'photo' && <ImageIcon size={11} className="text-sky-500" />}
                      {file.fileType === 'video' && <Video size={11} className="text-pink-500" />}
                      {file.fileType === 'audio' && <Music size={11} className="text-orange-500" />}
                      {file.fileType === 'document' && <FileText size={11} className="text-purple-500" />}
                      <span>{file.fileType}</span>
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-pink-200/60 font-bold">
                    {file.sizeFormatted || '0 KB'}
                  </span>
                </div>

                {/* File Preview Container with Alpha Grid Background for PNGs */}
                <div 
                  onClick={() => setPreviewFile(file)}
                  className="bg-white/90 border border-pink-200/80 rounded-xl overflow-hidden flex items-center justify-center p-2 min-h-[160px] max-h-[220px] cursor-pointer relative group-hover:brightness-95 transition-all bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px]"
                >
                  {file.fileType === 'photo' ? (
                    <CachedMediaImage 
                      src={file.fullUrl || (file as any).originalUrl} 
                      alt={file.originalName || file.name} 
                      className="max-h-[200px] w-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : file.fileType === 'video' || file.fileType === 'video_note' ? (
                    <video 
                      src={file.fullUrl || (file as any).originalUrl} 
                      controls 
                      className="max-h-[200px] w-full object-contain rounded-lg bg-slate-100"
                    />
                  ) : file.fileType === 'audio' ? (
                    <div className="w-full text-center p-4 space-y-3">
                      <div className="w-12 h-12 bg-orange-100 border border-orange-200 text-orange-500 rounded-full flex items-center justify-center mx-auto">
                        <Music size={24} />
                      </div>
                      <audio src={file.fullUrl || (file as any).originalUrl} controls className="w-full h-8" />
                    </div>
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <div className="w-12 h-12 bg-sky-100 border border-sky-200 text-sky-500 rounded-2xl flex items-center justify-center mx-auto">
                        <FileCode size={24} />
                      </div>
                      <p className="text-[11px] font-mono text-slate-700 truncate max-w-[180px] font-bold">{file.originalName || file.name}</p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="p-2 bg-white/90 rounded-full text-pink-600 shadow-md">
                      <Eye size={18} />
                    </span>
                  </div>
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900 truncate" title={file.originalName || file.name}>
                    {file.originalName || file.name}
                  </h4>

                  {/* Slug / Proxy URL address */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between bg-white/90 p-1.5 rounded-lg border border-pink-200/80 text-[10px] font-mono">
                      <span className="text-sky-700 font-bold truncate pr-1" title={fileProxyUrl}>
                        {fileProxyUrl}
                      </span>
                      <button
                        onClick={() => handleCopyLink(window.location.origin + fileProxyUrl, `proxy_${file.id}`)}
                        className="text-slate-500 hover:text-slate-900 shrink-0 p-1 hover:bg-pink-100 rounded transition-colors"
                        title="Скопировать адрес /file/id:name"
                      >
                        {isCopiedProxy ? <Check size={12} className="text-sky-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="pt-2 border-t border-pink-200/80 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCreatePostWithFile(file)}
                    className="flex items-center justify-center space-x-1.5 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white py-1.5 px-2 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-2xs hover:opacity-95"
                    title="Создать новый пост с этим файлом"
                  >
                    <PlusCircle size={13} />
                    <span>Создать пост</span>
                  </button>

                  <button
                    onClick={() => {
                      setQuickPostFile(file);
                      setQuickPostTitle(`Публикация: ${file.originalName || file.name}`);
                      setQuickPostText('');
                      setQuickPostChannel(channels[0]?.username || '@SAV_AI');
                    }}
                    className="flex items-center justify-center space-x-1.5 bg-white/90 hover:bg-white text-slate-800 border border-pink-200 py-1.5 px-2 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-2xs"
                    title="Быстрая отправка поста в канал"
                  >
                    <Send size={13} className="text-pink-500" />
                    <span>Быстрый пост</span>
                  </button>
                </div>

                {/* Footer Link / Download / Delete */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <a
                    href={file.fullUrl || (file as any).originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-sky-600 font-bold flex items-center space-x-1 transition-colors"
                    title="Скачать / Открыть оригинал"
                  >
                    <Download size={12} />
                    <span>Скачать</span>
                  </a>

                  <button
                    onClick={() => handleDeleteFile(String(file.id))}
                    className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                    title="Удалить из Storage"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Preview Modal (with Alpha Transparency Checkered Grid) */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 animate-fadeIn">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative text-left">
            <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
              <h3 className="text-sm font-black text-slate-900 truncate pr-4">
                {previewFile.originalName || previewFile.name}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white/80 rounded-xl border border-pink-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Media Viewer with Checkered Grid for Alpha Transparency */}
            <div className="bg-[conic-gradient(#f1f5f9_90deg,#fff_90deg_180deg,#f1f5f9_180deg_270deg,#fff_270deg)] bg-[size:16px_16px] border border-pink-200 rounded-2xl overflow-hidden min-h-[250px] max-h-[420px] flex items-center justify-center p-4">
              {previewFile.fileType === 'photo' ? (
                <CachedMediaImage 
                  src={previewFile.fullUrl || (previewFile as any).originalUrl} 
                  alt={previewFile.name} 
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-sm"
                />
              ) : previewFile.fileType === 'video' ? (
                <video 
                  src={previewFile.fullUrl || (previewFile as any).originalUrl} 
                  controls 
                  className="max-h-[380px] w-full object-contain rounded-lg"
                />
              ) : previewFile.fileType === 'audio' ? (
                <audio src={previewFile.fullUrl || (previewFile as any).originalUrl} controls className="w-full" />
              ) : (
                <div className="text-center space-y-2 p-6">
                  <FileCode size={48} className="text-pink-500 mx-auto" />
                  <p className="text-xs font-mono font-bold text-slate-800">{previewFile.name}</p>
                </div>
              )}
            </div>

            {/* Metadata and URLs */}
            <div className="bg-white/90 border border-pink-200 rounded-2xl p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Тип файла:</span>
                <span className="font-black text-pink-600 uppercase">{previewFile.fileType} ({previewFile.mimeType})</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Размер:</span>
                <span className="font-black text-slate-800">{previewFile.sizeFormatted || '0 B'}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-pink-200/80">
                <span className="text-slate-500 font-bold">Прямой адрес Proxy:</span>
                <button
                  onClick={() => handleCopyLink(window.location.origin + ((previewFile as any).proxyUrl || `/file/${previewFile.id}/${(previewFile as any).slugName || previewFile.name}`), 'modal_proxy')}
                  className="text-sky-600 hover:text-pink-600 font-black flex items-center space-x-1"
                >
                  <span>{(previewFile as any).proxyUrl || `/file/${previewFile.id}/${(previewFile as any).slugName || previewFile.name}`}</span>
                  <Copy size={12} />
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-pink-200/80">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 bg-white/80 border border-pink-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Закрыть
              </button>
              <a
                href={previewFile.fullUrl || (previewFile as any).originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-md"
              >
                <Download size={14} />
                <span>Скачать оригинал</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-left">
            <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
              <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600 flex items-center space-x-2">
                <FolderPlus size={18} className="text-pink-500" />
                <span>Создать новую папку</span>
              </h3>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white/80 rounded-xl border border-pink-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Название папки
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Например: Логотипы, Баннеры, Шаблоны..."
                  className="w-full bg-white/90 border border-pink-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Цвет папки
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-pink-200 cursor-pointer p-1 bg-white"
                  />
                  <span className="text-xs font-mono font-bold text-slate-700">{newFolderColor}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-pink-200/80">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="px-4 py-2 bg-white/80 border border-pink-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder}
                  className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black rounded-xl text-xs shadow-md"
                >
                  {isCreatingFolder ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single File Deletion Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 animate-fadeIn">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-left">
            <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Trash2 size={16} className="text-pink-600" />
                <span>Подтверждение удаления</span>
              </h3>
              <button
                onClick={() => setFileToDelete(null)}
                className="p-1 text-slate-500 hover:text-slate-800 bg-white/80 rounded-lg border border-pink-200"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed">
              Вы уверены, что хотите безвозвратно удалить файл <span className="font-bold text-pink-700">«{fileToDelete.originalName || fileToDelete.name}»</span> из хранилища?
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200/80">
              <button
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 bg-white/90 border border-pink-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Отмена
              </button>
              <button
                onClick={confirmDeleteSingleFile}
                className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black rounded-xl text-xs shadow-md hover:opacity-95 transition-all"
              >
                Удалить файл
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Deletion Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 animate-fadeIn">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-left">
            <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Trash2 size={16} className="text-pink-600" />
                <span>Массовое удаление</span>
              </h3>
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="p-1 text-slate-500 hover:text-slate-800 bg-white/80 rounded-lg border border-pink-200"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed">
              Вы уверены, что хотите безвозвратно удалить выбранные файлы (<span className="font-bold text-pink-700">{selectedFileIds.size} шт.</span>)?
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200/80">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 bg-white/90 border border-pink-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Отмена
              </button>
              <button
                onClick={confirmBatchDelete}
                className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black rounded-xl text-xs shadow-md hover:opacity-95 transition-all"
              >
                Удалить все ({selectedFileIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Move Modal */}
      {isBatchMoveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-left">
            <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
              <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600 flex items-center space-x-2">
                <FolderOutput size={18} className="text-pink-500" />
                <span>Переместить выбранные файлы ({selectedFileIds.size} шт)</span>
              </h3>
              <button
                onClick={() => setIsBatchMoveOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white/80 rounded-xl border border-pink-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBatchMove} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Выберите папки назначения:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {folders.map(f => {
                    const isChecked = batchMoveFolderIds.includes(f.id);
                    return (
                      <label key={f.id} className="flex items-center space-x-2.5 p-2 bg-white/80 rounded-xl border border-pink-200/80 cursor-pointer hover:bg-white">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBatchMoveFolderIds(prev => [...prev, f.id]);
                            } else {
                              setBatchMoveFolderIds(prev => prev.filter(id => id !== f.id));
                            }
                          }}
                          className="rounded text-pink-500 focus:ring-pink-400"
                        />
                        <span className="text-xs font-bold text-slate-800">{f.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-pink-200/80">
                <button
                  type="button"
                  onClick={() => setIsBatchMoveOpen(false)}
                  className="px-4 py-2 bg-white/80 border border-pink-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black rounded-xl text-xs shadow-md"
                >
                  Применить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Post Modal */}
      {quickPostFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative text-left">
            <div className="flex justify-between items-center border-b border-pink-200/80 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white rounded-xl shadow-xs">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-pink-600 to-orange-600">
                    Быстрое создание поста
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">Вставка выбранного файла из Storage</p>
                </div>
              </div>
              <button
                onClick={() => setQuickPostFile(null)}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white/80 rounded-xl border border-pink-200"
              >
                <X size={16} />
              </button>
            </div>

            {quickPostSuccess && (
              <div className="bg-white/90 border border-pink-300 p-3 rounded-xl text-slate-800 text-xs flex items-center space-x-2 font-bold shadow-2xs">
                <CheckCircle2 size={16} className="shrink-0 text-sky-500" />
                <span>{quickPostSuccess}</span>
              </div>
            )}

            {quickPostError && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs flex items-center space-x-2 font-bold shadow-2xs">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{quickPostError}</span>
              </div>
            )}

            <form onSubmit={handleSendQuickPost} className="space-y-4">
              <div className="bg-white/80 border border-pink-200/80 p-3 rounded-xl flex items-center space-x-3">
                <span className="p-2 bg-pink-100 text-pink-600 rounded-lg border border-pink-200 font-mono text-xs font-bold uppercase">
                  {quickPostFile.fileType}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{quickPostFile.originalName || quickPostFile.name}</p>
                  <p className="text-[10px] font-mono text-sky-600 font-bold truncate">{(quickPostFile as any).proxyUrl || `/file/${quickPostFile.id}/${(quickPostFile as any).slugName}`}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Канал публикации
                </label>
                <select
                  value={quickPostChannel}
                  onChange={(e) => setQuickPostChannel(e.target.value)}
                  className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-medium"
                >
                  {channels.map(c => (
                    <option key={c.id} value={c.username}>{c.name} ({c.username})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Заголовок поста
                </label>
                <input
                  type="text"
                  required
                  value={quickPostTitle}
                  onChange={(e) => setQuickPostTitle(e.target.value)}
                  placeholder="Заголовок сообщения в Telegram..."
                  className="w-full bg-white/90 border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Текст публикации
                </label>
                <textarea
                  rows={4}
                  value={quickPostText}
                  onChange={(e) => setQuickPostText(e.target.value)}
                  placeholder="Введите основной текст вашего поста..."
                  className="w-full bg-white/90 border border-pink-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-pink-200/80">
                <button
                  type="button"
                  onClick={() => setQuickPostFile(null)}
                  className="px-4 py-2 bg-white/80 border border-pink-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  disabled={isSendingQuickPost}
                  className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black rounded-xl text-xs transition-all flex items-center space-x-2 cursor-pointer shadow-md hover:opacity-95"
                >
                  {isSendingQuickPost ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>Опубликовать в Telegram</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single File Deletion Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 animate-fadeIn">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-left">
            <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Trash2 size={16} className="text-pink-600" />
                <span>Подтверждение удаления</span>
              </h3>
              <button
                onClick={() => setFileToDelete(null)}
                className="p-1 text-slate-500 hover:text-slate-800 bg-white/80 rounded-lg border border-pink-200"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed">
              Вы уверены, что хотите безвозвратно удалить файл <span className="font-bold text-pink-700">«{fileToDelete.originalName || fileToDelete.name}»</span> из хранилища?
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200/80">
              <button
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 bg-white/90 border border-pink-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Отмена
              </button>
              <button
                onClick={confirmDeleteSingleFile}
                className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black rounded-xl text-xs shadow-md hover:opacity-95 transition-all"
              >
                Удалить файл
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Deletion Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 animate-fadeIn">
          <div className="bg-gradient-to-r from-sky-100 via-pink-100 via-orange-100 via-pink-100 to-sky-100 border border-pink-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-left">
            <div className="flex justify-between items-center border-b border-pink-200/80 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Trash2 size={16} className="text-pink-600" />
                <span>Массовое удаление</span>
              </h3>
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="p-1 text-slate-500 hover:text-slate-800 bg-white/80 rounded-lg border border-pink-200"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed">
              Вы уверены, что хотите безвозвратно удалить выбранные файлы (<span className="font-bold text-pink-700">{selectedFileIds.size} шт.</span>)?
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-pink-200/80">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 bg-white/90 border border-pink-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Отмена
              </button>
              <button
                onClick={confirmBatchDelete}
                className="px-5 py-2 bg-gradient-to-r from-sky-400 via-pink-500 to-orange-400 text-white font-black rounded-xl text-xs shadow-md hover:opacity-95 transition-all"
              >
                Удалить все ({selectedFileIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
