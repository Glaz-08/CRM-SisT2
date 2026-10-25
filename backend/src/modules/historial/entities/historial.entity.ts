import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'crm', name: 'historial_cliente' })
export class Historial {
  @PrimaryGeneratedColumn('identity', { name: 'id_historial' })
  idHistorial: number;

  @Column({ name: 'id_cliente', type: 'integer' })
  idCliente: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: string;

  @Column({ name: 'tipo_evento', type: 'text' })
  tipoEvento: string;

  @Column({ type: 'text' })
  descripcion: string;
}
