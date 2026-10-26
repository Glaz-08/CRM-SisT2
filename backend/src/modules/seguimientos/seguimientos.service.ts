import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import type { EventEnvelope } from '../../common/contracts/events/event-envelope.dto';
import { EVENT_PUBLISHER } from '../../common/ports/event-publisher.port';
import type { EventPublisherPort } from '../../common/ports/event-publisher.port';
import { todayInTimeZone } from '../../common/validation/date-only.validator';
import { HistorialService } from '../historial/historial.service';
import { Interaccion } from '../interacciones/entities/interaccion.entity';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';
import { ListSeguimientosQueryDto } from './dto/list-seguimientos-query.dto';
import { UpdateSeguimientoEstadoDto } from './dto/update-seguimiento-estado.dto';
import { Seguimiento } from './entities/seguimiento.entity';

/**
 * Gestiona seguimientos y su historial.
 * La creación y los cambios de estado se confirman en base antes de publicar
 * eventos externos, para no perder el dato si un webhook falla.
 */
@Injectable()
export class SeguimientosService {
  private readonly logger = new Logger(SeguimientosService.name);

  constructor(
    @InjectRepository(Seguimiento)
    private readonly seguimientosRepository: Repository<Seguimiento>,
    private readonly dataSource: DataSource,
    private readonly historialService: HistorialService,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  /** Crea un seguimiento pendiente y publica `seguimiento.creado` a facturación. */
  async create(dto: CreateSeguimientoDto): Promise<Seguimiento> {
    const result = await this.dataSource.transaction(async (manager) => {
      const interaccion = await manager
        .getRepository(Interaccion)
        .findOneBy({ idInteraccion: dto.idInteraccion });

      if (!interaccion) {
        throw new NotFoundException(
          `Interacción ${dto.idInteraccion} no encontrada; no se puede crear el seguimiento`,
        );
      }

      const repository = manager.getRepository(Seguimiento);
      const seguimiento = await repository.save(
        repository.create({
          idInteraccion: dto.idInteraccion,
          fechaProgramada: dto.fechaProgramada,
          accionRequerida: dto.accionRequerida,
          estado: 'pendiente',
        }),
      );

      await this.historialService.registrar(
        {
          idCliente: interaccion.idCliente,
          fecha: todayInTimeZone(),
          tipoEvento: 'seguimiento_creado',
          descripcion: `Se creó el seguimiento #${seguimiento.idSeguimientoCrm} (estado inicial: pendiente) para la interacción #${interaccion.idInteraccion}: ${seguimiento.accionRequerida}`,
        },
        manager,
      );

      return { seguimiento, interaccion };
    });

    await this.publishSeguimientoCreado(result.seguimiento, result.interaccion);

    return result.seguimiento;
  }

  /** Lista seguimientos con filtros por interacción, cliente, estado y fecha. */
  async findAll(query: ListSeguimientosQueryDto = {}): Promise<Seguimiento[]> {
    if (query.desde && query.hasta && query.desde > query.hasta) {
      throw new BadRequestException(
        'El parámetro "desde" no puede ser posterior a "hasta"',
      );
    }

    const qb = this.seguimientosRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.interaccion', 'i')
      .orderBy('s.fechaProgramada', 'ASC')
      .addOrderBy('s.idSeguimientoCrm', 'ASC');

    if (query.idInteraccion) {
      qb.andWhere('s.idInteraccion = :idInteraccion', {
        idInteraccion: query.idInteraccion,
      });
    }
    if (query.idCliente) {
      qb.andWhere('i.idCliente = :idCliente', {
        idCliente: query.idCliente,
      });
    }
    if (query.estado) {
      qb.andWhere('s.estado = :estado', { estado: query.estado });
    }
    if (query.desde) {
      qb.andWhere('s.fechaProgramada >= :desde', { desde: query.desde });
    }
    if (query.hasta) {
      qb.andWhere('s.fechaProgramada <= :hasta', { hasta: query.hasta });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Seguimiento> {
    const seguimiento = await this.seguimientosRepository.findOne({
      where: { idSeguimientoCrm: id },
      relations: ['interaccion'],
    });

    if (!seguimiento) {
      throw new NotFoundException(`Seguimiento ${id} no encontrado`);
    }

    return seguimiento;
  }

  /**
   * Cambia el estado solo si es distinto al actual.
   * Así se evita duplicar historial por reintentos idempotentes del cliente.
   */
  async updateEstado(
    id: number,
    dto: UpdateSeguimientoEstadoDto,
  ): Promise<Seguimiento> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Seguimiento);
      const seguimiento = await repository.findOne({
        where: { idSeguimientoCrm: id },
        relations: ['interaccion'],
      });

      if (!seguimiento) {
        throw new NotFoundException(`Seguimiento ${id} no encontrado`);
      }

      if (seguimiento.estado === dto.estado) {
        return seguimiento;
      }

      const estadoAnterior = seguimiento.estado;
      seguimiento.estado = dto.estado;
      const saved = await repository.save(seguimiento);

      await this.historialService.registrar(
        {
          idCliente: seguimiento.interaccion.idCliente,
          fecha: todayInTimeZone(),
          tipoEvento: 'seguimiento_actualizado',
          descripcion: `El seguimiento #${id} cambió de "${estadoAnterior}" a "${dto.estado}"`,
        },
        manager,
      );

      return saved;
    });
  }

  /**
   * Publica el evento después del commit.
   * Un fallo de entrega se registra pero no revierte el seguimiento ya guardado.
   */
  private async publishSeguimientoCreado(
    seguimiento: Seguimiento,
    interaccion: Interaccion,
  ): Promise<void> {
    const event: EventEnvelope = {
      id: randomUUID(),
      source: 'crm',
      type: 'seguimiento.creado',
      occurredAt: new Date().toISOString(),
      version: '1.0',
      payload: {
        idSeguimientoCrm: seguimiento.idSeguimientoCrm,
        idInteraccion: seguimiento.idInteraccion,
        idCliente: interaccion.idCliente,
        idEmpleado: interaccion.idEmpleado,
        fechaProgramada: seguimiento.fechaProgramada,
        accionRequerida: seguimiento.accionRequerida,
        estado: seguimiento.estado,
      },
    };

    try {
      await this.eventPublisher.publish(event, 'facturacion');
    } catch (error) {
      // La transacción ya está confirmada: el negocio sigue aunque el webhook falle.
      this.logger.error(
        `No se pudo publicar seguimiento.creado para #${seguimiento.idSeguimientoCrm}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
