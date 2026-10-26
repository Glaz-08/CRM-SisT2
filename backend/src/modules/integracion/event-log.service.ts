import { Injectable } from '@nestjs/common';
import type { EventEnvelope } from '../../common/contracts/events/event-envelope.dto';

const MAX_EVENTS = 100;

/** Bitácora en memoria para poder inspeccionar la ingesta durante la demo. */
@Injectable()
export class EventLogService {
  private readonly events: EventEnvelope[] = [];

  record(event: EventEnvelope): void {
    this.events.unshift(event);
    if (this.events.length > MAX_EVENTS) {
      this.events.pop();
    }
  }

  list(): EventEnvelope[] {
    return [...this.events];
  }

  clear(): void {
    this.events.length = 0;
  }
}
