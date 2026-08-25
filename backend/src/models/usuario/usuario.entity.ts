import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users', { schema: 'public' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  public id!: string;

  @Column({ type: 'varchar', length: 100, name: 'username', unique: true, nullable: false })
  public username!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash', nullable: false })
  public passwordHash!: string;

  @Column({ type: 'varchar', length: 20, name: 'role', nullable: false })
  public role!: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  public createdAt!: Date;

  constructor(id?: string, username?: string, passwordHash?: string, role?: string) {
    if (id) this.id = id;
    if (username) this.username = username;
    if (passwordHash) this.passwordHash = passwordHash;
    if (role) this.role = role;
  }
}
