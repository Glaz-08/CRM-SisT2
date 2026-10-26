import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Historial } from './entities/historial.entity';

/** Lee y escribe la vista 360° del cliente en `crm.historial_cliente`. */
@Injectable()
export class HistorialService {
  constructor(
    @InjectRepository(Historial)
    private readonly historialRepository: Repository<Historial>,
  ) {}

  findAll(): Promise<Historial[]> {
    return this.historialRepository.find({
      order: { fecha: 'DESC', idHistorial: 'DESC' },
    });
  }

  findByCliente(idCliente: number): Promise<Historial[]> {
    return this.historialRepository.find({
      where: { idCliente },
      order: { fecha: 'DESC', idHistorial: 'DESC' },
    });
  }

  /**
   * Permite participar de la transacción de otro módulo (mismo EntityManager).
   * Si no se pasa manager, usa la conexión normal.
   */
  async registrar(
    entry: Partial<Historial>,
    manager?: EntityManager,
  ): Promise<Historial> {
    const repository = manager
      ? manager.getRepository(Historial)
      : this.historialRepository;

    return repository.save(repository.create(entry));
  }
}
