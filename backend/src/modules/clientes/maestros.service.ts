import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  CLIENTE_MAESTRO_PORT,
  EMPLEADO_MAESTRO_PORT,
  MaestroNoDisponibleError,
} from '../../common/ports/maestro.port';
import type {
  ClienteMaestro,
  ClienteMaestroPort,
  EmpleadoMaestro,
  EmpleadoMaestroPort,
} from '../../common/ports/maestro.port';

/**
 * Fachada de los maestros externos. El CRM no es dueño de cliente/empleado:
 * solo consulta y valida que la identidad exista antes de registrar datos.
 */
@Injectable()
export class MaestrosService {
  constructor(
    @Inject(CLIENTE_MAESTRO_PORT)
    private readonly clientes: ClienteMaestroPort,
    @Inject(EMPLEADO_MAESTRO_PORT)
    private readonly empleados: EmpleadoMaestroPort,
  ) {}

  private translate(error: unknown): never {
    if (error instanceof MaestroNoDisponibleError) {
      throw new ServiceUnavailableException(error.message);
    }
    throw error;
  }

  async findAllClientes(): Promise<ClienteMaestro[]> {
    try {
      return await this.clientes.findAll();
    } catch (error) {
      this.translate(error);
    }
  }

  async findClienteById(id: number): Promise<ClienteMaestro> {
    return this.assertClienteExists(id);
  }

  /** Busca por RUT y responde 404 cuando no existe. */
  async findClienteByRut(rut: string): Promise<ClienteMaestro> {
    let cliente: ClienteMaestro | null;
    try {
      cliente = await this.clientes.findByRut(rut);
    } catch (error) {
      this.translate(error);
    }

    if (!cliente) {
      throw new NotFoundException(`Cliente con RUT ${rut} no encontrado`);
    }

    return cliente;
  }

  /** Valida la existencia de un cliente antes de asociarlo a datos del CRM. */
  async assertClienteExists(id: number): Promise<ClienteMaestro> {
    let cliente: ClienteMaestro | null;
    try {
      cliente = await this.clientes.findById(id);
    } catch (error) {
      this.translate(error);
    }

    if (!cliente) {
      throw new NotFoundException(
        `Cliente ${id} no existe en el maestro de clientes`,
      );
    }

    return cliente;
  }

  /** Valida la existencia de un empleado; no filtra por estado laboral. */
  async assertEmpleadoExists(id: number): Promise<EmpleadoMaestro> {
    let empleado: EmpleadoMaestro | null;
    try {
      empleado = await this.empleados.findById(id);
    } catch (error) {
      this.translate(error);
    }

    if (!empleado) {
      throw new NotFoundException(
        `Empleado ${id} no existe en el maestro de empleados`,
      );
    }

    return empleado;
  }
}
