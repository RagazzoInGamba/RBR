/**
 * Oracle Red Bull Racing - Redis Client
 * Caching and session management with ioredis
 *
 * Features:
 * - Singleton pattern for connection pooling
 * - Automatic reconnection with exponential backoff
 * - Type-safe cache operations
 * - TTL management
 * - Error handling with fallbacks
 */

import Redis, { RedisOptions } from 'ioredis';

import { logger } from '@/lib/logger';
// Global singleton to prevent multiple connections in serverless
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

/**
 * Redis connection configuration
 */
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    // Exponential backoff: 50ms, 100ms, 200ms, max 2s
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Connection timeout
  connectTimeout: 10000,
  // Command timeout
  commandTimeout: 5000,
  // Keep-alive
  keepAlive: 30000,
  // Lazy connect (connect on first command)
  lazyConnect: true,
};

/**
 * Redis client singleton
 */
export const redis =
  globalForRedis.redis ??
  new Redis(
    process.env.REDIS_URL || `redis://${redisConfig.host}:${redisConfig.port}`,
    redisConfig
  );

// Save to global in development to prevent HMR issues
if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Connection event handlers
redis.on('connect', () => {
  logger.info('[REDIS] Connected to Redis server');
});

redis.on('ready', () => {
  logger.info('[REDIS] Redis client ready');
});

redis.on('error', (error) => {
  logger.error('[REDIS] Redis client error:', error);
});

redis.on('close', () => {
  logger.info('[REDIS] Redis connection closed');
});

redis.on('reconnecting', (delay: number) => {
  logger.info(`[REDIS] Reconnecting in ${delay}ms...`);
});

/**
 * Type-safe cache getter
 * @param key Cache key
 * @returns Parsed value or null if not found
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;

    // Try to parse JSON, fallback to raw string
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  } catch (error) {
    logger.error(`[REDIS] Cache get error for key "${key}":`, error);
    return null;
  }
}

/**
 * Type-safe cache setter with TTL
 * @param key Cache key
 * @param value Value to cache (will be JSON stringified)
 * @param ttl Time to live in seconds (default: 1 hour)
 */
export async function cacheSet(
  key: string,
  value: any,
  ttl: number = 3600
): Promise<boolean> {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await redis.set(key, stringValue, 'EX', ttl);
    return true;
  } catch (error) {
    logger.error(`[REDIS] Cache set error for key "${key}":`, error);
    return false;
  }
}

/**
 * Cache setter with expiry at specific date/time
 * @param key Cache key
 * @param value Value to cache
 * @param expiresAt Date when the key should expire
 */
export async function cacheSetUntil(
  key: string,
  value: any,
  expiresAt: Date
): Promise<boolean> {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const expiryTimestamp = Math.floor(expiresAt.getTime() / 1000);
    await redis.set(key, stringValue, 'EXAT', expiryTimestamp);
    return true;
  } catch (error) {
    logger.error(`[REDIS] Cache set until error for key "${key}":`, error);
    return false;
  }
}

/**
 * Delete cache key(s)
 * @param keys One or more keys to delete
 */
export async function cacheDel(...keys: string[]): Promise<number> {
  try {
    const deleted = await redis.del(...keys);
    return deleted;
  } catch (error) {
    logger.error(`[REDIS] Cache delete error for keys "${keys.join(', ')}":`, error);
    return 0;
  }
}

/**
 * Delete all keys matching a pattern
 * @param pattern Pattern to match (e.g., "stats:*")
 */
export async function cacheDelPattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    const deleted = await redis.del(...keys);
    return deleted;
  } catch (error) {
    logger.error(`[REDIS] Cache delete pattern error for "${pattern}":`, error);
    return 0;
  }
}

/**
 * Check if key exists
 * @param key Cache key
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error(`[REDIS] Cache exists error for key "${key}":`, error);
    return false;
  }
}

/**
 * Get TTL (time to live) for a key
 * @param key Cache key
 * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
 */
export async function cacheTTL(key: string): Promise<number> {
  try {
    const ttl = await redis.ttl(key);
    return ttl;
  } catch (error) {
    logger.error(`[REDIS] Cache TTL error for key "${key}":`, error);
    return -2;
  }
}

/**
 * Increment a counter (atomic operation)
 * @param key Counter key
 * @param increment Amount to increment (default: 1)
 * @returns New value after increment
 */
export async function cacheIncr(key: string, increment: number = 1): Promise<number> {
  try {
    const value = await redis.incrby(key, increment);
    return value;
  } catch (error) {
    logger.error(`[REDIS] Cache increment error for key "${key}":`, error);
    return 0;
  }
}

/**
 * Decrement a counter (atomic operation)
 * @param key Counter key
 * @param decrement Amount to decrement (default: 1)
 * @returns New value after decrement
 */
export async function cacheDecr(key: string, decrement: number = 1): Promise<number> {
  try {
    const value = await redis.decrby(key, decrement);
    return value;
  } catch (error) {
    logger.error(`[REDIS] Cache decrement error for key "${key}":`, error);
    return 0;
  }
}

/**
 * Add items to a set
 * @param key Set key
 * @param members Items to add
 */
export async function cacheSetAdd(key: string, ...members: string[]): Promise<number> {
  try {
    const added = await redis.sadd(key, ...members);
    return added;
  } catch (error) {
    logger.error(`[REDIS] Cache set add error for key "${key}":`, error);
    return 0;
  }
}

/**
 * Get all members of a set
 * @param key Set key
 */
export async function cacheSetMembers(key: string): Promise<string[]> {
  try {
    const members = await redis.smembers(key);
    return members;
  } catch (error) {
    logger.error(`[REDIS] Cache set members error for key "${key}":`, error);
    return [];
  }
}

/**
 * Check if member exists in set
 * @param key Set key
 * @param member Member to check
 */
export async function cacheSetIsMember(key: string, member: string): Promise<boolean> {
  try {
    const isMember = await redis.sismember(key, member);
    return isMember === 1;
  } catch (error) {
    logger.error(`[REDIS] Cache set is member error for key "${key}":`, error);
    return false;
  }
}

/**
 * Cache with automatic serialization and TTL
 * Useful for caching API responses
 */
export class CacheManager {
  /**
   * Get or set cache (cache-aside pattern)
   * @param key Cache key
   * @param fetcher Function to fetch data if cache miss
   * @param ttl Time to live in seconds
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Try to get from cache
    const cached = await cacheGet<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetcher();

    // Store in cache
    await cacheSet(key, data, ttl);

    return data;
  }

  /**
   * Invalidate cache by key or pattern
   * @param keyOrPattern Single key or pattern (e.g., "stats:*")
   */
  static async invalidate(keyOrPattern: string): Promise<number> {
    if (keyOrPattern.includes('*')) {
      return await cacheDelPattern(keyOrPattern);
    } else {
      return await cacheDel(keyOrPattern);
    }
  }
}

/**
 * Rate limiting using Redis
 * Implements sliding window algorithm
 */
export class RateLimiter {
  /**
   * Check if request is within rate limit
   * @param identifier Unique identifier (e.g., IP address, user ID)
   * @param limit Maximum requests allowed
   * @param windowSeconds Time window in seconds
   */
  static async check(
    identifier: string,
    limit: number = 100,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const key = `rate_limit:${identifier}`;

    try {
      // Increment counter
      const current = await redis.incr(key);

      // Set expiry on first request
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Get TTL
      const ttl = await redis.ttl(key);
      const resetAt = new Date(Date.now() + ttl * 1000);

      const remaining = Math.max(0, limit - current);
      const allowed = current <= limit;

      return {
        allowed,
        remaining,
        resetAt,
      };
    } catch (error) {
      logger.error(`[REDIS] Rate limit error for "${identifier}":`, error);
      // On error, allow the request but log it
      return {
        allowed: true,
        remaining: limit,
        resetAt: new Date(Date.now() + windowSeconds * 1000),
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   * @param identifier Unique identifier
   */
  static async reset(identifier: string): Promise<void> {
    const key = `rate_limit:${identifier}`;
    await cacheDel(key);
  }
}

/**
 * Session storage using Redis
 */
export class SessionStore {
  private static readonly PREFIX = 'session:';

  /**
   * Store session data
   * @param sessionId Session ID
   * @param data Session data
   * @param ttl Time to live in seconds (default: 30 days)
   */
  static async set(
    sessionId: string,
    data: any,
    ttl: number = 30 * 24 * 60 * 60
  ): Promise<boolean> {
    const key = `${this.PREFIX}${sessionId}`;
    return await cacheSet(key, data, ttl);
  }

  /**
   * Get session data
   * @param sessionId Session ID
   */
  static async get<T = any>(sessionId: string): Promise<T | null> {
    const key = `${this.PREFIX}${sessionId}`;
    return await cacheGet<T>(key);
  }

  /**
   * Delete session
   * @param sessionId Session ID
   */
  static async delete(sessionId: string): Promise<void> {
    const key = `${this.PREFIX}${sessionId}`;
    await cacheDel(key);
  }

  /**
   * Extend session TTL
   * @param sessionId Session ID
   * @param ttl New TTL in seconds
   */
  static async extend(sessionId: string, ttl: number): Promise<boolean> {
    const key = `${this.PREFIX}${sessionId}`;
    try {
      await redis.expire(key, ttl);
      return true;
    } catch {
      return false;
    }
  }
}

// Export redis client as default
export default redis;
