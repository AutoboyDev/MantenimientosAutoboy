import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Inventario } from '../inventario/inventario.entity';

@Entity('mantenimientos', { schema: 'public' })
export class Mantenimiento {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  public id!: string;

  @Column({ type: 'uuid', name: 'id_equipo', nullable: false })
  public idEquipo!: string;

  @Column({ type: 'date', name: 'fecha', nullable: false })
  public fecha!: string | Date;

  @Column({ type: 'varchar', length: 20, name: 'tipo', nullable: false })
  public tipo!: 'PREVENTIVO' | 'CORRECTIVO';

  @Column({ type: 'text', name: 'descripcion', nullable: false })
  public descripcion!: string;

  @Column({ type: 'varchar', length: 100, name: 'realizado_por', nullable: false })
  public realizadoPor!: string;

  @Column({ type: 'text', name: 'observaciones', nullable: true })
  public observaciones?: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  public createdAt!: Date;

  @ManyToOne(() => Inventario, (inventario) => inventario.mantenimientos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_equipo' })
  public equipo?: Inventario;
}
