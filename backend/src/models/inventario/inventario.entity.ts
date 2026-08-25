import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Agencia } from '../agencia/agencia.entity';
import { Mantenimiento } from '../mantenimiento/mantenimiento.entity';

@Entity('inventario', { schema: 'public' })
export class Inventario {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  public id!: string;

  @Column({ type: 'uuid', name: 'id_agencia', nullable: false })
  public idAgencia!: string;

  @Column({ type: 'varchar', length: 50, name: 'no_inventario', nullable: false })
  public noInventario!: string;

  @Column({ type: 'varchar', length: 50, name: 'tipo_equipo', nullable: false })
  public tipoEquipo!: string;

  @Column({ type: 'varchar', length: 50, name: 'marca', nullable: false })
  public marca!: string;

  @Column({ type: 'varchar', length: 50, name: 'referencia', nullable: false })
  public referencia!: string;

  @Column({ type: 'varchar', length: 50, name: 'modelo', nullable: false })
  public modelo!: string;

  @Column({ type: 'varchar', length: 100, name: 'procesador', nullable: true })
  public procesador?: string;

  @Column({ type: 'varchar', length: 100, name: 'disco_duro', nullable: true })
  public discoDuro?: string;

  @Column({ type: 'varchar', length: 50, name: 'memoria_ram', nullable: true })
  public memoriaRam?: string;

  @Column({ type: 'varchar', length: 50, name: 'uni_dvd', nullable: true })
  public uniDvd?: string;

  @Column({ type: 'varchar', length: 100, name: 'serial', nullable: true })
  public serial?: string;

  @Column({ type: 'varchar', length: 100, name: 'area_sucursal', nullable: true })
  public areaSucursal?: string;

  @Column({ type: 'varchar', length: 100, name: 'cargo', nullable: true })
  public cargo?: string;

  @Column({ type: 'varchar', length: 100, name: 'usuario_sucursal', nullable: true })
  public usuarioSucursal?: string;

  @Column({ type: 'varchar', length: 255, name: 'mouse', nullable: true })
  public mouse?: string;

  @Column({ type: 'varchar', length: 255, name: 'teclado', nullable: true })
  public teclado?: string;

  @Column({ type: 'varchar', length: 255, name: 'impresora', nullable: true })
  public impresora?: string;

  @Column({ type: 'varchar', length: 255, name: 'otros', nullable: true })
  public otros?: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  public createdAt!: Date;

  @ManyToOne(() => Agencia, (agencia) => agencia.inventarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_agencia' })
  public agencia?: Agencia;

  @OneToMany(() => Mantenimiento, (mantenimiento) => mantenimiento.equipo)
  public mantenimientos?: Mantenimiento[];
}
