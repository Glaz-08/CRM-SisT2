import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export const KNOWN_EVENT_TYPES = [
  'seguimiento.creado',
  'cliente.actualizado',
  'pedido.creado',
  'reclamo.creado',
] as const;

export type KnownEventType = (typeof KNOWN_EVENT_TYPES)[number];

/** Tipos que el CRM acepta por POST /api/events. */
export const INBOUND_EVENT_TYPES = [
  'cliente.actualizado',
  'pedido.creado',
  'reclamo.creado',
] as const;

export type InboundEventType = (typeof INBOUND_EVENT_TYPES)[number];

/** Sobre de entrada validado por `POST /api/events`. */
export class EventEnvelopeDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  source!: string;

  @IsIn([...KNOWN_EVENT_TYPES])
  type!: KnownEventType;

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

/** Sobre normalizado que circula por el bus interno y por HTTP. */
export interface EventEnvelope {
  id: string;
  source: string;
  type: KnownEventType;
  occurredAt: string;
  version: string;
  payload: Record<string, unknown>;
}
