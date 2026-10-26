# CRM SisT2

Módulo CRM de un ecommerce de venta de LEGO. Monolito modular dockerizado:

**React** → **NestJS (REST)** → **PostgreSQL**

Los demás grupos envían payloads por `POST /api/events`. NestJS los publica en un bus interno de eventos (`EventEmitter`) para que cada módulo reaccione sin acoplarse al origen.

## Estructura

```
frontend/                 React + Vite
backend/                  NestJS (monolito modular)
  src/modules/
    clientes/             Validación contra "master"."cliente" + maestro mock de empleados
    interacciones/        INTERACCION_CRM
    seguimientos/         SEGUIMIENTO_CRM
    historial/            HISTORIAL_CLIENTE (vista 360°)
    reportes/             Resumen de seguimientos, tiempos y canales
    integracion/          Ingesta de payloads / eventos
database/init/            DDL del esquema crm (para Postgres local)
docker-compose.yml        API + web (+ PostgreSQL local opcional)
```

## Configuración

La API se conecta a la base PostgreSQL del profesor (Neon), esquema `crm`, con SSL y `synchronize` desactivado. El maestro real de clientes está en `"master"."cliente"` de la misma base; el maestro de empleados todavía se resuelve con datos mock porque `RRHH` no existe en esa base.

```bash
cp backend/.env.example backend/.env   # completar con las credenciales reales
cd backend && npm run seed:master      # 10 clientes demo idempotentes
```

Variables relevantes:

```env
DB_NAME=si2_22026
DB_SCHEMA=crm
CLIENTE_MAESTRO_MODE=db
EMPLEADO_MAESTRO_MODE=mock
```

Las credenciales viven solo en `backend/.env` (ignorado por git). Nunca van en el frontend ni en variables `VITE_`.

## Levantar con Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- API: http://localhost:3000/api/health

El servicio `api` lee `backend/.env`. Para usar un Postgres local en vez de Neon:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile local-db up --build
```

Ese override usa `CLIENTE_MAESTRO_MODE=mock` y `EMPLEADO_MAESTRO_MODE=mock` para que el stack local no dependa de `master`/`RRHH`.

## Desarrollo local

1. En `backend/`: `npm run start:dev`
2. En `frontend/`: `npm run dev` → http://localhost:5173

### Rutas del frontend

Todas las pantallas comparten el mismo layout (`Header` + `Sidebar`) y consumen la API tipada de `frontend/src/api/`:

| Ruta | Pantalla |
| --- | --- |
| `/` | Estado de la API y acceso a los módulos |
| `/clientes` | Maestro de clientes por ID o RUT |
| `/interacciones` | Filtros, detalle con seguimientos y creación |
| `/seguimientos` | Filtros, detalle, creación y cambio de estado |
| `/historial` | Historial global o por cliente |
| `/reportes` | Métricas del CRM |
| `/integracion` | Envío de eventos inbound (`POST /api/events`) |
| `/mock-erp` | Maestros y receptores mock (requiere `ENABLE_MOCKS=true`) |

Los tipos se mantienen a mano desde las entidades/DTO del backend; `frontend/docs/api.json` es solo el inventario de operaciones y no genera código.

## Contratos iniciales

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/health` | Salud del servicio |
| GET | `/api/health/db` | Salud de la conexión PostgreSQL |
| GET | `/api/clientes` | Clientes del maestro `master.cliente` |
| GET | `/api/clientes/:id` | Cliente por ID |
| GET | `/api/clientes/rut/:rut` | Cliente por RUT |
| GET/POST | `/api/interacciones` | Listado y registro de interacciones |
| GET/POST | `/api/seguimientos` | Listado y registro de seguimientos |
| PATCH | `/api/seguimientos/:id/estado` | Cambio de estado |
| GET | `/api/historial` | Historial 360° |
| GET | `/api/reportes/resumen` | Métricas del CRM |
| POST | `/api/events` | Recibe payloads de otros grupos |

Documentación detallada: [`docs/api.md`](docs/api.md), [`docs/crm-schema.md`](docs/crm-schema.md), [`docs/events.md`](docs/events.md) y [`docs/demo.md`](docs/demo.md).
