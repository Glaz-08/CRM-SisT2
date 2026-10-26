import { Transform } from 'class-transformer';

/**
 * Recorta espacios al inicio y al final antes de validar.
 * Se aplica solo a strings; otros valores pasan sin cambios.
 */
export function Trim(): PropertyDecorator {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : '',
  );
}
