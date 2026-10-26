import { Module } from '@nestjs/common';
import { IntegracionController } from './integracion.controller';
import { IntegracionListener } from './integracion.listener';
import { IntegracionService } from './integracion.service';
import { EventLogService } from './event-log.service';

/** Ingesta de eventos y bitácora en memoria para la demo. */
@Module({
  controllers: [IntegracionController],
  providers: [IntegracionService, IntegracionListener, EventLogService],
  exports: [EventLogService],
})
export class IntegracionModule {}
