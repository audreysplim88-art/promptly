import { describe, it, expect, beforeEach, vi } from "vitest"
import { checkRateLimit, getClientIp } from "../rate-limit"

// ─── checkRateLimit ────────────────────────────────────────────────────────────

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Use fake timers so we can control the sliding window
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows the first request", () => {
    const result = checkRateLimit("test-key-1", 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("counts up to the limit and then blocks", () => {
    const key = "test-key-2"
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true)
    }
    const blocked = checkRateLimit(key, 3, 60_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it("resets after the window expires", () => {
    const key = "test-key-3"
    checkRateLimit(key, 1, 10_000)
    expect(checkRateLimit(key, 1, 10_000).allowed).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(10_001)

    expect(checkRateLimit(key, 1, 10_000).allowed).toBe(true)
  })

  it("uses separate counters for different keys", () => {
    checkRateLimit("key-a", 1, 60_000)
    checkRateLimit("key-a", 1, 60_000) // blocked

    // key-b is independent
    expect(checkRateLimit("key-b", 1, 60_000).allowed).toBe(true)
  })

  it("returns correct resetAt timestamp", () => {
    const before = Date.now()
    const windowMs = 30_000
    const { resetAt } = checkRateLimit("test-key-5", 5, windowMs)
    expect(resetAt).toBeGreaterThanOrEqual(before + windowMs)
    expect(resetAt).toBeLessThanOrEqual(Date.now() + windowMs + 50)
  })
})

// ─── getClientIp ──────────────────────────────────────────────────────────────

describe("getClientIp", () => {
  function makeReq(headers: Record<string, string>): Request {
    return new Request("https://example.com", { headers })
  }

  it("reads x-forwarded-for (first address)", () => {
    expect(getClientIp(makeReq({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4")
  })

  it("falls back to x-real-ip", () => {
    expect(getClientIp(makeReq({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9")
  })

  it("returns 'unknown' when no IP header is present", () => {
    expect(getClientIp(makeReq({}))).toBe("unknown")
  })

  it("x-forwarded-for takes precedence over x-real-ip", () => {
    expect(
      getClientIp(makeReq({ "x-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2" }))
    ).toBe("1.1.1.1")
  })
})
