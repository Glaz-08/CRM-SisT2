import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';
import { ListSeguimientosQueryDto } from './dto/list-seguimientos-query.dto';
import { UpdateSeguimientoEstadoDto } from './dto/update-seguimiento-estado.dto';
import { Seguimiento } from './entities/seguimiento.entity';
import { SeguimientosService } from './seguimientos.service';

/** Endpoints REST para crear, listar y actualizar seguimientos. */
@Controller('seguimientos')
export class SeguimientosController {
  constructor(private readonly seguimientosService: SeguimientosService) {}

  @Post()
  create(@Body() dto: CreateSeguimientoDto): Promise<Seguimiento> {
    return this.seguimientosService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListSeguimientosQueryDto): Promise<Seguimiento[]> {
    return this.seguimientosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Seguimiento> {
    return this.seguimientosService.findOne(id);
  }

  @Patch(':id/estado')
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSeguimientoEstadoDto,
  ): Promise<Seguimiento> {
    return this.seguimientosService.updateEstado(id, dto);
  }
}
