import { NextRequest, NextResponse } from "next/server"

// Phase 1: stub — returns a mock free-tier usage
// Phase 2: replace with real Supabase usage query + Clerk auth
export async function GET(_req: NextRequest) {
  return NextResponse.json({
    tier: "free",
    todayCount: 0,
    dailyLimit: 10
  })
}
