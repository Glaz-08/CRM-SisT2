/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { EmpleadoMaestro, EmpleadoMaestroPort } from '../ports/maestro.port';

export const MOCK_EMPLEADOS: EmpleadoMaestro[] = [
  { idEmpleado: 1, nombre: 'Ejecutivo Demo 1', cargo: 'Ejecutivo CRM' },
  { idEmpleado: 2, nombre: 'Ejecutivo Demo 2', cargo: 'Ejecutivo CRM' },
  { idEmpleado: 3, nombre: 'Supervisor Demo', cargo: 'Supervisor CRM' },
];

/**
 * Adaptador en memoria del maestro de empleados.
 * Se usa mientras no exista el esquema RRHH en la base compartida.
 */
@Injectable()
export class MockEmpleadoMaestroAdapter implements EmpleadoMaestroPort {
  async findById(id: number): Promise<EmpleadoMaestro | null> {
    return (
      MOCK_EMPLEADOS.find((empleado) => empleado.idEmpleado === id) ?? null
    );
  }
}
