/* eslint-disable @typescript-eslint/no-base-to-string */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmpleadoMaestro,
  EmpleadoMaestroPort,
  MaestroNoDisponibleError,
} from '../ports/maestro.port';

/**
 * Adaptador del maestro de empleados por HTTP.
 * Se mantiene disponible para cuando RRHH exponga un servicio, pero el modo
 * operativo actual es `mock`.
 */
@Injectable()
export class HttpEmpleadoMaestroAdapter implements EmpleadoMaestroPort {
  private readonly logger = new Logger(HttpEmpleadoMaestroAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string | undefined {
    return this.config.get<string>('EMPLEADO_MAESTRO_URL')?.replace(/\/$/, '');
  }

  private headers(): Record<string, string> {
    const apiKey = this.config.get<string>('INTEGRATION_API_KEY');
    return apiKey ? { 'X-API-Key': apiKey } : {};
  }

  async findById(id: number): Promise<EmpleadoMaestro | null> {
    const baseUrl = this.baseUrl;
    if (!baseUrl) {
      throw new MaestroNoDisponibleError(
        'EMPLEADO_MAESTRO_URL no está configurada',
      );
    }

    const timeout = Number(this.config.get<string>('HTTP_TIMEOUT_MS', '3000'));

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/${id}`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(timeout),
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo consultar el maestro de empleados: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new MaestroNoDisponibleError(
        'No se pudo consultar el maestro de empleados',
      );
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new MaestroNoDisponibleError(
        `El maestro de empleados respondió HTTP ${response.status}`,
      );
    }

    const raw = (await response.json()) as unknown;
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const object = raw as Record<string, unknown>;
    const data = (
      object.data && typeof object.data === 'object' ? object.data : object
    ) as Record<string, unknown>;
    const idEmpleado = Number(data.idEmpleado ?? data.id_empleado ?? data.id);

    if (!Number.isFinite(idEmpleado) || idEmpleado <= 0) {
      return null;
    }

    return {
      idEmpleado,
      nombre: String(data.nombre ?? ''),
      cargo: data.cargo == null ? null : String(data.cargo),
    };
  }
}
