import { Type } from 'class-transformer';
import {
  IsDateOnly,
  IsNotPastDate,
} from '../../../common/validation/date-only.validator';
import { Trim } from '../../../common/validation/trim.decorator';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

/** Payload para registrar una interacción; la fecha no puede ser pasada. */
export class CreateInteraccionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCliente: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEmpleado: number;

  @IsDateOnly()
  @IsNotPastDate()
  fecha: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  canal: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  detalle: string;
}
