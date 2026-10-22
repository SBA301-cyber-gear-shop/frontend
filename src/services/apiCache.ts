export interface CacheOptions {
  /** Time to live in milliseconds. Default: 60,000ms (1 minute) */
  ttl?: number;
  /** If true, bypass cache and fetch directly from network */
  forceRefresh?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ApiCache {
  private memoryCache = new Map<string, CacheEntry<unknown>>();

  /**
   * Get cached data if valid and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store data in cache with a TTL
   */
  set<T>(key: string, data: T, ttlMs: number = 60_000): void {
    const now = Date.now();
    this.memoryCache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Invalidate a single key or all keys matching a prefix/substring
   */
  invalidate(keyOrPrefix: string): void {
    if (this.memoryCache.has(keyOrPrefix)) {
      this.memoryCache.delete(keyOrPrefix);
    }
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(keyOrPrefix) || key.includes(keyOrPrefix)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.memoryCache.clear();
  }

  /**
   * Fetch with cache wrapper
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const { ttl = 60_000, forceRefresh = false } = options || {};

    if (!forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

export const apiCache = new ApiCache();
