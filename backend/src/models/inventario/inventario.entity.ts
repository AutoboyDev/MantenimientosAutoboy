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

  @Column({ type: 'varchar', length: 50, name: 'vida_util', nullable: true })
  public vidaUtil?: string;

  @Column({ type: 'varchar', length: 50, name: 'fecha_compra', nullable: true })
  public fechaCompra?: string;

  @Column({ type: 'varchar', length: 100, name: 'ubicacion', nullable: true })
  public ubicacion?: string;

  @Column({ type: 'varchar', length: 100, name: 'reubicacion', nullable: true })
  public reubicacion?: string;

  @Column({ type: 'varchar', length: 50, name: 'estado', nullable: true, default: 'Activo' })
  public estado?: string;

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

  // Campos específicos de Teléfonos / Celulares
  @Column({ type: 'varchar', length: 100, name: 'imei_1', nullable: true })
  public imei1?: string;

  @Column({ type: 'varchar', length: 100, name: 'imei_2', nullable: true })
  public imei2?: string;

  @Column({ type: 'varchar', length: 50, name: 'numero_linea', nullable: true })
  public numeroLinea?: string;

  @Column({ type: 'varchar', length: 100, name: 'imei_simcard', nullable: true })
  public imeiSimcard?: string;

  @Column({ type: 'varchar', length: 150, name: 'correo', nullable: true })
  public correo?: string;

  @Column({ type: 'varchar', length: 100, name: 'clave_correo', nullable: true })
  public claveCorreo?: string;

  @Column({ type: 'varchar', length: 100, name: 'app_lock', nullable: true })
  public appLock?: string;

  @Column({ type: 'varchar', length: 100, name: 'cargador_marca', nullable: true })
  public cargadorMarca?: string;

  @Column({ type: 'varchar', length: 100, name: 'cargador_serial', nullable: true })
  public cargadorSerial?: string;

  @Column({ type: 'varchar', length: 50, name: 'cargador_fecha_compra', nullable: true })
  public cargadorFechaCompra?: string;

  @Column({ type: 'text', name: 'observaciones', nullable: true })
  public observaciones?: string;

  // Campos para Acta de Entrega (AUT-FOR-15)
  @Column({ type: 'varchar', length: 50, name: 'cedula_usuario', nullable: true })
  public cedulaUsuario?: string;

  @Column({ type: 'varchar', length: 100, name: 'quien_entrega', nullable: true })
  public quienEntrega?: string;

  @Column({ type: 'varchar', length: 100, name: 'responsable_anterior', nullable: true })
  public responsableAnterior?: string;

  @Column({ type: 'varchar', length: 50, name: 'valor_estimado', nullable: true })
  public valorEstimado?: string;

  // Accesorios dinámicos (tipo, codigoActivo, marca, modelo, serial)
  @Column({ type: 'jsonb', name: 'accesorios', nullable: true, default: () => "'[]'" })
  public accesorios?: Array<{ tipo: string; codigoActivo?: string; marca: string; modelo: string; serial: string; }>;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  public createdAt!: Date;

  @ManyToOne(() => Agencia, (agencia) => agencia.inventarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_agencia' })
  public agencia?: Agencia;

  @OneToMany(() => Mantenimiento, (mantenimiento) => mantenimiento.equipo)
  public mantenimientos?: Mantenimiento[];
}
