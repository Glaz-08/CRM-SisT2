import { Type } from 'class-transformer';
import {
  IsDateOnly,
  IsNotPastDate,
} from '../../../common/validation/date-only.validator';
import { Trim } from '../../../common/validation/trim.decorator';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

/** Payload para programar un seguimiento; la fecha debe ser hoy o futura. */
export class CreateSeguimientoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idInteraccion: number;

  @IsDateOnly()
  @IsNotPastDate()
  fechaProgramada: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  accionRequerida: string;
}
