import { Link, NavLink } from 'react-router-dom'
import { crmModules } from '../data/modules'
import { header } from '../styles/ui'
import { cx } from '../styles/cx'
import { ApiCheckDialog } from './ApiCheckDialog'

const STUD_COUNT = 40

/** Navegación superior con `NavLink` para que la ruta activa se marque sola. */
export function Header() {
  return (
    <header className={header.bar}>
      <div className={header.inner}>
        <Link to="/" className={header.logo}>
          LesGo<span className={header.logoTag}>CRM</span>
        </Link>

        <nav aria-label="Módulos del CRM" className={header.nav}>
          {crmModules.map((module) => (
            <NavLink
              key={module.id}
              to={module.path}
              className={({ isActive }) => cx(header.navLink, isActive && 'bg-white/15 text-stud')}
            >
              {module.name}
            </NavLink>
          ))}
        </nav>

        <div className={header.actions}>
          <ApiCheckDialog />
        </div>
      </div>

      <div aria-hidden="true" className={header.studs}>
        {Array.from({ length: STUD_COUNT }, (_, i) => (
          <span key={i} className={header.stud} />
        ))}
      </div>
    </header>
  )
}
