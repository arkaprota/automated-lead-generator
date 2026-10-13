import { Redis } from 'ioredis';
import { env } from './env.js';

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        // Linear backoff capped at 2000ms
        return Math.min(times * 100, 2000);
      },
    });

    redisInstance.on('error', (err) => {
      // Log warning in development rather than unhandled exception
      if (env.NODE_ENV === 'development') {
        console.warn('[Redis] Connection warning:', err.message);
      } else {
        console.error('[Redis] Connection error:', err);
      }
    });
  }

  return redisInstance;
}
