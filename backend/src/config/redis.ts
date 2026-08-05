import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

class CacheService {
  private client: Redis | null = null;
  private memoryCache: Map<string, { value: string; expiry: number }> = new Map();
  private isConnected = false;

  constructor() {
    try {
      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('⚠️ Redis unreachable, switching to in-memory fallback cache.');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('🚀 Connected to Redis successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.warn(`Redis connection error: ${err.message}. Using in-memory fallback cache.`);
      });
    } catch {
      logger.warn('Failed to initialize Redis client. Using in-memory fallback cache.');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isConnected && this.client) {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      }
      
      // In-memory fallback
      const entry = this.memoryCache.get(key);
      if (entry) {
        if (entry.expiry > Date.now()) {
          return JSON.parse(entry.value);
        }
        this.memoryCache.delete(key);
      }
      return null;
    } catch (err) {
      logger.error(`Cache get error for key [${key}]:`, err);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = env.REDIS_TTL_SECONDS): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (this.isConnected && this.client) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
        return;
      }
      
      // In-memory fallback
      this.memoryCache.set(key, {
        value: serialized,
        expiry: Date.now() + ttlSeconds * 1000,
      });
    } catch (err) {
      logger.error(`Cache set error for key [${key}]:`, err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      }
      this.memoryCache.delete(key);
    } catch (err) {
      logger.error(`Cache del error for key [${key}]:`, err);
    }
  }

  async flushPrefix(prefix: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      }
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(prefix)) {
          this.memoryCache.delete(key);
        }
      }
    } catch (err) {
      logger.error(`Cache flushPrefix error for prefix [${prefix}]:`, err);
    }
  }
}

export const redisCache = new CacheService();
