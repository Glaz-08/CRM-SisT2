import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

/** Expone una verificación liviana de la conexión con PostgreSQL. */
@Controller('health')
export class HealthDbController {
  private readonly logger = new Logger(HealthDbController.name);

  constructor(private readonly dataSource: DataSource) {}

  @Get('db')
  async check(): Promise<{ status: string; db: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', db: 'up' };
    } catch (error) {
      this.logger.error(
        `Base de datos no disponible: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
  }
}
