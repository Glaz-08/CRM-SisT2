import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ClienteActualizadoPayloadDto } from './cliente-actualizado.payload.dto';
import { EventEnvelopeDto } from './event-envelope.dto';
import { PedidoCreadoPayloadDto } from './pedido-creado.payload.dto';
import { SeguimientoCreadoPayloadDto } from './seguimiento-creado.payload.dto';

async function validatePayload<T extends object>(
  target: new () => T,
  payload: Record<string, unknown>,
) {
  const dto = plainToInstance(target, payload);
  return validate(dto, { whitelist: true, forbidNonWhitelisted: true });
}

describe('EventEnvelopeDto', () => {
  it('acepta un sobre con tipo conocido', async () => {
    const errors = await validatePayload(EventEnvelopeDto, {
      source: 'postventa',
      type: 'cliente.actualizado',
      payload: { idCliente: 1 },
    });

    expect(errors).toHaveLength(0);
  });

  it('rechaza un tipo de evento desconocido', async () => {
    const errors = await validatePayload(EventEnvelopeDto, {
      source: 'postventa',
      type: 'evento.inventado',
      payload: { idCliente: 1 },
    });

    expect(errors.some((error) => error.property === 'type')).toBe(true);
  });
});

describe('Payloads de eventos', () => {
  it('valida cliente.actualizado', async () => {
    expect(
      await validatePayload(ClienteActualizadoPayloadDto, { idCliente: 1 }),
    ).toHaveLength(0);

    const errors = await validatePayload(ClienteActualizadoPayloadDto, {});
    expect(errors.some((error) => error.property === 'idCliente')).toBe(true);
  });

  it('valida pedido.creado', async () => {
    expect(
      await validatePayload(PedidoCreadoPayloadDto, {
        idPedido: 10,
        idCliente: 1,
        fecha: '2026-10-26',
        total: 19990,
      }),
    ).toHaveLength(0);
  });

  it('valida seguimiento.creado y su estado', async () => {
    const payload = {
      idSeguimientoCrm: 1,
      idInteraccion: 2,
      idCliente: 3,
      idEmpleado: 4,
      fechaProgramada: '2026-10-27',
      accionRequerida: 'Llamar',
      estado: 'pendiente',
    };

    expect(
      await validatePayload(SeguimientoCreadoPayloadDto, payload),
    ).toHaveLength(0);

    const errors = await validatePayload(SeguimientoCreadoPayloadDto, {
      ...payload,
      estado: 'inventado',
    });
    expect(errors.some((error) => error.property === 'estado')).toBe(true);
  });
});
