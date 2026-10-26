/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { ClienteMaestro, ClienteMaestroPort } from '../ports/maestro.port';

/** Datos ficticios alineados con las interacciones demo existentes (ids 1..10). */
export const MOCK_CLIENTES: ClienteMaestro[] = [
  {
    idCliente: 1,
    rut: '11.111.111-1',
    nombre: 'Cliente Demo 1',
    email: 'cliente1@demo.cl',
  },
  {
    idCliente: 2,
    rut: '12.222.222-2',
    nombre: 'Cliente Demo 2',
    email: 'cliente2@demo.cl',
  },
  {
    idCliente: 3,
    rut: '13.333.333-3',
    nombre: 'Cliente Demo 3',
    email: 'cliente3@demo.cl',
  },
  {
    idCliente: 4,
    rut: '14.444.444-4',
    nombre: 'Cliente Demo 4',
    email: 'cliente4@demo.cl',
  },
  {
    idCliente: 5,
    rut: '15.555.555-5',
    nombre: 'Cliente Demo 5',
    email: 'cliente5@demo.cl',
  },
  {
    idCliente: 6,
    rut: '16.666.666-6',
    nombre: 'Cliente Demo 6',
    email: 'cliente6@demo.cl',
  },
  {
    idCliente: 7,
    rut: '17.777.777-7',
    nombre: 'Cliente Demo 7',
    email: 'cliente7@demo.cl',
  },
  {
    idCliente: 8,
    rut: '18.888.888-8',
    nombre: 'Cliente Demo 8',
    email: 'cliente8@demo.cl',
  },
  {
    idCliente: 9,
    rut: '19.999.999-9',
    nombre: 'Cliente Demo 9',
    email: 'cliente9@demo.cl',
  },
  {
    idCliente: 10,
    rut: '20.101.010-0',
    nombre: 'Cliente Demo 10',
    email: 'cliente10@demo.cl',
  },
];

/** Adaptador en memoria para tests, demo y el stack Docker local. */
@Injectable()
export class MockClienteMaestroAdapter implements ClienteMaestroPort {
  async findAll(): Promise<ClienteMaestro[]> {
    return MOCK_CLIENTES.map((cliente) => ({ ...cliente }));
  }

  async findById(id: number): Promise<ClienteMaestro | null> {
    return MOCK_CLIENTES.find((cliente) => cliente.idCliente === id) ?? null;
  }

  async findByRut(rut: string): Promise<ClienteMaestro | null> {
    const normalized = rut.replace(/\./g, '').trim().toLowerCase();
    return (
      MOCK_CLIENTES.find(
        (cliente) =>
          cliente.rut.replace(/\./g, '').trim().toLowerCase() === normalized,
      ) ?? null
    );
  }
}
