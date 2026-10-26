import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateInteraccionDto } from './create-interaccion.dto';

async function validatePayload(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateInteraccionDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, errors };
}

describe('CreateInteraccionDto', () => {
  const validPayload = {
    idCliente: 1,
    idEmpleado: 1,
    fecha: '2999-01-01',
    canal: 'whatsapp',
    detalle: 'Consulta por despacho',
  };

  it('acepta un payload válido y convierte ids numéricos', async () => {
    const { dto, errors } = await validatePayload({
      ...validPayload,
      idCliente: '1',
      idEmpleado: '2',
    });

    expect(errors).toHaveLength(0);
    expect(dto.idCliente).toBe(1);
    expect(dto.idEmpleado).toBe(2);
  });

  it('recorta espacios en canal y detalle', async () => {
    const { dto, errors } = await validatePayload({
      ...validPayload,
      canal: '  whatsapp  ',
      detalle: '  Consulta  ',
    });

    expect(errors).toHaveLength(0);
    expect(dto.canal).toBe('whatsapp');
    expect(dto.detalle).toBe('Consulta');
  });

  it('rechaza canal vacío después del trim', async () => {
    const { errors } = await validatePayload({
      ...validPayload,
      canal: '   ',
    });

    expect(errors.some((error) => error.property === 'canal')).toBe(true);
  });

  it('rechaza detalle vacío', async () => {
    const { errors } = await validatePayload({
      ...validPayload,
      detalle: '   ',
    });

    expect(errors.some((error) => error.property === 'detalle')).toBe(true);
  });

  it('rechaza fechas pasadas', async () => {
    const { errors } = await validatePayload({
      ...validPayload,
      fecha: '2000-01-01',
    });

    expect(errors.some((error) => error.property === 'fecha')).toBe(true);
  });

  it('rechaza fechas con formato o día inválido', async () => {
    const { errors } = await validatePayload({
      ...validPayload,
      fecha: '2026-02-30',
    });

    expect(errors.some((error) => error.property === 'fecha')).toBe(true);
  });

  it('rechaza campos no declarados', async () => {
    const { errors } = await validatePayload({
      ...validPayload,
      campoExtra: 'no permitido',
    });

    expect(errors.some((error) => error.property === 'campoExtra')).toBe(true);
  });
});
