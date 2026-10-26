import { useState, type FormEvent } from 'react'
import type { ClienteMaestro } from '../api/types'
import { endpoints } from '../api/endpoints'
import { ApiErrorMessage } from '../components/ui/AsyncState'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Field } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { useApiAction, useApiResource } from '../hooks/useApiResource'
import { button, feedback, form } from '../styles/ui'
import { cx } from '../styles/cx'

type SearchMode = 'id' | 'rut'

const columns: Column<ClienteMaestro>[] = [
  { key: 'id', header: 'ID', render: (cliente) => <span className="font-mono text-xs">{cliente.idCliente}</span> },
  { key: 'rut', header: 'RUT', render: (cliente) => cliente.rut || '—' },
  { key: 'nombre', header: 'Nombre', render: (cliente) => cliente.nombre || '—' },
  { key: 'email', header: 'Email', render: (cliente) => cliente.email ?? '—' },
]

/** Maestro de clientes: listado y búsqueda por ID o RUT. */
export function ClientesPage() {
  const clientes = useApiResource(() => endpoints.clientes.list(), [])
  const lookup = useApiAction((mode: SearchMode, value: string) =>
    mode === 'id' ? endpoints.clientes.byId(Number(value)) : endpoints.clientes.byRut(value),
  )
  const [mode, setMode] = useState<SearchMode>('id')
  const [value, setValue] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    void lookup.run(mode, trimmed)
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Consulta el maestro externo de clientes por ID o RUT. El CRM solo lee estos datos para validar identidad."
      />

      <Panel title="Buscar cliente" description="GET /api/clientes/:id y GET /api/clientes/rut/:rut">
        <form onSubmit={submit} className={form.inline}>
          <Field label="Buscar por" htmlFor="clientes-search-mode" className={form.inlineField}>
            <select
              id="clientes-search-mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as SearchMode)}
              className={form.input}
            >
              <option value="id">ID</option>
              <option value="rut">RUT</option>
            </select>
          </Field>
          <Field
            label={mode === 'id' ? 'ID del cliente' : 'RUT'}
            htmlFor="clientes-search-value"
            className={form.inlineField}
          >
            <input
              id="clientes-search-value"
              type={mode === 'id' ? 'number' : 'text'}
              min={mode === 'id' ? 1 : undefined}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={mode === 'id' ? '1' : '11.111.111-1'}
              className={form.input}
            />
          </Field>
          <button type="submit" disabled={lookup.pending || !value.trim()} className={cx(button.primary, 'flex-none')}>
            {lookup.pending ? 'Buscando…' : 'Buscar'}
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
            <p className="font-display font-semibold">Cliente encontrado</p>
            <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">ID</dt>
                <dd className="font-mono">{lookup.data.idCliente}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">RUT</dt>
                <dd>{lookup.data.rut || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Nombre</dt>
                <dd>{lookup.data.nombre || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
                <dd>{lookup.data.email ?? '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </Panel>

      <Panel title="Maestro de clientes" description="GET /api/clientes">
        <DataTable
          columns={columns}
          rows={clientes.data ?? []}
          getRowKey={(cliente) => cliente.idCliente}
          loading={clientes.loading}
          error={clientes.error}
          onRetry={clientes.reload}
          emptyMessage="El maestro de clientes no tiene registros."
          caption="Listado de clientes"
        />
        {clientes.error?.status === 503 && (
          <p className={feedback.info}>
            El maestro de clientes no está disponible. Revisa `CLIENTE_MAESTRO_MODE` y la conexión de la API.
          </p>
        )}
      </Panel>
    </>
  )
}
