import { useEffect, useState } from 'react'
import './App.css'

type HealthResponse = {
  status: string
  service: string
  module: string
}

const apiUrl = import.meta.env.VITE_API_URL ?? '/api'

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${apiUrl}/health`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.json() as Promise<HealthResponse>
      })
      .then(setHealth)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Error de conexión')
      })
  }, [])

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Ecommerce de LEGO · Módulo CRM</p>
        <h1>CRM SisT2</h1>
        <p className="lead">
          Monolito modular con React, NestJS, REST y PostgreSQL. Los demás grupos
          envían payloads a <code>POST /api/events</code>.
        </p>
      </section>

      <section className="grid">
        <article>
          <h2>Stack</h2>
          <ul>
            <li>React + Vite</li>
            <li>NestJS (API REST)</li>
            <li>PostgreSQL + TypeORM</li>
            <li>EventEmitter (ingesta de eventos)</li>
            <li>Docker Compose</li>
          </ul>
        </article>

        <article>
          <h2>Módulos</h2>
          <ul>
            <li>Clientes · validación RUT/ID</li>
            <li>Interacciones · INTERACCION_CRM</li>
            <li>Seguimientos · SEGUIMIENTO_CRM</li>
            <li>Historial · vista 360°</li>
            <li>Integración · payloads externos</li>
          </ul>
        </article>

        <article>
          <h2>API</h2>
          <p className={`status ${health ? 'ok' : error ? 'error' : 'pending'}`}>
            {health
              ? `${health.service}: ${health.status}`
              : error
                ? `API no disponible (${error})`
                : 'Consultando /api/health...'}
          </p>
        </article>
      </section>
    </main>
  )
}

export default App
