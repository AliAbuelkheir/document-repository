import { createHash } from 'node:crypto';

import { logger } from '../config/logger.js';
import { redis } from '../config/redis.js';
import type { Json } from '../types/common.js';

/**
 * Each group has a version counter in Redis, and every key of the group contains it.
 * To invalidate a group, increase its counter. Old keys become unreachable and expire.
 */
export type CacheGroup = 'documents' | 'users' | 'departments' | 'tags';

const ALL_GROUPS: CacheGroup[] = ['documents', 'users', 'departments', 'tags'];

export const SEARCH_TTL_SECONDS = 60 * 60;
const DEFAULT_TTL_SECONDS = 3 * 60 * 60;

interface CacheEntry {
  group: CacheGroup;
  /** The first part of the key, such as `doc` or `search`. */
  name: string;
  /** The last part of the key, such as a document id or a hash of the query. */
  key: string;
  ttlSeconds?: number;
}

/** A short key part that is the same for equal query parameters. */
export function hashParams(params: unknown): string {
  return createHash('sha1').update(JSON.stringify(params)).digest('hex');
}

function versionKey(group: CacheGroup): string {
  return `cache:ver:${group}`;
}

async function buildKey(entry: CacheEntry): Promise<string> {
  const version = await redis.get(versionKey(entry.group));
  return `${entry.name}:${version ?? '0'}:${entry.key}`;
}

/** Returns the cached text, or null if the key is missing or Redis is down. */
async function readCache(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch (err) {
    logger.warn({ err, key }, 'Cache read failed');
    return null;
  }
}

async function writeCache(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, 'Cache write failed');
  }
}

/**
 * Returns the cached value. If there is no cached value, it calls `load` and caches the result.
 * The value always goes through JSON, so the result is the same with or without a cache hit.
 * If Redis is down, it calls `load` and does not cache.
 */
export async function cached<T>(entry: CacheEntry, load: () => Promise<T>): Promise<Json<T>> {
  let key: string | null = null;
  try {
    key = await buildKey(entry);
  } catch (err) {
    logger.warn({ err }, 'Cache is not available');
  }

  if (key !== null) {
    const hit = await readCache(key);
    if (hit !== null) {
      return JSON.parse(hit) as Json<T>;
    }
  }

  const text = JSON.stringify(await load());
  if (key !== null) {
    await writeCache(key, text, entry.ttlSeconds ?? DEFAULT_TTL_SECONDS);
  }
  return JSON.parse(text) as Json<T>;
}

/** Makes all cached keys of the groups unreachable. Call it after the transaction commits. */
export async function invalidate(groups: CacheGroup[]): Promise<void> {
  try {
    await Promise.all(groups.map((group) => redis.incr(versionKey(group))));
  } catch (err) {
    logger.warn({ err, groups }, 'Cache invalidation failed');
  }
}

/** Makes all cached keys unreachable. The seed calls it after it replaces all data. */
export async function invalidateAll(): Promise<void> {
  await invalidate(ALL_GROUPS);
}

// While Redis is down, writes cannot invalidate the cache. Old keys can still be there
// when Redis comes back, so invalidate all groups each time the connection is ready.
redis.on('ready', () => {
  void invalidateAll();
});

export async function isCacheAvailable(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
