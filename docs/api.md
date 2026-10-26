# API CRM

Base URL: `http://localhost:3000/api`

Todas las respuestas son JSON. Los listados se devuelven como arrays para mantener
compatibles los contadores del frontend.

## Salud

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/health` | `{"status":"ok","service":"crm-api","module":"CRM"}` |
| GET | `/health/db` | `{"status":"ok","db":"up"}` o `503` |

## Clientes (maestro externo)

El CRM no tiene tabla `cliente`. Estos endpoints consultan el puerto configurado con
`CLIENTE_MAESTRO_MODE=db|mock|http` (con `MAESTROS_MODE` como fallback).

- `db`: lee `"master"."cliente"` en la misma base del CRM.
- `mock`: usa 10 clientes en memoria.
- `http`: usa `CLIENTE_MAESTRO_URL`.

| Método | Ruta | Uso |
|---|---|---|
| GET | `/clientes` | Lista de clientes del maestro |
| GET | `/clientes/:id` | Valida identidad por ID |
| GET | `/clientes/rut/:rut` | Valida identidad por RUT |

El modo `db` mapea `correo` a `email`. La búsqueda por RUT ignora puntos y guiones.
Si el maestro no está configurado o falla, responde `503`.

## Interacciones

| Método | Ruta | Uso |
|---|---|---|
| POST | `/interacciones` | Registra un contacto |
| GET | `/interacciones` | Lista con filtros |
| GET | `/interacciones/:id` | Detalle con seguimientos |

### `POST /interacciones`

```json
{
  "idCliente": 1,
  "idEmpleado": 1,
  "fecha": "2026-10-26",
  "canal": "whatsapp",
  "detalle": "Consulta por despacho"
}
```

Validaciones:

- `idCliente` e `idEmpleado`: enteros positivos.
- `fecha`: `YYYY-MM-DD`, no anterior a hoy en `America/Santiago`.
- `canal` y `detalle`: se recortan; no pueden quedar vacíos.
- `canal` máximo 100 caracteres; `detalle` máximo 2000.
- Si `VALIDAR_CLIENTE=true`, el cliente debe existir en el maestro.
- Si `VALIDAR_EMPLEADO=true`, el empleado debe existir en el maestro.

Efectos:

- Inserta en `crm.interaccion_crm`.
- Inserta en `crm.historial_cliente` con `tipo_evento = contacto_comercial`.
- Ambas escrituras ocurren en una transacción.

Respuesta `201`:

```json
{
  "idInteraccion": 11,
  "idCliente": 1,
  "idEmpleado": 1,
  "fecha": "2026-10-26",
  "canal": "whatsapp",
  "detalle": "Consulta por despacho"
}
```

### `GET /interacciones`

Filtros opcionales por query string:

| Parámetro | Tipo | Ejemplo |
|---|---|---|
| `idCliente` | entero | `1` |
| `idEmpleado` | entero | `1` |
| `canal` | texto (case-insensitive) | `whatsapp` |
| `desde` | fecha | `2026-10-01` |
| `hasta` | fecha | `2026-10-31` |

Ejemplo:

```bash
curl "http://localhost:3000/api/interacciones?idCliente=1&desde=2026-10-01&hasta=2026-10-31"
```

### `GET /interacciones/:id`

Devuelve la interacción con su arreglo `seguimientos`. Si no existe, `404`.

## Seguimientos

| Método | Ruta | Uso |
|---|---|---|
| POST | `/seguimientos` | Crea una acción pendiente |
| GET | `/seguimientos` | Lista con filtros |
| GET | `/seguimientos/:id` | Detalle con interacción |
| PATCH | `/seguimientos/:id/estado` | Actualiza el estado |

### `POST /seguimientos`

```json
{
  "idInteraccion": 11,
  "fechaProgramada": "2026-10-27",
  "accionRequerida": "Llamar al cliente"
}
```

Validaciones:

- `idInteraccion` debe existir; si no, `404`.
- `fechaProgramada`: `YYYY-MM-DD`, no anterior a hoy.
- `accionRequerida`: no vacía, máximo 2000.
- El servidor fuerza `estado = "pendiente"`.

Efectos:

- Inserta en `crm.seguimiento_crm`.
- Inserta historial `seguimiento_creado`.
- Publica `seguimiento.creado` después del commit. Si el webhook falla, la
  operación de negocio sigue siendo válida y el error queda en el log.

### `GET /seguimientos`

Filtros opcionales: `idInteraccion`, `idCliente`, `estado`, `desde`, `hasta`.

### `PATCH /seguimientos/:id/estado`

```json
{ "estado": "en_proceso" }
```

Estados permitidos: `pendiente`, `en_proceso`, `completado`, `cancelado`.
Un estado fuera del enum responde `400`. Si el estado no cambia, no se escribe
historial. Si cambia, se registra `seguimiento_actualizado`.

## Historial 360°

| Método | Ruta | Uso |
|---|---|---|
| GET | `/historial` | Historial global para el landing |
| GET | `/historial/cliente/:idCliente` | Historial de un cliente |

Orden: fecha descendente y luego ID descendente.

## Reportes

### `GET /reportes/resumen`

```json
{
  "generadoEn": "2026-10-26T07:57:01.394Z",
  "seguimientosPorEstado": [
    { "estado": "completado", "total": 1 },
    { "estado": "pendiente", "total": 10 }
  ],
  "tiempoRespuestaPromedioDias": 1,
  "seguimientosCompletados": 1,
  "casosAbiertosPorEmpleado": [
    { "idEmpleado": 1, "abiertos": 10 }
  ],
  "interaccionesPorCanal": [
    { "canal": "whatsapp", "total": 6 },
    { "canal": "email", "total": 5 }
  ]
}
```

`tiempoRespuestaPromedioDias` usa `fecha_programada - fecha` de interacciones con
seguimientos completados. No es el tiempo real de cierre porque el esquema no tiene
`fecha_completado`; queda documentado como mejora.

## Eventos inbound

### `POST /events`

Recibe eventos de otros módulos. Responde `202`:

```json
{
  "accepted": true,
  "eventId": "602cbbcb-03aa-4a7b-8958-295a05aecc91",
  "type": "cliente.actualizado"
}
```

Ver `docs/events.md` para el sobre, la allowlist y los payloads.

## Mock ERP (solo demo)

Requiere `ENABLE_MOCKS=true`. Si está apagado, estas rutas responden `404`.

| Método | Ruta | Uso |
|---|---|---|
| GET | `/mock/clientes` | 10 clientes ficticios |
| GET | `/mock/clientes/:id` | Cliente por ID |
| GET | `/mock/clientes/rut/:rut` | Cliente por RUT |
| GET | `/mock/empleados/:id` | Empleado ficticio |
| POST | `/mock/facturacion/seguimientos` | Recibe `seguimiento.creado` |
| GET | `/mock/facturacion/seguimientos` | Eventos recibidos por facturación |
| POST | `/mock/inventario/clientes` | Recibe `cliente.actualizado` |
| GET | `/mock/events` | Inbound y outbound en memoria |
| DELETE | `/mock/events` | Limpia la bitácora en memoria |

## Errores

| Código | Cuándo |
|---|---|
| `400` | DTO inválido, fecha pasada, estado no permitido, payload de evento inválido |
| `404` | Recurso inexistente, cliente/empleado inexistente, interacción inexistente |
| `409` | Violación de unicidad de PostgreSQL |
| `503` | Base de datos o maestro externo no disponible |

Formato típico de validación:

```json
{
  "message": ["detalle should not be empty"],
  "error": "Bad Request",
  "statusCode": 400
}
```

## Configuración relevante

```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
VALIDAR_CLIENTE=true
VALIDAR_EMPLEADO=true
CLIENTE_MAESTRO_MODE=db     # db | mock | http
EMPLEADO_MAESTRO_MODE=mock  # mock | http (RRHH aún no existe)
CLIENTE_MAESTRO_URL=
EMPLEADO_MAESTRO_URL=
ENABLE_MOCKS=true           # solo demo/desarrollo
EVENT_DELIVERY_MODE=http    # nest | http
```

## Pendientes

- Autenticación y RBAC para proteger el historial 360°.
- Maestro real de empleados (`"RRHH"."RRHH_empleado"`).
- Paginación y ordenamiento configurable para listados grandes.
- Endpoint de eliminación/edición de interacciones (no requerido en el sprint).
