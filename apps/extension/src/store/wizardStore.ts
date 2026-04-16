import { create } from "zustand"
import type {
  Answer,
  Domain,
  InterviewResponse,
  Question
} from "@promptcraft/shared"

export type WizardStep = "goal" | "interview" | "output" | "error"

interface WizardState {
  step: WizardStep
  goal: string
  interviewData: InterviewResponse | null
  answers: Answer[]
  outputPrompt: string
  outputStreaming: boolean
  error: string | null

  setGoal: (goal: string) => void
  setInterviewData: (data: InterviewResponse) => void
  setAnswer: (answer: Answer) => void
  setOutputPrompt: (prompt: string) => void
  appendOutputChunk: (chunk: string) => void
  setOutputStreaming: (streaming: boolean) => void
  setStep: (step: WizardStep) => void
  setError: (error: string) => void
  reset: () => void
}

export const useWizardStore = create<WizardState>((set) => ({
  step: "goal",
  goal: "",
  interviewData: null,
  answers: [],
  outputPrompt: "",
  outputStreaming: false,
  error: null,

  setGoal: (goal) => set({ goal }),
  setInterviewData: (data) => set({ interviewData: data }),
  setAnswer: (answer) =>
    set((state) => {
      const existing = state.answers.findIndex(
        (a) => a.questionId === answer.questionId
      )
      if (existing >= 0) {
        const next = [...state.answers]
        next[existing] = answer
        return { answers: next }
      }
      return { answers: [...state.answers, answer] }
    }),
  setOutputPrompt: (prompt) => set({ outputPrompt: prompt }),
  appendOutputChunk: (chunk) =>
    set((state) => ({ outputPrompt: state.outputPrompt + chunk })),
  setOutputStreaming: (streaming) => set({ outputStreaming: streaming }),
  setStep: (step) => set({ step }),
  setError: (error) => set({ error, step: "error" }),
  reset: () =>
    set({
      step: "goal",
      goal: "",
      interviewData: null,
      answers: [],
      outputPrompt: "",
      outputStreaming: false,
      error: null
    })
}))
