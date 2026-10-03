import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from './StateViews'

interface State {
  error: Error | null
}

/** Catches render errors in a page so the shell (sidebar, nav) keeps working. Give each page its own `key`. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[novarix] render error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="card">
        <ErrorState
          title="This page hit an error"
          message={this.state.error.message}
          onRetry={() => this.setState({ error: null })}
        />
      </div>
    )
  }
}
