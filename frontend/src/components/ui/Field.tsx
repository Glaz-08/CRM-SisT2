import type { ReactNode } from 'react'
import { form } from '../../styles/ui'
import { cx } from '../../styles/cx'

type FieldProps = {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}

/** Etiqueta, control, ayuda y error en un mismo bloque para mantener el espaciado del formulario. */
export function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
  return (
    <div className={cx(form.field, className)}>
      <label htmlFor={htmlFor} className={form.label}>
        {label}
      </label>
      {children}
      {hint && !error && <p className={form.hint}>{hint}</p>}
      {error && <p className={form.error}>{error}</p>}
    </div>
  )
}
