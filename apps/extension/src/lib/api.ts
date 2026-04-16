import { API_BASE_URL } from "./constants"
import type { InterviewResponse, SynthesizeRequest } from "@promptcraft/shared"

async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>)
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers })
}

export async function generateInterview(
  goal: string,
  token?: string
): Promise<InterviewResponse> {
  const res = await apiFetch(
    "/api/interview",
    { method: "POST", body: JSON.stringify({ goal }) },
    token
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Interview failed: ${res.status}`)
  }
  return res.json()
}

export async function synthesizePrompt(
  req: SynthesizeRequest,
  token?: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const res = await apiFetch(
    "/api/synthesize",
    { method: "POST", body: JSON.stringify(req) },
    token
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Synthesis failed: ${res.status}`)
  }

  // Handle streaming SSE response
  const reader = res.body?.getReader()
  const decoder = new TextDecoder()
  let fullText = ""

  if (!reader) throw new Error("No response body")

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split("\n")

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const data = line.slice(6).trim()
      if (data === "[DONE]") break
      try {
        const parsed = JSON.parse(data)
        if (parsed.chunk) {
          fullText += parsed.chunk
          onChunk?.(parsed.chunk)
        }
      } catch {
        // ignore parse errors for partial SSE lines
      }
    }
  }

  return fullText
}

export async function fetchUsage(token?: string) {
  const res = await apiFetch("/api/usage", {}, token)
  if (!res.ok) return null
  return res.json()
}
