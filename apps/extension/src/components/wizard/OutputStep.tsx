import React, { useState } from "react"
import { useWizardStore } from "../../store/wizardStore"

export function OutputStep() {
  const { outputPrompt, outputStreaming, reset } = useWizardStore()
  const [copied, setCopied] = useState(false)
  const [injected, setInjected] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInject = () => {
    chrome.runtime.sendMessage({ type: "INJECT_PROMPT", prompt: outputPrompt })
    setInjected(true)
    setTimeout(() => setInjected(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          {outputStreaming ? "Crafting your prompt..." : "Your optimized prompt"}
        </h2>
        <button
          onClick={reset}
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
          Start over
        </button>
      </div>

      <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-3 min-h-[120px]">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {outputPrompt}
          {outputStreaming && (
            <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle" />
          )}
        </p>
      </div>

      {!outputStreaming && outputPrompt && (
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            {copied ? "✓ Copied!" : "Copy prompt"}
          </button>
          <button
            onClick={handleInject}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            {injected ? "✓ Injected!" : "Inject into page"}
          </button>
        </div>
      )}

      {!outputStreaming && outputPrompt && (
        <p className="text-[10px] text-gray-400 text-center">
          "Inject into page" fills the AI tool's text box automatically
        </p>
      )}
    </div>
  )
}
