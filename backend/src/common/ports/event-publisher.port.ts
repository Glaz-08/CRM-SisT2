import { EventEnvelope } from '../contracts/events/event-envelope.dto';

/** Destinos externos que consumen eventos emitidos por el CRM. */
export type EventTarget = 'facturacion' | 'inventario';

/** Puerto de salida para publicar eventos en el bus interno y/o webhooks. */
export interface EventPublisherPort {
  publish(event: EventEnvelope, target?: EventTarget): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
