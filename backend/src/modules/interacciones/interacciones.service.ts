import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { toBoolean } from '../../common/config/env';
import { HistorialService } from '../historial/historial.service';
import { MaestrosService } from '../clientes/maestros.service';
import { CreateInteraccionDto } from './dto/create-interaccion.dto';
import { ListInteraccionesQueryDto } from './dto/list-interacciones-query.dto';
import { Interaccion } from './entities/interaccion.entity';

/**
 * Registra y consulta interacciones comerciales.
 * La creación valida los maestros y escribe la interacción y su historial en
 * una sola transacción.
 */
@Injectable()
export class InteraccionesService {
  constructor(
    @InjectRepository(Interaccion)
    private readonly interaccionesRepository: Repository<Interaccion>,
    private readonly dataSource: DataSource,
    private readonly historialService: HistorialService,
    private readonly maestrosService: MaestrosService,
    private readonly config: ConfigService,
  ) {}

  /** Crea la interacción y su evento de historial de forma atómica. */
  async create(dto: CreateInteraccionDto): Promise<Interaccion> {
    if (toBoolean(this.config.get<string>('VALIDAR_CLIENTE'), true)) {
      await this.maestrosService.assertClienteExists(dto.idCliente);
    }

    if (toBoolean(this.config.get<string>('VALIDAR_EMPLEADO'), true)) {
      await this.maestrosService.assertEmpleadoExists(dto.idEmpleado);
    }

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Interaccion);
      const interaccion = await repository.save(
        repository.create({
          idCliente: dto.idCliente,
          idEmpleado: dto.idEmpleado,
          fecha: dto.fecha,
          canal: dto.canal,
          detalle: dto.detalle,
        }),
      );

      await this.historialService.registrar(
        {
          idCliente: interaccion.idCliente,
          fecha: interaccion.fecha,
          tipoEvento: 'contacto_comercial',
          descripcion: `Se registró la interacción #${interaccion.idInteraccion} (${interaccion.canal}): ${interaccion.detalle}`,
        },
        manager,
      );

      return interaccion;
    });
  }

  /** Lista con filtros opcionales por cliente, empleado, canal y rango de fechas. */
  async findAll(query: ListInteraccionesQueryDto = {}): Promise<Interaccion[]> {
    if (query.desde && query.hasta && query.desde > query.hasta) {
      throw new BadRequestException(
        'El parámetro "desde" no puede ser posterior a "hasta"',
      );
    }

    const where: FindOptionsWhere<Interaccion> = {};

    if (query.idCliente) {
      where.idCliente = query.idCliente;
    }
    if (query.idEmpleado) {
      where.idEmpleado = query.idEmpleado;
    }
    if (query.canal) {
      where.canal = ILike(query.canal);
    }
    if (query.desde && query.hasta) {
      where.fecha = Between(query.desde, query.hasta);
    } else if (query.desde) {
      where.fecha = MoreThanOrEqual(query.desde);
    } else if (query.hasta) {
      where.fecha = LessThanOrEqual(query.hasta);
    }

    return this.interaccionesRepository.find({
      where,
      relations: ['seguimientos'],
      order: { fecha: 'DESC', idInteraccion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Interaccion> {
    const interaccion = await this.interaccionesRepository.findOne({
      where: { idInteraccion: id },
      relations: ['seguimientos'],
    });

    if (!interaccion) {
      throw new NotFoundException(`Interacción ${id} no encontrada`);
    }

    return interaccion;
  }

  async exists(id: number): Promise<boolean> {
    return this.interaccionesRepository.existsBy({ idInteraccion: id });
  }
}
