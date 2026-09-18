import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';

@Entity({ name: 'historial_cliente' })
export class Historial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.historial, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column()
  evento: string;

  @Column({ type: 'jsonb', nullable: true })
  detalle: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
