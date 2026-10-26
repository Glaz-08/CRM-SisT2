import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Fecha de hoy en formato YYYY-MM-DD para la zona horaria indicada.
 * Evita el desfase de UTC cuando el servidor corre en otra zona.
 */
export function todayInTimeZone(
  timeZone = process.env.TZ || 'America/Santiago',
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Indica si el valor es una fecha YYYY-MM-DD real, sin aceptar días fuera de rango. */
export function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/** Valida que una propiedad sea una fecha YYYY-MM-DD válida. */
export function IsDateOnly(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isDateOnly',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) => isDateOnly(value),
        defaultMessage: (args: ValidationArguments) =>
          `${args.property} debe tener formato YYYY-MM-DD y ser una fecha válida`,
      },
    });
  };
}

/**
 * Valida que la fecha sea hoy o posterior.
 * La comparación usa la zona TZ del servidor para evitar corrimientos por UTC.
 */
export function IsNotPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isNotPastDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) =>
          isDateOnly(value) && value >= todayInTimeZone(),
        defaultMessage: (args: ValidationArguments) =>
          `${args.property} no puede ser anterior a hoy (${todayInTimeZone()})`,
      },
    });
  };
}
