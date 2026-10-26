# Plan: Frontend consumption of all CRM API endpoints

Branch: `plan/frontend-consume-crm-api`
Created: 2026-10-26

## Goal

Build out the React frontend so every operation exposed by the CRM API is usable from the UI, using `frontend/docs/api.json` as the endpoint checklist.

The frontend must cover:

- Health checks.
- Client master lookups.
- Interaction listing, filtering, detail and creation.
- Follow-up listing, filtering, detail, creation and status updates.
- Global and per-client history.
- Reports summary.
- Inbound event ingestion.
- The complete Mock ERP console when `ENABLE_MOCKS=true`.

## Context

### API specification status

`frontend/docs/api.json` contains 29 operations, but it is not usable for client generation:

- `components.schemas` exist but all have empty `properties`.
- Responses have no content schemas.
- `servers` is empty.
- Only paths, methods, path parameters and request-body DTO names are reliable.

Therefore:

- `api.json` is the coverage checklist.
- Types are written manually from the backend DTOs/entities and `docs/api.md`.
- No `openapi-typescript` or generated client in this iteration.

### Decisions agreed with the user

- Add `react-router-dom` and use one route per area.
- Mock ERP is a first-class `/mock-erp` page.
- Types are hand-written from the backend DTOs/entities, not generated from `api.json`.
- Keep the existing Lego theme and shared styles.
- Leave the unrelated untracked `backend/pnpm-lock.yaml` and `backend/pnpm-workspace.yaml` untouched.

### Important API details

- `POST /api/events` accepts only:
  - `cliente.actualizado`
  - `pedido.creado`
  - `reclamo.creado`
- `seguimiento.creado` is outbound-only and must not be offered as an inbound event.
- `GET /api/mock/empleados` exists in `api.json` but is missing from `docs/api.md`; implement it from `api.json`.
- Mock endpoints return `404` when `ENABLE_MOCKS=false`; this is a disabled state, not a crash.
- Backend validation errors may return `message` as a string or an array of strings.
- `GET /api/clientes` can return `503` when the client master is unavailable.
- `POST /api/interacciones` can return `404` for an unknown client/employee and `503` when a master is down.
- `POST /api/seguimientos` returns `404` when the interaction does not exist.
- Dates must be today or later in `America/Santiago`.

## Approach

### 1. Routing and navigation

Add `react-router-dom` as the only new runtime dependency.

Routes:

| Route | Page |
|---|---|
| `/` | Dashboard |
| `/clientes` | Clientes |
| `/interacciones` | Interacciones |
| `/seguimientos` | Seguimientos |
| `/historial` | Historial |
| `/reportes` | Reportes |
| `/integracion` | Integracion |
| `/mock-erp` | Mock ERP |

Update:

- `App.tsx` to render the router.
- `Header.tsx`, `Sidebar.tsx` and `ModuleCard.tsx` to use router links.
- `data/modules.ts` to include route paths plus Reportes and Mock ERP entries.
- Active-route styling in the sidebar and header.

The nginx config already has SPA fallback, so browser routes work in Docker.

### 2. API types, client and hooks

Create `src/api/`:

- `types.ts`
  - `Interaccion`
  - `Seguimiento`
  - `Historial`
  - `ClienteMaestro`
  - `EmpleadoMaestro`
  - `CreateInteraccionDto`
  - `CreateSeguimientoDto`
  - `UpdateSeguimientoEstadoDto`
  - `EstadoSeguimiento`
  - `ListInteraccionesFilters`
  - `ListSeguimientosFilters`
  - `ResumenReporte`
  - `EventEnvelope`
  - `ClienteActualizadoPayload`
  - `PedidoCreadoPayload`
  - `ReclamoCreadoPayload`
  - `MockEventsResponse`
  - `ApiErrorBody`
- `client.ts`
  - Base URL from `VITE_API_URL`, default `/api`.
  - JSON headers and parsing.
  - Query-string builder that omits empty values.
  - Path parameter encoding.
  - Request timeout.
  - `ApiError` carrying status, message and details.
  - Normalization of `string | string[]` validation messages.
- `endpoints.ts`
  - One typed function per API operation.
- `date.ts`
  - `todayInSantiago()` using `Intl.DateTimeFormat`.

Create hooks:

- `useApiResource`: `data`, `loading`, `error`, `reload`.
- `useApiAction`: `pending`, `error`, `run`, success callback.

No state-management or data-fetching library is added.

### 3. Shared UI components

Create `src/components/ui/`:

- `PageHeader`
- `Panel`
- `DataTable` with responsive card fallback on mobile
- `StatusBadge`
- `Field`
- `AsyncState` for loading/empty/error
- `ConfirmDialog` for destructive actions
- `JsonEditor` for event payloads and event inspection

Reuse the existing tokens in `src/styles/ui.ts` and `src/index.css`.

### 4. Page behavior

#### Dashboard `/`

Consume:

- `GET /health`
- `GET /health/db`
- `GET /interacciones`
- `GET /seguimientos`
- `GET /historial`

Show service status, database status, latency, failure reason and module counters. Link each module card to its route.

#### Clientes `/clientes`

Consume:

- `GET /clientes`
- `GET /clientes/:id`
- `GET /clientes/rut/:rut`

Show a table with ID, RUT, name and email. Support lookup by ID and by RUT. Render a clear `503` state when the master is unavailable.

#### Interacciones `/interacciones`

Consume:

- `GET /interacciones` with `idCliente`, `idEmpleado`, `canal`, `desde`, `hasta`
- `GET /interacciones/:id`
- `POST /interacciones`

Show a filterable table and a detail panel with nested `seguimientos`. Add a create form with all backend validation limits and a default date of today in Santiago.

#### Seguimientos `/seguimientos`

Consume:

- `GET /seguimientos` with `idInteraccion`, `idCliente`, `estado`, `desde`, `hasta`
- `GET /seguimientos/:id`
- `POST /seguimientos`
- `PATCH /seguimientos/:id/estado`

Show a filterable table and detail panel with the nested interaction. Add a create form and an inline status selector limited to:

- `pendiente`
- `en_proceso`
- `completado`
- `cancelado`

Refetch the list after creation and status changes.

#### Historial `/historial`

Consume:

- `GET /historial`
- `GET /historial/cliente/:idCliente`

Show the global timeline and a client filter. Display date, `tipoEvento`, description and client ID.

#### Reportes `/reportes`

Consume:

- `GET /reportes/resumen`

Show:

- Follow-ups by state.
- Average planned response time.
- Completed follow-ups.
- Open cases by employee.
- Interactions by channel.

Use CSS-only bars. No chart library. Handle the case where there are no completed follow-ups.

#### Integracion `/integracion`

Consume:

- `POST /events`

Provide preset event composers for the three inbound types only. Validate JSON locally, send the envelope and show `202`, `eventId` and validation details. Note that inbound events can be inspected in Mock ERP only while mocks are enabled.

#### Mock ERP `/mock-erp`

Consume:

- `GET /mock/clientes`
- `GET /mock/clientes/:id`
- `GET /mock/clientes/rut/:rut`
- `GET /mock/empleados`
- `GET /mock/empleados/:id`
- `GET /mock/facturacion/seguimientos`
- `POST /mock/facturacion/seguimientos`
- `DELETE /mock/facturacion/seguimientos`
- `GET /mock/inventario/clientes`
- `POST /mock/inventario/clientes`
- `DELETE /mock/inventario/clientes`
- `GET /mock/events`
- `DELETE /mock/events`

Use tabs:

- **Clientes:** list and ID/RUT lookup.
- **Empleados:** list and ID lookup.
- **Facturacion:** received `seguimiento.creado` events, manual receiver POST and confirmed clear.
- **Inventario:** received `cliente.actualizado` events, manual receiver POST and confirmed clear.
- **Eventos:** consolidated inbound/facturacion/inventario view and confirmed clear.

Probe `GET /mock/events` on page load. A `404` renders the disabled message `ENABLE_MOCKS=true` instead of an error state.

### 5. Error and form handling

- `400`: map validation messages to field errors or a details banner.
- `404`: show the missing resource and its ID, with a reload action.
- `409`: show a duplicate/conflict message.
- `503`: explain that the database or external master is unavailable.
- Mock `404`: render the disabled Mock ERP state.
- Disable submit buttons while pending.
- Trim text inputs before submit.
- Enforce positive integer IDs, date minimums and length limits client-side.
- Refetch the affected list after successful mutations.
- No optimistic updates in this iteration.

## Endpoint coverage checklist

### Health

- [ ] `GET /health`
- [ ] `GET /health/db`

### Clientes

- [ ] `GET /clientes`
- [ ] `GET /clientes/rut/:rut`
- [ ] `GET /clientes/:id`

### Historial

- [ ] `GET /historial`
- [ ] `GET /historial/cliente/:idCliente`

### Interacciones

- [ ] `POST /interacciones`
- [ ] `GET /interacciones`
- [ ] `GET /interacciones/:id`

### Seguimientos

- [ ] `POST /seguimientos`
- [ ] `GET /seguimientos`
- [ ] `GET /seguimientos/:id`
- [ ] `PATCH /seguimientos/:id/estado`

### Reportes

- [ ] `GET /reportes/resumen`

### Integracion

- [ ] `POST /events`

### Mock ERP

- [ ] `GET /mock/clientes`
- [ ] `GET /mock/clientes/rut/:rut`
- [ ] `GET /mock/clientes/:id`
- [ ] `GET /mock/empleados`
- [ ] `GET /mock/empleados/:id`
- [ ] `POST /mock/facturacion/seguimientos`
- [ ] `GET /mock/facturacion/seguimientos`
- [ ] `DELETE /mock/facturacion/seguimientos`
- [ ] `POST /mock/inventario/clientes`
- [ ] `GET /mock/inventario/clientes`
- [ ] `DELETE /mock/inventario/clientes`
- [ ] `GET /mock/events`
- [ ] `DELETE /mock/events`

## Implementation order

1. Add `react-router-dom`, create `router.tsx` and wire navigation.
2. Add API types, client, endpoints, date helper and hooks.
3. Build shared UI components.
4. Implement Dashboard and Clientes.
5. Implement Interacciones and Seguimientos, including mutations.
6. Implement Historial, Reportes and Integracion.
7. Implement Mock ERP.
8. Audit every API operation against the checklist.
9. Run build and manual QA.

## Files / Areas

- `frontend/package.json`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/router.tsx` (new)
- `frontend/src/api/` (new)
- `frontend/src/hooks/` (extend)
- `frontend/src/components/ui/` (new)
- `frontend/src/components/Header.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/ModuleCard.tsx`
- `frontend/src/data/modules.ts`
- `frontend/src/pages/` (new)
- `frontend/src/styles/ui.ts`
- `frontend/docs/api.json` (read-only checklist)

## Verification

- `cd frontend && npm run build` passes with strict TypeScript.
- Every operation in the endpoint coverage checklist is reachable from the UI.
- Creating an interaction appears in the interaction list and in history.
- Creating a follow-up with an unknown interaction shows `404`.
- A valid follow-up appears as `pendiente`.
- Changing a follow-up status updates the row and adds a history entry.
- Filters generate correct query strings and omit empty values.
- RUT lookup works with and without dots/dashes.
- Report totals match the visible data.
- `/events` rejects unknown types and invalid payloads with readable details.
- Mock ERP renders the disabled state with `ENABLE_MOCKS=false` and the full console with `ENABLE_MOCKS=true`.
- DELETE actions require confirmation.
- Run write-flow QA against local PostgreSQL rather than Neon unless demo records are explicitly wanted.

## Open Questions

- Should future iterations add backend `@ApiProperty` annotations and regenerate `docs/api.json` so the client can be generated?
- Should automated frontend tests be added in a later task? No test framework is currently configured.
- Should the client master be used to enrich interaction/follow-up rows with client names, or is showing IDs sufficient for this iteration?
