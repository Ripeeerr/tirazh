import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import type { User } from '../api/types'
import { useAuth } from '../app/providers'
import { ErrorMessage } from '../components/ui/Feedback'
import { Link } from 'react-router-dom'
import { AccountNavigation } from '../components/layout/AccountNavigation'
import styles from './StudioPages.module.css'

export function ProfilePage() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const mutation = useMutation({
    mutationFn: () =>
      api<User>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, phone }),
      }),
    onSuccess: setUser,
  })
  return (
    <>
      <AccountNavigation />
      <div className="page-heading">
        <span className="eyebrow">Личный кабинет</span>
        <h1>Ваш профиль</h1>
      </div>
      <div className={styles.profileGrid}>
        <form
          className="panel stack"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <label className="field">
            Имя
            <input
              value={name}
              minLength={2}
              maxLength={100}
              autoComplete="name"
              required
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="field">
            Email
            <input value={user?.email ?? ''} disabled />
          </label>
          <label className="field">
            Телефон
            <input
              value={phone}
              maxLength={30}
              type="tel"
              autoComplete="tel"
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <ErrorMessage error={mutation.error} />
          {mutation.isSuccess && (
            <p className="success" role="status">
              Данные сохранены.
            </p>
          )}
          <button className="button" disabled={mutation.isPending}>
            {mutation.isPending ? 'Сохраняем…' : 'Сохранить изменения'}
          </button>
        </form>
        <aside className={styles.profileNote}>
          <span className="eyebrow">Для связи по заказу</span>
          <h2>
            Все детали —<br />в одном месте
          </h2>
          <p>
            Имя и телефон подставляются при оформлении. Макеты, сообщения менеджера и статусы
            сохраняются в ваших заказах.
          </p>
          <Link to="/account/orders" className="text-link">
            Перейти к заказам
          </Link>
        </aside>
      </div>
    </>
  )
}
