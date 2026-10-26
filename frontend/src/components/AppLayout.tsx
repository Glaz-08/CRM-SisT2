import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useCrmApi } from '../hooks/useCrmApi'
import { layout } from '../styles/ui'

/**
 * Shell de todas las rutas. Los conteos se piden una sola vez aquí y se
 * comparten con el sidebar y el dashboard vía outlet context, evitando repetir
 * los mismos GET en cada pantalla. También reinicia el scroll al cambiar de ruta.
 */
export function AppLayout() {
  const { counts } = useCrmApi()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className={layout.page}>
      <Header />
      <main className={layout.main}>
        <Sidebar counts={counts} />
        <div className={layout.content}>
          <Outlet context={{ counts }} />
        </div>
      </main>
    </div>
  )
}
