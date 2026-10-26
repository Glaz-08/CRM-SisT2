import { useEffect, useState } from 'react'
import { apiBaseUrl, apiClient, toApiError } from '../api/client'
import { crmModules } from '../data/modules'

export const apiUrl = apiBaseUrl

/** Cantidad de registros por módulo: número, null (cargando) o 'error'. */
export type Counts = Record<string, number | null | 'error'>

export type HealthResult =
  | { status: 'ok'; ms: number }
  | { status: 'error'; reason: 'http' | 'timeout' | 'network'; detail: string }

const HEALTH_TIMEOUT_MS = 5000

/**
 * Consulta GET /api/health y traduce la respuesta a un resultado simple.
 * Nunca lanza errores: siempre devuelve 'ok' o 'error' con el motivo.
 */
export async function checkHealth(): Promise<HealthResult> {
  const start = performance.now()
  try {
    const data = await apiClient.get<{ status?: string }>('/health', HEALTH_TIMEOUT_MS)
    if (data.status !== 'ok') {
      return { status: 'error', reason: 'http', detail: `status: ${String(data.status)}` }
    }
    return { status: 'ok', ms: Math.round(performance.now() - start) }
  } catch (error) {
    const apiError = toApiError(error)
    if (apiError.status === 0 && apiError.message.toLowerCase().includes('tardó')) {
      return { status: 'error', reason: 'timeout', detail: `Sin respuesta en ${HEALTH_TIMEOUT_MS / 1000} s` }
    }
    if (apiError.status > 0) {
      return { status: 'error', reason: 'http', detail: `HTTP ${apiError.status}` }
    }
    return { status: 'error', reason: 'network', detail: apiError.message }
  }
}

/**
 * Cuenta los registros de cada módulo con sus endpoints GET.
 * Solo lee datos: no modifica nada del ERP.
 */
export function useCrmApi() {
  const [counts, setCounts] = useState<Counts>(() =>
    Object.fromEntries(crmModules.filter((module) => module.countable).map((module) => [module.id, null])),
  )

  useEffect(() => {
    let active = true

    for (const module of crmModules.filter((item) => item.countable)) {
      apiClient
        .get<unknown[]>(module.endpoint)
        .then((rows) => active && setCounts((previous) => ({ ...previous, [module.id]: rows.length })))
        .catch(() => active && setCounts((previous) => ({ ...previous, [module.id]: 'error' })))
    }

    return () => {
      active = false
    }
  }, [])

  return { counts }
}
