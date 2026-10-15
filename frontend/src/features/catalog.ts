import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Product, Specification } from '../api/types'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api<Product[]>('/products'),
    staleTime: 300_000,
  })
}

export function defaultSpec(product: Product): Specification {
  return {
    product_slug: product.slug,
    format: product.options.format[0].value,
    paper: product.options.paper[0].value,
    printing: (product.options.printing[1] ?? product.options.printing[0]).value,
    quantity: product.options.quantities.includes(500) ? 500 : product.options.quantities[0],
  }
}

export function specificationLabel(
  product: Product | undefined,
  field: 'format' | 'paper' | 'printing',
  value: string,
) {
  const option = product?.options[field].find((option) => option.value === value)
  return option ? `${option.label}${option.hint ? ` · ${option.hint}` : ''}` : value
}
