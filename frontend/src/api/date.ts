const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Fecha de hoy en Chile, en formato YYYY-MM-DD, alineada con el backend. */
export function todayInSantiago(): string {
  const parts = DATE_FORMATTER.formatToParts(new Date())
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

/** Muestra una fecha ISO corta sin interpretarla en otra zona horaria. */
export function formatDate(value: string): string {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-')
  if (!year || !month || !day) return value
  return `${day}-${month}-${year}`
}

/** Formatea un timestamp ISO para mostrarlo en la zona de Chile. */
export function formatDateTime(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}
