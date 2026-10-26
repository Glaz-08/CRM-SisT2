import { useState, type FormEvent } from 'react'
import { formatDate } from '../api/date'
import { endpoints } from '../api/endpoints'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState'
import { Field } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { useApiResource } from '../hooks/useApiResource'
import { badge, button, feedback, form, timeline } from '../styles/ui'
import { cx } from '../styles/cx'

/** Historial 360°: global o filtrado por cliente. */
export function HistorialPage() {
  const [draft, setDraft] = useState('')
  const [clientId, setClientId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const historial = useApiResource(
    () => (clientId ? endpoints.historial.byCliente(clientId) : endpoints.historial.list()),
    [clientId],
  )

  const applyFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (!draft.trim()) {
      setClientId(null)
      return
    }

    const parsed = Number(draft)
    if (!Number.isInteger(parsed) || parsed < 1) {
      setFormError('El ID del cliente debe ser un entero positivo.')
      return
    }

    setClientId(parsed)
  }

  const clearFilter = () => {
    setDraft('')
    setClientId(null)
    setFormError(null)
  }

  return (
    <>
      <PageHeader
        title="Historial"
        description="Vista 360° de los eventos del CRM. Consulta el historial global o filtra por cliente."
      />

      <Panel title="Filtrar por cliente" description="GET /api/historial/cliente/:idCliente">
        <form onSubmit={applyFilter} className={form.inline}>
          <Field
            label="ID del cliente"
            htmlFor="historial-cliente"
            hint="Déjalo vacío para ver el historial global."
            error={formError ?? undefined}
            className={form.inlineField}
          >
            <input
              id="historial-cliente"
              type="number"
              min={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className={form.input}
              placeholder="1"
            />
          </Field>
          <button type="submit" className={cx(button.primary, 'flex-none')}>
            Consultar
          </button>
          <button type="button" onClick={clearFilter} className={cx(button.secondary, 'flex-none')}>
            Ver todo
          </button>
        </form>
        <p className={feedback.info}>
          {clientId ? `Mostrando eventos del cliente ${clientId}.` : 'Mostrando el historial global.'}
        </p>
      </Panel>

      <Panel
        title="Eventos"
        description={`${historial.data?.length ?? 0} evento(s), ordenados del más reciente al más antiguo.`}
      >
        {historial.loading && <LoadingState />}
        {!historial.loading && historial.error && (
          <ErrorState error={historial.error} onRetry={historial.reload} />
        )}
        {!historial.loading && !historial.error && (historial.data?.length ?? 0) === 0 && (
          <EmptyState message="No hay eventos de historial para este filtro." />
        )}
        {!historial.loading && !historial.error && (historial.data?.length ?? 0) > 0 && (
          <ol className={timeline.list}>
            {historial.data?.map((evento) => (
              <li key={evento.idHistorial} className={timeline.item}>
                <div className={timeline.meta}>
                  <span className={cx(badge.base, badge.neutral)}>{evento.tipoEvento}</span>
                  <span>{formatDate(evento.fecha)}</span>
                  <span className="font-mono">cliente #{evento.idCliente}</span>
                  <span className="font-mono">evento #{evento.idHistorial}</span>
                </div>
                <p className={timeline.text}>{evento.descripcion}</p>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  )
}
