import { useCallback, useRef, useState } from 'react'
import { checkHealth, type HealthResult } from '../hooks/useCrmApi'
import { crmId } from '../data/modules'
const TITLE_ID = crmId('api-check-title')
import { button, dialog, healthTone, type HealthTone } from '../styles/ui'
import { cx } from '../styles/cx'

type DialogState = { status: 'checking' } | HealthResult

const errorHelp: Record<Extract<HealthResult, { status: 'error' }>['reason'], string> = {
  network: 'No se pudo conectar con el servidor. Revisa que los contenedores estén levantados con docker compose up.',
  timeout: 'El servidor no respondió a tiempo. Puede estar iniciando o sin conexión a la base de datos.',
  http: 'El servidor respondió, pero con un error. Revisa los logs del contenedor crm-api.',
}

function StatusIcon({ status }: { status: HealthTone }) {
  if (status === 'checking') {
    return (
      <svg viewBox="0 0 24 24" className="size-8 animate-spin" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {status === 'ok' ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M7 7l10 10M17 7 7 17" />}
    </svg>
  )
}

/** Botón "Probar API" que abre una mini ventana con el resultado del health check. */
export function ApiCheckDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [state, setState] = useState<DialogState>({ status: 'checking' })

  const runCheck = useCallback(async () => {
    setState({ status: 'checking' })
    setState(await checkHealth())
  }, [])

  const open = () => {
    dialogRef.current?.showModal()
    void runCheck()
  }

  const close = () => dialogRef.current?.close()

  return (
    <>
      <button type="button" onClick={open} className={button.primary}>
        Probar API
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={TITLE_ID}
        className={dialog.root}
        onClick={(event) => {
          // Cerrar al hacer clic en el fondo oscuro (fuera de la ventana).
          if (event.target === event.currentTarget) close()
        }}
      >
        <div className={dialog.body} aria-live="polite">
          <div className={cx(dialog.icon, healthTone[state.status].icon)}>
            <StatusIcon status={state.status} />
          </div>

          {state.status === 'checking' && (
            <>
              <h2 id={TITLE_ID} className={dialog.title}>Probando la API…</h2>
              <p className={dialog.text}>Consultando el servidor del CRM.</p>
            </>
          )}

          {state.status === 'ok' && (
            <>
              <h2 id={TITLE_ID} className={dialog.title}>La API funciona</h2>
              <p className={dialog.text}>El servidor del CRM respondió en {state.ms} ms.</p>
            </>
          )}

          {state.status === 'error' && (
            <>
              <h2 id={TITLE_ID} className={dialog.title}>La API no responde</h2>
              <p className={dialog.text}>{errorHelp[state.reason]}</p>
              <code className={dialog.detail}>{state.detail}</code>
            </>
          )}

          <div className={dialog.actions}>
            <button type="button" onClick={() => void runCheck()} disabled={state.status === 'checking'} className={button.secondary}>
              Probar de nuevo
            </button>
            <button type="button" onClick={close} autoFocus className={cx(button.primary, 'flex-1')}>
              Cerrar
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
