import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CrmEvents } from '../../common/events/crm.events';
import { InboundEventDto } from '../../common/events/inbound-event.dto';

@Injectable()
export class ClientesListener {
  private readonly logger = new Logger(ClientesListener.name);

  @OnEvent(CrmEvents.PAYLOAD_RECEIVED)
  handlePayloadReceived(event: InboundEventDto): void {
    this.logger.log(
      `Payload recibido desde ${event.source} (${event.type}). Pendiente validación RUT/ID en CLIENTE.`,
    );
  }
}
