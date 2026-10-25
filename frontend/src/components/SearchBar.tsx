import { search } from '../styles/ui'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}

export function SearchBar({ value, onChange, placeholder, label }: SearchBarProps) {
  return (
    <div role="search" className={search.root}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className={search.icon}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={search.input}
      />
    </div>
  )
}
