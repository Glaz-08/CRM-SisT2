import { Controller, Get } from '@nestjs/common';
import { HistorialService } from './historial.service';
import { Historial } from './entities/historial.entity';

@Controller('historial')
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Get()
  findAll(): Promise<Historial[]> {
    return this.historialService.findAll();
  }
}
