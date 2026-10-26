/** Subconjunto del maestro de clientes que el CRM necesita para validar identidad. */
export interface ClienteMaestro {
  idCliente: number;
  rut: string;
  nombre: string;
  email: string | null;
}

/** Subconjunto del maestro de empleados que el CRM necesita para validar identidad. */
export interface EmpleadoMaestro {
  idEmpleado: number;
  nombre: string;
  cargo: string | null;
}

/** El maestro externo no está configurado, no responde o devolvió un error. */
export class MaestroNoDisponibleError extends Error {
  constructor(message = 'El maestro externo no está disponible') {
    super(message);
    this.name = 'MaestroNoDisponibleError';
  }
}

/**
 * Puerto de salida para el maestro de clientes.
 * El adaptador puede leer la base compartida, un servicio HTTP o datos mock.
 */
export interface ClienteMaestroPort {
  findAll(): Promise<ClienteMaestro[]>;
  findById(id: number): Promise<ClienteMaestro | null>;
  findByRut(rut: string): Promise<ClienteMaestro | null>;
}

/** Puerto de salida para el maestro de empleados. */
export interface EmpleadoMaestroPort {
  findById(id: number): Promise<EmpleadoMaestro | null>;
}

export const CLIENTE_MAESTRO_PORT = Symbol('CLIENTE_MAESTRO_PORT');
export const EMPLEADO_MAESTRO_PORT = Symbol('EMPLEADO_MAESTRO_PORT');
