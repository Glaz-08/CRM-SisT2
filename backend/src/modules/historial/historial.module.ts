import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Historial } from './entities/historial.entity';
import { HistorialController } from './historial.controller';
import { HistorialService } from './historial.service';

@Module({
  imports: [TypeOrmModule.forFeature([Historial])],
  controllers: [HistorialController],
  providers: [HistorialService],
  exports: [HistorialService],
})
export class HistorialModule {}
