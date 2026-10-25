import { crmHref, crmModules } from '../data/modules'
import { header } from '../styles/ui'
import { ApiCheckDialog } from './ApiCheckDialog'

const STUD_COUNT = 40

export function Header() {
  return (
    <header className={header.bar}>
      <div className={header.inner}>
        <a href={crmHref('inicio')} className={header.logo}>
          LesGo<span className={header.logoTag}>CRM</span>
        </a>

        <nav aria-label="Módulos del CRM" className={header.nav}>
          {crmModules.map((module) => (
            <a key={module.id} href={crmHref(module.id)} className={header.navLink}>
              {module.name}
            </a>
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
