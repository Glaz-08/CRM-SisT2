import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Interaccion } from '../../interacciones/entities/interaccion.entity';
import type { EstadoSeguimiento } from '../seguimiento.constants';

/** Seguimiento asociado a una interacción en `crm.seguimiento_crm`. */
@Entity({ name: 'seguimiento_crm' })
export class Seguimiento {
  @PrimaryGeneratedColumn('identity', { name: 'id_seguimiento_crm' })
  idSeguimientoCrm: number;

  @Column({ name: 'id_interaccion', type: 'integer' })
  idInteraccion: number;

  @ManyToOne(() => Interaccion, (interaccion) => interaccion.seguimientos)
  @JoinColumn({ name: 'id_interaccion' })
  interaccion: Interaccion;

  @Column({ name: 'fecha_programada', type: 'date' })
  fechaProgramada: string;

  @Column({ name: 'accion_requerida', type: 'text' })
  accionRequerida: string;

  @Column({ type: 'text', default: 'pendiente' })
  estado: EstadoSeguimiento;
}
