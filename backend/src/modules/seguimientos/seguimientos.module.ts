import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventingModule } from '../../common/eventing.module';
import { HistorialModule } from '../historial/historial.module';
import { Interaccion } from '../interacciones/entities/interaccion.entity';
import { Seguimiento } from './entities/seguimiento.entity';
import { SeguimientosController } from './seguimientos.controller';
import { SeguimientosService } from './seguimientos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Seguimiento, Interaccion]),
    HistorialModule,
    EventingModule,
  ],
  controllers: [SeguimientosController],
  providers: [SeguimientosService],
  exports: [SeguimientosService],
})
export class SeguimientosModule {}
