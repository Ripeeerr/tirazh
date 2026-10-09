import { Component } from 'react'
import type { ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="empty panel" style={{ maxWidth: 600, margin: '60px auto' }}>
          <span className="eyebrow">Тираж</span>
          <h1>Нужен свежий лист.</h1>
          <p>Не удалось показать страницу. Обновите её и попробуйте ещё раз.</p>
          <button className="button" onClick={() => window.location.reload()}>
            Обновить страницу
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
