import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 32 }}>😕</p>
        <p>Etwas ist schiefgelaufen.</p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8,
                   background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >Neu laden</button>
      </div>
    )
    return this.props.children
  }
}
