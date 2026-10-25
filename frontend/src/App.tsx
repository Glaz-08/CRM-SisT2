import { useMemo, useState } from 'react'
import { Header } from './components/Header'
import { ModuleCard } from './components/ModuleCard'
import { SearchBar } from './components/SearchBar'
import { Sidebar } from './components/Sidebar'
import { crmId, crmModules } from './data/modules'
import { useCrmApi } from './hooks/useCrmApi'
import { card, layout, text } from './styles/ui'

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function App() {
  const { counts } = useCrmApi()
  const [query, setQuery] = useState('')

  const visibleModules = useMemo(() => {
    const q = normalize(query)
    if (!q) return crmModules
    return crmModules.filter((m) => normalize(`${m.name} ${m.description} ${m.endpoint}`).includes(q))
  }, [query])

  return (
    <div id={crmId('inicio')} className={layout.page}>
      <Header />

      <main className={layout.main}>
        <Sidebar counts={counts} />

        <div className={layout.content}>
          <section className="flex flex-col gap-3">
            <h1 className={text.h1}>CRM (hola xat)</h1>
          </section>

          <SearchBar
            value={query}
            onChange={setQuery}
            label="Buscar módulo"
            placeholder="Buscar módulo, p. ej. seguimientos"
          />

          {visibleModules.length > 0 ? (
            <div className={card.grid}>
              {visibleModules.map((module) => (
                <ModuleCard key={module.id} module={module} count={counts[module.id]} />
              ))}
            </div>
          ) : (
            <p className={text.empty}>
              Ningún módulo coincide con “{query}”. Prueba con clientes, seguimientos o historial.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
