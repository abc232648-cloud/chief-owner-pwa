/**
 * Client-Side Read Cache for Authentic Chief Telemetry
 * 
 * BATCH 13B.2 ENFORCEMENT:
 * - Only genuine, successful responses from the live Chief backend may populate this cache.
 * - Development mocks and synthetic fixtures MUST NEVER be placed into this cache.
 * - In production mode, if a network outage or 404 occurs:
 *   - Legitimate cached entries may be returned with provenance: 'cached'
 *   - If no legitimate cache entry exists, the resource is marked 'unavailable'
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  correlationId: string;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function setLiveCache<T>(resourceKey: string, data: T, correlationId: string): void {
  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
    correlationId
  };
  memoryCache.set(resourceKey, entry as CacheEntry<unknown>);

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(`chief_cache_${resourceKey}`, JSON.stringify(entry));
    } catch {
      // Ignore quota errors in restricted frames
    }
  }
}

export function getLiveCache<T>(resourceKey: string): CacheEntry<T> | null {
  const mem = memoryCache.get(resourceKey);
  if (mem) {
    return mem as CacheEntry<T>;
  }

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(`chief_cache_${resourceKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEntry<T>;
        memoryCache.set(resourceKey, parsed as CacheEntry<unknown>);
        return parsed;
      }
    } catch {
      // Ignore parse/storage errors
    }
  }

  return null;
}

export function clearLiveCache(): void {
  memoryCache.clear();
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const keys = Object.keys(window.sessionStorage);
      for (const k of keys) {
        if (k.startsWith('chief_cache_')) {
          window.sessionStorage.removeItem(k);
        }
      }
    } catch {
      // Ignore
    }
  }
}
