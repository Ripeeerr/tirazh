import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import { AuthForm } from '../features/AuthForm'
import { useAuth } from '../app/providers'
import { Loading } from '../components/ui/Feedback'
import styles from './Checkout.module.css'
import { safeReturnPath } from '../lib/returnPath'

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useAuth()
  const requested = new URLSearchParams(location.search).get('next')
  const next = safeReturnPath(requested)
  if (loading) return <Loading />
  if (user) return <Navigate to={next} replace />
  return (
    <div className={styles.authPage}>
      <aside className={styles.authVisual}>
        <div>
          <h2>
            Ваши идеи.
            <br />
            Их продолжение —<br />
            на бумаге.
          </h2>
          <p>Сохраняйте заказы, загружайте макеты и обсуждайте детали с типографией.</p>
        </div>
      </aside>
      <div className={styles.authForm}>
        <Link to="/catalog" className="text-link small">
          ← К продукции
        </Link>
        <div className="stack">
          <span className="eyebrow">Ваш личный кабинет</span>
          <h1>{location.pathname === '/register' ? 'Начнём с знакомства' : 'Войдите в студию'}</h1>
          <p className="muted small">
            Ваши макеты, заказы и общение с типографией — в одном месте.
          </p>
          <AuthForm
            initialMode={location.pathname === '/register' ? 'register' : 'login'}
            onSuccess={() => navigate(next, { replace: true })}
          />
        </div>
      </div>
    </div>
  )
}
