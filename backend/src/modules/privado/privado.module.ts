import { Module } from '@nestjs/common';
import { UsuarioModule } from './usuario/usuario.module';
import { AgenciaModule } from './agencia/agencia.module';
import { InventarioModule } from './inventario/inventario.module';
import { MantenimientoModule } from './mantenimiento/mantenimiento.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    UsuarioModule,
    AgenciaModule,
    InventarioModule,
    MantenimientoModule,
    AuditModule
  ],
  exports: [
    UsuarioModule,
    AgenciaModule,
    InventarioModule,
    MantenimientoModule,
    AuditModule
  ]
})
export class PrivadoModule {}
