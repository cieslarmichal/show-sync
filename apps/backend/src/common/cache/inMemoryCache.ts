import type { LoggerService } from '../logger/loggerService.ts';

interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number;
}

export interface CacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly size: number;
  readonly hitRate: string;
}

export class InMemoryCache<T> {
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;
  private readonly logger: LoggerService | undefined;
  private hits = 0;
  private misses = 0;
  private cleanupIntervalId: NodeJS.Timeout | undefined;

  public constructor(ttlMs: number, maxSize: number, logger?: LoggerService) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
    this.logger = logger;

    // Run cleanup every minute to remove expired entries
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, 60_000);
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  public set(key: string, value: T): void {
    // If cache is full, remove oldest entries (LRU-like behavior)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : '0.00';

    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
    };
  }

  public cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0 && this.logger) {
      this.logger.debug({
        message: 'Cache cleanup completed',
        event: 'cache.cleanup',
        removedCount,
        remainingSize: this.cache.size,
      });
    }
  }

  public stop(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
    this.cleanupIntervalId = undefined;
  }
}
