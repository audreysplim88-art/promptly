import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { corsHeaders, isAuthorized } from "../api-middleware"
import type { NextRequest } from "next/server"

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeRequest(secretHeader?: string): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (secretHeader !== undefined) {
    headers["x-promptly-secret"] = secretHeader
  }
  // Cast: we only use req.headers.get() so a plain Request is sufficient
  return new Request("https://example.com/api/test", { headers }) as unknown as NextRequest
}

// ─── corsHeaders ──────────────────────────────────────────────────────────────

describe("corsHeaders", () => {
  it("allows any origin", () => {
    const h = corsHeaders()
    expect(h["Access-Control-Allow-Origin"]).toBe("*")
  })

  it("allows POST and OPTIONS methods", () => {
    const h = corsHeaders()
    expect(h["Access-Control-Allow-Methods"]).toContain("POST")
    expect(h["Access-Control-Allow-Methods"]).toContain("OPTIONS")
  })

  it("allows the X-Promptly-Secret header", () => {
    const h = corsHeaders()
    expect(h["Access-Control-Allow-Headers"]).toContain("X-Promptly-Secret")
  })

  it("allows the Authorization header", () => {
    const h = corsHeaders()
    expect(h["Access-Control-Allow-Headers"]).toContain("Authorization")
  })
})

// ─── isAuthorized ─────────────────────────────────────────────────────────────

describe("isAuthorized", () => {
  const ORIGINAL_ENV = process.env.PROMPTLY_API_SECRET

  afterEach(() => {
    // Restore env after each test
    if (ORIGINAL_ENV === undefined) {
      delete process.env.PROMPTLY_API_SECRET
    } else {
      process.env.PROMPTLY_API_SECRET = ORIGINAL_ENV
    }
  })

  it("returns true when no secret is configured (local dev)", () => {
    delete process.env.PROMPTLY_API_SECRET
    expect(isAuthorized(makeRequest())).toBe(true)
  })

  it("returns true when the correct secret is sent", () => {
    process.env.PROMPTLY_API_SECRET = "test-secret-abc"
    expect(isAuthorized(makeRequest("test-secret-abc"))).toBe(true)
  })

  it("returns false when the wrong secret is sent", () => {
    process.env.PROMPTLY_API_SECRET = "test-secret-abc"
    expect(isAuthorized(makeRequest("wrong-secret"))).toBe(false)
  })

  it("returns false when no secret header is sent but one is configured", () => {
    process.env.PROMPTLY_API_SECRET = "test-secret-abc"
    expect(isAuthorized(makeRequest())).toBe(false)
  })

  it("is case-sensitive", () => {
    process.env.PROMPTLY_API_SECRET = "Secret123"
    expect(isAuthorized(makeRequest("secret123"))).toBe(false)
    expect(isAuthorized(makeRequest("SECRET123"))).toBe(false)
  })
})
