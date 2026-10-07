/**
 * Client-Side Read Cache for Authentic Chief Telemetry
 * 
 * BATCH 13B.2 & 13B.3 ENFORCEMENT:
 * - Only genuine, successful responses from the live Chief backend may populate this cache.
 * - Development mocks and synthetic fixtures MUST NEVER be placed into this cache.
 * - Cache MUST be session/user safe: namespaced by authenticated user ID and guaranteed cleared on logout/session change.
 * - Never store bearer tokens, passwords, API keys, or auth secrets inside telemetry caches.
 * - In production mode:
 *   - 401/403 auth failures MUST NEVER fall back to cached data (fail closed).
 *   - Only legitimate network/availability failures may use owned cached data.
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  correlationId: string;
}

let activeUserNamespace: string | null = null;
const memoryCache = new Map<string, CacheEntry<unknown>>();

export function setCacheUserNamespace(userId: string | null): void {
  if (activeUserNamespace !== userId) {
    clearLiveCache();
    activeUserNamespace = userId;
  }
}

function getScopedKey(resourceKey: string): string {
  const ns = activeUserNamespace || 'unauthenticated';
  return `${ns}::${resourceKey}`;
}

export function setLiveCache<T>(resourceKey: string, data: T, correlationId: string): void {
  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
    correlationId
  };
  const scopedKey = getScopedKey(resourceKey);
  memoryCache.set(scopedKey, entry as CacheEntry<unknown>);

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(`chief_cache_${scopedKey}`, JSON.stringify(entry));
    } catch {
      // Ignore quota errors in restricted frames
    }
  }
}

export function getLiveCache<T>(resourceKey: string): CacheEntry<T> | null {
  const scopedKey = getScopedKey(resourceKey);
  const mem = memoryCache.get(scopedKey);
  if (mem) {
    return mem as CacheEntry<T>;
  }

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(`chief_cache_${scopedKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEntry<T>;
        memoryCache.set(scopedKey, parsed as CacheEntry<unknown>);
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
