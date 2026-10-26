import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { ClienteActualizadoPayloadDto } from '../../common/contracts/events/cliente-actualizado.payload.dto';
import type { EventEnvelope } from '../../common/contracts/events/event-envelope.dto';
import { CrmEvents } from '../../common/events/crm.events';
import { todayInTimeZone } from '../../common/validation/date-only.validator';
import { HistorialService } from '../historial/historial.service';

/**
 * Escucha cambios de cliente y los refleja en el historial 360°.
 * La deduplicación es en memoria y cubre la vida del proceso, suficiente para
 * la demo; una solución persistente requeriría una tabla de eventos procesados.
 */
@Injectable()
export class ClientesListener {
  private readonly logger = new Logger(ClientesListener.name);
  private readonly processedEvents = new Set<string>();

  constructor(private readonly historialService: HistorialService) {}

  @OnEvent(CrmEvents.CLIENTE_ACTUALIZADO)
  async handleClienteActualizado(event: EventEnvelope): Promise<void> {
    if (this.processedEvents.has(event.id)) {
      this.logger.warn(
        `Evento cliente.actualizado duplicado ignorado: ${event.id}`,
      );
      return;
    }

    const payload = event.payload as unknown as ClienteActualizadoPayloadDto;
    const campos = payload.camposActualizados
      ? Object.keys(payload.camposActualizados).join(', ')
      : '';

    await this.historialService.registrar({
      idCliente: payload.idCliente,
      fecha: todayInTimeZone(),
      tipoEvento: 'cliente_actualizado',
      descripcion: campos
        ? `Actualización de datos del cliente (${campos})${payload.rut ? `; RUT ${payload.rut}` : ''}`
        : `Evento cliente.actualizado recibido${payload.rut ? `; RUT ${payload.rut}` : ''}`,
    });

    this.processedEvents.add(event.id);
    this.logger.log(
      `cliente.actualizado idCliente=${payload.idCliente} eventId=${event.id} source=${event.source}`,
    );
  }
}
