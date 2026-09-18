import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CrmEvents } from '../../common/events/crm.events';
import { InboundEventDto } from '../../common/events/inbound-event.dto';

@Injectable()
export class IntegracionService {
  private readonly logger = new Logger(IntegracionService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  ingest(event: InboundEventDto) {
    this.logger.log(`Ingesta de evento ${event.type} desde ${event.source}`);
    this.eventEmitter.emit(CrmEvents.PAYLOAD_RECEIVED, event);

    return {
      accepted: true,
      event: CrmEvents.PAYLOAD_RECEIVED,
      source: event.source,
      type: event.type,
    };
  }
}
