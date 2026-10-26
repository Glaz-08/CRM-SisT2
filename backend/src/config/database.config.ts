import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { toBoolean } from '../common/config/env';

/**
 * Configura TypeORM contra la base compartida.
 * `synchronize` y `migrationsRun` quedan desactivados porque el CRM no es dueño
 * del esquema completo y no debe alterar tablas de otros módulos.
 */
export function databaseConfig(config: ConfigService): TypeOrmModuleOptions {
  const ssl = toBoolean(config.get<string>('DB_SSL'), true);
  const rejectUnauthorized = toBoolean(
    config.get<string>('DB_SSL_REJECT_UNAUTHORIZED'),
    true,
  );

  return {
    type: 'postgres',
    host: config.getOrThrow<string>('DB_HOST'),
    port: Number(config.get<string>('DB_PORT', '5432')),
    database: config.getOrThrow<string>('DB_NAME'),
    username: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    schema: config.get<string>('DB_SCHEMA', 'crm'),
    ssl: ssl ? { rejectUnauthorized } : false,
    // La base es compartida con otros grupos: TypeORM nunca crea ni altera tablas.
    synchronize: false,
    migrationsRun: false,
    autoLoadEntities: true,
    logging: toBoolean(config.get<string>('DB_LOGGING'), false),
    extra: {
      max: Number(config.get<string>('DB_POOL_MAX', '5')),
      connectionTimeoutMillis: Number(
        config.get<string>('DB_CONNECT_TIMEOUT_MS', '10000'),
      ),
    },
  };
}
