import React, { useState } from "react"
import { useInterview } from "../../hooks/useInterview"

interface GoalInputProps {
  token?: string | null
}

export function GoalInput({ token }: GoalInputProps) {
  const [goal, setGoal] = useState("")
  const [loading, setLoading] = useState(false)
  const { startInterview } = useInterview(token)

  const handleSubmit = async () => {
    const trimmed = goal.trim()
    if (!trimmed || loading) return
    setLoading(true)
    await startInterview(trimmed)
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-base font-semibold text-gray-900">PromptCraft</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Tell me what you want to do — I'll help you craft the perfect prompt.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
          placeholder="e.g. I want to make banana bread, or add dark mode to my React app..."
          rows={3}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!goal.trim() || loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing...
            </span>
          ) : (
            "Craft my prompt →"
          )}
        </button>
      </div>

      <p className="text-[10px] text-gray-400 text-center">
        Works with ChatGPT, Claude, Gemini & more
      </p>
    </div>
  )
}
