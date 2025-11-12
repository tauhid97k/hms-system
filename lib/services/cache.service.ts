import Redis from "ioredis";
import { LRUCache } from "lru-cache";

/**
 * Redis Cache Service
 *
 * Provides a unified caching interface with Redis as primary cache
 * and LRU as fallback when Redis is unavailable.
 *
 * Features:
 * - Automatic fallback to in-memory cache
 * - Type-safe operations
 * - TTL support
 * - Batch operations
 * - Pattern-based invalidation
 */

// Redis client configuration
const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  retryStrategy: (times) => {
    // Retry connection with exponential backoff
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

// LRU cache as fallback
const lruCache = new LRUCache<string, string>({
  max: 500, // Maximum 500 items
  maxSize: 50 * 1024 * 1024, // 50MB max size
  sizeCalculation: (value) => value.length,
  ttl: 1000 * 60 * 5, // 5 minutes default TTL
});

// Track Redis connection status
let isRedisConnected = false;

redisClient.on("connect", () => {
  isRedisConnected = true;
  console.log("✅ Redis connected successfully");
});

redisClient.on("error", (err) => {
  isRedisConnected = false;
  console.warn("⚠️ Redis error, falling back to LRU cache:", err.message);
});

redisClient.on("close", () => {
  isRedisConnected = false;
  console.warn("⚠️ Redis connection closed, using LRU cache");
});

// Lazy connect to Redis
redisClient.connect().catch((err) => {
  console.warn("⚠️ Redis connection failed, using LRU cache:", err.message);
});

/**
 * Cache service interface
 */
export class CacheService {
  private static instance: CacheService;

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (isRedisConnected) {
        const value = await redisClient.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      }

      // Fallback to LRU
      const value = lruCache.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.error(`Cache get error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds TTL in seconds (default: 300 = 5 minutes)
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (isRedisConnected) {
        await redisClient.setex(key, ttlSeconds, serialized);
      } else {
        // Fallback to LRU
        lruCache.set(key, serialized, { ttl: ttlSeconds * 1000 });
      }
    } catch (error) {
      console.error(`Cache set error for key "${key}":`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (isRedisConnected) {
        await redisClient.del(key);
      } else {
        lruCache.delete(key);
      }
    } catch (error) {
      console.error(`Cache delete error for key "${key}":`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param pattern Pattern to match (e.g., "doctor:*", "queue:*")
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (isRedisConnected) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        // LRU doesn't support pattern matching, so clear all if pattern is wildcard
        if (pattern.endsWith("*")) {
          const prefix = pattern.slice(0, -1);
          const keys = Array.from(lruCache.keys()).filter((key) =>
            key.startsWith(prefix)
          );
          keys.forEach((key) => lruCache.delete(key));
        }
      }
    } catch (error) {
      console.error(`Cache invalidate pattern error for "${pattern}":`, error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute fetcher and cache result
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetcher();

    // Store in cache (fire and forget)
    this.set(key, data, ttlSeconds).catch((err) =>
      console.error("Cache set error:", err)
    );

    return data;
  }

  /**
   * Check if Redis is available
   */
  isRedisAvailable(): boolean {
    return isRedisConnected;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (isRedisConnected) {
        await redisClient.flushdb();
      }
      lruCache.clear();
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      redis: {
        connected: isRedisConnected,
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || "6379",
      },
      lru: {
        size: lruCache.size,
        max: lruCache.max,
        itemCount: lruCache.size,
      },
    };
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

/**
 * Cache key builders for consistency
 */
export const CacheKeys = {
  // Doctors
  doctor: (id: string) => `doctor:${id}`,
  doctorFees: (id: string) => `doctor:${id}:fees`,
  doctorsList: (page: number, limit: number) =>
    `doctors:list:${page}:${limit}`,

  // Departments
  department: (id: string) => `department:${id}`,
  departmentsList: () => `departments:list`,

  // Specializations
  specialization: (id: string) => `specialization:${id}`,
  specializationsList: () => `specializations:list`,

  // Patients
  patient: (id: string) => `patient:${id}`,
  patientSummary: (id: string) => `patient:${id}:summary`,

  // Queue
  queue: (doctorId: string, date: string) => `queue:${doctorId}:${date}`,
  queueStats: (doctorId: string) => `queue:${doctorId}:stats`,

  // Appointments
  appointment: (id: string) => `appointment:${id}`,
  appointmentsList: (page: number, limit: number, filters: string) =>
    `appointments:list:${page}:${limit}:${filters}`,

  // Bills
  bill: (id: string) => `bill:${id}`,

  // Reference data (long TTL)
  testTypes: () => `test-types:all`,
  medicineInstructions: () => `medicine-instructions:all`,
  bloodGroups: () => `blood-groups:all`,
  genders: () => `genders:all`,
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 30, // 30 seconds - for frequently changing data
  MEDIUM: 300, // 5 minutes - for moderate change rate
  LONG: 3600, // 1 hour - for reference data
  VERY_LONG: 86400, // 24 hours - for rarely changing data
};
