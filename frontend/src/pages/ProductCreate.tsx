import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { api } from '../api/client'
import type { Product } from '../api/types'
import { ErrorMessage } from '../components/ui/Feedback'
import styles from './ProductCreate.module.css'

const factor = z.number().positive('Должен быть больше нуля').max(10, 'Не больше 10')
const name = z.string().trim().min(2, 'Минимум 2 символа').max(100)
const schema = z.object({
  title: name,
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Латинские буквы, цифры и дефисы'),
  description: z.string().trim().min(5, 'Минимум 5 символов').max(1000),
  base_price: z.number().int().min(1).max(1000000),
  formats: z
    .array(
      z.object({
        value: z.string(),
        label: name,
        width: z.number().int().min(1).max(3000),
        height: z.number().int().min(1).max(3000),
        multiplier: factor,
      }),
    )
    .min(1)
    .max(8),
  papers: z
    .array(
      z.object({
        value: z.string(),
        label: name,
        weight: z.number().int().min(40).max(1000),
        finish: z.enum(['smooth', 'matte', 'textured']),
        multiplier: factor,
      }),
    )
    .min(1)
    .max(8),
  quantities: z.string().refine((value) => {
    if (!/^\d+(?:\s*,\s*\d+)*$/.test(value.trim())) return false
    const numbers = value.split(',').map(Number)
    return (
      numbers.length <= 8 &&
      numbers.every((number) => number > 0 && number <= 10000) &&
      new Set(numbers).size === numbers.length
    )
  }, 'До 8 разных тиражей от 1 до 10000, через запятую'),
  double_sided: z.boolean(),
  double_factor: factor,
})
type Values = z.infer<typeof schema>

export function ProductCreatePage() {
  const cache = useQueryClient()
  const navigate = useNavigate()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      base_price: 10,
      formats: [{ value: 'standard', label: 'Стандарт', width: 90, height: 50, multiplier: 1 }],
      papers: [
        { value: 'standard', label: 'Стандартная', weight: 300, finish: 'smooth', multiplier: 1 },
      ],
      quantities: '100, 250, 500, 1000',
      double_sided: true,
      double_factor: 1.2,
    },
  })
  const formats = useFieldArray({ control, name: 'formats' })
  const papers = useFieldArray({ control, name: 'papers' })
  const mutation = useMutation({
    mutationFn: (values: Values) =>
      api<Product>('/manager/products', {
        method: 'POST',
        body: JSON.stringify({
          slug: values.slug,
          title: values.title,
          description: values.description,
          base_price: values.base_price,
          options: {
            format: values.formats.map((item) => ({
              value: item.value,
              label: item.label,
              hint: `${item.width} × ${item.height} мм`,
              multiplier: item.multiplier,
            })),
            paper: values.papers.map((item) => ({
              value: item.value,
              label: item.label,
              hint: `${item.weight} г/м²`,
              finish: item.finish,
              multiplier: item.multiplier,
            })),
            printing: [
              { value: 'single', label: 'Односторонняя', hint: '4+0', multiplier: 1 },
              ...(values.double_sided
                ? [
                    {
                      value: 'double',
                      label: 'Двусторонняя',
                      hint: '4+4',
                      multiplier: values.double_factor,
                    },
                  ]
                : []),
            ],
            quantities: values.quantities.split(',').map(Number),
          },
        }),
      }),
    onSuccess: (product) => {
      cache.setQueryData<Product[]>(['products'], (current) =>
        current
          ? [...current.filter((item) => item.slug !== product.slug), product].sort((left, right) =>
              left.slug.localeCompare(right.slug),
            )
          : undefined,
      )
      void cache.invalidateQueries({ queryKey: ['products'], refetchType: 'none' })
      navigate(`/catalog/${product.slug}`)
    },
  })
  return (
    <>
      <div className="breadcrumbs">
        <Link to="/manager/orders">Управление</Link>
        <span>/</span>
        <span>Новый товар</span>
      </div>
      <div className="page-heading">
        <span className="eyebrow">Каталог типографии</span>
        <h1>Добавить товар</h1>
        <p>
          Задайте варианты печати и стоимость. После сохранения товар появится в общем каталоге и
          станет доступен для заказа.
        </p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <section className="panel stack">
          <h2>О товаре</h2>
          <label className="field">
            Название товара
            <input
              {...register('title')}
              placeholder="Например, календари"
              aria-invalid={!!errors.title}
            />
            {errors.title && <span className="field-error">{errors.title.message}</span>}
          </label>
          <label className="field">
            Адрес страницы
            <input {...register('slug')} placeholder="calendars" aria-invalid={!!errors.slug} />
            <span className="muted small">/catalog/ваш-адрес</span>
            {errors.slug && <span className="field-error">{errors.slug.message}</span>}
          </label>
          <label className="field">
            Описание
            <textarea
              {...register('description')}
              placeholder="Для чего подходит этот товар"
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <span className="field-error">{errors.description.message}</span>
            )}
          </label>
          <label className="field">
            Базовая цена за штуку, ₽
            <input
              type="number"
              min="1"
              max="1000000"
              {...register('base_price', { valueAsNumber: true })}
            />
            {errors.base_price && <span className="field-error">{errors.base_price.message}</span>}
          </label>
          <p className="notice">
            Стоимость = базовая цена × тираж × коэффициенты формата, бумаги и печати. Для тиража от
            1000 шт. применяется скидка 15%.
          </p>
        </section>
        <section className="panel stack">
          <h2>Форматы</h2>
          <p className="small muted">Размеры задают пропорции листа в предпросмотре.</p>
          {formats.fields.map((field, index) => (
            <fieldset className={styles.option} key={field.id}>
              <legend>Формат {index + 1}</legend>
              <div className={styles.grid}>
                <label className="field">
                  Название формата
                  <input {...register(`formats.${index}.label`)} />
                  {errors.formats?.[index]?.label && (
                    <span className="field-error">{errors.formats[index]?.label?.message}</span>
                  )}
                </label>
                <label className="field">
                  Ширина, мм
                  <input
                    type="number"
                    min="1"
                    max="3000"
                    {...register(`formats.${index}.width`, { valueAsNumber: true })}
                  />
                  {errors.formats?.[index]?.width && (
                    <span className="field-error">{errors.formats[index]?.width?.message}</span>
                  )}
                </label>
                <label className="field">
                  Высота, мм
                  <input
                    type="number"
                    min="1"
                    max="3000"
                    {...register(`formats.${index}.height`, { valueAsNumber: true })}
                  />
                  {errors.formats?.[index]?.height && (
                    <span className="field-error">{errors.formats[index]?.height?.message}</span>
                  )}
                </label>
                <label className="field">
                  Коэффициент цены
                  <input
                    type="number"
                    min="0.01"
                    max="10"
                    step="0.01"
                    {...register(`formats.${index}.multiplier`, { valueAsNumber: true })}
                  />
                  {errors.formats?.[index]?.multiplier && (
                    <span className="field-error">
                      {errors.formats[index]?.multiplier?.message}
                    </span>
                  )}
                </label>
              </div>
              <button
                className="button small secondary"
                type="button"
                disabled={formats.fields.length === 1}
                onClick={() => formats.remove(index)}
              >
                Удалить формат
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            className="button secondary"
            disabled={formats.fields.length >= 8}
            onClick={() =>
              formats.append({
                value: `format-${crypto.randomUUID().slice(0, 8)}`,
                label: 'Новый формат',
                width: 148,
                height: 210,
                multiplier: 1,
              })
            }
          >
            Добавить формат
          </button>
        </section>
        <section className="panel stack">
          <h2>Бумага</h2>
          {papers.fields.map((field, index) => (
            <fieldset className={styles.option} key={field.id}>
              <legend>Бумага {index + 1}</legend>
              <div className={styles.grid}>
                <label className="field">
                  Название бумаги
                  <input {...register(`papers.${index}.label`)} />
                  {errors.papers?.[index]?.label && (
                    <span className="field-error">{errors.papers[index]?.label?.message}</span>
                  )}
                </label>
                <label className="field">
                  Плотность, г/м²
                  <input
                    type="number"
                    min="40"
                    max="1000"
                    {...register(`papers.${index}.weight`, { valueAsNumber: true })}
                  />
                  {errors.papers?.[index]?.weight && (
                    <span className="field-error">{errors.papers[index]?.weight?.message}</span>
                  )}
                </label>
                <label className="field">
                  Поверхность
                  <select {...register(`papers.${index}.finish`)}>
                    <option value="smooth">Гладкая</option>
                    <option value="matte">Матовая</option>
                    <option value="textured">Фактурная</option>
                  </select>
                </label>
                <label className="field">
                  Коэффициент цены
                  <input
                    type="number"
                    min="0.01"
                    max="10"
                    step="0.01"
                    {...register(`papers.${index}.multiplier`, { valueAsNumber: true })}
                  />
                  {errors.papers?.[index]?.multiplier && (
                    <span className="field-error">{errors.papers[index]?.multiplier?.message}</span>
                  )}
                </label>
              </div>
              <button
                className="button small secondary"
                type="button"
                disabled={papers.fields.length === 1}
                onClick={() => papers.remove(index)}
              >
                Удалить бумагу
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            className="button secondary"
            disabled={papers.fields.length >= 8}
            onClick={() =>
              papers.append({
                value: `paper-${crypto.randomUUID().slice(0, 8)}`,
                label: 'Матовая',
                finish: 'matte',
                weight: 350,
                multiplier: 1.25,
              })
            }
          >
            Добавить бумагу
          </button>
        </section>
        <section className="panel stack">
          <h2>Печать и тиражи</h2>
          <label className={styles.checkbox}>
            <input type="checkbox" {...register('double_sided')} />
            Доступна двусторонняя печать
          </label>
          <label className="field">
            Коэффициент двусторонней печати
            <input
              type="number"
              min="0.01"
              max="10"
              step="0.01"
              {...register('double_factor', { valueAsNumber: true })}
            />
            {errors.double_factor && (
              <span className="field-error">{errors.double_factor.message}</span>
            )}
          </label>
          <label className="field">
            Доступные тиражи
            <input {...register('quantities')} placeholder="100, 250, 500, 1000" />
            {errors.quantities && <span className="field-error">{errors.quantities.message}</span>}
          </label>
          <ErrorMessage error={mutation.error} />
          <button className="button full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Сохраняем…' : 'Сохранить и открыть товар'}
          </button>
        </section>
      </form>
    </>
  )
}
