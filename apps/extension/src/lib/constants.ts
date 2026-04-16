export const API_BASE_URL =
  process.env.PLASMO_PUBLIC_API_BASE_URL ?? "http://localhost:3000"

// Sent as X-Promptly-Secret on every API request.
// Must match PROMPTLY_API_SECRET in the web app's environment variables.
export const API_SECRET = process.env.PLASMO_PUBLIC_API_SECRET ?? ""

export const FREE_DAILY_LIMIT = 10

export const AI_TOOL_SELECTORS = [
  {
    host: "chat.openai.com",
    selector: "#prompt-textarea",
    inputMethod: "prosemirror" as const
  },
  {
    host: "chatgpt.com",
    selector: "#prompt-textarea",
    inputMethod: "prosemirror" as const
  },
  {
    host: "claude.ai",
    selector: '[contenteditable="true"].ProseMirror',
    inputMethod: "prosemirror" as const
  },
  {
    host: "gemini.google.com",
    selector: ".ql-editor",
    inputMethod: "quill" as const
  },
  {
    host: "perplexity.ai",
    selector: "textarea[placeholder]",
    inputMethod: "textarea" as const
  },
  {
    host: "copilot.microsoft.com",
    selector: "textarea#userInput",
    inputMethod: "textarea" as const
  }
]

import type { Domain } from "@promptcraft/shared"

export const DOMAIN_LABELS: Record<Domain, string> = {
  general: "General",
  creative: "Creative",
  technical: "Technical",
  professional: "Professional"
}

export const DOMAIN_COLORS: Record<Domain, string> = {
  general: "bg-green-100 text-green-800 border-green-200",
  creative: "bg-purple-100 text-purple-800 border-purple-200",
  technical: "bg-blue-100 text-blue-800 border-blue-200",
  professional: "bg-orange-100 text-orange-800 border-orange-200"
}
