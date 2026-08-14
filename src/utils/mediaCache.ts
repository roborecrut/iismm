/**
 * High-performance Browser Media Cache utility using Cache API + In-Memory Object URLs
 * Ensures gallery media is instantly retrieved from local browser cache without network re-fetches.
 */

const CACHE_NAME = 'iismm-media-cache-v2';
const memoryBlobMap = new Map<string, string>();
const activeRequests = new Map<string, Promise<string>>();

export async function getCachedMediaUrl(url: string): Promise<string> {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  // 1. Check in-memory instant map
  if (memoryBlobMap.has(url)) {
    return memoryBlobMap.get(url)!;
  }

  // 2. Prevent duplicate in-flight requests
  if (activeRequests.has(url)) {
    return activeRequests.get(url)!;
  }

  const promise = (async () => {
    try {
      if ('caches' in window) {
        const cache = await window.caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(url);
        
        if (cachedResponse && cachedResponse.ok) {
          const blob = await cachedResponse.blob();
          const objectUrl = URL.createObjectURL(blob);
          memoryBlobMap.set(url, objectUrl);
          return objectUrl;
        }

        // Fetch through media proxy or direct
        const fetchUrl = url.startsWith('http') ? `/api/media-proxy?url=${encodeURIComponent(url)}` : url;
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const resClone = res.clone();
          try {
            await cache.put(url, resClone);
          } catch (e) {
            // Ignore cache storage quota warnings
          }
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          memoryBlobMap.set(url, objectUrl);
          return objectUrl;
        }
      }
    } catch (err) {
      console.warn('[mediaCache] Cache fetch error, falling back to direct URL:', err);
    }
    return url;
  })();

  activeRequests.set(url, promise);
  const result = await promise;
  activeRequests.delete(url);
  return result;
}

/**
 * Preload and cache a list of media files in the background
 */
export function preloadMediaFiles(urls: (string | undefined | null)[]) {
  const validUrls = urls.filter((u): u is string => Boolean(u && typeof u === 'string' && u.startsWith('http')));
  validUrls.forEach(url => {
    getCachedMediaUrl(url).catch(() => {});
  });
}

/**
 * Clear all cached gallery media from browser cache
 */
export async function clearMediaCache(): Promise<boolean> {
  try {
    memoryBlobMap.forEach(objUrl => URL.revokeObjectURL(objUrl));
    memoryBlobMap.clear();
    if ('caches' in window) {
      return await window.caches.delete(CACHE_NAME);
    }
    return true;
  } catch (e) {
    return false;
  }
}
