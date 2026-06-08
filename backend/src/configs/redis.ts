import Redis from 'ioredis';
import { config } from './index';
import { logger } from './logger';

let redisClient: Redis | null = null;
let redisEnabled = false;

export const isRedisAvailable = () => redisEnabled;

export const getRedis = (): Redis | null => {
  if (!redisEnabled) return null;
  return redisClient;
};

export const initRedis = async (): Promise<boolean> => {
  if (redisClient) return redisEnabled;

  return new Promise((resolve) => {
    const client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: () => null,
    });

    client.on('error', () => {
      // Suppress spam when Redis is unavailable
    });

    client
      .connect()
      .then(() => {
        redisClient = client;
        redisEnabled = true;
        logger.info('Redis connected');
        resolve(true);
      })
      .catch(() => {
        redisEnabled = false;
        redisClient = null;
        logger.warn('Redis unavailable — running without cache/queues');
        client.disconnect();
        resolve(false);
      });
  });
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!redisClient || !redisEnabled) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds = 300): Promise<void> => {
  if (!redisClient || !redisEnabled) return;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // ignore
  }
};

export const cacheDel = async (pattern: string): Promise<void> => {
  if (!redisClient || !redisEnabled) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
  } catch {
    // ignore
  }
};

export const publishEvent = async (channel: string, data: unknown): Promise<void> => {
  if (!redisClient || !redisEnabled) return;
  try {
    await redisClient.publish(channel, JSON.stringify(data));
  } catch {
    // ignore
  }
};
