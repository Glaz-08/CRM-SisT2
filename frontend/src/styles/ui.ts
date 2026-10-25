/**
 * aca reutilizamos lso componentes
 * los colores (brick, stud, panel, etccc) se definen en src/index.css (@theme).
 */

export const layout = {
  page: 'min-h-screen bg-white',
  container: 'mx-auto w-full max-w-6xl px-4 sm:px-6',
  main: 'mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[15rem_1fr]',
  content: 'flex min-w-0 flex-col gap-6',
} as const

export const header = {
  bar: 'relative bg-brick',
  inner: 'mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6',
  logo: 'font-display text-3xl font-bold tracking-tight text-stud',
  logoTag: 'ml-2 rounded-md bg-stud px-1.5 py-0.5 align-middle font-display text-xs font-semibold text-brick-dark',
  nav: 'order-3 flex w-full gap-5 overflow-x-auto font-display text-lg font-medium text-white md:order-none md:w-auto md:flex-1 md:justify-center',
  navLink:
    'whitespace-nowrap rounded-md px-1 outline-none transition-colors hover:text-stud focus-visible:ring-2 focus-visible:ring-stud',
  actions: 'ml-auto flex items-center gap-4',
  studs: 'pointer-events-none absolute inset-x-0 top-full flex gap-7 overflow-hidden px-6',
  stud: 'h-3 w-10 shrink-0 rounded-b-md bg-brick',
} as const

export const panel = {
  base: 'rounded-3xl bg-panel p-5',
  title: 'font-display text-lg font-semibold text-ink',
} as const

export const sidebar = {
  root: 'hidden flex-col gap-5 self-start lg:sticky lg:top-6 lg:flex',
  list: 'flex flex-col gap-2',
  item:
    'flex items-center gap-3 rounded-full py-1 pr-3 outline-none transition-colors hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-brick',
  dot: 'size-7 shrink-0 rounded-full ring-4 ring-white',
  label: 'flex-1 rounded-full bg-panel-strong/60 px-3 py-1 font-display font-medium',
  count: 'font-display text-sm tabular-nums text-muted',
} as const

export const card = {
  grid: 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3',
  base: 'relative mt-3 flex scroll-mt-10 flex-col gap-3 rounded-2xl bg-panel p-3',
  /** cn los studs hacemos que sean ladrillos, si no les gusta borren las prox 2 lineas */
  studs: 'pointer-events-none absolute inset-x-0 bottom-full flex justify-around px-5',
  stud: 'h-3 w-11 rounded-t-lg bg-panel',
  media: 'flex aspect-[4/3] items-center justify-center rounded-xl bg-white',
  body: 'flex flex-1 flex-col gap-2 rounded-xl bg-panel-strong/60 px-4 py-3',
  title: 'font-display text-xl font-semibold leading-tight',
  text: 'text-sm leading-relaxed text-muted',
  footer: 'mt-auto flex flex-wrap items-center justify-between gap-2 pt-1 text-sm',
  count: 'whitespace-nowrap font-display font-semibold',
  endpoint: 'whitespace-nowrap rounded-md bg-white/80 px-2 py-0.5 font-mono text-xs text-ink',
} as const

export const search = {
  root: 'relative w-full max-w-xl',
  icon: 'pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink/70',
  input:
    'w-full rounded-xl bg-search py-2.5 pl-10 pr-4 font-display font-medium text-ink placeholder:text-ink/60 outline-none focus-visible:ring-2 focus-visible:ring-brick',
} as const

export const button = {
  primary:
    'inline-flex items-center justify-center rounded-xl bg-brick-dark px-5 py-2.5 font-display font-semibold text-white outline-none transition-colors hover:bg-ink focus-visible:ring-2 focus-visible:ring-stud',
  secondary:
    'inline-flex flex-1 items-center justify-center rounded-xl bg-panel px-5 py-2.5 font-display font-semibold text-ink outline-none transition-colors hover:bg-panel-strong focus-visible:ring-2 focus-visible:ring-brick disabled:opacity-50',
} as const

/** Mini ventana emergente para probar la API (usa <dialog> nativo). */
export const dialog = {
  root:
    'm-auto w-[min(24rem,calc(100vw-2rem))] rounded-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-[2px]',
  body: 'flex flex-col items-center gap-3 px-6 pb-6 pt-7 text-center',
  icon: 'flex size-16 items-center justify-center rounded-full',
  title: 'font-display text-2xl font-semibold',
  text: 'text-muted',
  detail: 'rounded-xl bg-panel px-3 py-2 font-mono text-xs text-ink',
  actions: 'mt-2 flex w-full flex-col-reverse gap-2 sm:flex-row',
} as const

/** Apariencia según el resultado de la prueba de la API. */
export const healthTone = {
  checking: { icon: 'bg-panel text-muted' },
  ok: { icon: 'bg-lego-green text-white' },
  error: { icon: 'bg-brick text-white' },
} as const

export const text = {
  h1: 'font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl',
  lead: 'max-w-[62ch] text-lg leading-relaxed text-muted',
  empty: 'rounded-2xl bg-panel px-5 py-8 text-center text-muted',
} as const

/** Color de cada pieza (ladrillo, punto del menú) por módulo. */
export const brickColor = {
  red: 'text-lego-red',
  blue: 'text-lego-blue',
  yellow: 'text-lego-yellow',
  green: 'text-lego-green',
  orange: 'text-lego-orange',
} as const

export const dotColor = {
  red: 'bg-lego-red',
  blue: 'bg-lego-blue',
  yellow: 'bg-lego-yellow',
  green: 'bg-lego-green',
  orange: 'bg-lego-orange',
} as const

export type BrickColor = keyof typeof brickColor
export type HealthTone = keyof typeof healthTone
