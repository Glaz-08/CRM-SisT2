/**
 * Convierte variables de entorno textuales a booleanos.
 * Valores vacíos o ausentes usan el fallback para no romper configuraciones locales.
 */
export function toBoolean(
  value: string | undefined,
  fallback = false,
): boolean {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
}
