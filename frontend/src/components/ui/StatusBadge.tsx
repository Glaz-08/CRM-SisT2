import type { EstadoSeguimiento } from '../../api/types'
import { badge } from '../../styles/ui'
import { cx } from '../../styles/cx'

const LABELS: Record<EstadoSeguimiento, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

/** Badge con el color y la etiqueta en español de cada estado de seguimiento. */
export function StatusBadge({ estado }: { estado: EstadoSeguimiento }) {
  return (
    <span className={cx(badge.base, badge[estado])}>
      {LABELS[estado] ?? estado}
    </span>
  )
}
