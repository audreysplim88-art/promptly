import React from "react"
import type { Question } from "@promptcraft/shared"

interface QuestionCardProps {
  question: Question
  value: string | string[]
  onChange: (v: string | string[]) => void
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const toggle = (opt: string, checked: boolean) => {
    const cur = Array.isArray(value) ? value : []
    onChange(checked ? [...cur, opt] : cur.filter((v) => v !== opt))
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-800 leading-snug">
        {question.prompt}
        {question.required && (
          <span className="ml-1 text-indigo-500 text-xs">*</span>
        )}
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

      {question.type === "radio" &&
        question.options?.map((opt) => (
          <label key={opt} className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name={question.id}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug">
              {opt}
            </span>
          </label>
        ))}

      {question.type === "checkbox" &&
        question.options?.map((opt) => {
          const checked = Array.isArray(value) && value.includes(opt)
          return (
            <label key={opt} className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => toggle(opt, e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug">
                {opt}
              </span>
            </label>
          )
        })}
    </div>
  )
}
