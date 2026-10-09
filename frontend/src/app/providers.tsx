import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../api/client'
import { logoutSession } from './session'
import type { Specification, User } from '../api/types'

const AuthContext = createContext<{
  user: User | null
  loading: boolean
  error: Error | null
  setUser: (user: User) => void
  logout: () => Promise<void>
} | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient()
  const query = useQuery({
    queryKey: ['session'],
    queryFn: async ({ signal }) => {
      try {
        return await api<User>('/auth/me', { signal })
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    retry: false,
    staleTime: 60_000,
  })
  const logout = () => logoutSession(cache)
  return (
    <AuthContext.Provider
      value={{
        user: query.data ?? null,
        loading: query.isPending,
        error: query.error,
        setUser: (user) => {
          cache.removeQueries({ queryKey: ['orders'] })
          cache.setQueryData(['session'], user)
        },
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is required')
  return value
}

const DraftContext = createContext<{
  spec: Specification | null
  file: File | null
  setSpec: (spec: Specification) => void
  setFile: (file: File | null) => void
  clear: () => void
} | null>(null)

function readDraft(): Specification | null {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem('tirazh-draft') ?? 'null')
    if (!parsed || typeof parsed !== 'object') return null
    const item = parsed as Record<string, unknown>
    if (
      ['product_slug', 'format', 'paper', 'printing'].some(
        (key) => typeof item[key] !== 'string',
      ) ||
      typeof item.quantity !== 'number'
    )
      return null
    return item as unknown as Specification
  } catch {
    return null
  }
}

export function DraftProvider({ children }: { children: ReactNode }) {
  const [spec, updateSpec] = useState<Specification | null>(readDraft)
  const [file, setFile] = useState<File | null>(null)
  const setSpec = (next: Specification) => {
    updateSpec(next)
    try {
      sessionStorage.setItem('tirazh-draft', JSON.stringify(next))
    } catch {
      return
    }
  }
  const clear = () => {
    updateSpec(null)
    setFile(null)
    sessionStorage.removeItem('tirazh-draft')
  }
  return (
    <DraftContext.Provider value={{ spec, file, setSpec, setFile, clear }}>
      {children}
    </DraftContext.Provider>
  )
}

export function useDraft() {
  const value = useContext(DraftContext)
  if (!value) throw new Error('DraftProvider is required')
  return value
}
