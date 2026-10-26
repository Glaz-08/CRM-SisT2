import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { EventEnvelope } from '../../common/contracts/events/event-envelope.dto';
import { CrmEvents } from '../../common/events/crm.events';

/** Listeners de integración que dejan traza de eventos recibidos. */
@Injectable()
export class IntegracionListener {
  private readonly logger = new Logger(IntegracionListener.name);

  @OnEvent(CrmEvents.PAYLOAD_RECEIVED)
  handlePayloadReceived(event: EventEnvelope): void {
    this.logger.log(
      `crm.payload.received type=${event.type} eventId=${event.id} source=${event.source}`,
    );
  }

  @OnEvent(CrmEvents.PEDIDO_CREADO)
  handlePedidoCreado(event: EventEnvelope): void {
    this.logger.log(
      `pedido.creado eventId=${event.id} payload=${JSON.stringify(event.payload)}`,
    );
  }

  @OnEvent(CrmEvents.RECLAMO_CREADO)
  handleReclamoCreado(event: EventEnvelope): void {
    this.logger.log(
      `reclamo.creado eventId=${event.id} payload=${JSON.stringify(event.payload)}`,
    );
  }
}
