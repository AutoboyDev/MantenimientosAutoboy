import { Module } from '@nestjs/common';
import { AutenticacionModule } from './autenticacion/autenticacion.module';

@Module({
  imports: [AutenticacionModule],
  exports: [AutenticacionModule]
})
export class PublicoModule {}
