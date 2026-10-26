import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesModule } from '../clientes/clientes.module';
import { HistorialModule } from '../historial/historial.module';
import { Interaccion } from './entities/interaccion.entity';
import { InteraccionesController } from './interacciones.controller';
import { InteraccionesService } from './interacciones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Interaccion]),
    ClientesModule,
    HistorialModule,
  ],
  controllers: [InteraccionesController],
  providers: [InteraccionesService],
  exports: [InteraccionesService],
})
export class InteraccionesModule {}
