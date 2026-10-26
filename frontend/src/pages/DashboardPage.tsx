import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { ApiError } from '../api/client'
import { endpoints } from '../api/endpoints'
import { ModuleCard } from '../components/ModuleCard'
import { SearchBar } from '../components/SearchBar'
import { ErrorState, LoadingState } from '../components/ui/AsyncState'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { crmModules } from '../data/modules'
import { useApiResource } from '../hooks/useApiResource'
import type { Counts } from '../hooks/useCrmApi'
import { badge, button, card, text } from '../styles/ui'
import { cx } from '../styles/cx'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

type HealthCardProps = {
  title: string
  endpoint: string
  loading: boolean
  error: ApiError | null
  status: string | null
  detail: string | null
  onRetry: () => void
}

function HealthCard({ title, endpoint, loading, error, status, detail, onRetry }: HealthCardProps) {
  return (
    <Panel title={title} description={endpoint}>
      {loading && <LoadingState label="Consultando…" />}
      {!loading && error && <ErrorState error={error} onRetry={onRetry} />}
      {!loading && !error && (
        <div className="flex flex-col gap-2">
          <span className={cx(badge.base, status === 'ok' ? badge.completado : badge.cancelado)}>
            {status === 'ok' ? 'Operativo' : 'Con problemas'}
          </span>
          {detail && <p className="text-sm text-muted">{detail}</p>}
          <button type="button" onClick={onRetry} className={cx(button.secondary, 'flex-none self-start')}>
            Volver a probar
          </button>
        </div>
      )}
    </Panel>
  )
}

/** Panel inicial: salud de la API, base de datos y acceso a cada módulo. */
export function DashboardPage() {
  const { counts } = useOutletContext<{ counts: Counts }>()
  const [query, setQuery] = useState('')
  const health = useApiResource(() => endpoints.health.check(), [])
  const database = useApiResource(() => endpoints.health.db(), [])

  const visibleModules = useMemo(() => {
    const search = normalize(query)
    if (!search) return crmModules
    return crmModules.filter((module) =>
      normalize(`${module.name} ${module.description} ${module.endpoint}`).includes(search),
    )
  }, [query])

  return (
    <>
      <PageHeader
        title="CRM LesGo"
        description="Panel de control del módulo CRM. Consulta el estado de la API y accede a todos los endpoints desde el menú."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <HealthCard
          title="Servicio"
          endpoint="GET /api/health"
          loading={health.loading}
          error={health.error}
          status={health.data?.status ?? null}
          detail={health.data ? `${health.data.service} · ${health.data.module}` : null}
          onRetry={health.reload}
        />
        <HealthCard
          title="Base de datos"
          endpoint="GET /api/health/db"
          loading={database.loading}
          error={database.error}
          status={database.data?.status ?? null}
          detail={database.data ? `db: ${database.data.db}` : null}
          onRetry={database.reload}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-semibold text-ink">Módulos</h2>
          <p className={text.lead}>Cada tarjeta abre la pantalla que consume sus endpoints.</p>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          label="Buscar módulo"
          placeholder="Buscar módulo, p. ej. seguimientos"
        />

        {visibleModules.length > 0 ? (
          <div className={card.grid}>
            {visibleModules.map((module) => (
              <ModuleCard key={module.id} module={module} count={counts[module.id]} />
            ))}
          </div>
        ) : (
          <p className={text.empty}>Ningún módulo coincide con “{query}”. Prueba con clientes, seguimientos o historial.</p>
        )}
      </section>
    </>
  )
}
