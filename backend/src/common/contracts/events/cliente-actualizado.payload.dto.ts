import {
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/** Payload mínimo para registrar un cambio de cliente en el historial. */
export class ClienteActualizadoPayloadDto {
  @IsInt()
  @Min(1)
  idCliente!: number;

  @IsOptional()
  @IsString()
  rut?: string;

  @IsOptional()
  @IsObject()
  camposActualizados?: Record<string, unknown>;

  @IsOptional()
  @IsISO8601()
  ocurridoEn?: string;
}
