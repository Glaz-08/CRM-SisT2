import { Controller, Get } from '@nestjs/common';
import { SeguimientosService } from './seguimientos.service';
import { Seguimiento } from './entities/seguimiento.entity';

@Controller('seguimientos')
export class SeguimientosController {
  constructor(private readonly seguimientosService: SeguimientosService) {}

  @Get()
  findAll(): Promise<Seguimiento[]> {
    return this.seguimientosService.findAll();
  }
}
