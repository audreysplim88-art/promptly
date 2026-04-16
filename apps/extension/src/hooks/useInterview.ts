import { generateInterview, synthesizePrompt } from "../lib/api"
import { useWizardStore } from "../store/wizardStore"
import type { Answer } from "@promptcraft/shared"

export function useInterview(token?: string | null) {
  const store = useWizardStore()

  const startInterview = async (goal: string) => {
    store.setGoal(goal)
    store.setStep("interview")
    store.setOutputPrompt("")
    try {
      const data = await generateInterview(goal, token ?? undefined)
      store.setInterviewData(data)
    } catch (e) {
      store.setError((e as Error).message)
    }
  }

  const submitAnswers = async (answers: Answer[]) => {
    const { interviewData, goal } = store
    if (!interviewData) return

    store.setStep("output")
    store.setOutputPrompt("")
    store.setOutputStreaming(true)

    try {
      await synthesizePrompt(
        {
          sessionId: interviewData.sessionId,
          goal,
          domain: interviewData.domain,
          questions: interviewData.questions,
          answers
        },
        token ?? undefined,
        (chunk) => store.appendOutputChunk(chunk)
      )
    } catch (e) {
      store.setError((e as Error).message)
    } finally {
      store.setOutputStreaming(false)
    }
  }

  return { startInterview, submitAnswers }
}
