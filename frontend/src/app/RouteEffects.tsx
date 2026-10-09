import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteEffects() {
  const location = useLocation()
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const destination = document.getElementById(location.hash ? location.hash.slice(1) : 'main')
      if (location.hash) destination?.scrollIntoView({ block: 'start' })
      else window.scrollTo(0, 0)
      destination?.focus({ preventScroll: true })
    })
    const names: Record<string, string> = {
      '/': 'Онлайн-типография',
      '/catalog': 'Продукция',
      '/checkout': 'Оформление заказа',
      '/account/orders': 'Мои заказы',
      '/account/profile': 'Ваш профиль',
      '/manager/orders': 'Заказы типографии',
      '/manager/products/new': 'Новый товар',
      '/delivery': 'Помощь',
      '/login': 'Вход',
      '/register': 'Регистрация',
    }
    document.title = (names[location.pathname] ?? 'Онлайн-типография') + ' — Тираж'
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, location.hash, location.key])
  return null
}
