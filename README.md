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
docker-compose.yml        API + web + PostgreSQL
```

## Levantar con Docker

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:8080
- API: http://localhost:3000/api/health
- PostgreSQL: localhost:5432

## Desarrollo local

1. `docker compose up postgres`
2. En `backend/`: copiar variables de `.env.example` y `npm run start:dev`
3. En `frontend/`: `npm run dev` → http://localhost:5173

## Contratos iniciales

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/health` | Salud del servicio |
| GET | `/api/clientes` | Listado de clientes |
| GET | `/api/interacciones` | Listado de interacciones |
| GET | `/api/seguimientos` | Listado de seguimientos |
| GET | `/api/historial` | Historial 360° |
| POST | `/api/events` | Recibe payloads de otros grupos |
