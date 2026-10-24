import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Order, Product } from '../api/types'
import { useAuth } from '../app/providers'
import { PrintPreview } from '../components/preview/PrintPreview'
import { ErrorMessage, Loading } from '../components/ui/Feedback'

export function OrderArtwork({ order, product }: { order: Order; product: Product }) {
  const { user } = useAuth()
  const [selected, setSelected] = useState<string | null>(null)
  const artwork = order.files.find((file) => file.id === selected) ?? order.files.at(-1)
  const query = useQuery({
    queryKey: ['artwork', user?.id, artwork?.id],
    enabled: !!artwork,
    staleTime: Infinity,
    queryFn: async () => {
      if (!artwork) throw new Error('Макет не выбран')
      const response = await fetch(`/api/files/${encodeURIComponent(artwork.id)}`, {
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('Не удалось загрузить макет. Попробуйте обновить страницу.')
      const blob = await response.blob()
      return new File([blob], artwork.name, { type: blob.type })
    },
  })
  if (!artwork) return null
  return (
    <div className="stack">
      <label className="field">
        Версия для просмотра
        <select value={artwork.id} onChange={(event) => setSelected(event.target.value)}>
          {order.files.map((file, index) => (
            <option key={file.id} value={file.id}>
              Версия {index + 1}: {file.name}
            </option>
          ))}
        </select>
      </label>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <ErrorMessage error={query.error} />
      ) : (
        <PrintPreview
          product={product}
          spec={{ ...order.specification, product_slug: product.slug }}
          file={query.data}
        />
      )}
    </div>
  )
}
