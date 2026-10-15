import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers'
import { RouteEffects } from '../../app/RouteEffects'
import { ErrorMessage, Loading } from '../ui/Feedback'
import styles from './Layout.module.css'

export function Layout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])
  const exit = async () => {
    if (exiting) return
    setExiting(true)
    setError(null)
    try {
      await logout()
      navigate('/', { replace: true })
      setOpen(false)
    } catch (error) {
      setError(error)
    } finally {
      setExiting(false)
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <header
        className={styles.header}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            setOpen(false)
            menuRef.current?.focus()
          }
        }}
      >
        <div className={styles.inner}>
          <Link className={styles.logo} to="/" aria-label="Тираж — главная">
            тираж<span>.</span>
          </Link>
          <button
            ref={menuRef}
            className={styles.mobileToggle}
            aria-controls="main-navigation"
            aria-expanded={open}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Закрыть' : 'Меню'}
          </button>
          <nav
            className={`${styles.nav} ${open ? styles.open : ''}`}
            id="main-navigation"
            aria-label="Основная навигация"
            onClick={() => setOpen(false)}
          >
            <NavLink to="/catalog">Продукция</NavLink>
            <NavLink to="/account/orders">Мои заказы</NavLink>
            <NavLink to="/delivery">Помощь</NavLink>
            {user?.role === 'manager' && <NavLink to="/manager/orders">Управление</NavLink>}
          </nav>
          <div className={styles.account}>
            <Link to={user ? '/account/profile' : '/login'} className={styles.user}>
              {user ? user.name.split(' ')[0] : 'Войти'}
            </Link>
            {user && (
              <button
                type="button"
                aria-label="Выйти"
                aria-busy={exiting}
                disabled={exiting}
                className={styles.logout}
                onClick={exit}
              >
                {exiting ? 'Выходим…' : 'Выйти'}
              </button>
            )}
          </div>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className={`${styles.main} ${location.pathname === '/' ? styles.home : ''}`}
      >
        <ErrorMessage error={error} />
        <Suspense fallback={<Loading />}>
          <Outlet />
          <RouteEffects key={location.pathname + location.hash} />
        </Suspense>
      </main>
      <footer className={styles.footer}>
        <div>
          <Link to="/" className={styles.logo}>
            тираж<span>.</span>
          </Link>
          <p>Студия печати для ваших идей. От первого макета до готового тиража.</p>
        </div>
        <div className={styles.footerLinks}>
          <Link to="/catalog">Продукция</Link>
          <Link to="/delivery">Получение и макеты</Link>
        </div>
        <p className={styles.demo}>
          Портфолио-проект · Демонстрационная типография
          <br />
          Цены учебные. Реальные заказы и платежи не принимаются.
        </p>
      </footer>
    </>
  )
}
