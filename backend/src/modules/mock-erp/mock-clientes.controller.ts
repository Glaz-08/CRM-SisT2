import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MOCK_CLIENTES } from '../../common/adapters/mock-cliente-maestro.adapter';
import type { ClienteMaestro } from '../../common/ports/maestro.port';
import { MockEnabledGuard } from './mock-enabled.guard';

/** Maestro mock de clientes para demos y entornos sin `master.cliente`. */
@Controller('mock/clientes')
@UseGuards(MockEnabledGuard)
export class MockClientesController {
  @Get()
  findAll(): ClienteMaestro[] {
    return MOCK_CLIENTES.map((cliente) => ({ ...cliente }));
  }

  @Get('rut/:rut')
  findByRut(@Param('rut') rut: string): ClienteMaestro {
    const normalized = rut.replace(/\./g, '').trim().toLowerCase();
    const cliente = MOCK_CLIENTES.find(
      (item) => item.rut.replace(/\./g, '').trim().toLowerCase() === normalized,
    );

    if (!cliente) {
      throw new NotFoundException(`Cliente con RUT ${rut} no encontrado`);
    }

    return { ...cliente };
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): ClienteMaestro {
    const cliente = MOCK_CLIENTES.find((item) => item.idCliente === id);

    if (!cliente) {
      throw new NotFoundException(`Cliente ${id} no encontrado`);
    }

    return { ...cliente };
  }
}
