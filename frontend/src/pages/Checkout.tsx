import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { api, money, uploadFile } from '../api/client'
import type { Order, Quote } from '../api/types'
import { useAuth, useDraft } from '../app/providers'
import { AuthForm } from '../features/AuthForm'
import { specificationLabel, useProducts } from '../features/catalog'
import { EmptyState, ErrorMessage, Loading } from '../components/ui/Feedback'
import { FilePicker } from '../components/ui/FilePicker'
import styles from './Checkout.module.css'
import { PrintArtwork, PrintPreview } from '../components/preview/PrintPreview'

const contactSchema = z.object({
  contact_name: z.string().trim().min(2, 'Укажите имя').max(100),
  contact_phone: z
    .string()
    .trim()
    .min(7, 'Укажите телефон')
    .max(30)
    .regex(/^[+\d\s()\-]+$/, 'Проверьте номер телефона')
    .refine((value) => value.replace(/\D/g, '').length >= 7, 'Укажите минимум 7 цифр'),
  note: z.string().max(2000),
  consent: z.boolean().refine((value) => value, 'Подтвердите условия демонстрационного заказа'),
})
type ContactValues = z.infer<typeof contactSchema>

export function CheckoutPage() {
  const { user, loading } = useAuth()
  const draft = useDraft()
  const products = useProducts()
  const cache = useQueryClient()
  const navigate = useNavigate()
  const [fileError, setFileError] = useState('')
  const [uploaded, setUploaded] = useState<{
    file: File
    id: string
    userId: string
  } | null>(null)
  const quote = useQuery({
    queryKey: ['quote', draft.spec],
    queryFn: () =>
      api<Quote>('/quotes', {
        method: 'POST',
        body: JSON.stringify(draft.spec),
      }),
    enabled: !!draft.spec,
  })
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contact_name: '',
      contact_phone: '',
      note: '',
      consent: false,
    },
  })
  useEffect(() => {
    if (user) {
      form.setValue('contact_name', user.name)
      form.setValue('contact_phone', user.phone)
    }
  }, [user?.id, user?.name, user?.phone, form.setValue])
  const mutation = useMutation({
    mutationFn: async (values: ContactValues) => {
      if (!draft.file || !draft.spec || !user) throw new Error('Выберите макет и войдите в аккаунт')
      const artworkId =
        uploaded?.file === draft.file && uploaded.userId === user.id
          ? uploaded.id
          : (await uploadFile(draft.file)).id
      setUploaded({ file: draft.file, id: artworkId, userId: user.id })
      return api<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...draft.spec,
          artwork_id: artworkId,
          contact_name: values.contact_name,
          contact_phone: values.contact_phone,
          note: values.note,
        }),
      })
    },
    onSuccess: (order) => {
      draft.clear()
      cache.invalidateQueries({ queryKey: ['orders'] })
      navigate(`/account/orders/${order.id}?created=1`, { replace: true })
    },
  })
  if (!draft.spec)
    return (
      <EmptyState title="Сначала настроим тираж" action>
        Выберите продукцию и параметры печати. Ваш расчёт появится здесь.
      </EmptyState>
    )
  const product = products.data?.find((item) => item.slug === draft.spec?.product_slug)
  const submit = (values: ContactValues) => {
    if (!draft.file) {
      setFileError('Прикрепите макет для печати')
      return
    }
    setFileError('')
    mutation.mutate(values)
  }
  return (
    <>
      <div className="breadcrumbs">
        <Link to={`/catalog/${draft.spec.product_slug}`}>Назад к настройкам</Link>
        <span>/</span>
        <span>Оформление</span>
      </div>
      <div className="page-heading">
        <span className="eyebrow">Остался один шаг</span>
        <h1>Проверим ваш тираж</h1>
        <p>Проверьте детали. После оформления менеджер проверит ваш макет.</p>
      </div>
      <div className={styles.grid}>
        <section className="stack">
          {loading ? (
            <Loading />
          ) : !user ? (
            <div className="panel stack">
              <div className={styles.stepHeading}>
                <span>01</span>
                <div>
                  <h2>Ваш аккаунт</h2>
                  <p>
                    Сохраним заказ и сообщим, когда тираж будет готов. Выбранные параметры уже
                    сохранены.
                  </p>
                </div>
              </div>
              <AuthForm />
            </div>
          ) : (
            <>
              <div className={styles.signedIn}>
                <span className={styles.check} aria-hidden="true"></span>
                <div>
                  <strong>{user.name}</strong>
                  <p>{user.email} · Вы вошли в аккаунт</p>
                </div>
              </div>
              <form className="panel stack" onSubmit={form.handleSubmit(submit)}>
                <div className={styles.stepHeading}>
                  <span>01</span>
                  <div>
                    <h2>Контактные данные</h2>
                    <p>Для связи по вашему заказу.</p>
                  </div>
                </div>
                <label className="field">
                  Имя получателя
                  <input
                    autoComplete="name"
                    placeholder={user.name}
                    {...form.register('contact_name')}
                  />
                  {form.formState.errors.contact_name && (
                    <span className="field-error">
                      {form.formState.errors.contact_name.message}
                    </span>
                  )}
                </label>
                <label className="field">
                  Телефон
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder="+7 999 123-45-67"
                    {...form.register('contact_phone')}
                  />
                  {form.formState.errors.contact_phone && (
                    <span className="field-error">
                      {form.formState.errors.contact_phone.message}
                    </span>
                  )}
                </label>
                <hr className="divider" />
                <div className={styles.stepHeading}>
                  <span>02</span>
                  <div>
                    <h2>Макет для печати</h2>
                    <p>PDF, PNG или JPEG. После проверки сможем начать печать.</p>
                  </div>
                </div>
                <FilePicker
                  file={draft.file}
                  disabled={mutation.isPending}
                  onChange={(file) => {
                    draft.setFile(file)
                    setFileError('')
                  }}
                />
                {fileError && (
                  <p className="field-error" role="alert">
                    {fileError}
                  </p>
                )}
                <label className="field">
                  Комментарий к заказу <span className="muted">Необязательно</span>
                  <textarea
                    placeholder="Если есть важные детали — напишите здесь"
                    {...form.register('note')}
                  />
                </label>
                <div className={styles.pickup}>
                  <div>
                    <strong>Самовывоз · оплата при получении</strong>
                    <p>Демонстрационный сценарий. Реальные платежи не принимаются.</p>
                  </div>
                </div>
                <label className={styles.consent}>
                  <input type="checkbox" {...form.register('consent')} />
                  <span>
                    Понимаю, что это демонстрационный проект. Не загружаю конфиденциальные
                    материалы.
                  </span>
                </label>
                {form.formState.errors.consent && (
                  <p className="field-error">{form.formState.errors.consent.message}</p>
                )}
                <ErrorMessage error={mutation.error} />
                <button
                  className="button full"
                  disabled={mutation.isPending || !quote.data || quote.isError}
                >
                  {mutation.isPending ? 'Загружаем макет и оформляем…' : 'Подтвердить заказ'}
                </button>
              </form>
            </>
          )}
        </section>
        <aside className={`${styles.summary} panel stack`}>
          <span className="eyebrow">Ваш тираж</span>
          {product && draft.file ? (
            <PrintPreview product={product} spec={draft.spec} file={draft.file} />
          ) : (
            <div className={styles.summaryImage}>
              <PrintArtwork
                product={product ?? { slug: draft.spec.product_slug, title: 'Тираж' }}
              />
            </div>
          )}
          <h2>{product?.title ?? 'Печатная продукция'}</h2>
          <dl className={styles.details}>
            <div>
              <dt>Формат</dt>
              <dd>{specificationLabel(product, 'format', draft.spec.format)}</dd>
            </div>
            <div>
              <dt>Бумага</dt>
              <dd>{specificationLabel(product, 'paper', draft.spec.paper)}</dd>
            </div>
            <div>
              <dt>Печать</dt>
              <dd>{specificationLabel(product, 'printing', draft.spec.printing)}</dd>
            </div>
            <div>
              <dt>Количество</dt>
              <dd>{draft.spec.quantity.toLocaleString('ru-RU')} шт.</dd>
            </div>
          </dl>
          <hr className="divider" />
          <div className="row between">
            <span>Итого</span>
            <strong className={styles.price}>{quote.data ? money(quote.data.price) : '—'}</strong>
          </div>
          <ErrorMessage error={quote.error} />
          <p className="small muted row">Цена фиксируется при оформлении.</p>
          <Link className="text-link small" to={`/catalog/${draft.spec.product_slug}`}>
            Изменить параметры
          </Link>
        </aside>
      </div>
    </>
  )
}
