interface CacheConfig {
  maxAge: number;      // Maximum age of cache entries in milliseconds
  maxSize: number;     // Maximum number of entries to store
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private storage: Map<string, CacheEntry<any>>;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.storage = new Map();
    this.config = {
      maxAge: 5 * 60 * 1000, // 5 minutes by default
      maxSize: 100,          // Store up to 100 items by default
      ...config
    };

    // Set up periodic cleanup
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), this.config.maxAge);
    }
  }

  set<T>(key: string, data: T): void {
    // Remove oldest entry if we're at capacity
    if (this.storage.size >= this.config.maxSize) {
      const oldestKey = this.storage.keys().next().value;
      if (oldestKey) {
        this.storage.delete(oldestKey);
      }
    }

    this.storage.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.storage.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.config.maxAge) {
      this.storage.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.storage.has(key) && 
           (Date.now() - this.storage.get(key)!.timestamp <= this.config.maxAge);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now - entry.timestamp > this.config.maxAge) {
        this.storage.delete(key);
      }
    }
  }
}

// Create a singleton instance for API responses
export const apiCache = new Cache({
  maxAge: 5 * 60 * 1000,  // Cache API responses for 5 minutes
  maxSize: 50             // Store up to 50 API responses
});