/**
 * Lightweight in-process sliding-window rate limiter.
 *
 * Each Vercel serverless function instance maintains its own counter in memory,
 * so the limits are per-instance rather than globally coordinated. This is
 * intentional for Phase 1: it provides meaningful protection against accidental
 * hammering and abuse without requiring an external Redis service. Phase 2 can
 * swap this for @upstash/ratelimit when multi-instance coordination matters.
 */

interface WindowEntry {
  count: number
  resetAt: number
}

const store = new Map<string, WindowEntry>()

// Prune stale entries once per minute to prevent unbounded memory growth
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  },
  60_000
)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check and increment the counter for `key`.
 *
 * @param key       Unique identifier (e.g. IP address)
 * @param limit     Maximum requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  let entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }

  const allowed = entry.count < limit
  if (allowed) entry.count++

  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt
  }
}

/**
 * Extract the caller's IP from a NextRequest, falling back through common
 * proxy headers before using a placeholder.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  )
}
