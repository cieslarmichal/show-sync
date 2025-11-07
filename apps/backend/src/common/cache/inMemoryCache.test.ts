import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InMemoryCache } from './inMemoryCache.ts';

describe('InMemoryCache', () => {
  let cache: InMemoryCache<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new InMemoryCache<string>(5000, 100); // 5 second TTL, max 100 items
  });

  afterEach(() => {
    cache.stop();
    vi.useRealTimers();
  });

  describe('get and set', () => {
    it('should store and retrieve a value', () => {
      cache.set('key1', 'value1');
      const result = cache.get('key1');

      expect(result).toBe('value1');
    });

    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent');

      expect(result).toBeNull();
    });

    it('should return null for expired entry', () => {
      cache.set('key1', 'value1');

      // Fast forward time beyond TTL
      vi.advanceTimersByTime(6000);

      const result = cache.get('key1');

      expect(result).toBeNull();
    });

    it('should track cache hits', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');

      const stats = cache.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(0);
    });

    it('should track cache misses', () => {
      cache.get('non-existent');
      cache.get('another-miss');

      const stats = cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('non-existent'); // miss

      const stats = cache.getStats();

      expect(stats.hitRate).toBe('66.67%'); // 2 hits out of 3 total
    });
  });

  describe('size limits', () => {
    it('should respect max size limit', () => {
      const smallCache = new InMemoryCache<string>(5000, 3);

      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      smallCache.set('key4', 'value4'); // Should evict oldest

      const stats = smallCache.getStats();

      expect(stats.size).toBe(3);
      expect(smallCache.get('key1')).toBeNull(); // Oldest should be evicted
      expect(smallCache.get('key4')).toBe('value4'); // Newest should exist

      smallCache.stop();
    });
  });

  describe('delete and clear', () => {
    it('should delete a specific key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.delete('key1');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.getStats().size).toBe(0);
    });

    it('should reset stats when cleared', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('non-existent'); // miss

      cache.clear();

      const stats = cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries during cleanup', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Fast forward time beyond TTL
      vi.advanceTimersByTime(6000);

      cache.cleanup();

      const stats = cache.getStats();

      expect(stats.size).toBe(0);
    });

    it('should keep non-expired entries during cleanup', () => {
      cache.set('key1', 'value1');

      // Fast forward time but not beyond TTL
      vi.advanceTimersByTime(3000);

      cache.cleanup();

      expect(cache.get('key1')).toBe('value1');
    });

    it('should run cleanup automatically every minute', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Fast forward time beyond TTL
      vi.advanceTimersByTime(6000);

      // Fast forward to trigger automatic cleanup
      vi.advanceTimersByTime(60_000);

      const stats = cache.getStats();

      // Entries should be cleaned up automatically
      expect(stats.size).toBe(0);
    });
  });

  describe('stop', () => {
    it('should stop cleanup interval', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const newCache = new InMemoryCache<string>(5000, 100);

      expect(setIntervalSpy).toHaveBeenCalled();

      newCache.stop();

      expect(clearIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('complex types', () => {
    it('should handle object values', () => {
      interface User {
        id: number;
        name: string;
      }

      const userCache = new InMemoryCache<User>(5000, 100);

      const user: User = { id: 1, name: 'John' };

      userCache.set('user1', user);

      const result = userCache.get('user1');

      expect(result).toEqual(user);

      userCache.stop();
    });

    it('should handle array values', () => {
      const arrayCache = new InMemoryCache<number[]>(5000, 100);

      arrayCache.set('numbers', [1, 2, 3, 4, 5]);

      const result = arrayCache.get('numbers');

      expect(result).toEqual([1, 2, 3, 4, 5]);

      arrayCache.stop();
    });
  });
});
