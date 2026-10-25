import type { Counts } from '../hooks/useCrmApi'
import { crmHref, crmModules } from '../data/modules'
import { dotColor, panel, sidebar } from '../styles/ui'
import { cx } from '../styles/cx'

export function Sidebar({ counts }: { counts: Counts }) {
  return (
    <aside className={cx(panel.base, sidebar.root)}>
      <nav aria-label="Accesos rápidos">
        <ul className={sidebar.list}>
          {crmModules.map((module) => {
            const count = counts[module.id]
            return (
              <li key={module.id}>
                <a href={crmHref(module.id)} className={sidebar.item}>
                  <span aria-hidden="true" className={cx(sidebar.dot, dotColor[module.color])} />
                  <span className={sidebar.label}>{module.name}</span>
                  {typeof count === 'number' && <span className={sidebar.count}>{count}</span>}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
