import { getRedisClient, isRedisReady } from "./client";

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
  // If Redis is not ready or offline, immediately execute source of truth (0ms delay)
  if (!isRedisReady()) {
    return fetchFn();
  }

  const redis = getRedisClient();

  if (redis && redis.status === "ready") {
    try {
      const cachedData = await redis.get(key);
      if (cachedData !== null && cachedData !== undefined) {
        try {
          return JSON.parse(cachedData) as T;
        } catch {
          // Corrupt cache entry: delete asynchronously without throwing
          redis.del(key).catch(() => {});
        }
      }
    } catch {
      // Ignore read error; fall through to database
    }
  }

  // Fetch from source of truth
  const freshData = await fetchFn();

  // Populate cache only if Redis is still ready
  if (freshData !== undefined && freshData !== null && isRedisReady()) {
    try {
      await redis?.setex(key, ttlSeconds, JSON.stringify(freshData));
    } catch {
      // Ignore write errors to prevent breaking client response
    }
  }

  return freshData;
}

/**
 * Read directly from cache if available.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!isRedisReady()) return null;
  const redis = getRedisClient();
  if (!redis || redis.status !== "ready") return null;

  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Set a key with TTL in seconds.
 */
export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (!isRedisReady()) return;
  const redis = getRedisClient();
  if (!redis || redis.status !== "ready") return;

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Ignore write errors
  }
}

/**
 * Invalidate one or more exact cache keys.
 */
export async function invalidateCacheKeys(...keys: (string | null | undefined)[]): Promise<void> {
  if (!isRedisReady()) return;
  const redis = getRedisClient();
  if (!redis || redis.status !== "ready") return;

  const validKeys = keys.filter((k): k is string => typeof k === "string" && k.length > 0);
  if (validKeys.length === 0) return;

  try {
    await redis.del(...validKeys);
  } catch {
    // Ignore invalidation errors
  }
}

/**
 * Invalidate cache keys matching a pattern using non-blocking SCAN.
 */
export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  if (!isRedisReady() || !pattern) return;
  const redis = getRedisClient();
  if (!redis || redis.status !== "ready") return;

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
  } catch {
    // Ignore pattern deletion errors
  }
}
