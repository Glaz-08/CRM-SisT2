import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interaccion } from './entities/interaccion.entity';

@Injectable()
export class InteraccionesService {
  constructor(
    @InjectRepository(Interaccion)
    private readonly interaccionesRepository: Repository<Interaccion>,
  ) {}

  findAll(): Promise<Interaccion[]> {
    return this.interaccionesRepository.find({
      relations: ['cliente'],
    });
  }
}
