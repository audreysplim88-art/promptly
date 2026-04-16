import React from "react"
import "./style.css"

const SUPPORTED = [
  { label: "ChatGPT", url: "https://chatgpt.com" },
  { label: "Claude", url: "https://claude.ai" },
  { label: "Gemini", url: "https://gemini.google.com" },
  { label: "Perplexity", url: "https://perplexity.ai" }
]

function Popup() {
  return (
    <div className="w-72 bg-white p-5 font-sans">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900">Promptly</span>
      </div>
      <p className="text-sm text-gray-500 mb-4 leading-relaxed">
        Open one of your AI tools below — a button will appear on the page to start crafting your prompt.
      </p>
      <div className="flex flex-col gap-2">
        {SUPPORTED.map(({ label, url }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
            <span>{label}</span>
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}

export default Popup
