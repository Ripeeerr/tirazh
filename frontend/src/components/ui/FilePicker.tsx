import { useId, useState } from 'react'
import styles from './FilePicker.module.css'

export function FilePicker({
  file,
  onChange,
  disabled = false,
}: {
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}) {
  const id = useId()
  const [error, setError] = useState('')
  const select = (next?: File) => {
    if (!next) return
    if (!/\.(pdf|png|jpe?g)$/i.test(next.name)) {
      setError('Выберите PDF, PNG или JPEG')
      return
    }
    if (next.size > 10 * 1024 * 1024) {
      setError('Максимальный размер — 10 МБ')
      return
    }
    if (next.size === 0) {
      setError('Файл пустой')
      return
    }
    setError('')
    onChange(next)
  }
  return (
    <div>
      <div
        className={`${styles.zone} ${file ? styles.selected : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          if (!disabled) select(event.dataTransfer.files[0])
        }}
      >
        <input
          id={id}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="visually-hidden"
          onChange={(event) => {
            select(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        <label htmlFor={id} className={styles.label}>
          <span className={styles.uploadLabel}>
            {file ? 'Макет выбран' : 'Перетащите файл сюда'}
          </span>
          <strong>{file ? file.name : 'Загрузить макет'}</strong>
          <span>
            {file
              ? `${(file.size / 1024 / 1024).toFixed(2)} МБ · Можно заменить файл`
              : 'PDF, PNG или JPEG, до 10 МБ'}
          </span>
        </label>
        {file && (
          <button
            className={styles.remove}
            type="button"
            aria-label="Удалить макет"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            Удалить
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
