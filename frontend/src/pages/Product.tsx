import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { api, money } from '../api/client'
import type { Product, Quote, Specification } from '../api/types'
import { useProducts, defaultSpec } from '../features/catalog'
import { useDraft } from '../app/providers'
import { EmptyState, ErrorMessage, Loading } from '../components/ui/Feedback'
import { FilePicker } from '../components/ui/FilePicker'
import { PrintSteps } from './Catalog'
import styles from './Product.module.css'
import { PrintPreview } from '../components/preview/PrintPreview'

export function ProductPage() {
  const { slug } = useParams()
  const query = useProducts()
  if (query.isPending) return <Loading />
  if (query.error) return <ErrorMessage error={query.error} />
  const product = query.data?.find((product) => product.slug === slug)
  if (!product)
    return (
      <EmptyState title="Продукт не найден" action>
        Выберите продукцию из каталога.
      </EmptyState>
    )
  return <ProductConfigurator key={product.slug} product={product} />
}

function ProductConfigurator({ product }: { product: Product }) {
  const draft = useDraft()
  const navigate = useNavigate()
  const [spec, setSpec] = useState<Specification>(() =>
    draft.spec?.product_slug === product.slug ? draft.spec : defaultSpec(product),
  )
  const [debouncedSpec, setDebouncedSpec] = useState(spec)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSpec(spec), 150)
    return () => clearTimeout(timer)
  }, [spec])
  const quote = useQuery({
    queryKey: ['quote', debouncedSpec],
    queryFn: () =>
      api<Quote>('/quotes', {
        method: 'POST',
        body: JSON.stringify(debouncedSpec),
      }),
    staleTime: 60_000,
  })
  const updating = spec !== debouncedSpec || quote.isFetching
  const proceed = () => {
    draft.setSpec(spec)
    navigate('/checkout')
  }
  const fields = [
    { name: 'format', label: 'Формат' },
    { name: 'paper', label: 'Бумага' },
    { name: 'printing', label: 'Печать' },
  ] as const

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span>/</span>
        <Link to="/catalog">Продукция</Link>
        <span>/</span>
        <span>{product.title}</span>
      </div>
      <div className={styles.grid}>
        <section className={styles.presentation} aria-label="Макет и предпросмотр">
          <div className={styles.previewHeading}>
            <span>Ваш макет на бумаге</span>
            <span>Интерактивный просмотр</span>
          </div>
          <PrintPreview product={product} spec={spec} file={draft.file} />
        </section>
        <section className={styles.configurator} aria-label="Параметры печати">
          <div className={styles.configHeading}>
            <span className="eyebrow">Настройте тираж</span>
            <h1>{product.title}</h1>
            <p>{product.description}</p>
          </div>
          {fields.map(({ name, label }) => (
            <fieldset className={styles.optionRow} key={name}>
              <legend className="visually-hidden">{label}</legend>
              <div className={styles.optionLabel}>{label}</div>
              <div className={styles.options}>
                {product.options[name].map((option) => (
                  <label
                    className={`${styles.option} ${
                      spec[name] === option.value ? styles.selected : ''
                    }`}
                    key={option.value}
                  >
                    <input
                      type="radio"
                      name={name}
                      value={option.value}
                      checked={spec[name] === option.value}
                      onChange={() =>
                        setSpec((previous) => ({
                          ...previous,
                          [name]: option.value,
                        }))
                      }
                    />
                    <strong>{option.label}</strong>
                    <span>{option.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <fieldset className={styles.optionRow}>
            <legend className="visually-hidden">Тираж</legend>
            <div className={styles.optionLabel}>Тираж</div>
            <div className={styles.quantities}>
              {product.options.quantities.map((quantity) => (
                <label
                  key={quantity}
                  className={`${styles.quantity} ${
                    spec.quantity === quantity ? styles.selected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="quantity"
                    value={quantity}
                    checked={spec.quantity === quantity}
                    onChange={() => setSpec((previous) => ({ ...previous, quantity }))}
                  />
                  {quantity.toLocaleString('ru-RU')} <span>шт.</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.upload}>
            <FilePicker file={draft.file} onChange={draft.setFile} />
            <Link to="/delivery#artwork" className={styles.requirements}>
              Требования к макету
            </Link>
          </div>
          <ErrorMessage error={quote.error} />
          <div className={styles.total}>
            <div>
              <span>Итого за {spec.quantity.toLocaleString('ru-RU')} шт.</span>
              <strong aria-live="polite">
                {updating ? 'Считаем…' : quote.data ? money(quote.data.price) : '—'}
              </strong>
              {quote.data && !updating && <small>{money(quote.data.unit_price, 2)} за штуку</small>}
            </div>
            <button
              className="button"
              onClick={proceed}
              disabled={!quote.data || updating || quote.isError}
            >
              Оформить заказ
            </button>
          </div>
          <div className={styles.production}>
            <span>Изготовление — 3 рабочих дня после проверки макета</span>
          </div>
        </section>
      </div>
      <PrintSteps />
    </>
  )
}
