import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redisClient: Redis | null | undefined;
  redisErrorLogged: boolean | undefined;
};

function createRedisInstance(): Redis | null {
  if (typeof window !== "undefined") {
    return null;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: false, // Attempt connection immediately in background without blocking
      enableOfflineQueue: false, // Fail immediately instead of queuing commands when offline
      retryStrategy(times) {
        if (times > 2) {
          // Cease retrying quickly when Redis is unreachable to avoid spinning
          return null;
        }
        return Math.min(times * 300, 1000);
      },
    });

    client.on("error", (err) => {
      // Log connection error once to avoid polluting server logs
      if (!globalForRedis.redisErrorLogged) {
        console.warn("[Redis] Connection unavailable. Operating in PostgreSQL-only mode:", err.message);
        globalForRedis.redisErrorLogged = true;
      }
    });

    client.on("ready", () => {
      if (globalForRedis.redisErrorLogged) {
        console.log("[Redis] Connected successfully. Cache active.");
        globalForRedis.redisErrorLogged = false;
      }
    });

    return client;
  } catch (err) {
    if (!globalForRedis.redisErrorLogged) {
      console.warn("[Redis] Failed to initialize client. Operating in PostgreSQL-only mode:", err);
      globalForRedis.redisErrorLogged = true;
    }
    return null;
  }
}

export function getRedisClient(): Redis | null {
  if (globalForRedis.redisClient !== undefined) {
    return globalForRedis.redisClient;
  }

  globalForRedis.redisClient = createRedisInstance();
  return globalForRedis.redisClient;
}

/**
 * Checks whether Redis is ready to accept commands.
 * Guaranteed to return false if disconnected, connecting, or offline.
 */
export function isRedisReady(): boolean {
  const client = getRedisClient();
  return Boolean(client && client.status === "ready");
}

export default getRedisClient;
