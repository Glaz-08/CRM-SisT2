# Plan: CRM — CRUD, historial y conexión Neon

> **Estado de implementación (2026-10-26): completado.** La configuración final usa
> `CLIENTE_MAESTRO_MODE=db` y `EMPLEADO_MAESTRO_MODE=mock`, con clientes reales en
> `"master"."cliente"` de `si2_22026`. Los conteos y la guía vigente están en `docs/`.
> Las referencias históricas a `MAESTROS_MODE`/`10/10/10` describen el punto de partida.

Branch: `plan/crm-crud-historial-neon`
Created: 2026-10-26

## Goal

Completar el módulo CRM del ERP:

- Ajustar las entidades TypeORM a las tablas reales del esquema `crm`.
- Implementar registro y consulta de interacciones.
- Implementar registro y consulta de seguimientos.
- Implementar actualización del estado de seguimiento.
- Implementar consulta del historial por cliente.
- Generar historial automáticamente al registrar una interacción.
- Validar campos obligatorios, textos vacíos, fechas y estados permitidos.
- Validar que exista la interacción al crear un seguimiento.
- Documentar las tres tablas del esquema `crm`.
- Configurar y verificar la conexión a Neon con SSL y variables de entorno.
- Mantener `synchronize: false` en la base compartida.
- Coordinar las relaciones con clientes y empleados.
- Verificar los 10 registros por tabla.
- Probar el flujo completo, el arranque con Docker Compose y la persistencia.
- Preparar y ensayar la demo del sprint.

## Context

### Esquema real verificado en Neon

Base: `si2_22026` (Neon, PostgreSQL 17.11). Conexión SSL con `rejectUnauthorized: true` verificada.

Solo existen estas tres tablas en `crm`:

- `crm.interaccion_crm`
  - `id_interaccion` integer identity PK
  - `id_cliente` integer NOT NULL
  - `id_empleado` integer NOT NULL
  - `fecha` date NOT NULL DEFAULT CURRENT_DATE
  - `canal` text NOT NULL CHECK `btrim(canal) <> ''`
  - `detalle` text NOT NULL CHECK `btrim(detalle) <> ''`
- `crm.seguimiento_crm`
  - `id_seguimiento_crm` integer identity PK
  - `id_interaccion` integer NOT NULL FK → `interaccion_crm(id_interaccion)`
  - `fecha_programada` date NOT NULL
  - `accion_requerida` text NOT NULL CHECK `btrim(accion_requerida) <> ''`
  - `estado` text NOT NULL DEFAULT `'pendiente'` CHECK en (`pendiente`, `en_proceso`, `completado`, `cancelado`)
- `crm.historial_cliente`
  - `id_historial` integer identity PK
  - `id_cliente` integer NOT NULL
  - `fecha` date NOT NULL DEFAULT CURRENT_DATE
  - `tipo_evento` text NOT NULL CHECK `btrim(tipo_evento) <> ''`
  - `descripcion` text NOT NULL CHECK `btrim(descripcion) <> ''`

### Estado actual del repositorio

- Las entidades `Interaccion`, `Seguimiento` y `Historial` ya calzan con las tablas reales. Fueron probadas contra Neon con TypeORM: columnas y relaciones funcionan.
- La entidad `Cliente` está rota: apunta a una tabla `crm.cliente` con `uuid` que no existe.
- Solo existen endpoints GET de listado; no hay DTOs, POST, PATCH, validaciones, historial automático ni reportes.
- `database.config.ts` ya usa SSL y `synchronize` por defecto en `false`.
- `backend/.env` existe y la conexión a Neon funciona.
- El frontend es un landing con conteos; no hay formularios CRUD.

### Datos actuales verificados

- `interaccion_crm`: 10 registros.
- `seguimiento_crm`: 10 registros, todos `pendiente`.
- `historial_cliente`: 10 registros, todos `contacto_comercial`.
- Interacciones: clientes `1..10`, empleado `1`, canales `whatsapp`/`email`, fecha `2026-10-25`.
- Seguimientos: programados para `2026-10-27`.
- Historial: descripciones del tipo `[DEMO] Se registró la interacción N: ...`.

### Hallazgo sobre clientes y empleados

- Los esquemas `ecommerce_ventas` y `rrhh` existen, pero están vacíos.
- No hay tablas maestras `cliente` ni `empleado` en la base compartida.
- Solo existen fixtures de otro módulo:
  - `logistica.test_log_ventas_cliente` (IDs `1001+`).
  - `logistica.test_log_rrhh_empleado` (IDs `301+`).
- Esos IDs no coinciden con los datos del CRM (`1..10` / `1`), por lo que no sirven como maestros reales.
- Consecuencia: la validación de identidad queda implementada como adaptador opcional, desactivada por flag hasta que existan las tablas maestras.

### Decisiones acordadas

- Demo del sprint: **API + curl/docs**, sin formularios nuevos en el frontend.
- Reportes: implementar `/api/reportes/resumen`; RBAC queda documentado como pendiente.
- Verificar los 10 registros existentes; no sembrar datos en Neon.
- Incluir en el historial los eventos de interacción, creación de seguimiento y cambio de estado.
- “Tiempo de respuesta”: usar días entre `fecha` de interacción y `fecha_programada` de seguimientos completados, porque no existe `fecha_completado`.
- Gestor de paquetes: npm (el Dockerfile ya usa `npm ci`).
- Comunicación entre módulos: contratos de eventos tipados + puertos/adaptadores; `@nestjs/event-emitter` solo desacopla módulos dentro del mismo proceso.
- Para otros módulos/servicios: HTTP (webhook) o broker; en este sprint, HTTP con un receptor mock.
- Mock ERP: solo desarrollo/demo, apagado por defecto (`ENABLE_MOCKS=false`), datos en memoria y sin tablas nuevas en Neon.
- Entrega de eventos: best-effort con timeout/retry y log en el sprint; outbox transaccional queda como mejora si se permite una cuarta tabla.

## Approach

### 0. Saneamiento previo

- Restaurar `backend/eslint.config.mjs` para que `npm run lint` funcione.
- Decidir el destino de `backend/src/schema/crm/` (archivos duplicados/incompletos) y de los archivos pnpm sin trackear.
- Mantener `backend/.env` fuera de git.

### 1. Configuración y conexión a Neon

- En `backend/src/config/database.config.ts`:
  - `synchronize: false` literal.
  - `migrationsRun: false`.
  - SSL configurable con `DB_SSL` y `DB_SSL_REJECT_UNAUTHORIZED` (default `true`).
  - Mantener `schema: 'crm'` y `autoLoadEntities: true`.
- En `backend/.env.example`:
  - agregar `DB_SSL_REJECT_UNAUTHORIZED`, `TZ=America/Santiago`;
  - agregar flags `VALIDAR_CLIENTE`, `VALIDAR_EMPLEADO` y nombres de tablas maestras.
- Agregar `GET /api/health/db` para verificar conectividad real a Neon.
- No modificar el esquema de Neon.

### 2. Entidades TypeORM y maestros

- Mantener `Interaccion`, `Seguimiento` y `Historial`.
- Eliminar el `Cliente` actual de `crm` y reemplazarlo por un adaptador de solo lectura:
  - `GET /api/clientes` consulta la tabla maestra si existe; si no, responde `503` con mensaje claro.
  - `GET /api/clientes/:id` y `GET /api/clientes/rut/:rut` para validación de identidad.
  - Sin `@ManyToOne` a maestros mientras las tablas no existan.
- Mantener `id_cliente` e `id_empleado` como `integer`.
- Definir puertos `ClienteMaestroPort` y `EmpleadoMaestroPort`, con dos adaptadores:
  - `MockClienteMaestroAdapter` / `MockEmpleadoMaestroAdapter`: datos en memoria alineados con los IDs actuales (`1..10` / `1`).
  - `HttpClienteMaestroAdapter` / `HttpEmpleadoMaestroAdapter`: llamadas a los módulos reales cuando existan.
  - La implementación se selecciona con `MAESTROS_MODE=mock|http`.
- Los servicios de negocio no consultan tablas maestras directamente: dependen de los puertos.
- Documentar relaciones lógicas:
  - `cliente 1—N interaccion_crm`
  - `empleado 1—N interaccion_crm`
  - `cliente 1—N historial_cliente`
  - `interaccion_crm 1—N seguimiento_crm`

### 3. DTOs y validación

- Crear `CreateInteraccionDto`, `CreateSeguimientoDto`, `UpdateSeguimientoEstadoDto` y DTOs de filtros.
- Reglas:
  - IDs enteros positivos.
  - Textos con `trim` y `@IsNotEmpty` (bloquea `""` y `"   "`).
  - Fechas `YYYY-MM-DD`, no anteriores a hoy, comparadas en `America/Santiago`.
  - `estado` solo en el DTO de actualización y con `@IsIn`.
  - `estado` inicial siempre `pendiente` en el servidor.
  - `ValidationPipe` con `whitelist`, `transform` y `forbidNonWhitelisted`.
- Agregar filtro global para traducir errores de PostgreSQL (`CHECK`, FK, unique) a 400/409.

### 4. Interacciones

- `POST /api/interacciones`:
  - validar DTO;
  - opcionalmente validar `idCliente` contra maestra;
  - guardar interacción y crear historial en la misma transacción;
  - `tipo_evento = 'contacto_comercial'`, consistente con los datos actuales;
  - descripción con ID, canal y detalle;
  - rollback completo si falla el historial.
- `GET /api/interacciones` con filtros por cliente, empleado, canal y rango de fechas.
- `GET /api/interacciones/:id` con 404 si no existe.
- Mantener respuestas de listado como arrays para no romper el contador del frontend.

### 5. Seguimientos

- `POST /api/seguimientos`:
  - verificar que la interacción exista (404 si no);
  - validar fecha programada;
  - forzar `estado = 'pendiente'`;
  - registrar `seguimiento_creado` en historial;
  - emitir `seguimiento.creado` después del commit.
- `GET /api/seguimientos` con filtros por estado, interacción y cliente.
- `GET /api/seguimientos/:id`.
- `PATCH /api/seguimientos/:id/estado`:
  - validar estado permitido;
  - actualizar;
  - registrar `seguimiento_actualizado` en historial;
  - devolver el seguimiento actualizado.
- No imponer transiciones rígidas en este sprint; documentarlas como mejora.

### 6. Historial 360 por cliente

- `GET /api/historial/cliente/:idCliente`, ordenado por fecha descendente.
- Mantener `GET /api/historial` global para el conteo del landing.
- El historial se nutre de interacciones, creación de seguimientos y cambios de estado.

### 7. Reportes

- Crear `backend/src/modules/reportes/`.
- `GET /api/reportes/resumen` con:
  - seguimientos por estado;
  - tiempo de respuesta promedio planificado;
  - casos abiertos por `id_empleado`;
  - interacciones por canal.
- Documentar que el tiempo real de cierre requiere `fecha_completado` (no existe en el esquema).

### 8. Comunicación entre módulos, contratos y mock ERP

#### 8.1 Diagnóstico

- `@nestjs/event-emitter` es in-process: desacopla módulos dentro de la misma API, pero no entrega eventos a otros contenedores/servicios.
- `POST /api/events` es el canal inbound actual; hoy solo emite `crm.payload.received` y hace log.
- No existe canal outbound; `seguimiento.creado` no se envía a facturación.
- Sin broker, el transporte con otros módulos será HTTP.

#### 8.2 Contrato de eventos

Sobre común (retrocompatible: `id`, `occurredAt` y `version` pueden ser opcionales al recibir):

```ts
export class EventEnvelopeDto {
  @IsOptional()
  @IsUUID()
  id?: string;                // idempotencia; se genera si falta

  @IsString()
  @IsNotEmpty()
  source: string;             // "crm", "clientes", "pedidos", "postventa"

  @IsIn(KNOWN_EVENT_TYPES)
  type: string;               // "seguimiento.creado", ...

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @IsOptional()
  @IsString()
  version?: string;           // "1.0"

  @IsObject()
  payload: Record<string, unknown>;
}
```

DTOs de payload:

- `SeguimientoCreadoPayloadDto`
- `ClienteActualizadoPayloadDto`
- `PedidoCreadoPayloadDto`

| Evento | Dirección | Emisor | Consumidor | Payload mínimo |
|---|---|---|---|---|
| `seguimiento.creado` | Outbound | CRM | Facturación | `idSeguimientoCrm`, `idInteraccion`, `idCliente`, `idEmpleado`, `fechaProgramada`, `accionRequerida`, `estado` |
| `cliente.actualizado` | Inbound | Clientes | Inventario; CRM lo consume para historial/log | `idCliente`, `rut`, `camposActualizados`, `ocurridoEn` |
| `pedido.creado` | Inbound | Pedidos | CRM (opcional) | `idPedido`, `idCliente`, `fecha`, `total` |
| `reclamo.creado` | Inbound | Postventa | CRM (futuro) | `idReclamo`, `idCliente`, `fecha`, `motivo` |

Aclaraciones de ownership:

- El CRM **emite** `seguimiento.creado`.
- El CRM **consume** `cliente.actualizado` y pedidos; no los reemite a inventario. Ese flujo pertenece al módulo de clientes/pedidos.
- `reclamo` pertenece a postventa; no se implementa en este sprint.
- No enviar `detalle` ni datos personales a facturación; solo IDs y acción requerida.

#### 8.3 Dispatcher inbound

`POST /api/events` debe:

1. Validar el sobre con `EventEnvelopeDto`.
2. Rechazar tipos fuera de la allowlist (`400`) y payloads inválidos (`400`).
3. Resolver el DTO de payload según `type` (`EVENT_DTO_BY_TYPE`).
4. Validar el payload con `plainToInstance` + `validate`.
5. Emitir `event.type` con el payload validado.
6. Responder `202` con `{ accepted: true, eventId }`.

Hoy `IntegracionService` emite siempre `crm.payload.received`; eso se mantiene como log interno, pero los handlers se suscriben al tipo real (`cliente.actualizado`, `pedido.creado`).

#### 8.4 Puertos y adaptadores outbound

```ts
export interface EventPublisherPort {
  publish(event: EventEnvelopeDto): Promise<void>;
}
```

Implementaciones:

- `NestEventPublisher`: emite dentro del proceso para listeners internos.
- `HttpEventPublisher`: `POST` al webhook del módulo destino, con timeout y retry.
- `MockEventPublisher`: guarda eventos en memoria para tests.

`SeguimientosService` depende de `EventPublisherPort`, no de HTTP ni del mock. El evento se publica **después del commit** de la transacción.

#### 8.5 Mock ERP (solo desarrollo/demo)

`MockErpModule` apagado por defecto y protegido por `MockEnabledGuard`:

```env
ENABLE_MOCKS=false
MAESTROS_MODE=mock          # mock | http
EVENT_DELIVERY_MODE=http    # nest | http
FACTURACION_WEBHOOK_URL=http://localhost:3000/api/mock/facturacion/seguimientos
INVENTARIO_WEBHOOK_URL=http://localhost:3000/api/mock/inventario/clientes
INTEGRATION_API_KEY=        # opcional
```

Rutas:

| Método | Ruta | Simula |
|---|---|---|
| GET | `/api/mock/clientes` | Maestro de clientes |
| GET | `/api/mock/clientes/:id` | Validación por ID |
| GET | `/api/mock/clientes/rut/:rut` | Validación por RUT |
| GET | `/api/mock/empleados/:id` | Maestro de empleados |
| POST | `/api/mock/facturacion/seguimientos` | Receptor de `seguimiento.creado` |
| GET | `/api/mock/facturacion/seguimientos` | Ver eventos recibidos |
| POST | `/api/mock/inventario/clientes` | Receptor de `cliente.actualizado` |
| GET | `/api/mock/events` | Inspeccionar eventos inbound/outbound |

Datos del mock:

- 10 clientes ficticios con IDs `1..10`, alineados con las interacciones existentes.
- 1 o más empleados con ID `1`.
- Todo en memoria; no se crean tablas en Neon.
- Si se prefiere mayor realismo, el mock puede ser un contenedor separado (`mock-erp`) en Docker Compose; para el sprint basta el módulo interno.

#### 8.6 Confiabilidad e idempotencia

- Entrega best-effort en el sprint: timeout + retry + log estructurado. Si falla el webhook, la operación de negocio sigue siendo válida.
- Si se exige entrega garantizada, agregar una tabla outbox `crm.evento_saliente` en la misma transacción y un dispatcher. Implica una cuarta tabla en el esquema compartido.
- Usar `eventId` para idempotencia; el receptor debe ignorar eventos duplicados.
- El mock deduplica en memoria; producción requeriría inbox persistente.
- Autenticación opcional con `INTEGRATION_API_KEY`; a futuro, HMAC/firma.


### 9. Documentación

- `docs/crm-schema.md`: diccionario de las tres tablas, constraints, relaciones y diagrama Mermaid.
- `docs/api.md`: endpoints, DTOs, ejemplos curl y códigos de error.
- `docs/events.md`: sobre de eventos, payloads versionados, ejemplos, allowlist, idempotencia y ownership.
- `docs/demo.md`: guion de demo.
- `docs/demo.http`: requests listos para ejecutar.
- Actualizar `README.md` con endpoints y configuración de Neon.
- Documentar maestros externos pendientes, mock ERP y RBAC pendiente.

### 10. Pruebas, Docker y demo

- Unit tests con fakes de `ClienteMaestroPort`, `EmpleadoMaestroPort` y `EventPublisherPort`:
  - validaciones de campos, fechas y estados;
  - historial automático y rollback;
  - interacción inexistente al crear seguimiento;
  - estado inicial `pendiente`;
  - evento `seguimiento.creado` emitido una sola vez, después del commit.
- Contract tests de DTOs de eventos: sobre válido, tipo desconocido, payload inválido, versión e idempotencia.
- Integration test de la transacción interacción + historial contra Postgres local.
- E2E con `MockErpModule`:
  - crear interacción con `idCliente` mock;
  - verificar historial;
  - crear seguimiento y comprobar `GET /api/mock/facturacion/seguimientos`;
  - enviar `cliente.actualizado` a `/api/events` y verificar el handler.
- `scripts/smoke-test.sh` contra Neon:
  1. health y health/db;
  2. counts 10/10/10;
  3. crear interacción;
  4. verificar historial automático;
  5. crear seguimiento;
  6. cambiar estado a `en_proceso` y `completado`;
  7. consultar historial por cliente;
  8. consultar reportes;
  9. reiniciar `crm-api`;
  10. verificar persistencia.
- `docker compose up --build` con Neon.
- `docker compose --profile local-db up --build` para persistencia local (override de variables).
- Restaurar lint y ejecutar `npm run lint`, `npm run build`, `npm test`.
- Ensayar la demo con validaciones fallidas y flujo exitoso.

## Files / Areas

- `backend/src/config/database.config.ts`
- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/common/` (decoradores, filtros, eventos)
- `backend/src/common/contracts/events/` (sobre + payload DTOs versionados)
- `backend/src/common/ports/` (`ClienteMaestroPort`, `EmpleadoMaestroPort`, `EventPublisherPort`)
- `backend/src/common/adapters/` (adaptadores mock/HTTP)
- `backend/src/modules/interacciones/`
- `backend/src/modules/seguimientos/`
- `backend/src/modules/historial/`
- `backend/src/modules/clientes/` (adaptador de maestros)
- `backend/src/modules/reportes/` (nuevo)
- `backend/src/modules/integracion/` (dispatcher inbound, event DTOs)
- `backend/src/modules/mock-erp/` (nuevo, dev-only, protegido por flag)
- `backend/.env.example`
- `backend/src/health/`
- `database/init/01_schema.sql` (solo referencia/documentación; sin cambios en Neon)
- `docs/crm-schema.md`
- `docs/api.md`
- `docs/events.md`
- `docs/demo.md`
- `docs/demo.http`
- `scripts/smoke-test.sh`
- `README.md`
- Tests en `backend/src/**/*.spec.ts` y `backend/test/`

## Verification

- Conexión: `GET /api/health/db` responde `up`.
- Conteos:
  ```sql
  SELECT 'interaccion_crm', count(*) FROM crm.interaccion_crm
  UNION ALL SELECT 'seguimiento_crm', count(*) FROM crm.seguimiento_crm
  UNION ALL SELECT 'historial_cliente', count(*) FROM crm.historial_cliente;
  ```
  Debe mostrar 10/10/10 antes de la demo.
- Flujo:
  - POST interacción válida → 201.
  - GET historial del cliente → incluye el evento automático.
  - POST seguimiento con interacción inexistente → 404.
  - POST seguimiento válido → 201 con `estado: "pendiente"`.
  - PATCH estado inválido → 400.
  - PATCH estado válido → 200.
  - GET historial por cliente → incluye eventos de seguimiento.
  - GET reportes → métricas coherentes.
- Eventos:
  - `POST /api/events` con `cliente.actualizado` válido → 202;
  - tipo desconocido → 400;
  - payload inválido → 400;
  - crear seguimiento → `GET /api/mock/facturacion/seguimientos` contiene `seguimiento.creado` una sola vez;
  - evento duplicado por `eventId` → no se procesa dos veces (si se implementa idempotencia).
- Validaciones:
  - falta `fecha`, `canal` o `detalle` → 400;
  - texto vacío o solo espacios → 400;
  - fecha anterior a hoy → 400;
  - estado fuera del enum → 400.
- Persistencia:
  - `docker compose restart api` y volver a consultar.
  - `docker compose down` + `up -d` (sin `-v`) y volver a consultar.
- Build:
  - `npm run lint`
  - `npm run build`
  - `npm test`

## Open Questions

- ¿Cuándo y quién creará `ecommerce_ventas.cliente` y `rrhh.empleado`? Sin ellas, `VALIDAR_CLIENTE` queda en `false`.
- ¿El equipo de autenticación entregará JWT/roles para proteger el historial 360? Por ahora RBAC queda documentado.
- ¿Se quiere agregar `fecha_completado` a `seguimiento_crm` para medir tiempo de respuesta real? Implica cambio de esquema compartido.
- ¿Se eliminan los archivos pnpm sin trackear o se migra el proyecto a pnpm?
- ¿Se conserva `backend/src/schema/crm/` como borrador o se elimina al consolidar las entidades?
- ¿La demo se ejecutará contra Neon (datos reales) o contra el Postgres local?
- ¿El mock ERP va dentro del mismo backend (`/api/mock`) o como contenedor separado `mock-erp`?
- ¿Se permite agregar `crm.evento_saliente` (outbox) al esquema compartido para entrega garantizada?
- ¿Qué API key/HMAC usarán los otros módulos para `POST /api/events`?
- ¿Quién emite `cliente.actualizado`, con qué payload y versión exacta?
- ¿`pedido.creado` debe crear una interacción automática o solo registrarse en historial?
- ¿Se publicará un contrato compartido (OpenAPI/AsyncAPI) para que los otros grupos generen clientes?
