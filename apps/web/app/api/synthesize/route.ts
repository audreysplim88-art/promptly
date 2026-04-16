import { NextRequest, NextResponse } from "next/server"
import { anthropic, MODEL } from "@/lib/claude"
import {
  SYNTHESIZE_SYSTEM_PROMPT,
  buildSynthesizeUserPrompt
} from "@/lib/prompts/system-synthesize"
import type { Answer, Question } from "@promptcraft/shared"

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

  let body: {
    sessionId: string
    goal: string
    domain: string
    questions: Question[]
    answers: Answer[]
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers })
  }

  const { goal, domain, questions, answers } = body

  if (!goal || !domain || !questions || !answers) {
    return NextResponse.json(
      { error: "Missing required fields" },
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
      max_tokens: 2048,
      system: SYNTHESIZE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildSynthesizeUserPrompt(goal, domain, qa)
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
