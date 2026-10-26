import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventEnvelope } from '../contracts/events/event-envelope.dto';

/** Publica en el bus interno de Nest para que los listeners del mismo proceso reaccionen. */
@Injectable()
export class NestEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: EventEnvelope): Promise<void> {
    await this.eventEmitter.emitAsync(event.type, event);
  }
}
