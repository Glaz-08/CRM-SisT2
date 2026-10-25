import { useEffect, useState } from 'react'
import { crmModules } from '../data/modules'

export const apiUrl = import.meta.env.VITE_API_URL ?? '/api'

/** Cantidad de registros por módulo: número, null (cargando) o 'error'. */
export type Counts = Record<string, number | null | 'error'>

export type HealthResult =
  | { status: 'ok'; ms: number }
  | { status: 'error'; reason: 'http' | 'timeout' | 'network'; detail: string }

const HEALTH_TIMEOUT_MS = 5000

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json() as Promise<T>
}

/**
 * Consulta GET /api/health y traduce la respuesta a un resultado simple.
 * Nunca lanza errores: siempre devuelve 'ok' o 'error' con el motivo.
 */
export async function checkHealth(): Promise<HealthResult> {
  const start = performance.now()
  try {
    const response = await fetch(`${apiUrl}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    })
    if (!response.ok) {
      return { status: 'error', reason: 'http', detail: `HTTP ${response.status}` }
    }
    const data = (await response.json()) as { status?: string }
    if (data.status !== 'ok') {
      return { status: 'error', reason: 'http', detail: `status: ${String(data.status)}` }
    }
    return { status: 'ok', ms: Math.round(performance.now() - start) }
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === 'TimeoutError') {
      return { status: 'error', reason: 'timeout', detail: `Sin respuesta en ${HEALTH_TIMEOUT_MS / 1000} s` }
    }
    return { status: 'error', reason: 'network', detail: reason instanceof Error ? reason.message : 'Error de red' }
  }
}

/**
 * Cuenta los registros de cada módulo con sus endpoints GET.
 * Solo lee datos: no modifica nada del ERP.
 */
export function useCrmApi() {
  const [counts, setCounts] = useState<Counts>(() =>
    Object.fromEntries(crmModules.filter((m) => m.countable).map((m) => [m.id, null])),
  )

  useEffect(() => {
    let active = true

    for (const module of crmModules.filter((m) => m.countable)) {
      getJson<unknown[]>(module.endpoint)
        .then((rows) => active && setCounts((prev) => ({ ...prev, [module.id]: rows.length })))
        .catch(() => active && setCounts((prev) => ({ ...prev, [module.id]: 'error' })))
    }

    return () => {
      active = false
    }
  }, [])

  return { counts }
}
