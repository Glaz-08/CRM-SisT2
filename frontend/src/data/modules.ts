import type { BrickColor } from '../styles/ui'

export const CRM_PREFIX = 'crm'
/** Id único dentro del ERP, p. ej. crmId('clientes') → "crm-clientes". */
export const crmId = (name: string): string => `${CRM_PREFIX}-${name}`
/** Ancla para usar en href, p. ej. crmHref('clientes') → "#crm-clientes". */
export const crmHref = (name: string): string => `#${crmId(name)}`

/**
 * Catálogo único de módulos: alimenta el header, el sidebar, el dashboard y el
 * conteo de registros. Mantener `path` sincronizado con `src/router.tsx`.
 */
export type CrmModule = {
  id: string
  name: string
  description: string
  method: 'GET' | 'POST'
  endpoint: string
  path: string
  color: BrickColor
  /** true si el endpoint devuelve una lista que se puede contar. */
  countable: boolean
}

/** Orden de navegación y de las tarjetas del dashboard. */
export const crmModules: CrmModule[] = [
  {
    id: 'clientes',
    name: 'Clientes',
    description: 'Ficha de cada cliente del ecommerce, validada por RUT o ID.',
    method: 'GET',
    endpoint: '/clientes',
    path: '/clientes',
    color: 'red',
    countable: false,
  },
  {
    id: 'interacciones',
    name: 'Interacciones',
    description: 'Cada contacto con un cliente: compras, consultas y reclamos.',
    method: 'GET',
    endpoint: '/interacciones',
    path: '/interacciones',
    color: 'blue',
    countable: true,
  },
  {
    id: 'seguimientos',
    name: 'Seguimientos',
    description: 'Tareas pendientes con un cliente y su estado de avance.',
    method: 'GET',
    endpoint: '/seguimientos',
    path: '/seguimientos',
    color: 'yellow',
    countable: true,
  },
  {
    id: 'historial',
    name: 'Historial',
    description: 'Vista 360° con todo lo que ha pasado con cada cliente.',
    method: 'GET',
    endpoint: '/historial',
    path: '/historial',
    color: 'green',
    countable: true,
  },
  {
    id: 'reportes',
    name: 'Reportes',
    description: 'Métricas de seguimientos, tiempos de respuesta y canales.',
    method: 'GET',
    endpoint: '/reportes/resumen',
    path: '/reportes',
    color: 'blue',
    countable: false,
  },
  {
    id: 'integracion',
    name: 'Integración',
    description: 'Recibe los eventos que envían los otros módulos del ERP.',
    method: 'POST',
    endpoint: '/events',
    path: '/integracion',
    color: 'orange',
    countable: false,
  },
  {
    id: 'mock-erp',
    name: 'Mock ERP',
    description: 'Consola de demo para inspeccionar clientes, empleados y eventos.',
    method: 'GET',
    endpoint: '/mock/events',
    path: '/mock-erp',
    color: 'red',
    countable: false,
  },
]
