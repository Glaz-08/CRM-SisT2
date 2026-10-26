import type { ReactNode } from 'react'
import type { ApiError } from '../../api/client'
import { table } from '../../styles/ui'
import { cx } from '../../styles/cx'
import { EmptyState, ErrorState, LoadingState } from './AsyncState'

/** Columna declarativa: `render` define el contenido y `className` ajusta ancho/estilo. */
export type Column<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  className?: string
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string | number
  loading?: boolean
  error?: ApiError | null
  onRetry?: () => void
  emptyMessage?: string
  caption?: string
}

/**
 * Tabla con estados de carga, error y vacío integrados, para no repetir el
 * mismo andamiaje en cada pantalla.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  error = null,
  onRetry,
  emptyMessage = 'No hay registros para mostrar.',
  caption,
}: DataTableProps<T>) {
  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (rows.length === 0) return <EmptyState message={emptyMessage} />

  return (
    <div className={table.wrapper}>
      <table className={table.root}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className={table.head}>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cx(table.th, column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={table.body}>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className={table.tr}>
              {columns.map((column) => (
                <td key={column.key} className={cx(table.td, column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
