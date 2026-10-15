import { useState } from 'react'
import { Link } from 'react-router-dom'
import { money } from '../api/client'
import { useProducts } from '../features/catalog'
import { ErrorMessage, Loading } from '../components/ui/Feedback'
import { PrintArtwork } from '../components/preview/PrintPreview'
import styles from './Catalog.module.css'

export function PrintSteps() {
  const steps = [
    {
      title: 'Настройте тираж',
      body: 'Выберите формат, бумагу и количество. Стоимость рассчитается сразу.',
    },
    {
      title: 'Загрузите макет',
      body: 'Посмотрите, как он выглядит на бумаге. Перед печатью файл проверит менеджер.',
    },
    {
      title: 'Следите за заказом',
      body: 'Обсуждение, исправления и готовность тиража — в личном кабинете.',
    },
  ]
  return (
    <section className={styles.steps} id="process" tabIndex={-1} aria-labelledby="process-heading">
      <div className={styles.stepsHeading}>
        <span className="eyebrow">От файла до бумаги</span>
        <h2 id="process-heading" tabIndex={-1}>
          Печать начинается
          <br />с трёх шагов
        </h2>
      </div>
      <ol className={styles.stepList}>
        {steps.map(({ title, body }, index) => (
          <li key={title} className={styles.step}>
            <span className={styles.stepNumber}>0{index + 1}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ProductIndex() {
  const products = useProducts()
  return (
    <nav className={styles.productIndex} aria-label="Печатная продукция">
      {products.data?.slice(0, 6).map((product) => (
        <Link key={product.slug} to={'/catalog/' + product.slug}>
          {product.title}
        </Link>
      ))}
    </nav>
  )
}

export function ProductCards({ limit }: { limit?: number }) {
  const query = useProducts()
  const [category, setCategory] = useState('all')
  if (query.isPending) return <Loading />
  if (query.error) return <ErrorMessage error={query.error} />
  const categories = [
    { id: 'all', label: 'Вся продукция' },
    { id: 'business', label: 'Для бизнеса' },
    { id: 'events', label: 'Для событий' },
  ]
  const products =
    query.data?.filter(
      (product) =>
        category === 'all' ||
        (category === 'events'
          ? ['postcards', 'invitations'].includes(product.slug)
          : !['postcards', 'invitations'].includes(product.slug)),
    ) ?? []
  return (
    <>
      {!limit && (
        <div className={styles.categories} role="group" aria-label="Категории продукции">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div className={styles.cards}>
        {products.slice(0, limit ?? products.length).map((product) => (
          <Link key={product.slug} to={'/catalog/' + product.slug} className={styles.card}>
            <div className={styles.cardImage} data-product={product.slug}>
              <div className={styles.sample}>
                <PrintArtwork product={product} />
              </div>
              <span className={styles.cardTag}>
                От {Math.min(...product.options.quantities).toLocaleString('ru-RU')} шт.
              </span>
            </div>
            <div className={styles.cardInfo}>
              <h2>{product.title}</h2>
              <span>От {money(product.base_price)} / шт.</span>
            </div>
            <p className={styles.description}>{product.description}</p>
            <div className={styles.cardBottom}>
              <span>{product.options.format.map((format) => format.label).join(' / ')}</span>
              <span>Настроить тираж</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

export function HomePage() {
  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-heading">
        <img
          className={styles.heroImage}
          src="/images/night-studio/hero.webp"
          alt="Фактурная бумага, стопка визиток и жёлтые постеры в студии печати"
          fetchPriority="high"
          width="1774"
          height="887"
        />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1 id="hero-heading">
              Печатать —<br />
              значит оставлять
              <br />
              след
            </h1>
            <p>
              Полиграфия для вашего дела.
              <br />
              Выберите бумагу. Загрузите идею. Получите тираж.
            </p>
            <div className={styles.heroActions}>
              <Link to="/catalog" className={styles.heroPrimary}>
                Выбрать продукцию
              </Link>
              <Link to="/#process" className={styles.heroSecondary}>
                Как это работает
              </Link>
            </div>
          </div>
        </div>
      </section>
      <ProductIndex />
      <div className={styles.homeContent}>
        <section className={styles.catalogSection} aria-labelledby="catalog-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Бумага принимает форму</span>
              <h2 id="catalog-heading">Что напечатаем?</h2>
            </div>
            <Link to="/catalog" className="text-link">
              Весь каталог
            </Link>
          </div>
          <ProductCards limit={6} />
        </section>
        <PrintSteps />
        <section className={styles.manifest}>
          <div className={styles.manifestVisual} aria-hidden="true">
            <div>
              <PrintArtwork product={{ slug: 'flyers', title: 'Листовки' }} />
            </div>
          </div>
          <div className={styles.manifestCopy}>
            <span className="eyebrow">Прежде чем нажать «Печатать»</span>
            <h2>
              Рассмотрите
              <br />
              каждую деталь
            </h2>
            <p>
              Загрузите свой макет, приблизьте текст и проверьте композицию. Меняйте формат и бумагу
              — предпросмотр подстроится под ваш выбор.
            </p>
            <Link to="/catalog/flyers" className="button secondary">
              Попробовать на листовках
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}

export function CatalogPage() {
  return (
    <>
      <div className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span>/</span>
        <span>Продукция</span>
      </div>
      <header className={styles.catalogIntro}>
        <div>
          <span className="eyebrow">Каталог студии</span>
          <h1>
            От визитки
            <br />
            до большого повода
          </h1>
        </div>
        <p>
          Для первого знакомства, новой коллекции или важного события. Выберите продукцию — дальше
          настроим формат, бумагу и тираж.
        </p>
      </header>
      <ProductCards />
      <PrintSteps />
    </>
  )
}
