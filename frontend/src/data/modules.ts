import type { BrickColor } from '../styles/ui'

export const CRM_PREFIX = 'crm'
/** Id único dentro del ERP, p. ej. crmId('clientes') → "crm-clientes". */
export const crmId = (name: string): string => `${CRM_PREFIX}-${name}`
/** Ancla para usar en href, p. ej. crmHref('clientes') → "#crm-clientes". */
export const crmHref = (name: string): string => `#${crmId(name)}`

export type CrmModule = {
  id: string
  name: string
  description: string
  method: 'GET' | 'POST'
  endpoint: string
  color: BrickColor
  /** true si el endpoint devuelve una lista que se puede contar. */
  countable: boolean
}


export const crmModules: CrmModule[] = [
  {
    id: 'clientes',
    name: 'Clientes',
    description: 'Ficha de cada cliente del ecommerce, validada por RUT o ID.',
    method: 'GET',
    endpoint: '/clientes',
    color: 'red',
    countable: false, //cmo tdv no existeeee
  },
  {
    id: 'interacciones',
    name: 'Interacciones',
    description: 'Cada contacto con un cliente: compras, consultas y reclamos.',
    method: 'GET',
    endpoint: '/interacciones',
    color: 'blue',
    countable: true,
  },
  {
    id: 'seguimientos',
    name: 'Seguimientos',
    description: 'Tareas pendientes con un cliente y su estado de avance.',
    method: 'GET',
    endpoint: '/seguimientos',
    color: 'yellow',
    countable: true,
  },
  {
    id: 'historial',
    name: 'Historial',
    description: 'Vista 360° con todo lo que ha pasado con cada cliente.',
    method: 'GET',
    endpoint: '/historial',
    color: 'green',
    countable: true,
  },
  {
    id: 'integracion',
    name: 'Integración',
    description: 'Recibe los eventos que envían los otros módulos del ERP.',
    method: 'POST',
    endpoint: '/events',
    color: 'orange',
    countable: false,
  },
]
