import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSeguimientoDto } from './create-seguimiento.dto';
import { UpdateSeguimientoEstadoDto } from './update-seguimiento-estado.dto';

async function validatePayload<T extends object>(
  target: new () => T,
  payload: Record<string, unknown>,
) {
  const dto = plainToInstance(target, payload);
  return validate(dto, { whitelist: true, forbidNonWhitelisted: true });
}

describe('CreateSeguimientoDto', () => {
  const validPayload = {
    idInteraccion: 10,
    fechaProgramada: '2999-01-01',
    accionRequerida: 'Llamar al cliente',
  };

  it('acepta un seguimiento válido', async () => {
    expect(
      await validatePayload(CreateSeguimientoDto, validPayload),
    ).toHaveLength(0);
  });

  it('rechaza una interacción faltante', async () => {
    const errors = await validatePayload(CreateSeguimientoDto, {
      fechaProgramada: '2999-01-01',
      accionRequerida: 'Llamar',
    });

    expect(errors.some((error) => error.property === 'idInteraccion')).toBe(
      true,
    );
  });

  it('rechaza una fecha programada pasada', async () => {
    const errors = await validatePayload(CreateSeguimientoDto, {
      ...validPayload,
      fechaProgramada: '2000-01-01',
    });

    expect(errors.some((error) => error.property === 'fechaProgramada')).toBe(
      true,
    );
  });

  it('rechaza una acción requerida en blanco', async () => {
    const errors = await validatePayload(CreateSeguimientoDto, {
      ...validPayload,
      accionRequerida: '   ',
    });

    expect(errors.some((error) => error.property === 'accionRequerida')).toBe(
      true,
    );
  });
});

describe('UpdateSeguimientoEstadoDto', () => {
  it('acepta un estado permitido', async () => {
    expect(
      await validatePayload(UpdateSeguimientoEstadoDto, {
        estado: 'completado',
      }),
    ).toHaveLength(0);
  });

  it('rechaza un estado no permitido', async () => {
    const errors = await validatePayload(UpdateSeguimientoEstadoDto, {
      estado: 'terminado',
    });

    expect(errors.some((error) => error.property === 'estado')).toBe(true);
  });
});
