import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Inventario } from '../inventario/inventario.entity';

@Entity('agencias', { schema: 'public' })
export class Agencia {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  public id!: string;

  @Column({ type: 'varchar', length: 100, name: 'nombre', unique: true, nullable: false })
  public nombre!: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  public createdAt!: Date;

  @OneToMany(() => Inventario, (inventario) => inventario.agencia)
  public inventarios?: Inventario[];

  constructor(id?: string, nombre?: string) {
    if (id) this.id = id;
    if (nombre) this.nombre = nombre;
  }
}
