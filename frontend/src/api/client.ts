export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (typeof options.body === 'string') headers.set('Content-Type', 'application/json')
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError(
      0,
      'Не удалось связаться с сервером. Проверьте подключение и повторите попытку.',
    )
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const validation = Array.isArray(body?.detail)
      ? body.detail.find(
          (issue: { msg?: unknown }) =>
            typeof issue.msg === 'string' && issue.msg.startsWith('Value error, '),
        )
      : null
    const message =
      typeof body?.detail === 'string'
        ? body.detail
        : validation
        ? validation.msg.replace('Value error, ', '')
        : 'Не удалось выполнить запрос. Проверьте введённые данные.'
    throw new ApiError(response.status, message)
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>)
}

export function uploadFile(file: File) {
  return api<import('./types').Artwork>('/files', {
    method: 'POST',
    body: file,
    headers: {
      'X-Filename': encodeURIComponent(file.name),
      'Content-Type': 'application/octet-stream',
    },
  })
}

export const money = (value: number, fractionDigits = 0) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
export const date = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
