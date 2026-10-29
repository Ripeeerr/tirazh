import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, date, money } from '../api/client'
import type { OrderStatus, OrderSummary } from '../api/types'
import { statusLabels } from '../features/orders'
import { EmptyState, ErrorMessage, Loading } from '../components/ui/Feedback'
import { useAuth } from '../app/providers'
import styles from './Orders.module.css'
import { AccountNavigation } from '../components/layout/AccountNavigation'

export function OrdersPage({ manager = false }: { manager?: boolean }) {
  const { user } = useAuth()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const params = new URLSearchParams({
    offset: String(page * 20),
    limit: '21',
  })
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  const query = useQuery({
    queryKey: ['orders', user?.id, manager, status, search, page],
    queryFn: () => api<OrderSummary[]>(`${manager ? '/manager' : ''}/orders?${params}`),
  })
  return (
    <>
      {!manager && <AccountNavigation />}
      <div className="section-heading">
        <div className="page-heading">
          <span className="eyebrow">{manager ? 'Рабочее место менеджера' : 'Личный кабинет'}</span>
          <h1>{manager ? 'Заказы типографии' : 'Мои заказы'}</h1>
          <p>
            {manager
              ? 'Проверяйте макеты, общайтесь с клиентами и управляйте печатью.'
              : 'От первого макета до готового тиража. Все детали — здесь.'}
          </p>
        </div>
        <Link to={manager ? '/manager/products/new' : '/catalog'} className="button">
          {manager ? 'Добавить товар' : 'Новый тираж'}
        </Link>
      </div>
      {manager && (
        <div className={styles.filters}>
          <form
            className={styles.search}
            onSubmit={(event) => {
              event.preventDefault()
              setSearch(searchInput.trim())
              setPage(0)
            }}
          >
            <input
              aria-label="Номер заказа"
              placeholder="Поиск по номеру заказа"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button className="button small secondary">Найти</button>
          </form>
          <label className="field">
            <span className="visually-hidden">Статус заказа</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(0)
              }}
            >
              <option value="">Все статусы</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <ErrorMessage error={query.error} />
      ) : !query.data?.length ? (
        <EmptyState
          title={manager ? 'Заказов пока нет' : 'Первый тираж ещё впереди'}
          action={!manager}
        >
          {manager
            ? 'Новые заказы появятся здесь. Если включены фильтры, попробуйте изменить условия поиска.'
            : 'Выберите продукцию, настройте печать и загрузите макет.'}
        </EmptyState>
      ) : (
        <>
          <div className={styles.orderList}>
            <div className={styles.tableHead}>
              <span>Заказ</span>
              <span>Дата</span>
              <span>Статус</span>
              <span>Стоимость</span>
            </div>
            {query.data.slice(0, 20).map((order) => (
              <Link
                key={order.id}
                to={`${manager ? '/manager' : '/account'}/orders/${order.id}`}
                className={styles.orderRow}
              >
                <div>
                  <span className={styles.orderNumber}>№ {order.id.slice(0, 8)}</span>
                  <h3>
                    {order.product_title} · {order.specification.quantity.toLocaleString('ru-RU')}{' '}
                    шт.
                  </h3>
                  {manager && <p>{order.contact_name}</p>}
                </div>
                <span className={styles.orderDate}>{date(order.created_at)}</span>
                <span>
                  <span className="status" data-status={order.status}>
                    {statusLabels[order.status as OrderStatus]}
                  </span>
                </span>
                <strong>{money(order.price)}</strong>
              </Link>
            ))}
          </div>
          <div className={styles.pagination}>
            <button
              className="button secondary small"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Назад
            </button>
            <span>Страница {page + 1}</span>
            <button
              className="button secondary small"
              disabled={query.data.length <= 20}
              onClick={() => setPage(page + 1)}
            >
              Далее
            </button>
          </div>
        </>
      )}
    </>
  )
}
