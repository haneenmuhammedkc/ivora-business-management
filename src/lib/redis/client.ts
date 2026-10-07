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
      connectTimeout: 3000,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop retrying after 3 rapid failures to prevent hanging requests
        }
        return Math.min(times * 200, 1000);
      },
    });

    client.on("error", (err) => {
      // Log connection error once to avoid polluting server logs
      if (!globalForRedis.redisErrorLogged) {
        console.warn("[Redis] Connection error. Operating in PostgreSQL-only mode:", err.message);
        globalForRedis.redisErrorLogged = true;
      }
    });

    client.on("connect", () => {
      if (globalForRedis.redisErrorLogged) {
        console.log("[Redis] Connected successfully. Cache active.");
        globalForRedis.redisErrorLogged = false;
      }
    });

    return client;
  } catch (err) {
    console.warn("[Redis] Failed to initialize client. Operating in PostgreSQL-only mode:", err);
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

export default getRedisClient;
