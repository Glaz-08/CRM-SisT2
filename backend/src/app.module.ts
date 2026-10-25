import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthModule } from './health/health.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { InteraccionesModule } from './modules/interacciones/interacciones.module';
import { SeguimientosModule } from './modules/seguimientos/seguimientos.module';
import { HistorialModule } from './modules/historial/historial.module';
import { IntegracionModule } from './modules/integracion/integracion.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    HealthModule,
    ClientesModule,
    InteraccionesModule,
    SeguimientosModule,
    HistorialModule,
    IntegracionModule,
  ],
})
export class AppModule {}
