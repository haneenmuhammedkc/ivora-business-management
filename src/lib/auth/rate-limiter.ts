interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetTime <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000).unref();
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Check and increment rate limit for a given key within a time window.
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { key, limit, windowMs } = options;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  if (!record || record.resetTime <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}

/**
 * Extract client IP address from Next.js request headers.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
