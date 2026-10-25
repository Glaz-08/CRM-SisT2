# CRM SisT2

Módulo CRM de un ecommerce de venta de LEGO. Monolito modular dockerizado:

**React** → **NestJS (REST)** → **PostgreSQL**

Los demás grupos envían payloads por `POST /api/events`. NestJS los publica en un bus interno de eventos (`EventEmitter`) para que cada módulo reaccione sin acoplarse al origen.

## Estructura

```
frontend/                 React + Vite
backend/                  NestJS (monolito modular)
  src/modules/
    clientes/             Validación RUT/ID · tabla CLIENTE
    interacciones/        INTERACCION_CRM
    seguimientos/         SEGUIMIENTO_CRM
    historial/            HISTORIAL_CLIENTE (vista 360°)
    integracion/          Ingesta de payloads / eventos
database/init/            DDL del esquema crm (para Postgres local)
docker-compose.yml        API + web (+ PostgreSQL local opcional)
```

## Configuración

La API se conecta a la base PostgreSQL del profesor (Neon), esquema `crm`, con SSL y `synchronize` desactivado.

```bash
cp backend/.env.example backend/.env   # completar con las credenciales reales
```

Las credenciales viven solo en `backend/.env` (ignorado por git). Nunca van en el frontend ni en variables `VITE_`.

## Levantar con Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- API: http://localhost:3000/api/health

El servicio `api` lee `backend/.env`. Para usar un Postgres local en vez de Neon: `docker compose --profile local-db up` y apuntar `DB_HOST`, `DB_SSL=false`, etc. a ese contenedor.

## Desarrollo local

1. En `backend/`: `npm run start:dev`
2. En `frontend/`: `npm run dev` → http://localhost:5173

## Contratos iniciales

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/health` | Salud del servicio |
| GET | `/api/clientes` | Listado de clientes |
| GET | `/api/interacciones` | Listado de interacciones |
| GET | `/api/seguimientos` | Listado de seguimientos |
| GET | `/api/historial` | Historial 360° |
| POST | `/api/events` | Recibe payloads de otros grupos |
