import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { EventEnvelopeDto } from '../../common/contracts/events/event-envelope.dto';
import { IntegracionService } from './integracion.service';

/** Recibe payloads de otros grupos y responde 202 tras validarlos. */
@Controller('events')
export class IntegracionController {
  constructor(private readonly integracionService: IntegracionService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  ingest(@Body() event: EventEnvelopeDto) {
    return this.integracionService.ingest(event);
  }
}
