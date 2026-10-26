import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type {
  ClienteMaestro,
  ClienteMaestroPort,
  EmpleadoMaestroPort,
} from '../../common/ports/maestro.port';
import { MaestroNoDisponibleError } from '../../common/ports/maestro.port';
import { MaestrosService } from './maestros.service';

const cliente: ClienteMaestro = {
  idCliente: 1,
  rut: '11.111.111-1',
  nombre: 'Cliente Demo 1',
  email: 'cliente1@demo.cl',
};

function buildService() {
  const clientes: jest.Mocked<ClienteMaestroPort> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByRut: jest.fn(),
  };
  const empleados: jest.Mocked<EmpleadoMaestroPort> = {
    findById: jest.fn(),
  };

  return {
    clientes,
    empleados,
    service: new MaestrosService(clientes, empleados),
  };
}

describe('MaestrosService', () => {
  it('devuelve el cliente cuando existe', async () => {
    const { clientes, service } = buildService();
    clientes.findById.mockResolvedValue(cliente);

    await expect(service.assertClienteExists(1)).resolves.toEqual(cliente);
  });

  it('responde 404 cuando el cliente no existe', async () => {
    const { clientes, service } = buildService();
    clientes.findById.mockResolvedValue(null);

    await expect(service.assertClienteExists(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('traduce la caída del maestro de clientes a 503', async () => {
    const { clientes, service } = buildService();
    clientes.findById.mockRejectedValue(
      new MaestroNoDisponibleError('sin conexión'),
    );

    await expect(service.assertClienteExists(1)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('responde 404 cuando el empleado no existe', async () => {
    const { empleados, service } = buildService();
    empleados.findById.mockResolvedValue(null);

    await expect(service.assertEmpleadoExists(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('responde 404 cuando el RUT no existe', async () => {
    const { clientes, service } = buildService();
    clientes.findByRut.mockResolvedValue(null);

    await expect(
      service.findClienteByRut('11.111.111-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
