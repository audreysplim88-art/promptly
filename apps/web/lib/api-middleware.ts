import type { NextRequest } from "next/server"

/**
 * CORS headers used by all API routes.
 *
 * We must allow any origin because content scripts run on the host AI tool
 * page (e.g. claude.ai), so the Origin header is that page — not the
 * extension ID. Restricting by origin would break all requests from the
 * extension. The shared secret (isAuthorized) is the actual auth layer.
 */
export function corsHeaders(_req?: NextRequest) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Promptly-Secret"
  }
}

/**
 * Validates the X-Promptly-Secret header against PROMPTLY_API_SECRET.
 * Returns true when no secret is configured (local dev) so the dev
 * experience requires zero setup.
 */
export function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.PROMPTLY_API_SECRET
  if (!secret) return true
  return req.headers.get("x-promptly-secret") === secret
}
