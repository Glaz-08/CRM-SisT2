import { useState, type FormEvent } from 'react'
import { endpoints } from '../api/endpoints'
import { todayInSantiago, formatDate } from '../api/date'
import type {
  CreateInteraccionDto,
  Interaccion,
  ListInteraccionesFilters,
} from '../api/types'
import { ApiErrorMessage, LoadingState } from '../components/ui/AsyncState'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Field } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useApiAction, useApiResource } from '../hooks/useApiResource'
import { button, feedback, form, table } from '../styles/ui'
import { cx } from '../styles/cx'

type FilterDraft = {
  idCliente: string
  idEmpleado: string
  canal: string
  desde: string
  hasta: string
}

type CreateDraft = {
  idCliente: string
  idEmpleado: string
  fecha: string
  canal: string
  detalle: string
}

const emptyFilters: FilterDraft = {
  idCliente: '',
  idEmpleado: '',
  canal: '',
  desde: '',
  hasta: '',
}

function optionalId(value: string): number | undefined {
  if (!value.trim()) return undefined
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : undefined
}

function makeCreateDraft(): CreateDraft {
  return {
    idCliente: '',
    idEmpleado: '1',
    fecha: todayInSantiago(),
    canal: '',
    detalle: '',
  }
}

const columns = (onView: (row: Interaccion) => void): Column<Interaccion>[] => [
  {
    key: 'id',
    header: 'ID',
    render: (row) => <span className={table.mono}>{row.idInteraccion}</span>,
  },
  { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha) },
  { key: 'cliente', header: 'Cliente', render: (row) => <span className={table.mono}>{row.idCliente}</span> },
  { key: 'empleado', header: 'Empleado', render: (row) => <span className={table.mono}>{row.idEmpleado}</span> },
  { key: 'canal', header: 'Canal', render: (row) => row.canal },
  {
    key: 'detalle',
    header: 'Detalle',
    className: 'max-w-xs',
    render: (row) => <span className="line-clamp-2">{row.detalle}</span>,
  },
  {
    key: 'seguimientos',
    header: 'Seguimientos',
    render: (row) => row.seguimientos?.length ?? 0,
  },
  {
    key: 'actions',
    header: '',
    render: (row) => (
      <button type="button" onClick={() => onView(row)} className={cx(button.secondary, 'flex-none px-3 py-1.5 text-sm')}>
        Ver
      </button>
    ),
  },
]

/** Interacciones: filtros, detalle con seguimientos y creación. */
export function InteraccionesPage() {
  const [draft, setDraft] = useState<FilterDraft>(emptyFilters)
  const [filters, setFilters] = useState<ListInteraccionesFilters>({})
  const [createDraft, setCreateDraft] = useState<CreateDraft>(makeCreateDraft)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const list = useApiResource(
    () => endpoints.interacciones.list(filters),
    [filters.idCliente, filters.idEmpleado, filters.canal, filters.desde, filters.hasta],
  )
  const detail = useApiAction((interaccionId: number) => endpoints.interacciones.byId(interaccionId))
  const create = useApiAction((dto: CreateInteraccionDto) => endpoints.interacciones.create(dto))

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFilters({
      idCliente: optionalId(draft.idCliente),
      idEmpleado: optionalId(draft.idEmpleado),
      canal: draft.canal.trim() || undefined,
      desde: draft.desde || undefined,
      hasta: draft.hasta || undefined,
    })
  }

  const clearFilters = () => {
    setDraft(emptyFilters)
    setFilters({})
  }

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage(null)
    setFormError(null)

    const idCliente = Number(createDraft.idCliente)
    const idEmpleado = Number(createDraft.idEmpleado)
    const canal = createDraft.canal.trim()
    const detalle = createDraft.detalle.trim()

    if (!Number.isInteger(idCliente) || idCliente < 1 || !Number.isInteger(idEmpleado) || idEmpleado < 1) {
      setFormError('Los IDs de cliente y empleado deben ser enteros positivos.')
      return
    }

    if (!createDraft.fecha || !canal || !detalle) {
      setFormError('Fecha, canal y detalle son obligatorios.')
      return
    }

    const result = await create.run({ idCliente, idEmpleado, fecha: createDraft.fecha, canal, detalle })
    if (result) {
      setCreateDraft({ ...makeCreateDraft(), idCliente: createDraft.idCliente, idEmpleado: createDraft.idEmpleado })
      setSuccessMessage(`Interacción #${result.idInteraccion} creada. El historial se actualizó automáticamente.`)
      list.reload()
    }
  }

  return (
    <>
      <PageHeader
        title="Interacciones"
        description="Registra contactos comerciales y consulta su detalle con los seguimientos asociados."
      />

      <Panel title="Filtros" description="GET /api/interacciones">
        <form onSubmit={applyFilters} className={form.grid}>
          <Field label="ID cliente" htmlFor="filter-interaccion-cliente">
            <input
              id="filter-interaccion-cliente"
              type="number"
              min={1}
              value={draft.idCliente}
              onChange={(event) => setDraft({ ...draft, idCliente: event.target.value })}
              className={form.input}
              placeholder="1"
            />
          </Field>
          <Field label="ID empleado" htmlFor="filter-interaccion-empleado">
            <input
              id="filter-interaccion-empleado"
              type="number"
              min={1}
              value={draft.idEmpleado}
              onChange={(event) => setDraft({ ...draft, idEmpleado: event.target.value })}
              className={form.input}
              placeholder="1"
            />
          </Field>
          <Field label="Canal" htmlFor="filter-interaccion-canal">
            <input
              id="filter-interaccion-canal"
              value={draft.canal}
              onChange={(event) => setDraft({ ...draft, canal: event.target.value })}
              className={form.input}
              placeholder="whatsapp"
            />
          </Field>
          <Field label="Desde" htmlFor="filter-interaccion-desde">
            <input
              id="filter-interaccion-desde"
              type="date"
              value={draft.desde}
              onChange={(event) => setDraft({ ...draft, desde: event.target.value })}
              className={form.input}
            />
          </Field>
          <Field label="Hasta" htmlFor="filter-interaccion-hasta">
            <input
              id="filter-interaccion-hasta"
              type="date"
              value={draft.hasta}
              onChange={(event) => setDraft({ ...draft, hasta: event.target.value })}
              className={form.input}
            />
          </Field>
          <div className={cx(form.actions, 'sm:col-span-2')}>
            <button type="submit" className={button.primary}>
              Aplicar filtros
            </button>
            <button type="button" onClick={clearFilters} className={button.secondary}>
              Limpiar
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Listado" description={`${list.data?.length ?? 0} interacción(es)`}>
        <DataTable
          columns={columns((row) => void detail.run(row.idInteraccion))}
          rows={list.data ?? []}
          getRowKey={(row) => row.idInteraccion}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          emptyMessage="No hay interacciones con esos filtros."
          caption="Listado de interacciones"
        />
      </Panel>

      {(detail.pending || detail.error || detail.data) && (
        <Panel
          title={detail.data ? `Interacción #${detail.data.idInteraccion}` : 'Detalle de interacción'}
          actions={
            <button type="button" onClick={detail.reset} className={cx(button.secondary, 'flex-none')}>
              Cerrar
            </button>
          }
        >
          {detail.pending ? (
            <LoadingState label="Cargando detalle…" />
          ) : detail.error ? (
            <ApiErrorMessage error={detail.error} />
          ) : detail.data ? (
            <InteraccionDetail interaccion={detail.data} />
          ) : null}
        </Panel>
      )}

      <Panel title="Nueva interacción" description="POST /api/interacciones">
        <form onSubmit={submitCreate} className={form.grid}>
          <Field label="ID cliente" htmlFor="create-interaccion-cliente" hint="Debe existir en el maestro si VALIDAR_CLIENTE está activo.">
            <input
              id="create-interaccion-cliente"
              type="number"
              min={1}
              required
              value={createDraft.idCliente}
              onChange={(event) => setCreateDraft({ ...createDraft, idCliente: event.target.value })}
              className={form.input}
            />
          </Field>
          <Field label="ID empleado" htmlFor="create-interaccion-empleado" hint="Debe existir en el maestro si VALIDAR_EMPLEADO está activo.">
            <input
              id="create-interaccion-empleado"
              type="number"
              min={1}
              required
              value={createDraft.idEmpleado}
              onChange={(event) => setCreateDraft({ ...createDraft, idEmpleado: event.target.value })}
              className={form.input}
            />
          </Field>
          <Field label="Fecha" htmlFor="create-interaccion-fecha" hint="Hoy o posterior, en America/Santiago.">
            <input
              id="create-interaccion-fecha"
              type="date"
              required
              min={todayInSantiago()}
              value={createDraft.fecha}
              onChange={(event) => setCreateDraft({ ...createDraft, fecha: event.target.value })}
              className={form.input}
            />
          </Field>
          <Field label="Canal" htmlFor="create-interaccion-canal" hint="Máximo 100 caracteres.">
            <input
              id="create-interaccion-canal"
              required
              maxLength={100}
              value={createDraft.canal}
              onChange={(event) => setCreateDraft({ ...createDraft, canal: event.target.value })}
              className={form.input}
              placeholder="whatsapp"
            />
          </Field>
          <Field label="Detalle" htmlFor="create-interaccion-detalle" hint="Máximo 2000 caracteres." className="sm:col-span-2">
            <textarea
              id="create-interaccion-detalle"
              required
              maxLength={2000}
              value={createDraft.detalle}
              onChange={(event) => setCreateDraft({ ...createDraft, detalle: event.target.value })}
              className={form.textarea}
              placeholder="Consulta por despacho"
            />
          </Field>
          {formError && <p className={cx(form.error, 'sm:col-span-2')}>{formError}</p>}
          <div className="sm:col-span-2">
            <ApiErrorMessage error={create.error} />
          </div>
          {successMessage && (
            <p className={cx(feedback.success, 'sm:col-span-2')}>{successMessage}</p>
          )}
          <div className={cx(form.actions, 'sm:col-span-2')}>
            <button type="submit" disabled={create.pending} className={button.primary}>
              {create.pending ? 'Guardando…' : 'Registrar interacción'}
            </button>
          </div>
        </form>
      </Panel>
    </>
  )
}

function InteraccionDetail({ interaccion }: { interaccion: Interaccion }) {
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Cliente</dt>
          <dd className="font-mono">{interaccion.idCliente}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Empleado</dt>
          <dd className="font-mono">{interaccion.idEmpleado}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Fecha</dt>
          <dd>{formatDate(interaccion.fecha)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Canal</dt>
          <dd>{interaccion.canal}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted">Detalle</dt>
          <dd className="leading-relaxed">{interaccion.detalle}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-base font-semibold text-ink">Seguimientos asociados</h3>
        {interaccion.seguimientos && interaccion.seguimientos.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {interaccion.seguimientos.map((seguimiento) => (
              <li key={seguimiento.idSeguimientoCrm} className="rounded-xl bg-white p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs">#{seguimiento.idSeguimientoCrm}</span>
                  <StatusBadge estado={seguimiento.estado} />
                </div>
                <p className="mt-1">{seguimiento.accionRequerida}</p>
                <p className="text-xs text-muted">Programado: {formatDate(seguimiento.fechaProgramada)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Esta interacción no tiene seguimientos.</p>
        )}
      </div>
    </div>
  )
}
