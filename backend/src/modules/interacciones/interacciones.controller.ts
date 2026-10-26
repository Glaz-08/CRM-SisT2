import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateInteraccionDto } from './dto/create-interaccion.dto';
import { ListInteraccionesQueryDto } from './dto/list-interacciones-query.dto';
import { Interaccion } from './entities/interaccion.entity';
import { InteraccionesService } from './interacciones.service';

/** Endpoints REST para registrar y consultar interacciones. */
@Controller('interacciones')
export class InteraccionesController {
  constructor(private readonly interaccionesService: InteraccionesService) {}

  @Post()
  create(@Body() dto: CreateInteraccionDto): Promise<Interaccion> {
    return this.interaccionesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListInteraccionesQueryDto): Promise<Interaccion[]> {
    return this.interaccionesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Interaccion> {
    return this.interaccionesService.findOne(id);
  }
}
