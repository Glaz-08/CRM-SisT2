import { form } from '../../styles/ui'
import { cx } from '../../styles/cx'

type JsonEditorProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  disabled?: boolean
}

/** Editor de JSON con validación externa; `error` lo marca en rojo sin bloquear la edición. */
export function JsonEditor({ id, label, value, onChange, hint, error, disabled }: JsonEditorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={form.label}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        spellCheck={false}
        className={cx(form.code, error && 'border-brick')}
      />
      {hint && !error && <p className={form.hint}>{hint}</p>}
      {error && <p className={form.error}>{error}</p>}
    </div>
  )
}
