import { Module } from '@nestjs/common';
import { CompositeEventPublisher } from './adapters/composite-event-publisher.adapter';
import { HttpEventPublisher } from './adapters/http-event-publisher.adapter';
import { NestEventPublisher } from './adapters/nest-event-publisher.adapter';
import { EVENT_PUBLISHER } from './ports/event-publisher.port';

/**
 * Infraestructura de eventos compartida: publica siempre en el bus local y,
 * cuando el modo lo permite, también en los webhooks de otros módulos.
 */
@Module({
  providers: [
    NestEventPublisher,
    HttpEventPublisher,
    CompositeEventPublisher,
    {
      provide: EVENT_PUBLISHER,
      useExisting: CompositeEventPublisher,
    },
  ],
  exports: [EVENT_PUBLISHER],
})
export class EventingModule {}
