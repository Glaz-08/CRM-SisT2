import { formatDateTime } from '../api/date'
import { endpoints } from '../api/endpoints'
import { ErrorState, LoadingState } from '../components/ui/AsyncState'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { useApiResource } from '../hooks/useApiResource'
import { feedback, stat } from '../styles/ui'
import { cx } from '../styles/cx'

type BarItem = {
  label: string
  value: number
}

function BarList({ items, emptyMessage }: { items: BarItem[]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p className={feedback.info}>{emptyMessage}</p>
  }

  const max = Math.max(1, ...items.map((item) => item.value))

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="font-display font-semibold tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-panel">
            <div
              className="h-full rounded-full bg-brick"
              style={{ width: `${Math.max(3, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Reportes: métricas de seguimientos, tiempos y canales. */
export function ReportesPage() {
  const reporte = useApiResource(() => endpoints.reportes.resumen(), [])

  if (reporte.loading) {
    return (
      <>
        <PageHeader title="Reportes" description="Métricas operativas del CRM." />
        <LoadingState label="Calculando métricas…" />
      </>
    )
  }

  if (reporte.error) {
    return (
      <>
        <PageHeader title="Reportes" description="Métricas operativas del CRM." />
        <ErrorState error={reporte.error} onRetry={reporte.reload} />
      </>
    )
  }

  const data = reporte.data
  if (!data) {
    return (
      <>
        <PageHeader title="Reportes" description="Métricas operativas del CRM." />
        <p className={feedback.info}>La API no devolvió un resumen.</p>
      </>
    )
  }

  const totalSeguimientos = data.seguimientosPorEstado.reduce((sum, row) => sum + row.total, 0)
  const totalAbiertos = data.casosAbiertosPorEmpleado.reduce((sum, row) => sum + row.abiertos, 0)
  const totalInteracciones = data.interaccionesPorCanal.reduce((sum, row) => sum + row.total, 0)

  return (
    <>
      <PageHeader
        title="Reportes"
        description={`Resumen generado el ${formatDateTime(data.generadoEn)}. El tiempo de respuesta es planificado, no real.`}
        actions={
          <button type="button" onClick={reporte.reload} className="inline-flex items-center justify-center rounded-xl bg-brick-dark px-5 py-2.5 font-display font-semibold text-white outline-none transition-colors hover:bg-ink focus-visible:ring-2 focus-visible:ring-stud">
            Actualizar
          </button>
        }
      />

      <div className={stat.grid}>
        <div className={stat.card}>
          <span className={stat.label}>Seguimientos</span>
          <span className={stat.value}>{totalSeguimientos}</span>
          <span className={stat.detail}>Total registrado en todos los estados</span>
        </div>
        <div className={stat.card}>
          <span className={stat.label}>Completados</span>
          <span className={stat.value}>{data.seguimientosCompletados}</span>
          <span className={stat.detail}>Con medición de tiempo disponible</span>
        </div>
        <div className={stat.card}>
          <span className={stat.label}>Tiempo promedio</span>
          <span className={stat.value}>
            {data.tiempoRespuestaPromedioDias === null ? '—' : `${data.tiempoRespuestaPromedioDias} d`}
          </span>
          <span className={stat.detail}>Días planificados entre interacción y seguimiento</span>
        </div>
        <div className={stat.card}>
          <span className={stat.label}>Casos abiertos</span>
          <span className={stat.value}>{totalAbiertos}</span>
          <span className={stat.detail}>Pendientes o en proceso</span>
        </div>
        <div className={stat.card}>
          <span className={stat.label}>Interacciones</span>
          <span className={stat.value}>{totalInteracciones}</span>
          <span className={stat.detail}>Contactos agrupados por canal</span>
        </div>
        <div className={stat.card}>
          <span className={stat.label}>Empleados con casos</span>
          <span className={stat.value}>{data.casosAbiertosPorEmpleado.length}</span>
          <span className={stat.detail}>Responsables con seguimientos abiertos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Seguimientos por estado">
          <BarList
            items={data.seguimientosPorEstado.map((row) => ({ label: row.estado, value: row.total }))}
            emptyMessage="Todavía no hay seguimientos registrados."
          />
        </Panel>

        <Panel title="Interacciones por canal">
          <BarList
            items={data.interaccionesPorCanal.map((row) => ({ label: row.canal, value: row.total }))}
            emptyMessage="Todavía no hay interacciones registradas."
          />
        </Panel>

        <Panel title="Casos abiertos por empleado" className="lg:col-span-2">
          <BarList
            items={data.casosAbiertosPorEmpleado.map((row) => ({
              label: `Empleado #${row.idEmpleado}`,
              value: row.abiertos,
            }))}
            emptyMessage="No hay casos abiertos."
          />
        </Panel>
      </div>

      <p className={cx(feedback.info, 'text-xs')}>
        El esquema no tiene `fecha_completado`; por eso el tiempo promedio usa `fecha_programada - fecha`
        de los seguimientos completados.
      </p>
    </>
  )
}
