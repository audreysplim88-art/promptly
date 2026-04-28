import { NextRequest, NextResponse } from "next/server"
import { anthropic, MODEL } from "@/lib/claude"
import {
  getSynthesizeSystemPrompt,
  buildSynthesizeUserPrompt
} from "@/lib/prompts/system-synthesize"
import type { Answer, Domain, OutputStyle, Question } from "@/lib/shared-types"
import { API_LIMITS } from "@/lib/config"

function corsHeaders(_req: NextRequest) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Promptly-Secret"
  }
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.PROMPTLY_API_SECRET
  if (!secret) return true
  return req.headers.get("x-promptly-secret") === secret
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req)

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers })
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
    const stream = await anthropic.messages.create({
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
