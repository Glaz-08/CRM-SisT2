import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEnvelope } from '../contracts/events/event-envelope.dto';
import { EventTarget } from '../ports/event-publisher.port';

/**
 * Entrega eventos a webhooks externos con timeout y reintentos.
 * Se usa solo cuando `EVENT_DELIVERY_MODE=http`.
 */
@Injectable()
export class HttpEventPublisher {
  private readonly logger = new Logger(HttpEventPublisher.name);

  constructor(private readonly config: ConfigService) {}

  private getUrl(target: EventTarget): string | undefined {
    return target === 'facturacion'
      ? this.config.get<string>('FACTURACION_WEBHOOK_URL')
      : this.config.get<string>('INVENTARIO_WEBHOOK_URL');
  }

  async publish(event: EventEnvelope, target: EventTarget): Promise<void> {
    const url = this.getUrl(target);
    if (!url) {
      throw new Error(`No hay webhook configurado para ${target}`);
    }

    const timeout = Number(
      this.config.get<string>('EVENT_DELIVERY_TIMEOUT_MS', '3000'),
    );
    const retries = Number(
      this.config.get<string>('EVENT_DELIVERY_RETRIES', '2'),
    );
    const apiKey = this.config.get<string>('INTEGRATION_API_KEY');

    let lastError: unknown;

    for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'X-API-Key': apiKey } : {}),
          },
          body: JSON.stringify(event),
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        this.logger.log(
          `Evento ${event.type} entregado a ${target} (${event.id})`,
        );
        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Intento ${attempt}/${retries + 1} falló para ${event.type} -> ${target}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );

        if (attempt <= retries) {
          await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
        }
      }
    }

    throw new Error(
      `No se pudo entregar ${event.type} a ${target}: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
  }
}
