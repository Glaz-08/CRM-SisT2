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

/** Webhook simulado de inventario; solo acepta `cliente.actualizado`. */
@Controller('mock/inventario')
@UseGuards(MockEnabledGuard)
export class MockInventarioController {
  constructor(private readonly store: MockEventStoreService) {}

  @Post('clientes')
  @HttpCode(HttpStatus.ACCEPTED)
  receive(@Body() event: EventEnvelopeDto) {
    if (event.type !== 'cliente.actualizado') {
      throw new BadRequestException(
        `Inventario solo acepta cliente.actualizado, recibió ${event.type}`,
      );
    }

    this.store.record('inventario', event);

    return {
      accepted: true,
      eventId: event.id ?? null,
      type: event.type,
    };
  }

  @Get('clientes')
  list(): EventEnvelopeDto[] {
    return this.store.list('inventario');
  }

  @Delete('clientes')
  clear(): { cleared: true } {
    this.store.clear('inventario');
    return { cleared: true };
  }
}
