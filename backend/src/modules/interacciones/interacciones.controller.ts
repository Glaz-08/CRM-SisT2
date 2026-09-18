import { Controller, Get } from '@nestjs/common';
import { InteraccionesService } from './interacciones.service';
import { Interaccion } from './entities/interaccion.entity';

@Controller('interacciones')
export class InteraccionesController {
  constructor(private readonly interaccionesService: InteraccionesService) {}

  @Get()
  findAll(): Promise<Interaccion[]> {
    return this.interaccionesService.findAll();
  }
}
