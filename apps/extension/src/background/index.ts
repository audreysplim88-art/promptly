import type { ExtensionMessage } from "../lib/messages"

export {}

// Token TTL: 55 minutes (Clerk tokens expire at 60 min)
const TOKEN_TTL_MS = 55 * 60 * 1000

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender,
    sendResponse: (response: unknown) => void
  ) => {
    if (message.type === "STORE_AUTH_TOKEN") {
      chrome.storage.local.set({
        authToken: message.token,
        authExpiry: Date.now() + TOKEN_TTL_MS
      })
      sendResponse({ ok: true })
      return false
    }

    if (message.type === "GET_AUTH_TOKEN") {
      chrome.storage.local.get(["authToken", "authExpiry"], (result) => {
        if (!result.authToken || Date.now() > (result.authExpiry ?? 0)) {
          sendResponse({ token: null })
        } else {
          sendResponse({ token: result.authToken })
        }
      })
      return true // async response
    }

    if (message.type === "CLEAR_AUTH_TOKEN") {
      chrome.storage.local.remove(["authToken", "authExpiry"])
      sendResponse({ ok: true })
      return false
    }

    if (message.type === "INJECT_PROMPT") {
      // Forward inject message to the active tab's content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0]
        if (!tab?.id) return
        chrome.tabs.sendMessage(tab.id, message)
      })
      return false
    }
  }
)
