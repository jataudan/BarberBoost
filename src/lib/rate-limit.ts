/**
 * Simple in-memory rate limiter.
 * Uses a sliding window per identifier (IP, shop_id, etc.).
 * Resets when the process restarts — good enough for edge cases and spam prevention.
 * For production at scale, replace the Map with a Redis-backed store.
 */

interface WindowEntry {
  count:     number
  resetAt:   number
}

const store = new Map<string, WindowEntry>()

// Clean up expired entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitResult {
  allowed:    boolean
  remaining:  number
  resetIn:    number  // seconds until reset
}

/**
 * @param identifier  A unique key, e.g. IP address or `ip:shop_id`
 * @param limit       Max requests in the window
 * @param windowSecs  Rolling window length in seconds
 */
export function rateLimit(
  identifier: string,
  limit:      number,
  windowSecs: number,
): RateLimitResult {
  const now   = Date.now()
  const entry = store.get(identifier)

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(identifier, { count: 1, resetAt: now + windowSecs * 1000 })
    return { allowed: true, remaining: limit - 1, resetIn: windowSecs }
  }

  entry.count++

  const resetIn = Math.ceil((entry.resetAt - now) / 1000)

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetIn }
  }

  return { allowed: true, remaining: limit - entry.count, resetIn }
}
