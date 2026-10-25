/** Une clases de Tailwind ignorando valores vacíos o condicionales falsos. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
