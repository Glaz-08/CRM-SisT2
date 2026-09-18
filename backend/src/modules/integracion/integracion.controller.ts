import { Body, Controller, Post } from '@nestjs/common';
import { IntegracionService } from './integracion.service';
import { InboundEventDto } from '../../common/events/inbound-event.dto';

@Controller('events')
export class IntegracionController {
  constructor(private readonly integracionService: IntegracionService) {}

  @Post()
  ingest(@Body() event: InboundEventDto) {
    return this.integracionService.ingest(event);
  }
}
