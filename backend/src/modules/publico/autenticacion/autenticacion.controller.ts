import { Controller, Post, Req } from '@nestjs/common';
import { AutenticacionService } from './autenticacion.service';

@Controller('auth')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  @Post('/signIn')
  private iniciarSesion(@Req() request: any) {
    const objUsuario = request.body;
    return this.autenticacionService.inicioSesion(objUsuario);
  }

  @Post('/setupAdmin')
  private registroInicial(@Req() request: any) {
    const objUsuario = request.body;
    return this.autenticacionService.registroInicial(objUsuario);
  }
}
