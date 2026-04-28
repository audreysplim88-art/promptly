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

// B-009: fail loudly at startup rather than producing cryptic errors at request time
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "[Promptly] ANTHROPIC_API_KEY is not set. " +
    "Copy apps/web/.env.local.example to apps/web/.env.local and add your key."
  )
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export const MODEL = "claude-sonnet-4-6"
