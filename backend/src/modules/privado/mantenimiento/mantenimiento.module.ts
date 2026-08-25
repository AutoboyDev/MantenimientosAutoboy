import { Module } from '@nestjs/common';
import { MantenimientoController } from './mantenimiento.controller';
import { MantenimientoService } from './mantenimiento.service';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [InventarioModule],
  controllers: [MantenimientoController],
  providers: [MantenimientoService],
  exports: [MantenimientoService]
})
export class MantenimientoModule {}
