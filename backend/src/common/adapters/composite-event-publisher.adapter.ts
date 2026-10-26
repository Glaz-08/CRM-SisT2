import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEnvelope } from '../contracts/events/event-envelope.dto';
import { EventPublisherPort, EventTarget } from '../ports/event-publisher.port';
import { HttpEventPublisher } from './http-event-publisher.adapter';
import { NestEventPublisher } from './nest-event-publisher.adapter';

/**
 * Publica siempre en el bus interno y, si está configurado, también por HTTP.
 * El fallo del webhook se propaga para que el servicio que publica lo registre;
 * la transacción de negocio ya está confirmada.
 */
@Injectable()
export class CompositeEventPublisher implements EventPublisherPort {
  private readonly logger = new Logger(CompositeEventPublisher.name);

  constructor(
    private readonly nestPublisher: NestEventPublisher,
    private readonly httpPublisher: HttpEventPublisher,
    private readonly config: ConfigService,
  ) {}

  async publish(event: EventEnvelope, target?: EventTarget): Promise<void> {
    await this.nestPublisher.publish(event);

    if (!target) {
      return;
    }

    const mode = this.config.get<string>('EVENT_DELIVERY_MODE', 'nest');
    if (mode !== 'http') {
      return;
    }

    try {
      await this.httpPublisher.publish(event, target);
    } catch (error) {
      this.logger.error(
        `Evento ${event.type} no entregado a ${target}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }
}
