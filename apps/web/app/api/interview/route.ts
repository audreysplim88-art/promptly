import { NextRequest, NextResponse } from "next/server"
import { anthropic, MODEL } from "@/lib/claude"
import {
  INTERVIEW_SYSTEM_PROMPT,
  buildInterviewUserPrompt
} from "@/lib/prompts/system-interview"
import type { InterviewResponse } from "@promptcraft/shared"

// Dev: allow all origins so the content script (running on claude.ai, chatgpt.com etc.)
// can reach localhost. In production this should be locked to known extension IDs.
function corsHeaders(_req: NextRequest) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req)

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

  if (goal.length > 500) {
    return NextResponse.json(
      { error: "Goal must be 500 characters or fewer" },
      { status: 400, headers }
    )
  }

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: INTERVIEW_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildInterviewUserPrompt(goal) }]
    })

    const rawText = (message.content[0] as { type: "text"; text: string }).text

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
