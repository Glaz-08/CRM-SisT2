import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbClienteMaestroAdapter } from '../../common/adapters/db-cliente-maestro.adapter';
import { HttpClienteMaestroAdapter } from '../../common/adapters/http-cliente-maestro.adapter';
import { HttpEmpleadoMaestroAdapter } from '../../common/adapters/http-empleado-maestro.adapter';
import { MockClienteMaestroAdapter } from '../../common/adapters/mock-cliente-maestro.adapter';
import { MockEmpleadoMaestroAdapter } from '../../common/adapters/mock-empleado-maestro.adapter';
import {
  CLIENTE_MAESTRO_PORT,
  EMPLEADO_MAESTRO_PORT,
} from '../../common/ports/maestro.port';
import { HistorialModule } from '../historial/historial.module';
import { ClientesController } from './clientes.controller';
import { ClientesListener } from './clientes.listener';
import { MaestrosService } from './maestros.service';

/** Lee el modo específico y cae al valor histórico `MAESTROS_MODE` si no existe. */
function configuredMode(
  config: ConfigService,
  key: string,
  fallback: string,
): string {
  return (
    config.get<string>(key) ?? config.get<string>('MAESTROS_MODE', fallback)
  )
    .trim()
    .toLowerCase();
}

/** Selecciona el adaptador de clientes sin acoplar los servicios al origen del dato. */
function selectClienteAdapter(
  config: ConfigService,
  mock: MockClienteMaestroAdapter,
  http: HttpClienteMaestroAdapter,
  db: DbClienteMaestroAdapter,
):
  | MockClienteMaestroAdapter
  | HttpClienteMaestroAdapter
  | DbClienteMaestroAdapter {
  switch (configuredMode(config, 'CLIENTE_MAESTRO_MODE', 'mock')) {
    case 'db':
      return db;
    case 'http':
      return http;
    case 'mock':
      return mock;
    default:
      throw new Error('CLIENTE_MAESTRO_MODE debe ser "db", "http" o "mock"');
  }
}

/**
 * Selecciona el adaptador de empleados.
 * `db` no está soportado todavía porque `RRHH` no existe en `si2_22026`.
 */
function selectEmpleadoAdapter(
  config: ConfigService,
  mock: MockEmpleadoMaestroAdapter,
  http: HttpEmpleadoMaestroAdapter,
): MockEmpleadoMaestroAdapter | HttpEmpleadoMaestroAdapter {
  const mode = (
    config.get<string>('EMPLEADO_MAESTRO_MODE') ??
    (config.get<string>('MAESTROS_MODE', 'mock').trim().toLowerCase() === 'http'
      ? 'http'
      : 'mock')
  )
    .trim()
    .toLowerCase();

  switch (mode) {
    case 'http':
      return http;
    case 'mock':
      return mock;
    default:
      throw new Error(
        'EMPLEADO_MAESTRO_MODE debe ser "http" o "mock" mientras no exista el maestro RRHH',
      );
  }
}

/**
 * Módulo de maestros: expone consultas de clientes y publica el listener de
 * `cliente.actualizado`. Los adaptadores concretos se eligen por configuración.
 */
@Module({
  imports: [HistorialModule],
  controllers: [ClientesController],
  providers: [
    MaestrosService,
    ClientesListener,
    MockClienteMaestroAdapter,
    HttpClienteMaestroAdapter,
    DbClienteMaestroAdapter,
    MockEmpleadoMaestroAdapter,
    HttpEmpleadoMaestroAdapter,
    {
      provide: CLIENTE_MAESTRO_PORT,
      inject: [
        ConfigService,
        MockClienteMaestroAdapter,
        HttpClienteMaestroAdapter,
        DbClienteMaestroAdapter,
      ],
      useFactory: selectClienteAdapter,
    },
    {
      provide: EMPLEADO_MAESTRO_PORT,
      inject: [
        ConfigService,
        MockEmpleadoMaestroAdapter,
        HttpEmpleadoMaestroAdapter,
      ],
      useFactory: selectEmpleadoAdapter,
    },
  ],
  exports: [MaestrosService, CLIENTE_MAESTRO_PORT, EMPLEADO_MAESTRO_PORT],
})
export class ClientesModule {}
