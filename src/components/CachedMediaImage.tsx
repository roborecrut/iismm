import React, { useState, useEffect } from 'react';
import { getCachedMediaUrl } from '../utils/mediaCache';
import { ImageIcon } from 'lucide-react';

interface CachedMediaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: React.ReactNode;
}

export const CachedMediaImage: React.FC<CachedMediaImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackIcon,
  ...props
}) => {
  const [cachedSrc, setCachedSrc] = useState<string>(src || '');
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!src) {
      setCachedSrc('');
      return;
    }

    // Direct blob/data URLs
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setCachedSrc(src);
      setIsLoaded(true);
      return;
    }

    getCachedMediaUrl(src).then((resolvedUrl) => {
      if (isMounted) {
        setCachedSrc(resolvedUrl);
      }
    }).catch(() => {
      if (isMounted) {
        setCachedSrc(src);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (hasError || !src) {
    return (
      <div className={`flex items-center justify-center bg-slate-100/80 text-slate-400 ${className}`}>
        {fallbackIcon || <ImageIcon size={24} />}
      </div>
    );
  }

  return (
    <img
      src={cachedSrc || src}
      alt={alt}
      className={`${className} ${!isLoaded ? 'opacity-90' : 'opacity-100'} transition-opacity duration-200`}
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        if (cachedSrc !== src) {
          // Fallback to original URL if cached proxy fails
          setCachedSrc(src);
        } else {
          setHasError(true);
        }
      }}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
};
