import { describe, it, expect } from "vitest"
import { API_LIMITS } from "../config"

describe("API_LIMITS", () => {
  it("goalMaxChars is a positive number", () => {
    expect(API_LIMITS.goalMaxChars).toBeGreaterThan(0)
  })

  it("interviewMaxTokens is a positive number", () => {
    expect(API_LIMITS.interviewMaxTokens).toBeGreaterThan(0)
  })

  it("synthesizeMaxTokens is a positive number", () => {
    expect(API_LIMITS.synthesizeMaxTokens).toBeGreaterThan(0)
  })

  it("synthesizeMaxTokens is larger than interviewMaxTokens (synthesis needs more room)", () => {
    expect(API_LIMITS.synthesizeMaxTokens).toBeGreaterThan(API_LIMITS.interviewMaxTokens)
  })

  it("freeDailyLimit is a positive number", () => {
    expect(API_LIMITS.freeDailyLimit).toBeGreaterThan(0)
  })
})
