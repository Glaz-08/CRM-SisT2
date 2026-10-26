import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { IsDateOnly } from '../../validation/date-only.validator';

/** Payload de un reclamo de postventa recibido por el CRM. */
export class ReclamoCreadoPayloadDto {
  @IsInt()
  @Min(1)
  idReclamo!: number;

  @IsInt()
  @Min(1)
  idCliente!: number;

  @IsDateOnly()
  fecha!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  motivo!: string;
}
