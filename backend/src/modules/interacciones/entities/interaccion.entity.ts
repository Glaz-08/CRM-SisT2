import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Seguimiento } from '../../seguimientos/entities/seguimiento.entity';

@Entity({ name: 'interaccion_crm' })
export class Interaccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.interacciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column()
  canal: string;

  @Column()
  motivo: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @OneToMany(() => Seguimiento, (seguimiento) => seguimiento.interaccion)
  seguimientos: Seguimiento[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
