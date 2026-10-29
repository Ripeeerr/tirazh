import type { OrderStatus } from '../api/types'

export const statusLabels: Record<OrderStatus, string> = {
  new: 'Новый',
  review: 'Проверка макета',
  revision: 'Нужны исправления',
  printing: 'В печати',
  ready: 'Готов к выдаче',
  completed: 'Завершён',
  cancelled: 'Отменён',
}
