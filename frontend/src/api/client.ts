import type { ApiErrorBody } from './types'

/**
 * Base de la API. Se recorta la barra final para que los paths de `endpoints.ts`
 * siempre se unan con una sola `/`, incluso si `VITE_API_URL` termina en `/`.
 */
export const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '')

/** Alias conservado para consumidores existentes (health check y sidebar). */
export const apiUrl = apiBaseUrl

const DEFAULT_TIMEOUT_MS = 10_000

/**
 * Error normalizado: la UI solo necesita `status`, un `message` legible y los
 * `details` de class-validator. Evita exponer errores de red o `DOMException`.
 */
export class ApiError extends Error {
  readonly status: number
  readonly details: string[]

  constructor(status: number, message: string, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type QueryValue = string | number | boolean | null | undefined

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  timeoutMs?: number
}

/** Construye un query string omitiendo valores vacíos o indefinidos. */
export function buildQuery(params: Record<string, QueryValue> = {}): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readError(status: number, body: unknown): ApiError {
  const fallback = `HTTP ${status}`

  if (!isRecord(body)) {
    return new ApiError(status, typeof body === 'string' && body ? body : fallback)
  }

  const raw = body as ApiErrorBody
  const details = [
    ...(Array.isArray(raw.errors) ? raw.errors.map(String) : []),
    ...(Array.isArray(raw.message) ? raw.message.map(String) : []),
  ]

  if (Array.isArray(raw.message) && raw.message.length > 0) {
    return new ApiError(status, raw.message.join('. '), details)
  }

  if (typeof raw.message === 'string' && raw.message.trim()) {
    return new ApiError(status, raw.message, details)
  }

  if (typeof raw.error === 'string' && raw.error.trim()) {
    return new ApiError(status, raw.error, details)
  }

  return new ApiError(status, fallback, details)
}

/** Normaliza cualquier error de red o API a un ApiError utilizable por la UI. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError(0, 'La solicitud tardó demasiado en responder')
  }
  if (error instanceof Error) return new ApiError(0, error.message)
  return new ApiError(0, 'Error de red desconocido')
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  )

  try {
    const hasBody = options.body !== undefined
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      cache: method === 'GET' ? 'no-store' : undefined,
      signal: controller.signal,
    })

    const text = await response.text()
    let body: unknown = null

    if (text) {
      try {
        body = JSON.parse(text) as unknown
      } catch {
        body = text
      }
    }

    if (!response.ok) {
      throw readError(response.status, body)
    }

    return body as T
  } catch (error) {
    throw toApiError(error)
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

/**
 * Envoltorio único de `fetch`: aplica timeout, serializa JSON, descarta la
 * caché en GET y convierte cualquier fallo en `ApiError` antes de llegar a la UI.
 */
export const apiClient = {
  get: <T>(path: string, timeoutMs?: number) => request<T>(path, { method: 'GET', timeoutMs }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
