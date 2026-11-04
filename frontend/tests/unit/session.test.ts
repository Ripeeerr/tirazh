import { afterEach, expect, spyOn, test } from 'bun:test'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { logoutSession } from '../../src/app/session'

const clients: QueryClient[] = []
let restore = () => {}
afterEach(() => {
  restore()
  for (const client of clients.splice(0)) client.clear()
})

test('logout updates the active session observer and removes private cached data', async () => {
  const cache = new QueryClient()
  clients.push(cache)
  const user = { id: 'first-user', name: 'Первый' }
  cache.setQueryData(['session'], user)
  cache.setQueryData(['orders', user.id], [{ id: 'private-order' }])
  cache.setQueryData(['artwork', user.id], 'private-file')
  cache.setQueryData(['products'], [{ slug: 'business-cards' }])
  const observer = new QueryObserver(cache, {
    queryKey: ['session'],
    queryFn: async () => user,
    staleTime: Infinity,
  })
  const unsubscribe = observer.subscribe(() => {})
  const fetch = spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
  restore = () => fetch.mockRestore()
  try {
    await logoutSession(cache)
    expect(observer.getCurrentResult().data).toBeNull()
    expect(cache.getQueryData(['session'])).toBeNull()
    expect(cache.getQueryData(['orders', user.id])).toBeUndefined()
    expect(cache.getQueryData(['artwork', user.id])).toBeUndefined()
    expect(cache.getQueryData(['products'])).toEqual([{ slug: 'business-cards' }])
  } finally {
    unsubscribe()
    observer.destroy()
  }
})

test('failed server logout preserves the authenticated state', async () => {
  const cache = new QueryClient()
  clients.push(cache)
  const user = { id: 'first-user' }
  cache.setQueryData(['session'], user)
  const fetch = spyOn(globalThis, 'fetch').mockResolvedValue(
    Response.json({ detail: 'Сервис временно недоступен' }, { status: 503 }),
  )
  restore = () => fetch.mockRestore()
  await expect(logoutSession(cache)).rejects.toThrow('Сервис временно недоступен')
  expect(cache.getQueryData(['session'])).toEqual(user)
})

test('an old session refresh cannot restore the user after logout', async () => {
  const cache = new QueryClient()
  clients.push(cache)
  const user = { id: 'first-user' }
  cache.setQueryData(['session'], user)
  const observer = new QueryObserver(cache, {
    queryKey: ['session'],
    queryFn: async () => user,
    staleTime: Infinity,
  })
  const unsubscribe = observer.subscribe(() => {})
  let finish!: (value: typeof user) => void
  const pending = new Promise<typeof user>((resolve) => {
    finish = resolve
  })
  const refresh = cache
    .fetchQuery({ queryKey: ['session'], queryFn: () => pending, staleTime: 0 })
    .catch(() => undefined)
  const fetch = spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
  restore = () => fetch.mockRestore()
  try {
    await logoutSession(cache)
    finish(user)
    await refresh
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(cache.getQueryData(['session'])).toBeNull()
    expect(observer.getCurrentResult().data).toBeNull()
  } finally {
    unsubscribe()
    observer.destroy()
  }
})
