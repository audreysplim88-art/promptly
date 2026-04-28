import cssText from "data-text:../style.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useRef } from "react"

import { DomainPill } from "../components/DomainPill"
import { ErrorBoundary } from "../components/ErrorBoundary"
import { QuestionCard } from "../components/QuestionCard"
import { useOverlayState } from "../hooks/useOverlayState"

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

// ─── Overlay component ────────────────────────────────────────────────────────

export default function Overlay() {
  const {
    open, step, goal, interview, answers, output, error, copied, outputStyle,
    allRequiredAnswered,
    setOpen, setGoal, setOutputStyle, setAnswer, setInterview,
    reset, close,
    handleGoalSubmit, handleAnswerSubmit, handleInject, handleCopy
  } = useOverlayState()

  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll as the prompt streams in
  useEffect(() => {
    if (step === "generating" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [output, step])

  // Stop ALL keyboard events from escaping the shadow DOM into the host page.
  // AI tools (Claude, ChatGPT etc.) capture keydown at the document level and
  // call preventDefault, which silently swallows input in shadow DOM elements.
  const stopKeys = (e: React.KeyboardEvent) => e.stopPropagation()

  return (
    <div onKeyDown={stopKeys} onKeyUp={stopKeys} style={{ all: "initial" }}>

      {/* ── Trigger button — fixed bottom-right ── */}
      <button
        onClick={() => setOpen(!open)}
        title="Promptly — craft a better prompt"
        className={`fixed bottom-6 right-6 z-[2147483646] flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
          open ? "bg-gray-700 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
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

      {/* ── Side panel ── */}
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
        <ErrorBoundary onReset={reset}>
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

              {/* Output style selector */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Output style</p>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-0.5 gap-0.5">
                  {(
                    [
                      { value: "standard",  label: "Standard"  },
                      { value: "concise",   label: "Concise"   },
                      { value: "developer", label: "Developer" }
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setOutputStyle(value)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                        outputStyle === value
                          ? "bg-white text-indigo-700 shadow-sm border border-gray-200"
                          : "text-gray-500 hover:text-gray-700"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {outputStyle === "standard"  && "Full technique set. Best for most tasks."}
                  {outputStyle === "concise"   && "40–60% shorter. Same quality, fewer words."}
                  {outputStyle === "developer" && "Direct imperatives for AI coding tools."}
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

        </div>{/* end body */}
        </ErrorBoundary>

        {/* ── Footer: generate button ── */}
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

        {/* ── Footer: output actions ── */}
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
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>
        )}

      </div>{/* end side panel */}

      {/* ── Backdrop ── */}
      {open && (
        <div
          onClick={close}
          className="fixed inset-0 z-[2147483644] bg-black/10"
        />
      )}

    </div>
  )
}
