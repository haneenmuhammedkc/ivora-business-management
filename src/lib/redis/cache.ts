import { getRedisClient } from "./client";

/**
 * Cache-aside wrapper with fallback to source of truth.
 *
 * @param key Cache key string
 * @param ttlSeconds Expiration time in seconds
 * @param fetchFn Source of truth fetch function (PostgreSQL query)
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const redis = getRedisClient();

  if (!redis) {
    return fetchFn();
  }

  try {
    const cachedData = await redis.get(key);
    if (cachedData !== null && cachedData !== undefined) {
      try {
        return JSON.parse(cachedData) as T;
      } catch (parseErr) {
        console.warn(`[Redis] Failed to parse cache key ${key}. Refetching:`, parseErr);
        // Delete corrupt cache entry asynchronously
        redis.del(key).catch(() => {});
      }
    }
  } catch (err) {
    console.warn(`[Redis] Error reading cache key ${key}. Falling back to PostgreSQL:`, err);
  }

  // Cache miss or Redis unavailable: fetch from source of truth
  const freshData = await fetchFn();

  // Asynchronously populate cache without blocking response
  if (freshData !== undefined && freshData !== null) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(freshData));
    } catch (setErr) {
      console.warn(`[Redis] Error setting cache key ${key}:`, setErr);
    }
  }

  return freshData;
}

/**
 * Read directly from cache if available.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    console.warn(`[Redis] Error in getCache for ${key}:`, err);
    return null;
  }
}

/**
 * Set a key with TTL in seconds.
 */
export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn(`[Redis] Error in setCache for ${key}:`, err);
  }
}

/**
 * Invalidate one or more exact cache keys.
 */
export async function invalidateCacheKeys(...keys: (string | null | undefined)[]): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const validKeys = keys.filter((k): k is string => typeof k === "string" && k.length > 0);
  if (validKeys.length === 0) return;

  try {
    await redis.del(...validKeys);
  } catch (err) {
    console.warn("[Redis] Error deleting cache keys:", validKeys, err);
  }
}

/**
 * Invalidate cache keys matching a pattern using non-blocking SCAN.
 * Useful for broad namespace clears (e.g. `ivora:biz:{businessId}:*`).
 */
export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis || !pattern) return;

  try {
    let cursor = "0";
    const batchSize = 100;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", batchSize);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (err) {
    console.warn(`[Redis] Error invalidating pattern ${pattern}:`, err);
  }
}
