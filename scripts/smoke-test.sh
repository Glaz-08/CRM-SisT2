#!/usr/bin/env bash
# Smoke test end-to-end del CRM.
# Requiere curl y jq. Si detecta el contenedor `crm-api`, también reinicia la API
# para verificar persistencia; en local contra Neon usa `SKIP_DOCKER_RESTART=true`.
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000/api}"
EXPECT_BASE_COUNTS="${EXPECT_BASE_COUNTS:-false}"
SKIP_DOCKER_RESTART="${SKIP_DOCKER_RESTART:-false}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
BODY="$TMP_DIR/body.json"

fail() {
  echo "ERROR: $*" >&2
  if [ -s "$BODY" ]; then
    echo "Respuesta:" >&2
    cat "$BODY" >&2
    echo >&2
  fi
  exit 1
}

expect_status() {
  local expected="$1"
  shift
  local code
  code="$(curl -sS -o "$BODY" -w '%{http_code}' "$@")"
  if [ "$code" != "$expected" ]; then
    fail "se esperaba HTTP $expected, se recibió $code"
  fi
}

json_get() {
  jq -er "$1" < "$BODY"
}

today() {
  date +%F
}

tomorrow() {
  date -d '+1 day' +%F 2>/dev/null || date -v+1d +%F
}

command -v curl >/dev/null 2>&1 || fail "curl es requerido"
command -v jq >/dev/null 2>&1 || fail "jq es requerido"

echo "== CRM smoke test =="
echo "API: $API_URL"

echo
echo "1) Health"
expect_status 200 "$API_URL/health"
jq -e '.status == "ok"' < "$BODY" >/dev/null || fail "health no está ok"
expect_status 200 "$API_URL/health/db"
jq -e '.db == "up"' < "$BODY" >/dev/null || fail "la base de datos no está up"
echo "   health y health/db OK"

echo
echo "2) Conteos iniciales"
expect_status 200 "$API_URL/interacciones"
INTERACCIONES="$(jq 'length' < "$BODY")"
expect_status 200 "$API_URL/seguimientos"
SEGUIMIENTOS="$(jq 'length' < "$BODY")"
expect_status 200 "$API_URL/historial"
HISTORIAL="$(jq 'length' < "$BODY")"
echo "   interacciones=$INTERACCIONES seguimientos=$SEGUIMIENTOS historial=$HISTORIAL"
if [ "$EXPECT_BASE_COUNTS" = "true" ] && [ "$INTERACCIONES/$SEGUIMIENTOS/$HISTORIAL" != "10/10/10" ]; then
  fail "se esperaban conteos base 10/10/10"
fi

echo
echo "3) Validaciones de entrada"
TODAY="$(today)"
TOMORROW="$(tomorrow)"

expect_status 400 -X POST "$API_URL/interacciones" \
  -H 'Content-Type: application/json' \
  -d "{\"idCliente\":1,\"idEmpleado\":1,\"fecha\":\"$TODAY\",\"detalle\":\"sin canal\"}"
echo "   falta canal -> 400"

expect_status 400 -X POST "$API_URL/interacciones" \
  -H 'Content-Type: application/json' \
  -d "{\"idCliente\":1,\"idEmpleado\":1,\"fecha\":\"$TODAY\",\"canal\":\"email\",\"detalle\":\"   \"}"
echo "   detalle en blanco -> 400"

expect_status 400 -X POST "$API_URL/interacciones" \
  -H 'Content-Type: application/json' \
  -d '{"idCliente":1,"idEmpleado":1,"fecha":"2000-01-01","canal":"email","detalle":"fecha pasada"}'
echo "   fecha pasada -> 400"

expect_status 400 -X PATCH "$API_URL/seguimientos/1/estado" \
  -H 'Content-Type: application/json' \
  -d '{"estado":"terminado"}'
echo "   estado inválido -> 400"

expect_status 404 -X POST "$API_URL/seguimientos" \
  -H 'Content-Type: application/json' \
  -d "{\"idInteraccion\":999999,\"fechaProgramada\":\"$TOMORROW\",\"accionRequerida\":\"interacción inexistente\"}"
echo "   interacción inexistente -> 404"

echo
echo "4) Crear interacción + historial automático"
expect_status 200 "$API_URL/historial/cliente/1"
HIST_BEFORE="$(jq 'length' < "$BODY")"

expect_status 201 -X POST "$API_URL/interacciones" \
  -H 'Content-Type: application/json' \
  -d "{\"idCliente\":1,\"idEmpleado\":1,\"fecha\":\"$TODAY\",\"canal\":\"whatsapp\",\"detalle\":\"[DEMO] Smoke test de interacción\"}"
INTERACCION_ID="$(json_get '.idInteraccion')"
[ "$INTERACCION_ID" != "null" ] || fail "la interacción no tiene id"
echo "   interacción creada: #$INTERACCION_ID"

expect_status 200 "$API_URL/historial/cliente/1"
HIST_AFTER="$(jq 'length' < "$BODY")"
[ "$HIST_AFTER" -eq $((HIST_BEFORE + 1)) ] || fail "el historial no creció exactamente en 1"
jq -e --arg id "#$INTERACCION_ID" 'any(.[]; .descripcion | contains($id))' < "$BODY" >/dev/null \
  || fail "el historial no contiene la interacción creada"
echo "   historial automático OK"

echo
echo "5) Crear seguimiento + evento a facturación"
expect_status 201 -X POST "$API_URL/seguimientos" \
  -H 'Content-Type: application/json' \
  -d "{\"idInteraccion\":$INTERACCION_ID,\"fechaProgramada\":\"$TOMORROW\",\"accionRequerida\":\"[DEMO] Llamar al cliente\"}"
SEGUIMIENTO_ID="$(json_get '.idSeguimientoCrm')"
ESTADO_INICIAL="$(json_get '.estado')"
[ "$ESTADO_INICIAL" = "pendiente" ] || fail "el estado inicial no es pendiente"
echo "   seguimiento creado: #$SEGUIMIENTO_ID estado=$ESTADO_INICIAL"

expect_status 200 "$API_URL/seguimientos/$SEGUIMIENTO_ID"
jq -e '.estado == "pendiente"' < "$BODY" >/dev/null || fail "GET seguimiento no devuelve pendiente"

if curl -sS -o "$BODY" -w '%{http_code}' "$API_URL/mock/facturacion/seguimientos" | grep -q '^200$'; then
  jq -e --argjson id "$SEGUIMIENTO_ID" \
    'any(.[]; .type == "seguimiento.creado" and .payload.idSeguimientoCrm == $id)' \
    < "$BODY" >/dev/null || fail "facturación no recibió seguimiento.creado"
  echo "   mock facturación recibió seguimiento.creado"
else
  echo "   mock facturación no disponible (ENABLE_MOCKS=false); se omite la comprobación"
fi

echo
echo "6) Cambios de estado + historial"
expect_status 200 -X PATCH "$API_URL/seguimientos/$SEGUIMIENTO_ID/estado" \
  -H 'Content-Type: application/json' \
  -d '{"estado":"en_proceso"}'
expect_status 200 -X PATCH "$API_URL/seguimientos/$SEGUIMIENTO_ID/estado" \
  -H 'Content-Type: application/json' \
  -d '{"estado":"completado"}'
jq -e '.estado == "completado"' < "$BODY" >/dev/null || fail "el seguimiento no quedó completado"
echo "   estado final: completado"

expect_status 200 "$API_URL/historial/cliente/1"
jq -e --arg id "#$SEGUIMIENTO_ID" \
  'any(.[]; .tipoEvento == "seguimiento_creado" and (.descripcion | contains($id)))' \
  < "$BODY" >/dev/null || fail "falta el historial de creación del seguimiento"
jq -e --arg id "#$SEGUIMIENTO_ID" \
  'any(.[]; .tipoEvento == "seguimiento_actualizado" and (.descripcion | contains($id)))' \
  < "$BODY" >/dev/null || fail "falta el historial de actualización del seguimiento"
echo "   historial de seguimiento OK"

echo
echo "7) Reportes"
expect_status 200 "$API_URL/reportes/resumen"
jq -e '
  (.seguimientosPorEstado | type) == "array" and
  (.casosAbiertosPorEmpleado | type) == "array" and
  (.interaccionesPorCanal | type) == "array" and
  (.seguimientosCompletados | type) == "number"
' < "$BODY" >/dev/null || fail "el resumen de reportes no tiene la forma esperada"
echo "   reportes OK"

echo
echo "8) Evento inbound cliente.actualizado + deduplicación"
EVENT_ID="$(node -e 'console.log(require("crypto").randomUUID())')"
expect_status 202 -X POST "$API_URL/events" \
  -H 'Content-Type: application/json' \
  -d "{\"id\":\"$EVENT_ID\",\"source\":\"postventa\",\"type\":\"cliente.actualizado\",\"payload\":{\"idCliente\":1,\"rut\":\"11.111.111-1\",\"camposActualizados\":{\"email\":\"nuevo@demo.cl\"}}}"

expect_status 200 "$API_URL/historial/cliente/1"
HIST_AFTER_EVENT="$(jq 'length' < "$BODY")"
jq -e 'any(.[]; .tipoEvento == "cliente_actualizado")' < "$BODY" >/dev/null \
  || fail "el handler de cliente.actualizado no escribió historial"

expect_status 202 -X POST "$API_URL/events" \
  -H 'Content-Type: application/json' \
  -d "{\"id\":\"$EVENT_ID\",\"source\":\"postventa\",\"type\":\"cliente.actualizado\",\"payload\":{\"idCliente\":1,\"rut\":\"11.111.111-1\"}}"
expect_status 200 "$API_URL/historial/cliente/1"
HIST_AFTER_DUPLICATE="$(jq 'length' < "$BODY")"
[ "$HIST_AFTER_DUPLICATE" -eq "$HIST_AFTER_EVENT" ] \
  || fail "el evento duplicado volvió a escribir historial"
echo "   cliente.actualizado procesado y duplicado ignorado"

expect_status 400 -X POST "$API_URL/events" \
  -H 'Content-Type: application/json' \
  -d '{"source":"postventa","type":"cliente.actualizado","payload":{}}'
echo "   payload inbound inválido -> 400"

if curl -sS -o "$BODY" -w '%{http_code}' "$API_URL/mock/events" | grep -q '^200$'; then
  jq -e --arg id "$EVENT_ID" 'any(.inbound[]; .id == $id)' < "$BODY" >/dev/null \
    || fail "mock/events no registró el evento inbound"
  echo "   mock/events registró el evento inbound"
fi

echo
echo "9) Persistencia"
if [ "$SKIP_DOCKER_RESTART" = "true" ]; then
  echo "   reinicio de Docker omitido (SKIP_DOCKER_RESTART=true)"
elif command -v docker >/dev/null 2>&1 && docker compose ps --status running --quiet api >/dev/null 2>&1; then
  echo "   reiniciando crm-api..."
  docker compose restart api >/dev/null
  for _ in $(seq 1 30); do
    if curl -fsS "$API_URL/health" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  expect_status 200 "$API_URL/interacciones/$INTERACCION_ID"
  jq -e --argjson id "$INTERACCION_ID" '.idInteraccion == $id' < "$BODY" >/dev/null \
    || fail "la interacción no persistió tras reiniciar"
  expect_status 200 "$API_URL/seguimientos/$SEGUIMIENTO_ID"
  jq -e '.estado == "completado"' < "$BODY" >/dev/null \
    || fail "el seguimiento no persistió tras reiniciar"
  echo "   interacción y seguimiento persistieron"
else
  echo "   crm-api no está corriendo en Docker; se omite el reinicio"
fi

echo
echo "== Smoke test OK =="
echo "Interacción: #$INTERACCION_ID"
echo "Seguimiento: #$SEGUIMIENTO_ID"
echo "Event ID: $EVENT_ID"
