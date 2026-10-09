const fallback = '/account/orders'
const origin = 'https://tirazh.invalid'

export function safeReturnPath(requested: string | null): string {
  if (!requested?.startsWith('/') || /[\\\u0000-\u001f\u007f]/.test(requested)) return fallback
  try {
    const destination = new URL(requested, origin)
    if (destination.origin !== origin) return fallback
    return destination.pathname + destination.search + destination.hash
  } catch {
    return fallback
  }
}
