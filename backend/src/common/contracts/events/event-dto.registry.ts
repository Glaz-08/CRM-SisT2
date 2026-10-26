import { ClassConstructor } from 'class-transformer';
import { ClienteActualizadoPayloadDto } from './cliente-actualizado.payload.dto';
import { KnownEventType } from './event-envelope.dto';
import { PedidoCreadoPayloadDto } from './pedido-creado.payload.dto';
import { ReclamoCreadoPayloadDto } from './reclamo-creado.payload.dto';

/**
 * Cada evento inbound tiene su propio DTO de payload.
 * Si llega un tipo que no está aquí, el dispatcher responde 400.
 */
export const EVENT_DTO_BY_TYPE: Partial<
  Record<KnownEventType, ClassConstructor<object>>
> = {
  'cliente.actualizado': ClienteActualizadoPayloadDto,
  'pedido.creado': PedidoCreadoPayloadDto,
  'reclamo.creado': ReclamoCreadoPayloadDto,
};
