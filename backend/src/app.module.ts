import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { HealthDbModule } from './health/health-db.module';
import { HealthModule } from './health/health.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { HistorialModule } from './modules/historial/historial.module';
import { IntegracionModule } from './modules/integracion/integracion.module';
import { InteraccionesModule } from './modules/interacciones/interacciones.module';
import { MockErpModule } from './modules/mock-erp/mock-erp.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { SeguimientosModule } from './modules/seguimientos/seguimientos.module';

/** Módulo raíz: configura la base compartida, el bus de eventos y los dominios del CRM. */
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
    HealthDbModule,
    ClientesModule,
    InteraccionesModule,
    SeguimientosModule,
    HistorialModule,
    ReportesModule,
    IntegracionModule,
    MockErpModule,
  ],
})
export class AppModule {}
