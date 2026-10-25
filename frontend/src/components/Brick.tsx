import { brickColor, type BrickColor } from '../styles/ui'
import { cx } from '../styles/cx'

type BrickProps = {
  color: BrickColor
  className?: string
}

/** Centros de los 4 studs sobre la cara superior, de atrás hacia adelante. */
const STUDS = [
  [80, 35],
  [50, 50],
  [110, 50],
  [80, 65],
] as const

/** Ladrillo 2x2 en perspectiva; usa currentColor y sombras con opacidad. */
export function Brick({ color, className }: BrickProps) {
  return (
    <svg viewBox="0 0 160 125" aria-hidden="true" className={cx('h-auto w-1/2', brickColor[color], className)}>
      {/* caras laterales */}
      <path d="M20 55 L80 85 L80 120 L20 90 Z" fill="currentColor" />
      <path d="M20 55 L80 85 L80 120 L20 90 Z" fill="black" opacity="0.18" />
      <path d="M80 85 L140 55 L140 90 L80 120 Z" fill="currentColor" />
      <path d="M80 85 L140 55 L140 90 L80 120 Z" fill="black" opacity="0.32" />
      {/* cara superior */}
      <path d="M20 55 L80 25 L140 55 L80 85 Z" fill="currentColor" />
      {/* studs */}
      {STUDS.map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y + 5})`}>
          <path d="M-13 0 V-8 H13 V0 A13 6.5 0 0 1 -13 0 Z" fill="currentColor" />
          <path d="M-13 0 V-8 H13 V0 A13 6.5 0 0 1 -13 0 Z" fill="black" opacity="0.2" />
          <ellipse cx="0" cy="-8" rx="13" ry="6.5" fill="currentColor" />
          <ellipse cx="0" cy="-8" rx="13" ry="6.5" fill="white" opacity="0.14" />
        </g>
      ))}
    </svg>
  )
}
