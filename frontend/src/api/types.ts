/**
 * Contratos del CRM escritos a mano a partir de las entidades TypeORM y los DTO
 * del backend (`backend/src/modules`). No se generan desde `docs/api.json`
 * porque ese OpenAPI no expone los schemas.
 *
 * Convenciones:
 * - Las fechas de negocio (`fecha`, `fechaProgramada`) son `YYYY-MM-DD` en la
 *   zona America/Santiago; los timestamps de eventos son ISO-8601 con zona.
 * - Los IDs numéricos son las claves primarias del backend.
 */

/** Estados válidos de `SEGUIMIENTO_CRM`; el backend rechaza cualquier otro valor. */
export const ESTADOS_SEGUIMIENTO = [
  'pendiente',
  'en_proceso',
  'completado',
  'cancelado',
] as const

export type EstadoSeguimiento = (typeof ESTADOS_SEGUIMIENTO)[number]

/**
 * Eventos que el CRM acepta por `POST /api/events`.
 * `seguimiento.creado` es outbound: el CRM lo emite hacia otros módulos, pero
 * la API lo rechaza como entrada.
 */
export const INBOUND_EVENT_TYPES = [
  'cliente.actualizado',
  'pedido.creado',
  'reclamo.creado',
] as const

export type InboundEventType = (typeof INBOUND_EVENT_TYPES)[number]

/** Tipos de sobre que el CRM puede emitir o recibir. */
export type KnownEventType =
  | InboundEventType
  | 'seguimiento.creado'

/** Contacto con un cliente (`INTERACCION_CRM`); incluye sus seguimientos al consultar por ID. */
export interface Interaccion {
  idInteraccion: number
  idCliente: number
  idEmpleado: number
  fecha: string
  canal: string
  detalle: string
  seguimientos?: Seguimiento[]
}

/** Tarea derivada de una interacción (`SEGUIMIENTO_CRM`); `interaccion` viene poblada en el detalle. */
export interface Seguimiento {
  idSeguimientoCrm: number
  idInteraccion: number
  interaccion?: Interaccion
  fechaProgramada: string
  accionRequerida: string
  estado: EstadoSeguimiento
}

/** Evento de la vista 360° (`HISTORIAL_CLIENTE`), escrito por los listeners del bus interno. */
export interface Historial {
  idHistorial: number
  idCliente: number
  fecha: string
  tipoEvento: string
  descripcion: string
}

/** Snapshot del maestro externo de clientes; `email` puede venir nulo. */
export interface ClienteMaestro {
  idCliente: number
  rut: string
  nombre: string
  email: string | null
}

/** Snapshot del maestro de empleados (mock hasta que exista el módulo RRHH). */
export interface EmpleadoMaestro {
  idEmpleado: number
  nombre: string
  cargo: string | null
}

/** Body de `POST /api/interacciones`; los IDs deben existir si la validación está activa. */
export interface CreateInteraccionDto {
  idCliente: number
  idEmpleado: number
  fecha: string
  canal: string
  detalle: string
}

/** Body de `POST /api/seguimientos`; la interacción referenciada debe existir. */
export interface CreateSeguimientoDto {
  idInteraccion: number
  fechaProgramada: string
  accionRequerida: string
}

export interface UpdateSeguimientoEstadoDto {
  estado: EstadoSeguimiento
}

export interface ListInteraccionesFilters {
  idCliente?: number
  idEmpleado?: number
  canal?: string
  desde?: string
  hasta?: string
}

export interface ListSeguimientosFilters {
  idInteraccion?: number
  idCliente?: number
  estado?: EstadoSeguimiento
  desde?: string
  hasta?: string
}

export interface HealthResponse {
  status: string
  service: string
  module: string
}

export interface HealthDbResponse {
  status: string
  db: string
}

export interface EstadoRow {
  estado: string
  total: number
}

export interface CasoAbiertoRow {
  idEmpleado: number
  abiertos: number
}

export interface CanalRow {
  canal: string
  total: number
}

/**
 * Métricas de `GET /api/reportes/resumen`.
 * `tiempoRespuestaPromedioDias` es planificado (`fechaProgramada - fecha`), no
 * tiempo real de respuesta, porque el esquema no guarda fecha de completado.
 */
export interface ResumenReporte {
  generadoEn: string
  seguimientosPorEstado: EstadoRow[]
  tiempoRespuestaPromedioDias: number | null
  seguimientosCompletados: number
  casosAbiertosPorEmpleado: CasoAbiertoRow[]
  interaccionesPorCanal: CanalRow[]
}

/**
 * Sobre común de integración. `source` identifica al módulo emisor y el
 * `payload` queda a cargo de cada tipo de evento.
 */
export interface EventEnvelope {
  id?: string
  source: string
  type: KnownEventType
  occurredAt?: string
  version?: string
  payload: Record<string, unknown>
}

export interface IngestEventResponse {
  accepted: boolean
  eventId: string
  type: string
}

export interface MockReceiverResponse {
  accepted: boolean
  eventId: string | null
  type: string
}

/** Bitácora en memoria del Mock ERP, agrupada por receptor. */
export interface MockEventsResponse {
  inbound: EventEnvelope[]
  facturacion: EventEnvelope[]
  inventario: EventEnvelope[]
}

export interface ClearResponse {
  cleared: true
}

export interface ApiErrorBody {
  statusCode?: number
  message?: string | string[]
  error?: string
  errors?: string[]
}
