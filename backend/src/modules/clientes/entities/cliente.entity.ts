import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Interaccion } from '../../interacciones/entities/interaccion.entity';
import { Seguimiento } from '../../seguimientos/entities/seguimiento.entity';
import { Historial } from '../../historial/entities/historial.entity';

@Entity({ name: 'cliente' })
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  rut: string;

  @Column()
  nombre: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  telefono: string | null;

  @OneToMany(() => Interaccion, (interaccion) => interaccion.cliente)
  interacciones: Interaccion[];

  @OneToMany(() => Seguimiento, (seguimiento) => seguimiento.cliente)
  seguimientos: Seguimiento[];

  @OneToMany(() => Historial, (historial) => historial.cliente)
  historial: Historial[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
