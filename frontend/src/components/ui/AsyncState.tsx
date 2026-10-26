import type { ReactNode } from 'react'
import type { ApiError } from '../../api/client'
import { button, feedback, text } from '../../styles/ui'
import { cx } from '../../styles/cx'

/** Indicador de carga accesible (`aria-live`) reutilizado en todas las pantallas. */
export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className={cx(text.empty, 'flex items-center justify-center gap-3')} aria-live="polite">
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-panel-strong border-t-brick"
      />
      <span>{label}</span>
    </div>
  )
}

/** Muestra el error normalizado y ofrece reintentar la misma carga. */
export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div className={feedback.error} role="alert">
      <p className="font-display font-semibold">No se pudo cargar la información</p>
      <p className="mt-1">{error.message}</p>
      {error.details.length > 0 && (
        <ul className={feedback.list}>
          {error.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
      {onRetry && (
        <button type="button" onClick={onRetry} className={cx(button.secondary, 'mt-3 flex-none')}>
          Reintentar
        </button>
      )}
    </div>
  )
}

/** Mensaje vacío con contenido opcional (p. ej. un botón para limpiar filtros). */
export function EmptyState({
  message,
  children,
}: {
  message: string
  children?: ReactNode
}) {
  return (
    <div className={text.empty}>
      <p>{message}</p>
      {children}
    </div>
  )
}

/** Error de una mutación, sin botón de reintento (el usuario decide cuándo repetir). */
export function ApiErrorMessage({ error }: { error: ApiError | null }) {
  if (!error) return null
  return (
    <div className={feedback.error} role="alert">
      <p className="font-display font-semibold">{error.message}</p>
      {error.details.length > 0 && (
        <ul className={feedback.list}>
          {error.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
