import { Module } from '@nestjs/common';
import { IntegracionController } from './integracion.controller';
import { IntegracionService } from './integracion.service';

@Module({
  controllers: [IntegracionController],
  providers: [IntegracionService],
})
export class IntegracionModule {}
