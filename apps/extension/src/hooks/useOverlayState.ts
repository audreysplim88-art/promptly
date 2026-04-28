import { useEffect, useRef, useState } from "react"
import { generateInterview, synthesizePrompt } from "../lib/api"
import { AI_TOOL_SELECTORS } from "../lib/constants"
import type { Answer, InterviewResponse, OutputStyle } from "@promptcraft/shared"

export type Step = "goal" | "loading" | "interview" | "generating" | "output"

function detectTool() {
  const host = window.location.hostname
  return AI_TOOL_SELECTORS.find((t) => host.includes(t.host)) ?? null
}

function injectPrompt(text: string): boolean {
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

export interface OverlayState {
  open: boolean
  step: Step
  goal: string
  interview: InterviewResponse | null
  answers: Record<string, string | string[]>
  output: string
  error: string | null
  copied: boolean
  outputStyle: OutputStyle
  allRequiredAnswered: boolean
  setOpen: (v: boolean) => void
  setGoal: (v: string) => void
  setOutputStyle: (v: OutputStyle) => void
  setAnswer: (qId: string, val: string | string[]) => void
  setInterview: (v: InterviewResponse) => void
  reset: () => void
  close: () => void
  handleGoalSubmit: () => Promise<void>
  handleAnswerSubmit: () => Promise<void>
  handleInject: () => void
  handleCopy: () => Promise<void>
}

export function useOverlayState(): OverlayState {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("goal")
  const [goal, setGoal] = useState("")
  const [interview, setInterviewState] = useState<InterviewResponse | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [outputStyle, setOutputStyle] = useState<OutputStyle>("standard")

  // B-005: hold a ref to the active stream's abort function so we can cancel on close
  const abortStreamRef = useRef<(() => void) | null>(null)

  // Cancel any in-flight stream when the hook unmounts (e.g. extension unload)
  useEffect(() => {
    return () => { abortStreamRef.current?.() }
  }, [])

  const reset = () => {
    abortStreamRef.current?.()
    abortStreamRef.current = null
    setStep("goal")
    setGoal("")
    setInterviewState(null)
    setAnswers({})
    setOutput("")
    setError(null)
    setOutputStyle("standard")
  }

  const close = () => { setOpen(false); reset() }

  const handleGoalSubmit = async () => {
    if (!goal.trim()) return
    setStep("loading")
    setError(null)
    try {
      const data = await generateInterview(goal.trim())
      setInterviewState(data)
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
    const { promise, abort } = synthesizePrompt(
      {
        sessionId: interview.sessionId,
        goal,
        domain: interview.domain,
        questions: interview.questions,
        answers: answerList,
        outputStyle
      },
      undefined,
      (chunk) => setOutput((prev) => prev + chunk)
    )
    abortStreamRef.current = abort
    try {
      await promise
      setStep("output")
    } catch (e) {
      // Silently ignore cancellations triggered by close/reset
      if ((e as Error).message === "Generation cancelled.") return
      setError((e as Error).message)
      setStep("interview")
    } finally {
      abortStreamRef.current = null
    }
  }

  const setAnswer = (qId: string, val: string | string[]) =>
    setAnswers((prev) => ({ ...prev, [qId]: val }))

  const setInterview = (v: InterviewResponse) => setInterviewState(v)

  const allRequiredAnswered =
    interview?.questions
      .filter((q) => q.required)
      .every((q) => {
        const v = answers[q.id]
        if (!v) return false
        return Array.isArray(v) ? v.length > 0 : v.trim().length > 0
      }) ?? false

  const handleInject = () => {
    const ok = injectPrompt(output)
    if (ok) {
      close()
    } else {
      setError("Couldn't find the chat input. Try 'Copy to clipboard' instead.")
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Copy failed — please select and copy the text manually.")
    }
  }

  return {
    open, step, goal, interview, answers, output, error, copied, outputStyle,
    allRequiredAnswered,
    setOpen, setGoal, setOutputStyle, setAnswer, setInterview,
    reset, close,
    handleGoalSubmit, handleAnswerSubmit, handleInject, handleCopy
  }
}
