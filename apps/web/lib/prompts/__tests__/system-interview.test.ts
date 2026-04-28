import { describe, it, expect } from "vitest"
import { buildInterviewUserPrompt, INTERVIEW_SYSTEM_PROMPT } from "../system-interview"

// ─── buildInterviewUserPrompt ─────────────────────────────────────────────────

describe("buildInterviewUserPrompt", () => {
  it("wraps the goal in double quotes", () => {
    const result = buildInterviewUserPrompt("Add dark mode")
    expect(result).toBe('User goal: "Add dark mode"')
  })

  it("preserves the full goal string verbatim", () => {
    const goal = "Write a function that returns x > y && z !== null"
    const result = buildInterviewUserPrompt(goal)
    expect(result).toContain(goal)
  })

  it("works with an empty string goal", () => {
    const result = buildInterviewUserPrompt("")
    expect(result).toBe('User goal: ""')
  })
})

// ─── INTERVIEW_SYSTEM_PROMPT ──────────────────────────────────────────────────

describe("INTERVIEW_SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(typeof INTERVIEW_SYSTEM_PROMPT).toBe("string")
    expect(INTERVIEW_SYSTEM_PROMPT.length).toBeGreaterThan(0)
  })

  it("instructs output as JSON only", () => {
    expect(INTERVIEW_SYSTEM_PROMPT).toContain("Return ONLY valid JSON")
  })

  it("defines all four domain values", () => {
    expect(INTERVIEW_SYSTEM_PROMPT).toContain("general")
    expect(INTERVIEW_SYSTEM_PROMPT).toContain("creative")
    expect(INTERVIEW_SYSTEM_PROMPT).toContain("technical")
    expect(INTERVIEW_SYSTEM_PROMPT).toContain("professional")
  })

  it("defines all six dimension values", () => {
    const dims = ["goal", "context", "audience", "format", "constraints", "tone"]
    for (const dim of dims) {
      expect(INTERVIEW_SYSTEM_PROMPT).toContain(dim)
    }
  })
})
