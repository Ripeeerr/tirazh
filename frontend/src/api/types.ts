import type { components } from './schema'

export type User = components['schemas']['UserOut']
export type ProductOption = components['schemas']['ProductOption']
export type Product = components['schemas']['ProductOut']
export type Specification = components['schemas']['Specification']
export type Quote = components['schemas']['QuoteOut']
export type Artwork = components['schemas']['ArtworkOut']
export type OrderSummary = components['schemas']['OrderSummary']
export type Order = components['schemas']['OrderOut']
export type OrderStatus = Order['status']
