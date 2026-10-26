import { createBrowserRouter, Link } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { PageHeader } from './components/ui/PageHeader'
import { button, feedback } from './styles/ui'
import { ClientesPage } from './pages/ClientesPage'
import { DashboardPage } from './pages/DashboardPage'
import { HistorialPage } from './pages/HistorialPage'
import { IntegracionPage } from './pages/IntegracionPage'
import { InteraccionesPage } from './pages/InteraccionesPage'
import { MockErpPage } from './pages/MockErpPage'
import { ReportesPage } from './pages/ReportesPage'
import { SeguimientosPage } from './pages/SeguimientosPage'

function NotFoundPage() {
  return (
    <>
      <PageHeader title="Página no encontrada" description="La ruta solicitada no existe dentro del CRM." />
      <div className={feedback.info}>
        <p>Vuelve al panel principal para seguir navegando.</p>
        <Link to="/" className={`${button.primary} mt-3`}>
          Ir al inicio
        </Link>
      </div>
    </>
  )
}

/** Mapa de rutas; cada pantalla consume los endpoints de un módulo del CRM. */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'clientes', element: <ClientesPage /> },
      { path: 'interacciones', element: <InteraccionesPage /> },
      { path: 'seguimientos', element: <SeguimientosPage /> },
      { path: 'historial', element: <HistorialPage /> },
      { path: 'reportes', element: <ReportesPage /> },
      { path: 'integracion', element: <IntegracionPage /> },
      { path: 'mock-erp', element: <MockErpPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
