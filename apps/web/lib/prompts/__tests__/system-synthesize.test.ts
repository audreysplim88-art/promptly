import { describe, it, expect } from "vitest"
import {
  getSynthesizeSystemPrompt,
  buildSynthesizeUserPrompt,
  SYNTHESIZE_SYSTEM_PROMPT
} from "../system-synthesize"

// ─── getSynthesizeSystemPrompt ────────────────────────────────────────────────

describe("getSynthesizeSystemPrompt", () => {
  it("returns the standard prompt for 'standard'", () => {
    expect(getSynthesizeSystemPrompt("standard")).toBe(SYNTHESIZE_SYSTEM_PROMPT)
  })

  it("returns a different prompt for 'concise'", () => {
    const concise = getSynthesizeSystemPrompt("concise")
    expect(concise).not.toBe(SYNTHESIZE_SYSTEM_PROMPT)
    expect(concise).toContain("Output Style: Concise")
  })

  it("returns a different prompt for 'developer'", () => {
    const developer = getSynthesizeSystemPrompt("developer")
    expect(developer).not.toBe(SYNTHESIZE_SYSTEM_PROMPT)
    expect(developer).toContain("Output Style: Developer")
  })

  it("falls back to standard for an unrecognised style", () => {
    // @ts-expect-error intentionally passing invalid value
    expect(getSynthesizeSystemPrompt("unknown")).toBe(SYNTHESIZE_SYSTEM_PROMPT)
  })

  it("standard prompt instructs to return only prompt text", () => {
    const prompt = getSynthesizeSystemPrompt("standard")
    expect(prompt).toContain("Return ONLY the final prompt text")
  })

  it("concise prompt has explicit word-count ceilings", () => {
    const prompt = getSynthesizeSystemPrompt("concise")
    expect(prompt).toContain("hard ceilings")
  })

  it("developer prompt omits role preamble instruction", () => {
    const prompt = getSynthesizeSystemPrompt("developer")
    expect(prompt).toContain("No role preamble")
  })
})

// ─── buildSynthesizeUserPrompt ────────────────────────────────────────────────

describe("buildSynthesizeUserPrompt", () => {
  const qa = [
    { question: "What tech stack?", answer: "React + TypeScript" },
    { question: "Required features?", answer: ["dark mode", "i18n"] }
  ]

  it("includes the goal", () => {
    const result = buildSynthesizeUserPrompt("Add dark mode", "technical", qa)
    expect(result).toContain("Goal: Add dark mode")
  })

  it("includes the domain", () => {
    const result = buildSynthesizeUserPrompt("Add dark mode", "technical", qa)
    expect(result).toContain("Domain: technical")
  })

  it("formats string answers inline", () => {
    const result = buildSynthesizeUserPrompt("Test goal", "general", qa)
    expect(result).toContain("React + TypeScript")
  })

  it("formats array answers as comma-separated values", () => {
    const result = buildSynthesizeUserPrompt("Test goal", "general", qa)
    expect(result).toContain("dark mode, i18n")
  })

  it("uses (no answer) for empty array", () => {
    const emptyArr = [{ question: "What?", answer: [] as string[] }]
    const result = buildSynthesizeUserPrompt("Test goal", "general", emptyArr)
    expect(result).toContain("(no answer)")
  })

  it("uses (no answer) for empty string", () => {
    const emptyStr = [{ question: "What?", answer: "" }]
    const result = buildSynthesizeUserPrompt("Test goal", "general", emptyStr)
    expect(result).toContain("(no answer)")
  })

  it("appends concise style reminder when mode is concise", () => {
    const result = buildSynthesizeUserPrompt("Test goal", "general", qa, "concise")
    expect(result).toContain("Output style: CONCISE")
  })

  it("appends developer style reminder when mode is developer", () => {
    const result = buildSynthesizeUserPrompt("Test goal", "technical", qa, "developer")
    expect(result).toContain("Output style: DEVELOPER")
  })

  it("does not append a style reminder for standard mode", () => {
    const result = buildSynthesizeUserPrompt("Test goal", "general", qa, "standard")
    expect(result).not.toContain("Output style:")
  })

  it("defaults to standard when outputStyle is omitted", () => {
    const result = buildSynthesizeUserPrompt("Test goal", "general", qa)
    expect(result).not.toContain("Output style:")
  })

  it("ends with the generation instruction", () => {
    const result = buildSynthesizeUserPrompt("Test goal", "general", qa)
    expect(result.trimEnd()).toContain("Generate the optimized prompt now.")
  })

  it("numbers each Q&A pair", () => {
    const result = buildSynthesizeUserPrompt("Test goal", "general", qa)
    expect(result).toContain("1. Q:")
    expect(result).toContain("2. Q:")
  })
})
