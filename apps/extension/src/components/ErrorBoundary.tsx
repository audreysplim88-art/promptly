import React from "react"

interface Props {
  onReset: () => void
  children: React.ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: "" }
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred."
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[Promptly] Overlay error:", error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" })
    this.props.onReset()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Something went wrong</p>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed max-w-[260px]">
              {this.state.message}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Start over
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
