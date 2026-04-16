import cssText from "data-text:../style.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useCallback, useEffect, useRef, useState } from "react"

import { generateInterview, synthesizePrompt } from "../lib/api"
import { AI_TOOL_SELECTORS, DOMAIN_COLORS, DOMAIN_LABELS } from "../lib/constants"
import type { Answer, Domain, InterviewResponse, Question } from "@promptcraft/shared"

export const config: PlasmoCSConfig = {
  matches: [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://www.perplexity.ai/*",
    "https://copilot.microsoft.com/*"
  ]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// ─── Injection helpers ───────────────────────────────────────────────────────

function detectTool() {
  const host = window.location.hostname
  return AI_TOOL_SELECTORS.find((t) => host.includes(t.host)) ?? null
}

function injectPrompt(text: string) {
  const tool = detectTool()
  if (!tool) return false
  const el = document.querySelector(tool.selector) as HTMLElement | null
  if (!el) return false

  if (tool.inputMethod === "textarea") {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set
    nativeSetter?.call(el as HTMLTextAreaElement, text)
    el.dispatchEvent(new Event("input", { bubbles: true }))
    el.dispatchEvent(new Event("change", { bubbles: true }))
  } else {
    el.focus()
    document.execCommand("selectAll", false, undefined)
    document.execCommand("insertText", false, text)
  }

  el.style.outline = "2px solid #6366f1"
  el.style.outlineOffset = "2px"
  setTimeout(() => {
    el.style.outline = ""
    el.style.outlineOffset = ""
  }, 1500)
  return true
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DomainPill({
  domain,
  confidence,
  onOverride
}: {
  domain: Domain
  confidence: number
  onOverride: (d: Domain) => void
}) {
  const [open, setOpen] = useState(confidence < 0.75)
  const domains: Domain[] = ["general", "creative", "technical", "professional"]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${DOMAIN_COLORS[domain]}`}>
        {DOMAIN_LABELS[domain]}
      </span>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600">
        {confidence < 0.75 ? "Is this right?" : "Change"}
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5 w-full">
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => { onOverride(d); setOpen(false) }}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${d === domain ? "opacity-100" : "opacity-50 hover:opacity-100"} ${DOMAIN_COLORS[d]}`}>
              {DOMAIN_LABELS[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function QuestionCard({
  question,
  value,
  onChange
}: {
  question: Question
  value: string | string[]
  onChange: (v: string | string[]) => void
}) {
  const toggle = (opt: string, checked: boolean) => {
    const cur = Array.isArray(value) ? value : []
    onChange(checked ? [...cur, opt] : cur.filter((v) => v !== opt))
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-800 leading-snug">
        {question.prompt}
        {question.required && <span className="ml-1 text-indigo-500 text-xs">*</span>}
      </p>

      {question.type === "text" && (
        <textarea
          rows={2}
          placeholder={question.placeholder ?? "Your answer..."}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
        />
      )}

      {question.type === "radio" && question.options?.map((opt) => (
        <label key={opt} className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="radio"
            name={question.id}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug">{opt}</span>
        </label>
      ))}

      {question.type === "checkbox" && question.options?.map((opt) => {
        const checked = Array.isArray(value) && value.includes(opt)
        return (
          <label key={opt} className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => toggle(opt, e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug">{opt}</span>
          </label>
        )
      })}
    </div>
  )
}

// ─── Main overlay component ───────────────────────────────────────────────────

type Step = "goal" | "loading" | "interview" | "generating" | "output"

export default function Overlay() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("goal")
  const [goal, setGoal] = useState("")
  const [interview, setInterview] = useState<InterviewResponse | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll output as it streams
  useEffect(() => {
    if (step === "generating" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [output, step])

  const reset = () => {
    setStep("goal")
    setGoal("")
    setInterview(null)
    setAnswers({})
    setOutput("")
    setError(null)
  }

  const close = () => { setOpen(false); reset() }

  const handleGoalSubmit = async () => {
    if (!goal.trim()) return
    setStep("loading")
    setError(null)
    try {
      const data = await generateInterview(goal.trim())
      setInterview(data)
      setStep("interview")
    } catch (e) {
      setError((e as Error).message)
      setStep("goal")
    }
  }

  const handleAnswerSubmit = async () => {
    if (!interview) return
    const answerList: Answer[] = interview.questions.map((q) => ({
      questionId: q.id,
      value: answers[q.id] ?? ""
    }))
    setStep("generating")
    setOutput("")
    try {
      await synthesizePrompt(
        {
          sessionId: interview.sessionId,
          goal,
          domain: interview.domain,
          questions: interview.questions,
          answers: answerList
        },
        undefined,
        (chunk) => setOutput((prev) => prev + chunk)
      )
      setStep("output")
    } catch (e) {
      setError((e as Error).message)
      setStep("interview")
    }
  }

  const setAnswer = (qId: string, val: string | string[]) =>
    setAnswers((prev) => ({ ...prev, [qId]: val }))

  const allRequiredAnswered =
    interview?.questions
      .filter((q) => q.required)
      .every((q) => {
        const v = answers[q.id]
        if (!v) return false
        return Array.isArray(v) ? v.length > 0 : v.trim().length > 0
      }) ?? false

  const handleInject = () => {
    injectPrompt(output)
    close()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
  }

  // Stop ALL keyboard events from escaping the shadow DOM into the host page.
  // AI tools (Claude, ChatGPT etc.) capture keydown at the document level and
  // call preventDefault, which silently swallows input in shadow DOM elements.
  const stopKeys = (e: React.KeyboardEvent) => e.stopPropagation()

  return (
    <div
      onKeyDown={stopKeys}
      onKeyUp={stopKeys}
      onKeyPress={stopKeys}
      style={{ all: "initial" }}>
      {/* Trigger button — fixed bottom-right */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Promptly — craft a better prompt"
        className={`fixed bottom-6 right-6 z-[2147483646] flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
          open
            ? "bg-gray-700 text-white"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}>
        {open ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )}
      </button>

      {/* Side panel */}
      <div
        className={`fixed top-0 right-0 z-[2147483645] h-full w-[400px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">Promptly</span>
          </div>
          <div className="flex items-center gap-3">
            {step !== "goal" && (
              <button
                onClick={reset}
                className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
                Start over
              </button>
            )}
            <button onClick={close} className="text-gray-400 hover:text-gray-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">

          {/* ── Goal step ── */}
          {(step === "goal" || step === "loading") && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">What do you want to do?</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Describe your goal in plain language — I'll ask you a few quick questions, then craft the perfect prompt for you.
                </p>
              </div>

              <textarea
                rows={3}
                placeholder="e.g. I want to add dark mode to my React app..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleGoalSubmit()
                  }
                }}
                autoFocus
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
              />

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                onClick={handleGoalSubmit}
                disabled={!goal.trim() || step === "loading"}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {step === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Thinking...
                  </span>
                ) : "Let's go →"}
              </button>
            </div>
          )}

          {/* ── Interview step ── */}
          {(step === "interview" || step === "generating") && interview && (
            <div className="flex flex-col gap-5">
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Your goal</p>
                <p className="text-sm text-gray-800 leading-relaxed">"{goal}"</p>
              </div>

              <DomainPill
                domain={interview.domain}
                confidence={interview.domainConfidence}
                onOverride={(d) => setInterview({ ...interview, domain: d })}
              />

              <div className="flex flex-col gap-5 divide-y divide-gray-100">
                {interview.questions.map((q) => (
                  <div key={q.id} className="pt-5 first:pt-0">
                    <QuestionCard
                      question={q}
                      value={answers[q.id] ?? (q.type === "checkbox" ? [] : "")}
                      onChange={(v) => setAnswer(q.id, v)}
                    />
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>
          )}

          {/* ── Output step ── */}
          {(step === "generating" || step === "output") && (
            <div className="flex flex-col gap-4 mt-5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {step === "generating" ? "Crafting your prompt..." : "Your optimized prompt"}
                </p>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-4 min-h-[120px]">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {output}
                  {step === "generating" && (
                    <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        {(step === "interview" || step === "generating") && interview && step !== "output" && (
          <div className="border-t border-gray-100 px-5 py-4 shrink-0">
            <button
              onClick={handleAnswerSubmit}
              disabled={!allRequiredAnswered || step === "generating"}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {step === "generating" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Crafting your prompt...
                </span>
              ) : "Generate my prompt →"}
            </button>
          </div>
        )}

        {step === "output" && (
          <div className="border-t border-gray-100 px-5 py-4 shrink-0 flex flex-col gap-2">
            <button
              onClick={handleInject}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              ↓ Insert into chat
            </button>
            <button
              onClick={handleCopy}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Copy to clipboard
            </button>
          </div>
        )}
      </div>

      {/* Backdrop — clicking it closes the panel */}
      {open && (
        <div
          onClick={close}
          className="fixed inset-0 z-[2147483644] bg-black/10"
        />
      )}
    </div>
  )
}
