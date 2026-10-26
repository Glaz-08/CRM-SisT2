/**
 * Siembra 10 clientes demo en `"master"."cliente"` de la base configurada en
 * `backend/.env`. Es idempotente: usa ON CONFLICT por id y luego ajusta la
 * secuencia para futuras inserciones. No crea ni altera el esquema.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');

function readEnv(filePath) {
  const values = {};

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) {
      continue;
    }

    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }

  return values;
}

const env = readEnv(envPath);

const clientes = [
  {
    idCliente: 1,
    rut: '11.111.111-1',
    nombre: 'Cliente Demo 1',
    correo: 'cliente1@demo.cl',
    telefono: '+56 9 1111 1111',
    direccion: 'Av. Demo 1',
  },
  {
    idCliente: 2,
    rut: '12.222.222-2',
    nombre: 'Cliente Demo 2',
    correo: 'cliente2@demo.cl',
    telefono: '+56 9 2222 2222',
    direccion: 'Av. Demo 2',
  },
  {
    idCliente: 3,
    rut: '13.333.333-3',
    nombre: 'Cliente Demo 3',
    correo: 'cliente3@demo.cl',
    telefono: '+56 9 3333 3333',
    direccion: 'Av. Demo 3',
  },
  {
    idCliente: 4,
    rut: '14.444.444-4',
    nombre: 'Cliente Demo 4',
    correo: 'cliente4@demo.cl',
    telefono: '+56 9 4444 4444',
    direccion: 'Av. Demo 4',
  },
  {
    idCliente: 5,
    rut: '15.555.555-5',
    nombre: 'Cliente Demo 5',
    correo: 'cliente5@demo.cl',
    telefono: '+56 9 5555 5555',
    direccion: 'Av. Demo 5',
  },
  {
    idCliente: 6,
    rut: '16.666.666-6',
    nombre: 'Cliente Demo 6',
    correo: 'cliente6@demo.cl',
    telefono: '+56 9 6666 6666',
    direccion: 'Av. Demo 6',
  },
  {
    idCliente: 7,
    rut: '17.777.777-7',
    nombre: 'Cliente Demo 7',
    correo: 'cliente7@demo.cl',
    telefono: '+56 9 7777 7777',
    direccion: 'Av. Demo 7',
  },
  {
    idCliente: 8,
    rut: '18.888.888-8',
    nombre: 'Cliente Demo 8',
    correo: 'cliente8@demo.cl',
    telefono: '+56 9 8888 8888',
    direccion: 'Av. Demo 8',
  },
  {
    idCliente: 9,
    rut: '19.999.999-9',
    nombre: 'Cliente Demo 9',
    correo: 'cliente9@demo.cl',
    telefono: '+56 9 9999 9999',
    direccion: 'Av. Demo 9',
  },
  {
    idCliente: 10,
    rut: '20.101.010-0',
    nombre: 'Cliente Demo 10',
    correo: 'cliente10@demo.cl',
    telefono: '+56 9 1010 1010',
    direccion: 'Av. Demo 10',
  },
];

const client = new Client({
  host: env.DB_HOST,
  port: Number(env.DB_PORT ?? 5432),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl:
    env.DB_SSL === 'false'
      ? false
      : {
          rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        },
});

try {
  await client.connect();
  await client.query('BEGIN');

  for (const cliente of clientes) {
    await client.query(
      `
        INSERT INTO "master"."cliente"
          (id_cliente, rut, nombre, correo, telefono, direccion)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id_cliente) DO NOTHING
      `,
      [
        cliente.idCliente,
        cliente.rut,
        cliente.nombre,
        cliente.correo,
        cliente.telefono,
        cliente.direccion,
      ],
    );
  }

  await client.query(`
    SELECT setval(
      pg_get_serial_sequence('master.cliente', 'id_cliente'),
      GREATEST(
        COALESCE((SELECT MAX(id_cliente) FROM "master"."cliente"), 1),
        1
      ),
      true
    )
  `);

  await client.query('COMMIT');

  const count = await client.query(
    'SELECT COUNT(*)::int AS total FROM "master"."cliente"',
  );
  console.log(
    `Seed maestro completado: master.cliente tiene ${count.rows[0].total} filas.`,
  );
} catch (error) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Si la conexión falló, no hay transacción que revertir.
  }
  console.error(
    'No se pudo poblar "master"."cliente":',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
