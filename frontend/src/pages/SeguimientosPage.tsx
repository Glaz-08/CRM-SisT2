import { useState, type FormEvent } from 'react'
import { formatDate, todayInSantiago } from '../api/date'
import { endpoints } from '../api/endpoints'
import {
  ESTADOS_SEGUIMIENTO,
  type CreateSeguimientoDto,
  type EstadoSeguimiento,
  type ListSeguimientosFilters,
  type Seguimiento,
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
  idInteraccion: string
  idCliente: string
  estado: '' | EstadoSeguimiento
  desde: string
  hasta: string
}

type CreateDraft = {
  idInteraccion: string
  fechaProgramada: string
  accionRequerida: string
}

const emptyFilters: FilterDraft = {
  idInteraccion: '',
  idCliente: '',
  estado: '',
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
    idInteraccion: '',
    fechaProgramada: todayInSantiago(),
    accionRequerida: '',
  }
}

/** Seguimientos: filtros, detalle, creación y cambio de estado. */
export function SeguimientosPage() {
  const [draft, setDraft] = useState<FilterDraft>(emptyFilters)
  const [filters, setFilters] = useState<ListSeguimientosFilters>({})
  const [createDraft, setCreateDraft] = useState<CreateDraft>(makeCreateDraft)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const list = useApiResource(
    () => endpoints.seguimientos.list(filters),
    [filters.idInteraccion, filters.idCliente, filters.estado, filters.desde, filters.hasta],
  )
  const detail = useApiAction((seguimientoId: number) => endpoints.seguimientos.byId(seguimientoId))
  const create = useApiAction((dto: CreateSeguimientoDto) => endpoints.seguimientos.create(dto))
  const update = useApiAction((seguimientoId: number, estado: EstadoSeguimiento) =>
    endpoints.seguimientos.updateEstado(seguimientoId, estado),
  )

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFilters({
      idInteraccion: optionalId(draft.idInteraccion),
      idCliente: optionalId(draft.idCliente),
      estado: draft.estado || undefined,
      desde: draft.desde || undefined,
      hasta: draft.hasta || undefined,
    })
  }

  const clearFilters = () => {
    setDraft(emptyFilters)
    setFilters({})
  }

  const changeEstado = async (seguimiento: Seguimiento, estado: EstadoSeguimiento) => {
    if (estado === seguimiento.estado) return
    setSuccessMessage(null)
    const result = await update.run(seguimiento.idSeguimientoCrm, estado)
    if (result) {
      setSuccessMessage(`Seguimiento #${result.idSeguimientoCrm} actualizado a "${result.estado}".`)
      list.reload()
      if (detail.data?.idSeguimientoCrm === result.idSeguimientoCrm) {
        void detail.run(result.idSeguimientoCrm)
      }
    }
  }

  const columns: Column<Seguimiento>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (row) => <span className={table.mono}>{row.idSeguimientoCrm}</span>,
    },
    {
      key: 'fecha',
      header: 'Programado',
      render: (row) => formatDate(row.fechaProgramada),
    },
    {
      key: 'interaccion',
      header: 'Interacción',
      render: (row) => <span className={table.mono}>#{row.idInteraccion}</span>,
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (row) =>
        row.interaccion ? <span className={table.mono}>{row.interaccion.idCliente}</span> : '—',
    },
    {
      key: 'accion',
      header: 'Acción requerida',
      className: 'max-w-xs',
      render: (row) => <span className="line-clamp-2">{row.accionRequerida}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <div className="flex min-w-36 flex-col gap-2">
          <StatusBadge estado={row.estado} />
          <select
            aria-label={`Cambiar estado del seguimiento ${row.idSeguimientoCrm}`}
            value={row.estado}
            disabled={update.pending}
            onChange={(event) => void changeEstado(row, event.target.value as EstadoSeguimiento)}
            className={cx(form.input, 'px-2 py-1 text-xs')}
          >
            {ESTADOS_SEGUIMIENTO.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          type="button"
          onClick={() => void detail.run(row.idSeguimientoCrm)}
          className={cx(button.secondary, 'flex-none px-3 py-1.5 text-sm')}
        >
          Ver
        </button>
      ),
    },
  ]

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage(null)
    setFormError(null)

    const idInteraccion = Number(createDraft.idInteraccion)
    const accionRequerida = createDraft.accionRequerida.trim()

    if (!Number.isInteger(idInteraccion) || idInteraccion < 1) {
      setFormError('El ID de interacción debe ser un entero positivo.')
      return
    }

    if (!createDraft.fechaProgramada || !accionRequerida) {
      setFormError('La fecha programada y la acción requerida son obligatorias.')
      return
    }

    const result = await create.run({
      idInteraccion,
      fechaProgramada: createDraft.fechaProgramada,
      accionRequerida,
    })

    if (result) {
      setCreateDraft({ ...makeCreateDraft(), idInteraccion: createDraft.idInteraccion })
      setSuccessMessage(`Seguimiento #${result.idSeguimientoCrm} creado en estado pendiente.`)
      list.reload()
    }
  }

  return (
    <>
      <PageHeader
        title="Seguimientos"
        description="Programa acciones, consulta su detalle y actualiza el estado de cada seguimiento."
      />

      {successMessage && <p className={feedback.success}>{successMessage}</p>}

      <Panel title="Filtros" description="GET /api/seguimientos">
        <form onSubmit={applyFilters} className={form.grid}>
          <Field label="ID interacción" htmlFor="filter-seguimiento-interaccion">
            <input
              id="filter-seguimiento-interaccion"
              type="number"
              min={1}
              value={draft.idInteraccion}
              onChange={(event) => setDraft({ ...draft, idInteraccion: event.target.value })}
              className={form.input}
            />
          </Field>
          <Field label="ID cliente" htmlFor="filter-seguimiento-cliente">
            <input
              id="filter-seguimiento-cliente"
              type="number"
              min={1}
              value={draft.idCliente}
              onChange={(event) => setDraft({ ...draft, idCliente: event.target.value })}
              className={form.input}
            />
          </Field>
          <Field label="Estado" htmlFor="filter-seguimiento-estado">
            <select
              id="filter-seguimiento-estado"
              value={draft.estado}
              onChange={(event) =>
                setDraft({ ...draft, estado: event.target.value as '' | EstadoSeguimiento })
              }
              className={form.input}
            >
              <option value="">Todos</option>
              {ESTADOS_SEGUIMIENTO.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Desde" htmlFor="filter-seguimiento-desde">
            <input
              id="filter-seguimiento-desde"
              type="date"
              value={draft.desde}
              onChange={(event) => setDraft({ ...draft, desde: event.target.value })}
              className={form.input}
            />
          </Field>
          <Field label="Hasta" htmlFor="filter-seguimiento-hasta">
            <input
              id="filter-seguimiento-hasta"
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

      <Panel title="Listado" description={`${list.data?.length ?? 0} seguimiento(s)`}>
        {update.error && (
          <div className="mb-3">
            <ApiErrorMessage error={update.error} />
          </div>
        )}
        <DataTable
          columns={columns}
          rows={list.data ?? []}
          getRowKey={(row) => row.idSeguimientoCrm}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          emptyMessage="No hay seguimientos con esos filtros."
          caption="Listado de seguimientos"
        />
      </Panel>

      {(detail.pending || detail.error || detail.data) && (
        <Panel
          title={detail.data ? `Seguimiento #${detail.data.idSeguimientoCrm}` : 'Detalle de seguimiento'}
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
            <SeguimientoDetail seguimiento={detail.data} />
          ) : null}
        </Panel>
      )}

      <Panel title="Nuevo seguimiento" description="POST /api/seguimientos">
        <form onSubmit={submitCreate} className={form.grid}>
          <Field
            label="ID interacción"
            htmlFor="create-seguimiento-interaccion"
            hint="La interacción debe existir; si no, la API responde 404."
          >
            <input
              id="create-seguimiento-interaccion"
              type="number"
              min={1}
              required
              value={createDraft.idInteraccion}
              onChange={(event) => setCreateDraft({ ...createDraft, idInteraccion: event.target.value })}
              className={form.input}
            />
          </Field>
          <Field label="Fecha programada" htmlFor="create-seguimiento-fecha" hint="Hoy o posterior, en America/Santiago.">
            <input
              id="create-seguimiento-fecha"
              type="date"
              required
              min={todayInSantiago()}
              value={createDraft.fechaProgramada}
              onChange={(event) => setCreateDraft({ ...createDraft, fechaProgramada: event.target.value })}
              className={form.input}
            />
          </Field>
          <Field
            label="Acción requerida"
            htmlFor="create-seguimiento-accion"
            hint="Máximo 2000 caracteres."
            className="sm:col-span-2"
          >
            <textarea
              id="create-seguimiento-accion"
              required
              maxLength={2000}
              value={createDraft.accionRequerida}
              onChange={(event) => setCreateDraft({ ...createDraft, accionRequerida: event.target.value })}
              className={form.textarea}
              placeholder="Llamar al cliente para confirmar la entrega"
            />
          </Field>
          {formError && <p className={cx(form.error, 'sm:col-span-2')}>{formError}</p>}
          <div className="sm:col-span-2">
            <ApiErrorMessage error={create.error} />
          </div>
          <div className={cx(form.actions, 'sm:col-span-2')}>
            <button type="submit" disabled={create.pending} className={button.primary}>
              {create.pending ? 'Guardando…' : 'Crear seguimiento'}
            </button>
          </div>
        </form>
      </Panel>
    </>
  )
}

function SeguimientoDetail({ seguimiento }: { seguimiento: Seguimiento }) {
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Interacción</dt>
          <dd className="font-mono">#{seguimiento.idInteraccion}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Cliente</dt>
          <dd className="font-mono">{seguimiento.interaccion?.idCliente ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Empleado</dt>
          <dd className="font-mono">{seguimiento.interaccion?.idEmpleado ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Fecha programada</dt>
          <dd>{formatDate(seguimiento.fechaProgramada)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Estado</dt>
          <dd>
            <StatusBadge estado={seguimiento.estado} />
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted">Acción requerida</dt>
          <dd className="leading-relaxed">{seguimiento.accionRequerida}</dd>
        </div>
      </dl>

      {seguimiento.interaccion && (
        <div className="rounded-xl bg-white p-3 text-sm">
          <p className="font-display font-semibold">Interacción de origen</p>
          <p className="mt-1 text-muted">
            {formatDate(seguimiento.interaccion.fecha)} · {seguimiento.interaccion.canal}
          </p>
          <p className="mt-1 leading-relaxed">{seguimiento.interaccion.detalle}</p>
        </div>
      )}
    </div>
  )
}
