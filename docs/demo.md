# Demo del CRM

Esta demo usa la API y `curl`. No requiere formularios nuevos en el frontend.

## 1. Preparar el backend

```bash
cd backend
npm install
npm run seed:master
npm run build
npm run start:prod
```

`npm run seed:master` inserta de forma idempotente 10 clientes demo en
`"master"."cliente"` con IDs `1..10`.

Configuración esperada en `backend/.env`:

```env
DB_NAME=si2_22026
DB_SCHEMA=crm
CLIENTE_MAESTRO_MODE=db
EMPLEADO_MAESTRO_MODE=mock
ENABLE_MOCKS=true
```

- Cliente real: `"master"."cliente"`.
- Empleado: mock IDs `1..3` mientras no exista `RRHH` en `si2_22026`.
- El mock de facturación/inventario requiere `ENABLE_MOCKS=true`.

## 2. Verificar salud y maestros

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/db
curl http://localhost:3000/api/clientes
curl http://localhost:3000/api/clientes/1
curl http://localhost:3000/api/clientes/rut/11.111.111-1
curl http://localhost:3000/api/mock/empleados/1
```

Resultado esperado: health `ok`, base `up`, 10 clientes y empleado mock `1`.

## 3. Crear una interacción

Usar una fecha de hoy o futura:

```bash
curl -X POST http://localhost:3000/api/interacciones \
  -H 'Content-Type: application/json' \
  -d '{
    "idCliente": 1,
    "idEmpleado": 1,
    "fecha": "2026-10-26",
    "canal": "whatsapp",
    "detalle": "Consulta por despacho"
  }'
```

La respuesta incluye `idInteraccion`. También se crea automáticamente el historial
`contacto_comercial`.

## 4. Crear un seguimiento

Reemplazar `ID_INTERACCION` por el ID devuelto en el paso anterior:

```bash
curl -X POST http://localhost:3000/api/seguimientos \
  -H 'Content-Type: application/json' \
  -d '{
    "idInteraccion": ID_INTERACCION,
    "fechaProgramada": "2026-10-27",
    "accionRequerida": "Llamar al cliente"
  }'
```

El seguimiento nace en `pendiente`, escribe historial y publica
`seguimiento.creado` al mock de facturación.

## 5. Cambiar el estado

```bash
curl -X PATCH http://localhost:3000/api/seguimientos/ID_SEGUIMIENTO/estado \
  -H 'Content-Type: application/json' \
  -d '{"estado":"en_proceso"}'

curl -X PATCH http://localhost:3000/api/seguimientos/ID_SEGUIMIENTO/estado \
  -H 'Content-Type: application/json' \
  -d '{"estado":"completado"}'
```

Cada cambio real de estado agrega historial `seguimiento_actualizado`.

## 6. Consultar historial y reportes

```bash
curl http://localhost:3000/api/historial/cliente/1
curl http://localhost:3000/api/reportes/resumen
```

El resumen incluye seguimientos por estado, casos abiertos por empleado, interacciones
por canal y tiempo de respuesta planificado.

## 7. Simular `cliente.actualizado`

```bash
curl -X POST http://localhost:3000/api/events \
  -H 'Content-Type: application/json' \
  -d '{
    "source": "postventa",
    "type": "cliente.actualizado",
    "payload": {
      "idCliente": 1,
      "rut": "11.111.111-1",
      "camposActualizados": { "email": "nuevo@demo.cl" }
    }
  }'
```

El evento responde `202` y agrega historial `cliente_actualizado`. Un segundo envío
con el mismo `id` se ignora durante la vida del proceso.

## 8. Smoke test automatizado

Con la API levantada:

```bash
bash scripts/smoke-test.sh
```

El script verifica health, validaciones, creación de interacción y seguimiento,
historial, reportes, evento inbound y deduplicación. Si detecta el contenedor
`crm-api`, también reinicia el servicio y comprueba persistencia.

## 9. Docker local

El stack local usa maestros mock para no depender de `master`/`RRHH`:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile local-db up --build
```

Luego ejecutar el smoke test con `API_URL=http://localhost:3000/api`.
