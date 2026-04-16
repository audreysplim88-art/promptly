import type { PlasmoCSConfig } from "plasmo"
import { AI_TOOL_SELECTORS } from "../lib/constants"
import type { InjectPromptMessage } from "../lib/messages"

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

function detectTool() {
  const host = window.location.hostname
  return AI_TOOL_SELECTORS.find((t) => host.includes(t.host)) ?? null
}

function injectIntoTextarea(element: HTMLTextAreaElement, text: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )?.set
  if (nativeSetter) {
    nativeSetter.call(element, text)
    element.dispatchEvent(new Event("input", { bubbles: true }))
    element.dispatchEvent(new Event("change", { bubbles: true }))
  }
}

function injectIntoProseMirror(element: HTMLElement, text: string) {
  element.focus()
  // Select all existing content then replace with the new prompt
  document.execCommand("selectAll", false, undefined)
  document.execCommand("insertText", false, text)
}

function injectIntoQuill(element: HTMLElement, text: string) {
  element.focus()
  const selection = window.getSelection()
  if (selection) {
    const range = document.createRange()
    range.selectNodeContents(element)
    selection.removeAllRanges()
    selection.addRange(range)
    document.execCommand("insertText", false, text)
  }
}

function flash(element: HTMLElement) {
  const prev = element.style.outline
  element.style.outline = "2px solid #6366f1"
  element.style.outlineOffset = "2px"
  setTimeout(() => {
    element.style.outline = prev
    element.style.outlineOffset = ""
  }, 1500)
}

chrome.runtime.onMessage.addListener((message: InjectPromptMessage) => {
  if (message.type !== "INJECT_PROMPT") return

  const tool = detectTool()
  if (!tool) return

  const element = document.querySelector(tool.selector) as HTMLElement | null
  if (!element) return

  if (tool.inputMethod === "textarea") {
    injectIntoTextarea(element as HTMLTextAreaElement, message.prompt)
  } else if (tool.inputMethod === "prosemirror") {
    injectIntoProseMirror(element, message.prompt)
  } else if (tool.inputMethod === "quill") {
    injectIntoQuill(element, message.prompt)
  }

  flash(element)
})
