import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Play, X, ChevronLeft, ChevronRight, Maximize2, Video as VideoIcon, Image as ImageIcon } from 'lucide-react';

export interface TelegramAlbumCollageProps {
  urls: string[];
  className?: string;
  onItemClick?: (index: number, url: string) => void;
}

interface MediaDimension {
  width: number;
  height: number;
  ratio: number; // width / height
  isVideo: boolean;
}

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    clean.endsWith('.ogg') ||
    url.includes('video/mp4') ||
    url.includes('/video/')
  );
}

export const TelegramAlbumCollage: React.FC<TelegramAlbumCollageProps> = ({
  urls,
  className = '',
  onItemClick
}) => {
  // Filter out empty URLs
  const validUrls = useMemo(() => {
    return urls.filter(u => u && typeof u === 'string' && u.trim().length > 0).slice(0, 10);
  }, [urls]);

  const [dimensions, setDimensions] = useState<{ [url: string]: MediaDimension }>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Measure dimensions of images and videos
  useEffect(() => {
    validUrls.forEach((url) => {
      if (dimensions[url]) return;

      const isVid = isVideoUrl(url);
      if (isVid) {
        // Video metadata probe
        const video = document.createElement('video');
        video.src = url;
        video.onloadedmetadata = () => {
          const w = video.videoWidth || 16;
          const h = video.videoHeight || 9;
          setDimensions(prev => ({
            ...prev,
            [url]: { width: w, height: h, ratio: w / h, isVideo: true }
          }));
        };
        video.onerror = () => {
          setDimensions(prev => ({
            ...prev,
            [url]: { width: 16, height: 9, ratio: 16 / 9, isVideo: true }
          }));
        };
      } else {
        // Image probe
        const img = new Image();
        img.src = url;
        img.onload = () => {
          const w = img.naturalWidth || 1;
          const h = img.naturalHeight || 1;
          setDimensions(prev => ({
            ...prev,
            [url]: { width: w, height: h, ratio: w / h, isVideo: false }
          }));
        };
        img.onerror = () => {
          setDimensions(prev => ({
            ...prev,
            [url]: { width: 1, height: 1, ratio: 1, isVideo: false }
          }));
        };
      }
    });
  }, [validUrls]);

  const count = validUrls.length;

  if (count === 0) {
    return (
      <div className={`w-full py-8 px-4 rounded-xl border border-dashed border-pink-300 bg-gradient-to-r from-sky-50 via-pink-50 via-orange-50 to-sky-50 flex flex-col items-center justify-center space-y-2 text-center text-slate-600 ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-white/80 border border-pink-200 flex items-center justify-center text-pink-600 shadow-xs">
          <Layers size={20} />
        </div>
        <div className="text-sm font-bold text-slate-800">Альбом не содержит файлов</div>
        <div className="text-xs text-slate-500 max-w-xs">
          Загрузите от 1 до 10 фото или видео в блоке вложений
        </div>
      </div>
    );
  }

  const handleMediaClick = (idx: number, url: string) => {
    if (onItemClick) {
      onItemClick(idx, url);
    } else {
      setLightboxIndex(idx);
    }
  };

  // Render individual media tile
  const renderTile = (url: string, index: number, extraClasses = '') => {
    const isVid = isVideoUrl(url) || dimensions[url]?.isVideo;

    return (
      <div
        key={`${url}-${index}`}
        onClick={() => handleMediaClick(index, url)}
        className={`relative overflow-hidden group cursor-pointer bg-slate-100 transition-all ${extraClasses}`}
      >
        {isVid ? (
          <div className="w-full h-full relative flex items-center justify-center bg-black/90">
            <video
              src={url}
              playsInline
              muted
              preload="metadata"
              className="w-full h-full object-cover"
            />
            {/* Video overlay badge */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 text-pink-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Play size={18} className="fill-pink-600 ml-0.5" />
              </div>
            </div>
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
              <VideoIcon size={12} />
              <span>Видео</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <img
              src={url}
              alt={`album-item-${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
          </div>
        )}

        {/* Zoom icon on hover */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs text-white p-1 rounded-md">
          <Maximize2 size={12} />
        </div>
      </div>
    );
  };

  // Generate Telegram collage rows or custom layout depending on count and aspect ratios
  const renderCollageLayout = () => {
    // 1 item: full width, clean Telegram ratio
    if (count === 1) {
      const dim = dimensions[validUrls[0]];
      const isPortrait = dim ? dim.ratio < 0.85 : false;
      return (
        <div className={`w-full overflow-hidden rounded-xl border border-pink-200 shadow-2xs ${isPortrait ? 'max-h-[380px] h-[360px]' : 'max-h-[320px] h-[260px]'}`}>
          {renderTile(validUrls[0], 0, 'w-full h-full')}
        </div>
      );
    }

    // 2 items: 2 columns or 2 rows
    if (count === 2) {
      const dim0 = dimensions[validUrls[0]];
      const dim1 = dimensions[validUrls[1]];
      const bothHorizontal = dim0 && dim1 && dim0.ratio > 1.3 && dim1.ratio > 1.3;

      if (bothHorizontal) {
        return (
          <div className="w-full grid grid-rows-2 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[300px]">
            {renderTile(validUrls[0], 0, 'w-full h-full')}
            {renderTile(validUrls[1], 1, 'w-full h-full')}
          </div>
        );
      }

      return (
        <div className="w-full grid grid-cols-2 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[260px]">
          {renderTile(validUrls[0], 0, 'w-full h-full')}
          {renderTile(validUrls[1], 1, 'w-full h-full')}
        </div>
      );
    }

    // 3 items: Left portrait + 2 stacked right OR Top landscape + 2 bottom
    if (count === 3) {
      const dim0 = dimensions[validUrls[0]];
      const isFirstPortrait = dim0 ? dim0.ratio < 0.9 : true;

      if (isFirstPortrait) {
        return (
          <div className="w-full grid grid-cols-5 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[320px]">
            <div className="col-span-3 h-full">
              {renderTile(validUrls[0], 0, 'w-full h-full')}
            </div>
            <div className="col-span-2 grid grid-rows-2 gap-1 h-full">
              {renderTile(validUrls[1], 1, 'w-full h-full')}
              {renderTile(validUrls[2], 2, 'w-full h-full')}
            </div>
          </div>
        );
      } else {
        return (
          <div className="w-full grid grid-rows-2 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[330px]">
            <div className="w-full h-full">
              {renderTile(validUrls[0], 0, 'w-full h-full')}
            </div>
            <div className="w-full grid grid-cols-2 gap-1 h-full">
              {renderTile(validUrls[1], 1, 'w-full h-full')}
              {renderTile(validUrls[2], 2, 'w-full h-full')}
            </div>
          </div>
        );
      }
    }

    // 4 items: 2x2 grid or 1 top + 3 bottom
    if (count === 4) {
      const dim0 = dimensions[validUrls[0]];
      const isFirstWide = dim0 ? dim0.ratio > 1.3 : false;

      if (isFirstWide) {
        return (
          <div className="w-full grid grid-rows-2 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[340px]">
            <div className="w-full h-full">
              {renderTile(validUrls[0], 0, 'w-full h-full')}
            </div>
            <div className="w-full grid grid-cols-3 gap-1 h-full">
              {renderTile(validUrls[1], 1, 'w-full h-full')}
              {renderTile(validUrls[2], 2, 'w-full h-full')}
              {renderTile(validUrls[3], 3, 'w-full h-full')}
            </div>
          </div>
        );
      }

      return (
        <div className="w-full grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[320px]">
          {validUrls.map((url, i) => renderTile(url, i, 'w-full h-full'))}
        </div>
      );
    }

    // 5 items: Row 1 (2 items), Row 2 (3 items)
    if (count === 5) {
      return (
        <div className="w-full grid grid-rows-2 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[380px]">
          <div className="w-full grid grid-cols-2 gap-1 h-full">
            {renderTile(validUrls[0], 0, 'w-full h-full')}
            {renderTile(validUrls[1], 1, 'w-full h-full')}
          </div>
          <div className="w-full grid grid-cols-3 gap-1 h-full">
            {renderTile(validUrls[2], 2, 'w-full h-full')}
            {renderTile(validUrls[3], 3, 'w-full h-full')}
            {renderTile(validUrls[4], 4, 'w-full h-full')}
          </div>
        </div>
      );
    }

    // 6 items: Row 1 (3 items), Row 2 (3 items)
    if (count === 6) {
      return (
        <div className="w-full grid grid-cols-3 grid-rows-2 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[380px]">
          {validUrls.map((url, i) => renderTile(url, i, 'w-full h-full'))}
        </div>
      );
    }

    // 7 items: Row 1 (3 items), Row 2 (2 items), Row 3 (2 items)
    if (count === 7) {
      return (
        <div className="w-full grid grid-rows-3 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[460px]">
          <div className="w-full grid grid-cols-3 gap-1 h-full">
            {renderTile(validUrls[0], 0, 'w-full h-full')}
            {renderTile(validUrls[1], 1, 'w-full h-full')}
            {renderTile(validUrls[2], 2, 'w-full h-full')}
          </div>
          <div className="w-full grid grid-cols-2 gap-1 h-full">
            {renderTile(validUrls[3], 3, 'w-full h-full')}
            {renderTile(validUrls[4], 4, 'w-full h-full')}
          </div>
          <div className="w-full grid grid-cols-2 gap-1 h-full">
            {renderTile(validUrls[5], 5, 'w-full h-full')}
            {renderTile(validUrls[6], 6, 'w-full h-full')}
          </div>
        </div>
      );
    }

    // 8 items: Row 1 (4 items), Row 2 (4 items)
    if (count === 8) {
      return (
        <div className="w-full grid grid-cols-4 grid-rows-2 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[420px]">
          {validUrls.map((url, i) => renderTile(url, i, 'w-full h-full'))}
        </div>
      );
    }

    // 9 items: 3x3 grid
    if (count === 9) {
      return (
        <div className="w-full grid grid-cols-3 grid-rows-3 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[480px]">
          {validUrls.map((url, i) => renderTile(url, i, 'w-full h-full'))}
        </div>
      );
    }

    // 10 items: Row 1 (3 items), Row 2 (3 items), Row 3 (4 items)
    if (count === 10) {
      return (
        <div className="w-full grid grid-rows-3 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs h-[540px]">
          <div className="w-full grid grid-cols-3 gap-1 h-full">
            {renderTile(validUrls[0], 0, 'w-full h-full')}
            {renderTile(validUrls[1], 1, 'w-full h-full')}
            {renderTile(validUrls[2], 2, 'w-full h-full')}
          </div>
          <div className="w-full grid grid-cols-3 gap-1 h-full">
            {renderTile(validUrls[3], 3, 'w-full h-full')}
            {renderTile(validUrls[4], 4, 'w-full h-full')}
            {renderTile(validUrls[5], 5, 'w-full h-full')}
          </div>
          <div className="w-full grid grid-cols-4 gap-1 h-full">
            {renderTile(validUrls[6], 6, 'w-full h-full')}
            {renderTile(validUrls[7], 7, 'w-full h-full')}
            {renderTile(validUrls[8], 8, 'w-full h-full')}
            {renderTile(validUrls[9], 9, 'w-full h-full')}
          </div>
        </div>
      );
    }

    // Fallback for any other count
    return (
      <div className="w-full grid grid-cols-3 gap-1 overflow-hidden rounded-xl border border-pink-200 shadow-2xs min-h-[300px]">
        {validUrls.map((url, i) => renderTile(url, i, 'aspect-square w-full h-full'))}
      </div>
    );
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Telegram-style album header badge */}
      <div className="flex items-center justify-between text-xs text-slate-700 font-semibold px-0.5">
        <div className="flex items-center space-x-1.5 text-pink-700 font-bold">
          <Layers size={14} className="text-pink-600" />
          <span>Альбом Telegram ({count} из 10)</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Клик для просмотра
        </span>
      </div>

      {/* Collage container */}
      {renderCollageLayout()}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && validUrls[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header controls */}
            <div className="w-full flex items-center justify-between text-white pb-3">
              <div className="flex items-center space-x-2 text-sm font-bold">
                {isVideoUrl(validUrls[lightboxIndex]) ? <VideoIcon size={16} /> : <ImageIcon size={16} />}
                <span>Файл {lightboxIndex + 1} из {count}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
                title="Закрыть"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main media display */}
            <div className="w-full max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black/50 border border-white/20 shadow-2xl">
              {isVideoUrl(validUrls[lightboxIndex]) ? (
                <video
                  src={validUrls[lightboxIndex]}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[75vh] max-w-full rounded-xl"
                />
              ) : (
                <img
                  src={validUrls[lightboxIndex]}
                  alt={`preview-${lightboxIndex}`}
                  className="max-h-[75vh] max-w-full object-contain rounded-xl"
                />
              )}
            </div>

            {/* Prev / Next controls */}
            {count > 1 && (
              <div className="flex items-center justify-center space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + count) % count)}
                  className="p-2.5 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg flex items-center space-x-1"
                >
                  <ChevronLeft size={18} />
                  <span className="text-xs font-bold">Назад</span>
                </button>

                <div className="flex space-x-1.5">
                  {validUrls.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        i === lightboxIndex ? 'w-6 bg-pink-500' : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % count)}
                  className="p-2.5 bg-gradient-to-r from-sky-400 via-pink-500 via-orange-400 via-pink-500 to-sky-400 text-white rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg flex items-center space-x-1"
                >
                  <span className="text-xs font-bold">Вперед</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
