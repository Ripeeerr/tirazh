import type { QueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export async function logoutSession(cache: QueryClient) {
  await api('/auth/logout', { method: 'POST' })
  await Promise.all([
    cache.cancelQueries({ queryKey: ['session'] }),
    cache.cancelQueries({ queryKey: ['orders'] }),
    cache.cancelQueries({ queryKey: ['artwork'] }),
  ])
  cache.setQueryData(['session'], null)
  cache.removeQueries({ queryKey: ['orders'] })
  cache.removeQueries({ queryKey: ['artwork'] })
}
