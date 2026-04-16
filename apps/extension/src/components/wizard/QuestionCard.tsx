import React from "react"
import type { Question } from "@promptcraft/shared"

interface QuestionCardProps {
  question: Question
  value: string | string[]
  onChange: (value: string | string[]) => void
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const handleCheckbox = (option: string, checked: boolean) => {
    const current = Array.isArray(value) ? value : []
    if (checked) {
      onChange([...current, option])
    } else {
      onChange(current.filter((v) => v !== option))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-800 leading-snug">
        {question.prompt}
        {question.required && (
          <span className="ml-1 text-indigo-500 text-xs">*</span>
        )}
      </label>

      {question.type === "text" && (
        <textarea
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
          placeholder={question.placeholder ?? "Your answer..."}
          rows={2}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question.type === "radio" && question.options && (
        <div className="flex flex-col gap-1.5">
          {question.options.map((option) => (
            <label
              key={option}
              className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-indigo-600"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug">
                {option}
              </span>
            </label>
          ))}
        </div>
      )}

      {question.type === "checkbox" && question.options && (
        <div className="flex flex-col gap-1.5">
          {question.options.map((option) => {
            const checked = Array.isArray(value) && value.includes(option)
            return (
              <label
                key={option}
                className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  value={option}
                  checked={checked}
                  onChange={(e) => handleCheckbox(option, e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-indigo-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug">
                  {option}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
