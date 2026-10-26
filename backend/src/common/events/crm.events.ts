/** Nombres de eventos internos y de integración usados por el CRM. */
export const CrmEvents = {
  PAYLOAD_RECEIVED: 'crm.payload.received',
  CLIENTE_VALIDADO: 'crm.cliente.validado',
  INTERACCION_REGISTRADA: 'crm.interaccion.registrada',
  SEGUIMIENTO_CREADO: 'seguimiento.creado',
  SEGUIMIENTO_PROGRAMADO: 'crm.seguimiento.programado',
  HISTORIAL_ACTUALIZADO: 'crm.historial.actualizado',
  CLIENTE_ACTUALIZADO: 'cliente.actualizado',
  PEDIDO_CREADO: 'pedido.creado',
  RECLAMO_CREADO: 'reclamo.creado',
} as const;

export type CrmEventName = (typeof CrmEvents)[keyof typeof CrmEvents];
