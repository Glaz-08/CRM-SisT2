import { Controller, Get } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { Cliente } from './entities/cliente.entity';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  findAll(): Promise<Cliente[]> {
    return this.clientesService.findAll();
  }
}
