import { Controller, Delete, Get, HttpException, Param, Post, Put, Req } from '@nestjs/common';
import { UsuarioService } from './usuario.service';

@Controller('private/user')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get('findAll')
  public obtenerUsuarios() {
    return this.usuarioService.consultarUsuarios();
  }

  @Get('findById/:id')
  public obtenerUsuarioPorId(@Param('id') id: string) {
    return this.usuarioService.buscarUsuarioPorId(id);
  }

  @Post('newUser')
  public crearUsuario(@Req() request: any) {
    const userSession = request.user;
    const payload = request.body;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    if (userSession.rol !== 'super_admin') {
      throw new HttpException('Acceso denegado. Solo el rol Super Admin puede registrar nuevos usuarios.', 403);
    }

    return this.usuarioService.nuevoUsuario(payload, userSession.idUsuario);
  }

  @Put('updateUser/:id')
  public actualizarUsuario(@Param('id') id: string, @Req() request: any) {
    const userSession = request.user;
    const payload = request.body;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    if (userSession.rol !== 'super_admin') {
      if (userSession.idUsuario !== id) {
        throw new HttpException('Acceso denegado. Un editor solo puede editar su propio usuario.', 403);
      }
      if (payload.role && payload.role !== userSession.rol) {
        delete payload.role;
      }
    }

    return this.usuarioService.actualizarUsuario(id, payload, userSession.idUsuario);
  }

  @Delete('deleteUser/:id')
  public eliminarUsuario(@Param('id') id: string, @Req() request: any) {
    const userSession = request.user;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    if (userSession.rol !== 'super_admin') {
      throw new HttpException('Acceso denegado. Solo el rol Super Admin puede eliminar usuarios.', 403);
    }

    return this.usuarioService.eliminarUsuario(id, userSession.idUsuario);
  }
}
