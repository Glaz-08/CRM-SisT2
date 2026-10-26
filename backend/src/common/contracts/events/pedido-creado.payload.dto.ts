import { IsDateOnly } from '../../validation/date-only.validator';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

/** Payload de un pedido creado; el CRM solo lo registra/loguea. */
export class PedidoCreadoPayloadDto {
  @IsInt()
  @Min(1)
  idPedido!: number;

  @IsInt()
  @Min(1)
  idCliente!: number;

  @IsDateOnly()
  fecha!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;
}
