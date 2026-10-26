import { Injectable } from '@nestjs/common';
import { EventEnvelopeDto } from '../../common/contracts/events/event-envelope.dto';

export type MockTarget = 'facturacion' | 'inventario';

const MAX_EVENTS = 100;

/** Almacena en memoria los últimos eventos recibidos por cada mock externo. */
@Injectable()
export class MockEventStoreService {
  private readonly events: Record<MockTarget, EventEnvelopeDto[]> = {
    facturacion: [],
    inventario: [],
  };

  record(target: MockTarget, event: EventEnvelopeDto): void {
    this.events[target].unshift(event);
    if (this.events[target].length > MAX_EVENTS) {
      this.events[target].pop();
    }
  }

  list(target: MockTarget): EventEnvelopeDto[] {
    return [...this.events[target]];
  }

  listAll(): Record<MockTarget, EventEnvelopeDto[]> {
    return {
      facturacion: this.list('facturacion'),
      inventario: this.list('inventario'),
    };
  }

  clear(target?: MockTarget): void {
    if (target) {
      this.events[target] = [];
      return;
    }

    this.events.facturacion = [];
    this.events.inventario = [];
  }
}
