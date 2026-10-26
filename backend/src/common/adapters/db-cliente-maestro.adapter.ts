import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  ClienteMaestro,
  ClienteMaestroPort,
  MaestroNoDisponibleError,
} from '../ports/maestro.port';

interface ClienteMaestroRow {
  id_cliente: number | string | null;
  rut: string | null;
  nombre: string | null;
  correo: string | null;
}

/**
 * Adaptador de solo lectura para el maestro real de clientes.
 *
 * La tabla vive en el esquema `master` de la misma base que el CRM. No se
 * registra como entidad de TypeORM para evitar que `synchronize` o las
 * migraciones puedan modificarla.
 */
@Injectable()
export class DbClienteMaestroAdapter implements ClienteMaestroPort {
  private readonly logger = new Logger(DbClienteMaestroAdapter.name);

  constructor(private readonly dataSource: DataSource) {}

  /** Normaliza la fila SQL y descarta registros sin un id utilizable. */
  private mapCliente(row: ClienteMaestroRow): ClienteMaestro | null {
    const id = Number(row.id_cliente);

    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }

    return {
      idCliente: id,
      rut: row.rut ?? '',
      nombre: row.nombre ?? '',
      email: row.correo ?? null,
    };
  }

  /**
   * Ejecuta una consulta de solo lectura y traduce fallas de infraestructura
   * para que la API responda 503 en lugar de exponer errores de PostgreSQL.
   */
  private async query<T>(
    sql: string,
    parameters: unknown[] = [],
  ): Promise<T[]> {
    try {
      return await this.dataSource.query<T[]>(sql, parameters);
    } catch (error) {
      this.logger.warn(
        `No se pudo consultar "master"."cliente": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new MaestroNoDisponibleError(
        'No se pudo consultar el maestro de clientes',
      );
    }
  }

  async findAll(): Promise<ClienteMaestro[]> {
    const rows = await this.query<ClienteMaestroRow>(`
      SELECT id_cliente, rut, nombre, correo
      FROM "master"."cliente"
      ORDER BY id_cliente
    `);

    return rows
      .map((row) => this.mapCliente(row))
      .filter((cliente): cliente is ClienteMaestro => cliente !== null);
  }

  async findById(id: number): Promise<ClienteMaestro | null> {
    const rows = await this.query<ClienteMaestroRow>(
      `
        SELECT id_cliente, rut, nombre, correo
        FROM "master"."cliente"
        WHERE id_cliente = $1
        LIMIT 1
      `,
      [id],
    );

    const row = rows[0];
    return row ? this.mapCliente(row) : null;
  }

  async findByRut(rut: string): Promise<ClienteMaestro | null> {
    const normalized = this.normalizeRut(rut);

    if (!normalized) {
      return null;
    }

    const rows = await this.query<ClienteMaestroRow>(
      `
        SELECT id_cliente, rut, nombre, correo
        FROM "master"."cliente"
        WHERE regexp_replace(upper(rut), '[^0-9K]', '', 'g') = $1
        ORDER BY id_cliente
        LIMIT 2
      `,
      [normalized],
    );

    if (rows.length > 1) {
      this.logger.warn(
        `Hay más de un cliente con el RUT normalizado ${normalized}; se usa el de menor id`,
      );
    }

    const row = rows[0];
    return row ? this.mapCliente(row) : null;
  }

  /** Deja solo dígitos y K para comparar RUT con o sin puntos/guiones. */
  private normalizeRut(rut: string): string {
    return rut
      .trim()
      .toUpperCase()
      .replace(/[^0-9K]/g, '');
  }
}
