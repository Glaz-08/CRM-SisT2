import { useState, type FormEvent } from 'react'
import { formatDateTime, todayInSantiago } from '../api/date'
import { endpoints } from '../api/endpoints'
import type {
  ClienteMaestro,
  EmpleadoMaestro,
  EventEnvelope,
} from '../api/types'
import {
  ApiErrorMessage,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/AsyncState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Field } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { useApiAction, useApiResource } from '../hooks/useApiResource'
import { badge, button, feedback, form, json, table, tabs } from '../styles/ui'
import { cx } from '../styles/cx'

type Tab = 'clientes' | 'empleados' | 'facturacion' | 'inventario' | 'eventos'

const TABS: { id: Tab; label: string }[] = [
  { id: 'clientes', label: 'Clientes' },
  { id: 'empleados', label: 'Empleados' },
  { id: 'facturacion', label: 'Facturación' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'eventos', label: 'Eventos' },
]

type ClienteSearchMode = 'id' | 'rut'

/** Mock ERP: maestros y receptores de eventos en memoria (requiere `ENABLE_MOCKS`). */
export function MockErpPage() {
  const [tab, setTab] = useState<Tab>('clientes')
  const probe = useApiResource(() => endpoints.mock.events.list(), [])

  if (probe.loading) {
    return (
      <>
        <PageHeader title="Mock ERP" description="Consola de demo de la integración entre módulos." />
        <LoadingState label="Comprobando si el Mock ERP está habilitado…" />
      </>
    )
  }

  if (probe.error?.status === 404) {
    return (
      <>
        <PageHeader title="Mock ERP" description="Consola de demo de la integración entre módulos." />
        <div className={feedback.info}>
          <p className="font-display text-lg font-semibold text-ink">Mock ERP deshabilitado</p>
          <p className="mt-1">
            La API respondió 404. Activa <code>ENABLE_MOCKS=true</code> en el backend para usar esta consola.
          </p>
        </div>
      </>
    )
  }

  if (probe.error) {
    return (
      <>
        <PageHeader title="Mock ERP" description="Consola de demo de la integración entre módulos." />
        <ErrorState error={probe.error} onRetry={probe.reload} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Mock ERP"
        description="Simula los maestros y los receptores de eventos de otros módulos. Todo vive en memoria y solo está disponible con ENABLE_MOCKS=true."
        actions={
          <button type="button" onClick={probe.reload} className={cx(button.secondary, 'flex-none')}>
            Revalidar
          </button>
        }
      />

      <div className={tabs.list} role="tablist" aria-label="Secciones del Mock ERP">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cx(tabs.item, tab === item.id && tabs.active)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'clientes' && <MockClientesTab />}
      {tab === 'empleados' && <MockEmpleadosTab />}
      {tab === 'facturacion' && <MockFacturacionTab />}
      {tab === 'inventario' && <MockInventarioTab />}
      {tab === 'eventos' && <MockEventsTab />}
    </>
  )
}

function MockClientesTab() {
  const clientes = useApiResource(() => endpoints.mock.clientes.list(), [])
  const lookup = useApiAction((mode: ClienteSearchMode, value: string) =>
    mode === 'id' ? endpoints.mock.clientes.byId(Number(value)) : endpoints.mock.clientes.byRut(value),
  )
  const [mode, setMode] = useState<ClienteSearchMode>('id')
  const [value, setValue] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    void lookup.run(mode, trimmed)
  }

  const columns: Column<ClienteMaestro>[] = [
    { key: 'id', header: 'ID', render: (cliente) => <span className={table.mono}>{cliente.idCliente}</span> },
    { key: 'rut', header: 'RUT', render: (cliente) => cliente.rut },
    { key: 'nombre', header: 'Nombre', render: (cliente) => cliente.nombre },
    { key: 'email', header: 'Email', render: (cliente) => cliente.email ?? '—' },
  ]

  return (
    <Panel title="Clientes mock" description="GET /api/mock/clientes, /:id y /rut/:rut">
      <form onSubmit={submit} className={form.inline}>
        <Field label="Buscar por" htmlFor="mock-cliente-mode" className={form.inlineField}>
          <select
            id="mock-cliente-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as ClienteSearchMode)}
            className={form.input}
          >
            <option value="id">ID</option>
            <option value="rut">RUT</option>
          </select>
        </Field>
        <Field label="Valor" htmlFor="mock-cliente-value" className={form.inlineField}>
          <input
            id="mock-cliente-value"
            type={mode === 'id' ? 'number' : 'text'}
            min={mode === 'id' ? 1 : undefined}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className={form.input}
            placeholder={mode === 'id' ? '1' : '11.111.111-1'}
          />
        </Field>
        <button type="submit" className={cx(button.primary, 'flex-none')} disabled={lookup.pending || !value.trim()}>
          Buscar
        </button>
        <button
          type="button"
          onClick={() => {
            setValue('')
            lookup.reset()
          }}
          className={cx(button.secondary, 'flex-none')}
        >
          Limpiar
        </button>
      </form>

      <ApiErrorMessage error={lookup.error} />
      {lookup.data && (
        <div className={feedback.success}>
          <p className="font-display font-semibold">Cliente mock encontrado</p>
          <p className="mt-1 text-sm">
            #{lookup.data.idCliente} · {lookup.data.rut} · {lookup.data.nombre} · {lookup.data.email ?? 'sin email'}
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={clientes.data ?? []}
        getRowKey={(cliente) => cliente.idCliente}
        loading={clientes.loading}
        error={clientes.error}
        onRetry={clientes.reload}
        emptyMessage="El mock no tiene clientes."
        caption="Clientes mock"
      />
    </Panel>
  )
}

function MockEmpleadosTab() {
  const empleados = useApiResource(() => endpoints.mock.empleados.list(), [])
  const lookup = useApiAction((empleadoId: number) => endpoints.mock.empleados.byId(empleadoId))
  const [value, setValue] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const id = Number(value)
    if (!Number.isInteger(id) || id < 1) return
    void lookup.run(id)
  }

  const columns: Column<EmpleadoMaestro>[] = [
    { key: 'id', header: 'ID', render: (empleado) => <span className={table.mono}>{empleado.idEmpleado}</span> },
    { key: 'nombre', header: 'Nombre', render: (empleado) => empleado.nombre },
    { key: 'cargo', header: 'Cargo', render: (empleado) => empleado.cargo ?? '—' },
  ]

  return (
    <Panel title="Empleados mock" description="GET /api/mock/empleados y /:id">
      <form onSubmit={submit} className={form.inline}>
        <Field label="ID empleado" htmlFor="mock-empleado-id" className={form.inlineField}>
          <input
            id="mock-empleado-id"
            type="number"
            min={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className={form.input}
            placeholder="1"
          />
        </Field>
        <button type="submit" className={cx(button.primary, 'flex-none')} disabled={lookup.pending || !value.trim()}>
          Buscar
        </button>
        <button
          type="button"
          onClick={() => {
            setValue('')
            lookup.reset()
          }}
          className={cx(button.secondary, 'flex-none')}
        >
          Limpiar
        </button>
      </form>

      <ApiErrorMessage error={lookup.error} />
      {lookup.data && (
        <div className={feedback.success}>
          <p className="font-display font-semibold">Empleado mock encontrado</p>
          <p className="mt-1 text-sm">
            #{lookup.data.idEmpleado} · {lookup.data.nombre} · {lookup.data.cargo ?? 'sin cargo'}
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={empleados.data ?? []}
        getRowKey={(empleado) => empleado.idEmpleado}
        loading={empleados.loading}
        error={empleados.error}
        onRetry={empleados.reload}
        emptyMessage="El mock no tiene empleados."
        caption="Empleados mock"
      />
    </Panel>
  )
}

function MockFacturacionTab() {
  const events = useApiResource(() => endpoints.mock.facturacion.list(), [])
  const receive = useApiAction((event: EventEnvelope) => endpoints.mock.facturacion.receive(event))
  const clear = useApiAction(() => endpoints.mock.facturacion.clear())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const sendSample = async () => {
    const event: EventEnvelope = {
      source: 'crm',
      type: 'seguimiento.creado',
      occurredAt: new Date().toISOString(),
      version: '1.0',
      payload: {
        idSeguimientoCrm: 999001,
        idInteraccion: 1,
        idCliente: 1,
        idEmpleado: 1,
        fechaProgramada: todayInSantiago(),
        accionRequerida: 'Recepción simulada desde el frontend',
        estado: 'pendiente',
      },
    }
    const result = await receive.run(event)
    if (result) events.reload()
  }

  const confirmClear = async () => {
    const result = await clear.run()
    if (result) {
      events.reload()
      setConfirmOpen(false)
    }
  }

  return (
    <Panel
      title="Facturación mock"
      description="Receptor de seguimiento.creado. GET, POST y DELETE /api/mock/facturacion/seguimientos"
      actions={
        <>
          <button type="button" onClick={() => void sendSample()} disabled={receive.pending} className={button.primary}>
            {receive.pending ? 'Enviando…' : 'Enviar evento de prueba'}
          </button>
          <button type="button" onClick={() => setConfirmOpen(true)} disabled={clear.pending} className={button.secondary}>
            Limpiar
          </button>
        </>
      }
    >
      <ApiErrorMessage error={receive.error ?? clear.error} />
      {receive.data && (
        <p className={feedback.success}>
          Evento aceptado: <code>{receive.data.type}</code> · {receive.data.eventId ?? 'sin id'}
        </p>
      )}

      {events.loading && <LoadingState />}
      {!events.loading && events.error && <ErrorState error={events.error} onRetry={events.reload} />}
      {!events.loading && !events.error && <EventList events={events.data ?? []} emptyMessage="Facturación no ha recibido eventos." />}

      <ConfirmDialog
        open={confirmOpen}
        title="Limpiar eventos de facturación"
        description="Se eliminarán todos los eventos recibidos por el receptor mock de facturación. Esta acción no afecta a la base de datos del CRM."
        confirmLabel="Limpiar eventos"
        pending={clear.pending}
        onConfirm={() => void confirmClear()}
        onClose={() => setConfirmOpen(false)}
      />
    </Panel>
  )
}

function MockInventarioTab() {
  const events = useApiResource(() => endpoints.mock.inventario.list(), [])
  const receive = useApiAction((event: EventEnvelope) => endpoints.mock.inventario.receive(event))
  const clear = useApiAction(() => endpoints.mock.inventario.clear())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const sendSample = async () => {
    const event: EventEnvelope = {
      source: 'clientes',
      type: 'cliente.actualizado',
      occurredAt: new Date().toISOString(),
      version: '1.0',
      payload: {
        idCliente: 1,
        rut: '11.111.111-1',
        camposActualizados: { email: 'cliente1@demo.cl' },
        ocurridoEn: new Date().toISOString(),
      },
    }
    const result = await receive.run(event)
    if (result) events.reload()
  }

  const confirmClear = async () => {
    const result = await clear.run()
    if (result) {
      events.reload()
      setConfirmOpen(false)
    }
  }

  return (
    <Panel
      title="Inventario mock"
      description="Receptor de cliente.actualizado. GET, POST y DELETE /api/mock/inventario/clientes"
      actions={
        <>
          <button type="button" onClick={() => void sendSample()} disabled={receive.pending} className={button.primary}>
            {receive.pending ? 'Enviando…' : 'Enviar evento de prueba'}
          </button>
          <button type="button" onClick={() => setConfirmOpen(true)} disabled={clear.pending} className={button.secondary}>
            Limpiar
          </button>
        </>
      }
    >
      <ApiErrorMessage error={receive.error ?? clear.error} />
      {receive.data && (
        <p className={feedback.success}>
          Evento aceptado: <code>{receive.data.type}</code> · {receive.data.eventId ?? 'sin id'}
        </p>
      )}

      {events.loading && <LoadingState />}
      {!events.loading && events.error && <ErrorState error={events.error} onRetry={events.reload} />}
      {!events.loading && !events.error && <EventList events={events.data ?? []} emptyMessage="Inventario no ha recibido eventos." />}

      <ConfirmDialog
        open={confirmOpen}
        title="Limpiar eventos de inventario"
        description="Se eliminarán todos los eventos recibidos por el receptor mock de inventario. Esta acción no afecta a la base de datos del CRM."
        confirmLabel="Limpiar eventos"
        pending={clear.pending}
        onConfirm={() => void confirmClear()}
        onClose={() => setConfirmOpen(false)}
      />
    </Panel>
  )
}

function MockEventsTab() {
  const events = useApiResource(() => endpoints.mock.events.list(), [])
  const clear = useApiAction(() => endpoints.mock.events.clear())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const confirmClear = async () => {
    const result = await clear.run()
    if (result) {
      events.reload()
      setConfirmOpen(false)
    }
  }

  return (
    <Panel
      title="Eventos consolidados"
      description="GET y DELETE /api/mock/events. Incluye eventos inbound y los recibidos por facturación e inventario."
      actions={
        <button type="button" onClick={() => setConfirmOpen(true)} disabled={clear.pending} className={button.secondary}>
          Limpiar todo
        </button>
      }
    >
      <ApiErrorMessage error={clear.error} />

      {events.loading && <LoadingState />}
      {!events.loading && events.error && <ErrorState error={events.error} onRetry={events.reload} />}
      {!events.loading && !events.error && events.data && (
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h3 className="font-display text-lg font-semibold">Inbound (/api/events)</h3>
            <EventList events={events.data.inbound} emptyMessage="No hay eventos inbound." />
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="font-display text-lg font-semibold">Facturación</h3>
            <EventList events={events.data.facturacion} emptyMessage="No hay eventos de facturación." />
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="font-display text-lg font-semibold">Inventario</h3>
            <EventList events={events.data.inventario} emptyMessage="No hay eventos de inventario." />
          </section>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Limpiar toda la bitácora"
        description="Se eliminarán los eventos inbound y los recibidos por facturación e inventario. Esta acción no afecta a la base de datos del CRM."
        confirmLabel="Limpiar todo"
        pending={clear.pending}
        onConfirm={() => void confirmClear()}
        onClose={() => setConfirmOpen(false)}
      />
    </Panel>
  )
}

function EventList({ events, emptyMessage }: { events: EventEnvelope[]; emptyMessage: string }) {
  if (events.length === 0) return <EmptyState message={emptyMessage} />

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event, index) => (
        <li key={event.id ?? `${event.type}-${index}`} className="rounded-2xl border border-panel-strong bg-white p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className={cx(badge.base, badge.neutral)}>{event.type}</span>
            <span>origen: {event.source}</span>
            {event.occurredAt && <span>{formatDateTime(event.occurredAt)}</span>}
            {event.id && <span className="break-all font-mono">{event.id}</span>}
          </div>
          <pre className={cx(json.root, 'mt-2')}>{JSON.stringify(event.payload, null, 2)}</pre>
        </li>
      ))}
    </ul>
  )
}
