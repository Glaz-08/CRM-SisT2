import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import type { ClienteMaestro } from '../../common/ports/maestro.port';
import { MaestrosService } from './maestros.service';

/** Consulta de solo lectura del maestro de clientes configurado. */
@Controller('clientes')
export class ClientesController {
  constructor(private readonly maestrosService: MaestrosService) {}

  @Get()
  findAll(): Promise<ClienteMaestro[]> {
    return this.maestrosService.findAllClientes();
  }

  @Get('rut/:rut')
  findByRut(@Param('rut') rut: string): Promise<ClienteMaestro> {
    return this.maestrosService.findClienteByRut(rut);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<ClienteMaestro> {
    return this.maestrosService.findClienteById(id);
  }
}
