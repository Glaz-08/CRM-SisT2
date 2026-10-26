import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Seguimiento } from '../../seguimientos/entities/seguimiento.entity';

/**
 * Interacción comercial almacenada en `crm.interaccion_crm`.
 * Las claves de cliente/empleado son lógicas: apuntan a maestros externos.
 */
@Entity({ name: 'interaccion_crm' })
export class Interaccion {
  @PrimaryGeneratedColumn('identity', { name: 'id_interaccion' })
  idInteraccion: number;

  @Column({ name: 'id_cliente', type: 'integer' })
  idCliente: number;

  @Column({ name: 'id_empleado', type: 'integer' })
  idEmpleado: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: string;

  @Column({ type: 'text' })
  canal: string;

  @Column({ type: 'text' })
  detalle: string;

  @OneToMany(() => Seguimiento, (seguimiento) => seguimiento.interaccion)
  seguimientos: Seguimiento[];
}
