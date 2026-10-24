import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '../api/client'
import type { User } from '../api/types'
import { useAuth } from '../app/providers'
import { ErrorMessage } from '../components/ui/Feedback'

export function AuthForm({
  initialMode = 'register',
  onSuccess,
}: {
  initialMode?: 'login' | 'register'
  onSuccess?: (user: User) => void
}) {
  const passwordId = useId()
  const errorId = (field: string) => `${passwordId}-${field}-error`
  const [mode, setMode] = useState(initialMode)
  const [visible, setVisible] = useState(false)
  const { setUser } = useAuth()
  const schema = z.object({
    email: z.email('Введите корректный email'),
    password: z.string().min(10, 'Минимум 10 символов').max(128),
    name: z
      .string()
      .max(100)
      .refine(
        (value) => mode === 'login' || value.trim().length >= 2,
        'Укажите имя — минимум 2 символа',
      ),
  })
  type Values = z.infer<typeof schema>
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  })
  const mutation = useMutation({
    mutationFn: (values: Values) =>
      api<User>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: (user) => {
      setUser(user)
      onSuccess?.(user)
    },
  })
  return (
    <div className="stack">
      <div className="auth-tabs" role="group" aria-label="Способ входа">
        <button
          type="button"
          aria-pressed={mode === 'register'}
          disabled={mutation.isPending}
          onClick={() => {
            setMode('register')
            mutation.reset()
          }}
        >
          Создать аккаунт
        </button>
        <button
          type="button"
          aria-pressed={mode === 'login'}
          disabled={mutation.isPending}
          onClick={() => {
            setMode('login')
            mutation.reset()
          }}
        >
          Войти
        </button>
      </div>
      <form className="stack" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        {mode === 'register' && (
          <label className="field">
            Ваше имя
            <input
              autoComplete="name"
              placeholder="Введите имя"
              {...register('name')}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? errorId('name') : undefined}
            />
            {errors.name && (
              <span id={errorId('name')} className="field-error">
                {errors.name.message}
              </span>
            )}
          </label>
        )}
        <label className="field">
          Email
          <input
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? errorId('email') : undefined}
          />
          {errors.email && (
            <span id={errorId('email')} className="field-error">
              {errors.email.message}
            </span>
          )}
        </label>
        <div className="field">
          <label htmlFor={passwordId}>Пароль</label>
          <div className="password-field">
            <input
              id={passwordId}
              type={visible ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="Не меньше 10 символов"
              {...register('password')}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? errorId('password') : undefined}
            />
            <button
              type="button"
              aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
              onClick={() => setVisible(!visible)}
            >
              {visible ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          {errors.password && (
            <span id={errorId('password')} className="field-error">
              {errors.password.message}
            </span>
          )}
        </div>
        <ErrorMessage error={mutation.error} />
        <button className="button full" disabled={mutation.isPending}>
          {mutation.isPending
            ? 'Подождите…'
            : mode === 'register'
            ? 'Создать аккаунт и продолжить'
            : 'Войти и продолжить'}
        </button>
        <p className="small muted row">Аккаунт нужен для доступа к файлам и истории заказов.</p>
      </form>
    </div>
  )
}
