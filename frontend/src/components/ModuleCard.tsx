import { crmId, type CrmModule } from '../data/modules'
import { card } from '../styles/ui'
import { Brick } from './Brick'
const STUD_COUNT = 4

type ModuleCardProps = {
  module: CrmModule
  count: number | null | 'error' | undefined
}

function countLabel(module: CrmModule, count: ModuleCardProps['count']): string {
  if (!module.countable) return 'Recibe eventos'
  if (count === null || count === undefined) return 'Contando…'
  if (count === 'error') return 'Sin datos'
  return count === 1 ? '1 registro' : `${count} registros`
}

export function ModuleCard({ module, count }: ModuleCardProps) {
  return (
    <article id={crmId(module.id)} className={card.base}>
      <div aria-hidden="true" className={card.studs}>
        {Array.from({ length: STUD_COUNT }, (_, i) => (
          <span key={i} className={card.stud} />
        ))}
      </div>
      <div className={card.media}>
        <Brick color={module.color} />
      </div>
      <div className={card.body}>
        <h2 className={card.title}>{module.name}</h2>
        <p className={card.text}>{module.description}</p>
        <div className={card.footer}>
          <span className={card.count}>{countLabel(module, count)}</span>
          <code className={card.endpoint}>
            {module.method} {module.endpoint}
          </code>
        </div>
      </div>
    </article>
  )
}
