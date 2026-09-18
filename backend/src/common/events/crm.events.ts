export const CrmEvents = {
  PAYLOAD_RECEIVED: 'crm.payload.received',
  CLIENTE_VALIDADO: 'crm.cliente.validado',
  INTERACCION_REGISTRADA: 'crm.interaccion.registrada',
  SEGUIMIENTO_PROGRAMADO: 'crm.seguimiento.programado',
  HISTORIAL_ACTUALIZADO: 'crm.historial.actualizado',
} as const;

export type CrmEventName = (typeof CrmEvents)[keyof typeof CrmEvents];
