import { Type } from 'class-transformer';
import { IsDateOnly } from '../../../common/validation/date-only.validator';
import { Trim } from '../../../common/validation/trim.decorator';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/** Filtros opcionales para el listado de interacciones. */
export class ListInteraccionesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCliente?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEmpleado?: number;

  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  canal?: string;

  @IsOptional()
  @IsDateOnly()
  desde?: string;

  @IsOptional()
  @IsDateOnly()
  hasta?: string;
}
