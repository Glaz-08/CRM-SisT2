import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Historial } from './entities/historial.entity';
import { HistorialService } from './historial.service';

/** Consulta del historial global y por cliente. */
@Controller('historial')
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Get()
  findAll(): Promise<Historial[]> {
    return this.historialService.findAll();
  }

  @Get('cliente/:idCliente')
  findByCliente(
    @Param('idCliente', ParseIntPipe) idCliente: number,
  ): Promise<Historial[]> {
    return this.historialService.findByCliente(idCliente);
  }
}
