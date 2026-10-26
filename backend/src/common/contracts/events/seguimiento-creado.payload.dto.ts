import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ESTADOS_SEGUIMIENTO } from '../../../modules/seguimientos/seguimiento.constants';
import type { EstadoSeguimiento } from '../../../modules/seguimientos/seguimiento.constants';
import { IsDateOnly } from '../../validation/date-only.validator';

/** Contrato del evento que el CRM emite hacia facturación. */
export class SeguimientoCreadoPayloadDto {
  @IsInt()
  @Min(1)
  idSeguimientoCrm!: number;

  @IsInt()
  @Min(1)
  idInteraccion!: number;

  @IsInt()
  @Min(1)
  idCliente!: number;

  @IsInt()
  @Min(1)
  idEmpleado!: number;

  @IsDateOnly()
  fechaProgramada!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  accionRequerida!: string;

  @IsIn([...ESTADOS_SEGUIMIENTO])
  estado!: EstadoSeguimiento;
}
