import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api, date, money, uploadFile } from '../api/client'
import type { Order, OrderStatus } from '../api/types'
import { useAuth } from '../app/providers'
import { specificationLabel, useProducts } from '../features/catalog'
import { statusLabels } from '../features/orders'
import { ErrorMessage, Loading } from '../components/ui/Feedback'
import { OrderArtwork } from '../features/OrderArtwork'
import { FilePicker } from '../components/ui/FilePicker'
import styles from './Orders.module.css'

export function OrderDetailPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const cache = useQueryClient()
  const products = useProducts()
  const [body, setBody] = useState('')
  const [reason, setReason] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploaded, setUploaded] = useState<{ file: File; id: string } | null>(null)
  const key = ['orders', user?.id, id]
  const query = useQuery({
    queryKey: key,
    queryFn: () => api<Order>(`/orders/${id}`),
    refetchInterval: 15_000,
  })
  const refresh = () => {
    cache.invalidateQueries({ queryKey: ['orders'] })
  }
  const comment = useMutation({
    mutationFn: () =>
      api(`/orders/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      setBody('')
      refresh()
    },
  })
  const status = useMutation({
    mutationFn: (value: OrderStatus) =>
      api<Order>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: value, reason }),
      }),
    onSuccess: () => {
      setReason('')
      refresh()
    },
  })
  const replacement = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Выберите новый макет')
      const artworkId = uploaded?.file === file ? uploaded.id : (await uploadFile(file)).id
      setUploaded({ file, id: artworkId })
      return api<Order>(`/orders/${id}/artwork?artwork_id=${encodeURIComponent(artworkId)}`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      setFile(null)
      setUploaded(null)
      refresh()
    },
  })
  if (query.isPending) return <Loading />
  if (query.error) return <ErrorMessage error={query.error} />
  const order = query.data
  if (!order) return null
  const product = products.data?.find((product) => product.slug === order.product_slug)
  return (
    <>
      <Link
        to={user?.role === 'manager' ? '/manager/orders' : '/account/orders'}
        className="breadcrumbs"
      >
        К списку заказов
      </Link>
      {params.get('created') && (
        <div className="success row">
          Заказ оформлен. Менеджер проверит макет, а все обновления появятся здесь.
        </div>
      )}
      <div className={styles.detailHeading}>
        <div>
          <span className="eyebrow">Заказ № {order.id.slice(0, 8)}</span>
          <h1>{order.product_title}</h1>
          <p>
            {date(order.created_at)} · {order.specification.quantity.toLocaleString('ru-RU')} шт.
          </p>
        </div>
        <span className="status" data-status={order.status}>
          {statusLabels[order.status]}
        </span>
      </div>
      <div className={styles.detailGrid}>
        <div className="stack">
          <section className="panel stack">
            <h2>Детали тиража</h2>
            <dl className={styles.specs}>
              {(['format', 'paper', 'printing'] as const).map((field, index) => (
                <div key={field}>
                  <dt>{['Формат', 'Бумага', 'Печать'][index]}</dt>
                  <dd>{specificationLabel(product, field, order.specification[field])}</dd>
                </div>
              ))}
              <div>
                <dt>Количество</dt>
                <dd>{order.specification.quantity.toLocaleString('ru-RU')} шт.</dd>
              </div>
              <div>
                <dt>Стоимость</dt>
                <dd>
                  <strong>{money(order.price)}</strong>
                </dd>
              </div>
            </dl>
            {order.note && <p className="notice">Комментарий при оформлении: {order.note}</p>}
          </section>
          <section className="panel stack">
            <div className="row between">
              <h2>Макеты</h2>
              <span className="small muted">{order.files.length} верс.</span>
            </div>
            {product && <OrderArtwork order={order} product={product} />}
            {order.files.map((file, index) => (
              <a key={file.id} className={styles.file} href={`/api/files/${file.id}`}>
                <div>
                  <strong>{file.name}</strong>
                  <p>
                    Версия {index + 1} · {(file.size / 1024).toFixed(0)} КБ ·{' '}
                    {date(file.created_at)}
                  </p>
                </div>
              </a>
            ))}
            {order.status === 'revision' && user?.role === 'client' && (
              <div className="stack">
                <p className="notice">
                  Посмотрите причину запроса в истории заказа и загрузите исправленный макет.
                </p>
                <FilePicker file={file} disabled={replacement.isPending} onChange={setFile} />
                <ErrorMessage error={replacement.error} />
                <button
                  className="button"
                  disabled={!file || replacement.isPending}
                  onClick={() => replacement.mutate()}
                >
                  {replacement.isPending ? 'Отправляем…' : 'Отправить на повторную проверку'}
                </button>
              </div>
            )}
          </section>
          <section className="panel stack">
            <h2>Обсуждение заказа</h2>
            {order.comments.length ? (
              <div className="stack">
                {order.comments.map((item) => (
                  <article className={styles.comment} key={item.id}>
                    <div className="row between wrap">
                      <strong>{item.author_name}</strong>
                      <time>{date(item.created_at)}</time>
                    </div>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="small muted">
                Есть вопрос по макету или печати? Напишите менеджеру здесь.
              </p>
            )}
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault()
                if (body.trim()) comment.mutate()
              }}
            >
              <label className="field">
                <span className="visually-hidden">Ваш комментарий</span>
                <textarea
                  placeholder="Написать сообщение…"
                  value={body}
                  maxLength={2000}
                  required
                  onChange={(event) => setBody(event.target.value)}
                />
              </label>
              <ErrorMessage error={comment.error} />
              <button className="button secondary" disabled={!body.trim() || comment.isPending}>
                {comment.isPending ? 'Отправляем…' : 'Отправить сообщение'}
              </button>
            </form>
          </section>
        </div>
        <aside className="stack">
          {user?.role === 'manager' && order.allowed_statuses.length > 0 && (
            <section className="panel stack">
              <span className="eyebrow">Управление заказом</span>
              <h2>Следующий шаг</h2>
              <label className="field">
                Причина / пояснение
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={2000}
                  placeholder="Обязательно для отмены и запроса исправлений"
                />
              </label>
              {order.allowed_statuses.map((next, index) => (
                <button
                  key={next}
                  className={`button ${index === 0 && next !== 'cancelled' ? '' : 'secondary'}`}
                  disabled={
                    status.isPending || (['revision', 'cancelled'].includes(next) && !reason.trim())
                  }
                  onClick={() => status.mutate(next)}
                >
                  {statusLabels[next]}
                </button>
              ))}
              <ErrorMessage error={status.error} />
            </section>
          )}
          <section className="panel stack">
            <h2>История заказа</h2>
            <ol className={styles.timeline}>
              {order.history.map((event) => (
                <li key={event.id}>
                  <strong>{statusLabels[event.status]}</strong>
                  <time>{date(event.created_at)}</time>
                  {event.reason && <p>{event.reason}</p>}
                </li>
              ))}
            </ol>
          </section>
          <section className="panel stack">
            <h3>Получатель</h3>
            <p className="small">
              {order.contact_name}
              <br />
              {order.contact_phone}
            </p>
            <hr className="divider" />
            <div className="row">
              <strong className="small">Самовывоз</strong>
            </div>
            <p className="small muted">Оплата при получении. Демонстрационный заказ.</p>
          </section>
        </aside>
      </div>
    </>
  )
}
