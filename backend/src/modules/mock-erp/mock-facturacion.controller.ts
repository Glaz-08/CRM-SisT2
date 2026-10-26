import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EventEnvelopeDto } from '../../common/contracts/events/event-envelope.dto';
import { MockEnabledGuard } from './mock-enabled.guard';
import { MockEventStoreService } from './mock-event-store.service';

/** Webhook simulado de facturación; solo acepta `seguimiento.creado`. */
@Controller('mock/facturacion')
@UseGuards(MockEnabledGuard)
export class MockFacturacionController {
  constructor(private readonly store: MockEventStoreService) {}

  @Post('seguimientos')
  @HttpCode(HttpStatus.ACCEPTED)
  receive(@Body() event: EventEnvelopeDto) {
    if (event.type !== 'seguimiento.creado') {
      throw new BadRequestException(
        `Facturación solo acepta seguimiento.creado, recibió ${event.type}`,
      );
    }

    this.store.record('facturacion', event);

    return {
      accepted: true,
      eventId: event.id ?? null,
      type: event.type,
    };
  }

  @Get('seguimientos')
  list(): EventEnvelopeDto[] {
    return this.store.list('facturacion');
  }

  @Delete('seguimientos')
  clear(): { cleared: true } {
    this.store.clear('facturacion');
    return { cleared: true };
  }
}
