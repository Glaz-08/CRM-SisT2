import { Controller, Get } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import type { ResumenReporte } from './reportes.service';

/** Endpoint de resumen operativo del CRM. */
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('resumen')
  resumen(): Promise<ResumenReporte> {
    return this.reportesService.resumen();
  }
}
