import type { CSSProperties } from 'react'
import type { Product, Specification } from '../../api/types'
import styles from './PrintPreview.module.css'
import { usePreviewViewport } from '../../features/usePreviewViewport'
import { MIN_ZOOM, MAX_ZOOM } from '../../lib/previewViewport'
import { useArtworkPreview } from '../../features/useArtworkPreview'

const views = ['Общий вид', 'Крупный план', 'Фактура бумаги']
const presetZooms = [1, 1.8, 3.2]

const sampleTitles: Record<string, string> = {
  'business-cards': 'Хорошее знакомство',
  booklets: 'Истории на бумаге',
  postcards: 'Ближе, чем слова',
  posters: 'Есть повод',
  invitations: 'Увидимся скоро',
}

export function PrintArtwork({ product }: { product: Pick<Product, 'slug' | 'title'> }) {
  return (
    <div className={styles.artwork} data-product={product.slug}>
      {product.slug === 'flyers' ? (
        <img
          className={styles.botanical}
          src="/images/night-studio/botanical.webp"
          alt=""
          draggable={false}
          loading="lazy"
          width="1024"
          height="1536"
        />
      ) : (
        <>
          <span className={styles.edition}>Студия печати / тираж.</span>
          <strong>{sampleTitles[product.slug] ?? product.title}</strong>
          <span className={styles.rule} />
          <div className={styles.signature}>
            <span>Бумага имеет значение</span>
            <b>тираж.</b>
          </div>
        </>
      )}
    </div>
  )
}

export function PrintPreview({
  product,
  spec,
  file = null,
}: {
  product: Product
  spec: Specification
  file?: File | null
}) {
  const viewport = usePreviewViewport()
  const { view } = viewport
  const activeView = presetZooms.indexOf(view.zoom)
  const preview = useArtworkPreview(file)
  const format = product.options.format.find((option) => option.value === spec.format)
  const paper = product.options.paper.find((option) => option.value === spec.paper)
  const dimensions = format?.hint.match(/(\d+)\s*×\s*(\d+)/)
  const ratio = dimensions ? Number(dimensions[1]) / Number(dimensions[2]) : 1
  const longestSide = Math.max(
    ...product.options.format.map((option) => {
      const match = option.hint.match(/(\d+)\s*×\s*(\d+)/)
      return match ? Math.max(Number(match[1]), Number(match[2])) : 1
    }),
  )
  const width = dimensions ? (Number(dimensions[1]) / longestSide) * 74 : 60
  const customImage = preview?.url
  const style = {
    '--paper-ratio': ratio,
    '--paper-width': `${width}%`,
    '--zoom': view.zoom,
    '--pan-x': `${view.x}px`,
    '--pan-y': `${view.y}px`,
  } as CSSProperties
  return (
    <div className={styles.preview}>
      <div
        ref={viewport.frameRef}
        className={styles.stage}
        role="group"
        aria-label="Предпросмотр макета"
        tabIndex={0}
        {...viewport.handlers}
        onDragStart={(event) => event.preventDefault()}
        data-interacting={viewport.interacting}
        data-zoom={view.zoom}
        data-pan-x={view.x}
        data-pan-y={view.y}
        style={style}
        data-testid="print-preview"
        data-view={activeView}
        data-format={spec.format}
        data-paper={spec.paper}
      >
        <div
          ref={viewport.cameraRef}
          className={styles.camera}
          data-animated={view.animated}
          data-testid="preview-camera"
        >
          <div
            ref={viewport.sheetRef}
            data-testid="preview-sheet"
            className={styles.sheet}
            data-paper={paper?.finish ?? spec.paper}
            data-folded={product.slug === 'booklets'}
          >
            {customImage ? (
              <img src={customImage} alt="Предпросмотр вашего макета" draggable={false} />
            ) : (
              <PrintArtwork product={product} />
            )}
            <div className={styles.grain} aria-hidden="true" />
          </div>
        </div>
        <span className={styles.stageLabel}>
          {preview?.loading
            ? 'Готовим предпросмотр…'
            : customImage
            ? 'Ваш макет'
            : 'Пример оформления'}
        </span>
        <span className={styles.dimensions}>{format?.hint}</span>
      </div>
      <div className={styles.controls} role="group" aria-label="Масштаб предпросмотра">
        {views.map((label, index) => (
          <button
            type="button"
            key={label}
            aria-pressed={activeView === index}
            onClick={() => viewport.preset(presetZooms[index])}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.manualControls} role="group" aria-label="Ручное управление масштабом">
        <button
          type="button"
          onClick={() => viewport.setZoom(view.zoom - 0.2, true)}
          disabled={view.zoom <= MIN_ZOOM}
        >
          Отдалить
        </button>
        <input
          type="range"
          aria-label="Масштаб макета"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step="0.01"
          value={view.zoom}
          onChange={(event) => viewport.setZoom(event.target.valueAsNumber)}
        />
        <button
          type="button"
          onClick={() => viewport.setZoom(view.zoom + 0.2, true)}
          disabled={view.zoom >= MAX_ZOOM}
        >
          Приблизить
        </button>
      </div>
      <details className={styles.panControls}>
        <summary>Переместить макет</summary>
        <div role="group" aria-label="Перемещение макета">
          <button
            type="button"
            disabled={view.zoom <= MIN_ZOOM}
            onClick={() => viewport.panBy(-48, 0)}
          >
            Влево
          </button>
          <button
            type="button"
            disabled={view.zoom <= MIN_ZOOM}
            onClick={() => viewport.panBy(48, 0)}
          >
            Вправо
          </button>
          <button
            type="button"
            disabled={view.zoom <= MIN_ZOOM}
            onClick={() => viewport.panBy(0, -48)}
          >
            Вверх
          </button>
          <button
            type="button"
            disabled={view.zoom <= MIN_ZOOM}
            onClick={() => viewport.panBy(0, 48)}
          >
            Вниз
          </button>
        </div>
      </details>
      <p className={styles.gestureHint}>
        Колёсико или два пальца — масштаб. Перетаскивание — перемещение. «Общий вид» возвращает
        карточку в центр.
      </p>
      <div className={styles.caption} aria-live="polite">
        <span>
          {paper?.label} · {paper?.hint}
        </span>
        <span>
          {new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2,
          }).format(view.zoom)}
          ×
        </span>
      </div>
      {preview?.error && (
        <p className="field-error" role="alert">
          {preview.error}
        </p>
      )}
      <p className={styles.disclaimer}>
        {preview?.pages ? `Первая страница PDF (${preview.pages} стр.). ` : ''}
        Примерная визуализация. Фактура и цвет бумаги на экране могут отличаться от готовой печати.
      </p>
    </div>
  )
}
