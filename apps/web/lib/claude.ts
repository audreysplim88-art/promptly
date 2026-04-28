import Anthropic from "@anthropic-ai/sdk"
import fs from "fs"
import path from "path"

// Load .env.local manually to work around Next.js 16 Turbopack workspace root detection
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

// B-009: validate at request time, not at module-load time.
// Vercel injects env vars at runtime; throwing here during `next build`
// causes the build to fail because the key is not present at compile time.
let _anthropic: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (_anthropic) return _anthropic
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "[Promptly] ANTHROPIC_API_KEY is not set. " +
      "Copy apps/web/.env.local.example to apps/web/.env.local and add your key."
    )
  }
  _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _anthropic
}

export const MODEL = "claude-sonnet-4-6"
