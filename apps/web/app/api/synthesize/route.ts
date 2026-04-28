import { NextRequest, NextResponse } from "next/server"
import { getAnthropicClient, MODEL } from "@/lib/claude"
import {
  getSynthesizeSystemPrompt,
  buildSynthesizeUserPrompt
} from "@/lib/prompts/system-synthesize"
import type { Answer, Domain, OutputStyle, Question } from "@/lib/shared-types"
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

  // B-001: rate limiting — 20 synthesize requests per IP per hour
  const rl = checkRateLimit(`synthesize:${getClientIp(req)}`, RATE_LIMIT, RATE_WINDOW_MS)
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

  let body: {
    sessionId: string
    goal: string
    domain: Domain
    questions: Question[]
    answers: Answer[]
    outputStyle: OutputStyle
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers })
  }

  const { goal, domain, questions, answers, outputStyle } = body

  if (!goal || !domain || !questions || !answers || !outputStyle) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400, headers }
    )
  }

  const validStyles: OutputStyle[] = ["standard", "concise", "developer"]
  if (!validStyles.includes(outputStyle)) {
    return NextResponse.json(
      { error: "Invalid outputStyle" },
      { status: 400, headers }
    )
  }

  // Build QA pairs for the synthesis prompt
  const qa = questions.map((q) => ({
    question: q.prompt,
    answer:
      answers.find((a) => a.questionId === q.id)?.value ?? ""
  }))

  const encoder = new TextEncoder()

  try {
    const stream = await getAnthropicClient().messages.create({
      model: MODEL,
      max_tokens: API_LIMITS.synthesizeMaxTokens,
      system: getSynthesizeSystemPrompt(outputStyle),
      messages: [
        {
          role: "user",
          content: buildSynthesizeUserPrompt(goal, domain, qa, outputStyle)
        }
      ],
      stream: true
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ chunk: event.delta.text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        } catch (streamErr) {
          console.error("[/api/synthesize] Stream error:", streamErr)
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted — please try again" })}\n\n`)
            )
          } catch {}
        } finally {
          controller.close()
        }
      }
    })

    return new NextResponse(readable, {
      headers: {
        ...headers,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      }
    })
  } catch (e) {
    console.error("[/api/synthesize] Error:", e)
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500, headers }
    )
  }
}
