import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Historial } from './entities/historial.entity';

@Injectable()
export class HistorialService {
  constructor(
    @InjectRepository(Historial)
    private readonly historialRepository: Repository<Historial>,
  ) {}

  findAll(): Promise<Historial[]> {
    return this.historialRepository.find({
      relations: ['cliente'],
    });
  }
}
