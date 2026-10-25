CREATE SCHEMA IF NOT EXISTS crm;

CREATE TABLE IF NOT EXISTS crm.interaccion_crm (
  id_interaccion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cliente     INTEGER NOT NULL,
  id_empleado    INTEGER NOT NULL,
  fecha          DATE    NOT NULL DEFAULT CURRENT_DATE,
  canal          TEXT    NOT NULL CHECK (btrim(canal) <> ''),
  detalle        TEXT    NOT NULL CHECK (btrim(detalle) <> '')
);

CREATE TABLE IF NOT EXISTS crm.seguimiento_crm (
  id_seguimiento_crm INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_interaccion     INTEGER NOT NULL REFERENCES crm.interaccion_crm (id_interaccion),
  fecha_programada   DATE    NOT NULL,
  accion_requerida   TEXT    NOT NULL CHECK (btrim(accion_requerida) <> ''),
  estado             TEXT    NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cancelado'))
);

CREATE TABLE IF NOT EXISTS crm.historial_cliente (
  id_historial INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cliente   INTEGER NOT NULL,
  fecha        DATE    NOT NULL DEFAULT CURRENT_DATE,
  tipo_evento  TEXT    NOT NULL CHECK (btrim(tipo_evento) <> ''),
  descripcion  TEXT    NOT NULL CHECK (btrim(descripcion) <> '')
);
