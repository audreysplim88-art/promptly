import React, { useState } from "react"
import { useWizardStore } from "../../store/wizardStore"
import { useInterview } from "../../hooks/useInterview"
import { DomainBadge } from "./DomainBadge"
import { QuestionCard } from "./QuestionCard"
import type { Answer, Domain } from "@promptcraft/shared"

interface InterviewStepProps {
  token?: string | null
}

export function InterviewStep({ token }: InterviewStepProps) {
  const { interviewData, goal, setInterviewData, reset } = useWizardStore()
  const { submitAnswers } = useInterview(token)

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [loading, setLoading] = useState(false)

  if (!interviewData) return null

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const overrideDomain = (domain: Domain) => {
    setInterviewData({ ...interviewData, domain })
  }

  const handleSubmit = async () => {
    const answerList: Answer[] = interviewData.questions.map((q) => ({
      questionId: q.id,
      value: answers[q.id] ?? ""
    }))
    setLoading(true)
    await submitAnswers(answerList)
    setLoading(false)
  }

  const allRequiredAnswered = interviewData.questions
    .filter((q) => q.required)
    .every((q) => {
      const val = answers[q.id]
      if (!val) return false
      if (Array.isArray(val)) return val.length > 0
      return val.trim().length > 0
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            "{goal}"
          </p>
        </div>
        <button
          onClick={reset}
          className="shrink-0 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
          Start over
        </button>
      </div>

      <DomainBadge
        domain={interviewData.domain}
        confidence={interviewData.domainConfidence}
        onOverride={overrideDomain}
      />

      <div className="flex flex-col gap-4 divide-y divide-gray-100">
        {interviewData.questions.map((q) => (
          <div key={q.id} className="pt-4 first:pt-0">
            <QuestionCard
              question={q}
              value={answers[q.id] ?? (q.type === "checkbox" ? [] : "")}
              onChange={(val) => setAnswer(q.id, val)}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allRequiredAnswered || loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-2">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Crafting your prompt...
          </span>
        ) : (
          "Generate my prompt →"
        )}
      </button>
    </div>
  )
}
