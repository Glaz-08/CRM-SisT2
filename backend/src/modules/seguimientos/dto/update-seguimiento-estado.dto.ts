import { IsIn } from 'class-validator';
import { ESTADOS_SEGUIMIENTO } from '../seguimiento.constants';
import type { EstadoSeguimiento } from '../seguimiento.constants';

/** Payload para cambiar el estado de un seguimiento. */
export class UpdateSeguimientoEstadoDto {
  @IsIn([...ESTADOS_SEGUIMIENTO])
  estado: EstadoSeguimiento;
}
