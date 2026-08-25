import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';

@Entity('audit_logs', { schema: 'public' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  public id!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  public userId?: string;

  @Column({ type: 'varchar', length: 10, name: 'action', nullable: false })
  public action!: 'INSERT' | 'UPDATE' | 'DELETE';

  @Column({ type: 'varchar', length: 100, name: 'table_name', nullable: false })
  public tableName!: string;

  @Column({ type: 'uuid', name: 'record_id', nullable: false })
  public recordId!: string;

  @Column({ type: 'jsonb', name: 'old_values', nullable: true })
  public oldValues?: any;

  @Column({ type: 'jsonb', name: 'new_values', nullable: true })
  public newValues?: any;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  public createdAt!: Date;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  public user?: Usuario;
}
