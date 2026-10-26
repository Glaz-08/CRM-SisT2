import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClienteMaestro,
  ClienteMaestroPort,
  MaestroNoDisponibleError,
} from '../ports/maestro.port';

/**
 * Adaptador del maestro de clientes por HTTP.
 * Acepta respuestas planas o envueltas en `{ data: ... }` y tolera `correo` como alias de `email`.
 */
@Injectable()
export class HttpClienteMaestroAdapter implements ClienteMaestroPort {
  private readonly logger = new Logger(HttpClienteMaestroAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string | undefined {
    return this.config.get<string>('CLIENTE_MAESTRO_URL')?.replace(/\/$/, '');
  }

  private headers(): Record<string, string> {
    const apiKey = this.config.get<string>('INTEGRATION_API_KEY');
    return apiKey ? { 'X-API-Key': apiKey } : {};
  }

  /**
   * Consulta el maestro y normaliza 404 como ausencia de dato.
   * Cualquier error de red o respuesta inválida se traduce a 503 en la capa de servicio.
   */
  private async request(path: string): Promise<unknown> {
    const baseUrl = this.baseUrl;
    if (!baseUrl) {
      throw new MaestroNoDisponibleError(
        'CLIENTE_MAESTRO_URL no está configurada',
      );
    }

    const timeout = Number(this.config.get<string>('HTTP_TIMEOUT_MS', '3000'));

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(timeout),
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo consultar el maestro de clientes: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new MaestroNoDisponibleError(
        'No se pudo consultar el maestro de clientes',
      );
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new MaestroNoDisponibleError(
        `El maestro de clientes respondió HTTP ${response.status}`,
      );
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new MaestroNoDisponibleError(
        'El maestro de clientes devolvió una respuesta inválida',
      );
    }
  }

  private mapCliente(raw: unknown): ClienteMaestro | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const object = raw as Record<string, unknown>;
    const data = (
      object.data && typeof object.data === 'object' ? object.data : object
    ) as Record<string, unknown>;
    const id = Number(data.idCliente ?? data.id_cliente ?? data.id);

    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }

    const email = data.email ?? data.correo;

    return {
      idCliente: id,
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      rut: String(data.rut ?? ''),
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      nombre: String(data.nombre ?? ''),
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      email: email == null ? null : String(email),
    };
  }

  private mapList(raw: unknown): ClienteMaestro[] {
    if (Array.isArray(raw)) {
      return raw
        .map((row) => this.mapCliente(row))
        .filter((cliente): cliente is ClienteMaestro => cliente !== null);
    }

    if (raw && typeof raw === 'object') {
      const rows = (raw as Record<string, unknown>).data;
      if (Array.isArray(rows)) {
        return rows
          .map((row) => this.mapCliente(row))
          .filter((cliente): cliente is ClienteMaestro => cliente !== null);
      }
    }

    return [];
  }

  async findAll(): Promise<ClienteMaestro[]> {
    return this.mapList(await this.request(''));
  }

  async findById(id: number): Promise<ClienteMaestro | null> {
    return this.mapCliente(await this.request(`/${id}`));
  }

  async findByRut(rut: string): Promise<ClienteMaestro | null> {
    return this.mapCliente(
      await this.request(`/rut/${encodeURIComponent(rut)}`),
    );
  }
}
