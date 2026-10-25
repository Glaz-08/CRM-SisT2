import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function toBoolean(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function databaseConfig(config: ConfigService): TypeOrmModuleOptions {
  const ssl = toBoolean(config.get<string>('DB_SSL'), true);

  return {
    type: 'postgres',
    host: config.getOrThrow<string>('DB_HOST'),
    port: Number(config.get<string>('DB_PORT', '5432')),
    database: config.getOrThrow<string>('DB_NAME'),
    username: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    schema: config.get<string>('DB_SCHEMA', 'crm'),
    ssl: ssl ? { rejectUnauthorized: true } : false,
    synchronize: toBoolean(config.get<string>('DB_SYNCHRONIZE'), false),
    autoLoadEntities: true,
  };
}
