import { DataSource } from 'typeorm';
import { DbClienteMaestroAdapter } from './db-cliente-maestro.adapter';
import { MaestroNoDisponibleError } from '../ports/maestro.port';

function adapterWith(query: jest.Mock): DbClienteMaestroAdapter {
  return new DbClienteMaestroAdapter({ query } as unknown as DataSource);
}

describe('DbClienteMaestroAdapter', () => {
  it('mapea una fila de master.cliente al contrato del puerto', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        id_cliente: 1,
        rut: '11.111.111-1',
        nombre: 'Cliente Demo 1',
        correo: 'cliente1@demo.cl',
      },
    ]);

    const cliente = await adapterWith(query).findById(1);

    expect(cliente).toEqual({
      idCliente: 1,
      rut: '11.111.111-1',
      nombre: 'Cliente Demo 1',
      email: 'cliente1@demo.cl',
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('FROM "master"."cliente"'),
      [1],
    );
  });

  it('devuelve null cuando el cliente no existe', async () => {
    const query = jest.fn().mockResolvedValue([]);

    await expect(adapterWith(query).findById(999)).resolves.toBeNull();
  });

  it('lista y ordena los clientes, descartando filas sin id válido', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        id_cliente: 1,
        rut: null,
        nombre: 'Cliente Demo 1',
        correo: null,
      },
      {
        id_cliente: 'sin-id',
        rut: '12.222.222-2',
        nombre: 'Cliente inválido',
        correo: 'invalido@demo.cl',
      },
    ]);

    await expect(adapterWith(query).findAll()).resolves.toEqual([
      {
        idCliente: 1,
        rut: '',
        nombre: 'Cliente Demo 1',
        email: null,
      },
    ]);
  });

  it('normaliza el RUT antes de consultar y devuelve el primer resultado', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        id_cliente: 1,
        rut: '11.111.111-1',
        nombre: 'Cliente Demo 1',
        correo: 'cliente1@demo.cl',
      },
    ]);

    const cliente = await adapterWith(query).findByRut('11.111.111-1');

    expect(cliente?.idCliente).toBe(1);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('regexp_replace'),
      ['111111111'],
    );
  });

  it('traduce errores de base de datos a MaestroNoDisponibleError', async () => {
    const query = jest.fn().mockRejectedValue(new Error('connection refused'));

    await expect(adapterWith(query).findAll()).rejects.toBeInstanceOf(
      MaestroNoDisponibleError,
    );
  });
});
