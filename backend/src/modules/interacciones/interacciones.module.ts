import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interaccion } from './entities/interaccion.entity';
import { InteraccionesController } from './interacciones.controller';
import { InteraccionesService } from './interacciones.service';

@Module({
  imports: [TypeOrmModule.forFeature([Interaccion])],
  controllers: [InteraccionesController],
  providers: [InteraccionesService],
  exports: [InteraccionesService],
})
export class InteraccionesModule {}
