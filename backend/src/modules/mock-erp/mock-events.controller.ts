import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import type { EventEnvelope } from '../../common/contracts/events/event-envelope.dto';
import type { EventEnvelopeDto } from '../../common/contracts/events/event-envelope.dto';
import { EventLogService } from '../integracion/event-log.service';
import { MockEnabledGuard } from './mock-enabled.guard';
import { MockEventStoreService } from './mock-event-store.service';

/** Vista consolidada para inspeccionar la integración durante la demo. */
export interface MockEventsResponse {
  inbound: EventEnvelope[];
  facturacion: EventEnvelopeDto[];
  inventario: EventEnvelopeDto[];
}

/** Lista y limpia eventos inbound y de webhooks simulados. */
@Controller('mock/events')
@UseGuards(MockEnabledGuard)
export class MockEventsController {
  constructor(
    private readonly store: MockEventStoreService,
    private readonly eventLog: EventLogService,
  ) {}

  @Get()
  list(): MockEventsResponse {
    return {
      inbound: this.eventLog.list(),
      facturacion: this.store.list('facturacion'),
      inventario: this.store.list('inventario'),
    };
  }

  @Delete()
  clear(): { cleared: true } {
    this.store.clear();
    this.eventLog.clear();
    return { cleared: true };
  }
}
