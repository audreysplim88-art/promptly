export type MessageType =
  | "GET_AUTH_TOKEN"
  | "STORE_AUTH_TOKEN"
  | "CLEAR_AUTH_TOKEN"
  | "INJECT_PROMPT"
  | "GET_ACTIVE_TAB"

export interface InjectPromptMessage {
  type: "INJECT_PROMPT"
  prompt: string
}

export interface GetAuthTokenMessage {
  type: "GET_AUTH_TOKEN"
}

export interface StoreAuthTokenMessage {
  type: "STORE_AUTH_TOKEN"
  token: string
}

export interface ClearAuthTokenMessage {
  type: "CLEAR_AUTH_TOKEN"
}

export type ExtensionMessage =
  | InjectPromptMessage
  | GetAuthTokenMessage
  | StoreAuthTokenMessage
  | ClearAuthTokenMessage
