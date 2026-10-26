import { NavLink } from 'react-router-dom'
import type { Counts } from '../hooks/useCrmApi'
import { crmModules } from '../data/modules'
import { dotColor, panel, sidebar } from '../styles/ui'
import { cx } from '../styles/cx'

/** Accesos rápidos con el conteo de registros calculado por `useCrmApi`. */
export function Sidebar({ counts }: { counts: Counts }) {
  return (
    <aside className={cx(panel.base, sidebar.root)}>
      <nav aria-label="Accesos rápidos">
        <ul className={sidebar.list}>
          {crmModules.map((module) => {
            const count = counts[module.id]
            return (
              <li key={module.id}>
                <NavLink
                  to={module.path}
                  className={({ isActive }) => cx(sidebar.item, isActive && 'bg-white/80')}
                >
                  <span aria-hidden="true" className={cx(sidebar.dot, dotColor[module.color])} />
                  <span className={sidebar.label}>{module.name}</span>
                  {typeof count === 'number' && <span className={sidebar.count}>{count}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
