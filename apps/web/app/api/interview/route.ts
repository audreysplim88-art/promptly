import { NextRequest, NextResponse } from "next/server"
import { getAnthropicClient, MODEL } from "@/lib/claude"
import {
  INTERVIEW_SYSTEM_PROMPT,
  buildInterviewUserPrompt
} from "@/lib/prompts/system-interview"
import type { InterviewResponse } from "@/lib/shared-types"
import { API_LIMITS } from "@/lib/config"
import { corsHeaders, isAuthorized } from "@/lib/api-middleware"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req)

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers })
  }

  // B-001: rate limiting — 20 interview requests per IP per hour
  const rl = checkRateLimit(`interview:${getClientIp(req)}`, RATE_LIMIT, RATE_WINDOW_MS)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests — please try again later." },
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000))
        }
      }
    )
  }

  let goal: string
  try {
    const body = await req.json()
    goal = body.goal
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers })
  }

  if (!goal || typeof goal !== "string") {
    return NextResponse.json(
      { error: "Missing required field: goal" },
      { status: 400, headers }
    )
  }

  if (goal.length > API_LIMITS.goalMaxChars) {
    return NextResponse.json(
      { error: `Goal must be ${API_LIMITS.goalMaxChars} characters or fewer` },
      { status: 400, headers }
    )
  }

  try {
    const message = await getAnthropicClient().messages.create({
      model: MODEL,
      max_tokens: API_LIMITS.interviewMaxTokens,
      system: INTERVIEW_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildInterviewUserPrompt(goal) }]
    })

    // B-006: type guard — content[0] may not be a text block
    const firstBlock = message.content[0]
    if (!firstBlock || firstBlock.type !== "text") {
      throw new Error("Unexpected response format from Claude")
    }
    const rawText = firstBlock.text

    // Strip any accidental markdown code fences
    const cleaned = rawText.replace(/^```(?:json)?\n?|\n?```$/g, "").trim()
    const parsed = JSON.parse(cleaned) as Omit<InterviewResponse, "sessionId">

    const response: InterviewResponse = {
      ...parsed,
      sessionId: crypto.randomUUID()
    }

    return NextResponse.json(response, { headers })
  } catch (e) {
    console.error("[/api/interview] Error:", e)
    const message = e instanceof SyntaxError
      ? "Failed to parse AI response — please try again"
      : "Failed to generate interview questions"
    return NextResponse.json({ error: message }, { status: 500, headers })
  }
}
