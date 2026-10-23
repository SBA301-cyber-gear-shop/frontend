export type CacheStorageType = "memory" | "session" | "local";

export interface CacheOptions {
  /** Time to live in milliseconds. Default: 60,000ms (1 minute) */
  ttl?: number;
  /** If true, bypass cache and fetch directly from network */
  forceRefresh?: boolean;
  /** Alias for forceRefresh */
  bypassCache?: boolean;
  /** Storage target: 'memory' (RAM only), 'session' (persists through F5), 'local' (persists across browser sessions). Default: 'session' */
  storage?: CacheStorageType;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const STORAGE_PREFIX = "tz_cache_";

class ApiCache {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private inflightRequests = new Map<string, Promise<unknown>>();

  private getStorage(type: CacheStorageType): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      if (type === "session") return window.sessionStorage;
      if (type === "local") return window.localStorage;
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Get cached data if valid and not expired. Checks memory first, then sessionStorage/localStorage.
   */
  get<T>(key: string): T | null {
    const now = Date.now();

    // 1. Level 1: In-memory Map (0ms)
    const memEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (memEntry) {
      if (now > memEntry.expiresAt) {
        this.memoryCache.delete(key);
        this.removeFromStorage(key);
        return null;
      }
      return memEntry.data;
    }

    // 2. Level 2: Persistent Storage (survives page refreshes)
    for (const storageType of ["session", "local"] as CacheStorageType[]) {
      const storage = this.getStorage(storageType);
      if (!storage) continue;

      try {
        const raw = storage.getItem(STORAGE_PREFIX + key);
        if (!raw) continue;

        const entry = JSON.parse(raw) as CacheEntry<T>;
        if (!entry || typeof entry.expiresAt !== "number") {
          storage.removeItem(STORAGE_PREFIX + key);
          continue;
        }

        if (now > entry.expiresAt) {
          storage.removeItem(STORAGE_PREFIX + key);
          continue;
        }

        // Populate in-memory map for instantaneous subsequent reads
        this.memoryCache.set(key, entry);
        return entry.data;
      } catch {
        // Corrupted JSON or storage failure
        try {
          storage.removeItem(STORAGE_PREFIX + key);
        } catch {
          // ignore
        }
      }
    }

    return null;
  }

  /**
   * Store data in cache with a TTL and storage destination.
   */
  set<T>(
    key: string,
    data: T,
    ttlMs: number = 60_000,
    storageType: CacheStorageType = "session"
  ): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    };

    // Store in Level 1 memory
    this.memoryCache.set(key, entry);

    // Store in Level 2 persistent storage if requested
    if (storageType === "session" || storageType === "local") {
      const storage = this.getStorage(storageType);
      if (storage) {
        try {
          storage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
        } catch (err) {
          // In case storage quota is exceeded, clear old cache entries and try once
          console.warn(`[ApiCache] Failed to persist key "${key}" to ${storageType}Storage`, err);
          this.purgeExpiredFromStorage(storage);
        }
      }
    }
  }

  /**
   * Invalidate a single key or all keys matching a prefix/substring across memory and storage
   */
  invalidate(keyOrPrefix: string): void {
    // 1. Invalidate from in-memory map
    if (this.memoryCache.has(keyOrPrefix)) {
      this.memoryCache.delete(keyOrPrefix);
    }
    for (const key of Array.from(this.memoryCache.keys())) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix) || key.includes(keyOrPrefix)) {
        this.memoryCache.delete(key);
      }
    }

    // 2. Invalidate from sessionStorage and localStorage
    for (const storageType of ["session", "local"] as CacheStorageType[]) {
      const storage = this.getStorage(storageType);
      if (!storage) continue;

      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const itemKey = storage.key(i);
          if (
            itemKey &&
            itemKey.startsWith(STORAGE_PREFIX) &&
            (itemKey.replace(STORAGE_PREFIX, "").startsWith(keyOrPrefix) ||
              itemKey.includes(keyOrPrefix))
          ) {
            keysToRemove.push(itemKey);
          }
        }
        for (const k of keysToRemove) {
          storage.removeItem(k);
        }
      } catch {
        // ignore
      }
    }
  }

  private removeFromStorage(key: string): void {
    for (const storageType of ["session", "local"] as CacheStorageType[]) {
      const storage = this.getStorage(storageType);
      if (storage) {
        try {
          storage.removeItem(STORAGE_PREFIX + key);
        } catch {
          // ignore
        }
      }
    }
  }

  private purgeExpiredFromStorage(storage: Storage): void {
    const now = Date.now();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          try {
            const entry = JSON.parse(storage.getItem(key) || "{}");
            if (entry.expiresAt && now > entry.expiresAt) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
      for (const k of keysToRemove) {
        storage.removeItem(k);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Clear all cached entries from memory and storage
   */
  clear(): void {
    this.memoryCache.clear();
    this.inflightRequests.clear();

    for (const storageType of ["session", "local"] as CacheStorageType[]) {
      const storage = this.getStorage(storageType);
      if (!storage) continue;
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        for (const k of keysToRemove) {
          storage.removeItem(k);
        }
      } catch {
        // ignore
      }
    }
  }

  /**
   * Fetch with cache wrapper with request deduplication (in-flight coalescing)
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const {
      ttl = 60_000,
      forceRefresh = false,
      bypassCache = false,
      storage = "session",
    } = options || {};

    const isTest =
      (typeof import.meta !== "undefined" && import.meta.env?.MODE === "test") ||
      (typeof globalThis !== "undefined" &&
        Boolean(
          (globalThis as { process?: { env?: { NODE_ENV?: string } } })
            .process?.env?.NODE_ENV === "test",
        ));

    const shouldBypass = forceRefresh || bypassCache || isTest;

    if (!shouldBypass) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Request deduplication: if the exact same request is already in-flight, return the existing Promise
    if (this.inflightRequests.has(key)) {
      return this.inflightRequests.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const data = await fetcher();
        this.set(key, data, ttl, storage);
        return data;
      } finally {
        this.inflightRequests.delete(key);
      }
    })();

    this.inflightRequests.set(key, promise);
    return promise;
  }
}

export const apiCache = new ApiCache();
