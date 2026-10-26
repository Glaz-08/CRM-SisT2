/** Estados permitidos por el CHECK de `crm.seguimiento_crm`. */
export const ESTADOS_SEGUIMIENTO = [
  'pendiente',
  'en_proceso',
  'completado',
  'cancelado',
] as const;

export type EstadoSeguimiento = (typeof ESTADOS_SEGUIMIENTO)[number];
