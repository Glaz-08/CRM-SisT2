import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Interaccion } from '../../interacciones/entities/interaccion.entity';

@Entity({ name: 'seguimiento_crm' })
export class Seguimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.seguimientos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Interaccion, (interaccion) => interaccion.seguimientos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'interaccion_id' })
  interaccion: Interaccion | null;

  @Column()
  responsable: string;

  @Column({ default: 'pendiente' })
  estado: string;

  @Column({ name: 'programado_para', type: 'timestamptz', nullable: true })
  programadoPara: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
