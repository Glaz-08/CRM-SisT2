import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MOCK_EMPLEADOS } from '../../common/adapters/mock-empleado-maestro.adapter';
import type { EmpleadoMaestro } from '../../common/ports/maestro.port';
import { MockEnabledGuard } from './mock-enabled.guard';

/** Maestro mock de empleados para demos mientras no exista RRHH. */
@Controller('mock/empleados')
@UseGuards(MockEnabledGuard)
export class MockEmpleadosController {
  @Get()
  findAll(): EmpleadoMaestro[] {
    return MOCK_EMPLEADOS.map((empleado) => ({ ...empleado }));
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): EmpleadoMaestro {
    const empleado = MOCK_EMPLEADOS.find((item) => item.idEmpleado === id);

    if (!empleado) {
      throw new NotFoundException(`Empleado ${id} no encontrado`);
    }

    return { ...empleado };
  }
}
