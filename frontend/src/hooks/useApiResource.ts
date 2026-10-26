import { useCallback, useEffect, useRef, useState } from 'react'
import { toApiError, type ApiError } from '../api/client'

type ResourceState<T> = {
  data: T | null
  loading: boolean
  error: ApiError | null
}

type ResourceOptions = {
  enabled?: boolean
}

/**
 * Carga un recurso y expone sus estados de carga/error.
 * `deps` debe tener un largo constante, igual que las dependencias de useEffect.
 * La función se guarda en un ref para no re-disparar el fetch cuando el
 * componente se vuelve a renderizar con una closure nueva.
 */
export function useApiResource<T>(
  load: () => Promise<T>,
  deps: readonly unknown[] = [],
  options: ResourceOptions = {},
) {
  const enabled = options.enabled ?? true
  const loadRef = useRef(load)
  loadRef.current = load

  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    loading: enabled,
    error: null,
  })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null })
      return
    }

    let active = true
    setState((previous) => ({ ...previous, loading: true, error: null }))

    loadRef
      .current()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (active) setState({ data: null, loading: false, error: toApiError(error) })
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, version, ...deps])

  const reload = useCallback(() => {
    setVersion((current) => current + 1)
  }, [])

  return { ...state, reload }
}

type ActionState<TResult> = {
  pending: boolean
  error: ApiError | null
  data: TResult | null
}

/**
 * Ejecuta una mutación y captura su error sin dejar promesas rechazadas.
 * Devuelve `null` al fallar para que las páginas puedan usar `if (result)` sin
 * `try/catch`; `run` es estable, así que se puede pasar directo a un handler.
 */
export function useApiAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const actionRef = useRef(action)
  actionRef.current = action

  const [state, setState] = useState<ActionState<TResult>>({
    pending: false,
    error: null,
    data: null,
  })

  const run = useCallback(async (...args: TArgs): Promise<TResult | null> => {
    setState({ pending: true, error: null, data: null })

    try {
      const data = await actionRef.current(...args)
      setState({ pending: false, error: null, data })
      return data
    } catch (error) {
      setState({ pending: false, error: toApiError(error), data: null })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ pending: false, error: null, data: null })
  }, [])

  return { ...state, run, reset }
}
