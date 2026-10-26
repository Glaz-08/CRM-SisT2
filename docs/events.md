# Eventos e integración

## Principio

`@nestjs/event-emitter` desacopla módulos dentro del mismo proceso. No entrega
eventos a otros contenedores. Para otros módulos/servicios se usa HTTP con contratos
tipados y puertos/adaptadores.

- El CRM **emite** `seguimiento.creado` a facturación.
- El CRM **consume** `cliente.actualizado`, `pedido.creado` y `reclamo.creado`.
- El CRM no reemite eventos de clientes/pedidos; ese flujo pertenece a sus dueños.
- `reclamo` pertenece a postventa; por ahora solo se registra en log.

## Sobre de evento

```ts
export class EventEnvelopeDto {
  @IsOptional() @IsUUID()
  id?: string;              // idempotencia; se genera si falta

  @IsString() @IsNotEmpty()
  source: string;           // crm, clientes, pedidos, postventa

  @IsIn(KNOWN_EVENT_TYPES)
  type: string;

  @IsOptional() @IsISO8601()
  occurredAt?: string;

  @IsOptional() @IsString()
  version?: string;         // 1.0

  @IsObject()
  payload: Record<string, unknown>;
}
```

El sobre normalizado que circula internamente siempre tiene `id`, `source`, `type`,
`occurredAt`, `version` y `payload`.

## Evento outbound: `seguimiento.creado`

Se publica **después del commit** de la transacción que crea el seguimiento.

```json
{
  "id": "8d3d2f14-27c6-4f09-ae2f-b55ab4d5a1a1",
  "source": "crm",
  "type": "seguimiento.creado",
  "occurredAt": "2026-10-26T07:56:59.865Z",
  "version": "1.0",
  "payload": {
    "idSeguimientoCrm": 11,
    "idInteraccion": 11,
    "idCliente": 1,
    "idEmpleado": 1,
    "fechaProgramada": "2026-10-27",
    "accionRequerida": "Llamar al cliente",
    "estado": "pendiente"
  }
}
```

No se envía `detalle` ni otros datos personales a facturación: solo IDs y la acción
requerida.

## Eventos inbound

| Evento | Emisor | Consumidor | Payload mínimo |
|---|---|---|---|
| `cliente.actualizado` | Clientes | CRM: historial/log | `idCliente`, `rut`, `camposActualizados`, `ocurridoEn` |
| `pedido.creado` | Pedidos | CRM: log | `idPedido`, `idCliente`, `fecha`, `total` |
| `reclamo.creado` | Postventa | CRM: log (futuro) | `idReclamo`, `idCliente`, `fecha`, `motivo` |

`seguimiento.creado` es outbound; si llega por `POST /api/events`, el dispatcher
responde `400` porque no está en la allowlist de ingesta.

### Flujo del dispatcher

1. `ValidationPipe` valida el sobre con `EventEnvelopeDto`.
2. Se rechazan tipos desconocidos con `400`.
3. Se resuelve el DTO de payload en `EVENT_DTO_BY_TYPE`.
4. Se valida el payload con `plainToInstance` + `validate` y
   `forbidNonWhitelisted`.
5. Se emite `event.type` y luego `crm.payload.received` en el bus interno.
6. Se guarda en la bitácora en memoria y se responde `202`.

### Ejemplo

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

## Entrega y confiabilidad

- `NestEventPublisher`: bus interno.
- `HttpEventPublisher`: `POST` al webhook, con timeout y reintentos.
- `CompositeEventPublisher`: bus interno + HTTP si `EVENT_DELIVERY_MODE=http`.
- El fallo del webhook queda en el log; la transacción de negocio ya está confirmada.
- No hay outbox transaccional. Si se exige entrega garantizada, se necesitaría una
  cuarta tabla `crm.evento_saliente` en la misma transacción y un dispatcher.
- `INTEGRATION_API_KEY` se envía como `X-API-Key` si está configurada.
- El mock de facturación recibe el evento y lo guarda en memoria.

## Idempotencia

- El sobre incluye `eventId` (`id`).
- El mock y el listener de `cliente.actualizado` deduplican en memoria por `eventId`.
- Esa deduplicación se pierde al reiniciar el proceso y no es compartida entre
  réplicas.
- Producción requiere un inbox persistente o una tabla de eventos procesados.
- El receptor de facturación debe ignorar duplicados por `eventId`.

## Mock ERP

Requiere `ENABLE_MOCKS=true`. Los datos mock son independientes del modo del maestro
(`CLIENTE_MAESTRO_MODE` / `EMPLEADO_MAESTRO_MODE`).

| Ruta | Simula |
|---|---|
| `GET /api/mock/clientes` | Maestro de clientes (IDs 1..10) |
| `GET /api/mock/clientes/:id` | Validación por ID |
| `GET /api/mock/clientes/rut/:rut` | Validación por RUT |
| `GET /api/mock/empleados/:id` | Maestro de empleados |
| `POST /api/mock/facturacion/seguimientos` | Receptor de `seguimiento.creado` |
| `GET /api/mock/facturacion/seguimientos` | Eventos recibidos |
| `POST /api/mock/inventario/clientes` | Receptor de `cliente.actualizado` |
| `GET /api/mock/events` | Inbound + outbound en memoria |

El mock es solo un arnés de desarrollo/demo. No contiene reglas de negocio, no genera
DTOs y no crea tablas en Neon.

## Ownership

- **CRM**: `seguimiento.creado`, historial 360°, tablas `crm.*`.
- **Clientes**: `cliente.actualizado`.
- **Pedidos**: `pedido.creado`.
- **Postventa**: `reclamo.creado`.

## Pendientes

- Contrato compartido OpenAPI/AsyncAPI.
- Firma HMAC y rotación de API keys.
- Inbox/outbox persistente.
- Definir si `pedido.creado` debe crear una interacción automática.
