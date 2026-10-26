import type { ReactNode } from 'react'
import { page } from '../../styles/ui'
import { cx } from '../../styles/cx'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

/** Cabecera común de página: título, descripción y acciones alineadas. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <section className={page.header}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className={page.title}>{title}</h1>
          {description && <p className={page.description}>{description}</p>}
        </div>
        {actions && <div className={cx(page.actions, 'sm:shrink-0')}>{actions}</div>}
      </div>
    </section>
  )
}
