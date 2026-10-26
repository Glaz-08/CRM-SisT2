import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { todayInSantiago } from '../api/date'
import { endpoints } from '../api/endpoints'
import {
  INBOUND_EVENT_TYPES,
  type EventEnvelope,
  type InboundEventType,
} from '../api/types'
import { ApiErrorMessage } from '../components/ui/AsyncState'
import { Field } from '../components/ui/Field'
import { JsonEditor } from '../components/ui/JsonEditor'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { useApiAction } from '../hooks/useApiResource'
import { button, feedback, form } from '../styles/ui'
import { cx } from '../styles/cx'

type Preset = {
  source: string
  label: string
  payload: Record<string, unknown>
}

const PRESETS: Record<InboundEventType, Preset> = {
  'cliente.actualizado': {
    source: 'clientes',
    label: 'Cliente actualizado',
    payload: {
      idCliente: 1,
      rut: '11.111.111-1',
      camposActualizados: { email: 'cliente1@demo.cl' },
    },
  },
  'pedido.creado': {
    source: 'pedidos',
    label: 'Pedido creado',
    payload: {
      idPedido: 1001,
      idCliente: 1,
      fecha: todayInSantiago(),
      total: 49990,
    },
  },
  'reclamo.creado': {
    source: 'postventa',
    label: 'Reclamo creado',
    payload: {
      idReclamo: 501,
      idCliente: 1,
      fecha: todayInSantiago(),
      motivo: 'Producto incompleto',
    },
  },
}

const initialType: InboundEventType = 'cliente.actualizado'
const initialPayload = JSON.stringify(PRESETS[initialType].payload, null, 2)

/** Integración: composición y envío de eventos inbound a `POST /api/events`. */
export function IntegracionPage() {
  const [type, setType] = useState<InboundEventType>(initialType)
  const [source, setSource] = useState(PRESETS[initialType].source)
  const [version, setVersion] = useState('1.0')
  const [payloadText, setPayloadText] = useState(initialPayload)
  const [payloadError, setPayloadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const ingest = useApiAction((event: EventEnvelope) => endpoints.events.ingest(event))

  const changeType = (nextType: InboundEventType) => {
    const preset = PRESETS[nextType]
    setType(nextType)
    setSource(preset.source)
    setPayloadText(JSON.stringify(preset.payload, null, 2))
    setPayloadError(null)
    setFormError(null)
    ingest.reset()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPayloadError(null)
    setFormError(null)

    if (!source.trim()) {
      setFormError('El origen del evento es obligatorio.')
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(payloadText)
    } catch (error) {
      setPayloadError(error instanceof Error ? `JSON inválido: ${error.message}` : 'JSON inválido.')
      return
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setPayloadError('El payload debe ser un objeto JSON.')
      return
    }

    await ingest.run({
      source: source.trim(),
      type,
      occurredAt: new Date().toISOString(),
      version: version.trim() || undefined,
      payload: parsed as Record<string, unknown>,
    })
  }

  return (
    <>
      <PageHeader
        title="Integración"
        description="Envía eventos de otros módulos al CRM. La API valida el sobre y el payload antes de publicarlos en el bus interno."
      />

      <p className={feedback.info}>
        Solo se aceptan los eventos inbound <strong>cliente.actualizado</strong>, <strong>pedido.creado</strong> y{' '}
        <strong>reclamo.creado</strong>. <strong>seguimiento.creado</strong> es outbound y se rechaza con 400.
        Puedes inspeccionar los eventos recibidos en <Link to="/mock-erp" className="font-semibold underline">Mock ERP</Link>{' '}
        cuando `ENABLE_MOCKS=true`.
      </p>

      <Panel title="Componer evento" description="POST /api/events">
        <form onSubmit={submit} className={form.grid}>
          <Field label="Tipo de evento" htmlFor="event-type">
            <select
              id="event-type"
              value={type}
              onChange={(event) => changeType(event.target.value as InboundEventType)}
              className={form.input}
            >
              {INBOUND_EVENT_TYPES.map((eventType) => (
                <option key={eventType} value={eventType}>
                  {eventType}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Origen" htmlFor="event-source" hint="Se guarda en el sobre como `source`.">
            <input
              id="event-source"
              required
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className={form.input}
              placeholder="clientes"
            />
          </Field>

          <Field label="Versión" htmlFor="event-version" hint="Opcional; por defecto 1.0.">
            <input
              id="event-version"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className={form.input}
              placeholder="1.0"
            />
          </Field>

          <div className="flex flex-col justify-end text-sm text-muted">
            <span className="font-display text-sm font-semibold text-ink">{PRESETS[type].label}</span>
            <span>El sobre incluye `occurredAt` con la hora actual.</span>
          </div>

          <div className="sm:col-span-2">
            <JsonEditor
              id="event-payload"
              label="Payload JSON"
              value={payloadText}
              onChange={setPayloadText}
              error={payloadError ?? undefined}
              hint="El JSON se valida en el navegador y nuevamente en el servidor."
              disabled={ingest.pending}
            />
          </div>

          {formError && <p className={cx(form.error, 'sm:col-span-2')}>{formError}</p>}
          <div className="sm:col-span-2">
            <ApiErrorMessage error={ingest.error} />
          </div>

          {ingest.data && (
            <div className={cx(feedback.success, 'sm:col-span-2')}>
              <p className="font-display font-semibold">Evento aceptado</p>
              <p className="mt-1 text-sm">
                Tipo: <code>{ingest.data.type}</code>
              </p>
              <p className="mt-1 break-all font-mono text-xs">{ingest.data.eventId}</p>
            </div>
          )}

          <div className={cx(form.actions, 'sm:col-span-2')}>
            <button type="submit" disabled={ingest.pending} className={button.primary}>
              {ingest.pending ? 'Enviando…' : 'Enviar evento'}
            </button>
            <button
              type="button"
              onClick={() => {
                ingest.reset()
                setPayloadError(null)
                setFormError(null)
              }}
              className={button.secondary}
            >
              Limpiar resultado
            </button>
          </div>
        </form>
      </Panel>
    </>
  )
}
