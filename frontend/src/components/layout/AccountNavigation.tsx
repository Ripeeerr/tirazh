import { NavLink } from 'react-router-dom'
import styles from './AccountNavigation.module.css'

export function AccountNavigation() {
  return (
    <nav className={styles.navigation} aria-label="Личный кабинет">
      <NavLink to="/account/orders">Мои заказы</NavLink>
      <NavLink to="/account/profile">Профиль</NavLink>
    </nav>
  )
}
