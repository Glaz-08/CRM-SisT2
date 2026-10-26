import { Type } from 'class-transformer';
import { IsDateOnly } from '../../../common/validation/date-only.validator';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ESTADOS_SEGUIMIENTO } from '../seguimiento.constants';
import type { EstadoSeguimiento } from '../seguimiento.constants';

/** Filtros opcionales para el listado de seguimientos. */
export class ListSeguimientosQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idInteraccion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCliente?: number;

  @IsOptional()
  @IsIn([...ESTADOS_SEGUIMIENTO])
  estado?: EstadoSeguimiento;

  @IsOptional()
  @IsDateOnly()
  desde?: string;

  @IsOptional()
  @IsDateOnly()
  hasta?: string;
}
