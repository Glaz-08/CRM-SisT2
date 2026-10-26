import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { EVENT_DTO_BY_TYPE } from '../../common/contracts/events/event-dto.registry';
import {
  EventEnvelope,
  EventEnvelopeDto,
} from '../../common/contracts/events/event-envelope.dto';
import { CrmEvents } from '../../common/events/crm.events';
import { EventLogService } from './event-log.service';

/**
 * Punto de entrada de eventos de otros módulos.
 * Valida el sobre y el payload con el DTO específico antes de publicarlo en el
 * bus interno; luego registra el evento para inspección en demo.
 */
@Injectable()
export class IntegracionService {
  private readonly logger = new Logger(IntegracionService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly eventLog: EventLogService,
  ) {}

  /** Acepta un evento inbound y devuelve el id normalizado para correlación. */
  async ingest(dto: EventEnvelopeDto) {
    const payloadClass = EVENT_DTO_BY_TYPE[dto.type];

    if (!payloadClass) {
      throw new BadRequestException(
        `El evento ${dto.type} no está habilitado para ingesta en el CRM`,
      );
    }

    const payload = plainToInstance(payloadClass, dto.payload);
    const errors = await validate(payload, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const details = errors.flatMap((error) =>
        Object.values(error.constraints ?? {}),
      );
      throw new BadRequestException({
        message: 'Payload de evento inválido',
        errors: details,
      });
    }

    const event: EventEnvelope = {
      id: dto.id ?? randomUUID(),
      source: dto.source,
      type: dto.type,
      occurredAt: dto.occurredAt ?? new Date().toISOString(),
      version: dto.version ?? '1.0',
      payload: instanceToPlain(payload) as Record<string, unknown>,
    };

    await this.eventEmitter.emitAsync(event.type, event);
    await this.eventEmitter.emitAsync(CrmEvents.PAYLOAD_RECEIVED, event);
    this.eventLog.record(event);

    this.logger.log(
      `Evento ${event.type} aceptado desde ${event.source} (${event.id})`,
    );

    return {
      accepted: true,
      eventId: event.id,
      type: event.type,
    };
  }
}
