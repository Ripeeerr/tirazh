import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="loading-dot" aria-hidden="true" />
      <span>Загружаем…</span>
    </div>
  )
}

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <div className="error" role="alert">
      <span>
        {error instanceof Error ? error.message : 'Что-то пошло не так. Попробуйте ещё раз.'}
      </span>
    </div>
  )
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: boolean
}) {
  return (
    <div className="empty panel">
      <span className="eyebrow">Чистый лист</span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action && (
        <Link to="/catalog" className="button">
          Выбрать продукцию
        </Link>
      )}
    </div>
  )
}
