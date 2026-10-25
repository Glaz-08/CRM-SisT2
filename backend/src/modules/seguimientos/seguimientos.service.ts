import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seguimiento } from './entities/seguimiento.entity';

@Injectable()
export class SeguimientosService {
  constructor(
    @InjectRepository(Seguimiento)
    private readonly seguimientosRepository: Repository<Seguimiento>,
  ) {}

  findAll(): Promise<Seguimiento[]> {
    return this.seguimientosRepository.find({
      relations: ['interaccion'],
      order: { fechaProgramada: 'ASC' },
    });
  }
}
