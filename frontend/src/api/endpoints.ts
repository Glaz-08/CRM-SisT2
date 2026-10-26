import { apiClient, buildQuery } from './client'
import type {
  ClearResponse,
  ClienteMaestro,
  CreateInteraccionDto,
  CreateSeguimientoDto,
  EmpleadoMaestro,
  EstadoSeguimiento,
  EventEnvelope,
  HealthDbResponse,
  HealthResponse,
  Historial,
  IngestEventResponse,
  Interaccion,
  ListInteraccionesFilters,
  ListSeguimientosFilters,
  MockEventsResponse,
  MockReceiverResponse,
  ResumenReporte,
  Seguimiento,
  UpdateSeguimientoEstadoDto,
} from './types'

/** IDs numéricos y RUT viajan en la ruta; se codifican porque el RUT trae puntos y guion. */
const id = (value: number): string => encodeURIComponent(String(value))
const rutPath = (rut: string): string => encodeURIComponent(rut)

/**
 * Única definición de rutas de la API. Refleja `docs/api.json` y agrupa cada
 * operación por módulo para que las páginas no escriban URLs a mano.
 */
export const endpoints = {
  health: {
    check: () => apiClient.get<HealthResponse>('/health'),
    db: () => apiClient.get<HealthDbResponse>('/health/db'),
  },

  clientes: {
    list: () => apiClient.get<ClienteMaestro[]>('/clientes'),
    byId: (clienteId: number) =>
      apiClient.get<ClienteMaestro>(`/clientes/${id(clienteId)}`),
    byRut: (rut: string) =>
      apiClient.get<ClienteMaestro>(`/clientes/rut/${rutPath(rut)}`),
  },

  interacciones: {
    list: (filters: ListInteraccionesFilters = {}) =>
      apiClient.get<Interaccion[]>(
        `/interacciones${buildQuery({
          idCliente: filters.idCliente,
          idEmpleado: filters.idEmpleado,
          canal: filters.canal,
          desde: filters.desde,
          hasta: filters.hasta,
        })}`,
      ),
    byId: (interaccionId: number) =>
      apiClient.get<Interaccion>(`/interacciones/${id(interaccionId)}`),
    create: (dto: CreateInteraccionDto) =>
      apiClient.post<Interaccion>('/interacciones', dto),
  },

  seguimientos: {
    list: (filters: ListSeguimientosFilters = {}) =>
      apiClient.get<Seguimiento[]>(
        `/seguimientos${buildQuery({
          idInteraccion: filters.idInteraccion,
          idCliente: filters.idCliente,
          estado: filters.estado,
          desde: filters.desde,
          hasta: filters.hasta,
        })}`,
      ),
    byId: (seguimientoId: number) =>
      apiClient.get<Seguimiento>(`/seguimientos/${id(seguimientoId)}`),
    create: (dto: CreateSeguimientoDto) =>
      apiClient.post<Seguimiento>('/seguimientos', dto),
    updateEstado: (seguimientoId: number, estado: EstadoSeguimiento) => {
      const dto: UpdateSeguimientoEstadoDto = { estado }
      return apiClient.patch<Seguimiento>(
        `/seguimientos/${id(seguimientoId)}/estado`,
        dto,
      )
    },
  },

  historial: {
    list: () => apiClient.get<Historial[]>('/historial'),
    byCliente: (clienteId: number) =>
      apiClient.get<Historial[]>(`/historial/cliente/${id(clienteId)}`),
  },

  reportes: {
    resumen: () => apiClient.get<ResumenReporte>('/reportes/resumen'),
  },

  events: {
    ingest: (event: EventEnvelope) =>
      apiClient.post<IngestEventResponse>('/events', event),
  },

  mock: {
    clientes: {
      list: () => apiClient.get<ClienteMaestro[]>('/mock/clientes'),
      byId: (clienteId: number) =>
        apiClient.get<ClienteMaestro>(`/mock/clientes/${id(clienteId)}`),
      byRut: (rut: string) =>
        apiClient.get<ClienteMaestro>(`/mock/clientes/rut/${rutPath(rut)}`),
    },
    empleados: {
      list: () => apiClient.get<EmpleadoMaestro[]>('/mock/empleados'),
      byId: (empleadoId: number) =>
        apiClient.get<EmpleadoMaestro>(`/mock/empleados/${id(empleadoId)}`),
    },
    facturacion: {
      list: () =>
        apiClient.get<EventEnvelope[]>('/mock/facturacion/seguimientos'),
      receive: (event: EventEnvelope) =>
        apiClient.post<MockReceiverResponse>(
          '/mock/facturacion/seguimientos',
          event,
        ),
      clear: () =>
        apiClient.delete<ClearResponse>('/mock/facturacion/seguimientos'),
    },
    inventario: {
      list: () => apiClient.get<EventEnvelope[]>('/mock/inventario/clientes'),
      receive: (event: EventEnvelope) =>
        apiClient.post<MockReceiverResponse>(
          '/mock/inventario/clientes',
          event,
        ),
      clear: () => apiClient.delete<ClearResponse>('/mock/inventario/clientes'),
    },
    events: {
      list: () => apiClient.get<MockEventsResponse>('/mock/events'),
      clear: () => apiClient.delete<ClearResponse>('/mock/events'),
    },
  },
}
