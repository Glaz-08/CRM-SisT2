import type { ReactNode } from 'react'
import { panel } from '../../styles/ui'
import { cx } from '../../styles/cx'

type PanelProps = {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** Sección con título/acciones; agrupa una tarea y mantiene el ritmo visual. */
export function Panel({ title, description, actions, children, className }: PanelProps) {
  return (
    <section className={cx(panel.base, 'flex flex-col gap-4', className)}>
      {(title || description || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {title && <h2 className={panel.title}>{title}</h2>}
            {description && <p className="text-sm leading-relaxed text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
