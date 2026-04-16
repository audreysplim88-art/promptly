import { useEffect, useState } from "react"

export function useClerkSession() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    chrome.runtime.sendMessage({ type: "GET_AUTH_TOKEN" }, (response) => {
      setToken(response?.token ?? null)
      setLoading(false)
    })
  }

  useEffect(() => {
    refresh()
  }, [])

  const signIn = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("tabs/auth-callback.html")
    })
  }

  const signOut = () => {
    chrome.runtime.sendMessage({ type: "CLEAR_AUTH_TOKEN" }, () => {
      setToken(null)
    })
  }

  return { token, loading, signIn, signOut, refresh }
}
