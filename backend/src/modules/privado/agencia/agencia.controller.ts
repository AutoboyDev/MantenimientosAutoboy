import { Controller, Delete, Get, HttpException, Param, Post, Put, Req } from '@nestjs/common';
import { AgenciaService } from './agencia.service';

@Controller('private/agency')
export class AgenciaController {
  constructor(private readonly agenciaService: AgenciaService) {}

  @Get('findAll')
  public obtenerAgencias() {
    return this.agenciaService.consultarAgencias();
  }

  @Get('findById/:id')
  public obtenerAgenciaPorId(@Param('id') id: string) {
    return this.agenciaService.buscarAgenciaPorId(id);
  }

  @Post('newAgency')
  public crearAgencia(@Req() request: any) {
    const userSession = request.user;
    const payload = request.body;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    return this.agenciaService.nuevaAgencia(payload, userSession.idUsuario);
  }

  @Put('updateAgency/:id')
  public actualizarAgencia(@Param('id') id: string, @Req() request: any) {
    const userSession = request.user;
    const payload = request.body;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    return this.agenciaService.actualizarAgencia(id, payload, userSession.idUsuario);
  }

  @Delete('deleteAgency/:id')
  public eliminarAgencia(@Param('id') id: string, @Req() request: any) {
    const userSession = request.user;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    if (userSession.rol !== 'super_admin') {
      throw new HttpException('Acceso denegado. Solo el rol Super Admin puede eliminar agencias.', 403);
    }

    return this.agenciaService.eliminarAgencia(id, userSession.idUsuario);
  }
}
