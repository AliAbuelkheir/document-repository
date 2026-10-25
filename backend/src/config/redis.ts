import { Redis } from 'ioredis';

import { env } from './env.js';
import { logger } from './logger.js';

// Commands fail at once while Redis is down, so the cache can read from the database instead.
export const redis = new Redis(env.REDIS_URL, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

redis.on('error', (err: unknown) => {
  logger.warn({ err }, 'Redis connection error');
});
